import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Tooltip } from 'antd';
import './EnhancedThemeToggle.css';

const EnhancedThemeToggle = ({ position = 'fixed' }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div 
      className={`enhanced-theme-toggle-container ${position === 'fixed' ? 'fixed-position' : 'relative-position'}`}
    >
      <Tooltip 
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'} 
        placement="left"
      >
        <button
          onClick={toggleTheme}
          className="enhanced-theme-toggle-btn"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <div className="theme-toggle-content">
            <span className="theme-icon">
              {isDark ? '🌙' : '☀️'}
            </span>
            <span className="theme-text">
              {isDark ? 'Dark Mode' : 'Light Mode'}
            </span>
          </div>
        </button>
      </Tooltip>
    </div>
  );
};

export default EnhancedThemeToggle;
