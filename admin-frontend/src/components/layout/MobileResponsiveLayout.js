import React, { useState, useEffect } from 'react';
import { 
  Layout, 
  Menu, 
  Avatar, 
  Dropdown, 
  Badge, 
  Button, 
  Space, 
  Typography, 
  theme, 
  Drawer,
  Grid,
  FloatButton,
  message,
  Tooltip
} from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  MessageOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuOutlined,
  BarChartOutlined,
  FileTextOutlined,
  GlobalOutlined,
  HomeOutlined,
  CloseOutlined,
  PushpinOutlined,
  PushpinFilled,
  BellOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../common/NotificationSystem';
import ThemeToggle from '../common/ThemeToggle';
import './MobileResponsiveLayout.css';
import '../../styles/enhanced-notifications.css';

const { Header, Sider, Content } = Layout;
const { Text, Title } = Typography;
const { useBreakpoint } = Grid;

const MobileResponsiveLayout = () => {
  const screens = useBreakpoint();
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarPinned, setSidebarPinned] = useState(false);
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);
  const [notificationDrawerVisible, setNotificationDrawerVisible] = useState(false);
  const [selectedKey, setSelectedKey] = useState('dashboard');
  
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { unreadCount, NotificationList, markAllAsRead } = useNotifications();
  const { token } = theme.useToken();

  // Load sidebar pin preference from localStorage
  useEffect(() => {
    const savedPinned = localStorage.getItem('sidebarPinned') === 'true';
    setSidebarPinned(savedPinned);
  }, []);

  // Auto-collapse sidebar on mobile, respect pin preference on desktop
  useEffect(() => {
    if (screens.xs || screens.sm) {
      // On mobile, always collapsed
      setCollapsed(true);
    } else {
      // On desktop, respect the pin preference
      if (sidebarPinned) {
        setCollapsed(false);
      } else {
        // Default behavior - collapsed initially, expands on hover
        setCollapsed(true);
      }
    }
  }, [screens, sidebarPinned]);

  // Handle sidebar hover (only when not pinned and not on mobile)
  const handleSidebarMouseEnter = () => {
    if (!sidebarPinned && !(screens.xs || screens.sm)) {
      setCollapsed(false);
    }
  };

  const handleSidebarMouseLeave = () => {
    if (!sidebarPinned && !(screens.xs || screens.sm)) {
      setCollapsed(true);
    }
  };

  // Toggle sidebar pin/unpin with notification feedback
  const toggleSidebarPin = () => {
    const newPinned = !sidebarPinned;
    setSidebarPinned(newPinned);
    localStorage.setItem('sidebarPinned', newPinned.toString());
    
    // Provide visual feedback
    if (newPinned) {
      setCollapsed(false);
      message.success({
        content: 'Sidebar pinned - it will stay open',
        duration: 2,
        style: {
          marginTop: '70px',
        },
      });
    } else {
      message.info({
        content: 'Sidebar unpinned - it will auto-hide',
        duration: 2,
        style: {
          marginTop: '70px',
        },
      });
    }
  };

  // Update selected key based on current route
  useEffect(() => {
    const path = location.pathname;
    const keyMap = {
      '/dashboard': 'dashboard',
      '/users': 'users',
      '/va-management': 'va-management',
      '/messenger-chat': 'messenger-chat',
      '/announcements': 'announcements',
      '/analytics': 'analytics',
      '/business-management': 'business-management',
      '/settings': 'settings',
    };
    
    Object.entries(keyMap).forEach(([pathPart, key]) => {
      if (path.includes(pathPart)) {
        setSelectedKey(key);
      }
    });
  }, [location.pathname]);

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
      onClick: () => {
        navigate('/dashboard');
        setMobileMenuVisible(false);
      },
    },
    {
      key: 'users',
      icon: <UserOutlined />,
      label: 'User Management',
      onClick: () => {
        navigate('/users');
        setMobileMenuVisible(false);
      },
    },
    {
      key: 'va-management',
      icon: <TeamOutlined />,
      label: 'VA Management',
      onClick: () => {
        navigate('/va-management');
        setMobileMenuVisible(false);
      },
    },
    {
      key: 'business-management',
      icon: <GlobalOutlined />,
      label: 'Business Management',
      onClick: () => {
        navigate('/business-management');
        setMobileMenuVisible(false);
      },
    },
    {
      key: 'messenger-chat',
      icon: <MessageOutlined />,
      label: 'Messages',
      onClick: () => {
        navigate('/messenger-chat');
        setMobileMenuVisible(false);
      },
    },
    {
      key: 'announcements',
      icon: <FileTextOutlined />,
      label: 'Announcements',
      onClick: () => {
        navigate('/announcements');
        setMobileMenuVisible(false);
      },
    },
    {
      key: 'notifications',
      icon: <BellOutlined />,
      label: 'Notifications',
      badge: unreadCount > 0 ? unreadCount : null,
      onClick: () => {
        navigate('/notifications');
        setMobileMenuVisible(false);
      },
    },
    {
      key: 'divider-1',
      type: 'divider',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      onClick: () => {
        navigate('/settings');
        setMobileMenuVisible(false);
      },
    },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: () => {
        navigate('/profile');
        setMobileMenuVisible(false);
      },
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Account Settings',
      onClick: () => {
        navigate('/settings');
        setMobileMenuVisible(false);
      },
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


  // Mobile-specific header
  const MobileHeader = () => (
    <Header 
      style={{
        background: token.colorBgContainer,
        padding: '0 16px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        position: 'fixed',
        width: '100%',
        zIndex: 1001,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Space>
        <Button
          type="text"
          icon={<MenuOutlined />}
          onClick={() => setMobileMenuVisible(true)}
          style={{ fontSize: '20px' }}
        />
        <Tooltip title={location.pathname === '/dashboard' ? "You're on Dashboard" : "Go to Dashboard"} placement="bottom">
          <button
            type="button"
            className={`home-nav-btn ${location.pathname === '/dashboard' ? 'home-nav-btn-active' : ''}`}
            onClick={() => navigate('/dashboard')}
            aria-label="Go to Dashboard"
            disabled={location.pathname === '/dashboard'}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '4px 8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: location.pathname === '/dashboard' ? token.colorPrimary : token.colorTextSecondary,
              cursor: location.pathname === '/dashboard' ? 'default' : 'pointer',
            }}
          >
            <HomeOutlined style={{ fontSize: '24px' }} />
          </button>
        </Tooltip>
        <Title level={5} style={{ margin: 0 }}>Admin Panel</Title>
      </Space>
      
      <Space>
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Modern Notification Button */}
        <div className="relative">
          <button
            className="relative p-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            title="Notifications"
            onClick={() => navigate('/notifications')}
            style={{
              color: token.colorTextSecondary,
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.target.style.color = token.colorText;
              e.target.style.backgroundColor = token.colorBgElevated;
            }}
            onMouseLeave={(e) => {
              e.target.style.color = token.colorTextSecondary;
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM15 17H9a6 6 0 01-6-6V9a6 6 0 0110.293-4.293L15 9v8z" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        </div>

        <Dropdown
          menu={{ items: userMenuItems }}
          placement="bottomRight"
          trigger={['click']}
        >
          <Avatar
            style={{ backgroundColor: token.colorPrimary, cursor: 'pointer' }}
            icon={<UserOutlined />}
          >
            {user?.name?.charAt(0) || 'A'}
          </Avatar>
        </Dropdown>
      </Space>
    </Header>
  );

  // Desktop sidebar
  const DesktopSidebar = () => (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      onMouseEnter={handleSidebarMouseEnter}
      onMouseLeave={handleSidebarMouseLeave}
      style={{
        background: token.colorBgContainer,
        boxShadow: sidebarPinned 
          ? '4px 0 12px rgba(0, 0, 0, 0.08)' 
          : '2px 0 8px rgba(0, 0, 0, 0.06)',
        position: 'fixed',
        height: '100vh',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 1000,
        borderRight: sidebarPinned 
          ? `2px solid ${token.colorPrimary}` 
          : `1px solid ${token.colorBorderSecondary}`,
        transition: 'all 0.2s ease',
      }}
      width={256}
      collapsedWidth={80}
    >
      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: collapsed ? '0 12px' : '0 16px',
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          position: 'relative',
          backgroundColor: sidebarPinned && !collapsed ? token.colorPrimaryBg : token.colorBgContainer,
          transition: 'background-color 0.3s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: collapsed ? 'center' : 'flex-start' }}>
          {!collapsed ? (
            <Space>
              <Title level={4} style={{ margin: 0, color: token.colorPrimary }}>
                Admin Panel
              </Title>
              {sidebarPinned && (
                <Badge 
                  status="processing" 
                  text="Pinned" 
                  style={{ 
                    fontSize: '12px',
                    color: token.colorPrimary,
                    fontWeight: 600,
                  }}
                />
              )}
            </Space>
          ) : (
            <HomeOutlined style={{ fontSize: '24px', color: token.colorPrimary }} />
          )}
        </div>
        
        {/* Pin/Unpin Button - Always visible on desktop */}
        {!(screens.xs || screens.sm) && (
          <Button
            type={sidebarPinned ? "primary" : "default"}
            size={collapsed ? "middle" : "large"}
            icon={sidebarPinned ? <PushpinFilled style={{ fontSize: collapsed ? '16px' : '20px' }} /> : <PushpinOutlined style={{ fontSize: collapsed ? '16px' : '20px' }} />}
            onClick={toggleSidebarPin}
            className="sidebar-pin-button"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: collapsed ? '36px' : (sidebarPinned ? '100px' : '80px'),
              height: collapsed ? '36px' : '42px',
              borderRadius: '8px',
              backgroundColor: sidebarPinned ? token.colorPrimary : '#ffffff',
              color: sidebarPinned ? '#ffffff' : token.colorPrimary,
              border: sidebarPinned ? 'none' : `2px solid ${token.colorPrimary}`,
              transition: 'all 0.3s ease',
              boxShadow: sidebarPinned 
                ? '0 4px 12px rgba(24, 144, 255, 0.4)' 
                : '0 2px 8px rgba(24, 144, 255, 0.2)',
              cursor: 'pointer',
              fontSize: collapsed ? '11px' : '13px',
              fontWeight: 600,
              zIndex: 10,
              position: collapsed ? 'absolute' : 'relative',
              right: collapsed ? '12px' : 'auto',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = sidebarPinned 
                ? '0 6px 16px rgba(24, 144, 255, 0.5)' 
                : '0 4px 12px rgba(24, 144, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = sidebarPinned 
                ? '0 4px 12px rgba(24, 144, 255, 0.4)' 
                : '0 2px 8px rgba(24, 144, 255, 0.2)';
            }}
            title={sidebarPinned ? 'Click to unpin sidebar (it will auto-hide when you move your mouse away)' : 'Click to pin sidebar (keep it always visible)'}
          >
            {/* Add text label for better visibility when expanded */}
            {!collapsed && (sidebarPinned ? 'Unpin' : 'Pin')}
          </Button>
        )}
        
        {/* Show indicator when collapsed and pinned - REMOVED as button is always visible now */}
        {false && !(screens.xs || screens.sm) && collapsed && sidebarPinned && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              right: '12px',
              transform: 'translateY(-50%)',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: token.colorPrimary,
              boxShadow: '0 0 12px rgba(24, 144, 255, 0.6)',
              animation: 'pulse 2s infinite',
            }}
            title="Sidebar is pinned"
          />
        )}
      </div>
      
      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        items={menuItems}
        style={{
          borderRight: 0,
          marginTop: '16px',
          backgroundColor: token.colorBgContainer,
        }}
      />
    </Sider>
  );

  // Mobile drawer menu
  const MobileDrawerMenu = () => (
    <Drawer
      title={
        <Space>
          <HomeOutlined style={{ color: token.colorPrimary }} />
          <Text strong>Navigation</Text>
        </Space>
      }
      placement="left"
      onClose={() => setMobileMenuVisible(false)}
      open={mobileMenuVisible}
      width={280}
      bodyStyle={{ padding: 0 }}
      closeIcon={<CloseOutlined />}
    >
      <div style={{ 
        padding: '16px',
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        marginBottom: '16px'
      }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Avatar 
            size={64}
            style={{ backgroundColor: token.colorPrimary }}
            icon={<UserOutlined />}
          >
            {user?.name?.charAt(0) || 'A'}
          </Avatar>
          <div>
            <Text strong>{user?.name || 'Admin User'}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {user?.email || 'admin@example.com'}
            </Text>
          </div>
        </Space>
      </div>
      
      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        items={menuItems}
        style={{
          borderRight: 0,
          backgroundColor: token.colorBgContainer
        }}
      />
    </Drawer>
  );

  // Notification drawer (works on both mobile and desktop)
  const NotificationDrawer = () => (
    <Drawer
      title={
        <div className="notification-drawer-header">
          <div>
            <span>Notifications</span>
            {unreadCount > 0 && (
              <Badge count={unreadCount} />
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              type="text"
              size="small"
              onClick={markAllAsRead}
            >
              Mark all read
            </Button>
          )}
        </div>
      }
      placement={screens.xs ? 'bottom' : 'right'}
      onClose={() => setNotificationDrawerVisible(false)}
      open={notificationDrawerVisible}
      width={screens.xs ? '100%' : 440}
      height={screens.xs ? '85%' : undefined}
      className="notification-drawer"
      styles={{
        body: { padding: '0' },
        header: { 
          padding: '20px 24px',
        }
      }}
    >
      <div className="notification-drawer-content">
        <NotificationList />
      </div>
    </Drawer>
  );

  const isMobile = screens.xs || screens.sm;
  const contentMarginLeft = !isMobile && !collapsed ? 256 : !isMobile && collapsed ? 80 : 0;
  const contentMarginTop = isMobile ? 64 : 0;

  return (
    <Layout style={{ minHeight: '100vh', backgroundColor: token.colorBgLayout }}>
      {/* Mobile Header - Only show on mobile */}
      {isMobile && <MobileHeader />}
      
      {/* Desktop Sidebar - Only show on desktop */}
      {!isMobile && <DesktopSidebar />}
      
      {/* Mobile Drawer Menu */}
      {isMobile && <MobileDrawerMenu />}
      
      {/* Main Layout */}
      <Layout 
        style={{ 
          marginLeft: contentMarginLeft,
          transition: 'margin 0.2s',
        }}
      >
        {/* Desktop Header */}
        {!isMobile && (
          <Header
            style={{
              background: token.colorBgContainer,
              padding: '0',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'sticky',
              top: 0,
              zIndex: 999,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
              <Button
                type="text"
                icon={collapsed ? <MenuOutlined /> : <MenuOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{ 
                  fontSize: '16px',
                  height: '64px',
                  padding: '0 24px',
                  borderRadius: 0,
                  borderRight: `1px solid ${token.colorBorderSecondary}`,
                }}
              />
              <Tooltip title={location.pathname === '/dashboard' ? "You're on Dashboard" : "Go to Dashboard"} placement="bottom">
                <button
                  type="button"
                  className={`home-nav-btn ${location.pathname === '/dashboard' ? 'home-nav-btn-active' : ''}`}
                  onClick={() => navigate('/dashboard')}
                  aria-label="Go to Dashboard"
                  disabled={location.pathname === '/dashboard'}
                  style={{
                    height: '64px',
                  }}
                >
                  <HomeOutlined style={{ fontSize: '20px' }} />
                </button>
              </Tooltip>
            </div>
            
            <Space size="middle" style={{ paddingRight: '24px' }}>
              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Modern Notification Button */}
              <div className="relative">
                <button
                  className="relative p-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  title="Notifications"
                  onClick={() => navigate('/notifications')}
                  style={{
                    color: token.colorTextSecondary,
                    backgroundColor: 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.color = token.colorText;
                    e.target.style.backgroundColor = token.colorBgElevated;
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.color = token.colorTextSecondary;
                    e.target.style.backgroundColor = 'transparent';
                  }}
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM15 17H9a6 6 0 01-6-6V9a6 6 0 0110.293-4.293L15 9v8z" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full animate-pulse">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
              </div>

              <Dropdown
                menu={{ items: userMenuItems }}
                placement="bottomRight"
              >
                <Space style={{ cursor: 'pointer' }}>
                  <Avatar
                    style={{ backgroundColor: token.colorPrimary }}
                    icon={<UserOutlined />}
                  >
                    {user?.name?.charAt(0) || 'A'}
                  </Avatar>
                  <Text>{user?.name || 'Admin'}</Text>
                </Space>
              </Dropdown>
            </Space>
          </Header>
        )}
        
        {/* Main Content Area */}
        <Content
          style={{
            margin: isMobile ? `${contentMarginTop}px 0 0 0` : '24px',
            padding: isMobile ? '16px' : '24px',
            background: token.colorBgLayout,
            minHeight: isMobile ? `calc(100vh - ${contentMarginTop}px)` : 'calc(100vh - 64px)',
            // Remove overflow: 'auto' to allow natural document scrolling
          }}
        >
          <div style={{ 
            background: token.colorBgContainer, 
            padding: isMobile ? '16px' : '24px',
            borderRadius: token.borderRadius,
            minHeight: '100%',
          }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
      
      {/* Notification Drawer */}
      <NotificationDrawer />
      
      {/* Floating Action Buttons */}
      {!isMobile && (
        <FloatButton.Group
          trigger="hover"
          style={{ right: 24, bottom: 24 }}
          icon={<SettingOutlined />}
        >
          <FloatButton
            icon={sidebarPinned ? <PushpinFilled /> : <PushpinOutlined />}
            onClick={toggleSidebarPin}
            tooltip={sidebarPinned ? 'Unpin Sidebar' : 'Pin Sidebar'}
            type={sidebarPinned ? "primary" : "default"}
          />
          <FloatButton.BackTop visibilityHeight={100} />
        </FloatButton.Group>
      )}
      
      {/* Floating Back to Top Button for Mobile */}
      {isMobile && (
        <FloatButton.BackTop 
          visibilityHeight={100}
          style={{ right: 24, bottom: 24 }}
        />
      )}
    </Layout>
  );
};

export default MobileResponsiveLayout;