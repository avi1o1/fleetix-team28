import React from 'react';
import Link from 'next/link';
import { UserCog } from 'lucide-react';

interface AdminProfileProps {
    userData: {
        id: string;
        adminRank: string;
    };
    formData: {
        adminRank: string;
    };
    editMode: boolean;
    isDarkMode: boolean;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

const AdminProfile: React.FC<AdminProfileProps> = ({
    userData,
    formData,
    editMode,
    isDarkMode,
    handleInputChange,
}) => {
    return (
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-xl shadow-md transition-colors duration-300`}>
            <div className="flex items-center mb-4">
                <UserCog className="text-green-500 mr-2" />
                <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>
                    Admin Information
                </h3>
            </div>

            <div className="flex justify-between items-center mb-4">
                <div>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} transition-colors duration-300`}>ID</p>
                    <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>
                        {userData.id}
                    </p>
                </div>
                <div>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} transition-colors duration-300`}>Admin Rank</p>
                    {editMode ? (
                        <input
                            type="text"
                            name="adminRank"
                            value={formData.adminRank || ''}
                            onChange={handleInputChange}
                            className={`w-full p-2 text-sm rounded border ${isDarkMode
                                ? 'bg-gray-700 border-gray-600 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                                } transition-colors duration-300`}
                        />
                    ) : (
                        <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>
                            {userData.adminRank}
                        </p>
                    )}
                </div>
            </div>

            <div className="mt-6">
                <Link href="/admin" className={`w-full flex items-center justify-center px-4 py-2 ${isDarkMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-600 hover:bg-purple-700'
                    } text-white rounded-md transition-all duration-300`}>
                    <UserCog size={18} className="mr-2" />
                    Access Admin Panel
                </Link>
            </div>
        </div>
    );
};

export default AdminProfile;
