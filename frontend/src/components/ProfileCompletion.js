import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import useProfileCompletion, { PROFILE_GATE_THRESHOLD } from '../hooks/useProfileCompletion';

const ProfileCompletion = ({ className = '', showInFooter = false }) => {
  const { user, isVA, isBusiness } = useAuth();

  // Use shared completion (normalized 0–100)
  const { percent, eligible } = useProfileCompletion();
  const profileCompletion = useMemo(() => ({
    percentage: Math.round(percent || 0),
    isComplete: Math.round(percent || 0) >= 100,
    eligible
  }), [percent, eligible]);

  // Early returns after all hooks are called
  // Only show for VAs and Businesses
  if ((!isVA && !isBusiness) || !user) return null;

  // Don't show if profile is complete
  if (profileCompletion.isComplete) return null;

  // Footer version - compact
  if (showInFooter) {
    return (
      <div className={`bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-amber-800">
                Profile {profileCompletion.percentage}% Complete
              </h4>
              <p className="text-xs text-amber-700">
                Complete your profile to help businesses find you
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Mini Progress Circle */}
            <div className="relative w-8 h-8">
              <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 32 32">
                <circle
                  cx="16"
                  cy="16"
                  r="12"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="transparent"
                  className="text-amber-200"
                />
                <circle
                  cx="16"
                  cy="16"
                  r="12"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="transparent"
                  strokeDasharray={`${profileCompletion.percentage * 0.75} 75`}
                  className="text-amber-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-medium text-amber-700">
                  {profileCompletion.percentage}%
                </span>
              </div>
            </div>
            
            <Link
              to={isVA ? "/va/profile" : "/business/profile"}
              className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium px-3 py-1 rounded-md transition-colors"
            >
              Complete
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Full version for other uses
  return (
    <div className={`rounded-lg p-4 border shadow-lg ${
      profileCompletion.percentage >= 80 ? 'bg-green-50 border-green-200' :
      profileCompletion.percentage >= 60 ? 'bg-yellow-50 border-yellow-200' :
      'bg-blue-50 border-blue-200'
    } ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {profileCompletion.percentage >= 80 ? (
              <CheckCircleIcon className="h-5 w-5 text-green-400" />
            ) : (
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
            )}
          </div>
          <div className="ml-3">
            <h3 className={`text-sm font-medium ${
              profileCompletion.percentage >= 80 ? 'text-green-800' :
              profileCompletion.percentage >= 60 ? 'text-yellow-800' :
              'text-blue-800'
            }`}>
              Profile {profileCompletion.percentage}% Complete
            </h3>
            <p className={`text-sm ${
              profileCompletion.percentage >= 80 ? 'text-green-700' :
              profileCompletion.percentage >= 60 ? 'text-yellow-700' :
              'text-blue-700'
            }`}>
              {profileCompletion.percentage >= 80 
                ? 'Almost there! Complete your profile to maximize visibility.'
                : profileCompletion.percentage >= 60 
                  ? 'Good progress! A few more details will help businesses find you.'
                  : 'Complete your profile to help businesses find and connect with you.'
              }
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-lg font-bold ${
            profileCompletion.percentage >= 80 ? 'text-green-600' :
            profileCompletion.percentage >= 60 ? 'text-yellow-600' :
            'text-blue-600'
          }`}>
            {profileCompletion.percentage}%
          </div>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="mt-3">
        <div className="bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${
              profileCompletion.percentage >= 80 ? 'bg-green-500' :
              profileCompletion.percentage >= 60 ? 'bg-yellow-500' :
              'bg-blue-600'
            }`}
            style={{ width: `${profileCompletion.percentage}%` }}
          ></div>
        </div>
      </div>

      {/* Missing Fields Hints */}
      {/* Hook does not return missing fields centralization yet; this section will be expanded when backend exposes them consistently */}
    </div>
  );
};

export default ProfileCompletion;