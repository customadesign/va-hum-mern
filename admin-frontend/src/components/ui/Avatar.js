import React from 'react';

const Avatar = ({ 
  src, 
  icon, 
  size = 32, 
  className = '', 
  style = {},
  alt = 'Avatar'
}) => {
  const sizeClasses = {
    24: 'w-6 h-6 text-xs',
    28: 'w-7 h-7 text-xs',
    32: 'w-8 h-8 text-sm',
    40: 'w-10 h-10 text-base',
    48: 'w-12 h-12 text-lg',
    64: 'w-16 h-16 text-xl',
  };

  const sizeClass = sizeClasses[size] || `w-[${size}px] h-[${size}px]`;

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${sizeClass} rounded-full object-cover ${className}`}
        style={{ width: size, height: size, ...style }}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full bg-primary-600 dark:bg-primary-500 flex items-center justify-center text-white ${className}`}
      style={{ width: size, height: size, ...style }}
    >
      {icon || <span className="font-medium">U</span>}
    </div>
  );
};

export default Avatar;