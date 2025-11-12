import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

const CustomThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <div className="relative w-6 h-6">
        {/* Moon Icon - visible in light mode (to switch to dark) */}
        <MoonIcon 
          className={`absolute inset-0 h-6 w-6 transform transition-all duration-300 ${
            theme === 'light' 
              ? 'rotate-0 scale-100 text-gray-600' 
              : 'rotate-90 scale-0 text-gray-400'
          }`}
        />
        
        {/* Sun Icon - visible in dark mode (to switch to light) */}
        <SunIcon 
          className={`absolute inset-0 h-6 w-6 transform transition-all duration-300 ${
            theme === 'dark' 
              ? 'rotate-0 scale-100 text-yellow-400' 
              : '-rotate-90 scale-0 text-gray-400'
          }`}
        />
      </div>
      
      {/* Tooltip */}
      <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
        {theme === 'light' ? 'Dark mode' : 'Light mode'}
      </div>
    </button>
  );
};

export default CustomThemeToggle;