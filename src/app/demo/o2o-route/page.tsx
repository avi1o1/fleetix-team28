'use client';

import React, { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { Globe, AlertCircle, Sun, Moon, Navigation } from 'lucide-react';
import Link from 'next/link';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';

let L: any;

if (typeof window !== 'undefined') {
    L = require('leaflet');
}

// Interface for location suggestion
interface LocationSuggestion {
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
}

const OneToOneRouting: React.FC = () => {
    const mapRef = useRef<L.Map | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const routeLayerRef = useRef<L.LayerGroup | null>(null);
    const markersLayerRef = useRef<L.LayerGroup | null>(null);

    const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
    const [source, setSource] = useState<string>('');
    const [destination, setDestination] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [routeInfo, setRouteInfo] = useState<any>(null);
    const [error, setError] = useState<string>('');

    // State for autocomplete suggestions
    const [sourceSuggestions, setSourceSuggestions] = useState<LocationSuggestion[]>([]);
    const [destinationSuggestions, setDestinationSuggestions] = useState<LocationSuggestion[]>([]);
    const [activeSuggestionField, setActiveSuggestionField] = useState<string | null>(null);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState<boolean>(false);

    // Initialize map and theme
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

            routeLayerRef.current = L.layerGroup().addTo(mapRef.current);
            markersLayerRef.current = L.layerGroup().addTo(mapRef.current);

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

    // Debounce function for search
    const debounce = (func: Function, delay: number) => {
        let timeoutId: NodeJS.Timeout;
        return (...args: any[]) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func(...args), delay);
        };
    };

    // Search for location suggestions
    const searchLocations = async (query: string): Promise<LocationSuggestion[]> => {
        if (!query.trim() || query.length < 3) return [];

        setIsLoadingSuggestions(true);

        try {
            const encodedQuery = encodeURIComponent(query);
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=5`;

            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'RoutingDemo/1.0',
                    'Accept-Language': 'en',
                }
            });

            const data = await response.json();
            setIsLoadingSuggestions(false);
            return data as LocationSuggestion[];
        } catch (error) {
            console.error('Error fetching location suggestions:', error);
            setIsLoadingSuggestions(false);
            return [];
        }
    };

    // Debounced search function
    const debouncedSearch = useRef(
        debounce(async (query: string, type: string) => {
            const suggestions = await searchLocations(query);

            if (type === 'source') {
                setSourceSuggestions(suggestions);
            } else if (type === 'destination') {
                setDestinationSuggestions(suggestions);
            }
        }, 300)
    ).current;

    // Handle source input change
    const handleSourceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSource(value);
        debouncedSearch(value, 'source');
    };

    // Handle destination input change
    const handleDestinationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setDestination(value);
        debouncedSearch(value, 'destination');
    };

    // Handle suggestion selection
    const handleSelectSuggestion = (suggestion: LocationSuggestion, type: string) => {
        if (type === 'source') {
            setSource(suggestion.display_name);
            setSourceSuggestions([]);
        } else if (type === 'destination') {
            setDestination(suggestion.display_name);
            setDestinationSuggestions([]);
        }

        setActiveSuggestionField(null);
    };

    // Handle input focus
    const handleInputFocus = (type: string) => {
        setActiveSuggestionField(type);
    };

    // Handle input blur
    const handleInputBlur = () => {
        // Use setTimeout to allow click events on suggestions to fire before clearing
        setTimeout(() => {
            setActiveSuggestionField(null);
        }, 200);
    };

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

    // Geocode an address using Nominatim
    const geocodeAddress = async (address: string) => {
        const encodedAddress = encodeURIComponent(address);
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'RoutingDemo/1.0',
                'Accept-Language': 'en',
            },
        });

        const data = await response.json();
        if (!data || data.length === 0) {
            throw new Error(`Could not geocode address: ${address}`);
        }

        return {
            lat: parseFloat(data[0].lat),
            lon: parseFloat(data[0].lon),
            display_name: data[0].display_name
        };
    };

    // Calculate route between source and destination
    const calculateRoute = async () => {
        if (!source.trim()) {
            setError('Please enter a source address');
            return;
        }

        if (!destination.trim()) {
            setError('Please enter a destination address');
            return;
        }

        setIsLoading(true);
        setError('');
        setRouteInfo(null);

        try {
            // Clear previous routes and markers
            if (routeLayerRef.current) routeLayerRef.current.clearLayers();
            if (markersLayerRef.current) markersLayerRef.current.clearLayers();

            // Geocode source and destination
            const sourceCoords = await geocodeAddress(source);
            const destCoords = await geocodeAddress(destination);

            // Create coordinates string for OSRM request
            const coordinates = `${sourceCoords.lon},${sourceCoords.lat};${destCoords.lon},${destCoords.lat}`;
            const profile = 'driving'; // Can be 'driving', 'walking', 'cycling'

            // Calculate route using OSRM
            const osrmRouteUrl = `https://router.project-osrm.org/route/v1/${profile}/${coordinates}?overview=full&geometries=geojson`;
            const response = await fetch(osrmRouteUrl);
            const data = await response.json();

            if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
                throw new Error('Could not calculate route');
            }

            // Draw markers on the map
            if (markersLayerRef.current && mapRef.current) {
                // Source marker (blue)
                const sourceIcon = L.divIcon({
                    html: `<div class="flex items-center justify-center bg-blue-500 text-white rounded-full w-8 h-8 border-2 border-white"><span>A</span></div>`,
                    className: '',
                    iconSize: [32, 32],
                    iconAnchor: [16, 16]
                });

                L.marker([sourceCoords.lat, sourceCoords.lon], { icon: sourceIcon })
                    .bindPopup(`<b>Source:</b><br>${sourceCoords.display_name}`)
                    .addTo(markersLayerRef.current);

                // Destination marker (green)
                const destIcon = L.divIcon({
                    html: `<div class="flex items-center justify-center bg-green-500 text-white rounded-full w-8 h-8 border-2 border-white"><span>B</span></div>`,
                    className: '',
                    iconSize: [32, 32],
                    iconAnchor: [16, 16]
                });

                L.marker([destCoords.lat, destCoords.lon], { icon: destIcon })
                    .bindPopup(`<b>Destination:</b><br>${destCoords.display_name}`)
                    .addTo(markersLayerRef.current);

                // Draw the route
                const routeGeoJSON = data.routes[0].geometry;
                const routeLine = L.geoJSON(routeGeoJSON, {
                    style: {
                        color: '#3388ff',
                        weight: 6,
                        opacity: 0.7
                    }
                }).addTo(routeLayerRef.current);

                // Fit map to show the route
                mapRef.current.fitBounds(routeLine.getBounds(), { padding: [50, 50] });

                // Set route info
                const distance = (data.routes[0].distance / 1000).toFixed(2); // km
                const duration = Math.round(data.routes[0].duration / 60); // minutes

                setRouteInfo({
                    distance,
                    duration,
                    source: sourceCoords.display_name,
                    destination: destCoords.display_name
                });
            }
        } catch (error: any) {
            console.error('Error calculating route:', error);
            setError(error.message || 'Error calculating route. Please try again.');
        } finally {
            setIsLoading(false);
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
                                <Navigation className="text-green-500 mr-2" />
                                FleetRouter
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
                        One-to-One
                        <span className="text-green-500"> Route Planner</span>
                    </h1>
                    <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} max-w-2xl mx-auto mb-8 transition-colors duration-300`}>
                        Calculate the shortest path between two locations
                    </p>
                </div>

                <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg transition-colors duration-300`}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="md:col-span-2">
                            <div className="space-y-4">
                                <div className="relative">
                                    <label className={`block mb-2 font-medium ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                                        <Globe className="inline-block mr-2 text-blue-500" size={20} />
                                        Source Address (A)
                                    </label>
                                    <input
                                        type="text"
                                        value={source}
                                        onChange={handleSourceChange}
                                        onFocus={() => handleInputFocus('source')}
                                        onBlur={handleInputBlur}
                                        placeholder="Enter starting location"
                                        className={`w-full p-3 border ${isDarkMode ? 'border-gray-700 bg-gray-900 text-white' : 'border-gray-300 bg-white text-gray-900'} rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300`}
                                        autoComplete="off"
                                    />

                                    {/* Source suggestions dropdown */}
                                    {activeSuggestionField === 'source' && sourceSuggestions.length > 0 && (
                                        <div className={`absolute z-50 mt-1 w-full rounded-md shadow-lg overflow-hidden ${isDarkMode ? 'bg-gray-700 border border-gray-600' : 'bg-white border border-gray-200'}`}>
                                            {isLoadingSuggestions ? (
                                                <div className={`p-3 text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                    Loading suggestions...
                                                </div>
                                            ) : (
                                                <ul className="max-h-60 overflow-auto">
                                                    {sourceSuggestions.map((suggestion) => (
                                                        <li
                                                            key={suggestion.place_id}
                                                            onClick={() => handleSelectSuggestion(suggestion, 'source')}
                                                            className={`p-3 cursor-pointer ${isDarkMode ? 'text-white hover:bg-gray-600' : 'text-gray-900 hover:bg-gray-100'}`}
                                                        >
                                                            {suggestion.display_name}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="relative">
                                    <label className={`block mb-2 font-medium ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                                        <Globe className="inline-block mr-2 text-green-500" size={20} />
                                        Destination Address (B)
                                    </label>
                                    <input
                                        type="text"
                                        value={destination}
                                        onChange={handleDestinationChange}
                                        onFocus={() => handleInputFocus('destination')}
                                        onBlur={handleInputBlur}
                                        placeholder="Enter destination address"
                                        className={`w-full p-3 border ${isDarkMode ? 'border-gray-700 bg-gray-900 text-white' : 'border-gray-300 bg-white text-gray-900'} rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-300`}
                                        autoComplete="off"
                                    />

                                    {/* Destination suggestions dropdown */}
                                    {activeSuggestionField === 'destination' && destinationSuggestions.length > 0 && (
                                        <div className={`absolute z-50 mt-1 w-full rounded-md shadow-lg overflow-hidden ${isDarkMode ? 'bg-gray-700 border border-gray-600' : 'bg-white border border-gray-200'}`}>
                                            {isLoadingSuggestions ? (
                                                <div className={`p-3 text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                    Loading suggestions...
                                                </div>
                                            ) : (
                                                <ul className="max-h-60 overflow-auto">
                                                    {destinationSuggestions.map((suggestion) => (
                                                        <li
                                                            key={suggestion.place_id}
                                                            onClick={() => handleSelectSuggestion(suggestion, 'destination')}
                                                            className={`p-3 cursor-pointer ${isDarkMode ? 'text-white hover:bg-gray-600' : 'text-gray-900 hover:bg-gray-100'}`}
                                                        >
                                                            {suggestion.display_name}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6">
                                <button
                                    onClick={calculateRoute}
                                    disabled={isLoading}
                                    className={`w-full px-6 py-3 ${isDarkMode ? 'bg-green-500 hover:bg-green-400' : 'bg-green-500 hover:bg-green-600'} text-white rounded-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 flex items-center justify-center`}
                                >
                                    {isLoading ? (
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : null}
                                    {isLoading ? 'Calculating...' : 'Calculate Route'}
                                </button>
                            </div>

                            {error && (
                                <div className="mt-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-md flex items-start gap-2">
                                    <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                                    <span>{error}</span>
                                </div>
                            )}

                            {routeInfo && (
                                <div className={`mt-4 p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-md`}>
                                    <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Route Summary</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className={`text-center p-3 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-md shadow`}>
                                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Distance</p>
                                            <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{routeInfo.distance} km</p>
                                        </div>
                                        <div className={`text-center p-3 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-md shadow`}>
                                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Duration</p>
                                            <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{routeInfo.duration} min</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 space-y-2">
                                        <div className={`p-2 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded flex items-center`}>
                                            <div className="bg-blue-500 text-white w-6 h-6 flex items-center justify-center rounded-full text-sm mr-2">A</div>
                                            <span className={`${isDarkMode ? 'text-white' : 'text-gray-900'} text-sm`}>{routeInfo.source}</span>
                                        </div>
                                        <div className={`p-2 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded flex items-center`}>
                                            <div className="bg-green-500 text-white w-6 h-6 flex items-center justify-center rounded-full text-sm mr-2">B</div>
                                            <span className={`${isDarkMode ? 'text-white' : 'text-gray-900'} text-sm`}>{routeInfo.destination}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="md:col-span-1">
                            <div className={`p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-md mb-4 max-w-md ml-auto`}>
                                <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>How It Works</h3>
                                <ol className={`list-decimal list-inside space-y-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                    <li>Enter your starting location (Point A)</li>
                                    <li>Enter your destination address (Point B)</li>
                                    <li>Click "Calculate Route" to find the shortest path</li>
                                </ol>
                            </div>

                            <div className={`p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-md`}>
                                <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Map Legend</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="bg-blue-500 text-white w-6 h-6 flex items-center justify-center rounded-full text-sm">A</div>
                                        <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Starting Point</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="bg-green-500 text-white w-6 h-6 flex items-center justify-center rounded-full text-sm">B</div>
                                        <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Destination</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="bg-blue-500 w-6 h-2 rounded"></div>
                                        <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Route Path</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div
                        ref={mapContainerRef}
                        className="w-full rounded-xl overflow-hidden border dark:border-gray-700 mt-6"
                        style={{ height: "500px" }}
                    />
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

export default OneToOneRouting;