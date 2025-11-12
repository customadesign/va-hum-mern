import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../contexts/AuthContext';
import { useBranding } from '../contexts/BrandingContext';
import api from '../services/api';
import { toast } from 'react-toastify';

export default function ProfileSetup() {
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();
  const { updateUser, user, checkAuth } = useAuth();
  const { branding, setBrandingTheme } = useBranding();

  // Check email verification before allowing profile setup
  React.useEffect(() => {
    if (user && !user.isVerified) {
      toast.error('Please verify your email before setting up your profile.');
      navigate('/verify-email-sent');
    }
  }, [user, navigate]);

  // Auto-create VA profile since this is VA Hub only
  const handleCreateVAProfile = async () => {
    setIsCreating(true);
    console.log('Creating VA profile and redirecting to /va/profile');

    // Set user type for branding context
    setBrandingTheme('va');
    
    try {
      // Persist the user's choice (role) in backend so we don't ask again
      await api.post('/auth/complete-profile', {
        role: 'va'
      });
      
      const fullName = user?.name || (user?.email ? user.email.split('@')[0] : 'New Professional');
      // Create VA profile
      const response = await api.post('/vas', {
        name: fullName,
        bio: 'Tell us about yourself...',
        searchStatus: 'open'
      });
      
      // Navigate immediately; refresh user context in background
      toast.success('VA profile created! Please complete your profile.');
      navigate('/va/profile', { replace: true });
      try {
        await checkAuth(); // Refresh user context
      } catch (e) {
        // non-blocking
      }
    } catch (error) {
      console.error('Profile setup error:', error?.response?.data || error.message);
      toast.error(error?.response?.data?.error || 'Failed to create profile. Please try again.');
      setIsCreating(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Complete Your VA Profile - {branding.name}</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome to Linkage VA Hub!
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Let's create your Virtual Assistant profile
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="space-y-4">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  Create Your Professional Profile
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Showcase your skills and connect with employers looking for talented Virtual Assistants
                </p>
              </div>

              <button
                onClick={handleCreateVAProfile}
                disabled={isCreating}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Profile...
                  </>
                ) : (
                  'Create My VA Profile'
                )}
              </button>
            </div>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Looking to hire VAs?</span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Visit <a href="#" className="font-medium text-blue-600 hover:text-blue-500">E-Systems Management</a> to post jobs and hire talented professionals.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}