
import React, { useState, useRef } from 'react';
import { supabase } from '../services/supabase';
import type { Article, Color } from '../types';
import { processImage, validateImageFile } from '../utils/imageUtils';
import Spinner from './Spinner';
import UploadIcon from './icons/UploadIcon';
import TrashIcon from './icons/TrashIcon';
import PlusIcon from './icons/PlusIcon';

interface AdminPanelProps {
    articles: Article[];
    refreshArticles: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ articles, refreshArticles }) => {
    const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
    const [newArticleName, setNewArticleName] = useState('');
    const [newArticleCategory, setNewArticleCategory] = useState<'shirts' | 'jeans' | 'trousers'>('shirts');
    const [uploading, setUploading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [colors, setColors] = useState<Color[]>([]);
    const [loadingColors, setLoadingColors] = useState(false);
    const [articleSearchQuery, setArticleSearchQuery] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Filter articles based on search query
    const filteredArticles = articles.filter(article => {
        if (!articleSearchQuery.trim()) return true;
        const query = articleSearchQuery.toLowerCase();
        return article.article_number.toLowerCase().includes(query);
    });

    const fetchColors = async (articleId: number) => {
        setLoadingColors(true);
        const { data, error } = await supabase
            .from('colors')
            .select('*')
            .eq('article_id', articleId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching colors:', error);
        } else {
            setColors(data || []);
        }
        setLoadingColors(false);
    };

    const handleArticleSelect = (article: Article) => {
        setSelectedArticle(article);
        fetchColors(article.id);
        setError(null);
        setSuccess(null);
    };

    const handleAddArticle = async () => {
        if (!newArticleName.trim()) {
            setError('Article name is required');
            return;
        }

        setError(null);
        setSuccess(null);
        setProcessing(true);

        try {
            const { data, error } = await supabase
                .from('articles')
                .insert([
                    {
                        article_number: newArticleName.trim(),
                        category: newArticleCategory
                    }
                ])
                .select()
                .single();

            if (error) {
                if (error.code === '23505') {
                    setError('Article name already exists');
                } else {
                    setError(`Failed to add article: ${error.message}`);
                }
            } else {
                setSuccess('Article added successfully!');
                setNewArticleName('');
                setNewArticleCategory('shirts');
                refreshArticles();
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setProcessing(false);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || !selectedArticle) return;

        setError(null);
        setSuccess(null);

        try {
            for (let i = 0; i < files.length; i++) {
                await uploadImage(files[i]);
            }
        } catch (err) {
            console.error('Upload error:', err);
        }

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const uploadImage = async (file: File) => {
        if (!selectedArticle) return;

        // Validate file
        if (!validateImageFile(file)) {
            setError('Invalid file type. Please upload JPEG, PNG, WebP, or HEIC images.');
            return;
        }

        // Detect if mobile device
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        // Check file size (more restrictive on mobile)
        const maxSizeMB = isMobile ? 30 : 50;
        const fileSizeMB = file.size / (1024 * 1024);
        
        if (fileSizeMB > maxSizeMB) {
            setError(`File size (${fileSizeMB.toFixed(1)}MB) exceeds ${maxSizeMB}MB limit. Please choose a smaller image.`);
            return;
        }

        // Warn about large HEIC files on mobile
        const isHeic = /\.(heic|heif)$/i.test(file.name);
        if (isHeic && isMobile && fileSizeMB > 10) {
            console.warn('Large HEIC file detected on mobile device. This may take longer to process.');
        }

        setUploading(true);
        setProcessing(true);
        setError(null);
        setUploadProgress(0);

        try {
            // Step 1: Process image (convert HEIC and compress)
            setUploadProgress(10);
            console.log('Starting image processing for:', file.name, 'Size:', file.size, 'bytes');
            console.log('Device type:', isMobile ? 'Mobile' : 'Desktop');
            
            // Add timeout for processing (60 seconds)
            const processingPromise = processImage(file, {
                maxSizeMB: isMobile ? 1 : 2,
                maxWidthOrHeight: isMobile ? 1400 : 1920,
                useWebWorker: !isMobile // Disable web worker on mobile to avoid issues
            });
            
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Image processing timed out. Please try a smaller image or different format.')), 60000);
            });
            
            const processedFile = await Promise.race([processingPromise, timeoutPromise]) as File;
            console.log('Image processed successfully:', processedFile.name, 'New size:', processedFile.size, 'bytes');
            
            setUploadProgress(40);

            // Step 2: Create unique file path
            const timestamp = Date.now();
            const randomId = Math.random().toString(36).substring(7);
            const fileExt = processedFile.name.split('.').pop();
            const fileName = `${selectedArticle.article_number}_${timestamp}_${randomId}.${fileExt}`;
            const filePath = `${selectedArticle.id}/${fileName}`;

            setUploadProgress(50);

            // Step 3: Upload to Supabase storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('product-colors')
                .upload(filePath, processedFile, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                console.error('Upload error:', uploadError);
                throw new Error(`Upload failed: ${uploadError.message}`);
            }

            setUploadProgress(70);

            setUploadProgress(80);

            // Step 4: Get public URL
            const { data: urlData } = supabase.storage
                .from('product-colors')
                .getPublicUrl(filePath);

            if (!urlData) {
                throw new Error('Failed to get public URL');
            }

            setUploadProgress(90);

            // Step 5: Save to database
            const { error: dbError } = await supabase
                .from('colors')
                .insert([
                    {
                        article_id: selectedArticle.id,
                        image_url: urlData.publicUrl,
                        storage_path: filePath
                    }
                ]);

            if (dbError) {
                console.error('Database error:', dbError);
                throw new Error(`Database error: ${dbError.message}`);
            }

            setUploadProgress(100);
            setSuccess(`Successfully uploaded ${processedFile.name}!`);
            
            // Refresh colors list
            await fetchColors(selectedArticle.id);
        } catch (err) {
            console.error('Upload error details:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to upload image';
            console.error('Error message:', errorMessage);
            setError(errorMessage);
        } finally {
            setUploading(false);
            setProcessing(false);
            setUploadProgress(0);
        }
    };

    const handleDeleteColor = async (color: Color) => {
        if (!window.confirm('Are you sure you want to delete this color?')) {
            return;
        }

        setError(null);
        setSuccess(null);

        try {
            // Delete from storage
            const { error: storageError } = await supabase.storage
                .from('product-colors')
                .remove([color.storage_path]);

            if (storageError) {
                console.error('Storage delete error:', storageError);
                // Continue with database deletion even if storage fails
            }

            // Delete from database (CASCADE will handle this)
            const { error: dbError } = await supabase
                .from('colors')
                .delete()
                .eq('id', color.id);

            if (dbError) {
                throw new Error(`Failed to delete: ${dbError.message}`);
            }

            setSuccess('Color deleted successfully!');
            
            // Refresh colors list
            if (selectedArticle) {
                await fetchColors(selectedArticle.id);
            }
        } catch (err) {
            console.error('Delete error:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete color');
        }
    };

    const handleDeleteArticle = async (article: Article) => {
        if (!window.confirm(`Are you sure you want to delete article "${article.article_number}"? This will also delete all its colors permanently.`)) {
            return;
        }

        setError(null);
        setSuccess(null);
        setProcessing(true);

        try {
            // First, get all colors for this article to delete from storage
            const { data: articleColors } = await supabase
                .from('colors')
                .select('storage_path')
                .eq('article_id', article.id);

            // Delete from storage
            if (articleColors && articleColors.length > 0) {
                const paths = articleColors.map(c => c.storage_path);
                const { error: storageError } = await supabase.storage
                    .from('product-colors')
                    .remove(paths);

                if (storageError) {
                    console.error('Storage delete error:', storageError);
                    // Continue with database deletion
                }
            }

            // Delete article (CASCADE will delete colors from DB)
            const { error: dbError } = await supabase
                .from('articles')
                .delete()
                .eq('id', article.id);

            if (dbError) {
                throw new Error(`Failed to delete article: ${dbError.message}`);
            }

            setSuccess('Article and its colors deleted successfully!');
            
            // Clear selected article if it was deleted
            if (selectedArticle?.id === article.id) {
                setSelectedArticle(null);
                setColors([]);
            }
            
            // Refresh articles list
            refreshArticles();
        } catch (err) {
            console.error('Delete article error:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete article');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                    Admin Panel
                </h1>
                <p className="text-gray-400">
                    Manage articles and upload product color images
                </p>
            </div>

            {/* Add New Article Form */}
            <div className="bg-gradient-to-br from-gray-800/90 to-gray-700/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-purple-500/30 p-6 mb-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <PlusIcon />
                    Add New Article
                </h2>
                <div className="flex flex-col sm:flex-row gap-4">
                    <input
                        type="text"
                        placeholder="Article Name *"
                        value={newArticleName}
                        onChange={(e) => setNewArticleName(e.target.value)}
                        className="flex-1 px-4 py-3 bg-gray-900/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <select
                        value={newArticleCategory}
                        onChange={(e) => setNewArticleCategory(e.target.value as 'shirts' | 'jeans' | 'trousers')}
                        className="w-full sm:w-48 px-4 py-3 bg-gray-900/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="shirts">Shirts</option>
                        <option value="jeans">Jeans</option>
                        <option value="trousers">Trousers</option>
                    </select>
                    <button
                        onClick={handleAddArticle}
                        disabled={processing || !newArticleName.trim()}
                        className="px-8 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
                    >
                        {processing ? <Spinner small /> : <PlusIcon />}
                        Add Article
                    </button>
                </div>
            </div>

            {/* Messages */}
            {(error || success) && (
                <div className={`mb-6 p-4 rounded-lg border ${
                    error ? 'bg-red-900/50 border-red-600/50' : 'bg-green-900/50 border-green-600/50'
                }`}>
                    <p className={error ? 'text-red-300' : 'text-green-300'}>
                        {error || success}
                    </p>
                </div>
            )}

            {/* Articles List */}
            <div className="bg-gradient-to-br from-gray-800/90 to-gray-700/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-purple-500/30 p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white">
                        Articles ({filteredArticles.length}{articleSearchQuery && ` of ${articles.length}`})
                    </h2>
                </div>
                
                {/* Search Input */}
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Search articles..."
                        value={articleSearchQuery}
                        onChange={(e) => setArticleSearchQuery(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-900/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {filteredArticles.length === 0 ? (
                        <div className="col-span-full text-center py-8 text-gray-400">
                            {articleSearchQuery ? 'No articles found matching your search.' : 'No articles yet.'}
                        </div>
                    ) : (
                        filteredArticles.map((article) => (
                            <div
                                key={article.id}
                                className={`relative group p-4 bg-gradient-to-br from-gray-900/50 to-gray-800/50 rounded-xl border transition-all duration-300 ${
                                    selectedArticle?.id === article.id
                                        ? 'border-purple-500 bg-purple-900/20'
                                        : 'border-purple-500/20 hover:border-purple-500/40'
                                }`}
                            >
                                <button
                                    onClick={() => handleArticleSelect(article)}
                                    className="w-full text-center"
                                >
                                    <div className="font-mono text-white">{article.article_number}</div>
                                    <div className="text-xs text-gray-400 mt-1 capitalize">{article.category || 'shirts'}</div>
                                </button>
                                
                                {/* Delete button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteArticle(article);
                                    }}
                                    className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                    title="Delete article"
                                >
                                    <TrashIcon />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Upload Section for Selected Article */}
            {selectedArticle && (
                <div className="bg-gradient-to-br from-gray-800/90 to-gray-700/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-purple-500/30 p-6">
                    <h2 className="text-xl font-bold text-white mb-4">
                        Upload Colors for Article: <span className="font-mono text-purple-400">{selectedArticle.article_number}</span>
                    </h2>
                    
                    {/* Upload Form */}
                    <div className="mb-6">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
                            multiple
                            onChange={handleFileSelect}
                            className="hidden"
                            id="color-upload"
                            disabled={uploading}
                        />
                        <label
                            htmlFor="color-upload"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 disabled:from-gray-600 disabled:to-gray-700 rounded-lg text-white font-medium cursor-pointer transition-all duration-300 transform hover:scale-105 disabled:cursor-not-allowed"
                        >
                            {uploading ? <Spinner small /> : <UploadIcon />}
                            {uploading ? 'Processing...' : 'Upload Color Images'}
                        </label>
                        <p className="mt-2 text-sm text-gray-400">
                            Supports JPEG, PNG, WebP, and HEIC formats. HEIC images will be automatically converted to JPEG and compressed.
                        </p>
                    </div>

                    {/* Upload Progress */}
                    {processing && uploadProgress > 0 && (
                        <div className="mb-4">
                            <div className="w-full bg-gray-700 rounded-full h-2.5">
                                <div
                                    className="bg-gradient-to-r from-purple-600 to-cyan-600 h-2.5 rounded-full transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                            <p className="text-sm text-gray-400 mt-1">Uploading... {uploadProgress}%</p>
                        </div>
                    )}

                    {/* Colors Grid */}
                    <div className="mt-6">
                        <h3 className="text-lg font-bold text-white mb-4">Existing Colors ({colors.length})</h3>
                        {loadingColors ? (
                            <div className="text-center py-8">
                                <Spinner />
                            </div>
                        ) : colors.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {colors.map((color) => (
                                    <div
                                        key={color.id}
                                        className="relative group aspect-square rounded-xl overflow-hidden border border-purple-500/20 hover:border-red-500/50 transition-all duration-300"
                                    >
                                        <img
                                            src={color.image_url}
                                            alt={`Color ${color.id}`}
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            onClick={() => handleDeleteColor(color)}
                                            className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                            title="Delete"
                                        >
                                            <TrashIcon />
                                        </button>
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-xs text-white text-center">
                                            Click to Delete
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-400">
                                No colors uploaded yet
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;

