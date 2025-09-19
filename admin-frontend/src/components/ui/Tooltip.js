import React, { useState } from 'react';

const Tooltip = ({ 
  title, 
  children, 
  placement = 'top',
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const getPlacementStyles = () => {
    switch (placement) {
      case 'top':
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-2';
      default:
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
    }
  };

  if (!title) return children;

  return (
    <div 
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={`absolute z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900 dark:bg-gray-700 rounded whitespace-nowrap pointer-events-none ${getPlacementStyles()}`}
        >
          {title}
          <div
            className={`absolute w-2 h-2 bg-gray-900 dark:bg-gray-700 transform rotate-45
              ${placement === 'top' ? 'top-full left-1/2 -translate-x-1/2 -translate-y-1' : ''}
              ${placement === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 translate-y-1' : ''}
              ${placement === 'left' ? 'left-full top-1/2 -translate-y-1/2 -translate-x-1' : ''}
              ${placement === 'right' ? 'right-full top-1/2 -translate-y-1/2 translate-x-1' : ''}
            `}
          />
        </div>
      )}
    </div>
  );
};

export default Tooltip;