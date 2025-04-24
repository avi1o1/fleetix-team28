'use client';

import React, { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { MapPin, Globe, AlertCircle, Sun, Moon, Users, Navigation } from 'lucide-react';
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

const ManyToOneRouting: React.FC = () => {
    const mapRef = useRef<L.Map | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const routeLayerRef = useRef<L.LayerGroup | null>(null);
    const markersLayerRef = useRef<L.LayerGroup | null>(null);

    const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
    const [destination, setDestination] = useState<string>('');
    const [pickupLocations, setPickupLocations] = useState<string[]>(['']);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [routeInfo, setRouteInfo] = useState<any>(null);
    const [error, setError] = useState<string>('');

    // State for autocomplete suggestions
    const [destinationSuggestions, setDestinationSuggestions] = useState<LocationSuggestion[]>([]);
    const [pickupSuggestions, setPickupSuggestions] = useState<LocationSuggestion[][]>([[]]);
    const [activeSuggestionField, setActiveSuggestionField] = useState<string | null>(null);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<number | null>(null);
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
        debounce(async (query: string, type: string, index?: number) => {
            const suggestions = await searchLocations(query);

            if (type === 'destination') {
                setDestinationSuggestions(suggestions);
            } else if (type === 'pickup' && index !== undefined) {
                // Create a new array with the same structure but update only the specific index
                const newPickupSuggestions = [...pickupSuggestions];
                newPickupSuggestions[index] = suggestions;
                setPickupSuggestions(newPickupSuggestions);
            }
        }, 300)
    ).current;

    // Handle destination input change
    const handleDestinationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setDestination(value);
        debouncedSearch(value, 'destination');
    };

    // Handle pickup location input change
    const handlePickupChange = (index: number, value: string) => {
        const updatedLocations = [...pickupLocations];
        updatedLocations[index] = value;
        setPickupLocations(updatedLocations);
        debouncedSearch(value, 'pickup', index);
    };

    // Handle suggestion selection
    const handleSelectSuggestion = (suggestion: LocationSuggestion, type: string, index?: number) => {
        if (type === 'destination') {
            setDestination(suggestion.display_name);
            setDestinationSuggestions([]);
        } else if (type === 'pickup' && index !== undefined) {
            const updatedLocations = [...pickupLocations];
            updatedLocations[index] = suggestion.display_name;
            setPickupLocations(updatedLocations);

            // Clear only the suggestions for this specific pickup
            const newPickupSuggestions = [...pickupSuggestions];
            newPickupSuggestions[index] = [];
            setPickupSuggestions(newPickupSuggestions);
        }

        setActiveSuggestionField(null);
        setActiveSuggestionIndex(null);
    };

    // Handle input focus
    const handleInputFocus = (type: string, index?: number) => {
        setActiveSuggestionField(type === 'destination' ? 'destination' : `pickup-${index}`);
        setActiveSuggestionIndex(index !== undefined ? index : null);
    };

    // Handle input blur
    const handleInputBlur = () => {
        // Use setTimeout to allow click events on suggestions to fire before clearing
        setTimeout(() => {
            setActiveSuggestionField(null);
            setActiveSuggestionIndex(null);
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

    const addPickupLocation = () => {
        setPickupLocations([...pickupLocations, '']);
        setPickupSuggestions([...pickupSuggestions, []]);
    };

    const removePickupLocation = (index: number) => {
        if (pickupLocations.length > 1) {
            const updatedLocations = [...pickupLocations];
            updatedLocations.splice(index, 1);
            setPickupLocations(updatedLocations);

            const updatedSuggestions = [...pickupSuggestions];
            updatedSuggestions.splice(index, 1);
            setPickupSuggestions(updatedSuggestions);
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

        console.log(`Geocoded ${address}:`, data[0]); // Log geocoded data
        return {
            lat: parseFloat(data[0].lat),
            lon: parseFloat(data[0].lon),
            display_name: data[0].display_name
        };
    };

    // Improved TSP solver using exhaustive search for smaller datasets (< 10 points)
    // and nearest neighbor with 2-opt for larger datasets
    const findOptimalRoute = (distanceMatrix: number[], numLocations: number): number[] => {
        // Extract the pickup locations (excluding destination)
        const pickupCount = numLocations - 1;

        // For small numbers of pickups (≤8), use exhaustive search for optimal solution
        if (pickupCount <= 8) {
            return findOptimalRouteExhaustive(distanceMatrix, numLocations);
        }

        // Otherwise use nearest neighbor with 2-opt improvement
        return findOptimalRouteNearestNeighbor2Opt(distanceMatrix, numLocations);
    };

    // Exhaustive search for optimal TSP solution (only for small datasets)
    const findOptimalRouteExhaustive = (distanceMatrix: number[], numLocations: number): number[] => {
        const pickupCount = numLocations - 1; // Exclude destination
        const destinationIdx = pickupCount; // Last index is destination

        // Generate all permutations of pickup locations (0 to pickupCount-1)
        const allPermutations = generatePermutations([...Array(pickupCount).keys()]);

        let bestRoute: number[] = [];
        let bestDistance = Infinity;

        // Evaluate each permutation
        for (const perm of allPermutations) {
            let totalDistance = 0;

            // Calculate distance from first pickup to subsequent pickups
            for (let i = 0; i < perm.length - 1; i++) {
                const fromIdx = perm[i];
                const toIdx = perm[i + 1];
                totalDistance += distanceMatrix[fromIdx * numLocations + toIdx];
            }

            // Add distance from last pickup to destination
            const lastPickup = perm[perm.length - 1];
            totalDistance += distanceMatrix[lastPickup * numLocations + destinationIdx];

            if (totalDistance < bestDistance) {
                bestDistance = totalDistance;
                bestRoute = [...perm];
            }
        }

        // Add destination to the end of the route
        bestRoute.push(destinationIdx);
        return bestRoute;
    };

    // Generate all permutations of an array
    const generatePermutations = (arr: number[]): number[][] => {
        if (arr.length <= 1) return [arr];

        const result: number[][] = [];

        for (let i = 0; i < arr.length; i++) {
            const current = arr[i];
            const remaining = [...arr.slice(0, i), ...arr.slice(i + 1)];
            const permsOfRemaining = generatePermutations(remaining);

            for (const perm of permsOfRemaining) {
                result.push([current, ...perm]);
            }
        }

        return result;
    };

    // Nearest Neighbor with 2-opt improvement for larger datasets
    const findOptimalRouteNearestNeighbor2Opt = (distanceMatrix: number[], numLocations: number): number[] => {
        // First get initial route using Nearest Neighbor
        const route = nearestNeighborTSP(distanceMatrix, numLocations);

        // Then improve it with 2-opt
        return twoOptImprovement(route, distanceMatrix, numLocations);
    };

    // Nearest Neighbor algorithm
    const nearestNeighborTSP = (distanceMatrix: number[], numLocations: number): number[] => {
        const pickupCount = numLocations - 1;
        const visited: boolean[] = new Array(numLocations).fill(false);
        const route: number[] = [0]; // Start with the first pickup location (index 0)
        visited[0] = true;

        // Visit all pickup locations
        for (let i = 1; i < pickupCount; i++) {
            const lastVisited = route[route.length - 1];
            let nearest = -1;
            let minDistance = Infinity;

            // Find nearest unvisited location
            for (let j = 0; j < pickupCount; j++) {
                if (!visited[j]) {
                    const dist = distanceMatrix[lastVisited * numLocations + j];
                    if (dist < minDistance) {
                        nearest = j;
                        minDistance = dist;
                    }
                }
            }

            if (nearest !== -1) {
                route.push(nearest);
                visited[nearest] = true;
            }
        }

        // Add destination as the final location
        route.push(pickupCount);

        return route;
    };

    // 2-opt improvement algorithm
    const twoOptImprovement = (route: number[], distanceMatrix: number[], numLocations: number): number[] => {
        let improved = true;
        let bestDistance = calculateRouteDistance(route, distanceMatrix, numLocations);
        let bestRoute = [...route];

        while (improved) {
            improved = false;

            // Try all possible 2-opt swaps (excluding the destination)
            for (let i = 0; i < route.length - 2; i++) {
                for (let j = i + 1; j < route.length - 1; j++) {
                    // Skip if they're adjacent
                    if (j - i === 1) continue;

                    // Create new route with 2-opt swap
                    const newRoute = twoOptSwap(bestRoute, i, j);
                    const newDistance = calculateRouteDistance(newRoute, distanceMatrix, numLocations);

                    if (newDistance < bestDistance) {
                        bestDistance = newDistance;
                        bestRoute = [...newRoute];
                        improved = true;
                        break;
                    }
                }
                if (improved) break;
            }
        }

        return bestRoute;
    };

    // Perform 2-opt swap: reverse the order of routes between i and j
    const twoOptSwap = (route: number[], i: number, j: number): number[] => {
        const newRoute = [...route];
        // Reverse the segment between positions i and j
        while (i < j) {
            const temp = newRoute[i];
            newRoute[i] = newRoute[j];
            newRoute[j] = temp;
            i++;
            j--;
        }
        return newRoute;
    };

    // Calculate total distance of a route
    const calculateRouteDistance = (route: number[], distanceMatrix: number[], numLocations: number): number => {
        let distance = 0;
        for (let i = 0; i < route.length - 1; i++) {
            const from = route[i];
            const to = route[i + 1];
            distance += distanceMatrix[from * numLocations + to];
        }
        return distance;
    };

    // Calculate route using OSRM Table and optimized routing
    const calculateRoute = async () => {
        if (!destination.trim()) {
            setError('Please enter a destination address');
            return;
        }

        if (pickupLocations.some(loc => !loc.trim())) {
            setError('Please fill in all pickup locations');
            return;
        }

        setIsLoading(true);
        setError('');
        setRouteInfo(null);

        try {
            // Clear previous routes and markers
            if (routeLayerRef.current) routeLayerRef.current.clearLayers();
            if (markersLayerRef.current) markersLayerRef.current.clearLayers();

            // Geocode destination and pickup locations
            const destCoords = await geocodeAddress(destination);
            const pickupCoords = await Promise.all(pickupLocations.map(loc => geocodeAddress(loc)));

            // Build coordinates for OSRM request
            // Important: We put pickups first, then destination
            const waypoints = [...pickupCoords, destCoords];
            const coordinates = waypoints.map(coord => `${coord.lon},${coord.lat}`).join(';');
            const profile = 'driving'; // Can be 'driving', 'walking', 'cycling'

            // Get distance/duration matrix from OSRM
            const osrmTableUrl = `https://router.project-osrm.org/table/v1/${profile}/${coordinates}`;
            const tableResponse = await fetch(osrmTableUrl);
            const tableData = await tableResponse.json();

            if (tableData.code !== 'Ok' || !tableData.durations) {
                throw new Error('Could not calculate distance matrix');
            }

            // Extract duration matrix as a flat array for the TSP algorithm
            const durations = tableData.durations.flat();
            const numLocations = waypoints.length;

            // Find optimal route order
            const optimizedRoute = findOptimalRoute(durations, numLocations);

            // Reorder pickup locations based on optimal route (excluding the destination)
            // The destination is always the last element in optimizedRoute
            const reorderedPickups = optimizedRoute
                .slice(0, -1) // Exclude destination (last element)
                .map(index => waypoints[index]);

            // Route info for display
            let totalDuration = 0;
            let routeDescription = [];

            // Calculate total duration and build route description
            for (let i = 0; i < optimizedRoute.length - 1; i++) {
                const from = optimizedRoute[i];
                const to = optimizedRoute[i + 1];
                totalDuration += durations[from * numLocations + to];

                if (i < optimizedRoute.length - 1) {
                    // This is a pickup point
                    const pickupIdx = from;
                    routeDescription.push(`Pickup ${i + 1}: ${waypoints[pickupIdx].display_name}`);
                }
            }

            // Draw markers and route
            if (markersLayerRef.current && mapRef.current) {
                // Draw destination marker
                const destIcon = L.divIcon({
                    html: `<div class="flex items-center justify-center bg-green-500 text-white rounded-full w-8 h-8 border-2 border-white"><span>D</span></div>`,
                    className: '',
                    iconSize: [32, 32],
                    iconAnchor: [16, 16]
                });

                L.marker([destCoords.lat, destCoords.lon], { icon: destIcon })
                    .bindPopup(`<b>Destination:</b><br>${destCoords.display_name}`)
                    .addTo(markersLayerRef.current)
                    .openPopup();

                // Draw pickup markers in optimal order
                reorderedPickups.forEach((coord, index) => {
                    const pickupIcon = L.divIcon({
                        html: `<div class="flex items-center justify-center bg-blue-500 text-white rounded-full w-8 h-8 border-2 border-white"><span>${index + 1}</span></div>`,
                        className: '',
                        iconSize: [32, 32],
                        iconAnchor: [16, 16]
                    });

                    L.marker([coord.lat, coord.lon], { icon: pickupIcon })
                        .bindPopup(`<b>Pickup ${index + 1}:</b><br>${coord.display_name}`)
                        .addTo(markersLayerRef.current);
                });

                // Build OSRM Route for optimal order
                // Create coordinates for the optimal route
                const optimalCoordinates = [];

                // Add all pickup locations in optimal order
                for (let i = 0; i < optimizedRoute.length - 1; i++) {
                    const idx = optimizedRoute[i];
                    optimalCoordinates.push(`${waypoints[idx].lon},${waypoints[idx].lat}`);
                }

                // Add destination last
                optimalCoordinates.push(`${destCoords.lon},${destCoords.lat}`);

                const osrmRouteUrl = `https://router.project-osrm.org/route/v1/${profile}/${optimalCoordinates.join(';')}?overview=full&geometries=geojson`;
                const routeResponse = await fetch(osrmRouteUrl);
                const routeData = await routeResponse.json();

                if (routeData.code !== 'Ok' || !routeData.routes || routeData.routes.length === 0) {
                    throw new Error('Could not calculate route');
                }

                // Draw the route
                const routeGeoJSON = routeData.routes[0].geometry;
                const routeLine = L.geoJSON(routeGeoJSON, {
                    style: {
                        color: '#3388ff',
                        weight: 6,
                        opacity: 0.7
                    }
                }).addTo(routeLayerRef.current);

                // Fit map to show all markers and route
                mapRef.current.fitBounds(routeLine.getBounds(), { padding: [50, 50] });

                // Set route info for display
                setRouteInfo({
                    distance: (routeData.routes[0].distance / 1000).toFixed(2), // km
                    duration: Math.round(routeData.routes[0].duration / 60), // minutes
                    pickupCount: reorderedPickups.length,
                    optimalOrder: routeDescription
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
                        Many-to-One
                        <span className="text-green-500"> Route Planner</span>
                    </h1>
                    <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} max-w-2xl mx-auto mb-8 transition-colors duration-300`}>
                        Calculate the optimal route from multiple pickup locations to a single destination
                    </p>
                </div>

                <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg transition-colors duration-300`}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="md:col-span-2">
                            <div className="space-y-4">
                                <div className="relative">
                                    <label className={`block mb-2 font-medium ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                                        <Globe className="inline-block mr-2 text-green-500" size={20} />
                                        Destination Address
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
                                                    {destinationSuggestions.map((suggestion, index) => (
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

                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                                            <Users className="inline-block mr-2 text-blue-500" size={20} />
                                            Pickup Locations
                                        </label>
                                        <button
                                            onClick={addPickupLocation}
                                            className="text-blue-500 hover:text-blue-700 font-medium"
                                            type="button"
                                        >
                                            + Add Location
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {pickupLocations.map((location, index) => (
                                            <div key={index} className="flex items-center gap-2 relative">
                                                <div className="flex-grow">
                                                    <div className="flex items-center">
                                                        <span className="bg-blue-500 text-white w-6 h-6 flex items-center justify-center rounded-full mr-2 flex-shrink-0 text-sm">
                                                            {index + 1}
                                                        </span>
                                                        <input
                                                            type="text"
                                                            value={location}
                                                            onChange={(e) => handlePickupChange(index, e.target.value)}
                                                            onFocus={() => handleInputFocus('pickup', index)}
                                                            onBlur={handleInputBlur}
                                                            placeholder={`Pickup location ${index + 1}`}
                                                            className={`w-full p-3 border ${isDarkMode ? 'border-gray-700 bg-gray-900 text-white' : 'border-gray-300 bg-white text-gray-900'
                                                                } rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300`}
                                                            autoComplete="off"
                                                        />
                                                    </div>

                                                    {/* 🔽 Pickup suggestions dropdown */}
                                                    {activeSuggestionField === `pickup-${index}` && pickupSuggestions[index]?.length > 0 && (
                                                        <div className={`absolute z-50 mt-1 w-full rounded-md shadow-lg overflow-hidden ${isDarkMode ? 'bg-gray-700 border border-gray-600' : 'bg-white border border-gray-200'
                                                            }`}>
                                                            {isLoadingSuggestions ? (
                                                                <div className={`p-3 text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                                                    }`}>
                                                                    Loading suggestions...
                                                                </div>
                                                            ) : (
                                                                <ul className="max-h-60 overflow-auto">
                                                                    {pickupSuggestions[index].map((suggestion) => (
                                                                        <li
                                                                            key={suggestion.place_id}
                                                                            onClick={() => handleSelectSuggestion(suggestion, 'pickup', index)}
                                                                            className={`p-3 cursor-pointer ${isDarkMode ? 'text-white hover:bg-gray-600' : 'text-gray-900 hover:bg-gray-100'
                                                                                }`}
                                                                        >
                                                                            {suggestion.display_name}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                {pickupLocations.length > 1 && (
                                                    <button
                                                        onClick={() => removePickupLocation(index)}
                                                        className="p-2 text-red-500 hover:text-red-700"
                                                        aria-label="Remove location"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        ))}

                                    </div>
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
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className={`text-center p-3 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-md shadow`}>
                                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Distance</p>
                                            <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{routeInfo.distance} km</p>
                                        </div>
                                        <div className={`text-center p-3 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-md shadow`}>
                                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Duration</p>
                                            <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{routeInfo.duration} min</p>
                                        </div>
                                        <div className={`text-center p-3 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-md shadow`}>
                                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Pickups</p>
                                            <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{routeInfo.pickupCount}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <h4 className={`text-md font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Optimal Pickup Order</h4>
                                        <ol className={`list-decimal list-inside space-y-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                            {routeInfo.optimalOrder.map((order, index) => (
                                                <li key={index}>{order}</li>
                                            ))}
                                        </ol>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="md:col-span-1">
                            <div className={`p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-md mb-4 max-w-md ml-auto`}>
                                <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>How It Works</h3>
                                <ol className={`list-decimal list-inside space-y-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                    <li>Enter your destination address</li>
                                    <li>Add one or more pickup locations</li>
                                    <li>Click "Calculate Route" to find the optimal path</li>
                                    <li>Review the route on the map and summary details</li>
                                </ol>
                            </div>

                            <div className={`p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-md`}>
                                <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Map</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="bg-blue-500 text-white w-6 h-6 flex items-center justify-center rounded-full text-sm">1</div>
                                        <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Pickup Location</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="bg-green-500 text-white w-6 h-6 flex items-center justify-center rounded-full text-sm">D</div>
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

export default ManyToOneRouting;