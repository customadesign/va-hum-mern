import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useBranding } from '../contexts/BrandingContext';
import VAProfile from '../pages/VAs/Profile';
import BusinessProfile from '../pages/Business/Profile';

export default function ProfileRouter() {
  const { user, loading } = useAuth();
  const { branding } = useBranding();

  // Show loading while auth loads
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Route based on system branding and user type
  if (branding.isESystemsMode) {
    // E-Systems Management - Business profiles only
    if (user.business || user.role === 'business') {
      return <BusinessProfile />;
    }
    
    // If VA tries to access E-Systems, redirect them
    if (user.va || user.role === 'va') {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
                  <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  VA Account Detected
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  This is E-Systems Management for businesses only. Virtual Assistant accounts should use Linkage VA Hub.
                </p>
                <div className="mt-6">
                  <a
                    href={`${window.location.protocol}//${window.location.hostname}:3000`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Go to Linkage VA Hub
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
  } else {
    // Linkage VA Hub - VA profiles only
    if (user.va || user.role === 'va') {
      return <VAProfile />;
    }
    
    // If business tries to access VA Hub, redirect them
    if (user.business || user.role === 'business') {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
                  <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  Business Account Detected
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  This is Linkage VA Hub for Virtual Assistants only. Business accounts should use E-Systems Management to hire VAs.
                </p>
                <div className="mt-6">
                  <a
                    href={`${window.location.protocol}//${window.location.hostname}:3002`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Go to E-Systems Management
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  // Fallback: if no profile exists, send to VA setup
  return <Navigate to="/profile-setup" />;
}