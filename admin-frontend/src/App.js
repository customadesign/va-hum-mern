import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import AdminLayout from './components/layout/AdminLayout';
import VAManagement from './pages/VAManagement';
import BusinessManagement from './pages/BusinessManagement';
import UserManagement from './pages/UserManagement';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import LoadingSpinner from './components/common/LoadingSpinner';
import OAuthCallback from './pages/OAuthCallback';
import AcceptInvitation from './pages/AcceptInvitation';
import './App.css';

// Main App Component
const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
};

// App Content Component (inside AuthProvider context)
const AppContent = () => {
  return (
    <div className="App">
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<OAuthCallbackHandler />} />
        <Route path="/accept-invitation/:token" element={<AcceptInvitation />} />
        
        {/* Protected Admin Routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/vas" element={<VAManagement />} />
                  <Route path="/businesses" element={<BusinessManagement />} />
                  <Route path="/users" element={<UserManagement />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
};

// Protected Route Component (inside AuthProvider context)
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  console.log('[ProtectedRoute] State:', { isAuthenticated, isLoading, userEmail: user?.email, isAdmin: user?.admin });

  if (isLoading) {
    console.log('[ProtectedRoute] Still loading, showing spinner');
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    console.log('[ProtectedRoute] Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Check if user has admin role
  const isAdmin = user?.admin === true;
  console.log('[ProtectedRoute] Admin check - user.admin:', user?.admin, 'isAdmin:', isAdmin);
  
  if (!isAdmin) {
    console.log('[ProtectedRoute] User is not admin, showing access denied');
    return (
      <div className="min-h-screen flex items-center justify-center bg-admin-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-danger-100">
              <svg className="h-6 w-6 text-danger-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-admin-900">Access Denied</h3>
            <p className="mt-1 text-sm text-admin-500">
              You don't have permission to access the admin panel.
            </p>
          </div>
        </div>
      </div>
    );
  }

  console.log('[ProtectedRoute] User is admin, rendering children');
  return children;
};

// OAuth Callback Handler Component (inside AuthProvider context)
const OAuthCallbackHandler = () => {
  const { login } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Check for OAuth tokens in URL params
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const refreshToken = urlParams.get('refreshToken');
        
        if (token && refreshToken) {
          console.log('[OAuthCallback] OAuth tokens detected, processing login...');
          await login({ token, refreshToken });
          // Redirect to dashboard
          window.location.href = '/dashboard';
        } else {
          // Check for error parameters
          const errorParam = urlParams.get('error');
          if (errorParam) {
            setError(errorParam);
          } else {
            setError('Invalid OAuth callback - missing tokens');
          }
        }
      } catch (error) {
        console.error('[OAuthCallback] Error processing callback:', error);
        setError('Failed to process OAuth authentication');
      } finally {
        setIsProcessing(false);
      }
    };

    processCallback();
  }, [login]);

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-admin-50">
        <div className="text-center">
          <div className="admin-loading mb-4"></div>
          <p className="text-admin-600">Processing authentication...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-admin-50">
        <div className="text-center">
          <div className="bg-danger-50 border border-danger-200 text-danger-700 px-6 py-4 rounded-lg mb-4">
            <h3 className="text-lg font-medium mb-2">Authentication Error</h3>
            <p>{error}</p>
          </div>
          <button
            onClick={() => window.location.href = '/login'}
            className="admin-button-primary"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default App;
