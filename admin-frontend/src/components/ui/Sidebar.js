import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const Sidebar = ({ 
  navigation, 
  collapsed, 
  onToggleCollapse,
  logo = { text: 'LVH', title: 'Admin Panel' }
}) => {
  const location = useLocation();

  return (
    <aside 
      className={`
        ${collapsed ? 'w-16' : 'w-64'} 
        transition-all duration-300 ease-in-out
        bg-gradient-to-b from-[#667eea] to-[#764ba2]
        dark:from-[#1e3a8a] dark:to-[#1e293b]
        h-full flex flex-col
      `}
    >
      {/* Logo Section */}
      <div className="flex items-center justify-between px-4 py-5">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-white/20 backdrop-blur-sm">
            <span className="font-bold text-sm text-white">{logo.text}</span>
          </div>
          {!collapsed && (
            <span className="ml-2 text-xl font-semibold text-white transition-opacity duration-300">
              {logo.title}
            </span>
          )}
        </div>
        <button
          onClick={onToggleCollapse}
          className="p-1 rounded-md hover:bg-white/10 text-white/80 hover:text-white transition-all duration-200"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRightIcon className="h-5 w-5" />
          ) : (
            <ChevronLeftIcon className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 pb-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          const showBadge = item.badge && item.badge > 0;

          return (
            <Link
              key={item.name}
              to={item.href}
              className={`
                group flex items-center px-3 py-2 text-sm font-medium rounded-md
                transition-all duration-200 relative
                ${isActive
                  ? 'bg-[#3359e9] dark:bg-[#3359e9] text-white border-l-4 border-white'
                  : 'text-white hover:bg-white/10 hover:text-white border-l-4 border-transparent'
                }
              `}
              title={collapsed ? item.name : undefined}
            >
              <Icon 
                className={`
                  ${collapsed ? 'mx-auto' : 'mr-3'} 
                  h-5 w-5 transition-all duration-200
                  ${isActive ? 'text-white' : 'text-white group-hover:text-white'}
                `}
              />
              {!collapsed && (
                <>
                  <span className="flex-1">{item.name}</span>
                  {showBadge && (
                    <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </>
              )}
              {collapsed && showBadge && (
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;