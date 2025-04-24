'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

// Import modular components
import UserSidebar from '@/components/profile/UserSidebar';
import AdminProfile from '@/components/profile/AdminProfile';
import EmployeeProfile from '@/components/profile/EmployeeProfile';
import DriverProfile from '@/components/profile/DriverProfile';
import LocationModal from '@/components/profile/LocationModal';
import PreferencesSection from '@/components/profile/PreferencesSection';

// Define backend user role enum to match backend
enum UserRole {
    ADMIN = "admin",
    EMPLOYEE = "employee",
    DRIVER = "driver"
}

// Location suggestion interface
interface LocationSuggestion {
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
}

// User data interfaces
interface CommonUserFields {
    id: string;
    name: string;
    email: string;
    password: string;
    gender?: 'M' | 'F';
    contact?: string;
    profileImage?: string;
    joinDate?: string;
    role?: UserRole;
}

interface AdminData extends CommonUserFields {
    userType: 'admin';
    adminRank: string;
}

interface EmployeeData extends CommonUserFields {
    userType: 'employee';
    pickupLocation: string;
    dropLocation: string;
    shiftStartTime: string;
    shiftEndTime: string;
}

interface DriverData extends CommonUserFields {
    userType: 'driver';
    vehicleLicensePlate: string;
    drivesCount: number;
    capacity: number;
}

type UserData = AdminData | EmployeeData | DriverData;

export default function ProfilePage() {
    const router = useRouter();
    const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
    const [editMode, setEditMode] = useState<boolean>(false);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [formData, setFormData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Location modal states
    const [showLocationModal, setShowLocationModal] = useState<boolean>(false);
    const [searchAddress, setSearchAddress] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
    const [selectedLocation, setSelectedLocation] = useState<LocationSuggestion | null>(null);
    const [locationType, setLocationType] = useState<'pickup' | 'dropoff'>('pickup');
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    // Get token from local storage
    const getToken = () => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('token');
        }
        return null;
    };

    // Get the current user ID from token or localStorage
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
        console.log("Current API URL:", API_URL);

        // For debugging connection issues
        if (!token) {
            console.warn("No authentication token found. Requests may fail if authentication is required.");
        }

        return axios.create({
            baseURL: API_URL,
            headers: {
                Authorization: token ? `Bearer ${token}` : '',
                'Content-Type': 'application/json',
            },
            // Add timeout to prevent infinite waiting on connection issues
            timeout: 10000
        });
    };

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
            const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setIsDarkMode(prefersDarkMode);
            localStorage.setItem('theme', prefersDarkMode ? 'dark' : 'light');
            if (prefersDarkMode) document.documentElement.classList.add('dark');
        }

        // Test server connectivity first
        testServerConnectivity().then(() => {
            // Only fetch user data if server is responsive
            fetchUserData();
        });
    }, []);

    // Test the server connectivity
    const testServerConnectivity = async () => {
        try {
            console.log("Testing server connectivity at:", API_URL);
            // Try simple endpoints to check if server is responding
            await axios.get(`${API_URL}/`, { timeout: 3000 });
            console.log("Server is responding to basic requests");
            return true;
        } catch (err) {
            console.error("Server connectivity test failed:", err);
            setError("Cannot connect to server. Please check your network and server status.");
            return false;
        }
    };

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

    // Show success message with auto-dismiss
    const showSuccess = (message: string) => {
        setSuccessMessage(message);
        setTimeout(() => {
            setSuccessMessage(null);
        }, 5000); // Hide after 5 seconds
    };

    // Fetch user data from backend
    const fetchUserData = async () => {
        setLoading(true);
        setError(null);

        try {
            const userId = getCurrentUserId();
            const userRole = getCurrentUserRole();

            if (!userId) {
                router.push('/authentication/login');
            }

            // Log API URL and routes we're attempting to access
            console.log("API URL:", API_URL);
            console.log("Attempting to fetch user data for ID:", userId);
            console.log("User role:", userRole);

            // Try different endpoint patterns
            let userInfo;
            try {
                // First attempt with /users/:id
                console.log("Attempting to fetch from /users/:id");
                const userResponse = await authAxios().get(`/users/${userId}`);
                userInfo = userResponse.data;
                console.log("Success with /users/:id");
            } catch (primaryError) {
                console.error("Error with /users/:id:", primaryError);

                // Fallback to /auth/users/:id
                console.log("Falling back to /auth/users/:id");
                try {
                    const authUserResponse = await authAxios().get(`/auth/users/${userId}`);
                    userInfo = authUserResponse.data;
                    console.log("Success with /auth/users/:id");
                } catch (fallbackError) {
                    console.error("Error with /auth/users/:id:", fallbackError);
                    // If both fail, throw the primary error
                    throw primaryError;
                }
            }

            console.log("User data fetched:", userInfo);

            // Format data based on user role
            let profileData: UserData;

            if (userRole === UserRole.ADMIN) {
                // Fetch admin-specific data if needed
                profileData = {
                    id: userInfo.id,
                    name: userInfo.name,
                    email: userInfo.email,
                    gender: userInfo.gender,
                    contact: userInfo.contact,
                    password: "",
                    role: userInfo.role,
                    userType: 'admin',
                    adminRank: "System Administrator", // Default value
                    profileImage: "https://randomuser.me/api/portraits/men/32.jpg", // Default avatar
                    joinDate: new Date(userInfo.createdAt || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
                } as AdminData;
            }
            else if (userRole === UserRole.EMPLOYEE) {
                // Fetch employee-specific data
                let employeeInfo;
                try {
                    const employeeResponse = await authAxios().get(`/employees/${userId}`);
                    employeeInfo = employeeResponse.data;
                    console.log("Employee data fetched:", employeeInfo);
                } catch (empError) {
                    console.error("Error fetching employee data:", empError);
                    employeeInfo = {}; // Default to empty object if fetch fails
                }

                profileData = {
                    id: userInfo.id,
                    name: userInfo.name,
                    email: userInfo.email,
                    gender: userInfo.gender,
                    contact: userInfo.contact,
                    password: "",
                    role: userInfo.role,
                    userType: 'employee',
                    profileImage: "https://randomuser.me/api/portraits/men/32.jpg", // Default avatar
                    joinDate: new Date(userInfo.createdAt || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
                    // Employee specific fields
                    pickupLocation: employeeInfo?.pickupLocation || "",
                    dropLocation: employeeInfo?.dropLocation || "",
                    shiftStartTime: employeeInfo?.shiftStartTime ?
                        new Date(employeeInfo.shiftStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) :
                        "",
                    shiftEndTime: employeeInfo?.shiftEndTime ?
                        new Date(employeeInfo.shiftEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) :
                        ""
                } as EmployeeData;
            }
            else if (userRole === UserRole.DRIVER) {
                // Fetch driver-specific data
                let driverInfo;
                try {
                    const driverResponse = await authAxios().get(`/drivers/${userId}`);
                    driverInfo = driverResponse.data;
                    console.log("Driver data fetched:", driverInfo);
                } catch (driverError) {
                    console.error("Error fetching driver data:", driverError);
                    driverInfo = {}; // Default to empty object if fetch fails
                }

                profileData = {
                    id: userInfo.id,
                    name: userInfo.name,
                    email: userInfo.email,
                    gender: userInfo.gender,
                    contact: userInfo.contact,
                    password: "",
                    role: userInfo.role,
                    userType: 'driver',
                    profileImage: "https://randomuser.me/api/portraits/lego/5.jpg", // Default avatar
                    joinDate: new Date(userInfo.createdAt || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
                    // Driver specific fields
                    vehicleLicensePlate: driverInfo?.vehicleLicensePlate || "",
                    drivesCount: driverInfo?.drivesCount || 0,
                    capacity: driverInfo?.capacity || 4
                } as DriverData;
            }
            else {
                throw new Error("Unknown user role");
            }

            setUserData(profileData);
            setFormData(profileData);

        } catch (err: any) {
            console.error('Error fetching user data:', err);
            // Detailed error logging
            if (err.response) {
                // The request was made and the server responded with a status code
                console.error("Error response data:", err.response.data);
                console.error("Error response status:", err.response.status);
                console.error("Error response headers:", err.response.headers);
                setError(`Failed to fetch user data: ${err.response.status} ${err.response?.data?.message || ''}`);
            } else if (err.request) {
                // The request was made but no response was received
                console.error("Error request:", err.request);
                setError("Failed to fetch user data: No response received from server. Check network connection or server status.");
            } else {
                // Something happened in setting up the request
                console.error("Error message:", err.message);
                setError(`Failed to fetch user data: ${err.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

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

    const handleEditToggle = () => {
        if (editMode) {
            // If saving, update the user data
            handleSaveChanges();
        } else {
            // If entering edit mode, initialize form data with current user data
            setFormData({ ...userData });
        }
        setEditMode(!editMode);
    };

    const handleSaveChanges = async () => {
        if (!formData || !userData) return;

        setLoading(true);
        setError(null);

        try {
            const userId = formData.id;

            // Update basic user info
            const userUpdateData = {
                name: formData.name,
                email: formData.email,
                contact: formData.contact,
                gender: formData.gender
            };

            await authAxios().put(`/users/${userId}`, userUpdateData);

            // Update role-specific data
            if (formData.userType === 'employee' && userData.userType === 'employee') {
                // Format the time values properly for the database
                const shiftStartTime = (formData as EmployeeData).shiftStartTime || null;
                const shiftEndTime = (formData as EmployeeData).shiftEndTime || null;

                // Convert time string to ISO format date if exists
                let formattedStartTime = null;
                let formattedEndTime = null;

                if (shiftStartTime && shiftStartTime.trim() !== '') {
                    // Create a date object and set the time
                    const [hours, minutes] = shiftStartTime.split(':').map(Number);
                    const date = new Date();
                    date.setHours(hours, minutes, 0, 0);
                    formattedStartTime = date.toISOString();
                }

                if (shiftEndTime && shiftEndTime.trim() !== '') {
                    // Create a date object and set the time
                    const [hours, minutes] = shiftEndTime.split(':').map(Number);
                    const date = new Date();
                    date.setHours(hours, minutes, 0, 0);
                    formattedEndTime = date.toISOString();
                }

                const employeeData = {
                    userId: userId,
                    pickupLocation: (formData as EmployeeData).pickupLocation,
                    dropLocation: (formData as EmployeeData).dropLocation,
                    shiftStartTime: formattedStartTime,
                    shiftEndTime: formattedEndTime
                };

                console.log("Employee data to send:", employeeData);

                try {
                    const response = await authAxios().put(`/employees/${userId}`, employeeData);
                    console.log("Successfully updated employee record");
                } catch (updateError: any) {
                    if (updateError.response?.status === 404) {
                        console.log("Employee doesn't exist, creating new record");
                        await authAxios().post('/employees', employeeData);
                    } else {
                        console.error("Error updating employee:", updateError);
                        throw new Error(`Failed to update employee: ${updateError.response?.data?.message || updateError.message}`);
                    }
                }
            }
            else if (formData.userType === 'driver' && userData.userType === 'driver') {
                const driverData = {
                    vehicleLicensePlate: (formData as DriverData).vehicleLicensePlate,
                    capacity: (formData as DriverData).capacity
                };

                try {
                    // First check if driver record exists
                    const checkResponse = await authAxios().get(`/drivers/${userId}`);

                    if (checkResponse.data) {
                        // If driver exists, update it
                        await authAxios().put(`/drivers/${userId}`, driverData);
                    } else {
                        throw new Error("Driver record not found");
                    }
                } catch (driverError: any) {
                    // If 404, driver doesn't exist yet, so create it
                    if (driverError.response && driverError.response.status === 404) {
                        console.log("Creating new driver record");
                        try {
                            await authAxios().post('/drivers', {
                                ...driverData,
                                userId: userId
                            });
                        } catch (createError: any) {
                            console.error("Error creating driver:", createError);
                            throw new Error(`Failed to create driver record: ${createError.response?.data?.message || createError.message}`);
                        }
                    } else {
                        // Some other error occurred
                        console.error("Error updating driver:", driverError);
                        throw new Error(`Failed to update driver record: ${driverError.response?.data?.message || driverError.message}`);
                    }
                }
            }

            // Update local state
            setUserData({ ...formData });
            showSuccess("Profile updated successfully");
            setEditMode(false);

        } catch (err: any) {
            console.error('Error updating profile:', err);
            if (err.response) {
                setError(`Failed to update profile: ${err.response.status} ${err.response?.data?.message || ''}`);
            } else if (err.request) {
                setError("Failed to update profile: No response received from server");
            } else {
                setError(`Failed to update profile: ${err.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        if (!formData) return;

        const { name, value, type } = e.target as HTMLInputElement;

        if (name.includes('.')) {
            // Handle nested objects
            const [parent, child] = name.split('.');
            setFormData(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    [parent]: {
                        ...(prev as any)[parent],
                        [child]: value
                    }
                };
            });
        } else {
            // Handle top-level fields
            setFormData(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    [name]: type === 'number' ? Number(value) : value
                };
            });
        }
    };

    const cancelEdit = () => {
        setEditMode(false);
        setFormData(userData);
    };

    // Geocoding functionality
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

    const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchAddress(value);

        // Debounce the API call
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            fetchSuggestions(value);
        }, 300);
    };

    const handleSuggestionClick = (suggestion: LocationSuggestion) => {
        setSearchAddress(suggestion.display_name);
        setSelectedLocation(suggestion);
        setShowSuggestions(false);
    };

    const openLocationModal = (type: 'pickup' | 'dropoff') => {
        setLocationType(type);
        setSearchAddress('');
        setSelectedLocation(null);
        setShowLocationModal(true);
    };

    const applySelectedLocation = () => {
        if (!formData) return;

        if (selectedLocation && formData.userType === 'employee') {
            // Use the full address string instead of coordinates
            const addressString = selectedLocation.display_name;

            if (locationType === 'pickup') {
                setFormData(prev => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        pickupLocation: addressString
                    } as EmployeeData;
                });
            } else {
                setFormData(prev => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        dropLocation: addressString
                    } as EmployeeData;
                });
            }
        }
        setShowLocationModal(false);
    };

    const clearSearch = () => {
        setSearchAddress('');
        setSuggestions([]);
        setShowSuggestions(false);
        setSelectedLocation(null);
    };

    const handleLogout = () => {
        // Clear authentication data from localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Redirect to home page
        router.push('/');
    };

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
                    <p className="text-xl">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
                <div className="text-center max-w-md p-6 rounded-lg shadow-lg bg-red-50 dark:bg-red-900">
                    <div className="text-red-600 dark:text-red-200 text-5xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-red-700 dark:text-red-300 mb-2">Error Loading Profile</h2>
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

    if (!userData) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
                <div className="text-center max-w-md p-6 rounded-lg shadow-lg">
                    <h2 className="text-2xl font-bold mb-2">No Profile Data</h2>
                    <p className="mb-4">We couldn't find your profile information. Please log in again.</p>
                    <button
                        onClick={() => router.push('/login')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Login
                    </button>
                </div>
            </div>
        );
    }

    // Render the appropriate role-specific component
    const renderRoleSpecificComponent = () => {
        if (!userData || !formData) return null;

        switch (userData.userType) {
            case 'admin':
                return (
                    <AdminProfile
                        userData={userData as AdminData}
                        formData={formData as AdminData}
                        editMode={editMode}
                        isDarkMode={isDarkMode}
                        handleInputChange={handleInputChange}
                    />
                );
            case 'employee':
                return (
                    <EmployeeProfile
                        userData={userData as EmployeeData}
                        formData={formData as EmployeeData}
                        editMode={editMode}
                        isDarkMode={isDarkMode}
                        handleInputChange={handleInputChange}
                        openLocationModal={openLocationModal}
                    />
                );
            case 'driver':
                return (
                    <DriverProfile
                        userData={userData as DriverData}
                        formData={formData as DriverData}
                        editMode={editMode}
                        isDarkMode={isDarkMode}
                        handleInputChange={handleInputChange}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
            <Navbar isDarkMode={isDarkMode} toggleTheme={toggleTheme} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28 min-h-screen">

                {/* Status messages */}
                {loading && (
                    <div className="mb-4 p-4 bg-blue-100 text-blue-700 rounded-lg shadow flex items-center">
                        <div className="animate-spin mr-3">
                            <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                        <span className="font-medium">Processing your request...</span>
                    </div>
                )}

                {error && (
                    <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg shadow flex items-center">
                        <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                        </svg>
                        <span className="font-medium">{error}</span>
                    </div>
                )}

                {successMessage && (
                    <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg shadow flex items-center">
                        <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                        </svg>
                        <span className="font-medium">{successMessage}</span>
                    </div>
                )}

                {/* Hero section */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
                    <div className="text-center">
                        <h1 className={`mt-8 text-6xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'} sm:text-5xl lg:text-7xl transition-colors duration-300`}>
                            Hey! <span className="text-green-500">{userData.name.split(' ')[0]}</span>
                        </h1>
                        <p className={`mt-6 text-xl max-w-3xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} transition-colors duration-300`}>
                            Manage your personal information and preferences
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* User Sidebar Component */}
                    <UserSidebar
                        userData={userData}
                        formData={formData}
                        editMode={editMode}
                        isDarkMode={isDarkMode}
                        handleEditToggle={handleEditToggle}
                        cancelEdit={cancelEdit}
                        handleInputChange={handleInputChange}
                        handleLogout={handleLogout}
                    />

                    {/* Main content */}
                    <div className="col-span-1 lg:col-span-2 space-y-6">
                        {/* Role-specific component */}
                        {renderRoleSpecificComponent()}

                        {/* Preferences section */}
                        <PreferencesSection
                            isDarkMode={isDarkMode}
                            toggleTheme={toggleTheme}
                        />
                    </div>
                </div>
            </div>

            {/* Location Selection Modal */}
            <LocationModal
                isDarkMode={isDarkMode}
                showLocationModal={showLocationModal}
                setShowLocationModal={setShowLocationModal}
                locationType={locationType}
                searchAddress={searchAddress}
                setSearchAddress={setSearchAddress}
                selectedLocation={selectedLocation}
                setSelectedLocation={setSelectedLocation}
                suggestions={suggestions}
                setSuggestions={setSuggestions}
                showSuggestions={showSuggestions}
                setShowSuggestions={setShowSuggestions}
                isLoading={isLoading}
                fetchSuggestions={fetchSuggestions}
                clearSearch={clearSearch}
                handleSuggestionClick={handleSuggestionClick}
                applySelectedLocation={applySelectedLocation}
            />

            <Footer isDarkMode={isDarkMode} />
        </div>
    );
}
