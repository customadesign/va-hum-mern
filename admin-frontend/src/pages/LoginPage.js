import React, { useState, useEffect, useCallback } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/LoginTheme.css';

const LoginPage = () => {
  const { isAuthenticated, isLoading: authLoading, login, clearAuthState } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Theme state
  const [theme, setTheme] = useState(() => {
    // Check localStorage first, then system preference
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
    
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  // Initialize theme on component mount and clear auth state
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);

    // SECURITY FIX: Clear any existing authentication state when login page mounts
    // This prevents auto-authentication on refresh
    if (clearAuthState) {
      clearAuthState();
    }
  }, [theme, clearAuthState]);

  // Handle theme toggle
  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.dataset.theme = newTheme;
    localStorage.setItem('theme', newTheme);
  }, [theme]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login({ email, password });
      // Navigation is handled by the useAuth hook
    } catch (err) {
      console.error('Login error:', err);

      // Handle different error scenarios
      if (!err.response) {
        // Network error - no response from server
        setError('Cannot connect to server. Please check if the backend is running on port 8000.');
      } else if (err.response.status === 429) {
        // Rate limit error
        setError('Too many login attempts. Please wait a few minutes and try again.');
      } else if (err.response.status === 401) {
        // Invalid credentials
        setError('Invalid email or password. Please check your credentials.');
      } else if (err.response.status === 403) {
        // Not admin
        setError('Access denied. Admin privileges required.');
      } else {
        // Other errors
        setError(err.response?.data?.error || err.message || 'Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fill test credentials
  const fillTestCredentials = useCallback(() => {
    setEmail('admin@linkage.ph');
    setPassword('admin123');
    setError(''); // Clear any previous errors
  }, []);

  // Handle navigation after authentication
  useEffect(() => {
    // Only navigate if user is truly authenticated and auth check is complete
    // Do not auto-navigate on initial mount
    if (isAuthenticated && !authLoading) {
      console.log('[LoginPage] User authenticated, navigating to dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  // SECURITY FIX: Don't show loading spinner on login page
  // This prevents the auth check from running and auto-authenticating
  // Login page should always show the login form initially

  // Only redirect if already authenticated AND not currently loading
  // This prevents the flash of login form when navigating from authenticated routes
  if (isAuthenticated && !authLoading) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <header className="login-header">
          <h1 className="login-title">Admin Panel</h1>
          <button 
            type="button" 
            className="theme-toggle" 
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            <span className="theme-dot" />
            <span className="theme-text">
              {theme === 'light' ? 'Light Mode' : 'Dark Mode'}
            </span>
          </button>
        </header>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="email" className="login-label">
              Email Address
            </label>
            <div className="input-wrapper">
              <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
              <input
                id="email"
                type="email"
                className="login-input with-icon"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                autoComplete="email"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="login-label">
              Password
            </label>
            <div className="input-wrapper">
              <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18,8h-1V6c0-2.76-2.24-5-5-5S7,3.24,7,6v2H6c-1.1,0-2,0.9-2,2v10c0,1.1,0.9,2,2,2h12c1.1,0,2-0.9,2-2V10C20,8.9,19.1,8,18,8z M12,17c-1.1,0-2-0.9-2-2s0.9-2,2-2s2,0.9,2,2S13.1,17,12,17z M15.1,8H8.9V6c0-1.71,1.39-3.1,3.1-3.1c1.71,0,3.1,1.39,3.1,3.1V8z"/>
              </svg>
              <input
                id="password"
                type="password"
                className="login-input with-icon"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {error && (
            <div className="login-error" role="alert">
              {error}
            </div>
          )}

          <button 
            className={`login-submit ${isLoading ? 'loading' : ''}`}
            type="submit"
            disabled={isLoading || !email || !password}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <section className="creds">
          <div className="creds-header">Test Credentials</div>
          <div className="creds-row">
            <span className="creds-key">Email:</span>
            <span className="creds-value">admin@linkage.ph</span>
          </div>
          <div className="creds-row">
            <span className="creds-key">Password:</span>
            <span className="creds-value">admin123</span>
          </div>
          <button
            type="button"
            className="creds-fill"
            onClick={fillTestCredentials}
            disabled={isLoading}
          >
            Fill Test Credentials
          </button>
        </section>
      </div>
    </div>
  );
};

export default LoginPage;