import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../contexts/HybridAuthContext';
import { useBranding } from '../contexts/BrandingContext';
import api from '../services/api';
import { toast } from 'react-toastify';

export default function ProfileSetup() {
  const [profileType, setProfileType] = useState('');
  const navigate = useNavigate();
  const { updateUser, clerkUser, user } = useAuth();
  const { branding, setBrandingTheme } = useBranding();

  // Note: Do not auto-create any profile to avoid wrong selection

  const handleProfileTypeSelect = async (type) => {
    setProfileType(type);
    
    // Set theme based on user choice
    setBrandingTheme(type === 'business');
    
    try {
      // Persist the user's choice (role) in backend so we don't ask again
      await api.post('/clerk/complete-profile', {
        role: type
      });
      
      if (type === 'va') {
        const fullName = (clerkUser?.firstName || clerkUser?.lastName)
          ? `${clerkUser?.firstName || ''} ${clerkUser?.lastName || ''}`.trim()
          : (user?.name || (user?.email ? user.email.split('@')[0] : 'New Professional'));
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
          const userResponse = await api.get('/clerk/me');
          updateUser(userResponse.data.user);
        } catch (e) {
          // non-blocking
        }
      } else if (type === 'business') {
        const contactName = (clerkUser?.firstName || clerkUser?.lastName)
          ? `${clerkUser?.firstName || ''} ${clerkUser?.lastName || ''}`.trim()
          : (user?.name || (user?.email ? user.email.split('@')[0] : 'Primary Contact'));
        // Create Business profile
        const response = await api.post('/businesses', {
          contactName,
          company: 'Your Company',
          bio: 'Tell us about your business...'
        });
        
        // Navigate immediately; refresh user context in background
        toast.success('Business profile created! Please complete your profile.');
        navigate('/business/profile', { replace: true });
        try {
          const userResponse = await api.get('/clerk/me');
          updateUser(userResponse.data.user);
        } catch (e) {
          // non-blocking
        }
      }
    } catch (error) {
      console.error('Profile setup error:', error?.response?.data || error.message);
      toast.error(error?.response?.data?.error || 'Failed to create profile. Please try again.');
    }
  };

  return (
    <>
      <Helmet>
        <title>{branding.isESystemsMode ? 'Complete Your Employer Profile' : 'Choose Your Profile Type'} - {branding.name}</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {branding.isESystemsMode ? 'Welcome to E-Systems Management' : 'Welcome! Let\'s get started'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {branding.isESystemsMode ? 'Let\'s set up your employer profile' : `Choose how you want to use ${branding.name}`}
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="space-y-4">
              {!branding.isESystemsMode && (
                <button
                  onClick={() => handleProfileTypeSelect('va')}
                  className="relative block w-full bg-white border-2 border-gray-300 rounded-lg p-6 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  <div className="flex items-center">
                    <div className="flex-1 text-left">
                      <h3 className="text-lg font-medium text-gray-900">
                        I'm a Professional
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Create a profile to showcase your skills and connect with employers
                      </p>
                    </div>
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </button>
              )}

              <button
                onClick={() => handleProfileTypeSelect('business')}
                className="relative block w-full bg-white border-2 border-gray-300 rounded-lg p-6 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                <div className="flex items-center">
                  <div className="flex-1 text-left">
                    <h3 className="text-lg font-medium text-gray-900">
                      {branding.isESystemsMode ? 'Complete Employer Profile' : 'I\'m hiring a Virtual Assistant'}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {branding.isESystemsMode ? 'Set up your profile to start hiring talented professionals' : 'Browse talented VAs and find the perfect match for your business'}
                    </p>
                  </div>
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </button>
            </div>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Need help deciding?</span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <a href="#" className="text-sm text-gray-600 hover:text-gray-500">
                  Learn more about profile types
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}