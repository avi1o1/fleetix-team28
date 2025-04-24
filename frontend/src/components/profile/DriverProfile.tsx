import React from 'react';
import Link from 'next/link';
import { Car, UserCog } from 'lucide-react';

interface DriverProfileProps {
    userData: {
        id: string;
        vehicleLicensePlate: string;
        drivesCount: number;
        capacity: number;
    };
    formData: {
        vehicleLicensePlate: string;
        capacity: number;
    };
    editMode: boolean;
    isDarkMode: boolean;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

const DriverProfile: React.FC<DriverProfileProps> = ({
    userData,
    formData,
    editMode,
    isDarkMode,
    handleInputChange,
}) => {
    return (
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-xl shadow-md transition-colors duration-300`}>
            <div className="flex items-center mb-4">
                <Car className="text-green-500 mr-2" />
                <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>
                    Driver Information
                </h3>
            </div>

            <div className="space-y-4">
                <div>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} transition-colors duration-300`}>Driver ID</p>
                    <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>
                        {userData.id}
                    </p>
                </div>

                <div>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} transition-colors duration-300`}>Vehicle License Plate</p>
                    {editMode ? (
                        <input
                            type="text"
                            name="vehicleLicensePlate"
                            value={formData.vehicleLicensePlate || ''}
                            onChange={handleInputChange}
                            className={`w-full p-2 text-sm rounded border ${isDarkMode
                                ? 'bg-gray-700 border-gray-600 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                                } transition-colors duration-300`}
                        />
                    ) : (
                        <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>
                            {userData.vehicleLicensePlate || 'Not set'}
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} transition-colors duration-300`}>Vehicle Capacity</p>
                        {editMode ? (
                            <input
                                type="number"
                                name="capacity"
                                value={formData.capacity || 0}
                                onChange={handleInputChange}
                                min="1"
                                max="10"
                                className={`w-full p-2 text-sm rounded border ${isDarkMode
                                    ? 'bg-gray-700 border-gray-600 text-white'
                                    : 'bg-white border-gray-300 text-gray-900'
                                    } transition-colors duration-300`}
                            />
                        ) : (
                            <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>
                                {userData.capacity || 0} passengers
                            </p>
                        )}
                    </div>

                    <div>
                        <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} transition-colors duration-300`}>Completed Drives</p>
                        <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>
                            {userData.drivesCount || 0}
                        </p>
                    </div>
                </div>
            </div>

            <div className="mt-6">
                <Link href="/dashboard" className={`w-full flex items-center justify-center px-4 py-2 ${isDarkMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-600 hover:bg-purple-700'
                    } text-white rounded-md transition-all duration-300`}>
                    <UserCog size={18} className="mr-2" />
                    Access Driver Dashboard (for Routes)
                </Link>
            </div>
        </div>
    );
};

export default DriverProfile;
