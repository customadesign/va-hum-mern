import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export default function LinkedInCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get parameters from URL
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

        // Verify state to prevent CSRF attacks
        const storedState = sessionStorage.getItem('linkedin_oauth_state');
        if (state !== storedState) {
          throw new Error('Invalid state parameter');
        }

        // Clear stored state
        sessionStorage.removeItem('linkedin_oauth_state');

        console.log('Processing LinkedIn OAuth callback...');
        
        // Send authorization code to backend for token exchange
        const response = await api.post('/auth/linkedin/callback', {
          code,
          redirectUri: `${window.location.origin}/auth/linkedin/callback`
        });

        if (response.data.success) {
          // Store tokens and user data
          localStorage.setItem('token', response.data.token);
          if (response.data.refreshToken) {
            localStorage.setItem('refreshToken', response.data.refreshToken);
          }

          toast.success('Successfully authenticated with LinkedIn!');
          
          const user = response.data.user;
          
          // Redirect based on user profile completeness
          if (!user.va && !user.business && !user.admin) {
            navigate('/profile-setup');
          } else if (user.admin) {
            navigate('/admin');
          } else {
            navigate('/dashboard');
          }
        } else {
          throw new Error('Failed to authenticate with LinkedIn');
        }
        
      } catch (error) {
        console.error('LinkedIn callback error:', error);
        toast.error(error.message || 'Failed to authenticate with LinkedIn');
        
        // Redirect to login after error
        setTimeout(() => {
          navigate('/sign-in');
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, login]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-700">Completing LinkedIn authentication...</p>
      </div>
    </div>
  );
}