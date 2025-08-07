import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/ClerkAuthContext';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';

const PrivateRoute = () => {
  const { loading, needsProfileSetup } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

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
};

export default PrivateRoute;