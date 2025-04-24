"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useState, useEffect } from 'react';
import { Users, Route, Car, BarChart3, Map, UserCog, LogOut } from 'lucide-react';

const AdminDashboard: React.FC = () => {
    const router = useRouter();
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
            const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setIsDarkMode(prefersDarkMode);
            localStorage.setItem('theme', prefersDarkMode ? 'dark' : 'light');
            if (prefersDarkMode) document.documentElement.classList.add('dark');
        }
    }, []);

    const toggleTheme = () => {
        const newDarkModeValue = !isDarkMode;
        setIsDarkMode(newDarkModeValue);
        localStorage.setItem('theme', newDarkModeValue ? 'dark' : 'light');

        // Apply theme to document for global theming
        if (newDarkModeValue) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    const handleLogout = () => {
        // Clear authentication data from localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Redirect to home page
        router.push('/');
    };

    return (
        <div className={`flex flex-col min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} transition-colors duration-300`}>
            <Navbar isDarkMode={isDarkMode} toggleTheme={toggleTheme} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28 min-h-screen">
                {/* Hero section */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
                    <div className="text-center">
                        <h1 className={`mt-8 text-6xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'} sm:text-5xl lg:text-7xl transition-colors duration-300`}>
                            Admin <span className="text-green-500">Dashboard</span>
                        </h1>
                        <p className={`mt-6 text-xl max-w-3xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} transition-colors duration-300`}>
                            Manage your transportation system and resources
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Manage Employees */}
                    <Link href="/admin/employees"
                        className={`group flex flex-col p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'}`}
                    >
                        <div className="flex items-center mb-4">
                            <div className={`p-3 rounded-full ${isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-600'} mr-4`}>
                                <Users size={24} />
                            </div>
                            <h2 className="text-xl font-bold text-green-500">Manage Employees</h2>
                        </div>
                        <p className={`mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            Add, edit, or remove employee details and assign routes. Manage employee transportation schedules and preferences.
                        </p>
                        <div className={`mt-6 self-end text-sm font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'} group-hover:underline`}>
                            Manage Employees →
                        </div>
                    </Link>

                    {/* Manage Fleet/Routes */}
                    <Link href="/admin/fleet"
                        className={`group flex flex-col p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'}`}
                    >
                        <div className="flex items-center mb-4">
                            <div className={`p-3 rounded-full ${isDarkMode ? 'bg-amber-900 text-amber-300' : 'bg-amber-100 text-amber-600'} mr-4`}>
                                <Route size={24} />
                            </div>
                            <h2 className="text-xl font-bold text-amber-500">Manage Fleet / Routes</h2>
                        </div>
                        <p className={`mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            Generate and optimize transportation routes for efficiency. Add and manage vehicles in your fleet system.
                        </p>
                        <div className={`mt-6 self-end text-sm font-medium ${isDarkMode ? 'text-amber-400' : 'text-amber-600'} group-hover:underline`}>
                            Configure Routes →
                        </div>
                    </Link>

                    {/* Reports & Analytics */}
                    <Link href="/admin/reports"
                        className={`group flex flex-col p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'}`}
                    >
                        <div className="flex items-center mb-4">
                            <div className={`p-3 rounded-full ${isDarkMode ? 'bg-purple-900 text-purple-300' : 'bg-purple-100 text-purple-600'} mr-4`}>
                                <BarChart3 size={24} />
                            </div>
                            <h2 className="text-xl font-bold text-purple-500">Analytics & Reports</h2>
                        </div>
                        <p className={`mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            View system reports, usage statistics and performance metrics. Track efficiency and identify areas for improvement.
                        </p>
                        <div className={`mt-6 self-end text-sm font-medium ${isDarkMode ? 'text-purple-400' : 'text-purple-600'} group-hover:underline`}>
                            View Reports →
                        </div>
                    </Link>
                </div>
            </div>

            <Footer isDarkMode={isDarkMode} />
        </div>
    );
};

export default AdminDashboard;
