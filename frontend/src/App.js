import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ToastContainer } from 'react-toastify';
import { HelmetProvider } from 'react-helmet-async';
import 'react-toastify/dist/ReactToastify.css';

// Context Providers
import { AuthProvider } from './contexts/AuthContext';

// Layout Components
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';

// Pages
import Home from './pages/Home';
import About from './pages/About';
import Login from './pages/Login';
import Register from './pages/Register';
import VAList from './pages/VAs/List';
import VADetail from './pages/VAs/Detail';
import VAProfile from './pages/VAs/Profile';
import BusinessProfile from './pages/Business/Profile';
import Conversations from './pages/Conversations';
import ConversationDetail from './pages/Conversations/Detail';
import Dashboard from './pages/Dashboard';
import ProfileSetup from './pages/ProfileSetup';
import NotFound from './pages/NotFound';

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
          <AuthProvider>
            <div className="h-full flex flex-col">
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<Home />} />
                  <Route path="about" element={<About />} />
                  <Route path="login" element={<Login />} />
                  <Route path="register" element={<Register />} />
                  <Route path="vas" element={<VAList />} />
                  <Route path="vas/:id" element={<VADetail />} />
                  
                  {/* Protected Routes */}
                  <Route element={<PrivateRoute />}>
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="profile-setup" element={<ProfileSetup />} />
                    <Route path="va/profile" element={<VAProfile />} />
                    <Route path="business/profile" element={<BusinessProfile />} />
                    <Route path="conversations" element={<Conversations />} />
                    <Route path="conversations/:id" element={<ConversationDetail />} />
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
        </Router>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;