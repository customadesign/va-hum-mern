import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ToastContainer } from 'react-toastify';
import { HelmetProvider } from 'react-helmet-async';
import 'react-toastify/dist/ReactToastify.css';

// Context Providers
import { AuthProvider } from './contexts/AuthContext';
import { BrandingProvider } from './contexts/BrandingContext';

// Layout Components
import Layout from './components/Layout';
import ConditionalLayout from './components/ConditionalLayout';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import ErrorBoundary from './components/ErrorBoundary';
import PublicOnlyRoute from './components/PublicOnlyRoute';
import ImpersonationBanner from './components/ImpersonationBanner';

// Pages
import Home from './pages/Home';
import About from './pages/About';
import Community from './pages/Community';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import EmailVerification from './pages/EmailVerification';
import VerifyEmailSent from './pages/VerifyEmailSent';
import VAList from './pages/VAs/List';
import VADetail from './pages/VAs/Detail';
import VAProfile from './pages/VAs/Profile';
import BusinessProfile from './pages/Business/Profile';
import ProfileRouter from './components/ProfileRouter';
import ProfileRedirect from './components/ProfileRedirect';
import LinkedInCallback from './pages/LinkedInCallback';
import Conversations from './pages/Conversations';
import ConversationDetail from './pages/Conversations/Detail';
import Dashboard from './pages/Dashboard';
import ProfileSetup from './pages/ProfileSetup';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import NotFound from './pages/NotFound';
import Notifications from './pages/Notifications';
import Analytics from './pages/Analytics';
import ScrollExpansionDemo from './pages/ScrollExpansionDemo';

// Admin Pages
import AdminDashboard from './pages/Admin/Dashboard';
import VAManagement from './pages/Admin/VAManagement';
import BusinessManagement from './pages/Admin/BusinessManagement';
import PendingApprovals from './pages/Admin/PendingApprovals';
import SystemSettings from './pages/Admin/SystemSettings';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Loading component for Suspense fallback
const SuspenseLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <Router>
            <AuthProvider>
              <BrandingProvider>
                <Suspense fallback={<SuspenseLoader />}>
                  <div className="h-full flex flex-col">
                    <ImpersonationBanner />
                    <Routes>
                      {/* VA Detail with Conditional Layout (for shared links) */}
                      <Route path="vas/:id" element={<ConditionalLayout />}>
                        <Route index element={<VADetail />} />
                      </Route>
                      
                      <Route path="/" element={<Layout />}>
                        <Route index element={<Home />} />
                        <Route path="about" element={<About />} />
                        <Route path="community" element={<Community />} />
                        <Route path="community/lesson/:lessonId" element={<Community />} />
                        
                        {/* Public Only Routes (redirect to dashboard if logged in) */}
                        <Route element={<PublicOnlyRoute />}>
                          <Route path="sign-in" element={<Login />} />
                          <Route path="sign-up" element={<Register />} />
                          <Route path="login" element={<Login />} />
                          <Route path="register" element={<Register />} />
                          <Route path="forgot-password" element={<ForgotPassword />} />
                          <Route path="reset-password/:token" element={<ResetPassword />} />
                        </Route>
                        
                        {/* Email Verification */}
                        <Route path="verify-email/:token" element={<EmailVerification />} />
                        <Route path="verify-email-sent" element={<VerifyEmailSent />} />
                        
                        {/* OAuth Callbacks */}
                        <Route path="auth/linkedin/callback" element={<LinkedInCallback />} />
                        
                        {/* Public Pages */}
                        <Route path="vas" element={<VAList />} />
                        <Route path="terms" element={<Terms />} />
                        <Route path="privacy" element={<Privacy />} />
                        <Route path="scroll-demo" element={<ScrollExpansionDemo />} />
                        
                        {/* Profile Redirect Route */}
                        <Route path="profile-redirect" element={<ProfileRedirect />} />
                        
                        {/* Protected Routes */}
                        <Route element={<PrivateRoute />}>
                          <Route path="dashboard" element={<Dashboard />} />
                          <Route path="analytics" element={<Analytics />} />
                          <Route path="profile-setup" element={<ProfileSetup />} />
                          <Route path="profile" element={<ProfileRouter />} />
                          {/* Conditional routes based on branding */}
                          <Route path="va/profile" element={<VAProfile />} />
                          <Route path="business/profile" element={<BusinessProfile />} />
                          <Route path="conversations" element={<Conversations />} />
                          <Route path="conversations/:id" element={<ConversationDetail />} />
                          <Route path="notifications" element={<Notifications />} />
                        </Route>
                        
                        {/* Admin Routes */}
                        <Route element={<AdminRoute />}>
                          <Route path="admin" element={<AdminDashboard />} />
                          <Route path="admin/vas" element={<VAManagement />} />
                          <Route path="admin/businesses" element={<BusinessManagement />} />
                          <Route path="admin/approvals" element={<PendingApprovals />} />
                          <Route path="admin/settings" element={<SystemSettings />} />
                        </Route>
                        
                        <Route path="*" element={<NotFound />} />
                      </Route>
                    </Routes>
                    <ToastContainer
                      position="top-right"
                      autoClose={5000}
                      hideProgressBar={false}
                      newestOnTop={false}
                      closeOnClick
                      rtl={false}
                      pauseOnFocusLoss
                      draggable
                      pauseOnHover
                    />
                  </div>
                </Suspense>
              </BrandingProvider>
            </AuthProvider>
          </Router>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;