import React from 'react';
import Link from 'next/link';
import { Briefcase, MapPin, UserCog } from 'lucide-react';

interface EmployeeProfileProps {
    userData: {
        id: string;
        pickupLocation: string;
        dropLocation: string;
        shiftStartTime: string;
        shiftEndTime: string;
    };
    formData: {
        pickupLocation: string;
        dropLocation: string;
        shiftStartTime: string;
        shiftEndTime: string;
    };
    editMode: boolean;
    isDarkMode: boolean;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    openLocationModal: (type: 'pickup' | 'dropoff') => void;
}

const EmployeeProfile: React.FC<EmployeeProfileProps> = ({
    userData,
    formData,
    editMode,
    isDarkMode,
    handleInputChange,
    openLocationModal
}) => {
    return (
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-xl shadow-md transition-colors duration-300`}>
            <div className="flex items-center mb-4">
                <Briefcase className="text-green-500 mr-2" />
                <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>
                    Employee Information
                </h3>
            </div>

            <div className="space-y-4">
                <div>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} transition-colors duration-300`}>Employee ID</p>
                    <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>
                        {userData.id}
                    </p>
                </div>

                <div>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} transition-colors duration-300`}>Preferred Pickup Location</p>
                    {editMode ? (
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={formData.pickupLocation || ''}
                                readOnly
                                className={`w-full p-2 text-sm rounded border ${isDarkMode
                                    ? 'bg-gray-700 border-gray-600 text-white'
                                    : 'bg-white border-gray-300 text-gray-900'
                                    } transition-colors duration-300`}
                            />
                            <button
                                onClick={() => openLocationModal('pickup')}
                                className={`px-3 rounded-md ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}>
                                <MapPin size={16} />
                            </button>
                        </div>
                    ) : (
                        <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>
                            {userData.pickupLocation || 'Not set'}
                        </p>
                    )}
                </div>

                <div>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} transition-colors duration-300`}>Preferred Dropoff Location</p>
                    {editMode ? (
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={formData.dropLocation || ''}
                                readOnly
                                className={`w-full p-2 text-sm rounded border ${isDarkMode
                                    ? 'bg-gray-700 border-gray-600 text-white'
                                    : 'bg-white border-gray-300 text-gray-900'
                                    } transition-colors duration-300`}
                            />
                            <button
                                onClick={() => openLocationModal('dropoff')}
                                className={`px-3 rounded-md ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}>
                                <MapPin size={16} />
                            </button>
                        </div>
                    ) : (
                        <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>
                            {userData.dropLocation || 'Not set'}
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} transition-colors duration-300`}>Shift Start</p>
                        {editMode ? (
                            <input
                                type="time"
                                name="shiftStartTime"
                                value={formData.shiftStartTime || ''}
                                onChange={handleInputChange}
                                className={`w-full p-2 text-sm rounded border ${isDarkMode
                                    ? 'bg-gray-700 border-gray-600 text-white'
                                    : 'bg-white border-gray-300 text-gray-900'
                                    } transition-colors duration-300`}
                            />
                        ) : (
                            <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>
                                {userData.shiftStartTime || 'Not set'}
                            </p>
                        )}
                    </div>

                    <div>
                        <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} transition-colors duration-300`}>Shift End</p>
                        {editMode ? (
                            <input
                                type="time"
                                name="shiftEndTime"
                                value={formData.shiftEndTime || ''}
                                onChange={handleInputChange}
                                className={`w-full p-2 text-sm rounded border ${isDarkMode
                                    ? 'bg-gray-700 border-gray-600 text-white'
                                    : 'bg-white border-gray-300 text-gray-900'
                                    } transition-colors duration-300`}
                            />
                        ) : (
                            <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>
                                {userData.shiftEndTime || 'Not set'}
                            </p>
                        )}
                    </div>
                </div>

                {/* Password section - only show when in edit mode */}
                {editMode && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <h4 className={`font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>
                            Change Password
                        </h4>

                        <div className="space-y-3 mb-3">
                            <input
                                type="password"
                                placeholder="Current password"
                                className={`w-full p-2 rounded border ${isDarkMode
                                    ? 'bg-gray-700 border-gray-600 text-white'
                                    : 'bg-white border-gray-300 text-gray-900'
                                    } transition-colors duration-300`}
                            />
                            <input
                                type="password"
                                placeholder="New password"
                                className={`w-full p-2 rounded border ${isDarkMode
                                    ? 'bg-gray-700 border-gray-600 text-white'
                                    : 'bg-white border-gray-300 text-gray-900'
                                    } transition-colors duration-300`}
                            />
                            <input
                                type="password"
                                placeholder="Confirm password"
                                className={`w-full p-2 rounded border ${isDarkMode
                                    ? 'bg-gray-700 border-gray-600 text-white'
                                    : 'bg-white border-gray-300 text-gray-900'
                                    } transition-colors duration-300`}
                            />
                        </div>
                        <button
                            className={`px-4 py-2 text-sm font-medium ${isDarkMode
                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                                } rounded-md transition-colors duration-300`}
                        >
                            Update Password
                        </button>
                    </div>
                )}
            </div>

            <div className="mt-6">
                <Link href="/dashboard" className={`w-full flex items-center justify-center px-4 py-2 ${isDarkMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-600 hover:bg-purple-700'
                    } text-white rounded-md transition-all duration-300`}>
                    <UserCog size={18} className="mr-2" />
                    Access Employee Dashboard (for Routes)
                </Link>
            </div>
        </div>
    );
};

export default EmployeeProfile;
