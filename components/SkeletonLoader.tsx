import React from 'react';

interface SkeletonLoaderProps {
    type: 'article' | 'color' | 'text' | 'button';
    count?: number;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ type, count = 1 }) => {
    const renderSkeleton = () => {
        switch (type) {
            case 'article':
                return (
                    <div className="aspect-w-1 aspect-h-1 flex items-center justify-center p-4 bg-gray-800 rounded-lg shadow-md border border-gray-700 animate-pulse">
                        <div className="h-6 w-20 bg-gray-700 rounded"></div>
                    </div>
                );
            
            case 'color':
                return (
                    <div className="aspect-w-1 aspect-h-1 bg-gray-800 rounded-lg overflow-hidden animate-pulse">
                        <div className="w-full h-full bg-gray-700"></div>
                    </div>
                );
            
            case 'text':
                return (
                    <div className="space-y-2">
                        <div className="h-4 bg-gray-700 rounded w-3/4 animate-pulse"></div>
                        <div className="h-4 bg-gray-700 rounded w-1/2 animate-pulse"></div>
                    </div>
                );
            
            case 'button':
                return (
                    <div className="h-10 bg-gray-700 rounded-md animate-pulse"></div>
                );
            
            default:
                return <div className="h-4 bg-gray-700 rounded animate-pulse"></div>;
        }
    };

    if (count === 1) {
        return renderSkeleton();
    }

    return (
        <div className="space-y-2">
            {Array.from({ length: count }, (_, index) => (
                <div key={index}>
                    {renderSkeleton()}
                </div>
            ))}
        </div>
    );
};

export default SkeletonLoader;
