"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function DemoPage() {
    const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
    const router = useRouter();

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

    const demoServices = [
        {
            title: "Geocoding",
            description: "Convert addresses into geographic coordinates and visualize locations on a map.",
            icon: (
                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
            link: "/demo/geocode",
            color: "bg-blue-500"
        },
        {
            title: "One-to-One Routing",
            description: "Calculating the shortest path between two locations and visualising the route on a map.",
            icon: (
                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
            ),
            link: "/demo/o2o-route",
            color: "bg-orange-500"
        },
        {
            title: "Many-to-One Routing",
            description: "Finding a singular optimal route for multiple locations to a single destination.",
            icon: (
                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            ),
            link: "/demo/m2o-route",
            color: "bg-indigo-500"
        },
        {
            title: "Many-to-Many Routing",
            description: "Optimising multiple routes for different locations with a single final destination.",
            icon: (
                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                </svg>
            ),
            link: "/demo/m2m-route",
            color: "bg-yellow-500"
        },
        {
            title: "Fleet Management",
            description: "Optimize routes for multiple vehicles with capacity constraints and time windows.",
            icon: (
                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12h18" />
                </svg>
            ),
            link: "/demo/fleet",
            color: "bg-green-500"
        },
        {
            title: "Real-Time Tracking",
            description: "Simulate real-time vehicle tracking with updates on location, ETA, and route progress.",
            icon: (
                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
            ),
            link: "/demo/tracking",
            color: "bg-purple-500"
        }
    ];

    return (
        <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
            <Navbar isDarkMode={isDarkMode} toggleTheme={toggleTheme} />

            {/* Hero section */}
            <div className="min-h-screen">
                <div className={`${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} py-16 transition-colors duration-300`}>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center">
                            <h1 className={`mt-20 text-6xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'} sm:text-5xl lg:text-7xl transition-colors duration-300`}>
                                Interactive <span className="text-green-500">Demos</span>
                            </h1>
                            <p className={`mt-6 text-xl max-w-3xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} transition-colors duration-300`}>
                                Explore our range of transportation management features through these interactive demonstrations.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Demo services grid */}
                <div className={`py-10 ${isDarkMode ? 'bg-gray-900' : 'bg-white'} transition-colors duration-300`}>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                            {demoServices.map((service, index) => (
                                <div
                                    key={index}
                                    onClick={() => router.push(service.link)}
                                    className={`${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'} 
                  rounded-xl overflow-hidden shadow-lg cursor-pointer transform transition-all duration-300 
                  hover:shadow-xl hover:scale-105`}
                                >
                                    <div className={`p-6 ${service.color} text-white flex justify-center`}>
                                        {service.icon}
                                    </div>
                                    <div className="p-6">
                                        <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                            {service.title}
                                        </h3>
                                        <p className={`mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                                            {service.description}
                                        </p>
                                        <div className={`mt-4 inline-flex items-center font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                                            Try it now
                                            <svg className="ml-1 w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <Footer />
        </div>
    );
}