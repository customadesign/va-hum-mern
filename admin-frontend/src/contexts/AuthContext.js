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

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Helper function to get cookie value
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  };

  // Check authentication status
  const checkAuthStatus = async () => {
    try {
      console.log('[AuthContext] Checking authentication status...');
      const token = getCookie('authToken');
      
      if (!token) {
        console.log('[AuthContext] No auth token found');
        setIsAuthenticated(false);
        setUser(null);
        setIsLoading(false);
        return;
      }

      // Set the token in API headers for this request
      const response = await api.get('/auth/admin/me');
      
      if (response.data.success) {
        console.log('[AuthContext] User authenticated:', response.data.user);
        setUser(response.data.user);
        setIsAuthenticated(true);
      } else {
        console.log('[AuthContext] Authentication failed:', response.data.error);
        setUser(null);
        setIsAuthenticated(false);
        // Clear invalid token cookie
        document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      }
    } catch (error) {
      console.error('[AuthContext] Auth check error:', error);
      setUser(null);
      setIsAuthenticated(false);
      // Clear invalid token cookie
      document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    } finally {
      setIsLoading(false);
    }
  };

  // Login with email and password
  const loginWithEmail = async (credentials) => {
    try {
      console.log('[AuthContext] Attempting email login...');
      const response = await api.post('/auth/admin/login', credentials);
      
      if (response.data.success) {
        const { token, refreshToken, user } = response.data;
        
        // Store tokens in cookies (secure, httpOnly)
        const cookieOptions = {
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          path: '/',
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
        };
        
        document.cookie = `authToken=${token}; expires=${cookieOptions.expires.toUTCString()}; path=${cookieOptions.path}`;
        document.cookie = `refreshToken=${refreshToken}; expires=${cookieOptions.expires.toUTCString()}; path=${cookieOptions.path}`;
        
        // Update state
        setUser(user);
        setIsAuthenticated(true);
        
        console.log('[AuthContext] Email login successful');
        return { success: true };
      } else {
        throw new Error(response.data.error || 'Login failed');
      }
    } catch (error) {
      console.error('[AuthContext] Email login failed:', error);
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
      const response = await api.get('/auth/admin/me');
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

  // Logout
  const logout = async () => {
    try {
      // Call logout endpoint to clear server-side cookies
      await api.post('/auth/admin/logout');
    } catch (error) {
      console.error('[AuthContext] Logout API call failed:', error);
    } finally {
      // Clear client-side cookies
      document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      
      // Clear state
      setUser(null);
      setIsAuthenticated(false);
      
      console.log('[AuthContext] User logged out');
    }
  };

  // Refresh token
  const refreshAuth = async () => {
    try {
      const refreshToken = getCookie('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await api.post('/auth/refresh', { refreshToken });
      if (response.data.success) {
        const { token, refreshToken: newRefreshToken } = response.data;
        
        // Update cookies
        const cookieOptions = {
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          path: '/',
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
        };
        
        document.cookie = `authToken=${token}; expires=${cookieOptions.expires.toUTCString()}; path=${cookieOptions.path}`;
        document.cookie = `refreshToken=${newRefreshToken}; expires=${cookieOptions.expires.toUTCString()}; path=${cookieOptions.path}`;
        
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
    login,
    logout,
    refreshAuth,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
