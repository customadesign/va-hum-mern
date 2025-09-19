import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PrivateRoute = () => {
  const { loading, isAuthenticated, user } = useAuth();
  const location = useLocation();
  
  // Check if user needs to complete profile setup
  const needsProfileSetup = user && !user.va && !user.business && !user.admin;
  const isAtProfileSetup = location.pathname === '/profile-setup';
  const path = location.pathname;
  
  // Paths that are allowed even if profile setup is pending
  const allowIfSetupPending = (
    path === '/dashboard' ||
    path === '/va/profile' ||
    path === '/business/profile' ||
    path === '/conversations' ||
    path.startsWith('/conversations/') ||
    path === '/profile-setup'
  );

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  // Redirect to profile setup if needed (except for allowed paths)
  if (needsProfileSetup && !isAtProfileSetup && !allowIfSetupPending) {
    return <Navigate to="/profile-setup" />;
  }

  // Render the protected route
  return <Outlet />;
};

export default PrivateRoute;