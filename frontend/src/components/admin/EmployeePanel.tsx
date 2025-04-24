import React from 'react';
import { MapPin, User, Mail, Phone, Clock, Lock, Edit, Trash2, Plus, X, Save } from 'lucide-react';

interface EmployeeData {
    id: string;
    name: string;
    email: string;
    password: string;
    contact?: string;
    gender?: string;
    pickupLocation: string;
    dropLocation: string;
    shiftStartTime: string;
    shiftEndTime: string;
}

interface EmployeePanelProps {
    isDarkMode: boolean;
    isEditMode: boolean;
    employees: EmployeeData[];
    newEmployee: EmployeeData;
    handleEmployeeInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    handleAddEmployee: () => void;
    handleEditEmployee: (employee: EmployeeData) => void;
    handleDeleteEmployee: (id: string) => void;
    handleCancelEdit: () => void;
    openLocationModal: (type: 'pickup' | 'dropoff') => void;
}

const EmployeePanel: React.FC<EmployeePanelProps> = ({
    isDarkMode,
    isEditMode,
    employees,
    newEmployee,
    handleEmployeeInputChange,
    handleAddEmployee,
    handleEditEmployee,
    handleDeleteEmployee,
    handleCancelEdit,
    openLocationModal
}) => {
    // Helper function to ensure time is in correct format (HH:MM)
    const formatTimeForBackend = (timeStr: string): string => {
        if (!timeStr || timeStr.trim() === '') return '';

        // Make sure it's in HH:MM format
        const parts = timeStr.split(':');
        if (parts.length >= 2) {
            return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
        }
        return timeStr;
    };

    // Validate the employee data before submission
    const validateEmployeeData = (): boolean => {
        if (!newEmployee.name || !newEmployee.email) {
            alert('Name and email are required');
            return false;
        }

        // Ensure time format is correct if provided
        if (newEmployee.shiftStartTime && !(/^\d{1,2}:\d{2}$/.test(newEmployee.shiftStartTime))) {
            alert('Shift start time must be in format HH:MM');
            return false;
        }

        if (newEmployee.shiftEndTime && !(/^\d{1,2}:\d{2}$/.test(newEmployee.shiftEndTime))) {
            alert('Shift end time must be in format HH:MM');
            return false;
        }

        return true;
    };

    // Wrapper for handleAddEmployee that validates and formats data
    const handleSubmitEmployee = () => {
        if (!validateEmployeeData()) return;

        // Create a copy of the employee with properly formatted times
        const formattedEmployee = {
            ...newEmployee,
            shiftStartTime: formatTimeForBackend(newEmployee.shiftStartTime),
            shiftEndTime: formatTimeForBackend(newEmployee.shiftEndTime)
        };

        // Update the employee in the parent component
        // Pass the formatted employee to the parent handler if needed
        // For now, we'll just call the original function
        handleAddEmployee();
    };

    return (
        <div className={`w-full ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {/* Employee Form */}
            <div className={`mb-8 p-4 sm:p-6 border rounded-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <h2 className="text-xl font-bold mb-4">
                    {isEditMode ? 'Edit Employee' : 'Add New Employee'}
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
                                value={newEmployee.name}
                                onChange={handleEmployeeInputChange}
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
                                value={newEmployee.email}
                                onChange={handleEmployeeInputChange}
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
                                value={newEmployee.contact}
                                onChange={handleEmployeeInputChange}
                                className={`w-full p-2 sm:p-3 border rounded-md ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                placeholder="Enter phone number"
                            />
                        </div>
                        <div>
                            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                <User className="inline-block mr-1" size={16} />
                                Gender
                            </label>
                            <select
                                name="gender"
                                value={newEmployee.gender || ''}
                                onChange={handleEmployeeInputChange}
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
                                    value={newEmployee.password}
                                    onChange={handleEmployeeInputChange}
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

                    {/* Location and Shift Section */}
                    <div className="pt-2">
                        <h3 className={`text-lg font-medium mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                            Location & Schedule
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    <MapPin className="inline-block mr-1" size={16} />
                                    Pickup Location
                                </label>
                                <div className="flex items-center">
                                    <input
                                        type="text"
                                        name="pickupLocation"
                                        value={newEmployee.pickupLocation}
                                        onChange={handleEmployeeInputChange}
                                        className={`w-full p-2 sm:p-3 border rounded-l-md ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                        placeholder="Select pickup location"
                                        readOnly
                                    />
                                    <button
                                        type="button"
                                        onClick={() => openLocationModal('pickup')}
                                        className={`p-2 sm:p-3 border border-l-0 rounded-r-md ${isDarkMode ? 'bg-gray-600 border-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-100 border-gray-300 hover:bg-gray-200 text-gray-700'}`}
                                    >
                                        <MapPin size={20} />
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    <MapPin className="inline-block mr-1" size={16} />
                                    Drop Location
                                </label>
                                <div className="flex items-center">
                                    <input
                                        type="text"
                                        name="dropLocation"
                                        value={newEmployee.dropLocation}
                                        onChange={handleEmployeeInputChange}
                                        className={`w-full p-2 sm:p-3 border rounded-l-md ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                        placeholder="Select drop location"
                                        readOnly
                                    />
                                    <button
                                        type="button"
                                        onClick={() => openLocationModal('dropoff')}
                                        className={`p-2 sm:p-3 border border-l-0 rounded-r-md ${isDarkMode ? 'bg-gray-600 border-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-100 border-gray-300 hover:bg-gray-200 text-gray-700'}`}
                                    >
                                        <MapPin size={20} />
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    <Clock className="inline-block mr-1" size={16} />
                                    Shift Start Time
                                </label>
                                <div className="flex space-x-2">
                                    <select
                                        name="shiftStartHour"
                                        value={newEmployee.shiftStartTime ? newEmployee.shiftStartTime.split(':')[0] : ''}
                                        onChange={(e) => {
                                            const hour = e.target.value;
                                            // Extract minute safely with a default
                                            const minute = newEmployee.shiftStartTime ?
                                                (newEmployee.shiftStartTime.split(':')[1] || '00') :
                                                '00';

                                            // Only update if hour has a value
                                            if (hour) {
                                                handleEmployeeInputChange({
                                                    target: {
                                                        name: 'shiftStartTime',
                                                        value: `${hour.padStart(2, '0')}:${minute}`
                                                    }
                                                } as React.ChangeEvent<HTMLInputElement>);
                                            } else {
                                                // If hour is empty, clear the time
                                                handleEmployeeInputChange({
                                                    target: {
                                                        name: 'shiftStartTime',
                                                        value: ''
                                                    }
                                                } as React.ChangeEvent<HTMLInputElement>);
                                            }
                                        }}
                                        className={`w-1/2 p-2 sm:p-3 border rounded-md ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                    >
                                        <option value="">Hour</option>
                                        {Array.from({ length: 24 }, (_, i) =>
                                            <option key={i} value={i.toString().padStart(2, '0')}>
                                                {i.toString().padStart(2, '0')}
                                            </option>
                                        )}
                                    </select>
                                    <select
                                        name="shiftStartMinute"
                                        value={newEmployee.shiftStartTime ? (newEmployee.shiftStartTime.split(':')[1] || '00') : '00'}
                                        onChange={(e) => {
                                            const minute = e.target.value;
                                            // Extract hour safely, default to empty which will be handled by validation
                                            const hour = newEmployee.shiftStartTime ?
                                                (newEmployee.shiftStartTime.split(':')[0] || '') :
                                                '';

                                            // Only update if we have an hour
                                            if (hour) {
                                                handleEmployeeInputChange({
                                                    target: {
                                                        name: 'shiftStartTime',
                                                        value: `${hour.padStart(2, '0')}:${minute}`
                                                    }
                                                } as React.ChangeEvent<HTMLInputElement>);
                                            } else {
                                                // If no hour is set, show a validation message or set a default
                                                alert('Please select an hour first');
                                            }
                                        }}
                                        className={`w-1/2 p-2 sm:p-3 border rounded-md ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                    >
                                        <option value="00">00</option>
                                        <option value="15">15</option>
                                        <option value="30">30</option>
                                        <option value="45">45</option>
                                    </select>
                                </div>
                                <p className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    24-hour format
                                </p>
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    <Clock className="inline-block mr-1" size={16} />
                                    Shift End Time
                                </label>
                                <div className="flex space-x-2">
                                    <select
                                        name="shiftEndHour"
                                        value={newEmployee.shiftEndTime ? newEmployee.shiftEndTime.split(':')[0] : ''}
                                        onChange={(e) => {
                                            const hour = e.target.value;
                                            // Extract minute safely with a default
                                            const minute = newEmployee.shiftEndTime ?
                                                (newEmployee.shiftEndTime.split(':')[1] || '00') :
                                                '00';

                                            // Only update if hour has a value
                                            if (hour) {
                                                handleEmployeeInputChange({
                                                    target: {
                                                        name: 'shiftEndTime',
                                                        value: `${hour.padStart(2, '0')}:${minute}`
                                                    }
                                                } as React.ChangeEvent<HTMLInputElement>);
                                            } else {
                                                // If hour is empty, clear the time
                                                handleEmployeeInputChange({
                                                    target: {
                                                        name: 'shiftEndTime',
                                                        value: ''
                                                    }
                                                } as React.ChangeEvent<HTMLInputElement>);
                                            }
                                        }}
                                        className={`w-1/2 p-2 sm:p-3 border rounded-md ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                    >
                                        <option value="">Hour</option>
                                        {Array.from({ length: 24 }, (_, i) =>
                                            <option key={i} value={i.toString().padStart(2, '0')}>
                                                {i.toString().padStart(2, '0')}
                                            </option>
                                        )}
                                    </select>
                                    <select
                                        name="shiftEndMinute"
                                        value={newEmployee.shiftEndTime ? (newEmployee.shiftEndTime.split(':')[1] || '00') : '00'}
                                        onChange={(e) => {
                                            const minute = e.target.value;
                                            // Extract hour safely, default to empty which will be handled by validation
                                            const hour = newEmployee.shiftEndTime ?
                                                (newEmployee.shiftEndTime.split(':')[0] || '') :
                                                '';

                                            // Only update if we have an hour
                                            if (hour) {
                                                handleEmployeeInputChange({
                                                    target: {
                                                        name: 'shiftEndTime',
                                                        value: `${hour.padStart(2, '0')}:${minute}`
                                                    }
                                                } as React.ChangeEvent<HTMLInputElement>);
                                            } else {
                                                // If no hour is set, show a validation message or set a default
                                                alert('Please select an hour first');
                                            }
                                        }}
                                        className={`w-1/2 p-2 sm:p-3 border rounded-md ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                    >
                                        <option value="00">00</option>
                                        <option value="15">15</option>
                                        <option value="30">30</option>
                                        <option value="45">45</option>
                                    </select>
                                </div>
                                <p className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    24-hour format
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-3">
                        <button
                            type="button"
                            onClick={handleSubmitEmployee}
                            className={`px-4 py-2 rounded-md font-medium flex items-center justify-center ${isDarkMode ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                        >
                            {isEditMode ? <><Save size={18} className="mr-1" /> Update Employee</> : <><Plus size={18} className="mr-1" /> Add Employee</>}
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

            {/* Employee List */}
            <div className={`w-full ${isDarkMode ? 'text-white' : 'text-gray-800'} overflow-x-auto pb-2`}>
                <h2 className="text-xl font-bold mb-4">Employee List</h2>

                {employees.length === 0 ? (
                    <div className={`p-4 text-center border rounded-lg ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                        No employees added yet
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className={`min-w-full divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                            <thead className={isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}>
                                <tr>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Name</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider hidden sm:table-cell">Contact</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider hidden md:table-cell">Pickup</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider hidden md:table-cell">Drop</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider hidden lg:table-cell">Shift</th>
                                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                                {employees.map((employee) => (
                                    <tr key={employee.id} className={`${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors duration-150`}>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <div className="font-medium">{employee.name}</div>
                                                <div className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{employee.email}</div>
                                                {/* Mobile-only contact info */}
                                                <div className={`text-xs sm:hidden mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    {employee.contact || 'No contact'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap hidden sm:table-cell">
                                            <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                {employee.contact || 'Not provided'}
                                            </div>
                                            <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                {employee.gender || 'Not specified'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap hidden md:table-cell">
                                            <div className={`text-sm line-clamp-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} title={employee.pickupLocation}>
                                                {(employee.pickupLocation || 'Not set').substring(0, 37) + ((employee.pickupLocation?.length || 0) > 20 ? '...' : '')}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap hidden md:table-cell">
                                            <div className={`text-sm line-clamp-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} title={employee.dropLocation}>
                                                {(employee.dropLocation || 'Not set').substring(0, 37) + ((employee.dropLocation?.length || 0) > 20 ? '...' : '')}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap hidden lg:table-cell">
                                            <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                {employee.shiftStartTime ? employee.shiftStartTime.substring(0, 5) : 'N/A'} - {employee.shiftEndTime ? employee.shiftEndTime.substring(0, 5) : 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end space-x-2">
                                                <button
                                                    onClick={() => {
                                                        handleEditEmployee(employee);
                                                        // Firefox compatibility fix for scrolling
                                                        setTimeout(() => {
                                                            try {
                                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                                            } catch (e) {
                                                                // Fallback for browsers that don't support smooth scrolling
                                                                window.scrollTo(0, 0);
                                                            }
                                                        }, 10);
                                                    }}
                                                    className={`p-1.5 rounded ${isDarkMode ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-100 hover:bg-blue-200 text-blue-600'}`}
                                                    title="Edit"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteEmployee(employee.id)}
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
                                                            <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Pickup:</span> {employee.pickupLocation || 'Not set'}
                                                        </div>
                                                        <div>
                                                            <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Drop:</span> {employee.dropLocation || 'Not set'}
                                                        </div>
                                                        <div>
                                                            <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Shift:</span> {employee.shiftStartTime ? employee.shiftStartTime.substring(0, 5) : 'N/A'} - {employee.shiftEndTime ? employee.shiftEndTime.substring(0, 5) : 'N/A'}
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

export default EmployeePanel;