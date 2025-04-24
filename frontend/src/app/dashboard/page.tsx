'use client';

import React, { useState, useEffect } from 'react';
import {
    User, Settings, Navigation, Search, AlertCircle,
    MapPin, X, Truck, LogOut
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import dynamic from 'next/dynamic';

// Dynamically import LeafletMap to avoid SSR issues
const LeafletMap = dynamic(
    () => import('@/components/LeafletMap'),
    { ssr: false }
);

// Define backend user role enum to match backend
enum UserRole {
    ADMIN = "admin",
    EMPLOYEE = "employee",
    DRIVER = "driver"
}

// Define types
type EmployeeRoute = {
    routeId: string;
    source: string;
    destination: string;
    startTime: Date;
    endTime: Date;
    date: Date;
    totalDistance: number;
    estimatedTime: number;
};

// Update MapPoint to include a 'type' property to identify pickup, dropoff or waypoint
type MapPoint = {
    lat: number;
    lon: number;
    display_name: string;
    type?: 'pickup' | 'dropoff' | 'waypoint';  // Add this property
};

type RouteGeometry = {
    type: string;
    coordinates: [number, number][];
};

// User data interfaces
interface CommonUserFields {
    id: string;
    name: string;
    email: string;
    role?: UserRole;
}

interface AdminData extends CommonUserFields {
    userType: 'admin';
}

interface EmployeeData extends CommonUserFields {
    userType: 'employee';
}

interface DriverData extends CommonUserFields {
    userType: 'driver';
}

type UserData = AdminData | EmployeeData | DriverData;

export default function Dashboard() {
    const router = useRouter();
    const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Routes states
    const [showRoutes, setShowRoutes] = useState<boolean>(true); // Default to true on dashboard
    const [employeeRoutes, setEmployeeRoutes] = useState<EmployeeRoute[]>([]);
    const [driverRoutes, setDriverRoutes] = useState<EmployeeRoute[]>([]);
    const [selectedRoute, setSelectedRoute] = useState<string>('');
    const [routeLoading, setRouteLoading] = useState<boolean>(false);
    const [routeError, setRouteError] = useState<string>('');
    const [pickupPoint, setPickupPoint] = useState<MapPoint | null>(null);
    const [dropoffPoint, setDropoffPoint] = useState<MapPoint | null>(null);
    const [routeGeometry, setRouteGeometry] = useState<RouteGeometry | null>(null);
    const routeColor = '#10B981'; // Green color for route

    // Add a state for all route points to render on the map
    const [allRoutePoints, setAllRoutePoints] = useState<MapPoint[]>([]);

    // API base URL from environment variable
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
            if (prefersDarkMode) document.documentElement.classList.add('dark');
        }

        // Fetch user data and routes
        fetchUserData();
    }, []);

    const toggleTheme = () => {
        const newDarkModeValue = !isDarkMode;
        setIsDarkMode(newDarkModeValue);
        localStorage.setItem('theme', newDarkModeValue ? 'dark' : 'light');

        // Apply theme to document
        if (newDarkModeValue) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    // Get token from local storage
    const getToken = () => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('token');
        }
        return null;
    };

    // Get the current user ID from localStorage
    const getCurrentUserId = (): string | null => {
        if (typeof window !== 'undefined') {
            const user = localStorage.getItem('user');
            if (user) {
                try {
                    const userData = JSON.parse(user);
                    return userData.id;
                } catch (e) {
                    console.error('Error parsing user data from localStorage', e);
                }
            }
        }
        return null;
    };

    // Get the current user role from localStorage
    const getCurrentUserRole = (): UserRole | null => {
        if (typeof window !== 'undefined') {
            const user = localStorage.getItem('user');
            if (user) {
                try {
                    const userData = JSON.parse(user);
                    return userData.role;
                } catch (e) {
                    console.error('Error parsing user data from localStorage', e);
                }
            }
        }
        return null;
    };

    // Configure axios with auth header
    const authAxios = () => {
        const token = getToken();

        return axios.create({
            baseURL: API_URL,
            headers: {
                Authorization: token ? `Bearer ${token}` : '',
                'Content-Type': 'application/json',
            },
            timeout: 10000
        });
    };

    const fetchUserData = async () => {
        setLoading(true);
        setError(null);

        try {
            const userId = getCurrentUserId();
            const userRole = getCurrentUserRole();

            if (!userId) {
                router.push('/authentication/login');
                return;
            }

            console.log("Attempting to fetch user data for ID:", userId);
            console.log("User role:", userRole);

            // Try different endpoint patterns
            let userInfo;
            try {
                const userResponse = await authAxios().get(`/users/${userId}`);
                userInfo = userResponse.data;
            } catch (primaryError) {
                console.error("Error with /users/:id:", primaryError);
                try {
                    const authUserResponse = await authAxios().get(`/auth/users/${userId}`);
                    userInfo = authUserResponse.data;
                } catch (fallbackError) {
                    throw primaryError;
                }
            }

            console.log("User data fetched:", userInfo);

            // Format data based on user role
            let profileData: UserData;

            if (userRole === UserRole.ADMIN) {
                profileData = {
                    id: userInfo.id,
                    name: userInfo.name,
                    email: userInfo.email,
                    role: userInfo.role,
                    userType: 'admin',
                } as AdminData;
            }
            else if (userRole === UserRole.EMPLOYEE) {
                profileData = {
                    id: userInfo.id,
                    name: userInfo.name,
                    email: userInfo.email,
                    role: userInfo.role,
                    userType: 'employee',
                } as EmployeeData;

                // Fetch employee routes
                fetchEmployeeRoutes(userInfo.id);
            }
            else if (userRole === UserRole.DRIVER) {
                profileData = {
                    id: userInfo.id,
                    name: userInfo.name,
                    email: userInfo.email,
                    role: userInfo.role,
                    userType: 'driver',
                } as DriverData;

                // Fetch driver routes
                fetchDriverRoutes(userInfo.id);
            }
            else {
                throw new Error("Unknown user role");
            }

            setUserData(profileData);

        } catch (err: any) {
            console.error('Error fetching user data:', err);
            if (err.response) {
                setError(`Failed to fetch user data: ${err.response.status} ${err.response?.data?.message || ''}`);
            } else if (err.request) {
                setError("Failed to fetch user data: No response received from server");
            } else {
                setError(`Failed to fetch user data: ${err.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchDriverRoutes = async (driverId: string) => {
        try {
            setRouteLoading(true);
            setRouteError('');
            const response = await authAxios().get(`/drivers/${driverId}/routes`);

            // Transform the routes with proper date handling
            const routesWithDates = response.data.map(route => ({
                ...route,
                // Convert string dates to Date objects with fallbacks
                startTime: route.startTime ? new Date(route.startTime) : new Date(),
                endTime: route.endTime ? new Date(route.endTime) : new Date(),
                date: route.date ? new Date(route.date) : new Date(),
                // Add fallback values if needed
                totalDistance: route.totalDistance || 0,
                estimatedTime: route.estimatedTime || 0
            }));

            console.log('Processed driver routes:', routesWithDates);
            setDriverRoutes(routesWithDates);
        } catch (error: any) {
            console.error('Error fetching driver routes:', error);
            setRouteError(error.message || 'Failed to fetch driver routes');
        } finally {
            setRouteLoading(false);
        }
    };

    const fetchEmployeeRoutes = async (userId: string) => {
        try {
            setRouteLoading(true);
            setRouteError('');
            const response = await authAxios().get(`/employees/${userId}/routes`);

            // Transform the routes with proper date handling
            const routesWithDates = response.data.map(route => ({
                ...route,
                // Convert string dates to Date objects with fallbacks
                startTime: route.startTime ? new Date(route.startTime) : new Date(),
                endTime: route.endTime ? new Date(route.endTime) : new Date(),
                date: route.date ? new Date(route.date) : new Date(),
                // Add fallback values if needed
                totalDistance: route.totalDistance || 0,
                estimatedTime: route.estimatedTime || 0
            }));

            console.log('Processed employee routes:', routesWithDates);
            setEmployeeRoutes(routesWithDates);
        } catch (error: any) {
            console.error('Error fetching employee routes:', error);
            setRouteError(error.message || 'Failed to fetch routes');
        } finally {
            setRouteLoading(false);
        }
    };

    const geocodeAddress = async (address: string, pointType: 'pickup' | 'dropoff' | 'waypoint' = 'waypoint') => {
        try {
            // Handle potential multiple addresses
            if (address.includes(';')) {
                console.log(`Multiple ${pointType} addresses detected in:`, address);
                // Split the addresses but keep them all
                const addresses = address.split(';').map(addr => addr.trim()).filter(addr => addr);

                // Geocode each address
                const results: MapPoint[] = [];

                // Process addresses sequentially to avoid rate limiting
                for (let index = 0; index < addresses.length; index++) {
                    const singleAddress = addresses[index];
                    try {
                        // Determine point type for this address
                        let thisPointType = pointType;
                        if (pointType === 'pickup' && index === 0) {
                            thisPointType = 'pickup';
                        } else if (pointType === 'dropoff' && index === addresses.length - 1) {
                            thisPointType = 'dropoff';
                        } else {
                            thisPointType = 'waypoint';
                        }

                        // Try to geocode with exponential backoff
                        let attempts = 0;
                        const maxAttempts = 3;
                        let success = false;
                        let point: MapPoint | null = null;

                        while (!success && attempts < maxAttempts) {
                            try {
                                attempts++;
                                // Add delay between attempts, increasing with each retry
                                if (attempts > 1) {
                                    await new Promise(resolve => setTimeout(resolve, attempts * 500));
                                }

                                const encodedAddress = encodeURIComponent(singleAddress);
                                const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`;

                                console.log(`Geocoding address (attempt ${attempts}): ${singleAddress}`);

                                const response = await fetch(url, {
                                    headers: {
                                        'User-Agent': 'TransportEmpAttendanceSystem/1.0',
                                        'Accept-Language': 'en',
                                    },
                                });

                                if (!response.ok) {
                                    throw new Error(`HTTP error ${response.status}`);
                                }

                                const data = await response.json();
                                if (!data || data.length === 0) {
                                    throw new Error(`No results found for: ${singleAddress}`);
                                }

                                point = {
                                    lat: parseFloat(data[0].lat),
                                    lon: parseFloat(data[0].lon),
                                    display_name: data[0].display_name,
                                    type: thisPointType
                                };

                                success = true;
                            } catch (error) {
                                console.error(`Geocoding attempt ${attempts} failed:`, error);
                                // Last attempt failed, will throw error after loop
                                if (attempts >= maxAttempts) {
                                    throw error;
                                }
                            }
                        }

                        if (point) {
                            results.push(point);
                        }

                        // Add delay between addresses to avoid rate limiting
                        await new Promise(resolve => setTimeout(resolve, 1000));

                    } catch (addressError) {
                        console.error(`Error geocoding address "${singleAddress}":`, addressError);
                        // If we can't geocode an address, use a fallback approach:
                        // For Hyderabad area, use approximate coordinates with the original address as name
                        console.log(`Using fallback coordinates for: ${singleAddress}`);

                        // Random offset to separate points (within Hyderabad area)
                        const randomLat = 17.385 + (Math.random() * 0.05);
                        const randomLon = 78.486 + (Math.random() * 0.05);

                        results.push({
                            lat: randomLat,
                            lon: randomLon,
                            display_name: singleAddress, // Use original address as display name
                            type: pointType === 'pickup' && index === 0 ? 'pickup' :
                                pointType === 'dropoff' && index === addresses.length - 1 ? 'dropoff' : 'waypoint'
                        });
                    }
                }

                return results;
            }
            else {
                // Single address case
                try {
                    const encodedAddress = encodeURIComponent(address);
                    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`;

                    console.log(`Geocoding single address: ${address}`);

                    const response = await fetch(url, {
                        headers: {
                            'User-Agent': 'TransportEmpAttendanceSystem/1.0',
                            'Accept-Language': 'en',
                        },
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP error ${response.status}`);
                    }

                    const data = await response.json();
                    if (!data || data.length === 0) {
                        throw new Error(`No results found for: ${address}`);
                    }

                    const result = {
                        lat: parseFloat(data[0].lat),
                        lon: parseFloat(data[0].lon),
                        display_name: data[0].display_name,
                        type: pointType
                    };

                    // Return as array for consistent handling
                    return [result];
                } catch (singleAddressError) {
                    console.error(`Error geocoding single address "${address}":`, singleAddressError);

                    // Use fallback for Hyderabad area
                    console.log(`Using fallback coordinates for single address: ${address}`);

                    const result = {
                        lat: 17.385 + (Math.random() * 0.05),
                        lon: 78.486 + (Math.random() * 0.05),
                        display_name: address,
                        type: pointType
                    };

                    return [result];
                }
            }
        } catch (error) {
            console.error(`Unexpected error in geocodeAddress:`, error);
            throw new Error(`Failed to process addresses`);
        }
    };

    const calculateRoute = async () => {
        if (!selectedRoute || !userData) {
            setRouteError('Please select a route');
            return;
        }

        try {
            setRouteLoading(true);
            setRouteError('');

            // Clear previous map data
            setPickupPoint(null);
            setDropoffPoint(null);
            setRouteGeometry(null);
            setAllRoutePoints([]);

            // Find the selected route in the appropriate array based on user type
            const routes = userData.userType === 'employee' ? employeeRoutes : driverRoutes;
            const route = routes.find(r => r.routeId === selectedRoute);

            if (!route) {
                throw new Error('Selected route not found');
            }

            console.log("Source address:", route.source);
            console.log("Destination address:", route.destination);

            // Geocode pickup and dropoff locations with proper types
            const sourcePoints = await geocodeAddress(route.source, 'pickup');
            const destinationPoints = await geocodeAddress(route.destination, 'dropoff');

            console.log("Source points geocoded:", sourcePoints);
            console.log("Destination points geocoded:", destinationPoints);

            // For map display references, use first source and last destination
            if (sourcePoints.length > 0) {
                setPickupPoint(sourcePoints[0]);
            }

            if (destinationPoints.length > 0) {
                setDropoffPoint(destinationPoints[destinationPoints.length - 1]);
            }

            // Combine all waypoints in order (sources first, then destinations)
            const allWaypoints = [...sourcePoints, ...destinationPoints];

            // Set all waypoints for the map
            setAllRoutePoints(allWaypoints);

            // Need at least 2 points for a route
            if (allWaypoints.length < 2) {
                throw new Error('At least two valid points are needed to calculate a route');
            }

            // No need to call OSRM API for detailed routing - our LeafletMap will draw direct lines

        } catch (error: any) {
            console.error('Error processing route:', error);
            setRouteError(error.message || 'Error calculating route');
        } finally {
            setRouteLoading(false);
        }
    };

    const handleLogout = () => {
        // Clear authentication data from localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Redirect to home page
        router.push('/');
    };

    // Render the route visualization section
    const renderRouteVisualization = () => {
        if (!userData || (userData.userType !== 'employee' && userData.userType !== 'driver')) {
            return (
                <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-xl shadow-md transition-colors duration-300`}>
                    <p className={`text-center py-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Route visualization is only available for employees and drivers.
                    </p>
                </div>
            );
        }

        const routes = userData.userType === 'employee' ? employeeRoutes : driverRoutes;
        const roleTitle = userData.userType === 'employee' ? 'My Routes' : 'Assigned Routes';

        return (
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-xl shadow-md transition-colors duration-300`}>
                <div className="flex items-center justify-between mb-6">
                    <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>
                        <Navigation className="inline-block mr-2 text-green-500" />
                        {roleTitle}
                    </h3>
                </div>

                {routeLoading && !routes.length ? (
                    <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                    </div>
                ) : routes.length === 0 ? (
                    <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <Truck size={48} className="mx-auto mb-4 opacity-30" />
                        <p className="text-lg">No routes found</p>
                        <p className="text-sm mt-2">Routes assigned to you will appear here.</p>
                    </div>
                ) : (
                    <>
                        <div className="mb-6">
                            <label className={`block font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                                Select Route to Visualize
                            </label>
                            <select
                                value={selectedRoute}
                                onChange={(e) => setSelectedRoute(e.target.value)}
                                className={`w-full p-3 border ${isDarkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'} rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-300`}
                            >
                                <option value="">-- Select a route --</option>
                                {routes.map((route) => (
                                    <option key={route.routeId} value={route.routeId}>
                                        {new Date(route.date).toLocaleDateString()} - {route.source} to {route.destination}
                                    </option>
                                ))}
                            </select>

                            <button
                                onClick={calculateRoute}
                                disabled={routeLoading || !selectedRoute}
                                className={`mt-4 w-full px-4 py-2 ${isDarkMode ? 'bg-green-600 hover:bg-green-500' : 'bg-green-500 hover:bg-green-600'} text-white rounded-md transition-all duration-300 ${(!selectedRoute || routeLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {routeLoading ? 'Calculating...' : 'Visualize Route'}
                            </button>
                        </div>

                        {routeError && (
                            <div className="mb-6 p-3 bg-red-100 border border-red-200 text-red-700 rounded-md flex items-start gap-2">
                                <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                                <span>{routeError}</span>
                            </div>
                        )}

                        {/* Map visualization */}
                        <div className="w-full rounded-xl overflow-hidden border dark:border-gray-700" style={{ height: '500px' }}>
                            <LeafletMap
                                pickup={pickupPoint}
                                dropoff={dropoffPoint}
                                routeGeometry={routeGeometry}
                                routeColor={routeColor}
                                allPoints={allRoutePoints} // Pass all waypoints to the map
                            />
                        </div>

                        {/* Route details */}
                        {allRoutePoints.length > 0 && (
                            <div className={`mt-4 p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <h4 className={`font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    Route Details
                                </h4>
                                <div className="space-y-2">
                                    {allRoutePoints.map((point, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <div className={`text-white w-5 h-5 flex items-center justify-center rounded-full text-xs
                                                ${point.type === 'pickup' ? 'bg-blue-500' :
                                                    point.type === 'dropoff' ? 'bg-green-500' : 'bg-amber-500'}`}>
                                                {point.type === 'pickup' ? 'P' :
                                                    point.type === 'dropoff' ? 'D' : (index + 1)}
                                            </div>
                                            <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                {point.display_name}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Route info table */}
                        <div className="mt-6">
                            <h4 className={`font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                All {roleTitle}
                            </h4>
                            <div className="overflow-x-auto">
                                <table className={`min-w-full divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                                    <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                                        <tr>
                                            <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300 uppercase tracking-wider' : 'text-gray-500 uppercase tracking-wider'}`}>Date</th>
                                            <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300 uppercase tracking-wider' : 'text-gray-500 uppercase tracking-wider'}`}>From</th>
                                            <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300 uppercase tracking-wider' : 'text-gray-500 uppercase tracking-wider'}`}>To</th>
                                            <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300 uppercase tracking-wider' : 'text-gray-500 uppercase tracking-wider'}`}>Time</th>
                                        </tr>
                                    </thead>
                                    <tbody className={`${isDarkMode ? 'bg-gray-800 divide-y divide-gray-700' : 'bg-white divide-y divide-gray-200'}`}>
                                        {routes.map((route) => (
                                            <tr key={route.routeId} className={`${selectedRoute === route.routeId ? (isDarkMode ? 'bg-gray-700' : 'bg-green-50') : ''} hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} cursor-pointer`} onClick={() => setSelectedRoute(route.routeId)}>
                                                <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                                                    {new Date(route.date).toLocaleDateString()}
                                                </td>
                                                <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                                                    {route.source.length > 25 ? route.source.substring(0, 25) + '...' : route.source}
                                                </td>
                                                <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                                                    {route.destination.length > 25 ? route.destination.substring(0, 25) + '...' : route.destination}
                                                </td>
                                                <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                                                    {new Date(route.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
                    <p className="text-xl">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
                <div className="text-center max-w-md p-6 rounded-lg shadow-lg bg-red-50 dark:bg-red-900">
                    <div className="text-red-600 dark:text-red-200 text-5xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-red-700 dark:text-red-300 mb-2">Error Loading Dashboard</h2>
                    <p className="text-red-600 dark:text-red-200 mb-4">{error}</p>
                    <button
                        onClick={() => router.push('/')}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                        Return to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
            <Navbar isDarkMode={isDarkMode} toggleTheme={toggleTheme} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28 min-h-screen">
                {/* Dashboard header */}
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                Dashboard
                            </h1>
                            <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Welcome back, {userData?.name}! View and manage your routes here.
                            </p>
                        </div>
                        <div className="mt-4 md:mt-0 flex space-x-3">
                            <Link href="/profile" className={`px-4 py-2 rounded-md ${isDarkMode ? 'bg-blue-700 text-white hover:bg-blue-600' : 'bg-blue-600 text-white hover:bg-blue-700'} transition-colors duration-300`}>
                                <User size={16} className="inline-block mr-2" />
                                Profile
                            </Link>
                            <button
                                onClick={handleLogout}
                                className={`px-4 py-2 rounded-md ${isDarkMode ? 'bg-red-700 text-white hover:bg-red-600' : 'bg-red-500 text-white hover:bg-red-400'} transition-colors duration-300`}
                            >
                                <LogOut size={16} className="inline-block mr-2" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main dashboard content */}
                <div className="grid grid-cols-1 gap-6">
                    {/* Routes visualization */}
                    {renderRouteVisualization()}
                </div>
            </div>

            <Footer />
        </div>
    );
}
