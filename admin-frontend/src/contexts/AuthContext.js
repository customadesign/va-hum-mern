import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

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
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setIsLoading(false);
          return;
        }

        // Set axios default header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Verify token with backend
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/auth/me`);
        
        if (response.data.success && response.data.user.admin) {
          setUser(response.data.user);
          setIsAuthenticated(true);
        } else {
          // User is not admin, clear token
          localStorage.removeItem('authToken');
          delete axios.defaults.headers.common['Authorization'];
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('authToken');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []); // Run only once on mount

  const checkAuthStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setIsLoading(false);
        setIsAuthenticated(false);
        setUser(null);
        return;
      }

      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Verify token with backend
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/auth/me`);
      
      if (response.data.success && response.data.user.admin) {
        setUser(response.data.user);
        setIsAuthenticated(true);
      } else {
        // User is not admin, clear token
        localStorage.removeItem('authToken');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('authToken');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/auth/login`, {
        email,
        password
      });

      if (response.data.success) {
        const { token, user: userData } = response.data;
        
        // Check if user is admin
        if (!userData.admin) {
          throw new Error('Access denied. Admin privileges required.');
        }

        localStorage.setItem('authToken', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        setUser(userData);
        setIsAuthenticated(true);
        
        return { success: true };
      }
    } catch (error) {
      console.error('Login failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || error.message || 'Login failed' 
      };
    }
  };

  const loginWithOAuth = async (provider, code, state) => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/auth/${provider}/callback`, {
        code,
        state
      });

      if (response.data.success) {
        const { token, user: userData } = response.data;
        
        // Check if user is admin
        if (!userData.admin) {
          throw new Error('Access denied. Admin privileges required.');
        }

        localStorage.setItem('authToken', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        setUser(userData);
        setIsAuthenticated(true);
        
        return { success: true };
      }
    } catch (error) {
      console.error('OAuth login failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || error.message || 'OAuth login failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
  };

  const getOAuthUrl = (provider) => {
    const baseUrl = process.env.REACT_APP_API_URL;
    const redirectUri = `${window.location.origin}/auth/callback`;
    return `${baseUrl}/auth/${provider}?redirect_uri=${encodeURIComponent(redirectUri)}`;
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    loginWithOAuth,
    logout,
    getOAuthUrl,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
