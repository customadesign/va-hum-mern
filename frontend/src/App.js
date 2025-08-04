import React from 'react';
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
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';

// Pages
import Home from './pages/Home';
import About from './pages/About';
import Community from './pages/Community';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VAList from './pages/VAs/List';
import VADetail from './pages/VAs/Detail';
import VAProfile from './pages/VAs/Profile';
import BusinessProfile from './pages/Business/Profile';
import Conversations from './pages/Conversations';
import ConversationDetail from './pages/Conversations/Detail';
import Dashboard from './pages/Dashboard';
import ProfileSetup from './pages/ProfileSetup';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import NotFound from './pages/NotFound';
import Notifications from './pages/Notifications';

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

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <Router>
          <BrandingProvider>
            <AuthProvider>
            <div className="h-full flex flex-col">
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<Home />} />
                  <Route path="about" element={<About />} />
                  <Route path="community" element={<Community />} />
                  <Route path="community/lesson/:lessonId" element={<Community />} />
                  <Route path="login" element={<Login />} />
                  <Route path="register" element={<Register />} />
                  <Route path="forgot-password" element={<ForgotPassword />} />
                  <Route path="reset-password/:token" element={<ResetPassword />} />
                  <Route path="vas" element={<VAList />} />
                  <Route path="vas/:id" element={<VADetail />} />
                  <Route path="terms" element={<Terms />} />
                  <Route path="privacy" element={<Privacy />} />
                  
                  {/* Protected Routes */}
                  <Route element={<PrivateRoute />}>
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="profile-setup" element={<ProfileSetup />} />
                    <Route path="va/profile" element={<VAProfile />} />
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
          </AuthProvider>
        </BrandingProvider>
        </Router>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;