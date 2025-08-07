import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/HybridAuthContext';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';

const PrivateRoute = () => {
  const { loading, isAuthenticated, needsProfileSetup, isClerkUser, authMethod } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // If user is authenticated via JWT, handle normally
  if (authMethod === 'jwt') {
    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }
    
    if (needsProfileSetup) {
      return <Navigate to="/profile-setup" />;
    }
    
    return <Outlet />;
  }

  // If user is authenticated via Clerk, use Clerk components
  if (authMethod === 'clerk' || isClerkUser) {
    return (
      <>
        <SignedIn>
          {needsProfileSetup ? (
            <Navigate to="/profile-setup" />
          ) : (
            <Outlet />
          )}
        </SignedIn>
        <SignedOut>
          <RedirectToSignIn />
        </SignedOut>
      </>
    );
  }

  // No authentication method detected, redirect to login
  return <Navigate to="/login" />;
};

export default PrivateRoute;