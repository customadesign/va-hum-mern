import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api, { setTokenGetter } from '../services/api';
import authService from '../services/auth';
import linkedinAuthService from '../services/linkedinAuth';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // Clerk auth hooks
  const { user: clerkUser, isLoaded: clerkLoaded, isSignedIn } = useUser();
  const { getToken: getClerkToken, signOut: clerkSignOut } = useClerkAuth();
  
  // Local state
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authMethod, setAuthMethod] = useState(null); // 'clerk' | 'jwt' | null
  const navigate = useNavigate();

  // Hybrid token getter for API service
  const getHybridToken = useCallback(async () => {
    try {
      // Try Clerk first if available and signed in
      if (isSignedIn && getClerkToken) {
        const clerkToken = await getClerkToken();
        if (clerkToken) {
          return clerkToken;
        }
      }
      
      // Fall back to JWT token from localStorage
      const jwtToken = localStorage.getItem('token');
      return jwtToken;
    } catch (error) {
      console.error('Error getting hybrid token:', error);
      // Fall back to JWT token
      return localStorage.getItem('token');
    }
  }, [isSignedIn, getClerkToken]);

  // Set up API service to use hybrid token getter
  useEffect(() => {
    setTokenGetter(getHybridToken);
  }, [getHybridToken]);

  // Check authentication on mount and handle OAuth responses
  useEffect(() => {
    checkAuth();
    
    // Check for OAuth success/error parameters in URL
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const welcome = urlParams.get('welcome');
    
    if (error) {
      if (error === 'oauth_failed') {
        toast.error('LinkedIn authentication failed. Please try again.');
      } else if (error === 'auth_failed') {
        toast.error('Authentication failed. Please try again.');
      }
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    if (welcome === 'true') {
      toast.success('Welcome! Please complete your profile to get started.');
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Monitor Clerk authentication changes
  useEffect(() => {
    if (clerkLoaded) {
      if (isSignedIn && clerkUser) {
        syncClerkUser();
      } else if (authMethod === 'clerk') {
        // User was signed in with Clerk but now isn't
        setUser(null);
        setAuthMethod(null);
        setLoading(false);
      }
    }
  }, [clerkLoaded, isSignedIn, clerkUser]);

  const checkAuth = async () => {
    try {
      setLoading(true);
      
      // Check if user is signed in with Clerk first
      if (clerkLoaded && isSignedIn && clerkUser) {
        await syncClerkUser();
        return;
      }
      
      // Check for JWT token
      const jwtToken = localStorage.getItem('token');
      if (jwtToken) {
        try {
          const response = await authService.getMe();
          setUser(response.user);
          setAuthMethod('jwt');
        } catch (error) {
          // JWT token is invalid
          localStorage.removeItem('token');
          setUser(null);
          setAuthMethod(null);
        }
      } else {
        setUser(null);
        setAuthMethod(null);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      setUser(null);
      setAuthMethod(null);
    } finally {
      setLoading(false);
    }
  };

  const syncClerkUser = async () => {
    try {
      setLoading(true);
      
      // Get Clerk token for API authentication
      const token = await getClerkToken();
      
      // Sync user data with our backend
      const response = await api.post('/clerk/sync-user', {
        clerkUserId: clerkUser.id
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setUser(response.data.user);
      setAuthMethod('clerk');
      
      // Check if user needs to complete profile
      if (!response.data.user.role) {
        navigate('/profile-setup');
      }
    } catch (error) {
      console.error('Error syncing Clerk user data:', error);
      
      // If user not found in our database, they need to complete profile
      if (error.response?.status === 404 || error.response?.data?.needsOnboarding) {
        navigate('/profile-setup');
      } else {
        toast.error('Failed to load user data');
      }
      setAuthMethod('clerk');
    } finally {
      setLoading(false);
    }
  };

  // JWT Login (legacy support)
  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      localStorage.setItem('token', response.token);
      setUser(response.user);
      setAuthMethod('jwt');
      
      // Redirect based on user type
      if (response.user.va) {
        navigate('/dashboard');
      } else if (response.user.business) {
        navigate('/vas');
      } else {
        navigate('/profile-setup');
      }
      
      toast.success('Welcome back!');
      return response;
    } catch (error) {
      toast.error(error.response?.data?.error || 'Login failed');
      throw error;
    }
  };

  // JWT Registration (legacy support)
  const register = async (email, password, referralCode) => {
    try {
      const response = await authService.register(email, password, referralCode);
      localStorage.setItem('token', response.token);
      setUser(response.user);
      setAuthMethod('jwt');
      navigate('/profile-setup');
      toast.success('Account created successfully!');
      return response;
    } catch (error) {
      toast.error(error.response?.data?.error || 'Registration failed');
      throw error;
    }
  };

  // LinkedIn OAuth
  const linkedinLogin = () => {
    try {
      // Check if LinkedIn is available
      if (!linkedinAuthService.isAvailable()) {
        toast.error('LinkedIn authentication is not configured');
        return;
      }
      
      // Get the OAuth URL and redirect
      const authUrl = linkedinAuthService.getAuthUrl();
      console.log('Redirecting to LinkedIn OAuth:', authUrl);
      window.location.href = authUrl;
    } catch (error) {
      console.error('LinkedIn login error:', error);
      toast.error('Failed to start LinkedIn authentication');
    }
  };

  // Clerk Profile Completion
  const completeProfile = async (profileData) => {
    try {
      const token = await getClerkToken();
      
      const response = await api.post('/clerk/complete-profile', {
        clerkUserId: clerkUser.id,
        ...profileData
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setUser(response.data.user);
      
      // Redirect based on user type
      if (response.data.user.va) {
        navigate('/dashboard');
      } else if (response.data.user.business) {
        navigate('/vas');
      } else {
        navigate('/dashboard');
      }
      
      toast.success('Profile completed successfully!');
      return response.data;
    } catch (error) {
      console.error('Error completing profile:', error);
      toast.error(error.response?.data?.error || 'Failed to complete profile');
      throw error;
    }
  };

  // Hybrid Logout
  const logout = useCallback(async () => {
    try {
      if (authMethod === 'clerk' && clerkSignOut) {
        await clerkSignOut();
      }
      
      // Always clear JWT token
      localStorage.removeItem('token');
      setUser(null);
      setAuthMethod(null);
      navigate('/');
      toast.info('Logged out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  }, [authMethod, clerkSignOut, navigate]);

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  // Helper function to get authenticated API token
  const getAuthToken = async () => {
    try {
      return await getHybridToken();
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  const value = {
    // User data
    user,
    clerkUser,
    loading: loading || (clerkUser && !clerkLoaded),
    authMethod,
    
    // Authentication status
    isAuthenticated: !!user,
    isClerkUser: authMethod === 'clerk',
    isJWTUser: authMethod === 'jwt',
    
    // User type checks
    isVA: !!user?.va,
    isBusiness: !!user?.business,
    isAdmin: !!user?.admin,
    needsProfileSetup: (isSignedIn && !user?.role) || (user && !user.role),
    
    // Auth methods
    login,
    register,
    linkedinLogin,
    completeProfile,
    logout,
    updateUser,
    checkAuth,
    getAuthToken,
    
    // Clerk-specific (when available)
    clerkLoaded,
    isSignedIn,
    syncUserData: syncClerkUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
