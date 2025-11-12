import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Form, Input, Button, message } from 'antd';
import { MailOutlined, LockOutlined, EyeInvisibleOutlined, EyeTwoTone, ArrowLeftOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { passwordResetAPI } from '../../services/api';
import '../../styles/professional-login.css';
import '../../styles/login-message-fix.css';

const ProfessionalLoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);
  const { login, isAuthenticated, isLoading: authLoading, clearAuthState } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [forgotPasswordForm] = Form.useForm();

  // SECURITY FIX: Clear auth state when login page mounts to prevent auto-authentication
  useEffect(() => {
    if (clearAuthState) {
      clearAuthState();
    }
  }, [clearAuthState]);

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const result = await login({
        email: values.email,
        password: values.password
      });
      
      if (result && result.success) {
        // Enhanced success message with auto-dismiss
        message.success({
          content: 'Login successful!',
          duration: 2,
          style: {
            marginTop: '24px',
          }
        });
        // Navigate immediately without timeout to fix authentication flow
        navigate('/dashboard', { replace: true });
      }
    } catch (error) {
      // Enhanced error handling with specific messages for different scenarios
      let errorMessage = 'Authentication failed';
      
      if (error.response?.status === 401) {
        const errorData = error.response?.data;
        if (errorData?.error?.includes('email') || errorData?.error?.includes('user not found')) {
          errorMessage = 'Invalid email address';
        } else if (errorData?.error?.includes('password') || errorData?.error?.includes('invalid credentials')) {
          errorMessage = 'Incorrect password';
        } else {
          errorMessage = 'Authentication failed';
        }
      } else if (error.response?.status === 400) {
        errorMessage = 'Invalid email address';
      } else if (error.response?.status === 429) {
        errorMessage = 'Too many login attempts. Please wait a moment and try again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied. Admin privileges required.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.response?.status === 0 || !error.response) {
        errorMessage = 'Connection error. Please check your internet connection.';
      } else {
        errorMessage = error.response?.data?.error || 'Authentication failed';
      }
      
      // Enhanced error message with auto-dismiss and accessibility
      message.error({
        content: errorMessage,
        duration: 5, // Longer duration for error messages
        style: {
          marginTop: '24px',
          maxWidth: '400px',
        },
        onClick: () => message.destroy(), // Allow manual dismissal
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (values) => {
    setForgotPasswordLoading(true);
    try {
      await passwordResetAPI.forgotPassword(values.email);
      setForgotPasswordSent(true);
      message.success({
        content: 'If an account with this email exists, password reset instructions have been sent.',
        duration: 5,
        style: {
          marginTop: '24px',
          maxWidth: '400px',
        }
      });
    } catch (error) {
      let errorMessage = 'Failed to send password reset email';
      
      if (error.response?.status === 429) {
        errorMessage = 'Too many password reset attempts. Please wait before trying again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Account is suspended. Please contact support.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else {
        errorMessage = error.response?.data?.error || 'Failed to send password reset email';
      }
      
      message.error({
        content: errorMessage,
        duration: 5,
        style: {
          marginTop: '24px',
          maxWidth: '400px',
        }
      });
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setForgotPasswordSent(false);
    forgotPasswordForm.resetFields();
  };

  // SECURITY FIX: Don't show loading spinner on login page
  // This prevents auto-authentication on refresh
  // Only redirect if already authenticated AND not currently loading
  if (isAuthenticated && !authLoading) {
    return <Navigate to="/dashboard" replace />;
  }

  // Don't show loading spinner on login page - always show the login form
  // This prevents the auth check from auto-authenticating

  return (
    <div className={`professional-login-wrapper ${theme}`}>
      {/* Animated Background */}
      <div className="animated-bg">
        <div className="gradient-bg"></div>
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      {/* Theme Toggle */}
      <button 
        className="theme-toggle-btn"
        onClick={toggleTheme}
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      {/* Login Container */}
      <div className="login-content">
        <div className="login-box">
          {/* Logo and Branding */}
          <div className="login-brand">
            <div className="brand-logo">
              <span className="logo-text">L</span>
            </div>
            <h1 className="brand-title">Linkage VA Hub</h1>
            <p className="brand-subtitle">Admin Portal</p>
          </div>

          {/* Conditional Form Display */}
          {!showForgotPassword ? (
            <>
              {/* Login Form */}
              <Form
                form={form}
                name="login"
                onFinish={handleSubmit}
                autoComplete="on"
                className="login-form"
                initialValues={{
                  email: '',
                  password: ''
                }}
              >
                <Form.Item
                  name="email"
                  rules={[
                    { required: true, message: 'Please enter your email' },
                    { type: 'email', message: 'Please enter a valid email' }
                  ]}
                >
                  <Input
                    size="large"
                    prefix={<MailOutlined className="input-icon" />}
                    placeholder="Email address"
                    autoComplete="email"
                    className="login-input"
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  rules={[
                    { required: true, message: 'Please enter your password' }
                  ]}
                >
                  <Input.Password
                    size="large"
                    prefix={<LockOutlined className="input-icon" />}
                    placeholder="Password"
                    autoComplete="current-password"
                    iconRender={(visible) =>
                      visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                    }
                    className="login-input"
                  />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    loading={loading}
                    block
                    className="login-button"
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </Form.Item>
              </Form>

              {/* Forgot Password Link */}
              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <Button
                  type="link"
                  onClick={() => setShowForgotPassword(true)}
                  style={{
                    color: '#3b82f6',
                    fontSize: '14px',
                    padding: '0',
                    height: 'auto'
                  }}
                >
                  Forgot your password?
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Forgot Password Form */}
              <div style={{ marginBottom: '24px' }}>
                <Button
                  type="link"
                  icon={<ArrowLeftOutlined />}
                  onClick={handleBackToLogin}
                  style={{
                    color: '#3b82f6',
                    fontSize: '14px',
                    padding: '0',
                    height: 'auto',
                    marginBottom: '16px'
                  }}
                >
                  Back to login
                </Button>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: theme === 'dark' ? '#fff' : '#1f2937',
                  margin: '0 0 8px 0'
                }}>
                  Reset Password
                </h2>
                <p style={{
                  fontSize: '14px',
                  color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                  margin: '0'
                }}>
                  Enter your email address and we'll send you instructions to reset your password.
                </p>
              </div>

              {!forgotPasswordSent ? (
                <Form
                  form={forgotPasswordForm}
                  name="forgotPassword"
                  onFinish={handleForgotPassword}
                  className="login-form"
                >
                  <Form.Item
                    name="email"
                    rules={[
                      { required: true, message: 'Please enter your email address' },
                      { type: 'email', message: 'Please enter a valid email address' }
                    ]}
                  >
                    <Input
                      size="large"
                      prefix={<MailOutlined className="input-icon" />}
                      placeholder="Enter your email address"
                      autoComplete="email"
                      className="login-input"
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      size="large"
                      loading={forgotPasswordLoading}
                      block
                      className="login-button"
                    >
                      {forgotPasswordLoading ? 'Sending...' : 'Send Reset Instructions'}
                    </Button>
                  </Form.Item>
                </Form>
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '32px 0',
                  background: theme === 'dark' ? '#065f46' : '#d1fae5',
                  borderRadius: '8px',
                  border: `1px solid ${theme === 'dark' ? '#047857' : '#10b981'}`
                }}>
                  <div style={{
                    fontSize: '48px',
                    marginBottom: '16px'
                  }}>
                    ✉️
                  </div>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: theme === 'dark' ? '#d1fae5' : '#065f46',
                    margin: '0 0 8px 0'
                  }}>
                    Check Your Email
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: theme === 'dark' ? '#a7f3d0' : '#047857',
                    margin: '0 0 16px 0'
                  }}>
                    If an account with this email exists, we've sent password reset instructions.
                  </p>
                  <Button
                    type="default"
                    onClick={handleBackToLogin}
                    style={{
                      background: 'transparent',
                      border: `1px solid ${theme === 'dark' ? '#047857' : '#10b981'}`,
                      color: theme === 'dark' ? '#d1fae5' : '#065f46'
                    }}
                  >
                    Back to Login
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Demo Credentials */}
          <div className="demo-credentials">
            <p className="demo-title">Demo Access</p>
            <div className="demo-info">
              <code>admin@linkage.ph / admin123</code>
            </div>
          </div>

          {/* Footer */}
          <div className="login-footer">
            <p>© 2025 Linkage VA Hub. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalLoginPage;