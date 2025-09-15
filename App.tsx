
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './services/supabase';
import type { Article } from './types';
import { useSearch } from './hooks/useSearch';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import ArticleGrid from './components/ArticleGrid';
import ColorGalleryModal from './components/ColorGalleryModal';
import AdminPanel from './components/AdminPanel';
import Spinner from './components/Spinner';

const App: React.FC = () => {
    const [articles, setArticles] = useState<Article[]>([]);
    const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
    const [isAdminView, setIsAdminView] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Use the search hook to eliminate code duplication
    const { filteredArticles, handleSearch } = useSearch(articles);

    const fetchArticles = useCallback(async () => {
        setLoading(true);
        setError(null);
        const { data, error } = await supabase
            .from('articles')
            .select('*')
            .order('article_number', { ascending: true });

        if (error) {
            setError(`Failed to fetch articles: ${error.message}. Make sure your Supabase tables are set up correctly.`);
            console.error('Error fetching articles:', error);
        } else {
            setArticles(data || []);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchArticles();
    }, [fetchArticles]);


    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-gray-100 relative">
            
            <Header
                isAdminView={isAdminView}
                onToggleAdminView={() => setIsAdminView(!isAdminView)}
            />

            <main className="container mx-auto p-4 md:p-8 relative z-10">
                {isAdminView ? (
                    <AdminPanel articles={articles} refreshArticles={fetchArticles} />
                ) : (
                    <>
                        <div className="text-center mb-8">
                            <h1 className="text-4xl md:text-6xl font-bold text-white">
                                Product Color Viewer
                            </h1>
                            <p className="mt-4 text-lg text-gray-300 bg-gradient-to-r from-gray-300 to-gray-500 bg-clip-text text-transparent">
                                Find any product by its article number to see all available colors.
                            </p>
                            <div className="mt-4 w-24 h-1 bg-gradient-to-r from-purple-500 to-cyan-500 mx-auto rounded-full"></div>
                        </div>

                        <SearchBar onSearch={handleSearch} />

                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <Spinner />
                            </div>
                        ) : error ? (
                             <div className="text-center my-10 p-4 bg-red-900/50 border border-red-600 rounded-lg">
                                <p className="font-bold text-red-300">An Error Occurred</p>
                                <p className="text-red-400">{error}</p>
                            </div>
                        ) : (
                            <ArticleGrid
                                articles={filteredArticles}
                                onArticleSelect={setSelectedArticle}
                            />
                        )}
                    </>
                )}
            </main>

            {selectedArticle && (
                <ColorGalleryModal
                    article={selectedArticle}
                    onClose={() => setSelectedArticle(null)}
                />
            )}
        </div>
    );
};

export default App;
