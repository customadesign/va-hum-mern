import React, { useEffect, useState } from 'react';

const NotificationBadge = ({ count }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [previousCount, setPreviousCount] = useState(count);
  const [showPulse, setShowPulse] = useState(false);

  useEffect(() => {
    // Trigger animation when count increases
    if (count > previousCount && count > 0) {
      setIsAnimating(true);
      setShowPulse(true);
      const animTimer = setTimeout(() => setIsAnimating(false), 600);
      const pulseTimer = setTimeout(() => setShowPulse(false), 3000);
      return () => {
        clearTimeout(animTimer);
        clearTimeout(pulseTimer);
      };
    }
    setPreviousCount(count);
  }, [count, previousCount]);

  if (!count || count === 0) {
    return null;
  }

  // Format count display (show 99+ for large numbers)
  const displayCount = count > 99 ? '99+' : count;

  return (
    <>
      <div 
        className={`
          absolute -top-1 -right-1
          min-w-[20px] h-[20px]
          bg-red-500 text-white
          rounded-full
          flex items-center justify-center
          text-[11px] font-bold
          px-1
          transform transition-all duration-300 ease-out
          ${count > 0 ? 'opacity-100' : 'opacity-0'}
          shadow-lg
          border-2 border-white
          ${showPulse ? 'notification-pulse' : ''}
        `}
        style={{
          animation: isAnimating ? 'notificationPop 0.6s ease-out' : 'none',
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
        }}
      >
        <span className="leading-none relative z-10">{displayCount}</span>
      </div>
    </>
  );
};

export default NotificationBadge;