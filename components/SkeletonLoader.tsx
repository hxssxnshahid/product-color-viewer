
import React from 'react';

interface SkeletonLoaderProps {
    type?: 'article' | 'color';
    count?: number;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ type = 'article', count = 6 }) => {
    const renderSkeleton = () => {
        if (type === 'article') {
            return (
                <div className="group relative aspect-w-1 aspect-h-1 flex items-center justify-center p-4 bg-gradient-to-br from-gray-800/80 to-gray-700/80 rounded-xl shadow-lg border border-purple-500/20 animate-pulse">
                    <div className="h-6 w-20 bg-gray-700/50 rounded"></div>
                </div>
            );
        }
        
        // Color skeleton
        return (
            <div className="relative aspect-w-1 aspect-h-1 bg-gradient-to-br from-gray-800/80 to-gray-700/80 rounded-xl overflow-hidden animate-pulse">
                <div className="w-full h-full bg-gradient-to-br from-gray-700/50 to-gray-600/50"></div>
            </div>
        );
    };

    return (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <React.Fragment key={index}>
                    {renderSkeleton()}
                </React.Fragment>
            ))}
        </>
    );
};

export default SkeletonLoader;

