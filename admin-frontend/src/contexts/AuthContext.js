import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  // Check if user is authenticated on mount
  // SECURITY FIX: Only check auth status if NOT on login page
  useEffect(() => {
    const currentPath = window.location.pathname;

    // Skip auth check if we're on the login page to prevent auto-authentication
    if (currentPath === '/login') {
      console.log('[AuthContext] On login page - clearing auth state and cookies');
      // Clear any existing auth state when on login page
      clearAuthState();

      // Also clear server-side cookies to ensure complete logout
      api.post('/auth/clear-session')
        .then(() => {
          console.log('[AuthContext] Session cleared successfully');
        })
        .catch((error) => {
          console.error('[AuthContext] Failed to clear session:', error);
        })
        .finally(() => {
          setIsLoading(false);
          setAuthChecked(true);
        });
    } else {
      // Only check auth status for non-login pages
      checkAuthStatus();
    }
  }, []);


  // Check authentication status
  const checkAuthStatus = async () => {
    // Always set loading when checking auth
    setIsLoading(true);
    
    try {
      console.log('[AuthContext] Checking authentication status...');
      
      // Make API request - cookies will be sent automatically due to withCredentials: true
      const response = await api.get('/auth/me');
      
      if (response.data.success && response.data.user) {
        // Check if user is admin
        if (response.data.user.admin === true) {
          console.log('[AuthContext] User authenticated (admin):', response.data.user);
          setUser(response.data.user);
          setIsAuthenticated(true);
        } else {
          console.log('[AuthContext] User is not admin:', response.data.user.email);
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        console.log('[AuthContext] Authentication failed:', response.data.error);
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('[AuthContext] Auth check error:', error);
      console.error('[AuthContext] Error details:', error.response?.status, error.response?.data);
      // Ensure we explicitly set authenticated to false on any error
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
      setAuthChecked(true);
    }
  };

  // Login with email and password
  const loginWithEmail = async (credentials) => {
    try {
      console.log('[AuthContext] Attempting email login with:', credentials.email);
      console.log('[AuthContext] API URL:', api.defaults.baseURL);

      // First get CSRF token
      console.log('[AuthContext] Getting CSRF token...');
      const csrfResponse = await api.get('/auth/csrf');
      const csrfToken = csrfResponse.data.csrfToken;
      console.log('[AuthContext] CSRF token obtained');

      // Get the XSRF-TOKEN from cookies
      const xsrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('XSRF-TOKEN='))
        ?.split('=')[1];

      // Now login with CSRF token
      const response = await api.post('/auth/admin/login', credentials, {
        headers: {
          'X-CSRF-Token': xsrfToken || csrfToken
        }
      });
      console.log('[AuthContext] Login response:', response.data);

      if (response.data.success) {
        const { user } = response.data;
        
        // Check if user is admin
        if (user.admin !== true) {
          console.log('[AuthContext] User is not admin:', user.email);
          throw new Error('Access denied. Admin privileges required.');
        }
        
        // Backend already sets HttpOnly cookies, no need to set them here
        console.log('[AuthContext] Cookies should be set by backend');
        
        // Update state immediately with batched updates for consistency
        setUser(user);
        setIsAuthenticated(true);
        setIsLoading(false);
        setAuthChecked(true);
        
        console.log('[AuthContext] Email login successful (admin user):', user);
        
        // Return success immediately with updated state info
        return { success: true, user, isAuthenticated: true };
      } else {
        throw new Error(response.data.error || 'Login failed');
      }
    } catch (error) {
      console.error('[AuthContext] Email login failed:', error);
      console.error('[AuthContext] Error response data:', error.response?.data);
      console.error('[AuthContext] Error status:', error.response?.status);
      
      // Clear state on login failure
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      
      throw error;
    }
  };

  // Login with OAuth tokens (from OAuth callback)
  const loginWithOAuth = async (tokens) => {
    try {
      console.log('[AuthContext] Processing OAuth login...');
      const { token, refreshToken } = tokens;
      
      // Store tokens in cookies
      const cookieOptions = {
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
      };
      
      document.cookie = `authToken=${token}; expires=${cookieOptions.expires.toUTCString()}; path=${cookieOptions.path}`;
      document.cookie = `refreshToken=${refreshToken}; expires=${cookieOptions.expires.toUTCString()}; path=${cookieOptions.path}`;
      
      // Get user info
      const response = await api.get('/auth/me');
      if (response.data.success) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        console.log('[AuthContext] OAuth login successful');
        return { success: true };
      } else {
        throw new Error('Failed to get user info');
      }
    } catch (error) {
      console.error('[AuthContext] OAuth login failed:', error);
      throw error;
    }
  };

  // Unified login method that handles both types
  const login = async (credentials) => {
    // If credentials has token and refreshToken, it's OAuth login
    if (credentials.token && credentials.refreshToken) {
      return await loginWithOAuth(credentials);
    }
    
    // Otherwise, it's email/password login
    return await loginWithEmail(credentials);
  };

  // Clear authentication state (internal helper)
  const clearAuthState = () => {
    setUser(null);
    setIsAuthenticated(false);
    // Note: We don't clear cookies here as they are HttpOnly and managed by the backend
  };

  // Logout
  const logout = async () => {
    try {
      // Call logout endpoint to clear server-side cookies
      await api.post('/auth/logout');
    } catch (error) {
      console.error('[AuthContext] Logout API call failed:', error);
    } finally {
      // Clear state
      clearAuthState();

      console.log('[AuthContext] User logged out');
    }
  };

  // Refresh token
  const refreshAuth = async () => {
    try {
      const response = await api.post('/auth/refresh');
      if (response.data.success) {
        // Backend handles cookie updates automatically
        return { success: true };
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      console.error('[AuthContext] Token refresh failed:', error);
      logout();
      throw error;
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    authChecked,
    login,
    logout,
    refreshAuth,
    checkAuthStatus,
    clearAuthState
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
