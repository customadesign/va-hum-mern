import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { Tooltip } from 'antd';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <Tooltip 
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'} 
      placement="bottom"
    >
      <button
        onClick={toggleTheme}
        className="theme-toggle-btn"
        style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '32px', verticalAlign: 'top', marginTop: '-8px', marginLeft: '12px', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '6px', padding: '4px'}}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDark ? (
          <SunIcon className="h-6 w-6 text-gray-300 hover:text-white transition-colors duration-200" />
        ) : (
          <MoonIcon className="h-6 w-6 text-gray-600 hover:text-gray-800 transition-colors duration-200" />
        )}
      </button>
    </Tooltip>
  );
};

export default ThemeToggle;