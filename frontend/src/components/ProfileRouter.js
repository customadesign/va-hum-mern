import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import VAProfile from '../pages/VAs/Profile';
import BusinessProfile from '../pages/Business/Profile';

export default function ProfileRouter() {
  const { user, loading } = useAuth();

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

  // Prefer concrete profile presence over role flag
  if (user.va) return <VAProfile />;
  if (user.business) return <BusinessProfile />;
  if (user.role === 'va') return <VAProfile />;
  if (user.role === 'business') return <BusinessProfile />;

  // Fallback: if role not set yet, send to setup
  return <Navigate to="/profile-setup" />;
}