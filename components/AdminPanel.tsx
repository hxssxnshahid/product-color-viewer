
import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../services/supabase';
import type { Article, Color } from '../types';
import { useSearch } from '../hooks/useSearch';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';
import UploadIcon from './icons/UploadIcon';
import Spinner from './Spinner';

interface AdminPanelProps {
    articles: Article[];
    refreshArticles: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ articles, refreshArticles }) => {
    const [newArticleNumber, setNewArticleNumber] = useState('');
    const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
    const [colors, setColors] = useState<Color[]>([]);
    const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [newArticleCategory, setNewArticleCategory] = useState<'shirts' | 'jeans' | 'trousers'>('shirts');
    const [adminCategoryFilter, setAdminCategoryFilter] = useState<'all' | 'shirts' | 'jeans' | 'trousers'>('all');
    
    // Use the search hook to eliminate code duplication
    const { searchQuery, filteredArticles, handleSearch } = useSearch(articles);
    
    // Apply category filter to search results
    const adminFilteredArticles = filteredArticles.filter(article => {
        if (adminCategoryFilter === 'all') return true;
        return (article.category ?? 'shirts') === adminCategoryFilter;
    });

    useEffect(() => {
        if (selectedArticle) {
            fetchColors(selectedArticle.id);
        } else {
            setColors([]);
        }
    }, [selectedArticle]);

    
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({ type, message });
    };

    const fetchColors = async (articleId: number) => {
        setLoading(prev => ({...prev, colors: true}));
        const { data, error } = await supabase
            .from('colors')
            .select('*')
            .eq('article_id', articleId)
            .order('created_at', { ascending: false });
        if (error) {
            showNotification('error', `Failed to fetch colors: ${error.message}`);
        } else {
            setColors(data || []);
        }
        setLoading(prev => ({...prev, colors: false}));
    };

    const handleAddArticle = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newArticleNumber.trim()) return;
        setLoading(prev => ({...prev, addArticle: true}));
        const { error } = await supabase.from('articles').insert({ 
            article_number: newArticleNumber.trim(),
            category: newArticleCategory
        });
        if (error) {
            showNotification('error', `Failed to add article: ${error.message}`);
        } else {
            showNotification('success', `Article "${newArticleNumber}" added successfully.`);
            setNewArticleNumber('');
            setNewArticleCategory('shirts');
            refreshArticles();
        }
        setLoading(prev => ({...prev, addArticle: false}));
    };
    
    const handleDeleteArticle = async (articleId: number) => {
        if (!window.confirm("Are you sure? This will delete the article and all its colors permanently.")) return;
        setLoading(prev => ({...prev, [`deleteArticle-${articleId}`]: true}));
        // 1. Get color storage paths to delete from storage
        const { data: colorsToDelete, error: fetchError } = await supabase.from('colors').select('storage_path').eq('article_id', articleId);
        if (fetchError) {
             showNotification('error', `Could not fetch colors to delete: ${fetchError.message}`);
             setLoading(prev => ({...prev, [`deleteArticle-${articleId}`]: false}));
             return;
        }

        // 2. Delete images from storage
        if(colorsToDelete && colorsToDelete.length > 0) {
            const paths = colorsToDelete.map(c => c.storage_path);
            const { error: storageError } = await supabase.storage.from('product-colors').remove(paths);
            if(storageError) {
                showNotification('error', `Could not delete images from storage: ${storageError.message}`);
                // Continue to delete DB records anyway
            }
        }
        
        // 3. Delete article (and colors via cascade) from database
        const { error: deleteError } = await supabase.from('articles').delete().eq('id', articleId);
        if (deleteError) {
            showNotification('error', `Failed to delete article: ${deleteError.message}`);
        } else {
            showNotification('success', 'Article deleted successfully.');
            if (selectedArticle?.id === articleId) setSelectedArticle(null);
            refreshArticles();
        }
        setLoading(prev => ({...prev, [`deleteArticle-${articleId}`]: false}));
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !selectedArticle) return;
        const file = e.target.files[0];
        const fileName = `${selectedArticle.article_number}-${Date.now()}`;
        
        setLoading(prev => ({...prev, upload: true}));
        const { error: uploadError } = await supabase.storage.from('product-colors').upload(fileName, file);

        if (uploadError) {
            showNotification('error', `Upload failed: ${uploadError.message}`);
            setLoading(prev => ({...prev, upload: false}));
            return;
        }

        const { data: { publicUrl } } = supabase.storage.from('product-colors').getPublicUrl(fileName);

        const { error: insertError } = await supabase.from('colors').insert({
            article_id: selectedArticle.id,
            image_url: publicUrl,
            storage_path: fileName
        });
        
        if (insertError) {
            showNotification('error', `Failed to save color info: ${insertError.message}`);
        } else {
            showNotification('success', 'Color added successfully.');
            fetchColors(selectedArticle.id);
        }
        setLoading(prev => ({...prev, upload: false}));
        if(fileInputRef.current) fileInputRef.current.value = "";
    };
    
    const handleDeleteColor = async (color: Color) => {
        if (!window.confirm("Are you sure you want to delete this color?")) return;
        setLoading(prev => ({...prev, [`deleteColor-${color.id}`]: true}));
        const { error: storageError } = await supabase.storage.from('product-colors').remove([color.storage_path]);
        if (storageError) {
            showNotification('error', `Storage deletion failed: ${storageError.message}`);
        }
        
        const { error: dbError } = await supabase.from('colors').delete().eq('id', color.id);
        if (dbError) {
            showNotification('error', `Database deletion failed: ${dbError.message}`);
        } else {
            showNotification('success', 'Color deleted.');
            setColors(colors.filter(c => c.id !== color.id));
        }
        setLoading(prev => ({...prev, [`deleteColor-${color.id}`]: false}));
    };


    return (
        <div className="space-y-8">
            {notification && (
                 <div className={`p-4 rounded-md ${notification.type === 'success' ? 'bg-green-900/70 text-green-200' : 'bg-red-900/70 text-red-200'}`}>
                    {notification.message}
                </div>
            )}
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-700/80 p-6 rounded-xl border border-purple-500/30 shadow-lg backdrop-blur-sm">
                <h2 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">Add New Article</h2>
                <form onSubmit={handleAddArticle} className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
                    <input
                        type="text"
                        value={newArticleNumber}
                        onChange={(e) => setNewArticleNumber(e.target.value)}
                        placeholder="Enter new article number"
                        className="flex-grow px-4 py-3 bg-gradient-to-r from-gray-700/80 to-gray-600/80 border border-purple-500/30 rounded-lg focus:outline-none focus:ring-4 focus:ring-purple-500/25 focus:border-purple-400 transition-all duration-300 text-white placeholder-gray-400 backdrop-blur-sm"
                    />
                    <select
                        value={newArticleCategory}
                        onChange={(e) => setNewArticleCategory(e.target.value as 'shirts' | 'jeans' | 'trousers')}
                        className="px-4 py-3 bg-gray-100 text-gray-900 border border-purple-500/40 rounded-lg focus:outline-none focus:ring-4 focus:ring-purple-500/25 focus:border-purple-400 transition-all duration-300"
                    >
                        <option value="shirts">Shirts</option>
                        <option value="jeans">Jeans</option>
                        <option value="trousers">Trousers</option>
                    </select>
                    <button type="submit" disabled={loading['addArticle']} className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg hover:from-purple-700 hover:to-cyan-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg">
                        {loading['addArticle'] ? <Spinner small /> : <PlusIcon />}<span className="ml-2">Add</span>
                    </button>
                </form>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-1 bg-gradient-to-br from-gray-800/80 to-gray-700/80 p-6 rounded-xl border border-purple-500/30 shadow-lg backdrop-blur-sm">
                    <h2 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">Manage Articles</h2>
                    <div className="mb-4 space-y-3">
                        <select
                            value={adminCategoryFilter}
                            onChange={(e) => setAdminCategoryFilter(e.target.value as 'all' | 'shirts' | 'jeans' | 'trousers')}
                            className="w-full px-4 py-3 bg-gray-100 text-gray-900 border border-purple-500/40 rounded-lg focus:outline-none focus:ring-4 focus:ring-purple-500/25 focus:border-purple-400 transition-all duration-300 text-sm"
                        >
                            <option value="all">All Categories</option>
                            <option value="shirts">Shirts</option>
                            <option value="jeans">Jeans</option>
                            <option value="trousers">Trousers</option>
                        </select>
                        <input
                            type="text"
                            placeholder="Search articles..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="w-full px-4 py-3 bg-gradient-to-r from-gray-700/80 to-gray-600/80 border border-purple-500/30 rounded-lg focus:outline-none focus:ring-4 focus:ring-purple-500/25 focus:border-purple-400 transition-all duration-300 text-white placeholder-gray-400 backdrop-blur-sm text-sm"
                        />
                    </div>
                    <ul className="space-y-2 max-h-96 overflow-y-auto">
                       {adminFilteredArticles.map(article => (
                           <li key={article.id} className={`group relative flex items-center p-3 rounded-lg transition-all duration-300 cursor-pointer ${selectedArticle?.id === article.id ? 'bg-gradient-to-r from-purple-900/50 to-cyan-900/50 border border-purple-500/30' : 'hover:bg-gradient-to-r hover:from-gray-700/50 hover:to-gray-600/50 border border-transparent'}`}>
                               <button 
                                   onClick={() => setSelectedArticle(article)} 
                                   className="text-left flex-grow font-mono pr-8"
                               >
                                   {article.article_number}
                               </button>
                               <button 
                                   onClick={(e) => {
                                       e.stopPropagation();
                                       handleDeleteArticle(article.id);
                                   }} 
                                   disabled={loading[`deleteArticle-${article.id}`]} 
                                   className="absolute right-2 p-2 rounded-full hover:bg-red-500/20 text-red-400 disabled:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
                               >
                                   {loading[`deleteArticle-${article.id}`] ? <Spinner small /> : <TrashIcon />}
                               </button>
                           </li>
                       ))}
                    </ul>
                </div>

                <div className="md:col-span-2 bg-gradient-to-br from-gray-800/80 to-gray-700/80 p-6 rounded-xl border border-purple-500/30 shadow-lg backdrop-blur-sm">
                    <h2 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
                        {selectedArticle ? `Manage Colors for ${selectedArticle.article_number}` : 'Select an Article'}
                    </h2>
                    {selectedArticle ? (
                        <div>
                             <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-gray-300">Category:</span>
                                    <select
                                        value={(selectedArticle.category ?? 'shirts')}
                                        onChange={async (e) => {
                                            const newCat = e.target.value as 'shirts' | 'jeans' | 'trousers';
                                            setLoading(prev => ({...prev, updateCategory: true}));
                                            const { error } = await supabase.from('articles').update({ category: newCat }).eq('id', selectedArticle.id);
                                            if (error) {
                                                showNotification('error', `Failed to update category: ${error.message}`);
                                            } else {
                                                showNotification('success', 'Category updated.');
                                                setSelectedArticle({ ...selectedArticle, category: newCat });
                                                refreshArticles();
                                            }
                                            setLoading(prev => ({...prev, updateCategory: false}));
                                        }}
                                        disabled={loading['updateCategory']}
                                        className="px-3 py-2 bg-gray-100 text-gray-900 border border-purple-500/40 rounded-lg focus:outline-none focus:ring-4 focus:ring-purple-500/25 focus:border-purple-400 transition-all duration-300"
                                    >
                                        <option value="shirts">Shirts</option>
                                        <option value="jeans">Jeans</option>
                                        <option value="trousers">Trousers</option>
                                    </select>
                                </div>
                             </div>
                             <div className="mb-4">
                                <label htmlFor="color-upload" className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-600/80 to-cyan-600/80 text-white rounded-lg cursor-pointer hover:from-purple-700/80 hover:to-cyan-700/80 transition-all duration-300 transform hover:scale-105 shadow-lg backdrop-blur-sm border border-purple-500/30">
                                    {loading['upload'] ? <Spinner small /> : <UploadIcon />}
                                    <span>{loading['upload'] ? 'Uploading...' : 'Upload New Color'}</span>
                                </label>
                                <input id="color-upload" type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} className="hidden" disabled={loading['upload']} />
                             </div>
                             {loading['colors'] ? <div className="flex justify-center"><Spinner/></div> : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {colors.map(color => (
                                        <div key={color.id} className="relative group aspect-w-1 aspect-h-1 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                                            <img src={color.image_url} alt="color" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"/>
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                                                <button 
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleDeleteColor(color);
                                                    }} 
                                                    disabled={loading[`deleteColor-${color.id}`]} 
                                                    className="p-3 bg-gradient-to-r from-red-600 to-red-700 rounded-full hover:from-red-700 hover:to-red-800 disabled:from-gray-600 disabled:to-gray-700 transition-all duration-300 transform hover:scale-110 shadow-lg pointer-events-auto z-10"
                                                >
                                                    {loading[`deleteColor-${color.id}`] ? <Spinner small/> : <TrashIcon />}
                                                </button>
                                            </div>
                                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                                        </div>
                                    ))}
                                </div>
                             )}
                             {colors.length === 0 && !loading['colors'] && <p className="text-gray-400 text-center mt-4">No colors uploaded for this article yet.</p>}
                        </div>
                    ) : (
                        <p className="text-gray-400">Please select an article from the list to manage its colors.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
