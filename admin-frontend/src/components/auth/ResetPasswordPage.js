import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Input, Button, message, Alert } from 'antd';
import { LockOutlined, EyeInvisibleOutlined, EyeTwoTone, CheckCircleOutlined } from '@ant-design/icons';
import { useTheme } from '../../contexts/ThemeContext';
import { passwordResetAPI } from '../../services/api';
import '../../styles/professional-login.css';
import '../../styles/login-message-fix.css';

const ResetPasswordPage = () => {
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [resetComplete, setResetComplete] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { token } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // Validate token on component mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setTokenError('Invalid reset link');
        setValidating(false);
        return;
      }

      try {
        const response = await passwordResetAPI.validateToken(token);
        if (response.data.valid) {
          setTokenValid(true);
          setUserEmail(response.data.email);
        } else {
          setTokenError('Invalid or expired reset link');
        }
      } catch (error) {
        if (error.response?.status === 400) {
          setTokenError('This reset link has expired or is invalid');
        } else {
          setTokenError('Unable to validate reset link. Please try again.');
        }
      } finally {
        setValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (values) => {
    if (values.password !== values.confirmPassword) {
      message.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await passwordResetAPI.resetPassword(token, values.password);
      
      if (response.data.success) {
        setResetComplete(true);
        message.success({
          content: 'Password reset successful! You can now login with your new password.',
          duration: 5,
          style: {
            marginTop: '24px',
          }
        });
      }
    } catch (error) {
      let errorMessage = 'Failed to reset password';
      
      if (error.response?.status === 400) {
        errorMessage = 'Invalid or expired reset token';
      } else if (error.response?.status === 429) {
        errorMessage = 'Too many attempts. Please wait before trying again.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else {
        errorMessage = error.response?.data?.error || 'Failed to reset password';
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
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

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

      {/* Reset Password Container */}
      <div className="login-content">
        <div className="login-box">
          {/* Logo and Branding */}
          <div className="login-brand">
            <div className="brand-logo">
              <span className="logo-text">L</span>
            </div>
            <h1 className="brand-title">Linkage VA Hub</h1>
            <p className="brand-subtitle">Reset Password</p>
          </div>

          {/* Content based on state */}
          {validating ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div className="ant-spin ant-spin-lg">
                <span className="ant-spin-dot ant-spin-dot-spin">
                  <i className="ant-spin-dot-item"></i>
                  <i className="ant-spin-dot-item"></i>
                  <i className="ant-spin-dot-item"></i>
                  <i className="ant-spin-dot-item"></i>
                </span>
              </div>
              <p style={{ 
                marginTop: '16px', 
                color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                fontSize: '14px'
              }}>
                Validating reset link...
              </p>
            </div>
          ) : !tokenValid ? (
            <div style={{ textAlign: 'center' }}>
              <Alert
                message="Invalid Reset Link"
                description={tokenError}
                type="error"
                showIcon
                style={{ marginBottom: '24px' }}
              />
              <Button
                type="primary"
                onClick={handleBackToLogin}
                size="large"
                block
                className="login-button"
              >
                Back to Login
              </Button>
            </div>
          ) : resetComplete ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '64px', 
                marginBottom: '24px',
                color: '#10b981'
              }}>
                <CheckCircleOutlined />
              </div>
              <h2 style={{ 
                fontSize: '24px', 
                fontWeight: '600',
                color: theme === 'dark' ? '#fff' : '#1f2937',
                margin: '0 0 12px 0'
              }}>
                Password Reset Successful!
              </h2>
              <p style={{ 
                fontSize: '16px',
                color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                margin: '0 0 32px 0'
              }}>
                Your password has been updated successfully. You can now login with your new password.
              </p>
              <Button
                type="primary"
                onClick={handleBackToLogin}
                size="large"
                block
                className="login-button"
              >
                Go to Login
              </Button>
            </div>
          ) : (
            <>
              {/* Reset Password Form */}
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ 
                  fontSize: '20px', 
                  fontWeight: '600', 
                  color: theme === 'dark' ? '#fff' : '#1f2937',
                  margin: '0 0 8px 0'
                }}>
                  Set New Password
                </h2>
                <p style={{ 
                  fontSize: '14px', 
                  color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                  margin: '0 0 8px 0'
                }}>
                  Reset password for: <strong>{userEmail}</strong>
                </p>
                <p style={{ 
                  fontSize: '12px', 
                  color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                  margin: '0'
                }}>
                  Please enter a new secure password for your account.
                </p>
              </div>

              <Form
                form={form}
                name="resetPassword"
                onFinish={handleSubmit}
                className="login-form"
                autoComplete="off"
              >
                <Form.Item
                  name="password"
                  rules={[
                    { required: true, message: 'Please enter your new password' },
                    { min: 6, message: 'Password must be at least 6 characters long' },
                    {
                      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                      message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
                    }
                  ]}
                >
                  <Input.Password
                    size="large"
                    prefix={<LockOutlined className="input-icon" />}
                    placeholder="New password"
                    autoComplete="new-password"
                    iconRender={(visible) => 
                      visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                    }
                    className="login-input"
                  />
                </Form.Item>

                <Form.Item
                  name="confirmPassword"
                  dependencies={['password']}
                  rules={[
                    { required: true, message: 'Please confirm your new password' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('Passwords do not match'));
                      },
                    }),
                  ]}
                >
                  <Input.Password
                    size="large"
                    prefix={<LockOutlined className="input-icon" />}
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                    iconRender={(visible) => 
                      visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                    }
                    className="login-input"
                  />
                </Form.Item>

                {/* Password Requirements */}
                <div style={{ 
                  marginBottom: '24px',
                  padding: '12px',
                  background: theme === 'dark' ? '#1f2937' : '#f9fafb',
                  borderRadius: '6px',
                  border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`
                }}>
                  <p style={{ 
                    fontSize: '12px',
                    fontWeight: '600',
                    color: theme === 'dark' ? '#d1d5db' : '#374151',
                    margin: '0 0 8px 0'
                  }}>
                    Password Requirements:
                  </p>
                  <ul style={{ 
                    fontSize: '11px',
                    color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                    margin: '0',
                    paddingLeft: '16px'
                  }}>
                    <li>At least 6 characters long</li>
                    <li>Contains at least one uppercase letter</li>
                    <li>Contains at least one lowercase letter</li>
                    <li>Contains at least one number</li>
                  </ul>
                </div>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    loading={loading}
                    block
                    className="login-button"
                  >
                    {loading ? 'Updating Password...' : 'Update Password'}
                  </Button>
                </Form.Item>
              </Form>

              {/* Back to Login Link */}
              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <Button 
                  type="link" 
                  onClick={handleBackToLogin}
                  style={{ 
                    color: '#3b82f6',
                    fontSize: '14px',
                    padding: '0',
                    height: 'auto'
                  }}
                >
                  Back to Login
                </Button>
              </div>
            </>
          )}

          {/* Footer */}
          <div className="login-footer">
            <p>© 2025 Linkage VA Hub. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;