import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { SessionProvider } from './contexts/SessionContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { RegionalProvider } from './contexts/RegionalContext';
import { NotificationProvider } from './components/common/NotificationSystem';
import ProfessionalLoginPage from './components/auth/ProfessionalLoginPage';
import ResetPasswordPage from './components/auth/ResetPasswordPage';
import LoginThemeWrapper from './components/auth/LoginThemeWrapper';
import Dashboard from './pages/Dashboard';
import SimpleAdminLayout from './components/layout/SimpleAdminLayout';
import VAManagement from './pages/VAManagement';
import BusinessManagement from './pages/BusinessManagement';
import UserManagement from './pages/UserManagement';
import MobileAnnouncements from './pages/MobileAnnouncements';
import MessengerChat from './pages/MessengerChat';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorBoundary from './components/common/ErrorBoundary';
import OAuthCallback from './pages/OAuthCallback';
import AcceptInvitation from './pages/AcceptInvitation';
import './App.css';
import './styles/header-overlay-fix.css';
import './styles/success-notification-theme.css';
import './styles/settings-global.css';

// Theme Wrapper Component - Handles dynamic theme switching
const ThemeWrapper = ({ children }) => {
  const { theme } = useTheme();

  // Apply theme class to root element
  React.useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return <>{children}</>;
};

// Main App Component - BrowserRouter and AuthProvider are in index.js
const App = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ThemeWrapper>
          <RegionalProvider>
            <SettingsProvider>
              <SessionProvider>
                <NotificationProvider>
                  <AppContent />
                </NotificationProvider>
              </SessionProvider>
            </SettingsProvider>
          </RegionalProvider>
        </ThemeWrapper>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

// App Content Component (inside AuthProvider context)
const AppContent = () => {
  const { isAuthenticated, isLoading, authChecked } = useAuth();

  // Note: Removed problematic returning admin session check that was causing reload loops

  // Show loading spinner while checking auth status
  // Important: Only show spinner while actually loading, not on initial mount
  if (isLoading || !authChecked) {
    return <LoadingSpinner />;
  }

  return (
    <div className="App">
      <Routes>
        {/* Public Routes - only accessible when NOT authenticated */}
        <Route 
          path="/login" 
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : (
              <LoginThemeWrapper>
                <ProfessionalLoginPage />
              </LoginThemeWrapper>
            )
          } 
        />
        <Route path="/auth/callback" element={<OAuthCallback />} />
        <Route path="/accept-invitation/:token" element={<AcceptInvitation />} />
        <Route
          path="/reset-password/:token"
          element={
            <LoginThemeWrapper>
              <ResetPasswordPage />
            </LoginThemeWrapper>
          }
        />
        
        {/* Protected Admin Routes - Wrapped in ModernLayout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<SimpleAdminLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/vas" element={<VAManagement />} />
            <Route path="/business-management" element={<BusinessManagement />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/messages" element={<Navigate to="/messenger-chat" replace />} />
            <Route path="/messenger-chat" element={<MessengerChat />} />
            <Route path="/announcements" element={<MobileAnnouncements />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>
        
        {/* Catch all - redirect to login if not authenticated, dashboard if authenticated */}
        <Route 
          path="*" 
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
          } 
        />
      </Routes>
    </div>
  );
};

// Protected Route Component (inside AuthProvider context)
const ProtectedRoute = () => {
  const { isAuthenticated, isLoading, user, authChecked } = useAuth();

  console.log('[ProtectedRoute] State:', { isAuthenticated, isLoading, authChecked, userEmail: user?.email, isAdmin: user?.admin });

  // Don't render anything while loading or before auth check completes
  if (isLoading || !authChecked) {
    console.log('[ProtectedRoute] Still loading or auth not checked, showing spinner');
    return <LoadingSpinner />;
  }

  // Redirect to login if not authenticated (AFTER auth check is complete)
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-danger-100">
              <svg className="h-6 w-6 text-danger-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Access Denied</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              You don't have permission to access the admin panel.
            </p>
          </div>
        </div>
      </div>
    );
  }

  console.log('[ProtectedRoute] User is admin, rendering Outlet');
  return <Outlet />;
};

export default App;
