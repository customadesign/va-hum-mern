import React from 'react';

const Switch = ({ 
  checked = false, 
  onChange, 
  disabled = false,
  size = 'default',
  checkedChildren,
  unCheckedChildren,
  className = ''
}) => {
  const sizes = {
    small: {
      switch: 'h-4 w-8',
      dot: 'h-3 w-3',
      translate: 'translate-x-4'
    },
    default: {
      switch: 'h-6 w-11',
      dot: 'h-5 w-5',
      translate: 'translate-x-5'
    },
    large: {
      switch: 'h-7 w-14',
      dot: 'h-6 w-6',
      translate: 'translate-x-7'
    }
  };

  const currentSize = sizes[size];

  const handleToggle = () => {
    if (!disabled && onChange) {
      onChange(!checked);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={disabled}
      className={`
        relative inline-flex items-center
        ${currentSize.switch}
        flex-shrink-0 cursor-pointer rounded-full
        border-2 border-transparent
        transition-colors duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:ring-offset-2
        ${checked ? 'bg-blue-500' : 'bg-red-500'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      role="switch"
      aria-checked={checked}
    >
      <span className="sr-only">{checked ? 'On' : 'Off'}</span>
      
      {/* Text labels inside switch */}
      {(checkedChildren || unCheckedChildren) && (
        <span className={`
          absolute inset-0 flex items-center justify-center text-xs text-white
          ${checked ? 'justify-start pl-1' : 'justify-end pr-1'}
        `}>
          {checked ? checkedChildren : unCheckedChildren}
        </span>
      )}
      
      {/* Switch dot */}
      <span
        className={`
          ${currentSize.dot}
          pointer-events-none inline-block
          rounded-full bg-white shadow ring-0
          transition duration-200 ease-in-out
          ${checked ? currentSize.translate : 'translate-x-0'}
        `}
      />
    </button>
  );
};

export default Switch;