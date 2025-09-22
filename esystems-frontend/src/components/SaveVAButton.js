import React, { useState, useEffect } from 'react';
import { BookmarkIcon } from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { toast } from 'react-toastify';
import savedVAsService from '../services/savedVAs';
import { useAuth } from '../contexts/AuthContext';
import { useBranding } from '../contexts/BrandingContext';
import { useNavigate } from 'react-router-dom';

const SaveVAButton = ({ vaId, vaName, className = '', size = 'md', showText = true }) => {
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const { user } = useAuth();
  const { branding } = useBranding();
  const navigate = useNavigate();

  // Check if user can save VAs (E-Systems business users only)
  const canSaveVAs = () => {
    // Debug logging
    console.log('SaveVAButton - Checking canSaveVAs:', {
      user: user,
      userBusiness: user?.business,
      userRole: user?.role,
      userEmail: user?.email,
      isESystemsMode: branding.isESystemsMode
    });

    // For E-Systems, check if user has business email domain
    const isBusinessUser = user && (
      user.role === 'business' ||
      user.business ||
      (user.email && user.email.includes('@esystemsmanagement.com'))
    );

    return isBusinessUser && branding.isESystemsMode;
  };

  // Check if VA is already saved
  useEffect(() => {
    const checkSavedStatus = async () => {
      if (!user || !canSaveVAs()) {
        setIsChecking(false);
        return;
      }

      try {
        const saved = await savedVAsService.checkIfSaved(vaId);
        setIsSaved(saved);
      } catch (error) {
        console.error('Error checking saved status:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkSavedStatus();
  }, [vaId, user]);

  const handleToggleSave = async () => {
    // Check if user is logged in
    if (!user) {
      toast.info('Please sign in to save VAs');
      navigate('/sign-in', { state: { from: `/vas/${vaId}` } });
      return;
    }

    // Check if user has permission
    if (!canSaveVAs()) {
      toast.warning('This feature is available to E-Systems business accounts');
      return;
    }

    setIsLoading(true);

    try {
      if (isSaved) {
        // Unsave VA
        await savedVAsService.unsaveVA(vaId);
        setIsSaved(false);
        toast.success('Removed from saved list');

        // Track analytics
        if (window.gtag) {
          window.gtag('event', 'unsave_va_clicked', {
            va_id: vaId,
            page: window.location.pathname
          });
        }
      } else {
        // Save VA
        await savedVAsService.saveVA(vaId);
        setIsSaved(true);
        toast.success('Saved successfully');

        // Track analytics
        if (window.gtag) {
          window.gtag('event', 'save_va_clicked', {
            va_id: vaId,
            page: window.location.pathname
          });
        }
      }
    } catch (error) {
      const errorMessage = error.error || error.message || 'Failed to update saved status';
      toast.error(errorMessage);

      // Handle specific error cases
      if (error.error?.includes('limit')) {
        toast.info('Remove some saved VAs to add more');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Size configurations
  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3'
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  // Don't show button if not in E-Systems mode
  if (!branding.isESystemsMode) {
    return null;
  }

  // Show disabled state for non-business users
  if (user && !canSaveVAs()) {
    return (
      <button
        disabled
        className={`inline-flex items-center ${sizeClasses[size]} text-gray-700 bg-gray-100 rounded-lg cursor-not-allowed ${className}`}
        title="Available to E-Systems business accounts"
      >
        <BookmarkIcon className={iconSizes[size]} />
        {showText && <span className={`ml-2 ${textSizes[size]}`}>Business only</span>}
      </button>
    );
  }

  const buttonState = isLoading ? 'loading' : isSaved ? 'saved' : 'save';
  const buttonText = {
    loading: isChecking ? 'Loading...' : (isSaved ? 'Removing...' : 'Saving...'),
    saved: 'Saved',
    save: 'Save'
  };

  const Icon = isSaved ? BookmarkSolidIcon : BookmarkIcon;

  return (
    <button
      onClick={handleToggleSave}
      disabled={isLoading || isChecking}
      className={`
        inline-flex items-center ${sizeClasses[size]}
        ${isSaved
          ? 'text-white bg-orange-500 hover:bg-orange-600'
          : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
        }
        rounded-lg transition-all duration-200
        ${isLoading || isChecking ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500
        ${className}
      `}
      aria-label={isSaved ? 'Remove from Saved VAs' : 'Save this VA'}
      aria-pressed={isSaved}
      title={isSaved ? 'Remove from Saved VAs' : 'Save this VA'}
    >
      <Icon
        className={`${iconSizes[size]} ${isLoading ? 'animate-pulse' : ''}`}
        aria-hidden="true"
      />
      {showText && (
        <span className={`ml-2 ${textSizes[size]} font-medium`}>
          {buttonText[buttonState]}
        </span>
      )}
    </button>
  );
};

export default SaveVAButton;