"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function OutOfScopePage() {
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
                        <div className={`rounded-full p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'} text-amber-500`}>
                            <svg className="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                    </div>

                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4">
                        Out of Scope :(
                    </h1>

                    <h2 className="text-2xl sm:text-3xl font-bold text-amber-500 mb-6">
                        This feature is beyond the current project scope
                    </h2>

                    <p className={`text-lg mb-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        While this feature would be valuable, it falls outside the boundaries of our current academic project timeline and resources.
                    </p>

                    {/* Scope explanation */}
                    <div className={`mb-12 p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-md max-w-2xl mx-auto`}>
                        <h3 className="text-xl font-bold mb-3">Academic Project Limitations</h3>
                        <div className="space-y-4 text-left">
                            <div className="flex items-start">
                                <svg className="h-5 w-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                    <span className="font-medium"><b>Time Constraints:</b></span> Implementation would require additional development time beyond our academic semester timeline.
                                </p>
                            </div>

                            <div className="flex items-start">
                                <svg className="h-5 w-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                    <span className="font-medium"><b>Technical Complexity:</b></span> This feature would require real-time data processing capabilities beyond the scope of our current architecture.
                                </p>
                            </div>

                            <div className="flex items-start">
                                <svg className="h-5 w-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                    <span className="font-medium"><b>Resource Allocation:</b></span> Our team is focused on delivering core functionality that meets the primary project requirements.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-8">
                        <Link
                            href="/demo"
                            className={`px-8 py-3 text-center border border-transparent text-base font-medium rounded-md ${isDarkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'} md:py-4 md:text-lg md:px-10 transform hover:scale-105 transition-all duration-300`}
                        >
                            Back to Demo Menu
                        </Link>
                        <Link
                            href="/"
                            className={`px-8 py-3 text-center border border-transparent text-base font-medium rounded-md ${isDarkMode ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-amber-500 text-white hover:bg-amber-400'} md:py-4 md:text-lg md:px-10 transform hover:scale-105 transition-all duration-300`}
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