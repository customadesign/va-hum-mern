import React from 'react';

const Spin = ({ 
  spinning = true, 
  size = 'default', 
  tip = '',
  children,
  className = '',
  delay = 0
}) => {
  const [showSpinner, setShowSpinner] = React.useState(!delay);

  React.useEffect(() => {
    if (!spinning) {
      setShowSpinner(false);
      return;
    }

    if (delay) {
      const timer = setTimeout(() => {
        setShowSpinner(true);
      }, delay);
      return () => clearTimeout(timer);
    } else {
      setShowSpinner(true);
    }
  }, [spinning, delay]);

  const sizes = {
    small: 'h-4 w-4',
    default: 'h-8 w-8',
    large: 'h-12 w-12'
  };

  const SpinnerIcon = () => (
    <svg 
      className={`animate-spin ${sizes[size]} text-[#1e3a8a]`} 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      />
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  // If no children, render standalone spinner
  if (!children) {
    if (!spinning || !showSpinner) return null;
    
    return (
      <div className={`flex flex-col items-center justify-center ${className}`}>
        <SpinnerIcon />
        {tip && (
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {tip}
          </div>
        )}
      </div>
    );
  }

  // If has children, render with overlay
  return (
    <div className={`relative ${className}`}>
      {children}
      {spinning && showSpinner && (
        <div className="absolute inset-0 bg-white/75 dark:bg-gray-800/75 flex flex-col items-center justify-center rounded-lg z-10">
          <SpinnerIcon />
          {tip && (
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {tip}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Spin;