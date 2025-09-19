import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useRegional } from '../../contexts/RegionalContext';
import { ToastContainer } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from '../ui/Sidebar';
import Avatar from '../ui/Avatar';
import Dropdown from '../ui/Dropdown';
import CustomThemeToggle from '../common/CustomThemeToggle';
import CustomNotificationBadge from '../notifications/CustomNotificationBadge';
import UniversalSearch from '../search/UniversalSearch';
import {
  HomeIcon,
  UsersIcon,
  BriefcaseIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  MegaphoneIcon,
  BellIcon,
  Cog6ToothIcon,
  UserIcon,
  ArrowRightStartOnRectangleIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';

const SimpleAdminLayout = () => {
  const { user, logout } = useAuth();
  const { formatDate, formatTime } = useRegional();
  const { t } = useTranslation();
  const location = useLocation();
  
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const navigation = [
    {
      name: t('common.dashboard'),
      href: '/dashboard',
      icon: HomeIcon,
      current: location.pathname === '/dashboard'
    },
    {
      name: t('virtualAssistants.title'),
      href: '/vas',
      icon: UserGroupIcon,
      current: location.pathname === '/vas'
    },
    {
      name: t('businesses.title'),
      href: '/businesses',
      icon: BriefcaseIcon,
      current: location.pathname === '/businesses'
    },
    {
      name: t('users.title'),
      href: '/users',
      icon: UsersIcon,
      current: location.pathname === '/users'
    },
    {
      name: t('messages.title'),
      href: '/messenger-chat',
      icon: ChatBubbleLeftRightIcon,
      current: location.pathname === '/messenger-chat'
    },
    {
      name: t('announcements.title'),
      href: '/announcements',
      icon: MegaphoneIcon,
      current: location.pathname === '/announcements'
    },
    {
      name: t('common.notifications'),
      href: '/notifications',
      icon: BellIcon,
      current: location.pathname === '/notifications'
    },
    {
      name: t('common.settings'),
      href: '/settings',
      icon: Cog6ToothIcon,
      current: location.pathname === '/settings'
    }
  ];

  const profileMenu = (
    <div className="w-64 py-2">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {user?.name || 'Admin User'}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {user?.email || 'admin@example.com'}
        </p>
      </div>
      <div className="py-2">
        <Link
          to="/profile"
          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <UserIcon className="inline-block w-4 h-4 mr-2" />
          {t('common.profile')}
        </Link>
        <Link
          to="/settings"
          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <Cog6ToothIcon className="inline-block w-4 h-4 mr-2" />
          {t('common.settings')}
        </Link>
        <hr className="my-2 border-gray-200 dark:border-gray-700" />
        <button
          onClick={logout}
          className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ArrowRightStartOnRectangleIcon className="inline-block w-4 h-4 mr-2" />
          {t('common.logout')}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-gray-100 dark:bg-gray-900">
      {/* Mobile sidebar backdrop */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 md:hidden transform transition-transform duration-300 ${
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <Sidebar
          navigation={navigation}
          collapsed={false}
          onToggleCollapse={() => setMobileSidebarOpen(false)}
        />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <Sidebar
          navigation={navigation}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="h-16 px-4 sm:px-6 lg:px-8">
            <div className="h-full flex items-center justify-between">
              {/* Left side - Mobile menu button */}
              <div className="flex items-center">
                <button
                  onClick={() => setMobileSidebarOpen(true)}
                  className="md:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <Bars3Icon className="h-6 w-6" />
                </button>
              </div>

              {/* Center - Universal Search */}
              <UniversalSearch />

              {/* Right side - Actions properly aligned */}
              <div className="flex items-center gap-1">
                {/* Date/Time Display */}
                <div className="hidden lg:flex flex-col items-end mr-3 text-sm">
                  <div className="text-gray-700 dark:text-gray-300 font-medium">
                    {formatDate(currentTime)}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">
                    {formatTime(currentTime)}
                  </div>
                </div>

                {/* Theme toggle */}
                <CustomThemeToggle />

                {/* Notifications */}
                <CustomNotificationBadge />

                {/* Profile dropdown */}
                <Dropdown
                  trigger={['click']}
                  overlay={profileMenu}
                  placement="bottomRight"
                >
                  <button className="flex items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <Avatar
                      src={user?.avatar}
                      icon={<UserIcon className="h-5 w-5" />}
                      size={32}
                    />
                  </button>
                </Dropdown>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-8">
          <Outlet />
        </main>
        
        {/* Toast Container for notifications */}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </div>
    </div>
  );
};

export default SimpleAdminLayout;