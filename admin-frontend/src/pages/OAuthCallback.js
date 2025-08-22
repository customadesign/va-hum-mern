import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithOAuth } = useAuth();
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const provider = searchParams.get('provider') || 'linkedin'; // Default to LinkedIn
        const errorParam = searchParams.get('error');

        if (errorParam) {
          setError(`OAuth error: ${errorParam}`);
          setIsProcessing(false);
          return;
        }

        if (!code) {
          setError('No authorization code received');
          setIsProcessing(false);
          return;
        }

        const result = await loginWithOAuth(provider, code, state);
        
        if (result.success) {
          navigate('/dashboard', { replace: true });
        } else {
          setError(result.error || 'OAuth login failed');
        }
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError('An unexpected error occurred during authentication');
      } finally {
        setIsProcessing(false);
      }
    };

    handleOAuthCallback();
  }, [searchParams, loginWithOAuth, navigate]);

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-admin-50">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-admin-600">Processing authentication...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-admin-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-danger-100">
              <svg className="h-6 w-6 text-danger-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-admin-900">Authentication Failed</h3>
            <p className="mt-1 text-sm text-admin-500">{error}</p>
            <div className="mt-6">
              <button
                onClick={() => navigate('/login')}
                className="admin-button-primary"
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default OAuthCallback;
