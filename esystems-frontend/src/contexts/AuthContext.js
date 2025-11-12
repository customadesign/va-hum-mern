import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import authService from '../services/auth';
import { setTokenGetter } from '../services/api';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Token getter for API service
  const getToken = useCallback(() => {
    return localStorage.getItem('token');
  }, []);

  // Set up API service to use token getter
  useEffect(() => {
    setTokenGetter(getToken);
  }, [getToken]);

  // Check if user is logged in on mount
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

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await authService.getMe();
        setUser(response.user);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password, twoFactorCode = null) => {
    try {
      console.log('🔐 Starting login process...', { email, hasTwoFactor: !!twoFactorCode });
      const response = await authService.login(email, password, twoFactorCode);
      console.log('✅ Login response received:', { 
        success: !!response, 
        hasToken: !!response.token,
        hasUser: !!response.user,
        requiresTwoFactor: !!response.requiresTwoFactor,
        userEmail: response.user?.email,
        userAdmin: response.user?.admin
      });
      
      // If 2FA is required, return the response for handling in login component
      if (response.requiresTwoFactor) {
        return response;
      }
      
      // Store tokens
      localStorage.setItem('token', response.token);
      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken);
      }
      
      setUser(response.user);
      
      // Redirect based on user type
      if (response.user.admin) {
        console.log('🎯 Redirecting to admin dashboard');
        navigate('/admin');
      } else if (!response.user.va && !response.user.business) {
        console.log('🎯 Redirecting to profile setup');
        navigate('/profile-setup');
      } else {
        console.log('🎯 Redirecting to dashboard');
        navigate('/dashboard');
      }
      
      toast.success('Welcome back!');
      return response;
    } catch (error) {
      console.error('❌ Login error:', error);
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        config: error.config,
        request: error.request
      });
      
      // More specific error handling
      if (error.response?.status === 400) {
        const errorMsg = error.response?.data?.error || error.response?.data?.errors?.[0]?.msg || 'Invalid request';
        toast.error(`Login failed: ${errorMsg}`);
      } else if (error.response?.status === 401) {
        toast.error('Invalid email or password');
      } else if (error.response?.status === 403) {
        toast.error('Account suspended or access denied');
      } else {
        toast.error(error.response?.data?.error || 'Login failed - please try again');
      }
      throw error;
    }
  };

  const register = async (email, password, referralCode) => {
    try {
      const response = await authService.register(email, password, referralCode);
      
      // Store tokens
      localStorage.setItem('token', response.token);
      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken);
      }
      
      setUser(response.user);
      
      // Show verification message
      toast.success('Registration successful! Please check your email to verify your account.');
      
      // Redirect to email verification page instead of profile setup
      navigate('/verify-email-sent');
      
      return response;
    } catch (error) {
      toast.error(error.response?.data?.error || 'Registration failed');
      throw error;
    }
  };

  const logout = useCallback(async () => {
    try {
      // Call logout endpoint to invalidate refresh token
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      setUser(null);
      navigate('/');
      toast.success('Logged out successfully');
    }
  }, [navigate]);

  const refreshToken = async () => {
    try {
      const storedRefreshToken = localStorage.getItem('refreshToken');
      if (!storedRefreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await authService.refreshToken(storedRefreshToken);
      
      // Update access token
      localStorage.setItem('token', response.token);
      
      return response.token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Force logout if refresh fails
      logout();
      throw error;
    }
  };

  const updateUser = async (updates) => {
    try {
      const response = await authService.updateProfile(updates);
      setUser(response.user);
      return response.user;
    } catch (error) {
      toast.error('Failed to update profile');
      throw error;
    }
  };

  const deleteAccount = async () => {
    try {
      await authService.deleteAccount();
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      setUser(null);
      navigate('/');
      toast.success('Account deleted successfully');
    } catch (error) {
      toast.error('Failed to delete account');
      throw error;
    }
  };

  const resendVerificationEmail = async (email) => {
    try {
      await authService.resendVerificationEmail(email);
      toast.success('Verification email sent! Please check your inbox.');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to send verification email');
      throw error;
    }
  };

  const linkedinLogin = async () => {
    try {
      // This function handles LinkedIn OAuth flow
      // The actual OAuth redirect is handled by LinkedInLoginButton component
      // This function can be used for any post-LinkedIn auth processing if needed
      console.log('LinkedIn login initiated');
    } catch (error) {
      console.error('LinkedIn login error:', error);
      toast.error('LinkedIn login failed. Please try again.');
      throw error;
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isVerified: user?.isVerified || false,
    isBusiness: !!user?.business,
    isVA: !!user?.va,
    isAdmin: !!user?.admin,
    login,
    linkedinLogin,
    register,
    logout,
    refreshToken,
    updateUser,
    deleteAccount,
    checkAuth,
    resendVerificationEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};