
import React, { useState, useRef } from 'react';
import { supabase } from '../services/supabase';
import type { Article, Color } from '../types';
import { processImage, validateImageFile, formatFileSize } from '../utils/imageUtils';
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
    const [newArticleNumber, setNewArticleNumber] = useState('');
    const [newArticleName, setNewArticleName] = useState('');
    const [newArticleCategory, setNewArticleCategory] = useState<'shirts' | 'jeans' | 'trousers'>('shirts');
    const [uploading, setUploading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [colors, setColors] = useState<Color[]>([]);
    const [loadingColors, setLoadingColors] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
        if (!newArticleNumber.trim()) {
            setError('Article number is required');
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
                        article_number: newArticleNumber.trim(),
                        name: newArticleName.trim() || null,
                        category: newArticleCategory
                    }
                ])
                .select()
                .single();

            if (error) {
                if (error.code === '23505') {
                    setError('Article number already exists');
                } else {
                    setError(`Failed to add article: ${error.message}`);
                }
            } else {
                setSuccess('Article added successfully!');
                setNewArticleNumber('');
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

        // Check file size (max 50MB before compression)
        const maxSizeMB = 50;
        if (file.size / (1024 * 1024) > maxSizeMB) {
            setError(`File size exceeds ${maxSizeMB}MB. Please choose a smaller image.`);
            return;
        }

        setUploading(true);
        setProcessing(true);
        setError(null);
        setUploadProgress(0);

        try {
            // Step 1: Process image (convert HEIC and compress)
            setUploadProgress(25);
            const processedFile = await processImage(file, {
                maxSizeMB: 2,
                maxWidthOrHeight: 1920,
                useWebWorker: true
            });

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
                throw new Error(`Upload failed: ${uploadError.message}`);
            }

            setUploadProgress(75);

            // Step 4: Get public URL
            const { data: urlData } = supabase.storage
                .from('product-colors')
                .getPublicUrl(filePath);

            if (!urlData) {
                throw new Error('Failed to get public URL');
            }

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
                throw new Error(`Database error: ${dbError.message}`);
            }

            setUploadProgress(100);
            setSuccess(`Successfully uploaded ${processedFile.name}!`);
            
            // Refresh colors list
            await fetchColors(selectedArticle.id);
        } catch (err) {
            console.error('Upload error:', err);
            setError(err instanceof Error ? err.message : 'Failed to upload image');
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input
                        type="text"
                        placeholder="Article Number *"
                        value={newArticleNumber}
                        onChange={(e) => setNewArticleNumber(e.target.value)}
                        className="px-4 py-2 bg-gray-900/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <input
                        type="text"
                        placeholder="Article Name (optional)"
                        value={newArticleName}
                        onChange={(e) => setNewArticleName(e.target.value)}
                        className="px-4 py-2 bg-gray-900/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <select
                        value={newArticleCategory}
                        onChange={(e) => setNewArticleCategory(e.target.value as 'shirts' | 'jeans' | 'trousers')}
                        className="px-4 py-2 bg-gray-900/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="shirts">Shirts</option>
                        <option value="jeans">Jeans</option>
                        <option value="trousers">Trousers</option>
                    </select>
                    <button
                        onClick={handleAddArticle}
                        disabled={processing || !newArticleNumber.trim()}
                        className="px-6 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
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
                <h2 className="text-xl font-bold text-white mb-4">Articles ({articles.length})</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {articles.map((article) => (
                        <button
                            key={article.id}
                            onClick={() => handleArticleSelect(article)}
                            className={`p-4 bg-gradient-to-br from-gray-900/50 to-gray-800/50 rounded-xl border transition-all duration-300 transform hover:scale-105 ${
                                selectedArticle?.id === article.id
                                    ? 'border-purple-500 bg-purple-900/20'
                                    : 'border-purple-500/20 hover:border-purple-500/40'
                            }`}
                        >
                            <div className="font-mono text-center text-white">{article.article_number}</div>
                            <div className="text-xs text-gray-400 mt-1 capitalize">{article.category || 'shirts'}</div>
                        </button>
                    ))}
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
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-xs text-white">
                                            {formatFileSize(0)} {/* Could track file size if needed */}
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

