import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

// Configure axios defaults
axios.defaults.withCredentials = true;

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
  const isCheckingAuth = useRef(false);
  const hasInitialized = useRef(false);

  // Check if user is authenticated on app load
  useEffect(() => {
    // Prevent multiple simultaneous auth checks
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const checkAuthStatus = async () => {
      // Prevent concurrent auth checks
      if (isCheckingAuth.current) return;
      isCheckingAuth.current = true;

      try {
        const token = localStorage.getItem('authToken');
        console.log('Initial auth check - token exists:', !!token);
        
        if (!token) {
          console.log('No token found, user not authenticated');
          setIsLoading(false);
          setIsAuthenticated(false);
          setUser(null);
          isCheckingAuth.current = false;
          return;
        }

        // Set axios default header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Verify token with backend
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
        console.log('Checking auth status with:', `${apiUrl}/auth/me`);
        console.log('Environment:', process.env.NODE_ENV);
        console.log('API URL from env:', process.env.REACT_APP_API_URL);
        
        const response = await axios.get(`${apiUrl}/auth/me`, {
          withCredentials: true,
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('Auth response:', response.data);
        if (response.data.success && response.data.user) {
          if (response.data.user.admin === true) {
            console.log('User is admin, setting authenticated');
            setUser(response.data.user);
            setIsAuthenticated(true);
          } else {
            // User is not admin, clear token
            console.warn('User is not admin:', response.data.user.email);
            localStorage.removeItem('authToken');
            delete axios.defaults.headers.common['Authorization'];
            setUser(null);
            setIsAuthenticated(false);
          }
        } else {
          console.log('Invalid response structure');
          throw new Error('Invalid response');
        }
      } catch (error) {
        console.error('Auth check failed:', error.response?.data || error.message);
        console.error('Full error:', error);
        
        // Only clear auth if it's a 401 or 403 error
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem('authToken');
          delete axios.defaults.headers.common['Authorization'];
          setUser(null);
          setIsAuthenticated(false);
        } else {
          // For other errors (network, etc), keep the existing auth state
          // This prevents logout on temporary network issues
          console.log('Keeping existing auth state due to non-auth error');
        }
      } finally {
        setIsLoading(false);
        isCheckingAuth.current = false;
      }
    };

    checkAuthStatus();
  }, []); // Run only once on mount

  const checkAuthStatus = useCallback(async () => {
    // Prevent concurrent auth checks
    if (isCheckingAuth.current) return;
    isCheckingAuth.current = true;

    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      console.log('Manual auth check - token exists:', !!token);
      
      if (!token) {
        setIsLoading(false);
        setIsAuthenticated(false);
        setUser(null);
        isCheckingAuth.current = false;
        return;
      }

      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Verify token with backend
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
      console.log('Checking auth status with:', `${apiUrl}/auth/me`);
      
      const response = await axios.get(`${apiUrl}/auth/me`, {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Auth response:', response.data);
      if (response.data.success && response.data.user) {
        if (response.data.user.admin === true) {
          console.log('User is admin, maintaining authentication');
          setUser(response.data.user);
          setIsAuthenticated(true);
        } else {
          // User is not admin, clear token
          console.warn('User is not admin:', response.data.user.email);
          localStorage.removeItem('authToken');
          delete axios.defaults.headers.common['Authorization'];
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        throw new Error('Invalid response structure');
      }
    } catch (error) {
      console.error('Auth check failed:', error.response?.data || error.message);
      
      // Only clear auth if it's a 401 or 403 error
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('authToken');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
        setIsAuthenticated(false);
      }
    } finally {
      setIsLoading(false);
      isCheckingAuth.current = false;
    }
  }, []);

  const login = async (email, password) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
      console.log('Logging in to:', `${apiUrl}/auth/login`);
      console.log('Environment:', process.env.NODE_ENV);
      
      const response = await axios.post(`${apiUrl}/auth/login`, {
        email,
        password
      }, {
        withCredentials: true // Important for cookies
      });

      console.log('Login response:', response.data);

      if (response.data.success) {
        const { token, user: userData } = response.data;
        
        // Check if user is admin
        if (userData.admin !== true) {
          console.warn('User is not admin:', userData.email);
          throw new Error('Access denied. Admin privileges required.');
        }

        // Store token in localStorage
        localStorage.setItem('authToken', token);
        
        // Set axios default header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        console.log('Login successful, setting user:', userData.email);
        setUser(userData);
        setIsAuthenticated(true);
        
        // Set a flag to prevent re-checking auth immediately after login
        isCheckingAuth.current = false;
        
        return { success: true };
      } else {
        throw new Error(response.data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login failed:', error.response?.data || error.message);
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
    // Reset the auth check flags
    isCheckingAuth.current = false;
    hasInitialized.current = false;
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
