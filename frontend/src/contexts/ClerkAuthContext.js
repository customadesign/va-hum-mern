import React, { createContext, useState, useContext, useEffect } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api, { setTokenGetter } from '../services/api';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const { user: clerkUser, isLoaded: clerkLoaded, isSignedIn } = useUser();
  const { getToken, signOut: clerkSignOut } = useClerkAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Set up API service to use Clerk token getter
  useEffect(() => {
    setTokenGetter(getToken);
  }, [getToken]);

  // Sync user data when Clerk user changes
  useEffect(() => {
    if (clerkLoaded) {
      if (isSignedIn && clerkUser) {
        syncUserData();
      } else {
        setUser(null);
        setLoading(false);
      }
    }
  }, [clerkLoaded, isSignedIn, clerkUser]);

  const syncUserData = async () => {
    try {
      setLoading(true);
      
      // Get Clerk token for API authentication
      const token = await getToken();
      
      // Sync user data with our backend
      const response = await api.post('/clerk/sync-user', {
        clerkUserId: clerkUser.id
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setUser(response.data.user);
      
      // Check if user needs to complete profile
      if (!response.data.user.role) {
        navigate('/profile-setup');
      }
    } catch (error) {
      console.error('Error syncing user data:', error);
      
      // If user not found in our database, they need to complete profile
      if (error.response?.status === 404 || error.response?.data?.needsOnboarding) {
        navigate('/profile-setup');
      } else {
        toast.error('Failed to load user data');
      }
    } finally {
      setLoading(false);
    }
  };

  const completeProfile = async (profileData) => {
    try {
      const token = await getToken();
      
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

  const logout = async () => {
    try {
      await clerkSignOut();
      setUser(null);
      navigate('/');
      toast.info('Logged out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  // Helper function to get authenticated API token
  const getAuthToken = async () => {
    try {
      return await getToken();
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  const value = {
    // User data
    user,
    clerkUser,
    loading: loading || !clerkLoaded,
    isAuthenticated: isSignedIn && !!user,
    
    // User type checks
    isVA: !!user?.va,
    isBusiness: !!user?.business,
    isAdmin: !!user?.admin,
    needsProfileSetup: isSignedIn && !user?.role,
    
    // Auth methods
    completeProfile,
    logout,
    updateUser,
    syncUserData,
    getAuthToken,
    
    // Clerk-specific
    clerkLoaded,
    isSignedIn
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};