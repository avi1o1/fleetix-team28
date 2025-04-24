'use client';
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Car, Clock, MapPin, AlertCircle, Sun, Moon, Users, Navigation, CheckCircle, ChevronLeft, Search, X, Building, Sliders } from 'lucide-react';
import Link from 'next/link';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import LocationModal from '@/components/profile/LocationModal';
import { v4 as uuidv4 } from 'uuid';


const ManageRoutes: React.FC = () => {
    const mapRef = useRef<L.Map | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const routeLayerRef = useRef<L.LayerGroup | null>(null);
    const markersLayerRef = useRef<L.LayerGroup | null>(null);
    const [totalDistance, setTotalDistance] = useState<number>(0);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [saveError, setSaveError] = useState<string>('');
    const [saveSuccess, setSaveSuccess] = useState<string>('');
    const [employeeDetails, setEmployeeDetails] = useState<any[]>([]);
    const [allEmployees, setAllEmployees] = useState<any[]>([]);
    const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
    const [isEmployeesLoading, setIsEmployeesLoading] = useState<boolean>(false);
    const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [searchQuery, setSearchQuery] = useState<string>("");

    const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
    const [numCabs, setNumCabs] = useState<number>(1);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [routeInfo, setRouteInfo] = useState<any>(null);
    const [error, setError] = useState<string>('');
    const [endTime, setEndTime] = useState<string>('10:00');
    const routeColors = [
        '#10B981', // Emerald (primary green)
        '#059669', // Slightly darker green
        '#34D399', // Lighter mint green
        '#065F46', // Deep forest green
        '#6EE7B7', // Pale teal
        '#047857', // Rich green
        '#A7F3D0', // Very light mint
        '#064E3B', // Dark pine
        '#D1FAE5'  // Off-white green
    ];

    const [destination, setDestination] = useState<string>('');
    const [maxCabs, setMaxCabs] = useState<number>(5);

    // Location modal states
    const [showLocationModal, setShowLocationModal] = useState<boolean>(false);
    const [searchAddress, setSearchAddress] = useState<string>('');
    const [selectedLocation, setSelectedLocation] = useState<any>(null);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
    const [isLocationLoading, setIsLocationLoading] = useState<boolean>(false);

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

    // Fetch all employees for dropdown
    useEffect(() => {
        const fetchAllEmployees = async () => {
            try {
                setIsEmployeesLoading(true);
                const token = localStorage.getItem('token');
                if (!token) throw new Error('Authentication required');

                const response = await fetch('http://localhost:3001/employees', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch employees');
                }

                const data = await response.json();
                setAllEmployees(data);
            } catch (error: any) {
                console.error('Error fetching employees:', error);
                setError(error.message || 'Failed to fetch employees');
            } finally {
                setIsEmployeesLoading(false);
            }
        };

        fetchAllEmployees();
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Filter employees based on search query
    const filteredEmployees = searchQuery
        ? allEmployees.filter(emp =>
            emp.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (emp.user?.name && emp.user.name.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        : allEmployees;

    const toggleEmployee = (employeeId: string) => {
        if (selectedEmployees.includes(employeeId)) {
            setSelectedEmployees(prev => prev.filter(id => id !== employeeId));
        } else {
            setSelectedEmployees(prev => [...prev, employeeId]);
        }
    };

    const removeEmployee = (employeeId: string) => {
        setSelectedEmployees(prev => prev.filter(id => id !== employeeId));
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

    // Location modal functions
    const fetchSuggestions = async (query: string) => {
        if (!query || query.length < 3) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        setIsLocationLoading(true);
        setShowSuggestions(true);

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
                {
                    headers: {
                        'Accept-Language': 'en',
                    },
                }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch location suggestions');
            }

            const data = await response.json();
            setSuggestions(data);
        } catch (error) {
            console.error('Error fetching location suggestions:', error);
            setSuggestions([]);
        } finally {
            setIsLocationLoading(false);
        }
    };

    const clearSearch = () => {
        setSearchAddress('');
        setSuggestions([]);
        setShowSuggestions(false);
    };

    const handleSuggestionClick = (suggestion: any) => {
        setSelectedLocation(suggestion);
        setSearchAddress(suggestion.display_name);
        setShowSuggestions(false);
    };

    const applySelectedLocation = () => {
        if (selectedLocation) {
            setDestination(selectedLocation.display_name);
            setShowLocationModal(false);
        }
    };

    // K-means clustering algorithm
    const kMeansCluster = (points: { lat: number, lon: number }[], k: number, maxIterations = 100) => {
        if (points.length <= k) {
            return points.map(point => [point]);
        }

        // Limit k to maxCabs
        const actualK = Math.min(k, maxCabs);

        // Initialize centroids randomly
        let centroids = [...points].sort(() => 0.5 - Math.random()).slice(0, actualK);

        let clusters: { lat: number, lon: number }[][] = [];
        let iterations = 0;
        let changed = true;

        while (changed && iterations < maxIterations) {
            // Assign each point to nearest centroid
            clusters = Array(actualK).fill(null).map(() => []);

            points.forEach(point => {
                let minDist = Infinity;
                let clusterIndex = 0;

                centroids.forEach((centroid, idx) => {
                    const dist = Math.sqrt(
                        Math.pow(point.lat - centroid.lat, 2) +
                        Math.pow(point.lon - centroid.lon, 2)
                    );
                    if (dist < minDist) {
                        minDist = dist;
                        clusterIndex = idx;
                    }
                });

                clusters[clusterIndex].push(point);
            });


            // Enforce capacity: Redistribute excess pickups to other clusters
            clusters.forEach((cluster, clusterIdx) => {
                while (cluster.length > 4) { // Cap at 4 pickups per cab
                    const excessPoint = cluster.pop()!;
                    let nextBestClusterIdx = -1;
                    let nextMinDist = Infinity;

                    // Find the nearest cluster with space
                    centroids.forEach((centroid, idx) => {
                        if (idx !== clusterIdx && clusters[idx].length < 4) {
                            const dist = Math.sqrt(
                                Math.pow(excessPoint.lat - centroid.lat, 2) +
                                Math.pow(excessPoint.lon - centroid.lon, 2)
                            );
                            if (dist < nextMinDist) {
                                nextMinDist = dist;
                                nextBestClusterIdx = idx;
                            }
                        }
                    });

                    if (nextBestClusterIdx >= 0) {
                        clusters[nextBestClusterIdx].push(excessPoint);
                    } else {
                        // If no cluster has space, force-create a new cluster (edge case)
                        // Only add if we haven't reached maxCabs
                        if (clusters.length < maxCabs) {
                            clusters.push([excessPoint]);
                            centroids.push(excessPoint); // Add centroid for the new cluster
                        } else {
                            // If we've reached max cabs, just add to the smallest cluster
                            const smallestClusterIdx = clusters
                                .map((c, i) => ({ size: c.length, index: i }))
                                .sort((a, b) => a.size - b.size)[0].index;
                            clusters[smallestClusterIdx].push(excessPoint);
                        }
                    }
                }
            });

            // Recalculate centroids
            changed = false;
            centroids = clusters.map(cluster => {
                if (cluster.length === 0) {
                    // If cluster is empty, keep previous centroid
                    return centroids[clusters.indexOf(cluster)];
                }

                const avgLat = cluster.reduce((sum, p) => sum + p.lat, 0) / cluster.length;
                const avgLon = cluster.reduce((sum, p) => sum + p.lon, 0) / cluster.length;

                const newCentroid = { lat: avgLat, lon: avgLon };
                const oldCentroid = centroids[clusters.indexOf(cluster)];

                if (Math.abs(newCentroid.lat - oldCentroid.lat) > 0.0001 ||
                    Math.abs(newCentroid.lon - oldCentroid.lon) > 0.0001) {
                    changed = true;
                }

                return newCentroid;
            });

            iterations++;
        }

        return clusters;
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
            let curr_totalDistance = 0;

            // Calculate distance from first pickup to subsequent pickups
            for (let i = 0; i < perm.length - 1; i++) {
                const fromIdx = perm[i];
                const toIdx = perm[i + 1];
                curr_totalDistance += durations[fromIdx * numLocations + toIdx];
            }

            // Add distance from last pickup to destination
            const lastPickup = perm[perm.length - 1];
            curr_totalDistance += durations[lastPickup * numLocations + destinationIdx];

            if (curr_totalDistance < bestDistance) {
                bestDistance = curr_totalDistance;
                bestRoute = [...perm];
            }
        }

        // Add destination to the end of the route
        bestRoute.push(destinationIdx);
        setTotalDistance(bestDistance);

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

    // Function to calculate optimal number of cabs based on distance clustering
    const calculateOptimalCabCount = (points: { lat: number, lon: number }[]) => {
        console.log('hiii - opt');
        if (points.length <= 1) {
            console.log('[Cab Calculation] Single point or empty, returning 1 cab');
            return 1;
        }

        // Calculate distances between all points
        const distances: number[] = [];
        for (let i = 0; i < points.length; i++) {
            for (let j = i + 1; j < points.length; j++) {
                const dist = Math.sqrt(
                    Math.pow(points[i].lat - points[j].lat, 2) +
                    Math.pow(points[i].lon - points[j].lon, 2)
                );
                distances.push(dist);
            }
        }

        // Sort distances to find median
        distances.sort((a, b) => a - b);
        const medianDistance = distances[Math.floor(distances.length / 2)];

        let cabCount: number;
        if (medianDistance < 0.01) { // ~1km
            cabCount = Math.max(1, Math.floor(points.length) / 4);
            console.log('[Cab Calculation] Close points (<1km median), cabs:', cabCount);
        } else if (medianDistance < 0.03) { // ~3km
            cabCount = Math.max(1, Math.floor(points.length) / 4);
            console.log('[Cab Calculation] Medium distance (<3km median), cabs:', cabCount);
        } else {
            cabCount = Math.min(points.length, Math.ceil(points.length));
            console.log('[Cab Calculation] Far points (≥3km median), cabs:', cabCount);
        }

        // Apply maxCabs limit
        cabCount = Math.min(cabCount, maxCabs);

        console.log('[Cab Calculation] Sample point coordinates:', {
            firstPoint: points[0],
            lastPoint: points[points.length - 1],
            distanceBetweenFirstLast: Math.sqrt(
                Math.pow(points[0].lat - points[points.length - 1].lat, 2) +
                Math.pow(points[0].lon - points[points.length - 1].lon, 2)
            )
        });

        return cabCount;
    };

    const calculateRoute = async () => {
        if (selectedEmployees.length === 0) {
            setError('Please select employees first');
            return;
        }

        if (!destination.trim()) {
            setError('Please enter a destination');
            return;
        }

        setIsLoading(true);
        setError('');
        setRouteInfo(null);

        try {
            // Clear previous routes and markers
            if (routeLayerRef.current) routeLayerRef.current.clearLayers();
            if (markersLayerRef.current) routeLayerRef.current.clearLayers();

            const token = localStorage.getItem('token');
            if (!token) throw new Error('Authentication required');

            // Fetch employee details
            const employeeData = await Promise.all(
                selectedEmployees.map(async (id) => {
                    const response = await fetch(`http://localhost:3001/employees/auth/employees/${id}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || `Failed to fetch employee ${id}`);
                    }

                    return response.json();
                })
            );

            setEmployeeDetails(employeeData);

            // Use employee pickup locations as pickup points
            const pickupLocations = employeeData.map(emp => emp.pickupLocation).filter(Boolean);

            if (pickupLocations.length === 0) {
                throw new Error('No valid pickup locations found for selected employees');
            }

            // Geocode destination
            const destCoord = await geocodeAddress(destination);

            // Geocode all pickup locations
            const pickupCoords = await Promise.all(
                pickupLocations.map(pickup => geocodeAddress(pickup))
            );

            // Combine all pickups for clustering
            const allPickups = pickupCoords.map(p => ({
                lat: p.lat,
                lon: p.lon,
                data: p
            }));

            // Calculate optimal number of cabs
            let actualCabCount = calculateOptimalCabCount(allPickups);
            setNumCabs(actualCabCount);
            actualCabCount = Math.max(actualCabCount, Math.ceil(allPickups.length / 4));

            // Apply maxCabs limit here too
            actualCabCount = Math.min(actualCabCount, maxCabs);

            const addMinutesToTime = (time: string, minutesToAdd: number): string => {
                const [hours, mins] = time.split(':').map(Number);
                const totalMinutes = hours * 60 + Math.floor(mins) - Math.floor(minutesToAdd);

                // Handle negative time (crossing midnight)
                const adjustedMinutes = (totalMinutes + 1440) % 1440; // 1440 minutes in a day

                const newHours = Math.floor(adjustedMinutes / 60) % 24;
                const newMins = adjustedMinutes % 60;

                return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
            }

            // Cluster pickups based on number of cabs
            const clusters = kMeansCluster(allPickups, actualCabCount);

            // Calculate routes for each cluster (cab)
            const cabRoutes = await Promise.all(
                clusters.map(async (cluster, cabIndex) => {
                    // Skip empty clusters
                    if (cluster.length === 0) return null;

                    const cabDestPickups = cluster.map(p => p.data);

                    const coordinates = [
                        ...cabDestPickups.map(p => ({ lat: p.lat, lon: p.lon })),
                        { lat: destCoord.lat, lon: destCoord.lon }
                    ].map(coord => `${coord.lon},${coord.lat}`).join(';');

                    const profile = 'driving';

                    // Get distance/duration matrix from OSRM
                    const osrmTableUrl = `https://router.project-osrm.org/table/v1/${profile}/${coordinates}?annotations=duration,distance`;
                    const tableResponse = await fetch(osrmTableUrl);
                    const tableData = await tableResponse.json();

                    if (tableData.code !== 'Ok' || !tableData.durations || !tableData.distances) {
                        throw new Error('Could not calculate distance matrix');
                    }

                    // Find optimal route for this cab's pickups to destination
                    const durations = tableData.durations.flat();
                    const numLocations = cabDestPickups.length + 1; // Pickups + destination
                    const optimizedRoute = findOptimalRoute(durations, numLocations);

                    // Calculate total duration for this cab (convert seconds to minutes)
                    let totalDuration = 0;
                    for (let i = 0; i < optimizedRoute.length - 1; i++) {
                        const from = optimizedRoute[i];
                        const to = optimizedRoute[i + 1];
                        totalDuration += durations[from * numLocations + to] / 60; // Convert to minutes
                    }

                    // Calculate total distance for this route (convert meters to km)
                    let totalDistance = 0;
                    for (let i = 0; i < optimizedRoute.length - 1; i++) {
                        const from = optimizedRoute[i];
                        const to = optimizedRoute[i + 1];
                        // Make sure distances exists and has the expected structure
                        if (tableData.distances && tableData.distances[from] && tableData.distances[from][to]) {
                            totalDistance += tableData.distances[from][to] / 1000; // Convert to km
                        }
                    }

                    // Draw the route on the map
                    if (mapRef.current && routeLayerRef.current) {
                        const optimalCoordinates = optimizedRoute.map((idx) => {
                            if (idx < cabDestPickups.length) {
                                return cabDestPickups[idx];
                            } else {
                                return destCoord;
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
                                color: routeColors[cabIndex % routeColors.length], // Assign a unique color
                                weight: 6,
                                opacity: 0.7,
                            },
                        }).addTo(routeLayerRef.current);
                    }

                    const pickupTimes = [];
                    let cumulativeDuration = 0;

                    // Work backwards from destination time
                    for (let i = optimizedRoute.length - 2; i >= 0; i--) {
                        const from = optimizedRoute[i];
                        const to = optimizedRoute[i + 1];
                        const segmentDuration = durations[from * numLocations + to] / 60;
                        cumulativeDuration += segmentDuration;

                        // Calculate when passenger should be ready (5 minutes before pickup)
                        const pickupTime = addMinutesToTime(endTime, cumulativeDuration);
                        const readyTime = addMinutesToTime(pickupTime, 5);

                        pickupTimes.unshift({
                            pickupTime,
                            readyTime
                        });
                    }

                    const allPickupTimes = pickupTimes.map(p => p.pickupTime);
                    const earliestPickupTime = allPickupTimes.length > 0
                        ? allPickupTimes.reduce((earliest, current) =>
                            current < earliest ? current : earliest)
                        : endTime;

                    return {
                        id: cabIndex + 1,
                        color: routeColors[cabIndex % routeColors.length],
                        destination: destCoord.display_name,
                        optimizedRoute: optimizedRoute,
                        orderedPickups: optimizedRoute
                            .filter((idx) => idx < cabDestPickups.length)
                            .map((routeIdx, orderIdx) => ({
                                order: orderIdx + 1,
                                address: cabDestPickups[routeIdx].display_name,
                                coordinates: cabDestPickups[routeIdx],
                                pickupTime: pickupTimes[orderIdx]?.pickupTime || '--:--',
                                readyTime: pickupTimes[orderIdx]?.readyTime || '--:--'
                            })),
                        totalDuration: Math.round(totalDuration),
                        totalDistance: parseFloat(totalDistance.toFixed(2)),
                        earliestPickupTime
                    };
                })
            );

            // Filter out null results
            const validRoutes = cabRoutes.filter(route => route !== null);

            // Add markers for pickup locations and destinations
            if (markersLayerRef.current && mapRef.current) {
                // Draw destination marker
                const destIcon = L.divIcon({
                    html: `<div class="flex items-center justify-center bg-green-500 text-white rounded-full w-8 h-8 border-2 border-white"><span>D</span></div>`,
                    className: '',
                    iconSize: [32, 32],
                    iconAnchor: [16, 16],
                });

                L.marker([destCoord.lat, destCoord.lon], { icon: destIcon })
                    .bindPopup(`<b>Destination:</b><br>${destCoord.display_name}`)
                    .addTo(markersLayerRef.current)
                    .openPopup();

                // Draw pickup markers based on the optimized order
                validRoutes.forEach((cab) => {
                    cab.orderedPickups.forEach((pickup) => {
                        const pickupIcon = L.divIcon({
                            html: `<div class="flex items-center justify-center bg-${cab.color.replace('#', '')} text-white rounded-full w-8 h-8 border-2 border-white"><span>${pickup.order}</span></div>`,
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

                // Add destination position
                markerPositions.push([destCoord.lat, destCoord.lon]);

                // Add all pickup positions
                clusters.forEach(cluster => {
                    cluster.forEach(pickup => {
                        markerPositions.push([pickup.lat, pickup.lon]);
                    });
                });

                // Create a bounds object from the marker positions
                const bounds = L.latLngBounds(markerPositions);

                if (!bounds.isEmpty) {
                    mapRef.current?.fitBounds(bounds, { padding: [50, 50] });
                }
            }

            // Display results
            setRouteInfo({
                destination: destCoord.display_name,
                cabs: validRoutes.map((cabRoute) => ({
                    id: cabRoute.id,
                    color: cabRoute.color,
                    totalDuration: cabRoute.totalDuration,
                    totalDistance: cabRoute.totalDistance,
                    pickups: cabRoute.orderedPickups,
                })),
                totalDuration: validRoutes.reduce((sum, route) => sum + route.totalDuration, 0),
                totalDistance: validRoutes.reduce((sum, route) => sum + route.totalDistance, 0),
            });
        } catch (error: any) {
            console.error('Error calculating route:', error);
            setError(error.message || 'Error calculating route. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Modified fetchEmployeeDetails to use selectedEmployees instead of employeeIdsInput
    const fetchEmployeeDetails = async () => {
        if (selectedEmployees.length === 0) {
            setError("Please select at least one employee");
            return;
        }

        setIsLoading(true);
        setError('');
        setRouteInfo(null);

        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Authentication required');

            const employeeData = await Promise.all(
                selectedEmployees.map(async (id) => {
                    const response = await fetch(`http://localhost:3001/employees/auth/employees/${id}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || `Failed to fetch employee ${id}`);
                    }

                    return response.json();
                })
            );

            setEmployeeDetails(employeeData);

            const destinationsMap = new Map();
            employeeData.forEach(emp => {
                if (!destinationsMap.has(emp.dropLocation)) {
                    destinationsMap.set(emp.dropLocation, {
                        address: emp.dropLocation,
                        pickups: []
                    });
                }
                destinationsMap.get(emp.dropLocation).pickups.push(emp.pickupLocation);
            });

            // Convert to array format expected by your routing system
            const newDestinations = Array.from(destinationsMap.values());
            setDestinations(newDestinations);

            // Auto-calculate number of cabs needed based on pickups
            const totalPickups = employeeData.length;
            setNumCabs(Math.ceil(totalPickups / 4)); // Assuming 4 pickups per cab max

        } catch (error: any) {
            console.error('Error fetching employee details:', error);
            setError(error.message || 'Failed to fetch employee details. Please check the selection and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const normalizeLocation = (location: string): string => {
        if (!location) return '';

        return location
            .trim()               // Remove leading/trailing whitespace
            .toLowerCase()        // Convert to lowercase
            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
            .replace(/[^a-z0-9\s]/g, '') // Remove special characters
            .replace(/(^|\s)st(\s|$)/g, ' street ')  // Replace common abbreviations
            .replace(/(^|\s)ave(\s|$)/g, ' avenue ')
            .replace(/(^|\s)rd(\s|$)/g, ' road ')
            .replace(/\bapt\b/g, 'apartment')
            .replace(/\bblvd\b/g, 'boulevard');
    };

    const isLocationMatch = (a: string, b: string) => {
        const normA = normalizeLocation(a);
        const normB = normalizeLocation(b);
        return normA.includes(normB) || normB.includes(normA);
    };

    const saveRouteToDatabase = async () => {
        if (!routeInfo || employeeDetails.length === 0) {
            setSaveError('No route or employee data to save');
            return;
        }

        setIsSaving(true);
        setSaveError('');
        setSaveSuccess('');

        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Authentication required');

            // Debug logs (keep your existing ones)
            console.log('All Employee Details:', employeeDetails);

            // Create pickup location mapping
            const pickupMap = new Map<string, { ids: string[], original: string }>();
            employeeDetails.forEach(emp => {
                if (!emp.pickupLocation) {
                    console.warn(`Employee ${emp.userId} missing pickup location`);
                    return;
                }
                const normalized = normalizeLocation(emp.pickupLocation);
                if (!pickupMap.has(normalized)) {
                    pickupMap.set(normalized, {
                        ids: [],
                        original: emp.pickupLocation
                    });
                }
                pickupMap.get(normalized)?.ids.push(emp.userId);
            });

            // Create a route group ID for all related routes
            const routeGroupId = uuidv4();
            const now = new Date();
            const currentDate = now.toISOString().split('T')[0];

            // Track driver assignment status
            let routesWithoutDrivers = 0;
            let successfulSaves = 0;

            const savePromises = routeInfo.cabs.map(cab => {
                // Match employees to pickups
                const matchedEmployees = new Set<string>();
                const usedPickups: string[] = [];

                cab.pickups.forEach(pickup => {
                    const normalizedPickup = normalizeLocation(pickup.address);
                    if (pickupMap.has(normalizedPickup)) {
                        pickupMap.get(normalizedPickup)?.ids.forEach(id => matchedEmployees.add(id));
                        usedPickups.push(pickupMap.get(normalizedPickup)?.original || pickup.address);
                        return;
                    }
                    for (const [storedPickup, data] of pickupMap.entries()) {
                        if (isLocationMatch(normalizedPickup, storedPickup)) {
                            data.ids.forEach(id => matchedEmployees.add(id));
                            usedPickups.push(data.original);
                            break;
                        }
                    }
                });

                if (matchedEmployees.size === 0) {
                    console.warn('No employees matched for pickups:', cab.pickups);
                    return Promise.resolve(null);
                }

                const allPickupTimes = cab.pickups.map(p => p.pickupTime);
                const earliestPickupTime = allPickupTimes.reduce((earliest, current) =>
                    current < earliest ? current : earliest, allPickupTimes[0]);
                const formattedTime = earliestPickupTime.includes(':')
                    ? earliestPickupTime
                    : `${earliestPickupTime.slice(0, 2)}:${earliestPickupTime.slice(2)}`;

                const startDateTime = new Date(`${currentDate}T${formattedTime}:00`);
                const routeEndTime = new Date(startDateTime.getTime() + cab.totalDuration * 60000);

                console.log('formatted time', formattedTime);
                const routeData = {
                    routeId: uuidv4(),
                    startTime: startDateTime.toISOString(),
                    endTime: routeEndTime.toISOString(),
                    date: now.toISOString(),
                    source: [...new Set(usedPickups)].join(';'),
                    destination: routeInfo.destination,
                    totalDistance: parseFloat(cab.totalDistance.toFixed(2)),
                    estimatedTime: Math.round(cab.totalDuration),
                    employeeIds: Array.from(matchedEmployees),
                    assignedDriverId: null, // Will be set by backend
                    restTime: 15.0,
                    shiftStartTime: getEarliestShiftStart(Array.from(matchedEmployees), employeeDetails),
                    shiftEndTime: getLatestShiftEnd(Array.from(matchedEmployees), employeeDetails),
                    routeDetails: JSON.stringify({
                        optimizedPickups: cab.pickups,
                        employees: Array.from(matchedEmployees).map(id => {
                            const emp = employeeDetails.find(e => e.userId === id);
                            return {
                                userId: id,
                                name: emp?.user?.name || 'Unknown',
                                pickup: emp?.pickupLocation,
                                drop: emp?.dropLocation,
                                shift: {
                                    start: emp?.shiftStartTime,
                                    end: emp?.shiftEndTime
                                }
                            };
                        })
                    })
                };

                return fetch('http://localhost:3001/auth/save-route', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(routeData)
                }).then(async response => {
                    if (!response.ok) {
                        const error = await response.json();
                        throw new Error(error.message || 'Route save failed');
                    }

                    const result = await response.json();
                    successfulSaves++;

                    // Check driver assignment
                    if (!result.driverId) {
                        routesWithoutDrivers++;
                        console.warn(`Route saved but no driver assigned for route ${result.routeId}`);
                    }

                    return result;
                });
            });

            const results = (await Promise.all(savePromises)).filter(Boolean);

            if (results.length === 0) {
                throw new Error('No routes saved - check if employee pickup locations match route pickups');
            }

            // Prepare success message with driver assignment info
            let successMessage = `Successfully saved ${successfulSaves} routes!`;
            if (routesWithoutDrivers > 0) {
                successMessage += ` (${routesWithoutDrivers} routes without assigned drivers)`;
            }

            setSaveSuccess(successMessage);
            if (results.length < routeInfo.cabs.length) {
                setSaveError(`${routeInfo.cabs.length - results.length} routes had no matching employees`);
            }

            // Firefox doesn't support smooth scrolling with scrollTo in some versions
            try {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } catch (error) {
                // Fallback for browsers that don't support smooth scrolling
                window.scrollTo(0, 0);
            }
        } catch (error: any) {
            console.error('Route save error:', error);
            setSaveError(error.message || 'Failed to save routes');
        } finally {
            setIsSaving(false);
        }
    };

    // Helper functions for shift times
    const getEarliestShiftStart = (employeeIds: string[], allEmployees: any[]) => {
        return employeeIds.reduce((earliest, id) => {
            const emp = allEmployees.find(e => e.userId === id);
            return emp?.shiftStartTime && (!earliest || emp.shiftStartTime < earliest)
                ? emp.shiftStartTime
                : earliest;
        }, null);
    };

    const getLatestShiftEnd = (employeeIds: string[], allEmployees: any[]) => {
        return employeeIds.reduce((latest, id) => {
            const emp = allEmployees.find(e => e.userId === id);
            return emp?.shiftEndTime && (!latest || emp.shiftEndTime > latest)
                ? emp.shiftEndTime
                : latest;
        }, null);
    };
    return (
        <div className={`flex flex-col min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} transition-colors duration-300`}>
            <Navbar isDarkMode={isDarkMode} toggleTheme={toggleTheme} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-20 sm:pt-28 min-h-screen">
                {/* Hero section */}
                <div className="max-w-7xl mx-auto mb-6 sm:mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                            <div className="flex items-center mb-4">
                                <Link href="/admin" className={`inline-flex items-center mr-3 ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors duration-200`}>
                                    <ChevronLeft size={18} className="mr-1" />
                                    <span className="text-sm sm:text-base">Back to Dashboard</span>
                                </Link>
                            </div>
                            <h1 className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>
                                <span className="text-green-500">Fleet</span> Management
                            </h1>
                            <p className={`mt-2 text-lg sm:text-xl ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} transition-colors duration-300`}>
                                Calculate optimal routes automatically based on employee data
                            </p>
                        </div>
                    </div>
                </div>

                {/* Status Messages */}
                {isLoading && (
                    <div className={`mb-6 p-3 sm:p-4 ${isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-700'} rounded-lg shadow-md flex items-center transition-colors duration-300`}>
                        <div className="animate-spin mr-3">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                        <span className="text-sm sm:text-base font-medium">Processing your request...</span>
                    </div>
                )}

                {error && (
                    <div className={`mb-6 p-3 sm:p-4 ${isDarkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-700'} rounded-lg shadow-md flex items-center transition-colors duration-300`}>
                        <AlertCircle className="mr-3 flex-shrink-0" size={18} />
                        <span className="text-sm sm:text-base font-medium">{error}</span>
                    </div>
                )}

                {saveError && (
                    <div className={`mb-6 p-3 sm:p-4 ${isDarkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-700'} rounded-lg shadow-md flex items-center transition-colors duration-300`}>
                        <AlertCircle className="mr-3 flex-shrink-0" size={18} />
                        <span className="text-sm sm:text-base font-medium">{saveError}</span>
                    </div>
                )}

                {saveSuccess && (
                    <div className={`mb-6 p-3 sm:p-4 ${isDarkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-700'} rounded-lg shadow-md flex items-center transition-colors duration-300`}>
                        <CheckCircle size={20} className="mr-3 flex-shrink-0" />
                        <span className="text-sm sm:text-base font-medium">{saveSuccess}</span>
                    </div>
                )}

                <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg transition-colors duration-300 mb-8`}>
                    {/* Route Configuration Section */}
                    <div className="space-y-6">
                        {/* Employee Selection */}
                        <div>
                            <label className={`block font-medium ${isDarkMode ? 'text-white' : 'text-gray-700'} mb-2`}>
                                <Users className="inline-block mr-2 text-blue-500" size={20} />
                                Select Employees for Transport
                            </label>
                            <div className="relative" ref={dropdownRef}>
                                {/* Selected employees chips */}
                                <div className={`flex flex-wrap gap-2 p-2 border rounded-md mb-2 min-h-10 ${isDarkMode ? 'border-gray-700 bg-gray-900 text-white' : 'border-gray-300 bg-white text-gray-900'}`}>
                                    {selectedEmployees.length === 0 && (
                                        <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            No employees selected
                                        </span>
                                    )}
                                    {selectedEmployees.map(empId => {
                                        const emp = allEmployees.find(e => e.userId === empId);
                                        return (
                                            <div
                                                key={empId}
                                                className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm ${isDarkMode ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-800'}`}
                                            >
                                                <span>{empId} {emp?.user?.name ? `(${emp.user.name})` : ''}</span>
                                                <button
                                                    onClick={() => removeEmployee(empId)}
                                                    className="hover:text-red-500"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Dropdown trigger */}
                                <div
                                    className={`flex items-center p-3 border rounded-md cursor-pointer ${isDarkMode ? 'border-gray-700 bg-gray-900 text-white' : 'border-gray-300 bg-white text-gray-900'}`}
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                >
                                    <Search size={18} className="mr-2 text-gray-400" />
                                    <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                        {isEmployeesLoading ? 'Loading employees...' : 'Search employees...'}
                                    </span>
                                </div>

                                {/* Dropdown menu */}
                                {dropdownOpen && (
                                    <div className={`absolute z-10 w-full mt-1 rounded-md shadow-lg ${isDarkMode ? 'bg-gray-800 text-white border border-gray-700' : 'bg-white text-gray-900 border border-gray-300'}`}>
                                        <div className="p-2">
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder="Type to filter..."
                                                className={`w-full p-2 border rounded-md ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                        <div className="max-h-60 overflow-y-auto">
                                            {isEmployeesLoading ? (
                                                <div className="p-4 text-center">Loading employees...</div>
                                            ) : filteredEmployees.length === 0 ? (
                                                <div className="p-4 text-center">No employees found</div>
                                            ) : (
                                                filteredEmployees.map(emp => (
                                                    <div
                                                        key={emp.userId}
                                                        className={`p-2 cursor-pointer flex items-center gap-2 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} ${selectedEmployees.includes(emp.userId) ? (isDarkMode ? 'bg-blue-900' : 'bg-blue-50') : ''}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleEmployee(emp.userId);
                                                        }}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedEmployees.includes(emp.userId)}
                                                            onChange={() => { }} // Handled by the parent div click
                                                            className="h-4 w-4"
                                                        />
                                                        <span className="font-medium">{emp.userId}</span>
                                                        {emp.user?.name && (
                                                            <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                                ({emp.user.name})
                                                            </span>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Select employees to transport to the destination
                            </p>
                        </div>

                        {/* Destination Input using the Modal */}
                        <div className="mb-4">
                            <label className={`block font-medium ${isDarkMode ? 'text-white' : 'text-gray-700'} mb-2`}>
                                <Building className="inline-block mr-2 text-violet-500" size={20} />
                                Destination Address
                            </label>
                            <div
                                onClick={() => setShowLocationModal(true)}
                                className={`w-full p-3 border ${isDarkMode ? 'border-gray-700 bg-gray-900 text-white' : 'border-gray-300 bg-white text-gray-900'} rounded-md cursor-pointer hover:border-green-500 transition-colors duration-300 flex items-center justify-between`}
                            >
                                <span className={destination ? '' : `${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {destination || "Click to select destination address"}
                                </span>
                                <MapPin size={18} className="text-green-500" />
                            </div>
                            <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                The location where all employees need to be transported to
                            </p>
                        </div>

                        {/* Max Cabs Slider */}
                        <div className="mb-4">
                            <label className={`block font-medium ${isDarkMode ? 'text-white' : 'text-gray-700'} mb-2`}>
                                <Sliders className="inline-block mr-2 text-yellow-500" size={20} />
                                Maximum Number of Cabs
                            </label>
                            <div className="flex items-center space-x-4">
                                <input
                                    type="range"
                                    min="1"
                                    max="10"
                                    value={maxCabs}
                                    onChange={(e) => setMaxCabs(parseInt(e.target.value))}
                                    className="flex-grow h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                                />
                                <div className={`px-4 py-2 rounded-md text-center min-w-[3rem] ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                    {maxCabs}
                                </div>
                            </div>
                            <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Limit the maximum number of cabs that can be used
                            </p>
                        </div>

                        {/* Time Input */}
                        <div className="mb-4">
                            <label className={`block font-medium ${isDarkMode ? 'text-white' : 'text-gray-700'} mb-2`}>
                                <Clock className="inline-block mr-2 text-green-500" size={20} />
                                Destination Arrival Time
                            </label>
                            <input
                                type="time"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className={`w-full p-3 border ${isDarkMode ? 'border-gray-700 bg-gray-900 text-white' : 'border-gray-300 bg-white text-gray-900'} rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-300`}
                            />
                        </div>

                        {/* Calculate Button */}
                        <div className="mt-6">
                            <button
                                onClick={calculateRoute}
                                disabled={isLoading || selectedEmployees.length === 0 || !destination.trim()}
                                className={`w-full px-6 py-3 ${(isLoading || selectedEmployees.length === 0 || !destination.trim()) ? 'bg-gray-400' : isDarkMode ? 'bg-green-500 hover:bg-green-400' : 'bg-green-500 hover:bg-green-600'} text-white rounded-md transition-all duration-300`}
                            >
                                {isLoading ? 'Calculating...' : 'Calculate Route'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Results Section */}
                {routeInfo && (
                    <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg transition-colors duration-300 mb-8`}>
                        <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            <Navigation className="inline-block mr-2 text-green-500" />
                            Route Summary
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className={`p-4 rounded-lg shadow-sm ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <div className="flex items-center">
                                    <Clock className="text-green-500 mr-2" size={18} />
                                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Total Duration</span>
                                </div>
                                <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {routeInfo.totalDuration} min
                                </p>
                            </div>
                            <div className={`p-4 rounded-lg shadow-sm ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <div className="flex items-center">
                                    <MapPin className="text-green-500 mr-2" size={18} />
                                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Total Distance</span>
                                </div>
                                <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {routeInfo.totalDistance} km
                                </p>
                            </div>
                            <div className={`p-4 rounded-lg shadow-sm ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <div className="flex items-center">
                                    <Users className="text-blue-500 mr-2" size={18} />
                                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Number of Cabs</span>
                                </div>
                                <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {routeInfo.cabs.length}
                                </p>
                            </div>
                        </div>

                        <div className={`p-4 rounded-lg shadow-sm ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} mb-6`}>
                            <div className="flex items-center">
                                <Building className="text-green-500 mr-2" size={18} />
                                <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Destination</span>
                            </div>
                            <p className={`text-lg font-medium mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {routeInfo.destination}
                            </p>
                        </div>

                        <h4 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                            <Car className="inline-block mr-2" size={18} />
                            Cab Assignments
                        </h4>

                        <div className="space-y-4">
                            {routeInfo.cabs.map((cab) => (
                                <div
                                    key={cab.id}
                                    className={`p-4 rounded-lg border-l-4 shadow-sm ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
                                    style={{ borderLeftColor: cab.color }}
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <h5 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                            <span style={{ color: cab.color }}>Cab {cab.id}</span>
                                        </h5>
                                        <div className="flex gap-2">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${isDarkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-800'}`}>
                                                {cab.totalDuration} min
                                            </span>
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${isDarkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-800'}`}>
                                                {cab.totalDistance} km
                                            </span>
                                        </div>
                                    </div>

                                    <ol className="mt-1 ml-6 space-y-2">
                                        {cab.pickups.map((pickup) => (
                                            <li
                                                key={pickup.order}
                                                className={`flex items-start ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                                            >
                                                <span className="inline-flex items-center justify-center bg-blue-500 text-white text-xs w-5 h-5 rounded-full mr-2 mt-0.5">
                                                    {pickup.order}
                                                </span>
                                                <div className="flex-1">
                                                    <div className="font-medium">{pickup.address}</div>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <div className={`flex items-center ${isDarkMode ? 'text-green-300' : 'text-green-600'}`}>
                                                            <Clock className="mr-1" size={14} />
                                                            <span className="text-sm font-semibold">Pickup: {pickup.pickupTime}</span>
                                                        </div>
                                                        <div className={`flex items-center ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                                                            <AlertCircle className="mr-1" size={14} />
                                                            <span className="text-sm font-semibold">Ready by: {pickup.readyTime}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6">
                            <button
                                onClick={saveRouteToDatabase}
                                disabled={isSaving}
                                className={`w-full px-6 py-3 ${isDarkMode ? 'bg-blue-500 hover:bg-blue-400' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded-md transition-all duration-300`}
                            >
                                {isSaving ? 'Saving...' : 'Save Route to Database'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Map Section */}
                <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg transition-colors duration-300 min-w-[1000px]`}>
                    <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        <MapPin className="inline-block mr-2 text-green-500" />
                        Route Map
                    </h3>
                    <div
                        ref={mapContainerRef}
                        className="w-full rounded-xl overflow-hidden border dark:border-gray-700"
                        style={{ height: "500px" }}
                    />
                </div>
            </div>

            {/* Location Modal */}
            <LocationModal
                isDarkMode={isDarkMode}
                showLocationModal={showLocationModal}
                setShowLocationModal={setShowLocationModal}
                locationType="dropoff"
                searchAddress={searchAddress}
                setSearchAddress={setSearchAddress}
                selectedLocation={selectedLocation}
                setSelectedLocation={setSelectedLocation}
                suggestions={suggestions}
                setSuggestions={setSuggestions}
                showSuggestions={showSuggestions}
                setShowSuggestions={setShowSuggestions}
                isLoading={isLocationLoading}
                fetchSuggestions={fetchSuggestions}
                clearSearch={clearSearch}
                handleSuggestionClick={handleSuggestionClick}
                applySelectedLocation={applySelectedLocation}
            />

            <Footer isDarkMode={isDarkMode} />
        </div>
    );
};
export default ManageRoutes;