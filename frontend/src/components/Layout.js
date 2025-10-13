import React, { Fragment, useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { Bars3Icon, BellIcon, XMarkIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useBranding } from '../contexts/BrandingContext';
import { useQuery } from 'react-query';
import api from '../services/api';
import { scrollToTop } from '../hooks/useScrollToTop';

import { useNotifications } from '../hooks/useNotifications';
import NotificationBadge from './NotificationBadge';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

// Custom Link component that scrolls to top on click
const ScrollToTopLink = ({ to, children, className, ...props }) => {
  const handleClick = () => {
    // Scroll to top with smooth behavior
    scrollToTop();
  };

  return (
    <Link 
      to={to} 
      className={className}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Link>
  );
};

export default function Layout() {
  const { user, logout, isVA, isBusiness } = useAuth();
  const { branding, loading: brandingLoading } = useBranding();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const [isHoveringBell, setIsHoveringBell] = useState(false);
  
  // Fetch user profile to get avatar
  const { data: profileData } = useQuery(
    ['userProfile', user?.id],
    async () => {
      if (!user) return null;
      
      try {
        // Try VA profile first
        if (user.role === 'va' || user.va) {
          const response = await api.get('/vas/me');
          return response.data.data;
        }
        // Try Business profile
        if (user.role === 'business' || user.business) {
          const response = await api.get('/businesses/me');
          return response.data.data;
        }
        // Fallback to user profile
        const response = await api.get('/profile/me');
        return response.data.user;
      } catch (error) {
        console.error('Error fetching profile for avatar:', error);
        return null;
      }
    },
    {
      enabled: !!user,
      staleTime: 60000, // Cache for 1 minute
      cacheTime: 300000, // Keep in cache for 5 minutes
    }
  );
  
  const userAvatar = profileData?.avatar || user?.avatar;

  // Show loading spinner while branding context is loading
  if (brandingLoading || !branding) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const navigation = [
    { name: 'Home', href: '/', current: false },
    { name: 'Virtual Assistants', href: '/vas', current: false },
    ...(!branding.isESystemsMode ? [{ name: 'Community', href: '/community', current: false }] : []),
    { name: 'About', href: '/about', current: false },
  ];

  const userNavigation = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Profile', href: '/va/profile' },
    { name: 'Conversations', href: '/conversations' },
    ...(user?.admin ? [{ name: 'Admin Panel', href: '/admin' }] : []),
  ];

  return (
    <div className="min-h-full">
      <Disclosure as="nav" className={classNames(
        branding.isESystemsMode ? "bg-gray-700" : "border-b border-gray-200",
        "shadow"
      )} style={{backgroundColor: '#2173b8'}}>
        {({ open }) => (
          <>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-20">
                <div className="flex">
                  <div className="flex-shrink-0 flex items-center">
                    <Link to="/" className="flex items-center">
                      <img
                        className={classNames(
                          "h-[54px] w-auto",
                          branding.isESystemsMode && "brightness-0 invert"
                        )}
                        src={branding.logoUrl || branding.logo}
                        alt={branding.name}
                      />
                    </Link>
                  </div>
                  <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={classNames(
                          item.current
                            ? 'border-white text-white'
                            : 'border-transparent text-white hover:border-white hover:text-gray-200',
                          'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium'
                        )}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:items-center">
                  {user ? (
                    <>
                      <button
                        type="button"
                        onClick={() => navigate('/notifications')}
                        onMouseEnter={() => setIsHoveringBell(true)}
                        onMouseLeave={() => setIsHoveringBell(false)}
                        className={classNames(
                          branding.isESystemsMode 
                            ? "bg-gray-800 text-gray-300 hover:text-white focus:ring-offset-gray-700 focus:ring-white" 
                            : "bg-gray-100 text-gray-400 hover:text-gray-500 focus:ring-offset-2 focus:ring-gray-500",
                          "p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 relative transition-all duration-200",
                          isHoveringBell ? "transform scale-110" : "transform scale-100"
                        )}
                      >
                        <span className="sr-only">View notifications {unreadCount > 0 ? `(${unreadCount} unread)` : ''}</span>
                        <BellIcon 
                          className={classNames(
                            "h-6 w-6 transition-all duration-200",
                            unreadCount > 0 && "animate-wiggle"
                          )} 
                          aria-hidden="true" 
                        />
                        <NotificationBadge count={unreadCount} />
                      </button>

                      {/* Profile dropdown */}
                      <Menu as="div" className="ml-3 relative">
                        <div>
                          <Menu.Button className={classNames(
                            branding.isESystemsMode 
                              ? "focus:ring-offset-gray-700 focus:ring-white" 
                              : "focus:ring-offset-2 focus:ring-indigo-500",
                            "rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-transform hover:scale-105"
                          )}>
                            <span className="sr-only">Open user menu</span>
                            {userAvatar ? (
                              <img
                                className="h-8 w-8 rounded-full object-cover ring-2 ring-white shadow-md"
                                src={userAvatar}
                                alt={user.email}
                              />
                            ) : (
                              <div className={classNames(
                                branding.isESystemsMode 
                                  ? "bg-gradient-to-br from-gray-600 to-gray-700" 
                                  : "bg-gradient-to-br from-indigo-500 to-purple-600",
                                "h-8 w-8 rounded-full flex items-center justify-center ring-2 ring-white shadow-md"
                              )}>
                                <span className="text-sm font-semibold text-white">
                                  {user.email[0].toUpperCase()}
                                </span>
                              </div>
                            )}
                          </Menu.Button>
                        </div>
                        <Transition
                          as={Fragment}
                          enter="transition ease-out duration-200"
                          enterFrom="transform opacity-0 scale-95"
                          enterTo="transform opacity-100 scale-100"
                          leave="transition ease-in duration-75"
                          leaveFrom="transform opacity-100 scale-100"
                          leaveTo="transform opacity-0 scale-95"
                        >
                          <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                            {userNavigation.map((item) => (
                              <Menu.Item key={item.name}>
                                {({ active }) => (
                                  <Link
                                    to={item.href}
                                    className={classNames(
                                      active ? 'bg-gray-100' : '',
                                      'block px-4 py-2 text-sm text-gray-700'
                                    )}
                                  >
                                    {item.name}
                                  </Link>
                                )}
                              </Menu.Item>
                            ))}
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={logout}
                                  className={classNames(
                                    active ? 'bg-gray-100' : '',
                                    'block w-full text-left px-4 py-2 text-sm text-gray-700'
                                  )}
                                >
                                  Sign out
                                </button>
                              )}
                            </Menu.Item>
                          </Menu.Items>
                        </Transition>
                      </Menu>
                    </>
                  ) : (
                    <div className="flex items-center space-x-4">
                      <Link
                        to="/sign-in"
                        className="px-3 py-2 text-sm font-medium text-white hover:text-gray-200"
                      >
                        Sign in
                      </Link>
                      <Link
                        to="/sign-up"
                        className="px-3 py-2 rounded-md text-sm font-medium text-white hover:opacity-90"
                        style={{backgroundColor: '#ff6b6b'}}
                      >
                        Get started
                      </Link>
                    </div>
                  )}
                </div>
                <div className="-mr-2 flex items-center sm:hidden">
                  <Disclosure.Button className={classNames(
                    branding.isESystemsMode 
                      ? "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-600 focus:ring-offset-gray-700 focus:ring-white" 
                      : "bg-gray-100 text-gray-500 hover:text-gray-700 hover:bg-gray-200 focus:ring-offset-2 focus:ring-gray-500",
                    "inline-flex items-center justify-center p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2"
                  )}>
                    <span className="sr-only">Open main menu</span>
                    {open ? (
                      <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                    ) : (
                      <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                    )}
                  </Disclosure.Button>
                </div>
              </div>
            </div>

            <Disclosure.Panel className="sm:hidden border-b border-gray-200" style={{backgroundColor: '#2173b8'}}>
              <div className="pt-2 pb-3 space-y-1">
                {navigation.map((item) => (
                  <Disclosure.Button
                    key={item.name}
                    as={Link}
                    to={item.href}
                    className={classNames(
                      item.current
                        ? 'bg-blue-700 border-white text-white'
                        : 'border-transparent text-white hover:bg-blue-700 hover:border-white hover:text-white',
                      'block pl-3 pr-4 py-2 border-l-4 text-base font-medium'
                    )}
                  >
                    {item.name}
                  </Disclosure.Button>
                ))}
              </div>
              {user ? (
                <div className={classNames(
                  "pt-4 pb-3 border-t",
                  branding.isESystemsMode ? "border-gray-600" : "border-gray-200"
                )}>
                  <div className="flex items-center px-4">
                    <div className="flex-shrink-0">
                      {userAvatar ? (
                        <img
                          className="h-10 w-10 rounded-full object-cover ring-2 ring-white shadow-md"
                          src={userAvatar}
                          alt={user.email}
                        />
                      ) : (
                        <div className={classNames(
                          branding.isESystemsMode 
                            ? "bg-gradient-to-br from-gray-600 to-gray-700" 
                            : "bg-gradient-to-br from-indigo-500 to-purple-600",
                          "h-10 w-10 rounded-full flex items-center justify-center ring-2 ring-white shadow-md"
                        )}>
                          <span className="text-sm font-semibold text-white">
                            {user.email[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="ml-3 flex-1">
                      <div className={classNames(
                        branding.isESystemsMode ? "text-white" : "text-gray-900",
                        "text-base font-medium"
                      )}>{user.email}</div>
                    </div>
                    <button
                      onClick={() => navigate('/notifications')}
                      className={classNames(
                        branding.isESystemsMode 
                          ? "bg-gray-800 text-gray-300 hover:text-white" 
                          : "bg-gray-100 text-gray-400 hover:text-gray-500",
                        "p-2 rounded-full relative mr-2"
                      )}
                    >
                      <span className="sr-only">View notifications {unreadCount > 0 ? `(${unreadCount} unread)` : ''}</span>
                      <BellIcon className="h-6 w-6" aria-hidden="true" />
                      <NotificationBadge count={unreadCount} />
                    </button>
                  </div>
                  <div className="mt-3 space-y-1">
                    {userNavigation.map((item) => (
                      <Disclosure.Button
                        key={item.name}
                        as={Link}
                        to={item.href}
                        className={classNames(
                          branding.isESystemsMode 
                            ? "text-gray-300 hover:text-white hover:bg-gray-600" 
                            : "text-gray-700 hover:text-gray-900 hover:bg-gray-100",
                          "block px-4 py-2 text-base font-medium"
                        )}
                      >
                        {item.name}
                      </Disclosure.Button>
                    ))}
                    <Disclosure.Button
                      as="button"
                      onClick={logout}
                      className={classNames(
                        branding.isESystemsMode 
                          ? "text-gray-300 hover:text-white hover:bg-gray-600" 
                          : "text-gray-700 hover:text-gray-900 hover:bg-gray-100",
                        "block w-full text-left px-4 py-2 text-base font-medium"
                      )}
                    >
                      Sign out
                    </Disclosure.Button>
                  </div>
                </div>
              ) : (
                <div className={classNames(
                  "pt-4 pb-3 border-t",
                  branding.isESystemsMode ? "border-gray-600" : "border-gray-200"
                )}>
                  <div className="space-y-1">
                    <Disclosure.Button
                      as={Link}
                      to="/sign-in"
                      className="block px-4 py-2 text-base font-medium text-white hover:text-gray-200 hover:bg-blue-700"
                    >
                      Sign in
                    </Disclosure.Button>
                    <Disclosure.Button
                      as={Link}
                      to="/sign-up"
                      className="block px-4 py-2 text-base font-medium text-white hover:opacity-90 mx-4 rounded-md"
                      style={{backgroundColor: '#ff6b6b'}}
                    >
                      Get started
                    </Disclosure.Button>
                  </div>
                </div>
              )}
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>

      <main className="flex-1 -mt-px">
        <Outlet />
      </main>

      <footer style={{backgroundColor: '#2173b8'}}>        
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex justify-center md:order-2">
              <div className="flex space-x-6">
                <ScrollToTopLink to="/terms" className="text-white hover:text-gray-200 text-sm">
                  Terms of Service
                </ScrollToTopLink>
                <ScrollToTopLink to="/privacy" className="text-white hover:text-gray-200 text-sm">
                  Privacy Policy
                </ScrollToTopLink>

                {/* Social Media Icons */}
                <a href="https://facebook.com/linkagevasolutions" target="_blank" rel="noopener noreferrer" className="text-white hover:text-gray-200">
                  <span className="sr-only">Meta (Facebook)</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>

                <a href="https://x.com/linkagevasolutions" target="_blank" rel="noopener noreferrer" className="text-white hover:text-gray-200">
                  <span className="sr-only">X (Twitter)</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>

                <a href="https://discord.gg/linkagevasolutions" target="_blank" rel="noopener noreferrer" className="text-white hover:text-gray-200">
                  <span className="sr-only">Discord</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0189 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9554 2.4189-2.1568 2.4189Z"/>
                  </svg>
                </a>
              </div>
            </div>
            <div className="mt-8 md:mt-0 md:order-1">
              <p className="text-center text-base text-white">
                &copy; 2025 {branding.name}. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}