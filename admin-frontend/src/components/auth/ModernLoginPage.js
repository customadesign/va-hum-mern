import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Space,
  Alert,
  Divider,
  Row,
  Col,
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  HomeOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/modern-login-page.css';
import EnhancedThemeToggle from '../common/EnhancedThemeToggle';

const { Title, Text } = Typography;

const ModernLoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    console.log('[ModernLoginPage] Auth state:', { isAuthenticated, authLoading });
    if (isAuthenticated && !authLoading) {
      console.log('[ModernLoginPage] User already authenticated, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const onFinish = async (values) => {
    setLoading(true);
    setError('');
    
    try {
      console.log('[ModernLoginPage] Attempting login with:', values.email);
      const result = await login({ email: values.email, password: values.password });
      console.log('[ModernLoginPage] Login result:', result);
      
      if (result && result.success) {
        console.log('[ModernLoginPage] Login successful, navigating to dashboard');
        // Force navigation after successful login
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 100);
      }
    } catch (err) {
      console.error('[ModernLoginPage] Login error:', err);
      setError(err.response?.data?.error || err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // If already authenticated, redirect to dashboard
  if (isAuthenticated && !authLoading) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="modern-login-container">
      {/* Theme Toggle */}
      <div className="theme-toggle-fixed">
        <EnhancedThemeToggle />
      </div>

      {/* Floating Background Elements */}
      <div className="login-floating-element"></div>
      <div className="login-floating-element"></div>

      <Row justify="center" style={{ width: '100%', maxWidth: 1200 }}>
        <Col xs={24} sm={20} md={16} lg={12} xl={10}>
          <Card className="modern-login-card" styles={{ body: { padding: '40px 32px' } }}>
            {/* Header Section */}
            <div className="login-header">
              <div className="login-logo-container">
                <HomeOutlined className="login-logo" />
              </div>
              <Title level={1} className="login-title">Welcome Back</Title>
              <Text className="login-subtitle">Sign in to your admin dashboard</Text>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert
                message={error}
                type="error"
                showIcon
                className="login-alert"
                closable
                onClose={() => setError('')}
              />
            )}

            {/* Login Form */}
            <Form
              name="login"
              onFinish={onFinish}
              layout="vertical"
              size="large"
              autoComplete="on"
              className="login-form"
            >
              <Form.Item
                name="email"
                label={<Text>Email Address</Text>}
                rules={[
                  { required: true, message: 'Please input your email!' },
                  { type: 'email', message: 'Please enter a valid email!' },
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  aria-label="Email Address"
                  placeholder="admin@linkage.ph"
                  className="login-input"
                />
              </Form.Item>

              <Form.Item
                name="password"
                label={<Text>Password</Text>}
                rules={[{ required: true, message: 'Please input your password!' }]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  aria-label="Password"
                  iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                  className="login-input-password"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  className="login-submit-button"
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>
              </Form.Item>
            </Form>

            <Divider className="login-divider">
              <Text type="secondary">Quick Access</Text>
            </Divider>

            {/* Demo Credentials */}
            <Card size="small" className="credentials-card">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong className="credentials-title">Admin Credentials:</Text>
                <div className="credentials-code">
                  <Text style={{ fontFamily: 'monospace' }}>
                    Email: admin@linkage.ph
                  </Text>
                  <br />
                  <Text style={{ fontFamily: 'monospace' }}>
                    Password: admin123
                  </Text>
                </div>
              </Space>
            </Card>

            {/* Footer */}
            <div className="login-footer">
              © 2025 Linkage VA Hub. All rights reserved.
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ModernLoginPage;
