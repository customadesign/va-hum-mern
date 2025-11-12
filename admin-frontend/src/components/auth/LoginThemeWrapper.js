import React from 'react';
import { ConfigProvider, App as AntApp } from 'antd';
import { customTheme } from '../../theme';

/**
 * LoginThemeWrapper - Forces light theme for login page only
 * This wrapper ensures the login page always uses light theme regardless of:
 * - User's saved theme preference in localStorage
 * - System theme preference (prefers-color-scheme)
 * - Global theme state
 */
const LoginThemeWrapper = ({ children }) => {
  // Always use light theme for login page
  const lightTheme = customTheme;

  // Apply light theme class to document root temporarily
  React.useEffect(() => {
    const root = document.documentElement;
    const originalClass = root.className;
    
    // Force light theme class
    root.classList.remove('dark');
    root.classList.add('light');
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    const originalThemeColor = metaThemeColor?.content;
    if (metaThemeColor) {
      metaThemeColor.content = '#ffffff';
    }
    
    // Cleanup function to restore original state when component unmounts
    return () => {
      root.className = originalClass;
      if (metaThemeColor && originalThemeColor) {
        metaThemeColor.content = originalThemeColor;
      }
    };
  }, []);

  return (
    <ConfigProvider theme={lightTheme}>
      <AntApp>
        <div className="login-force-light-theme">
          {children}
        </div>
      </AntApp>
    </ConfigProvider>
  );
};

export default LoginThemeWrapper;