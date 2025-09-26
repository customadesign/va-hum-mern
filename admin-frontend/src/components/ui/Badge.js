import React from 'react';

const Badge = ({ 
  count = 0, 
  overflowCount = 99, 
  children, 
  showZero = false,
  dot = false,
  offset = [0, 0],
  className = '',
  style = {}
}) => {
  const displayCount = count > overflowCount ? `${overflowCount}+` : count;
  const shouldShow = dot || showZero || count > 0;

  return (
    <div className={`relative inline-block ${className}`} style={style}>
      {children}
      {shouldShow && (
        <span
          className={`absolute flex items-center justify-center text-white bg-red-500 dark:bg-red-600 font-medium text-xs leading-none
            ${dot ? 'w-2 h-2 rounded-full' : 'min-w-[20px] h-5 px-1.5 rounded-full'}
          `}
          style={{
            top: offset[1],
            right: offset[0],
            transform: 'translate(50%, -50%)',
          }}
        >
          {!dot && displayCount}
        </span>
      )}
    </div>
  );
};

export default Badge;