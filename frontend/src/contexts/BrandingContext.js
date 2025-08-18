import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './HybridAuthContext';

const BrandingContext = createContext();

export const useBranding = () => {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
};

export const BrandingProvider = ({ children }) => {
  const { user } = useAuth();
  
  // Check if we're in E-systems mode based on environment variable or user role
  const isESystemsEnv = process.env.REACT_APP_BRAND === 'esystems';
  const isESystemsMode = isESystemsEnv || (user?.role === 'business');
  
  const [branding, setBranding] = useState({
    name: isESystemsMode ? 'E-Systems Management' : 'Linkage VA Hub',
    logo: isESystemsMode ? 'https://storage.googleapis.com/msgsndr/dXPpkZ3hX5PCKayZrLsI/media/66fb8d59595de9f3ad14ac4c.png' : 'https://storage.googleapis.com/msgsndr/H12yHzS5PDSz1dtmxbxH/media/688ab56f0299a1fefc1986e5.png',
    logoUrl: isESystemsMode ? 'https://storage.googleapis.com/msgsndr/dXPpkZ3hX5PCKayZrLsI/media/66fb8d59595de9f3ad14ac4c.png' : 'https://storage.googleapis.com/msgsndr/H12yHzS5PDSz1dtmxbxH/media/688ab56f0299a1fefc1986e5.png',
    primaryColor: '#1f2937',
    accentColor: '#3b82f6',
    allowVARegistration: !isESystemsMode,
    allowBusinessRegistration: true,
    userType: isESystemsMode ? 'business' : 'va',
    isESystemsMode
  });
  const [loading, setLoading] = useState(true);

  // Update branding when user role changes
  useEffect(() => {
    const currentIsESystemsMode = isESystemsEnv || (user?.role === 'business');
    console.log('🎨 Branding update:', { 
      userRole: user?.role, 
      isESystemsEnv, 
      currentIsESystemsMode,
      hasUser: !!user 
    });
    
    setBranding(prev => ({
      ...prev,
      name: currentIsESystemsMode ? 'E-Systems Management' : 'Linkage VA Hub',
      logo: currentIsESystemsMode ? 'https://storage.googleapis.com/msgsndr/dXPpkZ3hX5PCKayZrLsI/media/66fb8d59595de9f3ad14ac4c.png' : 'https://storage.googleapis.com/msgsndr/H12yHzS5PDSz1dtmxbxH/media/688ab56f0299a1fefc1986e5.png',
      logoUrl: currentIsESystemsMode ? 'https://storage.googleapis.com/msgsndr/dXPpkZ3hX5PCKayZrLsI/media/66fb8d59595de9f3ad14ac4c.png' : 'https://storage.googleapis.com/msgsndr/H12yHzS5PDSz1dtmxbxH/media/688ab56f0299a1fefc1986e5.png',
      allowVARegistration: !currentIsESystemsMode,
      userType: currentIsESystemsMode ? 'business' : 'va',
      isESystemsMode: currentIsESystemsMode
    }));
  }, [user?.role, isESystemsEnv, user]);

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const response = await api.get('/system/branding');
        const currentIsESystemsMode = isESystemsEnv || (user?.role === 'business');
        setBranding(prev => ({
          ...response.data.data,
          // Ensure logoUrl is set
          logoUrl: response.data.data.logoUrl || response.data.data.logo || 'https://storage.googleapis.com/msgsndr/H12yHzS5PDSz1dtmxbxH/media/688ab56f0299a1fefc1986e5.png',
          // Override with user role or environment variable
          ...prev,
          isESystemsMode: currentIsESystemsMode
        }));
      } catch (error) {
        console.error('Failed to fetch branding:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBranding();
  }, [user?.role, isESystemsEnv]);

  const setBrandingTheme = (isESystemsMode) => {
    // Theme is now automatically determined by user role
    // This function is kept for backward compatibility but doesn't do anything
    console.log('Theme is now automatically determined by user role');
  };

  return (
    <BrandingContext.Provider value={{ branding, loading, setBrandingTheme }}>
      {children}
    </BrandingContext.Provider>
  );
};