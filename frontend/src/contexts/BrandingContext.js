import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

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
  
  // Check if we're in E-systems mode based on environment variable ONLY
  // User role should NOT determine which system we're in
  const isESystemsEnv = process.env.REACT_APP_BRAND === 'esystems';
  
  console.log('🔧 DEBUG: Environment variable check:', {
    REACT_APP_BRAND: process.env.REACT_APP_BRAND,
    isESystemsEnv,
    allEnvVars: Object.keys(process.env).filter(key => key.startsWith('REACT_APP_'))
  });
  
  const [branding, setBranding] = useState({
    name: isESystemsEnv ? 'E-Systems Management' : 'Linkage VA Hub',
    logo: isESystemsEnv ? 'https://storage.googleapis.com/msgsndr/dXPpkZ3hX5PCKayZrLsI/media/66fb8d59595de9f3ad14ac4c.png' : 'https://storage.googleapis.com/msgsndr/H12yHzS5PDSz1dtmxbxH/media/68d7075cfb09760d8bbd35f8.png',
    logoUrl: isESystemsEnv ? 'https://storage.googleapis.com/msgsndr/dXPpkZ3hX5PCKayZrLsI/media/66fb8d59595de9f3ad14ac4c.png' : 'https://storage.googleapis.com/msgsndr/H12yHzS5PDSz1dtmxbxH/media/68d7075cfb09760d8bbd35f8.png',
    primaryColor: '#1f2937',
    accentColor: '#3b82f6',
    allowVARegistration: !isESystemsEnv,
    allowBusinessRegistration: true,
    userType: user?.role || 'va', // Use actual user role, not system mode
    isESystemsMode: isESystemsEnv
  });
  const [loading, setLoading] = useState(true);

  // Update branding when user role changes
  useEffect(() => {
    console.log('🎨 Branding update:', { 
      userRole: user?.role, 
      isESystemsEnv, 
      hasUser: !!user 
    });
    
    setBranding(prev => ({
      ...prev,
      // Keep the system branding based on environment only
      name: isESystemsEnv ? 'E-Systems Management' : 'Linkage VA Hub',
      logo: isESystemsEnv ? 'https://storage.googleapis.com/msgsndr/dXPpkZ3hX5PCKayZrLsI/media/66fb8d59595de9f3ad14ac4c.png' : 'https://storage.googleapis.com/msgsndr/H12yHzS5PDSz1dtmxbxH/media/68d7075cfb09760d8bbd35f8.png',
      logoUrl: isESystemsEnv ? 'https://storage.googleapis.com/msgsndr/dXPpkZ3hX5PCKayZrLsI/media/66fb8d59595de9f3ad14ac4c.png' : 'https://storage.googleapis.com/msgsndr/H12yHzS5PDSz1dtmxbxH/media/68d7075cfb09760d8bbd35f8.png',
      allowVARegistration: !isESystemsEnv,
      // Update userType based on actual user role
      userType: user?.role || 'va',
      isESystemsMode: isESystemsEnv
    }));
  }, [user?.role, isESystemsEnv, user]);

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const response = await api.get('/system/branding');
        const environmentLogo = isESystemsEnv ? 'https://storage.googleapis.com/msgsndr/dXPpkZ3hX5PCKayZrLsI/media/66fb8d59595de9f3ad14ac4c.png' : 'https://storage.googleapis.com/msgsndr/H12yHzS5PDSz1dtmxbxH/media/68d7075cfb09760d8bbd35f8.png';

        setBranding(prev => ({
          ...response.data.data,
          // Keep userType based on actual user role, not system mode
          userType: user?.role || prev.userType || 'va',
          // PRESERVE environment-based system mode - this should NOT be overridden by API
          isESystemsMode: isESystemsEnv,
          name: isESystemsEnv ? 'E-Systems Management' : 'Linkage VA Hub',
          logo: environmentLogo,
          logoUrl: environmentLogo
        }));
      } catch (error) {
        console.error('Failed to fetch branding:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBranding();
  }, [user?.role]);

  const setBrandingTheme = (requestedRole) => {
    console.log('🎨 Setting user role during profile setup:', requestedRole);
    
    // This should only update the userType, not switch between systems
    // The system (Linkage vs E Systems) is determined by environment only
    setBranding(prev => ({
      ...prev,
      // Keep the system branding unchanged
      userType: requestedRole || 'va'
    }));
  };

  return (
    <BrandingContext.Provider value={{ branding, loading, setBrandingTheme }}>
      {children}
    </BrandingContext.Provider>
  );
};