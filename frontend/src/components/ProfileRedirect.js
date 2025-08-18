import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/HybridAuthContext';

const ProfileRedirect = () => {
  const { user, loading, isVA, isBusiness } = useAuth();

  useEffect(() => {
    console.log('🔄 ProfileRedirect Component Mounted');
    console.log('📊 ProfileRedirect State:', {
      loading,
      user: user ? {
        id: user.id,
        email: user.email,
        role: user.role,
        va: user.va,
        business: user.business
      } : null,
      isVA,
      isBusiness
    });
  }, []);

  useEffect(() => {
    console.log('🔄 ProfileRedirect State Updated:', {
      loading,
      userRole: user?.role,
      isVA,
      isBusiness
    });
  }, [loading, user, isVA, isBusiness]);

  // Wait for auth to load - check if loading is not explicitly false
  if (loading !== false || !user) {
    console.log('⏳ ProfileRedirect: Waiting for auth data...', { loading, hasUser: !!user });
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Setting up your profile...</p>
        </div>
      </div>
    );
  }

  // Redirect based on user role
  if (isVA || user?.role === 'va' || user?.role === 'VA') {
    console.log('✅ ProfileRedirect: User is VA, redirecting to /va/profile');
    return <Navigate to="/va/profile" replace />;
  } else if (isBusiness || user?.role === 'business' || user?.role === 'Business') {
    console.log('✅ ProfileRedirect: User is Business, redirecting to /business/profile');
    return <Navigate to="/business/profile" replace />;
  }

  // Fallback to generic profile setup
  console.log('⚠️ ProfileRedirect: No clear role, falling back to /profile-setup');
  return <Navigate to="/profile-setup" replace />;
};

export default ProfileRedirect;