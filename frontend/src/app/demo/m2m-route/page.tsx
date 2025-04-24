'use client';

import React, { useEffect, useRef, useState } from 'react';
// import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Globe, AlertCircle, Sun, Moon, Users, Navigation } from 'lucide-react';
import Link from 'next/link';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';

let L: any;

if (typeof window !== 'undefined') {
    L = require('leaflet');
}

const ManyToManyRouting: React.FC = () => {
    const mapRef = useRef<L.Map | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const routeLayerRef = useRef<L.LayerGroup | null>(null);
    const markersLayerRef = useRef<L.LayerGroup | null>(null);

    const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
    const [destinations, setDestinations] = useState<{ address: string; pickups: string[] }[]>([
        { address: '', pickups: [''] },
    ]);
    const [numCabs, setNumCabs] = useState<number>(1);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [routeInfo, setRouteInfo] = useState<any>(null);
    const [error, setError] = useState<string>('');

    // Color palette for cab routes
    const routeColors = [
        '#FF0000', // Red
        '#00FF00', // Green
        '#0000FF', // Blue
        '#FF00FF', // Magenta
        '#00FFFF', // Cyan
        '#FFA500', // Orange
        '#800080', // Purple
        '#008000', // Dark Green
        '#000080', // Navy
        '#800000', // Maroon
    ];

    // Initialize map and theme
    useEffect(() => {
        // Check if window is defined (client-side only)
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

            // Initialize layers
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

    const addDestination = () => {
        setDestinations([...destinations, { address: '', pickups: [''] }]);
    };

    const removeDestination = (index: number) => {
        if (destinations.length > 1) {
            const updatedDestinations = [...destinations];
            updatedDestinations.splice(index, 1);
            setDestinations(updatedDestinations);
        }
    };

    const updateDestination = (index: number, value: string) => {
        const updatedDestinations = [...destinations];
        updatedDestinations[index].address = value;
        setDestinations(updatedDestinations);
    };

    const addPickupLocation = (destinationIndex: number) => {
        const updatedDestinations = [...destinations];
        updatedDestinations[destinationIndex].pickups.push('');
        setDestinations(updatedDestinations);
    };

    const removePickupLocation = (destinationIndex: number, pickupIndex: number) => {
        const updatedDestinations = [...destinations];
        if (updatedDestinations[destinationIndex].pickups.length > 1) {
            updatedDestinations[destinationIndex].pickups.splice(pickupIndex, 1);
            setDestinations(updatedDestinations);
        }
    };

    const updatePickupLocation = (destinationIndex: number, pickupIndex: number, value: string) => {
        const updatedDestinations = [...destinations];
        updatedDestinations[destinationIndex].pickups[pickupIndex] = value;
        setDestinations(updatedDestinations);
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
            display_name: data[0].display_name,
        };
    };
    // Find the optimal route using either exhaustive search or heuristic approach
    const findOptimalRoute = (durations: number[], numLocations: number): number[] => {
        // If there are 8 or fewer locations, use exhaustive search for the optimal solution
        if (numLocations <= 8) {
            return findOptimalRouteExhaustive(durations, numLocations);
        }

        // For larger datasets, use nearest neighbor with 2-opt improvement
        return findOptimalRouteNearestNeighbor2Opt(durations, numLocations);
    };

    // Exhaustive search for optimal TSP solution (only for small datasets)
    const findOptimalRouteExhaustive = (durations: number[], numLocations: number): number[] => {
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
                totalDistance += durations[fromIdx * numLocations + toIdx];
            }

            // Add distance from last pickup to destination
            const lastPickup = perm[perm.length - 1];
            totalDistance += durations[lastPickup * numLocations + destinationIdx];

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
    const findOptimalRouteNearestNeighbor2Opt = (durations: number[], numLocations: number): number[] => {
        // First get initial route using Nearest Neighbor
        const route = nearestNeighborTSP(durations, numLocations);

        // Then improve it with 2-opt
        return twoOptImprovement(route, durations, numLocations);
    };

    // Nearest Neighbor algorithm
    const nearestNeighborTSP = (durations: number[], numLocations: number): number[] => {
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
                    const dist = durations[lastVisited * numLocations + j];
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

    // Calculate total distance of a route
    const calculateRouteDistance = (route: number[], durations: number[], numLocations: number): number => {
        let distance = 0;
        for (let i = 0; i < route.length - 1; i++) {
            const from = route[i];
            const to = route[i + 1];
            distance += durations[from * numLocations + to];
        }
        return distance;
    };

    // 2-opt improvement algorithm
    const twoOptImprovement = (route: number[], durations: number[], numLocations: number): number[] => {
        let improved = true;
        let bestDistance = calculateRouteDistance(route, durations, numLocations);
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
                    const newDistance = calculateRouteDistance(newRoute, durations, numLocations);

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
    const calculateRoute = async () => {
        if (destinations.some((dest) => !dest.address.trim())) {
            setError('Please enter all destination addresses');
            return;
        }

        if (destinations.some((dest) => dest.pickups.some((pickup) => !pickup.trim()))) {
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

            // Geocode destinations and their pickups
            const destCoords = await Promise.all(
                destinations.map(async (dest) => ({
                    ...(await geocodeAddress(dest.address)), // Geocode the destination address
                    pickups: await Promise.all(dest.pickups.map((pickup) => geocodeAddress(pickup))), // Geocode all pickups for this destination
                }))
            );

            // Calculate routes for each destination
            const cabRoutes = await Promise.all(
                destCoords.map(async (dest, destIndex) => {
                    const coordinates = [...dest.pickups, dest].map((coord) => `${coord.lon},${coord.lat}`).join(';');
                    const profile = 'driving';

                    // Get distance/duration matrix from OSRM
                    const osrmTableUrl = `https://router.project-osrm.org/table/v1/${profile}/${coordinates}`;
                    const tableResponse = await fetch(osrmTableUrl);
                    const tableData = await tableResponse.json();

                    if (tableData.code !== 'Ok' || !tableData.durations) {
                        throw new Error('Could not calculate distance matrix');
                    }

                    // Find optimal route for this destination's pickups
                    const durations = tableData.durations.flat();
                    const numLocations = dest.pickups.length + 1; // Pickups + destination
                    const optimizedRoute = findOptimalRoute(durations, numLocations);

                    // Calculate total duration for this cab (convert seconds to minutes)
                    let totalDuration = 0;
                    for (let i = 0; i < optimizedRoute.length - 1; i++) {
                        const from = optimizedRoute[i];
                        const to = optimizedRoute[i + 1];
                        totalDuration += durations[from * numLocations + to] / 60; // Convert to minutes
                    }

                    // Get ordered pickups based on the optimized route (excluding destination)
                    const orderedPickups = optimizedRoute
                        .filter((idx) => idx < dest.pickups.length) // Exclude the destination
                        .map((routeIdx, orderIdx) => ({
                            order: orderIdx + 1, // 1-based order
                            address: dest.pickups[routeIdx].display_name,
                            coordinates: dest.pickups[routeIdx],
                        }));

                    // Draw the route on the map
                    if (mapRef.current && routeLayerRef.current) {
                        const optimalCoordinates = optimizedRoute.map((idx) => {
                            if (idx < dest.pickups.length) {
                                return dest.pickups[idx];
                            } else {
                                return dest;
                            }
                        });

                        const osrmRouteUrl = `https://router.project-osrm.org/route/v1/${profile}/${optimalCoordinates
                            .map((coord) => `${coord.lon},${coord.lat}`)
                            .join(';')}?overview=full&geometries=geojson`;
                        const routeResponse = await fetch(osrmRouteUrl);
                        const routeData = await routeResponse.json();

                        if (routeData.code !== 'Ok' || !routeData.routes || routeData.routes.length === 0) {
                            throw new Error('Could not calculate route');
                        }

                        // Draw the route with a unique color
                        const routeGeoJSON = routeData.routes[0].geometry;
                        L.geoJSON(routeGeoJSON, {
                            style: {
                                color: routeColors[destIndex % routeColors.length], // Assign a unique color
                                weight: 6,
                                opacity: 0.7,
                            },
                        }).addTo(routeLayerRef.current);
                    }

                    return {
                        id: destIndex + 1,
                        color: routeColors[destIndex % routeColors.length],
                        optimizedRoute: optimizedRoute,
                        orderedPickups: orderedPickups,
                        totalDuration: Math.round(totalDuration),
                        destination: dest.display_name,
                    };
                })
            );

            // Add markers for pickup locations and destinations
            if (markersLayerRef.current && mapRef.current) {
                // Draw destination markers
                destCoords.forEach((dest, index) => {
                    const destIcon = L.divIcon({
                        html: `<div class="flex items-center justify-center bg-green-500 text-white rounded-full w-8 h-8 border-2 border-white"><span>D${index + 1}</span></div>`,
                        className: '',
                        iconSize: [32, 32],
                        iconAnchor: [16, 16],
                    });

                    L.marker([dest.lat, dest.lon], { icon: destIcon })
                        .bindPopup(`<b>Destination ${index + 1}:</b><br>${dest.display_name}`)
                        .addTo(markersLayerRef.current)
                        .openPopup();
                });

                // Draw pickup markers based on the optimized order
                cabRoutes.forEach((cab, cabIndex) => {
                    cab.orderedPickups.forEach((pickup) => {
                        const pickupIcon = L.divIcon({
                            html: `<div class="flex items-center justify-center bg-${routeColors[cabIndex % routeColors.length] === '#FF0000' ? 'red' : 'blue'
                                }-500 text-white rounded-full w-8 h-8 border-2 border-white"><span>${pickup.order}</span></div>`,
                            className: '',
                            iconSize: [32, 32],
                            iconAnchor: [16, 16],
                        });

                        L.marker([pickup.coordinates.lat, pickup.coordinates.lon], { icon: pickupIcon })
                            .bindPopup(`<b>Cab ${cab.id}, Pickup #${pickup.order}:</b><br>${pickup.address}`)
                            .addTo(markersLayerRef.current);
                    });
                });

                // Create an array to store all marker positions
                const markerPositions = [];

                // Add destination positions
                destCoords.forEach((dest) => {
                    markerPositions.push([dest.lat, dest.lon]);
                });

                // Add all pickup positions
                destCoords.forEach((dest) => {
                    dest.pickups.forEach((pickup) => {
                        markerPositions.push([pickup.lat, pickup.lon]);
                    });
                });

                // Create a bounds object from the marker positions
                const bounds = L.latLngBounds(markerPositions);

                if (!bounds.isEmpty) {
                    mapRef.current.fitBounds(bounds, { padding: [50, 50] });
                }
            }

            // Display results
            setRouteInfo({
                cabs: cabRoutes.map((cabRoute) => ({
                    id: cabRoute.id,
                    color: cabRoute.color,
                    totalDuration: cabRoute.totalDuration,
                    pickups: cabRoute.orderedPickups,
                    destination: cabRoute.destination,
                })),
                totalDuration: cabRoutes.reduce((sum, route) => sum + route.totalDuration, 0),
            });
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
                        Many-to-Many
                        <span className="text-green-500"> Route Planner</span>
                    </h1>
                    <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} max-w-2xl mx-auto mb-8 transition-colors duration-300`}>
                        Calculate the optimal route for multiple cabs from pickup locations to multiple destinations
                    </p>
                </div>

                <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg transition-colors duration-300`}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="md:col-span-2">
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                                            <Globe className="inline-block mr-2 text-green-500" size={20} />
                                            Destination Addresses
                                        </label>
                                        <button
                                            onClick={addDestination}
                                            className="text-green-500 hover:text-green-700 font-medium"
                                            type="button"
                                        >
                                            + Add Destination
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {destinations.map((destination, destIndex) => (
                                            <div key={destIndex} className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-grow">
                                                        <div className="flex items-center">
                                                            <span className="bg-green-500 text-white w-6 h-6 flex items-center justify-center rounded-full mr-2 flex-shrink-0 text-sm">
                                                                D{destIndex + 1}
                                                            </span>
                                                            <input
                                                                type="text"
                                                                value={destination.address}
                                                                onChange={(e) => updateDestination(destIndex, e.target.value)}
                                                                placeholder={`Destination ${destIndex + 1}`}
                                                                className={`w-full p-3 border ${isDarkMode ? 'border-gray-700 bg-gray-900 text-white' : 'border-gray-300 bg-white text-gray-900'} rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-300`}
                                                            />
                                                        </div>
                                                    </div>
                                                    {destinations.length > 1 && (
                                                        <button
                                                            onClick={() => removeDestination(destIndex)}
                                                            className="p-2 text-red-500 hover:text-red-700"
                                                            aria-label="Remove destination"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <label className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                                                            <Users className="inline-block mr-2 text-blue-500" size={20} />
                                                            Pickup Locations for Destination {destIndex + 1}
                                                        </label>
                                                        <button
                                                            onClick={() => addPickupLocation(destIndex)}
                                                            className="text-blue-500 hover:text-blue-700 font-medium"
                                                            type="button"
                                                        >
                                                            + Add Pickup
                                                        </button>
                                                    </div>

                                                    {destination.pickups.map((pickup, pickupIndex) => (
                                                        <div key={pickupIndex} className="flex items-center gap-2">
                                                            <div className="flex-grow">
                                                                <div className="flex items-center">
                                                                    <span className="bg-blue-500 text-white w-6 h-6 flex items-center justify-center rounded-full mr-2 flex-shrink-0 text-sm">
                                                                        {pickupIndex + 1}
                                                                    </span>
                                                                    <input
                                                                        type="text"
                                                                        value={pickup}
                                                                        onChange={(e) => updatePickupLocation(destIndex, pickupIndex, e.target.value)}
                                                                        placeholder={`Pickup location ${pickupIndex + 1}`}
                                                                        className={`w-full p-3 border ${isDarkMode ? 'border-gray-700 bg-gray-900 text-white' : 'border-gray-300 bg-white text-gray-900'} rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300`}
                                                                    />
                                                                </div>
                                                            </div>
                                                            {destination.pickups.length > 1 && (
                                                                <button
                                                                    onClick={() => removePickupLocation(destIndex, pickupIndex)}
                                                                    className="p-2 text-red-500 hover:text-red-700"
                                                                    aria-label="Remove pickup"
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
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className={`block mb-2 font-medium ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                                        <Users className="inline-block mr-2 text-blue-500" size={20} />
                                        Number of Cabs
                                    </label>
                                    <input
                                        type="number"
                                        value={numCabs}
                                        onChange={(e) => setNumCabs(Math.max(1, parseInt(e.target.value, 10)))}
                                        min="1"
                                        className={`w-full p-3 border ${isDarkMode ? 'border-gray-700 bg-gray-900 text-white' : 'border-gray-300 bg-white text-gray-900'} rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300`}
                                    />
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

                            {/* {error && (
                                <div className="mt-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-md flex items-start gap-2">
                                    <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                                    <span>{error}</span>
                                </div>
                            )} */}

                            {routeInfo && (
                                <div className={`mt-4 p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-md`}>
                                    <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Route Summary</h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className={`text-center p-3 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-md shadow`}>
                                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Duration</p>
                                            <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{routeInfo.totalDuration} min</p>
                                        </div>
                                        <div className={`text-center p-3 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-md shadow`}>
                                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Number of Cabs</p>
                                            <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{numCabs}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <h4 className={`text-md font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Cab Routes</h4>
                                        {routeInfo.cabs.map((cab) => (
                                            <div key={cab.id} className="mb-4">
                                                <h5 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Cab {cab.id} - Destination: {cab.destination}</h5>
                                                <ol className={`list-decimal list-inside space-y-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                    {cab.pickups.map((pickup) => (
                                                        <li key={pickup.order}>{pickup.address}</li>
                                                    ))}
                                                </ol>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="md:col-span-1">
                            <div className={`p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-md mb-4 max-w-md ml-auto`}>
                                <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>How It Works</h3>
                                <ol className={`list-decimal list-inside space-y-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                    <li>Enter one or more destination addresses</li>
                                    <li>Add pickup locations for each destination</li>
                                    <li>Specify the number of cabs</li>
                                    <li>Click "Calculate Route" to find the optimal paths</li>
                                    <li>Review the routes on the map and summary details</li>
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

export default ManyToManyRouting;
