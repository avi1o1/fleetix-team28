import React from 'react';
import { User, Mail, Phone, Edit, Save, X, LogOut } from 'lucide-react';

interface UserSidebarProps {
    userData: {
        id: string;
        name: string;
        email: string;
        contact?: string;
        gender?: 'M' | 'F';
        profileImage?: string;
        joinDate?: string;
        userType: 'admin' | 'employee' | 'driver';
    };
    formData: {
        name: string;
        email: string;
        contact?: string;
        gender?: 'M' | 'F';
    };
    editMode: boolean;
    isDarkMode: boolean;
    handleEditToggle: () => void;
    cancelEdit: () => void;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    handleLogout: () => void;
}

const UserSidebar: React.FC<UserSidebarProps> = ({
    userData,
    formData,
    editMode,
    isDarkMode,
    handleEditToggle,
    cancelEdit,
    handleInputChange,
    handleLogout
}) => {

    // Function to get appropriate icon based on user type
    const getUserTypeIcon = () => {
        switch (userData.userType) {
            case 'admin':
                return "👑";
            case 'employee':
                return "👔";
            case 'driver':
                return "🚗";
            default:
                return "👤";
        }
    };

    return (
        <div className={`col-span-1 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-xl shadow-md transition-colors duration-300 h-fit`}>
            <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                    <img
                        src={userData.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=0D8ABC&color=fff`}
                        alt={userData.name}
                        className="w-32 h-32 rounded-full object-cover border-4 border-green-500"
                    />
                    <div className={`absolute bottom-0 right-0 p-1 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-white'}`}>
                        <div className="bg-green-500 w-3 h-3 rounded-full"></div>
                    </div>
                </div>

                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>
                    {userData.name}
                </h2>

                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-1 transition-colors duration-300 flex items-center justify-center gap-1`}>
                    <span>{getUserTypeIcon()}</span>
                    <span className="capitalize">{userData.userType}</span>
                </div>

                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-4 transition-colors duration-300`}>
                    Member since {userData.joinDate || 'N/A'}
                </p>

                <button
                    onClick={handleEditToggle}
                    className={`w-full flex items-center justify-center px-4 py-2 ${editMode
                        ? isDarkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'
                        : isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
                        } text-white rounded-md transition-all duration-300`}
                >
                    {editMode ? (
                        <>
                            <Save size={16} className="mr-2" />
                            Save Changes
                        </>
                    ) : (
                        <>
                            <Edit size={16} className="mr-2" />
                            Edit Profile
                        </>
                    )}
                </button>

                {editMode ? (
                    <button
                        onClick={cancelEdit}
                        className={`w-full mt-4 flex items-center justify-center px-4 py-2 ${isDarkMode ? 'bg-red-700 hover:bg-red-600' : 'bg-red-500 hover:bg-red-400'
                            } text-white rounded-md transition-all duration-300`}
                    >
                        <X size={16} className="mr-2" />
                        Cancel
                    </button>
                ) : (
                    <button
                        onClick={handleLogout}
                        className={`w-full mt-4 flex items-center justify-center px-4 py-2 ${isDarkMode ? 'bg-red-700 hover:bg-red-600' : 'bg-red-500 hover:bg-red-400'
                            } text-white rounded-md transition-all duration-300`}
                    >
                        <LogOut size={16} className="mr-2" />
                        Logout
                    </button>
                )}
            </div>

            <hr className={`my-6 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} transition-colors duration-300`} />

            <div className="space-y-4">
                {/* Common user info fields */}
                <div className="flex items-start">
                    <User className={`flex-shrink-0 mr-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} transition-colors duration-300`} />
                    <div className="flex-1">
                        <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} transition-colors duration-300`}>Full Name</p>
                        {editMode ? (
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className={`w-full p-2 mt-1 text-sm rounded border ${isDarkMode
                                    ? 'bg-gray-700 border-gray-600 text-white'
                                    : 'bg-white border-gray-300 text-gray-900'
                                    } transition-colors duration-300`}
                            />
                        ) : (
                            <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>
                                {userData.name}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-start">
                    <Mail className={`flex-shrink-0 mr-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} transition-colors duration-300`} />
                    <div className="flex-1">
                        <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} transition-colors duration-300`}>Email</p>
                        {editMode ? (
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className={`w-full p-2 mt-1 text-sm rounded border ${isDarkMode
                                    ? 'bg-gray-700 border-gray-600 text-white'
                                    : 'bg-white border-gray-300 text-gray-900'
                                    } transition-colors duration-300`}
                            />
                        ) : (
                            <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>
                                {userData.email}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-start">
                    <Phone className={`flex-shrink-0 mr-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} transition-colors duration-300`} />
                    <div className="flex-1">
                        <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} transition-colors duration-300`}>Contact</p>
                        {editMode ? (
                            <input
                                type="tel"
                                name="contact"
                                value={formData.contact || ''}
                                onChange={handleInputChange}
                                className={`w-full p-2 mt-1 text-sm rounded border ${isDarkMode
                                    ? 'bg-gray-700 border-gray-600 text-white'
                                    : 'bg-white border-gray-300 text-gray-900'
                                    } transition-colors duration-300`}
                            />
                        ) : (
                            <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>
                                {userData.contact || 'Not set'}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-start">
                    <User className={`flex-shrink-0 mr-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} transition-colors duration-300`} />
                    <div className="flex-1">
                        <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} transition-colors duration-300`}>Gender</p>
                        {editMode ? (
                            <select
                                name="gender"
                                value={formData.gender || ''}
                                onChange={handleInputChange}
                                className={`w-full p-2 mt-1 text-sm rounded border ${isDarkMode
                                    ? 'bg-gray-700 border-gray-600 text-white'
                                    : 'bg-white border-gray-300 text-gray-900'
                                    } transition-colors duration-300`}
                            >
                                <option value="">Select Gender</option>
                                <option value="M">Male</option>
                                <option value="F">Female</option>
                            </select>
                        ) : (
                            <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>
                                {userData.gender === 'M' ? 'Male' : userData.gender === 'F' ? 'Female' : 'Not set'}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserSidebar;
