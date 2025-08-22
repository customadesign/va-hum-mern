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

  // Check authentication status
  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setIsLoading(false);
        return;
      }

      // Set the token in API headers
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      const response = await api.get('/auth/me');
      if (response.data.success) {
        setUser(response.data.user);
        setIsAuthenticated(true);
      } else {
        // Clear invalid token
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        delete api.defaults.headers.common['Authorization'];
      }
    } catch (error) {
      console.error('Auth status check failed:', error);
      // Clear invalid tokens
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      delete api.defaults.headers.common['Authorization'];
    } finally {
      setIsLoading(false);
    }
  };

  // Login with email and password
  const loginWithEmail = async (credentials) => {
    try {
      const response = await api.post('/auth/admin/login', credentials);
      
      if (response.data.success) {
        const { token, refreshToken, user } = response.data;
        
        // Store tokens
        localStorage.setItem('authToken', token);
        localStorage.setItem('refreshToken', refreshToken);
        
        // Set token in API headers
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Update state
        setUser(user);
        setIsAuthenticated(true);
        
        return { success: true };
      } else {
        throw new Error(response.data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Email login failed:', error);
      throw error;
    }
  };

  // Login with OAuth tokens (from OAuth callback)
  const loginWithOAuth = async (tokens) => {
    try {
      const { token, refreshToken } = tokens;
      
      // Store tokens
      localStorage.setItem('authToken', token);
      localStorage.setItem('refreshToken', refreshToken);
      
      // Set token in API headers
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Get user info
      const response = await api.get('/auth/me');
      if (response.data.success) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        return { success: true };
      } else {
        throw new Error('Failed to get user info');
      }
    } catch (error) {
      console.error('OAuth login failed:', error);
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
  const logout = () => {
    // Clear tokens
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    
    // Clear API headers
    delete api.defaults.headers.common['Authorization'];
    
    // Clear state
    setUser(null);
    setIsAuthenticated(false);
  };

  // Refresh token
  const refreshAuth = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await api.post('/auth/refresh', { refreshToken });
      if (response.data.success) {
        const { token, refreshToken: newRefreshToken } = response.data;
        
        // Update tokens
        localStorage.setItem('authToken', token);
        localStorage.setItem('refreshToken', newRefreshToken);
        
        // Update API headers
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        return { success: true };
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
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
