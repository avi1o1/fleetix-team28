import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Github, Twitter, Linkedin, Instagram } from 'lucide-react';

const Footer: React.FC = () => {
  // Get initial theme from system/localStorage
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [year, setYear] = useState<number>(2025);

  // Sync with system theme preference and localStorage on mount
  useEffect(() => {
    // Check localStorage first
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    } else {
      // Fall back to system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
    }

    // Set current year
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className={`${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">

        {/* Main Links Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <span className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>
                Fleetix
              </span>
            </div>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-4 transition-colors duration-300`}>
              Fleet management made simple for college projects, startups, and businesses.
            </p>
          </div>

          <div>
            <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>
              Navigation
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/" className={`text-base ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} hover:text-green-500 flex items-center space-x-1 transition-colors duration-300`}>
                  <span>Home</span>
                </Link>
              </li>
              <li>
                <Link href="/demo" className={`text-base ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} hover:text-green-500 flex items-center space-x-1 transition-colors duration-300`}>
                  <span>Features</span>
                </Link>
              </li>
              <li>
                <Link href="https://developers.google.com/maps/billing-and-pricing/pricing-india" className={`text-base ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} hover:text-green-500 flex items-center space-x-1 transition-colors duration-300`}>
                  <span>Pricing</span>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>
              About Us
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/about" className={`text-base ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} hover:text-green-500 transition-colors duration-300`}>
                  Our Team
                </Link>
              </li>
              <li>
                <Link href="/about" className={`text-base ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} hover:text-green-500 transition-colors duration-300`}>
                  Our Mission
                </Link>
              </li>
              <li>
                <Link href="/team" className={`text-base ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} hover:text-green-500 transition-colors duration-300`}>
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>
              Resources
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="https://github.com" className={`text-base ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} hover:text-green-500 transition-colors duration-300`}>
                  Documentation
                </Link>
              </li>

              <li>
                <Link href="https://github.com" className={`text-base ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} hover:text-green-500 transition-colors duration-300`}>
                  GitHub Repository
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section with Copyright and Social Links */}
        <div className={`mt-8 pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} md:flex md:items-center md:justify-between transition-colors duration-300`}>
          <p className={`text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} transition-colors duration-300`}>
            © {year} Fleetix, a College Project - Team 28. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <Link href="https://github.com/DASS-Spring-2025/dass-spring-2025-project-team-28" className={`${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'} hover:text-green-500 transition-colors duration-300`}>
              <span className="sr-only">GitHub</span>
              <Github size={20} />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;