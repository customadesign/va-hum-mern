import React from 'react';
import { InboxIcon } from '@heroicons/react/24/outline';

const Empty = ({ 
  description = 'No data',
  image,
  imageStyle,
  children,
  className = ''
}) => {
  const DefaultImage = () => (
    <InboxIcon className="h-16 w-16 text-gray-400 dark:text-gray-500 mb-4" />
  );

  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      {image === null ? null : (image || <DefaultImage />)}
      
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {description}
      </p>
      
      {children && (
        <div className="mt-4">
          {children}
        </div>
      )}
    </div>
  );
};

export default Empty;