"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface NavbarProps {
    isDarkMode: boolean;
    toggleTheme: () => void;
}

const Navbar = ({ isDarkMode, toggleTheme }: NavbarProps) => {
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userName, setUserName] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);

    // Check if user is logged in on component mount and when localStorage changes
    useEffect(() => {
        const checkAuthStatus = () => {
            const token = localStorage.getItem('token');
            const userString = localStorage.getItem('user');

            if (token && userString) {
                try {
                    const user = JSON.parse(userString);
                    setIsLoggedIn(true);
                    setUserName(user.name || 'User');
                    setIsAdmin(user.role === 'admin');
                } catch (error) {
                    console.error('Error parsing user data:', error);
                    setIsLoggedIn(false);
                    setUserName('');
                    setIsAdmin(false);
                }
            } else {
                setIsLoggedIn(false);
                setUserName('');
                setIsAdmin(false);
            }
        };

        // Check auth status initially
        checkAuthStatus();

        // Add event listener for storage changes (if user logs in/out in another tab)
        window.addEventListener('storage', checkAuthStatus);

        return () => {
            window.removeEventListener('storage', checkAuthStatus);
        };
    }, []);

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
                            {isLoggedIn && (
                                isAdmin ? (
                                    <Link href="/admin" className={`inline-flex items-center px-1 pt-1 font-medium ${isDarkMode ? 'text-white hover:text-green-400' : 'text-gray-900 hover:text-green-600'} transition-colors duration-300`}>
                                        Admin Panel
                                    </Link>
                                ) : (
                                    <Link href="/dashboard" className={`inline-flex items-center px-1 pt-1 font-medium ${isDarkMode ? 'text-white hover:text-green-400' : 'text-gray-900 hover:text-green-600'} transition-colors duration-300`}>
                                        Dashboard
                                    </Link>
                                )
                            )}
                        </div>

                        {/* Login/Profile icon display */}
                        <div className="hidden sm:ml-4 sm:flex sm:items-center">
                            {isLoggedIn ? (
                                <Link href="/profile"
                                    className={`p-2 rounded-full ${isDarkMode ? 'text-white hover:text-green-400 hover:bg-gray-700' : 'text-gray-600 hover:text-green-500 hover:bg-gray-100'} transition-all duration-300`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </Link>
                            ) : (
                                <Link href="/authentication/login" className={`ml-4 px-4 py-2 rounded-md font-medium ${isDarkMode ? 'bg-green-500 hover:bg-green-400 text-white' : 'bg-green-400 hover:bg-green-500 text-white'} transition-colors duration-300`}>
                                    Login
                                </Link>
                            )}
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
                        {isLoggedIn && (
                            isAdmin ? (
                                <Link href="/admin" className={`block px-3 py-2 rounded-md text-base font-medium ${isDarkMode ? 'text-white hover:text-green-400 hover:bg-gray-700' : 'text-gray-900 hover:text-green-600 hover:bg-gray-100'} transition-colors duration-300`}>
                                    Admin Panel
                                </Link>
                            ) : (
                                <Link href="/dashboard" className={`block px-3 py-2 rounded-md text-base font-medium ${isDarkMode ? 'text-white hover:text-green-400 hover:bg-gray-700' : 'text-gray-900 hover:text-green-600 hover:bg-gray-100'} transition-colors duration-300`}>
                                    Dashboard
                                </Link>
                            )
                        )}

                        {/* Login/Profile for mobile */}
                        {isLoggedIn ? (
                            <Link href="/profile"
                                className={`block px-3 py-2 rounded-md text-base font-medium ${isDarkMode ? 'text-white hover:text-green-400 hover:bg-gray-700' : 'text-gray-900 hover:text-green-600 hover:bg-gray-100'} transition-colors duration-300 mt-2`}>
                                Profile
                            </Link>
                        ) : (
                            <Link href="/authentication/login" className={`block px-3 py-2 rounded-md text-base font-medium text-center ${isDarkMode ? 'bg-green-500 hover:bg-green-400 text-white' : 'bg-green-400 hover:bg-green-500 text-white'} transition-colors duration-300 mt-2`}>
                                Login
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;