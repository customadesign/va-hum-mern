import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const BrandingContext = createContext();

export const useBranding = () => {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
};

export const BrandingProvider = ({ children }) => {
  // Check if we're in E-systems mode based on environment variable
  const isESystemsEnv = process.env.REACT_APP_BRAND === 'esystems';
  
  const [branding, setBranding] = useState({
    name: isESystemsEnv ? 'E-Systems Management' : 'Linkage VA Hub',
    logo: isESystemsEnv ? 'https://storage.googleapis.com/msgsndr/dXPpkZ3hX5PCKayZrLsI/media/66fb8d59595de9f3ad14ac4c.png' : 'https://storage.googleapis.com/msgsndr/H12yHzS5PDSz1dtmxbxH/media/688ab56f0299a1fefc1986e5.png',
    logoUrl: isESystemsEnv ? 'https://storage.googleapis.com/msgsndr/dXPpkZ3hX5PCKayZrLsI/media/66fb8d59595de9f3ad14ac4c.png' : 'https://storage.googleapis.com/msgsndr/H12yHzS5PDSz1dtmxbxH/media/688ab56f0299a1fefc1986e5.png',
    primaryColor: '#1f2937',
    accentColor: '#3b82f6',
    allowVARegistration: !isESystemsEnv,
    allowBusinessRegistration: true,
    userType: isESystemsEnv ? 'business' : 'va',
    isESystemsMode: isESystemsEnv
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const response = await api.get('/system/branding');
        setBranding({
          ...response.data.data,
          // Ensure logoUrl is set
          logoUrl: response.data.data.logoUrl || response.data.data.logo || 'https://storage.googleapis.com/msgsndr/H12yHzS5PDSz1dtmxbxH/media/688ab56f0299a1fefc1986e5.png',
          // Override with environment variable if set
          isESystemsMode: isESystemsEnv || response.data.data.isESystemsMode
        });
      } catch (error) {
        console.error('Failed to fetch branding:', error);
        // If API fails but we have env var, still use E-systems branding
        if (isESystemsEnv) {
          setBranding(prev => ({
            ...prev,
            isESystemsMode: true
          }));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBranding();
  }, []);

  return (
    <BrandingContext.Provider value={{ branding, loading }}>
      {children}
    </BrandingContext.Provider>
  );
};