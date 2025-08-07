import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ToastContainer } from 'react-toastify';
import { HelmetProvider } from 'react-helmet-async';
import 'react-toastify/dist/ReactToastify.css';

// Context Providers
import { ClerkProvider } from '@clerk/clerk-react';
import { AuthProvider } from './contexts/ClerkAuthContext';
import { BrandingProvider } from './contexts/BrandingContext';

// Get Clerk publishable key
const clerkPubKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  throw new Error('Missing Clerk Publishable Key');
}

// Layout Components
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
import Home from './pages/Home';
import About from './pages/About';
import Community from './pages/Community';
// import Login from './pages/Login'; // REPLACED: Using Clerk components
// import Register from './pages/Register'; // REPLACED: Using Clerk components
// import ForgotPassword from './pages/ForgotPassword'; // REPLACED: Using Clerk components
// import ResetPassword from './pages/ResetPassword'; // REPLACED: Using Clerk components
import { ClerkSignIn, ClerkSignUp } from './components/ClerkAuthPages';
import ClerkProfileSetup from './components/ClerkProfileSetup';
import VAList from './pages/VAs/List';
import VADetail from './pages/VAs/Detail';
import VAProfile from './pages/VAs/Profile';
import BusinessProfile from './pages/Business/Profile';
import ProfileRouter from './components/ProfileRouter';
// import LinkedInCallback from './pages/LinkedInCallback'; // REMOVED: Using Clerk OAuth instead
import Conversations from './pages/Conversations';
import ConversationDetail from './pages/Conversations/Detail';
import Dashboard from './pages/Dashboard';
// import ProfileSetup from './pages/ProfileSetup'; // REPLACED: Using ClerkProfileSetup
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import NotFound from './pages/NotFound';
import Notifications from './pages/Notifications';
import Analytics from './pages/Analytics';

// Admin Pages
import AdminDashboard from './pages/Admin/Dashboard';

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
          <ClerkProvider publishableKey={clerkPubKey}>
            <Router>
              <BrandingProvider>
                <AuthProvider>
                <Suspense fallback={<SuspenseLoader />}>
                  <div className="h-full flex flex-col">
                    <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<Home />} />
                  <Route path="about" element={<About />} />
                  <Route path="community" element={<Community />} />
                  <Route path="community/lesson/:lessonId" element={<Community />} />
                  <Route path="sign-in/*" element={<ClerkSignIn />} />
                  <Route path="sign-up/*" element={<ClerkSignUp />} />
                  {/* REMOVED: Legacy auth routes - now handled by Clerk */}
                  {/* REMOVED: LinkedIn callback - now handled by Clerk */}
                  <Route path="vas" element={<VAList />} />
                  <Route path="vas/:id" element={<VADetail />} />
                  <Route path="terms" element={<Terms />} />
                  <Route path="privacy" element={<Privacy />} />
                  
                  {/* Protected Routes */}
                  <Route element={<PrivateRoute />}>
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="analytics" element={<Analytics />} />
                    <Route path="profile-setup" element={<ClerkProfileSetup />} />
                    <Route path="va/profile" element={<ProfileRouter />} />
                    <Route path="business/profile" element={<BusinessProfile />} />
                    <Route path="conversations" element={<Conversations />} />
                    <Route path="conversations/:id" element={<ConversationDetail />} />
                    <Route path="notifications" element={<Notifications />} />
                  </Route>
                  
                  {/* Admin Routes */}
                  <Route element={<AdminRoute />}>
                    <Route path="admin" element={<AdminDashboard />} />
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
                </AuthProvider>
              </BrandingProvider>
            </Router>
          </ClerkProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;