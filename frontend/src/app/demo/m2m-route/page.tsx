'use client'

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Car, Clock, MapPin, Globe, AlertCircle, Sun, Moon, Users, Navigation, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { v4 as uuidv4 } from 'uuid';

// Dynamically import Leaflet with no SSR
const L = dynamic(
    () => import('leaflet').then(mod => mod.default),
    { ssr: false }
);

// Import CSS in a way that works with SSR
import 'leaflet/dist/leaflet.css';

type PickupLocation = {
    order: number;
    address: string;
    coordinates: any;
    pickupTime: string;
    readyTime: string;
};
const ManyToManyRouting: React.FC = () => {
    const mapRef = useRef<L.Map | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const routeLayerRef = useRef<L.LayerGroup | null>(null);
    const markersLayerRef = useRef<L.LayerGroup | null>(null);
    const [totalDistance, setTotalDistance] = useState<number>(0);
    const [employeeIds, setEmployeeIds] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [saveError, setSaveError] = useState<string>('');
    const [saveSuccess, setSaveSuccess] = useState<string>('');

    const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
    const [destinations, setDestinations] = useState<{ address: string; pickups: string[] }[]>([
        { address: '', pickups: [''] },
    ]);
    const [numCabs, setNumCabs] = useState<number>(1);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [routeInfo, setRouteInfo] = useState<any>(null);
    const [error, setError] = useState<string>('');
    const [autoCalculateCabs, setAutoCalculateCabs] = useState<boolean>(false);
    const [endTime, setEndTime] = useState<string>('18:00'); // Default end time
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
    <style jsx>{`
        .dot {
          transition: all 0.3s ease-in-out;
        }
      `}</style>

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
            const prefersDarkMode = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
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

    // K-means clustering algorithm
    const kMeansCluster = (points: { lat: number, lon: number }[], k: number, maxIterations = 100) => {
        if (points.length <= k) {
            return points.map(point => [point]);
        }

        // Initialize centroids randomly
        let centroids = [...points].sort(() => 0.5 - Math.random()).slice(0, k);

        let clusters: { lat: number, lon: number }[][] = [];
        let iterations = 0;
        let changed = true;

        while (changed && iterations < maxIterations) {
            // Assign each point to nearest centroid
            clusters = Array(k).fill(null).map(() => []);

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
                        clusters.push([excessPoint]);
                        centroids.push(excessPoint); // Add centroid for the new cluster
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


    // for auto-cab count
    // Function to calculate optimal number of cabs based on distance clustering
    const calculateOptimalCabCount = (points: { lat: number, lon: number }[]) => {
        if (points.length <= 1) return 1;

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

        // If most points are close together (median distance < threshold), fewer cabs needed
        // Adjust these thresholds based on your needs
        if (medianDistance < 0.01) { // ~1km
            return Math.max(1, Math.floor(points.length / 4), points.length);
        } else if (medianDistance < 0.03) { // ~3km
            return Math.max(1, Math.floor(points.length / 3));
        } else {
            return Math.min(points.length, Math.ceil(points.length / 2));
        }
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

            // Combine all pickups from all destinations for clustering
            const allPickups: { lat: number; lon: number; data: { lat: number; lon: number; display_name: string } }[] = destCoords.flatMap(dest =>
                dest.pickups.map((p: { lat: number; lon: number; display_name: string }) => ({
                    lat: p.lat,
                    lon: p.lon,
                    data: p
                }))
            );

            // Calculate optimal number of cabs if auto-calculate is enabled
            let actualCabCount = numCabs;
            if (autoCalculateCabs) {
                actualCabCount = calculateOptimalCabCount(allPickups);
                setNumCabs(actualCabCount); // Update the UI with the calculated value
            }
            actualCabCount = Math.max(actualCabCount, Math.ceil(allPickups.length / 4));

            // Update the helper function to return only HH:MM format with whole minutes
            const addMinutesToTime = (time: string, minutesToAdd: number): string => {
                const [hours, mins] = time.split(':').map(Number);
                const totalMinutes = hours * 60 + Math.floor(mins) - Math.floor(minutesToAdd);
                const newHours = Math.floor(totalMinutes / 60) % 24;
                const newMins = totalMinutes % 60;
                return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
            };

            // Cluster pickups based on number of cabs
            // Type assertion to include 'data' property for downstream usage
            interface ClusterPoint {
                lat: number;
                lon: number;
                data: {
                    lat: number;
                    lon: number;
                    display_name: string;
                };
            }

            const clusters = kMeansCluster(allPickups as ClusterPoint[], actualCabCount);

            // Calculate routes for each cluster (cab)
            const cabRoutes = await Promise.all(
                clusters.map(async (cluster, cabIndex) => {
                    // For each cab, calculate routes to all destinations
                    const cabRouteResults = await Promise.all(
                        destCoords.map(async (dest, destIndex) => {
                            // Get pickups assigned to this cab for current destination
                            // Ensure the cluster is properly typed as ClusterPoint[]
                            const cabDestPickups: { lat: number; lon: number; display_name: string }[] = (cluster as ClusterPoint[])
                                .filter((p) => dest.pickups.some(dp => dp.lat === p.lat && dp.lon === p.lon))
                                .map((p) => ({
                                    lat: p.lat,
                                    lon: p.lon,
                                    display_name: p.data.display_name, // Accessing 'data' safely
                                }));

                            if (cabDestPickups.length === 0) return null;

                            const coordinates = [
                                ...cabDestPickups.map(p => ({ lat: p.lat, lon: p.lon })),
                                { lat: dest.lat, lon: dest.lon }
                            ].map(coord => `${coord.lon},${coord.lat}`).join(';');

                            const profile = 'driving';

                            // Get distance/duration matrix from OSRM
                            const osrmTableUrl = `https://router.project-osrm.org/table/v1/${profile}/${coordinates}?annotations=duration,distance`; const tableResponse = await fetch(osrmTableUrl);
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
                            // Get ordered pickups based on the optimized route (excluding destination)
                            const orderedPickups = optimizedRoute
                                .filter((idx) => idx < cabDestPickups.length) // Exclude the destination
                                .map((routeIdx, orderIdx) => ({
                                    order: orderIdx + 1, // 1-based order
                                    address: cabDestPickups[routeIdx].display_name,
                                    coordinates: cabDestPickups[routeIdx],
                                }));

                            // Draw the route on the map
                            if (mapRef.current && routeLayerRef.current) {
                                const optimalCoordinates = optimizedRoute.map((idx) => {
                                    if (idx < cabDestPickups.length) {
                                        return cabDestPickups[idx];
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
                                        color: routeColors[cabIndex % routeColors.length], // Assign a unique color
                                        weight: 6,
                                        opacity: 0.7,
                                    },
                                }).addTo(routeLayerRef.current);
                            }

                            const pickupTimes: { pickupTime: string; readyTime: string }[] = [];
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


                            return {
                                destination: dest.display_name,
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
                            };
                        })
                    );

                    // Filter out null results (destinations with no pickups for this cab)
                    const validRoutes = cabRouteResults.filter(r => r !== null);

                    return {
                        id: cabIndex + 1,
                        color: routeColors[cabIndex % routeColors.length],
                        routes: validRoutes,
                        totalDuration: validRoutes.reduce((sum, route) => sum + (route?.totalDuration || 0), 0),
                        totalDistance: validRoutes.reduce((sum, route) => sum + (route?.totalDistance || 0), 0),
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

                    if (markersLayerRef.current) {
                        L.marker([dest.lat, dest.lon], { icon: destIcon })
                            .bindPopup(`<b>Destination ${index + 1}:</b><br>${dest.display_name}`)
                            .addTo(markersLayerRef.current)
                            .openPopup();
                    }
                });

                // Draw pickup markers based on the optimized order
                cabRoutes.forEach((cab) => {
                    cab.routes.forEach((route) => {
                        route?.orderedPickups.forEach((pickup) => {
                            const pickupIcon = L.divIcon({
                                html: `<div class="flex items-center justify-center bg-${cab.color.replace('#', '')} text-white rounded-full w-8 h-8 border-2 border-white"><span>${pickup.order}</span></div>`,
                                className: '',
                                iconSize: [32, 32],
                                iconAnchor: [16, 16],
                            });

                            if (markersLayerRef.current) {
                                L.marker([pickup.coordinates.lat, pickup.coordinates.lon], { icon: pickupIcon })
                                    .bindPopup(`<b>Cab ${cab.id}, Pickup #${pickup.order}:</b><br>${pickup.address}`)
                                    .addTo(markersLayerRef.current);
                            }
                        });
                    });
                });

                // Create an array to store all marker positions
                const markerPositions: [number, number][] = [];

                // Add destination positions
                destCoords.forEach((dest) => {
                    markerPositions.push([dest.lat, dest.lon]);
                });

                // Add all pickup positions
                clusters.forEach(cluster => {
                    cluster.forEach(pickup => {
                        markerPositions.push([pickup.lat, pickup.lon]);
                    });
                });

                // Create a bounds object from the marker positions
                const bounds = L.latLngBounds(markerPositions);

                if (bounds.isValid()) {
                    mapRef.current?.fitBounds(bounds, { padding: [50, 50] });
                }
            }

            // Display results
            setRouteInfo({
                cabs: cabRoutes.map((cabRoute) => ({
                    id: cabRoute.id,
                    color: cabRoute.color,
                    totalDuration: cabRoute.totalDuration,
                    totalDistance: cabRoute.totalDistance,
                    routes: cabRoute.routes.map(route => ({
                        destination: route?.destination || '',
                        pickups: route?.orderedPickups || [],
                        duration: route?.totalDuration || 0,
                        distance: route?.totalDistance || 0,
                    })),
                })),
                totalDuration: cabRoutes.reduce((sum, route) => sum + route.totalDuration, 0),
                totalDistance: cabRoutes.reduce((sum, route) => sum + route.totalDistance, 0),
            });
        } catch (error: any) {
            console.error('Error calculating route:', error);
            setError(error.message || 'Error calculating route. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const saveRouteToDatabase = async () => {
        if (!routeInfo) {
            setSaveError('No route to save');
            return;
        }

        if (employeeIds.length !== routeInfo.cabs.length) {
            setSaveError(`Please provide exactly ${routeInfo.cabs.length} employee IDs (one for each cab)`);
            return;
        }

        setIsSaving(true);
        setSaveError('');
        setSaveSuccess('');

        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            if (!token) throw new Error('Authentication required');

            const routeGroupId = uuidv4();
            const now = new Date();
            const currentDate = now.toISOString().split('T')[0];

            // Save each cab's route with employee data
            const savePromises = routeInfo.cabs.map(async (cab: any, cabIndex: number) => {
                const employeeId = employeeIds[cabIndex];
                if (!employeeId) throw new Error(`Missing employee ID for cab ${cab.id}`);

                return Promise.all(cab.routes.map(async (route: any) => {
                    if (!route) return null;

                    const routeEndTime = new Date(now.getTime() + route.duration * 60 * 1000);

                    interface PickupDetail {
                        address: string;
                        readyTime: string;
                        pickupTime: string;
                        coordinates: {
                            lat: number;
                            lon: number;
                            display_name?: string;
                        };
                    }

                    interface RouteDetails {
                        cabId: number;
                        color: string;
                        allPickups: PickupDetail[];
                        waypoints: string[];
                    }

                    interface RouteData {
                        routeId: string;
                        // routeGroupId?: string;
                        startTime: string;
                        endTime: string;
                        date: string;
                        source: string;
                        destination: string;
                        totalDistance: number;
                        estimatedTime: number;
                        employeeIds: string[];
                        assignedDriverId: string | null;
                        restTime: number;
                        routeDetails: string;
                    }

                    const routeData: RouteData = {
                        routeId: uuidv4(),
                        // routeGroupId: routeGroupId,
                        startTime: now.toISOString(),
                        endTime: routeEndTime.toISOString(),
                        date: currentDate,
                        source: route.pickups[0]?.address || 'Multiple Pickups',
                        destination: route.destination,
                        totalDistance: route.distance,
                        estimatedTime: route.duration,
                        employeeIds: [employeeId],
                        assignedDriverId: null,
                        restTime: 15.0,
                        routeDetails: JSON.stringify({
                            cabId: cab.id,
                            color: cab.color,
                            allPickups: route.pickups.map((p: PickupDetail) => ({
                                address: p.address,
                                readyTime: p.readyTime,
                                pickupTime: p.pickupTime,
                                coordinates: p.coordinates
                            })),
                            waypoints: route.pickups.map((p: PickupDetail) => p.address)
                        } as RouteDetails)
                    };

                    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/save-route`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(routeData)
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || `Failed to save route for cab ${cab.id}`);
                    }

                    return response.json();
                }));
            });

            const results = await Promise.all(savePromises);
            const successfulSaves = results.flat().filter(r => r !== null).length;

            setSaveSuccess(`Successfully saved ${successfulSaves} routes across ${routeInfo.cabs.length} cabs!`);
        } catch (error: any) {
            console.error('Error saving routes:', error);
            setSaveError(error.message || 'Failed to save some routes');
        } finally {
            setIsSaving(false);
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
                                    <div className="flex items-center justify-between mb-2">
                                        <label className={`block font-medium ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                                            <Users className="inline-block mr-2 text-blue-500" size={20} />
                                            Number of Cabs
                                        </label>
                                        <div className="flex items-center">
                                            <label htmlFor="autoCalculateCabs" className="flex items-center cursor-pointer">
                                                <div className="relative">
                                                    <input
                                                        type="checkbox"
                                                        id="autoCalculateCabs"
                                                        checked={autoCalculateCabs}
                                                        onChange={(e) => {
                                                            setAutoCalculateCabs(e.target.checked);
                                                            if (e.target.checked) setNumCabs(1);
                                                        }}
                                                        className="sr-only"
                                                    />
                                                    <div className={`block w-10 h-6 rounded-full ${autoCalculateCabs ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${autoCalculateCabs ? 'transform translate-x-4' : ''}`}></div>
                                                </div>
                                                <div className={`ml-2 font-medium ${autoCalculateCabs ? 'text-green-500' : isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                    Auto Calculate
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                    <input
                                        type="number"
                                        value={numCabs}
                                        onChange={(e) => {
                                            const parsed = parseInt(e.target.value, 10);
                                            const value = e.target.value;
                                            if (value === '') {
                                                setNumCabs(1);
                                                return;
                                            }
                                            setNumCabs(Number.isNaN(parsed) ? 1 : Math.max(1, parsed));
                                        }}
                                        onBlur={(e) => {
                                            if (e.target.value === '' || parseInt(e.target.value) < 1) {
                                                setNumCabs(1);
                                            }
                                        }}
                                        min="1"
                                        disabled={autoCalculateCabs}
                                        className={`w-full p-3 border ${isDarkMode ? 'border-gray-700 bg-gray-900 text-white' : 'border-gray-300 bg-white text-gray-900'} rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300 ${autoCalculateCabs ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    />
                                    <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        Each cab serves up to 4 pickups. {autoCalculateCabs && "Auto-calculated cabs enforce this limit."}
                                    </p>
                                </div>
                            </div>
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
                                <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    This is the time all cabs should arrive at their destinations
                                </p>
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

                                <div className={`mt-6 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl p-6 shadow-md`}>
                                    <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                        <Navigation className="inline-block mr-2 text-green-500" />
                                        Route Summary
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                        <div className={`p-4 rounded-lg shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                            <div className="flex items-center">
                                                <Clock className="text-green-500 mr-2" size={18} />
                                                <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Total Duration</span>
                                            </div>
                                            <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                {routeInfo.totalDuration} min
                                            </p>
                                        </div>
                                        <div className={`p-4 rounded-lg shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                            <div className="flex items-center">
                                                <MapPin className="text-green-500 mr-2" size={18} />
                                                <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Total Distance</span>
                                            </div>
                                            <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                {routeInfo.totalDistance} km
                                            </p>
                                        </div>
                                        <div className={`p-4 rounded-lg shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                            <div className="flex items-center">
                                                <Users className="text-blue-500 mr-2" size={18} />
                                                <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Number of Cabs</span>
                                            </div>
                                            <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                {numCabs}
                                                {autoCalculateCabs && (
                                                    <span className="text-xs ml-2 px-2 py-1 bg-green-100 text-green-800 rounded-full">
                                                        Auto-calculated
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <label className={`block font-medium ${isDarkMode ? 'text-white' : 'text-gray-700'} mb-2`}>
                                            Employee IDs (comma-separated, one per cab)
                                        </label>
                                        <input
                                            type="text"
                                            value={employeeIds.join(', ')}
                                            onChange={(e) => setEmployeeIds(e.target.value.split(',').map(id => id.trim()))}
                                            className={`w-full p-3 border ${isDarkMode ? 'border-gray-700 bg-gray-900 text-white' : 'border-gray-300 bg-white text-gray-900'} rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300`}
                                            placeholder="e.g. emp1, emp2, emp3"
                                        />
                                    </div>

                                    <h4 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                        <Car className="inline-block mr-2" size={18} />
                                        Cab Assignments
                                    </h4>
                                    <div className="mt-6">
                                        <button
                                            onClick={saveRouteToDatabase}
                                            disabled={isSaving}
                                            className={`w-full px-6 py-3 ${isDarkMode
                                                ? 'bg-blue-500 hover:bg-blue-400'
                                                : 'bg-blue-500 hover:bg-blue-600'
                                                } text-white rounded-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center justify-center`}
                                        >
                                            {isSaving ? (
                                                <>
                                                    <svg
                                                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Saving...
                                                </>
                                            ) : 'Save Route to Database'}
                                        </button>

                                        {saveError && (
                                            <div className="mt-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-md flex items-start gap-2">
                                                <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                                                <span>{saveError}</span>
                                            </div>
                                        )}

                                        {saveSuccess && (
                                            <div className="mt-4 p-3 bg-green-100 border border-green-200 text-green-700 rounded-md flex items-start gap-2">
                                                <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />
                                                <span>{saveSuccess}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-4">
                                        {routeInfo.cabs.map((cab: any) => (
                                            <div
                                                key={cab.id}
                                                className={`p-4 rounded-lg border-l-4 shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
                                                style={{ borderLeftColor: cab.color }}
                                            >
                                                <div className="flex justify-between items-center mb-2">
                                                    <h5 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                        <span style={{ color: cab.color }}>Cab {cab.id}</span>
                                                    </h5>
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'}`}>
                                                        {cab.totalDuration} min total
                                                    </span>
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'}`}>
                                                        {cab.totalDistance} km
                                                    </span>
                                                </div>

                                                <div className="space-y-3">
                                                    {cab.routes.map((route: any, idx: number) => (
                                                        <div key={idx} className="ml-2">
                                                            <div className="flex items-center">
                                                                <MapPin className="flex-shrink-0 text-green-500 mr-2" size={16} />
                                                                <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                                    To: {route.destination} ({route.duration} min, {route.distance} km)
                                                                </span>
                                                            </div>
                                                            <ol className="mt-1 ml-6 space-y-2">
                                                                {route.pickups.map((pickup: any) => (
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
                                                                                    <Clock className="mr-1" size={20} />
                                                                                    <span className="text-sm font-semibold">Pickup: {pickup.pickupTime}</span>
                                                                                </div>
                                                                                <div className={`flex items-center ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                                                                                    <AlertCircle className="mr-1" size={20} />
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