import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import authService from '../services/auth';

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
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      localStorage.setItem('token', response.token);
      setUser(response.user);
      
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

  const linkedinLogin = () => {
    // E-Systems frontend ALWAYS routes to E-Systems backend
    const backendUrl = process.env.NODE_ENV === 'production' 
      ? 'https://esystems-management-hub.onrender.com'  // Updated to correct backend URL
      : 'http://localhost:5000';
      
    console.log('E-Systems LinkedIn OAuth redirecting to:', `${backendUrl}/api/auth/linkedin`);
    window.location.href = `${backendUrl}/api/auth/linkedin`;
  };

  const register = async (email, password, referralCode) => {
    try {
      const response = await authService.register(email, password, referralCode);
      localStorage.setItem('token', response.token);
      setUser(response.user);
      navigate('/profile-setup');
      toast.success('Account created successfully!');
      return response;
    } catch (error) {
      toast.error(error.response?.data?.error || 'Registration failed');
      throw error;
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/');
    toast.info('Logged out successfully');
  }, [navigate]);

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const value = {
    user,
    loading,
    login,
    linkedinLogin,
    register,
    logout,
    updateUser,
    checkAuth,
    isAuthenticated: !!user,
    isVA: !!user?.va,
    isBusiness: !!user?.business,
    isAdmin: !!user?.admin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};