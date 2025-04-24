import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Github } from 'lucide-react';

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
        <div className={`${isDarkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-between transition-colors duration-300`}>
          <p className={`text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} transition-colors duration-300`}>
            © {year} Fleetix, a College Project - Team 28.
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