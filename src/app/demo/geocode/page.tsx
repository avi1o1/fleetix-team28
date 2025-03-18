'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { MapPin, Globe, AlertCircle, Sun, Moon, X } from 'lucide-react';
import Link from 'next/link';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';

let L: any;

if (typeof window !== 'undefined') {
  L = require('leaflet');
}

interface LocationSuggestion {
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
}

const AddressGeocoder: React.FC = () => {
    const mapRef = useRef<L.Map | null>(null);
    const [address, setAddress] = useState<string>('');
    const [result, setResult] = useState<React.ReactNode>('');
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const markerRef = useRef<L.Marker | null>(null);
    const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
    const suggestionsRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            setIsDarkMode(true);
            document.documentElement.classList.add('dark');
        } else if (savedTheme === 'light') {
            setIsDarkMode(false);
            document.documentElement.classList.remove('dark');
        } else {
            const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setIsDarkMode(prefersDarkMode);
            localStorage.setItem('theme', prefersDarkMode ? 'dark' : 'light');
            if (prefersDarkMode) {
                document.documentElement.classList.add('dark');
            }
        }
    }, []);

    useEffect(() => {
        if (mapContainerRef.current && !mapRef.current) {
            mapRef.current = L.map(mapContainerRef.current).setView([51.505, -0.09], 13);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
            }).addTo(mapRef.current);

            setTimeout(() => {
                mapRef.current?.invalidateSize();
            }, 200);
        }

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        // Close suggestions when clicking outside
        const handleClickOutside = (event: MouseEvent) => {
            if (
                suggestionsRef.current && 
                !suggestionsRef.current.contains(event.target as Node) &&
                inputRef.current && 
                !inputRef.current.contains(event.target as Node)
            ) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const toggleTheme = () => {
        const newDarkModeValue = !isDarkMode;
        setIsDarkMode(newDarkModeValue);
        localStorage.setItem('theme', newDarkModeValue ? 'dark' : 'light');
        if (newDarkModeValue) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    const fetchSuggestions = async (query: string) => {
        if (!query.trim() || query.length < 3) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        setIsLoading(true);

        try {
            const encodedAddress = encodeURIComponent(query);
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=5`;

            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'GeocodingDemo/1.0',
                    'Accept-Language': 'en',
                },
            });

            const data = await response.json();

            if (data && data.length > 0) {
                setSuggestions(data);
                setShowSuggestions(true);
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        } catch (error) {
            console.error('Error fetching suggestions:', error);
            setSuggestions([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setAddress(value);

        // Debounce the API call
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            fetchSuggestions(value);
        }, 300);
    };

    const handleSuggestionClick = (suggestion: LocationSuggestion) => {
        setAddress(suggestion.display_name);
        setShowSuggestions(false);
        displayLocationResult(suggestion);
    };

    const displayLocationResult = (locationData: LocationSuggestion) => {
        const lat = parseFloat(locationData.lat);
        const lon = parseFloat(locationData.lon);

        setResult(
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                    <MapPin className="text-green-500" size={20} />
                    <span className="font-medium">Found Address:</span> {locationData.display_name}
                </div>
                <div className="flex items-center gap-2">
                    <Globe className="text-green-500" size={20} />
                    <span className="font-medium">Coordinates:</span> {lat.toFixed(6)}, {lon.toFixed(6)}
                </div>
            </div>
        );

        if (mapRef.current) {
            mapRef.current.setView([lat, lon], 16);

            if (markerRef.current) {
                markerRef.current.remove();
            }

            markerRef.current = L.marker([lat, lon])
                .bindPopup(locationData.display_name)
                .addTo(mapRef.current)
                .openPopup();
        }
    };

    const geocodeAddress = async () => {
        if (!address.trim()) {
            setResult(
                <div className="flex items-center gap-2 text-green-500">
                    <AlertCircle size={20} />
                    <span>Please enter an address to search</span>
                </div>
            );
            return;
        }

        setIsLoading(true);
        setResult('');

        try {
            const encodedAddress = encodeURIComponent(address);
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`;

            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'GeocodingDemo/1.0',
                    'Accept-Language': 'en',
                },
            });

            const data = await response.json();

            if (!data || data.length === 0) {
                setResult(
                    <div className="flex items-center gap-2 text-green-500">
                        <AlertCircle size={20} />
                        <span>No results found for this address. Please try a different search term.</span>
                    </div>
                );
                return;
            }

            displayLocationResult(data[0]);
        } catch (error) {
            setResult(
                <div className="flex items-center gap-2 text-red-500">
                    <AlertCircle size={20} />
                    <span>Error occurred while geocoding the address. Please try again later.</span>
                </div>
            );
            console.error('Error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const clearInput = () => {
        setAddress('');
        setSuggestions([]);
        setShowSuggestions(false);
        setResult('');
        if (markerRef.current && mapRef.current) {
            markerRef.current.remove();
            markerRef.current = null;
            mapRef.current.setView([51.505, -0.09], 13);
        }
    };

    return (
        <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
            {/* Navbar */}
            <nav className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-md transition-colors duration-300`}>
                <Navbar isDarkMode={isDarkMode} toggleTheme={toggleTheme} />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <Link href="/" className={`flex items-center font-bold text-xl ${isDarkMode ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>
                                <MapPin className="text-green-500 mr-2" />
                                GeoFinder
                            </Link>
                        </div>
                        <div className="flex items-center">
                            <button
                                onClick={toggleTheme}
                                className={`p-2 rounded-full ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} focus:outline-none transition-colors duration-300`}
                                aria-label="Toggle dark mode"
                            >
                                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center mb-12">
                    <h1 className={`text-4xl sm:text-5xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-6 transition-colors duration-300`}>
                        Address
                        <span className="text-green-500"> Geocoding</span>
                    </h1>
                    <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} max-w-2xl mx-auto mb-8 transition-colors duration-300`}>
                        Convert addresses into precise geographical coordinates and visualize them on an interactive map
                    </p>
                </div>

                <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg transition-colors duration-300`}>
                    <div className="w-full flex flex-col md:flex-row gap-4 mb-6 relative">
                        <div className="flex-1 relative">
                            <input
                                ref={inputRef}
                                type="text"
                                value={address}
                                onChange={handleInputChange}
                                onFocus={() => {
                                    if (suggestions.length > 0) setShowSuggestions(true);
                                }}
                                placeholder="Enter an address (e.g., Brandenburg Gate, Berlin)"
                                className={`w-full p-3 pr-10 border ${isDarkMode ? 'border-gray-700 bg-gray-900 text-white' : 'border-gray-300 bg-white text-gray-900'} rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-300`}
                                onKeyDown={(e) => e.key === 'Enter' && geocodeAddress()}
                            />
                            {address && (
                                <button
                                    onClick={clearInput}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                >
                                    <X size={16} />
                                </button>
                            )}

                            {/* Suggestions dropdown */}
                            {showSuggestions && suggestions.length > 0 && (
                                <div 
                                    ref={suggestionsRef}
                                    className={`absolute z-50 w-full mt-1 rounded-md shadow-lg ${isDarkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'} max-h-60 overflow-auto`}
                                >
                                    <ul className="py-1">
                                        {suggestions.map((suggestion) => (
                                            <li 
                                                key={suggestion.place_id}
                                                onClick={() => handleSuggestionClick(suggestion)}
                                                className={`px-4 py-2 cursor-pointer flex items-start gap-2 ${isDarkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}
                                            >
                                                <MapPin size={18} className="text-green-500 mt-1 flex-shrink-0" />
                                                <span className="truncate">{suggestion.display_name}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={geocodeAddress}
                            disabled={isLoading}
                            className={`px-6 py-3 ${isDarkMode ? 'bg-green-500 hover:bg-green-400' : 'bg-green-500 hover:bg-green-600'} text-white rounded-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 flex items-center justify-center`}
                        >
                            {isLoading ? (
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : null}
                            {isLoading ? 'Searching...' : 'Find Location'}
                        </button>
                    </div>

                    {/* Map container */}
                    <div
                        ref={mapContainerRef}
                        className="w-full rounded-xl overflow-hidden border dark:border-gray-700"
                        style={{ height: "500px", position: "relative", zIndex: 10 }}
                    />

                    {result && (
                        <div className={`mt-6 p-4 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} rounded-xl ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} transition-colors duration-300`}>
                            {result}
                        </div>
                    )}
                </div>

                {/* Navigation Buttons */}
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
            <Footer />
        </div>
    );
};

export default AddressGeocoder;