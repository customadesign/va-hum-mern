import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useIsSaved, useSaveVA, useUnsaveVA } from '../../hooks/useSavedVAs';

/**
 * Save Button Component
 * Reusable button to save/unsave VAs
 * Includes authentication gate - redirects to login if not authenticated
 */
const SaveButton = ({ vaId, variant = 'default', className = '' }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isHovered, setIsHovered] = useState(false);

  // Check if VA is already saved
  const { data: savedData, isLoading: checkingStatus } = useIsSaved(vaId);
  const isSaved = savedData?.data?.isSaved || false;

  // Mutations
  const saveVA = useSaveVA();
  const unsaveVA = useUnsaveVA();

  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Authentication gate - redirect to login if not authenticated
    if (!user) {
      // Encode current URL for return after login
      const returnUrl = encodeURIComponent(location.pathname + location.search);
      navigate(`/sign-in?returnUrl=${returnUrl}`);
      return;
    }

    // Toggle save/unsave
    if (isSaved) {
      unsaveVA.mutate(vaId);
    } else {
      saveVA.mutate({ vaId });
    }
  };

  const isProcessing = saveVA.isLoading || unsaveVA.isLoading;

  // Variant styles
  const variants = {
    default: {
      base: 'inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-150',
      saved: 'border-blue-600 text-blue-600 bg-blue-50 hover:bg-blue-100',
      unsaved: 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50',
    },
    icon: {
      base: 'inline-flex items-center justify-center p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-150',
      saved: 'bg-blue-100 text-blue-600 hover:bg-blue-200',
      unsaved: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
    },
    compact: {
      base: 'inline-flex items-center px-3 py-1.5 border text-xs font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-150',
      saved: 'border-blue-600 text-blue-600 bg-blue-50 hover:bg-blue-100',
      unsaved: 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50',
    },
  };

  const variantConfig = variants[variant] || variants.default;
  const stateClass = isSaved ? variantConfig.saved : variantConfig.unsaved;

  // Tooltip text
  const tooltipText = !user
    ? 'Sign in to save VAs'
    : isSaved
    ? 'Remove from saved VAs'
    : 'Save this VA to review later';

  return (
    <div className="relative inline-block">
      <button
        onClick={handleClick}
        disabled={isProcessing || checkingStatus}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`${variantConfig.base} ${stateClass} ${className} ${
          isProcessing || checkingStatus ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        title={tooltipText}
      >
        {/* Loading Spinner */}
        {(isProcessing || checkingStatus) && (
          <svg
            className={`animate-spin ${variant === 'icon' ? 'h-5 w-5' : 'h-4 w-4 mr-2'}`}
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
        )}

        {/* Bookmark Icon */}
        {!isProcessing && !checkingStatus && (
          <>
            {isSaved ? (
              // Filled bookmark with checkmark
              <>
                <svg
                  className={variant === 'icon' ? 'h-5 w-5' : 'h-4 w-4 mr-2'}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                </svg>
                {variant !== 'icon' && (
                  <span className="flex items-center">
                    Saved
                    <svg className="h-3 w-3 ml-1" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                )}
              </>
            ) : (
              // Outline bookmark
              <>
                <svg
                  className={variant === 'icon' ? 'h-5 w-5' : 'h-4 w-4 mr-2'}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                  />
                </svg>
                {variant !== 'icon' && 'Save VA'}
              </>
            )}
          </>
        )}
      </button>

      {/* Tooltip */}
      {isHovered && !isProcessing && !checkingStatus && (
        <div className="absolute z-10 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm tooltip whitespace-nowrap bottom-full left-1/2 transform -translate-x-1/2 mb-2">
          {tooltipText}
          <div className="tooltip-arrow" data-popper-arrow></div>
        </div>
      )}
    </div>
  );
};

export default SaveButton;