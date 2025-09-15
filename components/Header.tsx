
import React from 'react';

interface HeaderProps {
    isAdminView: boolean;
    onToggleAdminView: () => void;
}

const Header: React.FC<HeaderProps> = ({ isAdminView, onToggleAdminView }) => {
    return (
        <header className="bg-gradient-to-r from-slate-900/80 via-blue-900/80 to-slate-900/80 backdrop-blur-md sticky top-0 z-50 border-b border-blue-500/30 shadow-lg">
            <div className="container mx-auto flex justify-between items-center p-4">
                <div className="text-xl font-semibold text-white">
                    <div className="flex flex-col">
                        <div>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 font-bold">Color</span>
                            <span className="text-white">Catalog</span>
                        </div>
                        <div className="text-xs text-gray-400 font-normal mt-1">
                            Built by Hassan
                        </div>
                    </div>
                </div>
                <button
                    onClick={onToggleAdminView}
                    className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                        isAdminView
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/25'
                            : 'bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-gray-200 shadow-lg'
                    }`}
                >
                    {isAdminView ? 'Exit Admin' : 'Admin Panel'}
                </button>
            </div>
        </header>
    );
};

export default Header;
