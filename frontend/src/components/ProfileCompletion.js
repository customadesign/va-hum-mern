import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from 'react-query';
import api from '../services/api';

const ProfileCompletion = ({ className = '', showInFooter = false }) => {
  const { user, isVA, isBusiness } = useAuth();

  // Fetch profile data - moved to top to avoid conditional hook call
  const { data: profileData } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const response = await api.get('/users/profile');
      return response.data;
    },
    enabled: !!user && (isVA || isBusiness)  // Fetch for both VA and Business users
  });

  // Extract the appropriate profile from the response
  const vaProfile = profileData?.data?.va || null;
  const businessProfile = profileData?.data?.business || null;
  const profile = isVA ? vaProfile : businessProfile;

  // Calculate profile completion percentage based on user type
  const profileCompletion = useMemo(() => {
    if (!profile) return { percentage: 0, isComplete: false, missingFields: [] };

    // Debug logging for VA profile
    if (isVA) {
      console.log('ProfileCompletion - VA Profile Data:', profile);
      console.log('ProfileCompletion - Hero field value:', profile?.hero);
      console.log('ProfileCompletion - Hero length:', profile?.hero?.length);
      console.log('ProfileCompletion - All profile keys:', Object.keys(profile || {}));
      console.log('ProfileCompletion - Location:', profile?.location);
      console.log('ProfileCompletion - Location type:', typeof profile?.location);
    }

    let requiredFields = [];

    if (isVA) {
      // Check if name is just the email prefix (default value)
      const isDefaultName = profile.name === profile.email?.split('@')[0];

      requiredFields = [
        // Essential fields (high weight)
        { field: 'name', weight: 10, check: () => profile.name?.trim() && !isDefaultName && profile.name.length > 2 },
        { field: 'hero', weight: 10, check: () => {
          // Check if hero exists and has content (more than 10 chars)
          const heroValue = profile.hero || profile.heroStatement;
          const result = heroValue?.trim() && heroValue.length > 10;
          console.log('Hero check - value:', heroValue, 'length:', heroValue?.length, 'passes check:', result);
          return result;
        }},
        { field: 'bio', weight: 15, check: () => profile.bio?.trim() && profile.bio.length >= 100 },
        { field: 'location', weight: 10, check: () => {
          // Check both possible location structures
          if (profile.location) {
            // If location exists as an object or ID
            if (typeof profile.location === 'object' && profile.location !== null) {
              // Check for populated location with city and some province indicator
              const hasCity = profile.location.city?.trim();
              const hasProvince = profile.location.province?.trim() || profile.location.state?.trim();
              return !!(hasCity && hasProvince);
            } else if (typeof profile.location === 'string') {
              // Location exists as an ID reference, consider it complete
              return true;
            }
          }
          // Fallback to direct fields on profile
          return !!(profile.city?.trim() && (profile.state?.trim() || profile.province?.trim()));
        }},
        { field: 'email', weight: 10, check: () => profile.email?.trim() && profile.email.includes('@') },
        { field: 'specialties', weight: 15, check: () => profile.specialties?.length > 0 || profile.specialtyIds?.length > 0 },
        { field: 'roleType', weight: 5, check: () => Object.values(profile.roleType || {}).some(Boolean) },
        { field: 'roleLevel', weight: 5, check: () => Object.values(profile.roleLevel || {}).some(Boolean) },
        
        // Enhanced fields (medium weight)
        { field: 'hourlyRate', weight: 10, check: () => Number(profile.preferredMinHourlyRate) > 0 && Number(profile.preferredMaxHourlyRate) > 0 && Number(profile.preferredMaxHourlyRate) >= Number(profile.preferredMinHourlyRate) },
        { field: 'phone', weight: 5, check: () => profile.phone?.trim() && profile.phone.length >= 10 },
        { field: 'onlinePresence', weight: 5, check: () => profile.website?.trim() || profile.linkedin?.trim() },
        { field: 'discAssessment', weight: 10, check: () => profile.discAssessment?.primaryType }
      ];
    } else if (isBusiness) {
      // Business profile completion fields - matching the Profile page calculation
      const requiredFieldsList = ['contactName', 'company', 'bio', 'industry', 'companySize', 'contactRole', 'email'];
      const professionalFieldsList = ['missionStatement', 'companyCulture', 'workEnvironment', 'headquartersLocation'];
      const socialFieldsList = ['linkedin', 'facebook', 'twitter', 'instagram'];
      const arrayFieldsList = ['specialties', 'benefits', 'companyValues'];
      
      // Calculate total fields (matching Profile page logic)
      const totalFields = requiredFieldsList.length + professionalFieldsList.length + arrayFieldsList.length + 1; // +1 for at least one social
      const fieldWeight = 100 / totalFields;
      
      requiredFields = [
        // Required fields
        ...requiredFieldsList.map(field => ({
          field,
          weight: fieldWeight,
          check: () => profile[field] && profile[field].toString().length > 0
        })),
        
        // Professional fields
        ...professionalFieldsList.map(field => ({
          field,
          weight: fieldWeight,
          check: () => profile[field] && profile[field].length > 0
        })),
        
        // Array fields (at least one item each)
        ...arrayFieldsList.map(field => ({
          field,
          weight: fieldWeight,
          check: () => profile[field] && Array.isArray(profile[field]) && profile[field].length > 0
        })),
        
        // At least one social link
        {
          field: 'socialLinks',
          weight: fieldWeight,
          check: () => socialFieldsList.some(field => profile[field] && profile[field].length > 0)
        }
      ];
    }

    const totalWeight = requiredFields.reduce((sum, field) => sum + field.weight, 0);
    const completedWeight = requiredFields.reduce((sum, field) => {
      const isComplete = field.check();
      if (isVA && !isComplete) {
        console.log(`Field ${field.field} is NOT complete`);
        if (field.field === 'hero') {
          console.log('Hero check failed:', profile.hero);
        }
        if (field.field === 'location') {
          console.log('Location check failed:', profile.location);
        }
      }
      return sum + (isComplete ? field.weight : 0);
    }, 0);

    const percentage = Math.round((completedWeight / totalWeight) * 100);
    const missingFields = requiredFields.filter(field => !field.check());

    return {
      percentage,
      isComplete: percentage >= 100,
      missingFields
    };
  }, [profile, isVA]);

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
      {profileCompletion.missingFields.length > 0 && (
        <div className="mt-3">
          <p className={`text-xs ${
            profileCompletion.percentage >= 80 ? 'text-green-600' :
            profileCompletion.percentage >= 60 ? 'text-yellow-600' :
            'text-blue-600'
          }`}>
            <strong>Still needed:</strong> {
              profileCompletion.missingFields.slice(0, 3).map((field, index) => (
                <span key={field.field}>
                  {field.field === 'name' ? 'Full Name' :
                   field.field === 'hero' ? 'Hero Statement' :
                   field.field === 'bio' ? 'Bio (100+ chars)' :
                   field.field === 'location' ? 'Location' :
                   field.field === 'specialties' ? 'Specialties' :
                   field.field === 'hourlyRate' ? 'Hourly Rate' :
                   field.field === 'roleType' ? 'Role Type' :
                   field.field === 'roleLevel' ? 'Experience Level' :
                   field.field === 'phone' ? 'Phone' :
                   field.field === 'onlinePresence' ? 'Website/LinkedIn' :
                   field.field === 'discAssessment' ? 'DISC Assessment' :
                   field.field
                  }
                  {index < Math.min(profileCompletion.missingFields.length - 1, 2) ? ', ' : ''}
                </span>
              ))
            }
            {profileCompletion.missingFields.length > 3 && (
              <span> and {profileCompletion.missingFields.length - 3} more</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
};

export default ProfileCompletion;