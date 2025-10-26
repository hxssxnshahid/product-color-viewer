import React, { useState, useEffect } from 'react';
import Spinner from './Spinner';

interface LoginPageProps {
    onLogin: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Add entrance animation
        const timer = setTimeout(() => setIsVisible(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password.trim()) {
            setError('Please enter the password');
            return;
        }

        setIsLoading(true);
        setError('');

        // Simulate a brief loading state for better UX
        await new Promise(resolve => setTimeout(resolve, 800));

        if (password === '0000') {
            // Store login state in sessionStorage
            sessionStorage.setItem('isAuthenticated', 'true');
            onLogin();
        } else {
            setError('Incorrect password. Please try again.');
            setPassword('');
        }
        
        setIsLoading(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSubmit(e);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl"></div>
            </div>

            <div className={`relative z-10 w-full max-w-md transition-all duration-700 transform ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
                <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-purple-500/30 p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="mb-4">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-full mb-4">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                        </div>
                        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 mb-2">
                            Welcome Back
                        </h1>
                        <p className="text-gray-400 text-sm">
                            Enter the access code to continue
                        </p>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                                Access Code
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Enter access code"
                                    className="w-full px-4 py-3 bg-gradient-to-r from-gray-800/80 to-gray-700/80 border border-purple-500/30 rounded-lg focus:outline-none focus:ring-4 focus:ring-purple-500/25 focus:border-purple-400 transition-all duration-300 text-white placeholder-gray-400 backdrop-blur-sm pr-12"
                                    disabled={isLoading}
                                    autoFocus
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-lg blur-sm -z-10"></div>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-900/50 border border-red-600/50 rounded-lg p-3">
                                <p className="text-red-300 text-sm text-center">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg hover:from-purple-700 hover:to-cyan-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg font-medium"
                        >
                            {isLoading ? (
                                <>
                                    <Spinner small />
                                    <span className="ml-2">Verifying...</span>
                                </>
                            ) : (
                                'Access Application'
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-8 text-center">
                        <p className="text-xs text-gray-500">
                            Product Color Viewer V 1.3
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                            Built by Hassan
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
