import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import linkedinAuthService from '../services/linkedinAuth';
import { useAuth } from '../contexts/AuthContext';

export default function LinkedInCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (error) {
          throw new Error(errorDescription || error);
        }

        if (!code) {
          throw new Error('No authorization code received');
        }

        // Exchange code for access token and user data
        const response = await linkedinAuthService.handleCallback(code, state);

        if (response.success && response.token) {
          // Store token
          localStorage.setItem('token', response.token);
          
          // Update auth context
          await updateUser(response.user);
          
          // Redirect based on user role
          if (response.user.role === 'business') {
            navigate('/business/profile');
            toast.success('Successfully logged in with LinkedIn!');
          } else if (response.user.role === 'va') {
            navigate('/profile');
            toast.success('Successfully logged in with LinkedIn!');
          } else {
            navigate('/dashboard');
          }
        } else {
          throw new Error('Failed to authenticate with LinkedIn');
        }
      } catch (error) {
        console.error('LinkedIn callback error:', error);
        setError(error.message);
        toast.error(error.message || 'Failed to authenticate with LinkedIn');
        
        // Redirect to login after error
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
  }, [searchParams, navigate, updateUser]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Completing LinkedIn authentication...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-medium text-gray-900 mb-2">Authentication Failed</h2>
          <p className="text-gray-600">{error}</p>
          <p className="text-sm text-gray-500 mt-2">Redirecting to login page...</p>
        </div>
      </div>
    );
  }

  return null;
}