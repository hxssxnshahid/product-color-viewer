
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import type { Article, Color } from '../types';
import Spinner from './Spinner';
import CloseIcon from './icons/CloseIcon';

interface ColorGalleryModalProps {
    article: Article;
    onClose: () => void;
}

const ColorGalleryModal: React.FC<ColorGalleryModalProps> = ({ article, onClose }) => {
    const [colors, setColors] = useState<Color[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchColors = async () => {
            setLoading(true);
            setError(null);
            const { data, error } = await supabase
                .from('colors')
                .select('*')
                .eq('article_id', article.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching colors:', error);
                setError('Failed to load colors.');
            } else {
                setColors(data || []);
            }
            setLoading(false);
        };

        fetchColors();
    }, [article.id]);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-lg rounded-2xl shadow-2xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col border border-purple-500/30 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <header className="flex justify-between items-center p-6 border-b border-purple-500/30 bg-gradient-to-r from-purple-900/20 to-cyan-900/20">
                    <h2 className="text-2xl font-bold text-white">
                        Colors for <span className="font-mono text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">{article.article_number}</span>
                    </h2>
                    <button onClick={onClose} className="p-3 rounded-full hover:bg-purple-500/20 transition-all duration-300 hover:scale-110 group">
                        <CloseIcon />
                    </button>
                </header>

                <div className="flex-grow p-4 overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center items-center h-full"><Spinner /></div>
                    ) : error ? (
                        <div className="text-center text-red-400">{error}</div>
                    ) : colors.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {colors.map((color) => (
                                <div key={color.id} className="group relative aspect-w-1 aspect-h-1 bg-gradient-to-br from-gray-800/80 to-gray-700/80 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl border border-purple-500/20 hover:border-purple-400/40 transition-all duration-300 transform hover:-translate-y-1">
                                    <img src={color.image_url} alt={`Color for ${article.article_number}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-gray-400 h-full flex items-center justify-center">
                            No colors have been added for this article yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ColorGalleryModal;
