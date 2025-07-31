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
  const [branding, setBranding] = useState({
    name: 'Linkage VA Hub',
    logo: '/logo.png',
    logoUrl: 'https://storage.googleapis.com/msgsndr/H12yHzS5PDSz1dtmxbxH/media/688ab56f0299a1fefc1986e5.png',
    primaryColor: '#1f2937',
    accentColor: '#3b82f6',
    allowVARegistration: true,
    allowBusinessRegistration: true,
    userType: 'va',
    isESystemsMode: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const response = await api.get('/system/branding');
        setBranding({
          ...response.data.data,
          // Ensure logoUrl is set
          logoUrl: response.data.data.logoUrl || response.data.data.logo || 'https://storage.googleapis.com/msgsndr/H12yHzS5PDSz1dtmxbxH/media/688ab56f0299a1fefc1986e5.png'
        });
      } catch (error) {
        console.error('Failed to fetch branding:', error);
        // Keep default branding on error
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