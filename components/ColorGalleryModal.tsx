
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
    const [fullscreenUrl, setFullscreenUrl] = useState<string | null>(null);

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

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (fullscreenUrl) {
                    setFullscreenUrl(null);
                } else {
                    onClose();
                }
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [fullscreenUrl, onClose]);

    return (
        <>
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
                                <button
                                    key={color.id}
                                    onClick={() => setFullscreenUrl(color.image_url)}
                                    className="relative aspect-w-1 aspect-h-1 bg-gradient-to-br from-gray-800/80 to-gray-700/80 rounded-xl overflow-hidden shadow-lg border border-purple-500/20 focus:outline-none focus:ring-4 focus:ring-purple-500/25"
                                >
                                    <img
                                        src={color.image_url}
                                        alt={`Color for ${article.article_number}`}
                                        className="w-full h-full object-cover"
                                    />
                                    <span className="absolute bottom-2 right-2 text-xs bg-black/60 text-white px-2 py-1 rounded-md">Click to view</span>
                                </button>
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
        {fullscreenUrl && (
            <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setFullscreenUrl(null)}>
                <button onClick={() => setFullscreenUrl(null)} className="absolute top-4 right-4 p-3 rounded-full hover:bg-white/10 text-white" aria-label="Close full-screen">
                    <CloseIcon />
                </button>
                <img src={fullscreenUrl} alt="Full screen color" className="max-w-full max-h-full object-contain" />
            </div>
        )}
        </>
    );
};

export default ColorGalleryModal;
