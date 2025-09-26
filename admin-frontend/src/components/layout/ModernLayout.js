import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Button, Space, Typography, theme, Drawer } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  MessageOutlined,
  SettingOutlined,
  BellOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BarChartOutlined,
  FileTextOutlined,
  GlobalOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../common/NotificationSystem';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const ModernLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKey, setSelectedKey] = useState('dashboard');
  const [notificationDrawerVisible, setNotificationDrawerVisible] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { unreadCount, NotificationList, markAllAsRead } = useNotifications();
  const { token } = theme.useToken();

  // Update selected key based on current route
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/dashboard')) setSelectedKey('dashboard');
    else if (path.includes('/users')) setSelectedKey('users');
    else if (path.includes('/va-management')) setSelectedKey('va-management');
    else if (path.includes('/messenger-chat')) setSelectedKey('messenger-chat');
    else if (path.includes('/announcements')) setSelectedKey('announcements');
    else if (path.includes('/analytics')) setSelectedKey('analytics');
    else if (path.includes('/business-management')) setSelectedKey('business-management');
    else if (path.includes('/settings')) setSelectedKey('settings');
  }, [location.pathname]);

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
      onClick: () => navigate('/dashboard'),
    },
    {
      key: 'users',
      icon: <UserOutlined />,
      label: 'User Management',
      onClick: () => navigate('/users'),
    },
    {
      key: 'va-management',
      icon: <TeamOutlined />,
      label: 'VA Management',
      onClick: () => navigate('/va-management'),
    },
    {
      key: 'messenger-chat',
      icon: <MessageOutlined />,
      label: 'Messages',
      onClick: () => navigate('/messenger-chat'),
    },
    {
      key: 'announcements',
      icon: <FileTextOutlined />,
      label: 'Announcements',
      onClick: () => navigate('/announcements'),
    },
    {
      key: 'analytics',
      icon: <BarChartOutlined />,
      label: 'Analytics',
      onClick: () => navigate('/analytics'),
    },
    {
      key: 'business-management',
      icon: <GlobalOutlined />,
      label: 'Business Management',
      onClick: () => navigate('/business-management'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      onClick: () => navigate('/settings'),
    },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Account Settings',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: logout,
    },
  ];

  const handleMenuClick = ({ key }) => {
    setSelectedKey(key);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{
          background: token.colorBgContainer,
          boxShadow: '2px 0 8px rgba(0, 0, 0, 0.06)',
        }}
        width={256}
        collapsedWidth={80}
      >
        <div
          style={{
            height: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: `1px solid ${token.colorBorder}`,
            marginBottom: 16,
          }}
        >
          {collapsed ? (
            <HomeOutlined style={{ fontSize: 24, color: token.colorPrimary }} />
          ) : (
            <div style={{ textAlign: 'center' }}>
              <Text strong style={{ fontSize: 18, color: token.colorPrimary }}>
                Linkage VA Hub
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Admin Panel
              </Text>
            </div>
          )}
        </div>
        
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{
            border: 'none',
            background: 'transparent',
          }}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            padding: '12px 24px',
            background: token.colorBgContainer,
            borderBottom: `1px solid ${token.colorBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
            height: 80,
            lineHeight: 'normal',
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 56,
            }}
          />

          <Space size="middle">
            <Badge count={unreadCount} size="small">
              <Button
                type="text"
                icon={<BellOutlined />}
                style={{ fontSize: 16 }}
                onClick={() => setNotificationDrawerVisible(true)}
              />
            </Badge>

            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              arrow
            >
              <Space style={{ cursor: 'pointer' }}>
                <Avatar
                  size="small"
                  icon={<UserOutlined />}
                  style={{ backgroundColor: token.colorPrimary }}
                />
                <div style={{ textAlign: 'right' }}>
                  <Text strong style={{ display: 'block', fontSize: 14 }}>
                    {user?.name || 'Admin User'}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {user?.email || 'admin@linkage.ph'}
                  </Text>
                </div>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        <Content
          style={{
            margin: '24px',
            padding: 24,
            background: token.colorBgContainer,
            borderRadius: token.borderRadiusLG,
            boxShadow: token.boxShadow,
            minHeight: 'calc(100vh - 128px)',
          }}
        >
          <Outlet />
        </Content>
      </Layout>

      {/* Notification Drawer */}
      <Drawer
        title={
          <div className="notification-drawer-header">
            <Space>
              <span style={{ fontSize: '16px', fontWeight: '600', color: '#262626' }}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <Badge 
                  count={unreadCount} 
                  style={{ 
                    backgroundColor: '#ff4d4f',
                    fontSize: '11px',
                    fontWeight: '600'
                  }} 
                />
              )}
            </Space>
            {unreadCount > 0 && (
              <Button 
                type="text" 
                size="small" 
                onClick={markAllAsRead}
                style={{
                  fontSize: '12px',
                  color: '#1890ff',
                  padding: '4px 8px',
                  height: 'auto'
                }}
              >
                Mark all read
              </Button>
            )}
          </div>
        }
        placement="right"
        onClose={() => setNotificationDrawerVisible(false)}
        open={notificationDrawerVisible}
        width={420}
        styles={{
          body: { padding: '0' },
          header: { 
            padding: '16px 20px',
            borderBottom: '1px solid #f0f2f5',
            background: '#fafafa'
          }
        }}
      >
        <div className="notification-drawer-content">
          <NotificationList />
        </div>
      </Drawer>
    </Layout>
  );
};

export default ModernLayout;
