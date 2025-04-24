import React from 'react';
import { Car, User, Mail, Phone, Lock, Edit, Trash2, Plus, X, Save } from 'lucide-react';

// Define interfaces for our props and data models
interface DriverData {
    id: string;
    name: string;
    email: string;
    password: string;
    contact?: string;
    gender?: string;
    vehicleLicensePlate: string;
    drivesCount: number;
    capacity: number;
}

interface DriverPanelProps {
    isDarkMode: boolean;
    isEditMode: boolean;
    drivers: DriverData[];
    newDriver: DriverData;
    handleDriverInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    handleAddDriver: () => void;
    handleEditDriver: (driver: DriverData) => void;
    handleDeleteDriver: (id: string) => void;
    handleCancelEdit: () => void;
}

const DriverPanel: React.FC<DriverPanelProps> = ({
    isDarkMode,
    isEditMode,
    drivers,
    newDriver,
    handleDriverInputChange,
    handleAddDriver,
    handleEditDriver,
    handleDeleteDriver,
    handleCancelEdit
}) => {
    return (
        <div className={`w-full ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {/* Driver Form */}
            <div className={`mb-8 p-4 sm:p-6 border rounded-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <h2 className="text-xl font-bold mb-4">
                    {isEditMode ? 'Edit Driver' : 'Add New Driver'}
                </h2>

                <div className="space-y-4">
                    {/* Basic Info Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                <User className="inline-block mr-1" size={16} />
                                Name
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={newDriver.name}
                                onChange={handleDriverInputChange}
                                className={`w-full p-2 sm:p-3 border rounded-md ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                placeholder="Enter full name"
                            />
                        </div>
                        <div>
                            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                <Mail className="inline-block mr-1" size={16} />
                                Email
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={newDriver.email}
                                onChange={handleDriverInputChange}
                                className={`w-full p-2 sm:p-3 border rounded-md ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                placeholder="Enter email address"
                            />
                        </div>
                        <div>
                            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                <Phone className="inline-block mr-1" size={16} />
                                Contact
                            </label>
                            <input
                                type="tel"
                                name="contact"
                                value={newDriver.contact || ''}
                                onChange={handleDriverInputChange}
                                className={`w-full p-2 sm:p-3 border rounded-md ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                placeholder="Enter phone number"
                            />
                            <p className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Contact will be saved as user profile information
                            </p>
                        </div>
                        <div>
                            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                <User className="inline-block mr-1" size={16} />
                                Gender
                            </label>
                            <select
                                name="gender"
                                value={newDriver.gender || ''}
                                onChange={handleDriverInputChange}
                                className={`w-full p-2 sm:p-3 border rounded-md ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                            >
                                <option value="">Select gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="non-binary">Non-binary</option>
                                <option value="prefer-not-to-say">Prefer not to say</option>
                            </select>
                        </div>
                        {!isEditMode && (
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    <Lock className="inline-block mr-1" size={16} />
                                    Password
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    value={newDriver.password}
                                    onChange={handleDriverInputChange}
                                    className={`w-full p-2 sm:p-3 border rounded-md ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                    placeholder={isEditMode ? "Leave blank to keep current password" : "Enter new password"}
                                />
                                {isEditMode && (
                                    <p className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        Leave blank to keep current password
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Vehicle Section */}
                    <div className="pt-2">
                        <h3 className={`text-lg font-medium mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                            Vehicle Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    <Car className="inline-block mr-1" size={16} />
                                    Vehicle License Plate
                                </label>
                                <input
                                    type="text"
                                    name="vehicleLicensePlate"
                                    value={newDriver.vehicleLicensePlate}
                                    onChange={handleDriverInputChange}
                                    className={`w-full p-2 sm:p-3 border rounded-md ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                    placeholder="Enter license plate number"
                                />
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    <User className="inline-block mr-1" size={16} />
                                    Vehicle Capacity
                                </label>
                                <input
                                    type="number"
                                    name="capacity"
                                    value={newDriver.capacity}
                                    onChange={handleDriverInputChange}
                                    min="1"
                                    max="20"
                                    className={`w-full p-2 sm:p-3 border rounded-md ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                    placeholder="Number of passengers"
                                />
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    <Car className="inline-block mr-1" size={16} />
                                    Drives Count
                                </label>
                                <input
                                    type="number"
                                    name="drivesCount"
                                    value={newDriver.drivesCount}
                                    onChange={handleDriverInputChange}
                                    min="0"
                                    className={`w-full p-2 sm:p-3 border rounded-md ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-3">
                        <button
                            type="button"
                            onClick={handleAddDriver}
                            className={`px-4 py-2 rounded-md font-medium flex items-center justify-center ${isDarkMode ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                        >
                            {isEditMode ? <><Save size={18} className="mr-1" /> Update Driver</> : <><Plus size={18} className="mr-1" /> Add Driver</>}
                        </button>
                        {isEditMode && (
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                className={`px-4 py-2 rounded-md font-medium flex items-center justify-center ${isDarkMode ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-300 hover:bg-gray-400 text-gray-800'}`}
                            >
                                <X size={18} className="mr-1" /> Cancel
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Driver List */}
            <div className={`w-full ${isDarkMode ? 'text-white' : 'text-gray-800'} overflow-x-auto pb-2`}>
                <h2 className="text-xl font-bold mb-4">Driver List</h2>

                {drivers.length === 0 ? (
                    <div className={`p-4 text-center border rounded-lg ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                        No drivers added yet
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className={`min-w-full divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                            <thead className={isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}>
                                <tr>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Name</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider hidden sm:table-cell">Contact</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider hidden md:table-cell">License Plate</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider hidden lg:table-cell">Capacity</th>
                                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                                {drivers.map((driver) => (
                                    <tr key={driver.id} className={`${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors duration-150`}>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <div className="font-medium">{driver.name}</div>
                                                <div className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{driver.email}</div>
                                                {/* Mobile-only contact info */}
                                                <div className={`text-xs sm:hidden mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    {driver.contact || 'No contact'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap hidden sm:table-cell">
                                            <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                {driver.contact || 'Not provided'}
                                            </div>
                                            <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                {driver.gender || 'Not specified'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap hidden md:table-cell">
                                            <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                {driver.vehicleLicensePlate || 'Not set'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap hidden lg:table-cell">
                                            <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                {driver.capacity || 0} passengers
                                            </div>
                                            <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                {driver.drivesCount || 0} drives completed
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end space-x-2">
                                                <button
                                                    onClick={() => handleEditDriver(driver)}
                                                    className={`p-1.5 rounded ${isDarkMode ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-100 hover:bg-blue-200 text-blue-600'}`}
                                                    title="Edit"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteDriver(driver.id)}
                                                    className={`p-1.5 rounded ${isDarkMode ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-red-100 hover:bg-red-200 text-red-600'}`}
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                            {/* Mobile table row expander */}
                                            <div className="md:hidden mt-2">
                                                <details className="text-left">
                                                    <summary className={`text-xs font-medium cursor-pointer focus:outline-none ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                        Details
                                                    </summary>
                                                    <div className="mt-2 space-y-1 text-sm">
                                                        <div>
                                                            <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>License:</span> {driver.vehicleLicensePlate || 'Not set'}
                                                        </div>
                                                        <div>
                                                            <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Capacity:</span> {driver.capacity || 0} passengers
                                                        </div>
                                                        <div>
                                                            <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Drives:</span> {driver.drivesCount || 0} completed
                                                        </div>
                                                    </div>
                                                </details>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DriverPanel;