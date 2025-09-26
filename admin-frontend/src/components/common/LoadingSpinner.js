import React from 'react';
import Spin from '../ui/Spin';

const LoadingSpinner = ({ 
  size = 'large', 
  text = 'Loading...', 
  fullScreen = false,
  tip = null 
}) => {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur flex items-center justify-center z-[9999]">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg dark:shadow-xl border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col items-center space-y-3">
            <Spin size={size} tip={tip || text} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-10">
      <div className="flex flex-col items-center space-y-3">
        <Spin size={size} tip={tip || text} />
      </div>
    </div>
  );
};

export default LoadingSpinner;