"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function About() {
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
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
      <Navbar isDarkMode={isDarkMode} toggleTheme={toggleTheme} />

      <div className="min-h-screen flex flex-col align-center justify-center items-center">
        {/* Hero section */}
        <div className={`py-20 transition-colors duration-300`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mt-10">
              <h1 className={`text-4xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'} text-5xl md:text-7xl transition-colors duration-300`}>
                About <span className="text-green-500">Fleetix</span>
              </h1>
              <p className={`mt-8 text-2xl max-w-4xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} transition-colors duration-300`}>
                We&apos;re a team of passionate developers working to revolutionize employee transportation management through innovative technology.
              </p>
            </div>
          </div>
        </div>

        {/* Mission section */}
        <div className="py-20 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
              <div>
                <h2 className={`text-3xl md:text-5xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>
                  Our Mission
                </h2>
                <p className={`mt-4 text-xl ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} transition-colors duration-300 text-justify`}>
                  At Fleetix, we&apos;re committed to solving the complex challenges of employee transportation management. Our mission is to provide a comprehensive platform that optimizes routes, reduces costs, and improves the overall experience for both employers and employees.
                </p>
                <p className={`mt-4 text-xl ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} transition-colors duration-300 text-justify`}>
                  We believe that efficient transportation management not only saves companies money but also contributes to employee satisfaction and environmental sustainability by reducing carbon emissions through optimized routes.
                </p>
              </div>
              <div className="mt-10 lg:mt-0">
                <div className={`aspect-w-3 aspect-h-2 rounded-lg overflow-hidden shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <div className="h-96 flex items-center justify-center">
                    <img
                      src="map.png"
                      alt="Map"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA section */}
      <div className="mb-16 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className={`text-3xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'} sm:text-4xl transition-colors duration-300`}>
              Ready to optimize your employee transportation?
            </h2>
            <div className="mt-8 flex justify-center">
              <Link href="/demo" className={`px-8 py-3 text-center border border-transparent text-base font-medium rounded-md ${isDarkMode ? 'text-white bg-green-500 hover:bg-green-400' : 'text-white bg-green-500 hover:bg-green-600'} md:py-4 md:text-lg md:px-10 transform hover:scale-105 transition-all duration-300`}>
                Try the Demo
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}