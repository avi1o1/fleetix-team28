'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { Clock, MapPin, Navigation, AlertCircle, Truck, Search, User, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import axios from 'axios';
import { useRouter } from 'next/navigation';

// Dynamically import Leaflet with ssr: false to avoid window is not defined error
const LeafletMap = dynamic(
  () => import('@/components/LeafletMap'),
  { ssr: false }
);

// Define types
type Employee = {
  userId: string;
  pickupLocation: string;
  dropLocation: string;
  shiftStartTime: Date;
  shiftEndTime: Date;
  user: {
    name: string;
    email: string;
  };
};

type AssignedRoute = {
  routeId: string;
  source: string;
  destination: string;
  startTime: Date;
  endTime: Date;
  date: Date;
  totalDistance: number;
  estimatedTime: number;
};

type RouteInfo = {
  totalDuration: number;
  totalDistance: number;
  route: {
    pickup: string;
    dropoff: string;
    duration: number;
    distance: number;
    coordinates: any;
    startTime?: string;
    endTime?: string;
  };
};

type MapPoint = {
  lat: number;
  lon: number;
  display_name: string;
};

type RouteGeometry = {
  type: string;
  coordinates: [number, number][];
};

type Waypoint = {
  lat: number;
  lon: number;
  display_name: string;
  type: 'pickup' | 'dropoff';
  order: number;
};

// Main component
const EmployeeRoutes: React.FC = () => {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [assignedRoutes, setAssignedRoutes] = useState<AssignedRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Map state properties
  const [pickupPoint, setPickupPoint] = useState<MapPoint | null>(null);
  const [dropoffPoint, setDropoffPoint] = useState<MapPoint | null>(null);
  const [routeGeometry, setRouteGeometry] = useState<RouteGeometry | null>(null);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);

  const routeColor = '#10B981'; // Green color for route

  // Map references - add these two lines
  const mapRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);

  // Initialize theme
  useEffect(() => {
    // Theme handling
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

    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      // Redirect to login if not authenticated
      router.push('/authentication/login');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      setCurrentUser(user);

      // Check if user role is admin
      if (user.role !== 'ADMIN' && user.role !== 'admin') {
        setError('Access denied. Only admins can access this page.');
        return;
      }

      // Fetch employees if user is admin
      fetchAllEmployees();
    } catch (err) {
      console.error('Error parsing user data:', err);
      router.push('/authentication/login');
    }
  }, [router]);

  // Fetch routes when employee is selected
  useEffect(() => {
    if (selectedEmployee) {
      fetchAssignedRoutes(selectedEmployee.userId);
    } else {
      setAssignedRoutes([]);
      setSelectedRoute('');
      setRouteInfo(null);

      // Clear map data
      setPickupPoint(null);
      setDropoffPoint(null);
      setRouteGeometry(null);
    }
  }, [selectedEmployee]);

  // Toggle theme function
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

  // Format time for display
  const formatTime = (dateStr: string | Date) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return "N/A";
    }
  };

  // Format date for display
  const formatDate = (dateStr: string | Date) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString();
    } catch (error) {
      return "N/A";
    }
  };

  // Fetch all employees (for admin view)
  const fetchAllEmployees = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/employees`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setEmployees(response.data);
    } catch (err: any) {
      console.error('Error fetching employees:', err);
      setError(err.message || 'Failed to fetch employees');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAssignedRoutes = async (employeeId: string) => {
    try {
      setIsLoading(true);
      setError('');
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/employees/${employeeId}/routes`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      // Transform routes with proper date handling
      const routesWithDates = response.data.map((route: any) => ({
        ...route,
        startTime: route.startTime ? new Date(route.startTime) : new Date(),
        endTime: route.endTime ? new Date(route.endTime) : new Date(),
        date: route.date ? new Date(route.date) : new Date(),
        totalDistance: route.totalDistance || 0,
        estimatedTime: route.estimatedTime || 0,
        // Parse route details if available
        parsedDetails: route.routeDetails ? JSON.parse(route.routeDetails) : null,
        // Split multi-point pickup and destinations if they exist
        pickupLocations: route.source ? route.source.split(';') : [],
        dropLocations: route.destination ? route.destination.split(';') : []
      }));

      console.log('Processed assigned routes:', routesWithDates);
      setAssignedRoutes(routesWithDates);

    } catch (err: any) {
      console.error('Error fetching assigned routes:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch assigned routes');
      setAssignedRoutes([]);
    } finally {
      setIsLoading(false);
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
      display_name: data[0].display_name,
    };
  };

  // Handle employee selection
  const handleEmployeeSelect = (employee: Employee) => {
    setSelectedEmployee(employee);
    setSelectedRoute('');
    setRouteInfo(null);

    // Clear map data
    setPickupPoint(null);
    setDropoffPoint(null);
    setRouteGeometry(null);
  };

  // Calculate route for selected employee and route
  const calculateRoute = async () => {
    if (!selectedRoute || !selectedEmployee) {
      setError('Please select an employee and a route');
      return;
    }

    setIsLoading(true);
    setError('');
    setRouteInfo(null);

    try {
      // Clear previous map data
      setPickupPoint(null);
      setDropoffPoint(null);
      setRouteGeometry(null);

      // Find the selected route
      const route = assignedRoutes.find(route => route.routeId === selectedRoute);

      if (!route) {
        throw new Error('Selected route not found');
      }

      // Parse the semicolon-separated source and destination addresses
      const pickupLocations = route.source ? route.source.split(';').map(p => p.trim()).filter(p => p) : [selectedEmployee.pickupLocation];
      const dropLocations = route.destination ? route.destination.split(';').map(d => d.trim()).filter(d => d) : [route.destination];

      console.log("Pickup locations:", pickupLocations);
      console.log("Drop locations:", dropLocations);

      // Step 1: Geocode all locations
      const pickupGeocodes = await Promise.all(pickupLocations.map(address => geocodeAddress(address)));
      const dropGeocodes = await Promise.all(dropLocations.map(address => geocodeAddress(address)));

      console.log("Geocoded pickups:", pickupGeocodes);
      console.log("Geocoded dropoffs:", dropGeocodes);

      // Step 2: Optimize pickup order if there are multiple pickups
      let orderedPickups = [...pickupGeocodes];
      let optimizedPickupIndices: number[] = [];

      if (pickupGeocodes.length > 1) {
        try {
          const profile = 'driving';
          const pickupCoordinates = pickupGeocodes.map(point => `${point.lon},${point.lat}`).join(';');
          const pickupMatrixUrl = `https://router.project-osrm.org/table/v1/${profile}/${pickupCoordinates}?annotations=duration,distance`;

          const pickupMatrixResponse = await fetch(pickupMatrixUrl);
          const pickupMatrixData = await pickupMatrixResponse.json();

          if (pickupMatrixData.code === 'Ok' && pickupMatrixData.durations) {
            // Create a flat array from the matrix for easier access
            const durations = pickupMatrixData.durations;
            const numPickups = pickupGeocodes.length;

            // Get the optimal route order for pickups using our improved TSP solver
            optimizedPickupIndices = findOptimalTSPRoute(durations, numPickups);
            console.log("Optimized pickup order:", optimizedPickupIndices);

            // Reorder the pickup geocodes based on the optimized order
            orderedPickups = optimizedPickupIndices.map(idx => ({
              ...pickupGeocodes[idx],
              originalIndex: idx
            }));
          }
        } catch (error) {
          console.error("Error optimizing pickup order:", error);
        }
      } else {
        // If there's only one pickup, add the originalIndex property
        orderedPickups = pickupGeocodes.map((geo, idx) => ({
          ...geo,
          originalIndex: idx
        }));
      }

      // Step 3: Optimize dropoff order if there are multiple dropoffs
      let orderedDropoffs = [...dropGeocodes];
      let optimizedDropoffIndices: number[] = [];

      if (dropGeocodes.length > 1) {
        try {
          const profile = 'driving';
          const dropCoordinates = dropGeocodes.map(point => `${point.lon},${point.lat}`).join(';');
          const dropMatrixUrl = `https://router.project-osrm.org/table/v1/${profile}/${dropCoordinates}?annotations=duration,distance`;

          const dropMatrixResponse = await fetch(dropMatrixUrl);
          const dropMatrixData = await dropMatrixResponse.json();

          if (dropMatrixData.code === 'Ok' && dropMatrixData.durations) {
            // Create a flat array from the matrix
            const durations = dropMatrixData.durations;
            const numDrops = dropGeocodes.length;

            // Get the optimal route order for dropoffs
            optimizedDropoffIndices = findOptimalTSPRoute(durations, numDrops);
            console.log("Optimized dropoff order:", optimizedDropoffIndices);

            // Reorder the dropoff geocodes based on the optimized order
            orderedDropoffs = optimizedDropoffIndices.map(idx => ({
              ...dropGeocodes[idx],
              originalIndex: idx
            }));
          }
        } catch (error) {
          console.error("Error optimizing dropoff order:", error);
        }
      } else {
        // If there's only one dropoff, add the originalIndex property
        orderedDropoffs = dropGeocodes.map((geo, idx) => ({
          ...geo,
          originalIndex: idx
        }));
      }

      // Step 4: Generate a complete route that goes through all optimized pickups, then all optimized dropoffs
      // First, calculate a route among all pickups
      let pickupRoute = null;
      if (orderedPickups.length > 1) {
        try {
          const profile = 'driving';
          const pickupCoordinates = orderedPickups.map(point => `${point.lon},${point.lat}`).join(';');
          const pickupRouteUrl = `https://router.project-osrm.org/route/v1/${profile}/${pickupCoordinates}?overview=full&geometries=geojson`;

          const response = await fetch(pickupRouteUrl);
          const data = await response.json();
          if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
            pickupRoute = data.routes[0];
          }
        } catch (error) {
          console.error("Error calculating pickup route:", error);
        }
      }

      // Then calculate a route among all dropoffs
      let dropoffRoute = null;
      if (orderedDropoffs.length > 1) {
        try {
          const profile = 'driving';
          const dropoffCoordinates = orderedDropoffs.map(point => `${point.lon},${point.lat}`).join(';');
          const dropoffRouteUrl = `https://router.project-osrm.org/route/v1/${profile}/${dropoffCoordinates}?overview=full&geometries=geojson`;

          const response = await fetch(dropoffRouteUrl);
          const data = await response.json();
          if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
            dropoffRoute = data.routes[0];
          }
        } catch (error) {
          console.error("Error calculating dropoff route:", error);
        }
      }

      // Finally, calculate the connecting route between the last pickup and first dropoff
      let connectingRoute = null;
      if (orderedPickups.length > 0 && orderedDropoffs.length > 0) {
        try {
          const profile = 'driving';
          const lastPickup = orderedPickups[orderedPickups.length - 1];
          const firstDropoff = orderedDropoffs[0];
          const connectingCoordinates = `${lastPickup.lon},${lastPickup.lat};${firstDropoff.lon},${firstDropoff.lat}`;
          const connectingRouteUrl = `https://router.project-osrm.org/route/v1/${profile}/${connectingCoordinates}?overview=full&geometries=geojson`;

          const response = await fetch(connectingRouteUrl);
          const data = await response.json();
          if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
            connectingRoute = data.routes[0];
          }
        } catch (error) {
          console.error("Error calculating connecting route:", error);
        }
      }

      // Step 5: Calculate the total duration and distance
      let totalDuration = 0;
      let totalDistance = 0;

      if (pickupRoute) {
        totalDuration += pickupRoute.duration / 60; // Convert to minutes
        totalDistance += pickupRoute.distance / 1000; // Convert to kilometers
      }

      if (connectingRoute) {
        totalDuration += connectingRoute.duration / 60;
        totalDistance += connectingRoute.distance / 1000;
      }

      if (dropoffRoute) {
        totalDuration += dropoffRoute.duration / 60;
        totalDistance += dropoffRoute.distance / 1000;
      }

      // If we only have one pickup and one dropoff, calculate a direct route
      if (!pickupRoute && !dropoffRoute && orderedPickups.length === 1 && orderedDropoffs.length === 1) {
        if (connectingRoute) {
          totalDuration = connectingRoute.duration / 60;
          totalDistance = connectingRoute.distance / 1000;
        }
      }

      // For visualization purposes, use the first pickup and last dropoff as primary points
      const primaryPickup = orderedPickups[0];
      const primaryDropoff = orderedDropoffs[orderedDropoffs.length - 1];

      // Step 6: Combine all route geometries for display
      let completeRouteGeometry = {
        type: "LineString",
        coordinates: []
      };

      if (pickupRoute) {
        completeRouteGeometry.coordinates = [
          ...completeRouteGeometry.coordinates,
          ...pickupRoute.geometry.coordinates
        ];
      }

      if (connectingRoute) {
        // Skip the first point if we already have points to avoid duplicates
        const connectingCoords = connectingRoute.geometry.coordinates;
        if (completeRouteGeometry.coordinates.length > 0 && connectingCoords.length > 0) {
          completeRouteGeometry.coordinates = [
            ...completeRouteGeometry.coordinates,
            ...connectingCoords.slice(1)
          ];
        } else {
          completeRouteGeometry.coordinates = [
            ...completeRouteGeometry.coordinates,
            ...connectingCoords
          ];
        }
      }

      if (dropoffRoute) {
        // Skip the first point if we already have points
        const dropoffCoords = dropoffRoute.geometry.coordinates;
        if (completeRouteGeometry.coordinates.length > 0 && dropoffCoords.length > 0) {
          completeRouteGeometry.coordinates = [
            ...completeRouteGeometry.coordinates,
            ...dropoffCoords.slice(1)
          ];
        } else {
          completeRouteGeometry.coordinates = [
            ...completeRouteGeometry.coordinates,
            ...dropoffCoords
          ];
        }
      }

      // Step 7: Set the primary pickup/dropoff for the map component
      setPickupPoint(primaryPickup);
      setDropoffPoint(primaryDropoff);
      setRouteGeometry(completeRouteGeometry as any);

      // Step 8: Set route info with all waypoints
      setRouteInfo({
        totalDuration: parseFloat(totalDuration.toFixed(1)),
        totalDistance: parseFloat(totalDistance.toFixed(2)),
        route: {
          pickup: primaryPickup.display_name,
          dropoff: primaryDropoff.display_name,
          duration: parseFloat(totalDuration.toFixed(1)),
          distance: parseFloat(totalDistance.toFixed(2)),
          coordinates: {
            pickup: primaryPickup,
            dropoff: primaryDropoff,
            allWaypoints: {
              pickups: orderedPickups.map((geo, idx) => ({
                ...geo,
                type: 'pickup',
                order: idx + 1,
                isOptimized: pickupGeocodes.length > 1 && optimizedPickupIndices.length > 0
              })),
              dropoffs: orderedDropoffs.map((geo, idx) => ({
                ...geo,
                type: 'dropoff',
                order: idx + 1,
                isOptimized: dropGeocodes.length > 1 && optimizedDropoffIndices.length > 0
              }))
            }
          },
          startTime: formatTime(route.startTime),
          endTime: formatTime(route.endTime),
          isOptimized: (pickupGeocodes.length > 1 && optimizedPickupIndices.length > 0) ||
            (dropGeocodes.length > 1 && optimizedDropoffIndices.length > 0)
        }
      });

      // Store all waypoints for the map
      const allWaypoints: Waypoint[] = [
        ...orderedPickups.map((geo, idx) => ({
          lat: geo.lat,
          lon: geo.lon,
          display_name: geo.display_name,
          type: 'pickup' as const,
          order: idx + 1
        })),
        ...orderedDropoffs.map((geo, idx) => ({
          lat: geo.lat,
          lon: geo.lon,
          display_name: geo.display_name,
          type: 'dropoff' as const,
          order: idx + 1
        }))
      ];

      setWaypoints(allWaypoints);

    } catch (error: any) {
      console.error('Error calculating route:', error);
      setError(error.message || 'Error calculating route. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Improved TSP solver using Nearest Neighbor with 2-opt improvement
  const findOptimalTSPRoute = (distanceMatrix: number[][], numLocations: number): number[] => {
    // Nearest Neighbor algorithm to generate initial solution
    const initialRoute = [];
    const visited = new Array(numLocations).fill(false);
    let currentVertex = 0; // Start from the first vertex

    initialRoute.push(currentVertex);
    visited[currentVertex] = true;

    // Find the nearest unvisited vertex
    for (let i = 1; i < numLocations; i++) {
      let minDistance = Infinity;
      let nearestVertex = -1;

      for (let j = 0; j < numLocations; j++) {
        if (!visited[j] && distanceMatrix[currentVertex][j] < minDistance) {
          minDistance = distanceMatrix[currentVertex][j];
          nearestVertex = j;
        }
      }

      if (nearestVertex !== -1) {
        currentVertex = nearestVertex;
        initialRoute.push(currentVertex);
        visited[currentVertex] = true;
      }
    }

    // Apply 2-opt improvement
    let improved = true;
    let currentRoute = [...initialRoute];
    const MAX_ITERATIONS = 100;
    let iterations = 0;

    while (improved && iterations < MAX_ITERATIONS) {
      improved = false;
      iterations++;

      for (let i = 0; i < numLocations - 2; i++) {
        for (let j = i + 2; j < numLocations; j++) {
          // Calculate current cost
          const currentCost =
            (i > 0 ? distanceMatrix[currentRoute[i - 1]][currentRoute[i]] : 0) +
            distanceMatrix[currentRoute[j - 1]][currentRoute[j]];

          // Calculate cost after 2-opt swap
          const newCost =
            (i > 0 ? distanceMatrix[currentRoute[i - 1]][currentRoute[j - 1]] : 0) +
            distanceMatrix[currentRoute[i]][currentRoute[j]];

          // If swap improves the solution
          if (newCost < currentCost) {
            // Reverse the segment between i and j-1
            const newRoute = [...currentRoute];
            let left = i;
            let right = j - 1;
            while (left < right) {
              [newRoute[left], newRoute[right]] = [newRoute[right], newRoute[left]];
              left++;
              right--;
            }

            currentRoute = newRoute;
            improved = true;
            break;
          }
        }
        if (improved) break;
      }
    }

    return currentRoute;
  };

  // Filter employees based on search query
  const filteredEmployees = employees.filter(employee => {
    if (!searchQuery) return true;

    const searchLower = searchQuery.toLowerCase();
    return (
      employee.user.name.toLowerCase().includes(searchLower) ||
      employee.user.email.toLowerCase().includes(searchLower) ||
      employee.pickupLocation.toLowerCase().includes(searchLower) ||
      employee.dropLocation.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className={`flex flex-col min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} transition-colors duration-300`}>
      {/* Navbar */}
      <Navbar isDarkMode={isDarkMode} toggleTheme={toggleTheme} />

      <div className="min-h-screen mx-auto px-2 sm:px-4 py-12 pt-28 w-full max-w-7xl">
        {/* Header section*/}
        <div className="w-full mx-auto mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center mb-4">
                <Link href="/admin" className={`inline-flex items-center mr-3 ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors duration-200`}>
                  <ChevronLeft size={20} className="mr-1" />
                  <span>Back to Dashboard</span>
                </Link>
              </div>
              <h1 className={`text-4xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>
                <span className="text-green-500">Route</span> Reports
              </h1>
              <p className={`mt-2 text-xl ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} transition-colors duration-300`}>
                View and visualize employee travel routes and logistics data
              </p>
            </div>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className={`mb-6 p-4 ${isDarkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-700'} rounded-lg shadow-md flex items-center transition-colors duration-300`}>
            <AlertCircle className="mr-3" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
          {/* Employee List Column */}
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg transition-colors duration-300 col-span-2 h-full flex flex-col`}>
            <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              <User className="inline-block mr-2 text-green-500" />
              Employee List
            </h2>

            {/* Search Bar */}
            <div className="mb-6">
              <div className={`flex items-center border rounded-md ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}>
                <Search size={18} className={`mx-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search employees..."
                  className={`flex-grow p-2 rounded-md outline-none ${isDarkMode ? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-white text-gray-900 placeholder-gray-500'}`}
                />
              </div>
            </div>

            {/* Employee Table - Fixed height container */}
            <div className="flex-grow overflow-hidden flex flex-col">
              {isLoading && !employees.length ? (
                <div className={`flex justify-center py-10 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <div className="animate-spin mr-3">
                    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                  <span>Loading employees...</span>
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className={`text-center py-10 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {searchQuery ? 'No employees match your search' : 'No employees found'}
                </div>
              ) : (
                <div className="overflow-y-auto custom-scrollbar h-[500px] flex-grow"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: isDarkMode ? '#4B5563 #1F2937' : '#D1D5DB #F3F4F6'
                  }}>
                  <table className="w-full border-separate border-spacing-y-1 px-1">
                    <thead className="sticky top-0 z-10">
                      <tr className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <th className={`pb-2 text-left font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Name</th>
                        <th className={`pb-2 text-left font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Location</th>
                        <th className="pb-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEmployees.map((employee) => (
                        <tr
                          key={employee.userId}
                          onClick={() => handleEmployeeSelect(employee)}
                          className={`cursor-pointer rounded-lg transition-all duration-200 ${selectedEmployee?.userId === employee.userId
                            ? isDarkMode ? 'bg-gray-700 ring-1 ring-green-500' : 'bg-green-50 ring-1 ring-green-500'
                            : isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                            }`}
                        >
                          <td className={`py-3 px-3 rounded-l-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            <div className="font-medium">{employee.user.name}</div>
                            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {employee.user.email}
                            </div>
                          </td>
                          <td className={`py-3 px-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            <div className="text-sm line-clamp-1" title={employee.pickupLocation}>
                              {employee.pickupLocation}
                            </div>
                          </td>
                          <td className="py-3 pr-3 text-right rounded-r-lg">
                            <button
                              className={`p-1.5 rounded-full transition-colors ${selectedEmployee?.userId === employee.userId
                                ? 'bg-green-500 text-white'
                                : isDarkMode ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                }`}
                            >
                              <Navigation size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Route Details Column */}
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg transition-colors duration-300 col-span-5 flex flex-col`}>
            {!selectedEmployee ? (
              <div className={`text-center py-16 flex-grow flex flex-col items-center justify-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <Truck size={48} className="mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-medium mb-2">Select an employee to view routes</h3>
                <p>Route information and maps will appear here</p>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                {/* Employee info header - fixed height */}
                <div className={`mb-6 pb-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {selectedEmployee.user.name}
                  </h2>
                  <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {selectedEmployee.user.email}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <div className="flex items-center">
                        <MapPin className="text-blue-500 mr-2" size={18} />
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Pickup Location</span>
                      </div>
                      <p className={`mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'} text-sm`}>
                        {selectedEmployee.pickupLocation}
                      </p>
                    </div>
                    <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <div className="flex items-center">
                        <MapPin className="text-blue-500 mr-2" size={18} />
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Drop Location</span>
                      </div>
                      <p className={`mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'} text-sm`}>
                        {selectedEmployee.dropLocation}
                      </p>
                    </div>
                    <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <div className="flex items-center">
                        <Clock className="text-green-500 mr-2" size={18} />
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Shift Start</span>
                      </div>
                      <p className={`mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'} text-sm`}>
                        {formatTime(selectedEmployee.shiftStartTime)}
                      </p>
                    </div>
                    <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <div className="flex items-center">
                        <Clock className="text-red-500 mr-2" size={18} />
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Shift End</span>
                      </div>
                      <p className={`mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'} text-sm`}>
                        {formatTime(selectedEmployee.shiftEndTime)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Route selection - fixed height */}
                <div className="mb-6">
                  <label className={`block font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                    <Truck className="inline-block mr-2 text-blue-500" size={20} />
                    Select Route to Visualize
                  </label>

                  {isLoading ? (
                    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} text-center`}>
                      <div className="flex justify-center items-center">
                        <div className="animate-spin mr-3">
                          <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </div>
                        <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading routes...</p>
                      </div>
                    </div>
                  ) : assignedRoutes.length === 0 ? (
                    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} text-center`}>
                      <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>No routes assigned to this employee.</p>
                    </div>
                  ) : (
                    <>
                      <select
                        value={selectedRoute}
                        onChange={(e) => setSelectedRoute(e.target.value)}
                        className={`w-full p-3 border ${isDarkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'} rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-300`}
                      >
                        <option value="">-- Select a route --</option>
                        {assignedRoutes.map((route) => (
                          <option key={route.routeId} value={route.routeId}>
                            {formatDate(route.date)} - {route.source} to {route.destination}
                          </option>
                        ))}
                      </select>

                      <div className="mt-4">
                        <button
                          onClick={calculateRoute}
                          disabled={isLoading || !selectedRoute}
                          className={`w-full px-6 py-3 ${isDarkMode ? 'bg-green-500 hover:bg-green-400' : 'bg-green-500 hover:bg-green-600'} text-white rounded-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 flex items-center justify-center ${(!selectedRoute || isLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {isLoading ? (
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : null}
                          {isLoading ? 'Calculating...' : 'Visualize Route'}
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {error && (
                  <div className="mb-6 p-3 bg-red-100 border border-red-200 text-red-700 rounded-md flex items-start gap-2">
                    <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Route info - with constrained height */}
                {routeInfo && (
                  <div className={`mb-6 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl p-4 shadow-md`}>
                    <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      <Navigation className="inline-block mr-2 text-green-500" />
                      Route Summary
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className={`p-3 rounded-lg shadow-sm ${isDarkMode ? 'bg-gray-600' : 'bg-white'}`}>
                        <div className="flex items-center">
                          <Clock className="text-green-500 mr-2" size={16} />
                          <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Duration</span>
                        </div>
                        <p className={`text-xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {routeInfo.totalDuration} min
                        </p>
                      </div>
                      <div className={`p-3 rounded-lg shadow-sm ${isDarkMode ? 'bg-gray-600' : 'bg-white'}`}>
                        <div className="flex items-center">
                          <MapPin className="text-green-500 mr-2" size={16} />
                          <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Distance</span>
                        </div>
                        <p className={`text-xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {routeInfo.totalDistance} km
                        </p>
                      </div>
                    </div>

                    <div className={`p-3 rounded-lg shadow-sm ${isDarkMode ? 'bg-gray-600' : 'bg-white'}`}>
                      <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Route Details
                      </h4>

                      {/* Pickup points */}
                      <div className="mb-4">
                        <h5 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          Pickup Points
                        </h5>
                        <div className="space-y-2">
                          {routeInfo.route.coordinates.allWaypoints?.pickups.map((point: any, idx: number) => (
                            <div key={`pickup-${idx}`} className="flex items-center gap-2">
                              <div className="bg-blue-500 text-white w-5 h-5 flex items-center justify-center rounded-full text-xs flex-shrink-0">
                                P{point.order}
                              </div>
                              <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} line-clamp-1`}
                                title={point.display_name}>
                                {point.display_name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Dropoff points */}
                      <div>
                        <h5 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          Dropoff Points
                        </h5>
                        <div className="space-y-2">
                          {routeInfo.route.coordinates.allWaypoints?.dropoffs.map((point: any, idx: number) => (
                            <div key={`dropoff-${idx}`} className="flex items-center gap-2">
                              <div className="bg-green-500 text-white w-5 h-5 flex items-center justify-center rounded-full text-xs flex-shrink-0">
                                D{point.order}
                              </div>
                              <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} line-clamp-1`}
                                title={point.display_name}>
                                {point.display_name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Map - Fixed height */}
                <div className="w-full rounded-xl overflow-hidden border dark:border-gray-700 h-[400px] flex-shrink-0">
                  <LeafletMap
                    pickup={pickupPoint}
                    dropoff={dropoffPoint}
                    routeGeometry={routeGeometry}
                    routeColor={routeColor}
                    waypoints={waypoints}
                  />
                </div>

                {/* Map legend - Fixed height */}
                <div className={`mt-4 p-3 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg flex items-center justify-center gap-6 flex-shrink-0`}>
                  <div className="flex items-center gap-2">
                    <div className="bg-blue-500 text-white w-5 h-5 flex items-center justify-center rounded-full text-xs">P</div>
                    <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Pickup</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-green-500 text-white w-5 h-5 flex items-center justify-center rounded-full text-xs">D</div>
                    <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Dropoff</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-green-500 w-5 h-1.5 rounded"></div>
                    <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Route</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default EmployeeRoutes;
