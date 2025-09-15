
import React from 'react';
import type { Article } from '../types';

interface ArticleGridProps {
    articles: Article[];
    onArticleSelect: (article: Article) => void;
}

const ArticleGrid: React.FC<ArticleGridProps> = ({ articles, onArticleSelect }) => {
    if (articles.length === 0) {
        return (
            <div className="text-center py-10">
                <p className="text-gray-400">No articles found.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {articles.map((article) => (
                <button
                    key={article.id}
                    onClick={() => onArticleSelect(article)}
                    className="group relative aspect-w-1 aspect-h-1 flex items-center justify-center p-4 bg-gradient-to-br from-gray-800/80 to-gray-700/80 rounded-xl shadow-lg hover:shadow-2xl border border-purple-500/20 hover:border-purple-400/40 transition-all duration-300 transform hover:-translate-y-2 focus:outline-none focus:ring-4 focus:ring-purple-500/25 backdrop-blur-sm overflow-hidden"
                >
                    {/* Animated background gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
                    
                    <span className="font-mono text-lg text-center text-gray-200 group-hover:text-white transition-colors duration-300 relative z-10">
                        {article.article_number}
                    </span>
                    
                    {/* Subtle shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                </button>
            ))}
        </div>
    );
};

export default ArticleGrid;
