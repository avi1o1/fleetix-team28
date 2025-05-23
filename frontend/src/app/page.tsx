"use client";

import Link from 'next/link'
import { useState, useEffect } from 'react'
import Image from 'next/image'

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function Home() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const words = ["Transportation", "Management", "Planning", "Logistics", "Coordination"];
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  // Theme handling
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

      if (prefersDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
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

  // Word rotation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIndex((prevIndex) => (prevIndex + 1) % words.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [words.length]);

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
      {/* Navbar */}
      <Navbar isDarkMode={isDarkMode} toggleTheme={toggleTheme} />

      {/* Hero section */}
      <div className={`${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} flex flex-col py-32 sm:py-16 align-center justify-center min-h-screen items-center transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 lg:flex lg:justify-between lg:items-center">
          <div className="text-left sm:text-justify sm:pr-16">
            <h1 className={`flex flex-col text-5xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'} sm:text-5xl lg:text-8xl transition-colors duration-300`}>
              Optimize your
              <span className="text-green-400">Employee</span>
              <span className="text-green-400 relative overflow-hidden pb-12">
                <span className="absolute transition-opacity duration-500 ease-in-out"
                  style={{ opacity: currentWordIndex === 0 ? 1 : 0 }}>
                  Transportation
                </span>
                <span className="absolute transition-opacity duration-500 ease-in-out"
                  style={{ opacity: currentWordIndex === 1 ? 1 : 0 }}>
                  Management
                </span>
                <span className="absolute transition-opacity duration-500 ease-in-out"
                  style={{ opacity: currentWordIndex === 2 ? 1 : 0 }}>
                  Planning
                </span>
                <span className="absolute transition-opacity duration-500 ease-in-out"
                  style={{ opacity: currentWordIndex === 3 ? 1 : 0 }}>
                  Logistics
                </span>
                <span className="absolute transition-opacity duration-500 ease-in-out"
                  style={{ opacity: currentWordIndex === 4 ? 1 : 0 }}>
                  Coordination
                </span>
                {/* Invisible element to maintain height */}
                <span className="invisible">Transportation</span>
              </span>
            </h1>
            <p className={`mt-5 text-3xl ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} transition-colors duration-300`}>
              Efficient route optimization for multiple pickups and drop-offs using OpenStreetMap technology.
            </p>
            <p className={`text-xl mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} transition-colors duration-300`}>
              Say goodbye to manual route planning and hello to increased efficiency, reduced costs, and improved employee satisfaction.
            </p>
          </div>
          <div className="mt-12 lg:mt-0 lg:flex-shrink-0">
            <div className={`w-full h-80 sm:h-96 lg:h-[28rem] ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'} rounded-lg overflow-hidden shadow-lg transform hover:scale-105 transition-all duration-300`}>
              <div className={`w-full h-full flex items-center justify-center ${isDarkMode ? 'bg-opacity-50 bg-gray-700' : 'bg-opacity-50 bg-gray-300'}`}>
                <img
                  src="map.png"
                  alt="Map"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="w-full pt-16 md:pt-24 flex gap-5 items-center justify-center sm:space-x-4">
          <Link href="/about" className={`px-8 py-3 text-center border border-transparent text-base font-medium rounded-md ${isDarkMode ? 'text-white bg-gray-800 hover:bg-gray-700' : 'text-gray-800 bg-gray-200 hover:bg-gray-300'} sm:py-4 sm:text-lg sm:px-10 transform hover:scale-105 transition-all duration-300`}>
            Learn More
          </Link>
          <Link href="/demo" className={`px-8 py-3 text-center border border-transparent text-base font-medium rounded-md ${isDarkMode ? 'text-white bg-green-500 hover:bg-green-400' : 'text-white bg-green-400 hover:bg-green-500'} sm:py-4 sm:text-lg sm:px-10 transform hover:scale-105 transition-all duration-300`}>
            Request Demo
          </Link>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}
