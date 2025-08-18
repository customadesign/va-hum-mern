import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/HybridAuthContext';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';

const PrivateRoute = () => {
  const { loading, isAuthenticated, needsProfileSetup, isClerkUser, authMethod, user, isVA, isBusiness } = useAuth();
  const location = useLocation();
  const isAtProfileSetup = location.pathname === '/profile-setup';
  const path = location.pathname;
  const getProfileSetupPath = () => {
    if (isVA || user?.role === 'VA') {
      return '/va/profile';
    } else if (isBusiness || user?.role === 'Business') {
      return '/business/profile';
    } else {
      return '/profile-setup';
    }
  };
  const allowIfSetupPending = (
    path === '/dashboard' ||
    path === '/va/profile' ||
    path === '/business/profile' ||
    path === '/conversations' ||
    path.startsWith('/conversations/')
  );

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
      return <Navigate to="/sign-in" />;
    }

    if (needsProfileSetup && !isAtProfileSetup && !allowIfSetupPending) {
      return <Navigate to={getProfileSetupPath()} />;
    }

    return <Outlet />;
  }

  // If user is authenticated via Clerk, use Clerk components
  if (authMethod === 'clerk' || isClerkUser) {
    return (
      <>
        <SignedIn>
          <Outlet />
        </SignedIn>
        <SignedOut>
          <RedirectToSignIn />
        </SignedOut>
      </>
    );
  }

  // No authentication method detected, redirect to login
  return <Navigate to="/sign-in" />;
};

export default PrivateRoute;