import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const Tag = ({ 
  children, 
  color = 'default',
  closable = false,
  onClose,
  icon,
  className = '',
  size = 'default'
}) => {
  const colors = {
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    primary: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  };

  const sizes = {
    small: 'px-2 py-0.5 text-xs',
    default: 'px-2.5 py-1 text-sm',
    large: 'px-3 py-1.5 text-base'
  };

  return (
    <span className={`
      inline-flex items-center rounded-md font-medium
      ${colors[color] || colors.default}
      ${sizes[size]}
      ${className}
    `}>
      {icon && <span className="mr-1">{icon}</span>}
      {children}
      {closable && (
        <button
          onClick={onClose}
          className="ml-1.5 inline-flex items-center justify-center hover:opacity-75 focus:outline-none"
        >
          <XMarkIcon className="h-3 w-3" />
        </button>
      )}
    </span>
  );
};

export default Tag;