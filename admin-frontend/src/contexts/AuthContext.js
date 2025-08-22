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
  const skipNextCheck = useRef(false);

  // Single auth check function used everywhere
  const checkAuthStatus = useCallback(async (skipCheck = false) => {
    console.log('[AuthContext] checkAuthStatus called, skipCheck:', skipCheck, 'skipNextCheck:', skipNextCheck.current);
    
    // Skip if explicitly told to (after login)
    if (skipCheck || skipNextCheck.current) {
      console.log('[AuthContext] Skipping auth check');
      skipNextCheck.current = false;
      return;
    }

    // Prevent concurrent auth checks
    if (isCheckingAuth.current) {
      console.log('[AuthContext] Auth check already in progress, skipping');
      return;
    }
    isCheckingAuth.current = true;

    try {
      const token = localStorage.getItem('authToken');
      console.log('[AuthContext] Auth check - token exists:', !!token);
      console.log('[AuthContext] Token value:', token ? token.substring(0, 20) + '...' : 'null');
      
      if (!token) {
        console.log('[AuthContext] No token found, clearing auth state');
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
      console.log('[AuthContext] Checking auth status with:', `${apiUrl}/auth/me`);
      console.log('[AuthContext] Environment:', process.env.NODE_ENV);
      console.log('[AuthContext] API URL from env:', process.env.REACT_APP_API_URL);
      
      const response = await axios.get(`${apiUrl}/auth/me`, {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('[AuthContext] Auth response:', response.data);
      console.log('[AuthContext] User admin status:', response.data?.user?.admin);
      if (response.data.success && response.data.user) {
        if (response.data.user.admin === true) {
          console.log('[AuthContext] ✅ User is admin, setting authenticated');
          console.log('[AuthContext] Setting user:', response.data.user.email);
          setUser(response.data.user);
          setIsAuthenticated(true);
          console.log('[AuthContext] Auth state updated - isAuthenticated: true');
        } else {
          // User is not admin, clear token
          console.warn('[AuthContext] ❌ User is not admin:', response.data.user.email);
          localStorage.removeItem('authToken');
          delete axios.defaults.headers.common['Authorization'];
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        console.log('[AuthContext] Invalid response structure:', response.data);
        throw new Error('Invalid response');
      }
    } catch (error) {
      console.error('[AuthContext] Auth check failed:', error.response?.data || error.message);
      console.error('[AuthContext] Error status:', error.response?.status);
      console.error('[AuthContext] Full error:', error);
      
      // Only clear auth if it's a 401 or 403 error
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('[AuthContext] Auth error (401/403), clearing auth state');
        localStorage.removeItem('authToken');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
        setIsAuthenticated(false);
      } else {
        // For other errors (network, etc), keep the existing auth state
        // This prevents logout on temporary network issues
        console.log('[AuthContext] Non-auth error, keeping existing auth state');
        console.log('[AuthContext] Current auth state - isAuthenticated:', isAuthenticated, 'user:', user?.email);
      }
    } finally {
      console.log('[AuthContext] Auth check complete, setting isLoading to false');
      setIsLoading(false);
      isCheckingAuth.current = false;
    }
  }, []);

  // Check if user is authenticated on app load
  useEffect(() => {
    console.log('[AuthContext] Initial mount, calling checkAuthStatus');
    checkAuthStatus();
  }, []); // Run only once on mount

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

      console.log('[Login] Response:', response.data);
      console.log('[Login] User admin status:', response.data?.user?.admin);

      if (response.data.success) {
        const { token, user: userData } = response.data;
        
        // Check if user is admin
        if (userData.admin !== true) {
          console.warn('[Login] ❌ User is not admin:', userData.email);
          throw new Error('Access denied. Admin privileges required.');
        }

        console.log('[Login] ✅ User is admin, storing token');
        // Store token in localStorage
        localStorage.setItem('authToken', token);
        
        // Set axios default header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        console.log('[Login] Setting auth state for user:', userData.email);
        
        // Skip the next auth check to prevent race condition
        skipNextCheck.current = true;
        isCheckingAuth.current = false;
        
        // Set state directly without triggering another auth check
        setUser(userData);
        setIsAuthenticated(true);
        setIsLoading(false);
        
        console.log('[Login] Auth state set - isAuthenticated: true, skipNextCheck: true');
        
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
        
        // Skip the next auth check to prevent race condition
        skipNextCheck.current = true;
        isCheckingAuth.current = false;
        
        // Set state directly without triggering another auth check
        setUser(userData);
        setIsAuthenticated(true);
        setIsLoading(false);
        
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
    setIsLoading(false);
    // Reset the auth check flags
    isCheckingAuth.current = false;
    skipNextCheck.current = false;
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
