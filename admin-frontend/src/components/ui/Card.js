import React from 'react';

const Card = ({ 
  title, 
  children, 
  className = '', 
  bordered = true,
  hoverable = false,
  loading = false,
  extra,
  cover,
  actions,
  size = 'default'
}) => {
  const sizes = {
    small: 'p-4',
    default: 'p-6',
    large: 'p-8'
  };

  const baseClasses = `
    bg-white dark:bg-gray-800 
    rounded-lg 
    ${bordered ? 'border border-gray-200 dark:border-gray-700' : ''} 
    ${hoverable ? 'hover:shadow-lg transition-shadow duration-200 cursor-pointer' : 'shadow-sm'}
  `;

  return (
    <div className={`${baseClasses} ${className}`}>
      {loading && (
        <div className="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-75 dark:bg-opacity-75 rounded-lg flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a8a]"></div>
        </div>
      )}
      
      {cover && (
        <div className="rounded-t-lg overflow-hidden -m-px">
          {cover}
        </div>
      )}
      
      {(title || extra) && (
        <div className={`flex items-center justify-between ${sizes[size]} ${children || actions ? 'border-b border-gray-200 dark:border-gray-700' : ''}`}>
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
          )}
          {extra && (
            <div className="ml-auto">
              {extra}
            </div>
          )}
        </div>
      )}
      
      {children && (
        <div className={`${sizes[size]} ${title ? '' : ''}`}>
          {children}
        </div>
      )}
      
      {actions && actions.length > 0 && (
        <div className="flex items-center justify-around border-t border-gray-200 dark:border-gray-700 px-6 py-3">
          {actions.map((action, index) => (
            <React.Fragment key={index}>
              {index > 0 && <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />}
              <button className="flex-1 text-center text-sm text-gray-600 dark:text-gray-400 hover:text-[#1e3a8a] dark:hover:text-[#5da0f5] transition-colors">
                {action}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

// Meta component for Card descriptions
Card.Meta = ({ title, description, avatar }) => {
  return (
    <div className="flex items-start space-x-3">
      {avatar && (
        <div className="flex-shrink-0">
          {avatar}
        </div>
      )}
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {title}
          </h4>
        )}
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

export default Card;