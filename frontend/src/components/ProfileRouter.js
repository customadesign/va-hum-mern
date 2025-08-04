import React from 'react';
import { Navigate } from 'react-router-dom';
import { useBranding } from '../contexts/BrandingContext';
import VAProfile from '../pages/VAs/Profile';
import BusinessProfile from '../pages/Business/Profile';

export default function ProfileRouter() {
  const { branding, loading: brandingLoading } = useBranding();

  // Show loading while branding context loads
  if (brandingLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // In E Systems mode, /va/profile should show the business profile
  if (branding.isESystemsMode) {
    return <BusinessProfile />;
  }

  // In regular mode, show the VA profile
  return <VAProfile />;
}