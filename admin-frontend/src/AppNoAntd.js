import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SessionProvider } from './contexts/SessionContext';
import { RegionalProvider } from './contexts/RegionalContext';
import ProfessionalLoginPage from './components/auth/ProfessionalLoginPage';
import SimpleAdminLayout from './components/layout/SimpleAdminLayout';
import Dashboard from './pages/Dashboard';
import VAManagement from './pages/VAManagement';
import BusinessManagement from './pages/BusinessManagement';
import UserManagement from './pages/UserManagement';
import MobileAnnouncements from './pages/MobileAnnouncements';
import Messages from './pages/Messages';
import MessengerChat from './pages/MessengerChat';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorBoundary from './components/common/ErrorBoundary';
import OAuthCallback from './pages/OAuthCallback';
import AcceptInvitation from './pages/AcceptInvitation';
import './App.css';
import './styles/dark-theme.css';

// Protected Route Component
const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <Outlet />;
};

// App Content Component
const AppContent = () => {
  const { isAuthenticated, isLoading, authChecked } = useAuth();

  // Show loading spinner while checking auth status
  if (isLoading || !authChecked) {
    return <LoadingSpinner />;
  }

  return (
    <div className="App">
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <ProfessionalLoginPage />
          } 
        />
        <Route path="/auth/callback" element={<OAuthCallback />} />
        <Route path="/accept-invitation/:token" element={<AcceptInvitation />} />
        
        {/* Protected Admin Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<SimpleAdminLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/vas" element={<VAManagement />} />
            <Route path="/businesses" element={<BusinessManagement />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/messenger-chat" element={<MessengerChat />} />
            <Route path="/announcements" element={<MobileAnnouncements />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
};

// Main App Component
const App = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <RegionalProvider>
          <SessionProvider>
            <AppContent />
          </SessionProvider>
        </RegionalProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;