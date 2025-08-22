import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const { isAuthenticated, isLoading: authLoading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // Use effect to handle navigation after successful login
  useEffect(() => {
    console.log('[LoginPage] Auth state changed:', { isAuthenticated, authLoading });
    if (isAuthenticated && !authLoading) {
      console.log('[LoginPage] User authenticated, navigating to dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);


  const handleEmailLogin = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      await login(formData);
      
      console.log('[LoginPage] Email login successful');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('[LoginPage] Email login error:', error);
      setError(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };


  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // If already authenticated, redirect to dashboard
  if (isAuthenticated && !authLoading) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-admin-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-admin-900">
            Admin Panel
          </h2>
          <p className="mt-2 text-center text-sm text-admin-600">
            Sign in to access the admin dashboard
          </p>
        </div>

        {/* Email/Password Login Form */}
          <form className="mt-8 space-y-6" onSubmit={handleEmailLogin}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-admin-300 placeholder-admin-500 text-admin-900 rounded-t-md focus:outline-none focus:ring-admin-500 focus:border-admin-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-admin-300 placeholder-admin-500 text-admin-900 rounded-b-md focus:outline-none focus:ring-admin-500 focus:border-admin-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">{error}</div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-admin-600 hover:bg-admin-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-admin-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center">
            <div className="admin-loading mx-auto"></div>
            <p className="text-sm text-admin-600 mt-2">Authenticating...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
