"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Home, Map, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function NotFound() {
    const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

    useEffect(() => {
        // Check for saved theme preference in localStorage
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            setIsDarkMode(true);
            document.documentElement.classList.add('dark');
        } else if (savedTheme === 'light') {
            setIsDarkMode(false);
            document.documentElement.classList.remove('dark');
        } else {
            // If no preference is set, check for system preference
            const prefersDarkMode = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
            setIsDarkMode(prefersDarkMode);
            localStorage.setItem('theme', prefersDarkMode ? 'dark' : 'light');
            if (prefersDarkMode) document.documentElement.classList.add('dark');
        }
    }, []);

    const toggleTheme = () => {
        const newDarkModeValue = !isDarkMode;
        setIsDarkMode(newDarkModeValue);
        localStorage.setItem('theme', newDarkModeValue ? 'dark' : 'light');

        // Apply theme to document if needed for global theming
        if (newDarkModeValue) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    return (
        <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
            <Navbar isDarkMode={isDarkMode} toggleTheme={toggleTheme} />

            <div className="flex flex-col items-center justify-center min-h-screen px-4 py-16 -mt-16">
                <div className={`text-center max-w-3xl mx-auto ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    <div className="mt-8 flex justify-center mb-8">
                        <div className={`rounded-full p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'} text-red-500`}>
                            <svg className="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                    </div>

                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4">
                        404 - Page Not Found
                    </h1>

                    <h2 className="text-2xl sm:text-3xl font-bold text-green-500 mb-6">
                        Oops! We couldn't find that page
                    </h2>

                    <p className={`text-lg mb-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        The page you're looking for doesn't exist or has been moved.
                    </p>

                    <div className={`mb-12 p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-md max-w-2xl mx-auto`}>
                        <h3 className="text-xl font-bold mb-3">You might want to try:</h3>
                        <div className="space-y-4 text-left">
                            <div className="flex items-start">
                                <ArrowLeft className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                    Going back to the previous page
                                </p>
                            </div>
                            <div className="flex items-start">
                                <Home className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                    Returning to the homepage
                                </p>
                            </div>
                            <div className="flex items-start">
                                <Map className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                    Checking out our demos and other features
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-8">
                        <button
                            onClick={() => typeof window !== 'undefined' && window.history.back()}
                            className={`px-8 py-3 text-center border border-transparent text-base font-medium rounded-md ${isDarkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'} md:py-4 md:text-lg md:px-10 transform hover:scale-105 transition-all duration-300 flex items-center`}
                        >
                            <ArrowLeft size={20} className="mr-2" />
                            Go Back
                        </button>
                        <Link
                            href="/"
                            className={`px-8 py-3 text-center border border-transparent text-base font-medium rounded-md ${isDarkMode ? 'bg-green-500 text-white hover:bg-green-400' : 'bg-green-500 text-white hover:bg-green-600'} md:py-4 md:text-lg md:px-10 transform hover:scale-105 transition-all duration-300 flex items-center`}
                        >
                            <Home size={20} className="mr-2" />
                            Homepage
                        </Link>
                        <Link
                            href="/demo"
                            className={`px-8 py-3 text-center border border-transparent text-base font-medium rounded-md ${isDarkMode ? 'bg-blue-500 text-white hover:bg-blue-400' : 'bg-blue-500 text-white hover:bg-blue-600'} md:py-4 md:text-lg md:px-10 transform hover:scale-105 transition-all duration-300 flex items-center`}
                        >
                            <Map size={20} className="mr-2" />
                            Try Demos
                        </Link>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
