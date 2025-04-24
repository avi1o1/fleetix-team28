import React, { useState, useEffect, useRef } from 'react';
import { Search, XCircle, MapPin, Loader2 } from 'lucide-react';

interface LocationModalProps {
    isDarkMode: boolean;
    showLocationModal: boolean;
    setShowLocationModal: (show: boolean) => void;
    locationType: 'pickup' | 'dropoff';
    searchAddress: string;
    setSearchAddress: (address: string) => void;
    selectedLocation: any;
    setSelectedLocation: (location: any) => void;
    suggestions: any[];
    setSuggestions: (suggestions: any[]) => void;
    showSuggestions: boolean;
    setShowSuggestions: (show: boolean) => void;
    isLoading: boolean;
    fetchSuggestions: (query: string) => void;
    clearSearch: () => void;
    handleSuggestionClick: (suggestion: any) => void;
    applySelectedLocation: () => void;
}

const LocationModal: React.FC<LocationModalProps> = ({
    isDarkMode,
    showLocationModal,
    setShowLocationModal,
    locationType,
    searchAddress,
    setSearchAddress,
    selectedLocation,
    setSelectedLocation,
    suggestions,
    setSuggestions,
    showSuggestions,
    setShowSuggestions,
    isLoading,
    fetchSuggestions,
    clearSearch,
    handleSuggestionClick,
    applySelectedLocation
}) => {
    // Remove early return and use proper conditional rendering pattern

    // Add debounce delay (in milliseconds)
    const DEBOUNCE_DELAY = 500;
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchAddress(query);

        // Clear any existing timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Only fetch suggestions if there's a query and after the debounce delay
        if (query.trim()) {
            // Set loading state immediately for better UX
            if (query.length > 2) {
                // Set the timer for the debounced fetch
                debounceTimerRef.current = setTimeout(() => {
                    fetchSuggestions(query);
                }, DEBOUNCE_DELAY);
            }
        } else {
            // Clear suggestions if query is empty
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    // Clear timeout on unmount
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    // Use conditional rendering pattern here
    return (
        <>
            {showLocationModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowLocationModal(false)}>
                    <div
                        className={`w-full max-w-lg rounded-xl shadow-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} overflow-hidden`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={`p-4 sm:p-6 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                            <div className="flex justify-between items-center">
                                <h3 className={`text-lg sm:text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    <MapPin className="inline-block mr-2" />
                                    Select {locationType === 'pickup' ? 'Pickup' : 'Drop-off'} Location
                                </h3>
                                <button
                                    onClick={() => setShowLocationModal(false)}
                                    className={`p-1 rounded-full ${isDarkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-200 text-gray-500'} transition-all`}
                                >
                                    <XCircle size={24} />
                                </button>
                            </div>
                        </div>

                        <div className="p-4 sm:p-6">
                            <div className="mb-6">
                                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Search for a location
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                                    </div>
                                    <input
                                        type="text"
                                        value={searchAddress}
                                        onChange={handleSearchChange}
                                        placeholder="Search for an address..."
                                        className={`block w-full pl-10 pr-10 py-3 border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'} rounded-md focus:outline-none focus:ring-2 ${isDarkMode ? 'focus:ring-blue-500' : 'focus:ring-blue-600'} focus:border-transparent transition-colors duration-150`}
                                    />
                                    {searchAddress && (
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                            <button
                                                onClick={clearSearch}
                                                className={`p-1 rounded-full ${isDarkMode ? 'hover:bg-gray-600 text-gray-400' : 'hover:bg-gray-200 text-gray-500'}`}
                                            >
                                                <XCircle size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {isLoading && (
                                    <div className={`mt-2 flex items-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                        <Loader2 className="animate-spin mr-2" size={16} />
                                        <span>Searching...</span>
                                    </div>
                                )}

                                {/* Suggestions List */}
                                {showSuggestions && suggestions.length > 0 && (
                                    <div className={`mt-2 max-h-48 overflow-y-auto rounded-md border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}>
                                        <ul className="py-1">
                                            {suggestions.map((suggestion, index) => (
                                                <li
                                                    key={index}
                                                    onClick={() => handleSuggestionClick(suggestion)}
                                                    className={`px-3 py-2 cursor-pointer ${isDarkMode ? 'hover:bg-gray-600 text-gray-200' : 'hover:bg-gray-100 text-gray-800'} ${selectedLocation?.place_id === suggestion.place_id ? isDarkMode ? 'bg-gray-600' : 'bg-blue-50' : ''}`}
                                                >
                                                    <div className="flex items-start">
                                                        <MapPin size={16} className={`mt-1 flex-shrink-0 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mr-2`} />
                                                        <span className="text-sm line-clamp-2">{suggestion.display_name}</span>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {selectedLocation && (
                                <div className={`mb-6 p-3 rounded-md ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                                    <h4 className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Selected Location:</h4>
                                    <div className="flex items-start">
                                        <MapPin size={18} className={`mt-1 flex-shrink-0 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'} mr-2`} />
                                        <p className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{selectedLocation.display_name}</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row gap-3 mt-6">
                                <button
                                    onClick={applySelectedLocation}
                                    disabled={!selectedLocation}
                                    className={`flex-1 px-4 py-2 rounded-md font-medium ${!selectedLocation ? 'bg-gray-400 cursor-not-allowed' : isDarkMode ? 'bg-green-500 hover:bg-green-400 text-white' : 'bg-green-600 hover:bg-green-700 text-white'} transition-colors`}
                                >
                                    Apply Location
                                </button>
                                <button
                                    onClick={() => setShowLocationModal(false)}
                                    className={`flex-1 px-4 py-2 rounded-md font-medium ${isDarkMode ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-300 hover:bg-gray-400 text-gray-800'} transition-colors`}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default LocationModal;
