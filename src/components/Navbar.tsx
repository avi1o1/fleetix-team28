"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';

interface NavbarProps {
    isDarkMode: boolean;
    toggleTheme: () => void;
}

const Navbar = ({ isDarkMode, toggleTheme }: NavbarProps) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <nav className={`fixed w-full z-50 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-md transition-colors duration-300`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-20">
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center">
                            <Link href="/" className="flex items-center text-2xl font-bold text-green-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-8 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                </svg>
                                Fleetix
                            </Link>
                        </div>
                    </div>

                    {/* Desktop navigation links */}
                    <div className="flex gap-4 text-lg">
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            <Link href="/about" className={`inline-flex items-center px-1 pt-1 font-medium ${isDarkMode ? 'text-white hover:text-green-400' : 'text-gray-900 hover:text-green-600'} transition-colors duration-300`}>
                                About
                            </Link>
                            <Link href="/demo" className={`inline-flex items-center px-1 pt-1 font-medium ${isDarkMode ? 'text-white hover:text-green-400' : 'text-gray-900 hover:text-green-600'} transition-colors duration-300`}>
                                Demo
                            </Link>
                            <Link href="/team" className={`inline-flex items-center px-1 pt-1 font-medium ${isDarkMode ? 'text-white hover:text-green-400' : 'text-gray-900 hover:text-green-600'} transition-colors duration-300`}>
                                Team
                            </Link>
                            <Link href="/timeline" className={`inline-flex items-center px-1 pt-1 font-medium ${isDarkMode ? 'text-white hover:text-green-400' : 'text-gray-900 hover:text-green-600'} transition-colors duration-300`}>
                                Project Timeline
                            </Link>
                        </div>

                        {/* Theme toggle button */}
                        <div className="hidden sm:ml-4 sm:flex sm:items-center">
                            <button
                                onClick={toggleTheme}
                                className={`p-2 rounded-full ${isDarkMode ? 'bg-gray-700 text-yellow-300' : 'bg-gray-100 text-gray-600'} focus:outline-none transition-colors duration-300`}
                            >
                                {isDarkMode ? (
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                ) : (
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Mobile menu button */}
                    <div className="sm:hidden flex items-center">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className={`inline-flex items-center justify-center p-2 rounded-md ${isDarkMode ? 'text-gray-200 hover:text-white hover:bg-gray-700' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-300`}
                            aria-expanded="false"
                        >
                            <span className="sr-only">Open main menu</span>
                            {isMenuOpen ? (
                                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu, show/hide based on menu state */}
            {isMenuOpen && (
                <div className="sm:hidden">
                    <div className={`px-2 pt-2 pb-3 space-y-1 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <Link href="/about" className={`block px-3 py-2 rounded-md text-base font-medium ${isDarkMode ? 'text-white hover:text-green-400 hover:bg-gray-700' : 'text-gray-900 hover:text-green-600 hover:bg-gray-100'} transition-colors duration-300`}>
                            About
                        </Link>
                        <Link href="/demo" className={`block px-3 py-2 rounded-md text-base font-medium ${isDarkMode ? 'text-white hover:text-green-400 hover:bg-gray-700' : 'text-gray-900 hover:text-green-600 hover:bg-gray-100'} transition-colors duration-300`}>
                            Demo
                        </Link>
                        <Link href="/team" className={`block px-3 py-2 rounded-md text-base font-medium ${isDarkMode ? 'text-white hover:text-green-400 hover:bg-gray-700' : 'text-gray-900 hover:text-green-600 hover:bg-gray-100'} transition-colors duration-300`}>
                            Team
                        </Link>
                        <Link href="/timeline" className={`block px-3 py-2 rounded-md text-base font-medium ${isDarkMode ? 'text-white hover:text-green-400 hover:bg-gray-700' : 'text-gray-900 hover:text-green-600 hover:bg-gray-100'} transition-colors duration-300`}>
                            Project Timeline
                        </Link>
                        <button
                            onClick={toggleTheme}
                            className={`mt-4 w-full flex items-center justify-center px-4 py-2 ${isDarkMode ? 'bg-gray-700 text-yellow-300' : 'bg-gray-100 text-gray-600'} rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-300`}
                        >
                            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                            <span className="ml-2">
                                {isDarkMode ? (
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                ) : (
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                    </svg>
                                )}
                            </span>
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;