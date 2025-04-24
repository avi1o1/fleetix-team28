"use client";

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useState, useEffect, useRef } from 'react';
import { Users, Car, AlertCircle, ChevronLeft } from 'lucide-react';
import axios from 'axios';
import Link from 'next/link';
import EmployeePanel from '@/components/admin/EmployeePanel';
import DriverPanel from '@/components/admin/DriverPanel';
import LocationModal from '@/components/profile/LocationModal';

// Define enums to match backend
enum UserRole {
    ADMIN = "admin",
    EMPLOYEE = "employee",
    DRIVER = "driver"
}

// Define interfaces for our data models
interface BaseUser {
    id: string;
    name: string;
    email: string;
    password: string;
    contact?: string;
    gender?: string;
}

interface EmployeeData extends BaseUser {
    pickupLocation: string;
    dropLocation: string;
    shiftStartTime: string;
    shiftEndTime: string;
}

interface DriverData extends BaseUser {
    vehicleLicensePlate: string;
    drivesCount: number;
    capacity: number;
}

const ManageEmployees: React.FC = () => {
    const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<'employees' | 'drivers'>('employees');
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [editId, setEditId] = useState<string | null>(null);

    // Employee states
    const [newEmployee, setNewEmployee] = useState<EmployeeData>({
        id: "",
        name: "",
        email: "",
        password: "",
        contact: "",
        gender: "",
        pickupLocation: "",
        dropLocation: "",
        shiftStartTime: "",
        shiftEndTime: ""
    });

    const [employees, setEmployees] = useState<EmployeeData[]>([]);

    // Driver states
    const [newDriver, setNewDriver] = useState<DriverData>({
        id: "",
        name: "",
        email: "",
        password: "",
        contact: "",
        gender: "",
        vehicleLicensePlate: "",
        drivesCount: 0,
        capacity: 4
    });

    const [drivers, setDrivers] = useState<DriverData[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // API base URL from environment variable - make sure this matches your backend URL
    const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

    // Get token from local storage
    const getToken = () => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('token');
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
            const prefersDarkMode = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
            setIsDarkMode(prefersDarkMode);
            localStorage.setItem('theme', prefersDarkMode ? 'dark' : 'light');
            if (prefersDarkMode) document.documentElement.classList.add('dark');
        }

        // Fetch employees and drivers from API
        fetchEmployees();
        fetchDrivers();
    }, []);

    // Show success message with auto-dismiss
    const showSuccess = (message: string) => {
        setSuccessMessage(message);
        setTimeout(() => {
            setSuccessMessage(null);
        }, 5000); // Hide after 5 seconds
    };

    // API function to fetch employees
    const fetchEmployees = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log("Fetching employees from:", API_URL + '/employees');
            const response = await authAxios().get('/employees');
            console.log("Employee data received:", response.data);

            if (!response.data) {
                throw new Error("No data received from server");
            }

            setEmployees(response.data.map((emp: any) => {
                // Helper function to format time from ISO string to HH:MM
                const formatTimeFromDate = (dateString: string) => {
                    if (!dateString) return "";
                    try {
                        const date = new Date(dateString);
                        // Check if date is valid
                        if (isNaN(date.getTime())) return "";

                        // Format as HH:MM
                        return date.toTimeString().substring(0, 5);
                    } catch (e) {
                        console.error("Error formatting time:", e);
                        return "";
                    }
                };

                return {
                    id: emp.userId,
                    name: emp.user.name,
                    email: emp.user.email,
                    password: "",
                    contact: emp.user.Contact || "",
                    gender: emp.user.gender || "",
                    pickupLocation: emp.pickupLocation,
                    dropLocation: emp.dropLocation,
                    // Properly format the time strings from the ISO dates
                    shiftStartTime: formatTimeFromDate(emp.shiftStartTime),
                    shiftEndTime: formatTimeFromDate(emp.shiftEndTime),
                };
            }));
        } catch (err: any) {
            console.error('Error fetching employees:', err);
            if (err.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.error("Error response data:", err.response.data);
                console.error("Error response status:", err.response.status);
                setError(`Failed to fetch employees: ${err.response.status} ${err.response?.data?.message || ''}`);
            } else if (err.request) {
                // The request was made but no response was received
                console.error("Error request:", err.request);
                setError("Failed to fetch employees: No response received from server");
            } else {
                // Something happened in setting up the request that triggered an Error
                console.error("Error message:", err.message);
                setError(`Failed to fetch employees: ${err.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    // API function to fetch drivers with improved error handling
    const fetchDrivers = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log("Fetching drivers from:", API_URL + '/drivers');
            const response = await authAxios().get('/drivers');
            console.log("Driver data received:", response.data);

            if (!response.data) {
                throw new Error("No data received from server");
            }

            // Transform the driver data for frontend display
            setDrivers(response.data.map((driver: any) => {
                // Verify driver data structure
                if (!driver.user) {
                    console.warn(`Driver with ID ${driver.userId} is missing user data`);
                    return {
                        id: driver.userId,
                        name: "Unknown",
                        email: "unknown@example.com",
                        password: "",
                        contact: "",
                        gender: "",
                        vehicleLicensePlate: driver.vehicleLicensePlate || "Unknown",
                        drivesCount: driver.drivesCount || 0,
                        capacity: driver.capacity || 0
                    };
                }

                return {
                    id: driver.userId,
                    name: driver.user.name,
                    email: driver.user.email,
                    password: "",
                    contact: driver.user.Contact || "", // Fixed: Use Contact (capital C) from the user object
                    gender: driver.user.gender || "",
                    vehicleLicensePlate: driver.vehicleLicensePlate,
                    drivesCount: driver.drivesCount,
                    capacity: driver.capacity
                };
            }));
        } catch (err: any) {
            console.error('Error fetching drivers:', err);
            if (err.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.error("Error response data:", err.response.data);
                console.error("Error response status:", err.response.status);
                setError(`Failed to fetch drivers: ${err.response.status} ${err.response?.data?.message || ''}`);
            } else if (err.request) {
                // The request was made but no response was received
                console.error("Error request:", err.request);
                setError("Failed to fetch drivers: No response received from server. Check your network connection or server status.");
            } else {
                // Something happened in setting up the request that triggered an Error
                console.error("Error message:", err.message);
                setError(`Failed to fetch drivers: ${err.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const toggleTheme = () => {
        const newDarkModeValue = !isDarkMode;
        setIsDarkMode(newDarkModeValue);
        localStorage.setItem('theme', newDarkModeValue ? 'dark' : 'light');

        // Apply theme to document for global theming
        if (newDarkModeValue) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    // Employee handlers
    const handleEmployeeInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        // Block manual changes to location fields - they must come from the location modal
        if (name === 'pickupLocation' || name === 'dropLocation') {
            return; // Don't process direct edits to location fields
        }
        setNewEmployee({ ...newEmployee, [name]: value });
    };

    const handleAddEmployee = async () => {
        setLoading(true);
        setError(null);

        try {
            if (!newEmployee.name || !newEmployee.email) {
                throw new Error("Please fill in all required fields.");
            }

            // Validate that pickup and dropoff locations were selected properly
            if (!newEmployee.pickupLocation || !newEmployee.dropLocation) {
                throw new Error("Please select pickup and dropoff locations using the location selector.");
            }

            // Enhanced time format function
            const formatTimeForBackend = (timeStr: string) => {
                if (!timeStr || timeStr.trim() === '') return '';

                // Handle various time formats - ensure it's in HH:MM format
                if (timeStr.includes(':')) {
                    const [hours, minutes] = timeStr.split(':');
                    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
                }

                return timeStr;
            };

            // Format the time strings
            const formattedStartTime = formatTimeForBackend(newEmployee.shiftStartTime);
            const formattedEndTime = formatTimeForBackend(newEmployee.shiftEndTime);

            console.log("Formatted times for backend:", {
                start: formattedStartTime,
                end: formattedEndTime,
                original: {
                    start: newEmployee.shiftStartTime,
                    end: newEmployee.shiftEndTime
                }
            });

            if (isEditMode && editId) {
                // Update existing employee
                // First, update or create user
                const userData = {
                    name: newEmployee.name,
                    email: newEmployee.email,
                    Contact: newEmployee.contact, // Changed from 'contact' to 'Contact' to match backend
                    gender: newEmployee.gender
                };

                // Only include password if it's provided (for updates)
                if (newEmployee.password) {
                    Object.assign(userData, { password: newEmployee.password });
                }

                // Update user data
                await authAxios().put(`/users/${editId}`, userData);

                // Update employee-specific data with properly formatted times
                const employeeData = {
                    pickupLocation: newEmployee.pickupLocation,
                    dropLocation: newEmployee.dropLocation,
                    shiftStartTime: formattedStartTime,
                    shiftEndTime: formattedEndTime
                };

                console.log("Sending employee update with data:", employeeData);
                await authAxios().put(`/employees/${editId}`, employeeData);

                showSuccess("Employee updated successfully");
            } else {
                // Create new user first
                try {
                    // Try to create the user
                    const userResponse = await authAxios().post('/users', {
                        name: newEmployee.name,
                        email: newEmployee.email,
                        password: newEmployee.password || 'defaultPassword123', // Provide a default if empty
                        Contact: newEmployee.contact, // Changed from 'contact' to 'Contact' to match backend
                        gender: newEmployee.gender,
                        role: UserRole.EMPLOYEE
                    });

                    const userId = userResponse.data.userId;
                    console.log("Created user with ID:", userId);

                    // Then create employee record with properly formatted times
                    const employeeData = {
                        userId: userId,
                        pickupLocation: newEmployee.pickupLocation,
                        dropLocation: newEmployee.dropLocation,
                        shiftStartTime: formattedStartTime,
                        shiftEndTime: formattedEndTime
                    };

                    console.log("Creating employee with data:", employeeData);
                    await authAxios().post('/employees', employeeData);

                    showSuccess("Employee added successfully");
                } catch (userError: any) {
                    // Check if this is a 400 error with "User already exists" message
                    if (userError.response?.status === 400 &&
                        userError.response?.data?.message?.includes("already exists")) {

                        console.warn("User already exists error, trying again with force=true parameter");

                        // Try again with the force=true parameter to get the existing user's ID
                        const forceResponse = await authAxios().post('/users?force=true', {
                            name: newEmployee.name,
                            email: newEmployee.email,
                            password: newEmployee.password || 'defaultPassword123',
                            Contact: newEmployee.contact, // Changed from 'contact' to 'Contact' to match backend
                            gender: newEmployee.gender,
                            role: UserRole.EMPLOYEE
                        });

                        const userId = forceResponse.data.userId;
                        console.log("Using existing user with ID:", userId);

                        // Create employee record with the existing user's ID - with proper time format
                        const employeeData = {
                            userId: userId,
                            pickupLocation: newEmployee.pickupLocation,
                            dropLocation: newEmployee.dropLocation,
                            shiftStartTime: formattedStartTime,
                            shiftEndTime: formattedEndTime
                        };

                        console.log("Creating employee with data:", employeeData);
                        await authAxios().post('/employees', employeeData);

                        showSuccess("Employee added successfully (using existing user account)");
                    } else {
                        // This is some other error, rethrow it to be caught by the outer catch
                        throw userError;
                    }
                }
            }

            // Refresh the employee list
            fetchEmployees();

            // Reset form and state
            setIsEditMode(false);
            setEditId(null);
            setNewEmployee({
                id: "",
                name: "",
                email: "",
                password: "",
                contact: "",
                gender: "",
                pickupLocation: "",
                dropLocation: "",
                shiftStartTime: "",
                shiftEndTime: ""
            });
        } catch (err: any) {
            console.error('Error saving employee:', err);
            setError(err.message || "Failed to save employee");
        } finally {
            setLoading(false);
        }
    };

    const handleEditEmployee = (employee: EmployeeData) => {
        setNewEmployee({ ...employee });
        setIsEditMode(true);
        setEditId(employee.id);
        setActiveTab('employees');
    };

    const handleDeleteEmployee = async (id: string) => {
        if (confirm('Are you sure you want to delete this employee?')) {
            setLoading(true);
            setError(null);

            try {
                // Delete the employee record
                await authAxios().delete(`/employees/${id}`);

                // Optionally delete the user record as well (depends on your backend implementation)
                await authAxios().delete(`/users/${id}`);

                // Refresh the employee list
                fetchEmployees();
                showSuccess("Employee deleted successfully");
            } catch (err: any) {
                console.error('Error deleting employee:', err);
                setError(err.response?.data?.message || "Failed to delete employee");
            } finally {
                setLoading(false);
            }
        }
    };

    // Driver handlers
    const handleDriverInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        // Handle numeric fields
        if (name === 'drivesCount' || name === 'capacity') {
            setNewDriver({ ...newDriver, [name]: parseInt(value) || 0 });
        } else {
            setNewDriver({ ...newDriver, [name]: value });
        }
    };

    const handleAddDriver = async () => {
        setLoading(true);
        setError(null);

        try {
            if (isEditMode && editId) {
                // Update existing driver
                // First, update or create user
                const userData = {
                    name: newDriver.name,
                    email: newDriver.email,
                    Contact: newDriver.contact, // Changed from 'contact' to 'Contact' to match backend
                    gender: newDriver.gender
                };

                // Only include password if it's provided (for updates)
                if (newDriver.password) {
                    Object.assign(userData, { password: newDriver.password });
                }

                // Update user data
                await authAxios().put(`/users/${editId}`, userData);

                // Update driver-specific data
                const driverData = {
                    vehicleLicensePlate: newDriver.vehicleLicensePlate,
                    drivesCount: newDriver.drivesCount,
                    capacity: newDriver.capacity
                };

                await authAxios().put(`/drivers/${editId}`, driverData);

                showSuccess("Driver updated successfully");
            } else {
                // Create new user first
                const userResponse = await authAxios().post('/users', {
                    name: newDriver.name,
                    email: newDriver.email,
                    password: newDriver.password,
                    Contact: newDriver.contact, // Changed from 'contact' to 'Contact' to match backend
                    gender: newDriver.gender,
                    role: UserRole.DRIVER
                });

                const userId = userResponse.data.userId;

                // Then create driver record
                await authAxios().post('/drivers', {
                    userId: userId,
                    vehicleLicensePlate: newDriver.vehicleLicensePlate,
                    drivesCount: newDriver.drivesCount,
                    capacity: newDriver.capacity
                });

                showSuccess("Driver added successfully");
            }

            // Refresh the driver list
            fetchDrivers();

            // Reset form and state
            setIsEditMode(false);
            setEditId(null);
            setNewDriver({
                id: "",
                name: "",
                email: "",
                password: "",
                contact: "",
                gender: "",
                vehicleLicensePlate: "",
                drivesCount: 0,
                capacity: 4
            });
        } catch (err: any) {
            console.error('Error saving driver:', err);
            setError(err.response?.data?.message || "Failed to save driver");
        } finally {
            setLoading(false);
        }
    };

    const handleEditDriver = (driver: DriverData) => {
        setNewDriver({ ...driver });
        setIsEditMode(true);
        setEditId(driver.id);
        setActiveTab('drivers');
    };

    const handleDeleteDriver = async (id: string) => {
        if (confirm('Are you sure you want to delete this driver?')) {
            setLoading(true);
            setError(null);

            try {
                // Delete the driver record
                await authAxios().delete(`/drivers/${id}`);

                // Optionally delete the user record as well (depends on your backend implementation)
                await authAxios().delete(`/users/${id}`);

                // Refresh the driver list
                fetchDrivers();
                showSuccess("Driver deleted successfully");
            } catch (err: any) {
                console.error('Error deleting driver:', err);
                setError(err.response?.data?.message || "Failed to delete driver");
            } finally {
                setLoading(false);
            }
        }
    };

    const handleCancelEdit = () => {
        setIsEditMode(false);
        setEditId(null);
        if (activeTab === 'employees') {
            setNewEmployee({
                id: "",
                name: "",
                email: "",
                password: "",
                contact: "",
                gender: "",
                pickupLocation: "",
                dropLocation: "",
                shiftStartTime: "",
                shiftEndTime: ""
            });
        } else {
            setNewDriver({
                id: "",
                name: "",
                email: "",
                password: "",
                contact: "",
                gender: "",
                vehicleLicensePlate: "",
                drivesCount: 0,
                capacity: 4
            });
        }
    };

    // Add location modal states
    const [showLocationModal, setShowLocationModal] = useState<boolean>(false);
    const [searchAddress, setSearchAddress] = useState<string>('');
    const [isAddressLoading, setIsAddressLoading] = useState<boolean>(false);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
    const [selectedLocation, setSelectedLocation] = useState<any | null>(null);
    const [locationType, setLocationType] = useState<'pickup' | 'dropoff'>('pickup');
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Geocoding functionality
    const fetchSuggestions = async (query: string) => {
        if (!query.trim() || query.length < 3) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        setIsAddressLoading(true);

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
            setIsAddressLoading(false);
        }
    };

    const handleSuggestionClick = (suggestion: any) => {
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
        if (selectedLocation) {
            // Just store the full address string as provided by the API
            const addressString = selectedLocation.display_name;

            if (locationType === 'pickup') {
                setNewEmployee({
                    ...newEmployee,
                    pickupLocation: addressString
                });
            } else {
                setNewEmployee({
                    ...newEmployee,
                    dropLocation: addressString
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
                                <span className="text-green-500">User</span> Management
                            </h1>
                            <p className={`mt-2 text-lg sm:text-xl ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} transition-colors duration-300`}>
                                Manage employees and drivers in your transportation system
                            </p>
                        </div>
                    </div>
                </div>

                {/* Status messages */}
                {loading && (
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

                {successMessage && (
                    <div className={`mb-6 p-3 sm:p-4 ${isDarkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-700'} rounded-lg shadow-md flex items-center transition-colors duration-300`}>
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a 1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                        </svg>
                        <span className="text-sm sm:text-base font-medium">{successMessage}</span>
                    </div>
                )}

                {/* Tabs for switching between employees and drivers - make scrollable for small screens */}
                <div className="flex overflow-x-auto pb-1 mb-6 border-b border-gray-200 dark:border-gray-700 hide-scrollbar">
                    <button
                        className={`flex items-center mr-4 sm:mr-8 py-2 sm:py-3 px-3 sm:px-4 border-b-2 font-medium text-sm sm:text-base rounded-t-lg transition-colors duration-200 whitespace-nowrap
                            ${activeTab === 'employees'
                                ? `border-green-500 ${isDarkMode ? 'text-green-400 bg-gray-800' : 'text-green-600 bg-gray-50'}`
                                : `border-transparent ${isDarkMode ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}`}
                        onClick={() => setActiveTab('employees')}
                    >
                        <Users className="mr-2" size={18} />
                        <span>Employees</span>
                    </button>
                    <button
                        className={`flex items-center py-2 sm:py-3 px-3 sm:px-4 border-b-2 font-medium text-sm sm:text-base rounded-t-lg transition-colors duration-200 whitespace-nowrap
                            ${activeTab === 'drivers'
                                ? `border-green-500 ${isDarkMode ? 'text-green-400 bg-gray-800' : 'text-green-600 bg-gray-50'}`
                                : `border-transparent ${isDarkMode ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}`}
                        onClick={() => setActiveTab('drivers')}
                    >
                        <Car className="mr-2" size={18} />
                        <span>Drivers</span>
                    </button>
                </div>

                {/* Render appropriate panel based on active tab */}
                <div className="w-full">
                    {activeTab === 'employees' ? (
                        <EmployeePanel
                            isDarkMode={isDarkMode}
                            isEditMode={isEditMode}
                            employees={employees}
                            newEmployee={newEmployee}
                            handleEmployeeInputChange={handleEmployeeInputChange}
                            handleAddEmployee={handleAddEmployee}
                            handleEditEmployee={handleEditEmployee}
                            handleDeleteEmployee={handleDeleteEmployee}
                            handleCancelEdit={handleCancelEdit}
                            openLocationModal={openLocationModal}
                        />
                    ) : (
                        <DriverPanel
                            isDarkMode={isDarkMode}
                            isEditMode={isEditMode}
                            drivers={drivers}
                            newDriver={newDriver}
                            handleDriverInputChange={handleDriverInputChange}
                            handleAddDriver={handleAddDriver}
                            handleEditDriver={handleEditDriver}
                            handleDeleteDriver={handleDeleteDriver}
                            handleCancelEdit={handleCancelEdit}
                        />
                    )}
                </div>
            </div>

            {/* Location Selection Modal - improve for mobile */}
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
                isLoading={isAddressLoading}
                fetchSuggestions={fetchSuggestions}
                clearSearch={clearSearch}
                handleSuggestionClick={handleSuggestionClick}
                applySelectedLocation={applySelectedLocation}
            />

            <Footer />
        </div>
    );
};

export default ManageEmployees;
