
import React from 'react';

interface SearchBarProps {
    onSearch: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
    return (
        <div className="max-w-xl mx-auto mb-8">
            <div className="relative">
                <input
                    type="text"
                    placeholder="Search by article number..."
                    onChange={(e) => onSearch(e.target.value)}
                    className="w-full px-6 py-4 bg-gradient-to-r from-gray-800 to-gray-700 border-2 border-blue-500/30 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/25 focus:border-blue-400 transition-all duration-300 text-white placeholder-gray-400 shadow-lg"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-emerald-500/10 rounded-xl blur-sm -z-10"></div>
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default SearchBar;
