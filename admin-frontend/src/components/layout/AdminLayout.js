import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import io from 'socket.io-client';
import {
  HomeIcon,
  UsersIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  ChartBarIcon,
  CogIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  MegaphoneIcon,
  ChatBubbleLeftRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import Dropdown from '../ui/Dropdown';
import Avatar from '../ui/Avatar';
import Tooltip from '../ui/Tooltip';
import NotificationBadge from '../notifications/NotificationBadge';
import ThemeToggle from '../common/ThemeToggle';
import './AdminLayout.css';
import '../common/ThemeToggle.css';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Virtual Assistants', href: '/vas', icon: UsersIcon },
  { name: 'Businesses', href: '/business-management', icon: BuildingOfficeIcon },
  { name: 'Users', href: '/users', icon: UserGroupIcon },
  { name: 'Messages', href: '/messenger-chat', icon: ChatBubbleLeftRightIcon },
  { name: 'Announcements', href: '/announcements', icon: MegaphoneIcon },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
  { name: 'Settings', href: '/settings', icon: CogIcon },
];

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [userSettings, setUserSettings] = useState({});
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  // Check if we're currently on the dashboard
  const isDashboard = location.pathname === '/dashboard';

  // Load user settings for regional preferences
  useEffect(() => {
    const loadUserSettings = async () => {
      try {
        const response = await api.get('/admin/settings');
        if (response.data?.settings?.regional) {
          setUserSettings(response.data.settings.regional);
        }
      } catch (error) {
        console.error('Failed to load user settings:', error);
      }
    };
    loadUserSettings();
  }, []);

  // Update date/time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // Format date and time based on user settings
  const formatDateTime = () => {
    const timezone = userSettings.timezone || 'Asia/Manila';
    const timeFormat = userSettings.timeFormat || '12h';
    const dateFormat = userSettings.dateFormat || 'MM/DD/YYYY';
    
    // Format date
    let dateOptions = {
      timeZone: timezone === 'auto' ? undefined : timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    };
    
    // Apply date format preference
    if (dateFormat === 'DD/MM/YYYY') {
      dateOptions = { ...dateOptions, day: '2-digit', month: '2-digit', year: 'numeric' };
    } else if (dateFormat === 'YYYY-MM-DD') {
      dateOptions = { ...dateOptions, year: 'numeric', month: '2-digit', day: '2-digit' };
    } else if (dateFormat === 'MMM DD, YYYY') {
      dateOptions = { ...dateOptions, month: 'short', day: 'numeric', year: 'numeric' };
    } else if (dateFormat === 'DD MMM YYYY') {
      dateOptions = { ...dateOptions, day: 'numeric', month: 'short', year: 'numeric' };
    }
    
    // Format time
    const timeOptions = {
      timeZone: timezone === 'auto' ? undefined : timezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: timeFormat !== '24h'
    };
    
    const formattedDate = currentDateTime.toLocaleDateString(userSettings.language || 'en', dateOptions);
    const formattedTime = currentDateTime.toLocaleTimeString(userSettings.language || 'en', timeOptions);
    
    return { date: formattedDate, time: formattedTime };
  };

  const { date: formattedDate, time: formattedTime } = formatDateTime();

  // Fetch unread message count and setup real-time updates
  useEffect(() => {
    const fetchMessageCount = async () => {
      try {
        const response = await api.get('/admin/intercept/conversations');
        setMessageCount(response.data?.data?.unreadCount || 0);
      } catch (error) {
        console.error('Failed to fetch message count:', error);
      }
    };

    fetchMessageCount();
    
    // Setup Socket.IO for real-time updates
    const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:8000', {
      auth: {
        token: localStorage.getItem('token')
      }
    });

    // Listen for new intercepted messages
    socket.on('intercepted_message', () => {
      fetchMessageCount(); // Refresh count when new message arrives
    });

    socket.on('admin_unread_update', (data) => {
      setMessageCount(data.unreadCount);
    });

    // Refresh count every 30 seconds as backup
    const interval = setInterval(fetchMessageCount, 30000);
    
    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="min-h-screen flex bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 dark:bg-gray-900 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full admin-sidebar">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="h-6 w-6 admin-sidebar-icon" />
            </button>
          </div>
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center admin-sidebar-logo">
                <span className="font-bold text-sm admin-sidebar-logo-text">LVH</span>
              </div>
              <span className="ml-2 text-xl font-semibold admin-sidebar-title">Admin</span>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                const showBadge = item.name === 'Messages' && messageCount > 0;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${isActive ? 'admin-sidebar-link-active' : 'admin-sidebar-link-inactive'} relative`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="mr-3 h-6 w-6" />
                    <span>{item.name}</span>
                    {showBadge && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full animate-pulse">
                        {messageCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className={`hidden md:flex md:flex-shrink-0 transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'w-16' : 'w-64'} ${sidebarCollapsed ? 'overflow-visible' : ''}`}>
        <div className="flex flex-col">
          <div className={`flex flex-col h-0 flex-1 border-r border-gray-200 dark:border-gray-700 admin-sidebar ${sidebarCollapsed ? 'overflow-visible' : ''}`}>
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className={`flex items-center flex-shrink-0 relative ${sidebarCollapsed ? 'px-1 justify-center' : 'px-4'}`}>
                <div className="h-8 w-8 rounded-lg flex items-center justify-center admin-sidebar-logo">
                  <span className="font-bold text-sm admin-sidebar-logo-text">LVH</span>
                </div>
                {!sidebarCollapsed && (
                  <span className="ml-2 text-xl font-semibold transition-opacity duration-300 admin-sidebar-title">Admin Panel</span>
                )}
                <button
                  onClick={toggleSidebar}
                  className={`${sidebarCollapsed ? 'absolute -right-2 top-1/2 -translate-y-1/2 z-10' : 'ml-auto'} p-2 rounded-md hover:bg-opacity-20 hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 admin-sidebar-toggle bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700`}
                  title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  {sidebarCollapsed ? (
                    <ChevronRightIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <ChevronLeftIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  )}
                </button>
              </div>
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  const showBadge = item.name === 'Messages' && messageCount > 0;
                  
                  const linkContent = (
                    <>
                      <item.icon className="h-6 w-6 flex-shrink-0" />
                      {!sidebarCollapsed && (
                        <>
                          <span className="ml-3 transition-opacity duration-300">{item.name}</span>
                          {showBadge && (
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full animate-pulse">
                              {messageCount}
                            </span>
                          )}
                        </>
                      )}
                      {sidebarCollapsed && showBadge && (
                        <span className="absolute -right-1 -top-1 inline-flex items-center justify-center w-4 h-4 text-xs font-bold leading-none text-white bg-red-600 rounded-full animate-pulse">
                          {messageCount > 9 ? '9+' : messageCount}
                        </span>
                      )}
                    </>
                  );
                  
                  // Wrap in Tooltip when sidebar is collapsed
                  if (sidebarCollapsed) {
                    return (
                      <Tooltip 
                        key={item.name}
                        title={item.name} 
                        placement="right"
                        overlayClassName="sidebar-tooltip"
                      >
                        <Link
                          to={item.href}
                          className={`${isActive ? 'admin-sidebar-link-active' : 'admin-sidebar-link-inactive'} relative group transition-all duration-300`}
                        >
                          {linkContent}
                        </Link>
                      </Tooltip>
                    );
                  }
                  
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`${isActive ? 'admin-sidebar-link-active' : 'admin-sidebar-link-inactive'} relative group transition-all duration-300`}
                    >
                      {linkContent}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 transition-all duration-300 ease-in-out">
        {/* Top navigation */}
        <div className="admin-header relative z-10 flex-shrink-0 flex items-center h-16 bg-white dark:bg-primary-900 shadow border-b border-gray-200 dark:border-primary-700 transition-colors duration-300">
          <div className="flex items-center">
            <button
              type="button"
              className="flex items-center h-full px-4 border-r border-gray-200 dark:border-primary-700 text-gray-500 dark:text-primary-300 hover:text-gray-700 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 md:hidden transition-colors duration-200"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation menu"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            <Tooltip title={isDashboard ? "You're on Dashboard" : "Go to Dashboard"} placement="bottom">
              <button
                type="button"
                className={`home-nav-btn ${isDashboard ? 'home-nav-btn-active' : ''}`}
                onClick={() => navigate('/dashboard')}
                aria-label="Go to Dashboard"
                disabled={isDashboard}
              >
                <HomeIcon className="h-6 w-6" />
              </button>
            </Tooltip>
          </div>
          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1 flex">
              <div className="w-full flex md:ml-0">
                <div className="relative w-full text-admin-400 focus-within:text-admin-600 flex items-center h-full">
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    className="w-full pl-10 pr-3 h-10 border border-transparent rounded-md bg-gray-100 dark:bg-primary-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-primary-300 focus:outline-none focus:bg-white dark:focus:bg-primary-700 focus:border-white dark:focus:border-primary-500 focus:ring-white dark:focus:ring-primary-500 focus:text-gray-900 dark:focus:text-white focus:placeholder-gray-400 dark:focus:placeholder-primary-200 sm:text-sm transition-colors duration-200"
                    placeholder="Search users, VAs, businesses..."
                    type="search"
                  />
                </div>
              </div>
            </div>
            <div className="ml-4 flex items-center h-full md:ml-6">
              <div className="flex items-center h-full space-x-3" style={{display: 'flex', alignItems: 'center', height: '100%'}}>
                {/* Date and Time Display */}
                <div className="hidden lg:flex flex-col items-end mr-4 text-sm">
                  <div className="text-gray-700 dark:text-gray-300 font-medium">{formattedDate}</div>
                  <div className="text-gray-500 dark:text-gray-400">{formattedTime}</div>
                </div>
                
                {/* Theme Toggle */}
                <div className="header-icon-wrapper" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '32px'}}>
                  <ThemeToggle />
                </div>
                
                {/* Notification Badge Component */}
                <div className="header-icon-wrapper" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '32px', transform: 'translateY(7px)'}}>
                  <NotificationBadge />
                </div>
                
                {/* Profile Dropdown */}
                <div className="header-icon-wrapper" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '32px'}}>
                  <Dropdown
                    placement="bottomRight"
                    trigger={['click']}
                    overlayClassName="profile-dropdown"
                    dropdownRender={() => (
                    <div className="profile-menu">
                      <div className="profile-header">
                        <div className="flex items-center space-x-3 p-3">
                          <Avatar
                            size={40}
                            src={user?.avatar}
                            icon={<UserIcon className="h-5 w-5" />}
                            className="bg-primary-600"
                          />
                          <div>
                            <p className="font-medium text-gray-900">
                              {user?.name || 'Admin User'}
                            </p>
                            <p className="text-sm text-gray-500">{user?.email}</p>
                          </div>
                        </div>
                      </div>
                      <div className="profile-menu-items">
                        <div
                          className="profile-menu-item"
                          onClick={() => navigate('/profile')}
                        >
                          <UserIcon className="h-5 w-5 text-gray-400" />
                          <span>Profile Settings</span>
                        </div>
                        <div
                          className="profile-menu-item"
                          onClick={() => navigate('/settings')}
                        >
                          <Cog6ToothIcon className="h-5 w-5 text-gray-400" />
                          <span>Settings</span>
                        </div>
                        <div className="profile-menu-divider" />
                        <div
                          className="profile-menu-item text-red-600"
                          onClick={handleLogout}
                        >
                          <ArrowRightOnRectangleIcon className="h-5 w-5" />
                          <span>Logout</span>
                        </div>
                      </div>
                    </div>
                  )}
                >
                  <button 
                    className="profile-button"
                    style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '32px', width: '32px', padding: '4px', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '6px'}}
                  >
                    <Avatar
                      size={28}
                      src={user?.avatar}
                      icon={<UserIcon className="h-4 w-4" />}
                      className="bg-primary-600"
                    />
                  </button>
                  </Dropdown>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
