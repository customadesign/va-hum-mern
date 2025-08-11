import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useUser } from '@clerk/clerk-react';
import api from '../services/api';

export default function LinkedInCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user: clerkUser, isLoaded } = useUser();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Wait for Clerk user to be loaded
        if (!isLoaded) return;
        
        // Clerk handles the OAuth callback automatically
        console.log('LinkedIn OAuth callback via Clerk completed');
        
        // Check if there are any error parameters
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (error) {
          throw new Error(errorDescription || error);
        }

        // If we have a Clerk user, sync with backend
        if (clerkUser) {
          try {
            console.log('Syncing Clerk user with backend...');
            const response = await api.post('/clerk/sync-user', {
              clerkUserId: clerkUser.id
            });
            
            if (response.data.success) {
              console.log('User synced successfully:', response.data.user);
              toast.success('Successfully authenticated with LinkedIn!');
              
              // Redirect to home after successful auth
              navigate('/');
            } else {
              throw new Error('Failed to sync user data');
            }
          } catch (syncError) {
            console.error('Error syncing user:', syncError);
            toast.error('Authentication successful but profile sync failed. Please contact support.');
            navigate('/login');
          }
        } else {
          // No Clerk user, redirect to login
          toast.error('LinkedIn authentication failed. Please try again.');
          navigate('/login');
        }
        
      } catch (error) {
        console.error('LinkedIn callback error:', error);
        toast.error(error.message || 'Failed to authenticate with LinkedIn');
        
        // Redirect to login after error
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, clerkUser, isLoaded]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing LinkedIn authentication...</p>
      </div>
    </div>
  );
}