import React from 'react';
import { Settings } from 'lucide-react';

interface PreferencesSectionProps {
    isDarkMode: boolean;
    toggleTheme: () => void;
}

const PreferencesSection: React.FC<PreferencesSectionProps> = ({
    isDarkMode,
    toggleTheme
}) => {
    return (
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-xl shadow-md transition-colors duration-300`}>
            <div className="flex items-center mb-4">
                <Settings className="text-green-500 mr-2" />
                <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>
                    Account Preferences
                </h3>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>
                            Dark Mode
                        </h4>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} transition-colors duration-300`}>
                            Enable dark theme for the application
                        </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={isDarkMode}
                            onChange={toggleTheme}
                        />
                        <div className={`w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer 
              ${isDarkMode ? 'peer-checked:bg-green-500' : 'peer-checked:bg-green-500'} 
              after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
              after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all 
              after:duration-300 peer-checked:after:translate-x-5`}
                        ></div>
                    </label>
                </div>
            </div>
        </div>
    );
};

export default PreferencesSection;
