"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function ComingSoonPage() {
    const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

    useEffect(() => {
        // Check for saved theme preference in localStorage
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            setIsDarkMode(true);
        } else if (savedTheme === 'light') {
            setIsDarkMode(false);
        } else {
            // If no preference is set, check for system preference
            const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setIsDarkMode(prefersDarkMode);
            localStorage.setItem('theme', prefersDarkMode ? 'dark' : 'light');
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
        <div className={`${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
            <Navbar isDarkMode={isDarkMode} toggleTheme={toggleTheme} />

            <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 sm:py-24">
                <div className={`text-center max-w-3xl mx-auto ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    <div className="mt-8 flex justify-center mb-8">
                        <div className={`rounded-full p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'} text-green-500`}>
                            <svg className="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>

                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4">
                        Coming Soon!
                    </h1>

                    <h2 className="text-2xl sm:text-3xl font-bold text-green-500 mb-6">
                        This feature is under development
                    </h2>

                    <p className={`text-lg mb-10 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Our team is working hard to bring you this feature. Check back soon or explore our other available demos.
                    </p>

                    {/* Project status */}
                    <div className={`mb-12 p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-md max-w-2xl mx-auto`}>
                        <h3 className="text-xl font-bold mb-3">Current Development Status</h3>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between mb-1">
                                    <span className="text-sm font-medium">Research</span>
                                    <span className="text-sm font-medium">100%</span>
                                </div>
                                <div className={`w-full h-2 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                    <div className="h-2 rounded-full bg-green-500" style={{ width: '100%' }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between mb-1">
                                    <span className="text-sm font-medium">Design</span>
                                    <span className="text-sm font-medium">80%</span>
                                </div>
                                <div className={`w-full h-2 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                    <div className="h-2 rounded-full bg-green-500" style={{ width: '80%' }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between mb-1">
                                    <span className="text-sm font-medium">Development</span>
                                    <span className="text-sm font-medium">40%</span>
                                </div>
                                <div className={`w-full h-2 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                    <div className="h-2 rounded-full bg-green-500" style={{ width: '40%' }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between mb-1">
                                    <span className="text-sm font-medium">Testing</span>
                                    <span className="text-sm font-medium">10%</span>
                                </div>
                                <div className={`w-full h-2 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                    <div className="h-2 rounded-full bg-green-500" style={{ width: '10%' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-20 flex flex-col sm:flex-row justify-center items-center gap-8">
                        <Link
                            href="/demo"
                            className={`px-8 py-3 text-center border border-transparent text-base font-medium rounded-md ${isDarkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'} md:py-4 md:text-lg md:px-10 transform hover:scale-105 transition-all duration-300`}
                        >
                            Back to Demo Menu
                        </Link>
                        <Link
                            href="/"
                            className={`px-8 py-3 text-center border border-transparent text-base font-medium rounded-md ${isDarkMode ? 'bg-green-500 text-white hover:bg-green-400' : 'bg-green-500 text-white hover:bg-green-600'} md:py-4 md:text-lg md:px-10 transform hover:scale-105 transition-all duration-300`}
                        >
                            Go to Homepage
                        </Link>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}