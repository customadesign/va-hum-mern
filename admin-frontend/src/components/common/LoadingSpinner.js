import React from 'react';

const LoadingSpinner = ({ size = 'default', text = 'Loading...' }) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    default: 'h-8 w-8',
    large: 'h-12 w-12'
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-admin-50">
      <div className="text-center">
        <div className={`admin-loading mx-auto ${sizeClasses[size]}`}></div>
        <p className="mt-4 text-sm text-admin-600">{text}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
