import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useBranding } from '../contexts/BrandingContext';
import { useAuth } from '../contexts/AuthContext';

export default function EmailVerification() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { branding } = useBranding();
  const { login } = useAuth();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    verifyEmail();
  }, [token]);

  const verifyEmail = async () => {
    try {
      const response = await api.post(`/auth/verify-email/${token}`);
      
      if (response.data.success) {
        setVerified(true);
        toast.success('Email verified successfully!');
        
        // Auto-login if tokens are provided
        if (response.data.token && response.data.user) {
          login(response.data.token, response.data.user, response.data.refreshToken);
          
          // Redirect to profile setup or dashboard after a short delay
          setTimeout(() => {
            if (!response.data.user.va && !response.data.user.business) {
              navigate('/profile-setup');
            } else {
              navigate('/dashboard');
            }
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Email verification error:', error);
      setError(error.response?.data?.error || 'Failed to verify email. The link may have expired.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Email Verification - {branding.name}</title>
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <img
              className="mx-auto h-24 w-auto object-contain"
              src={branding.logoUrl || branding.logo}
              alt={branding.name}
            />
            
            {verifying && (
              <>
                <div className="mt-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                </div>
                <h2 className="mt-6 text-2xl font-bold text-gray-900">
                  Verifying your email...
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  Please wait while we verify your email address.
                </p>
              </>
            )}

            {!verifying && verified && (
              <>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mt-8">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
                <h2 className="mt-6 text-2xl font-bold text-gray-900">
                  Email Verified Successfully!
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  Your email has been verified. Redirecting you to your dashboard...
                </p>
                <div className="mt-6">
                  <Link
                    to="/dashboard"
                    className="text-gray-600 hover:text-gray-500 font-medium"
                  >
                    Go to Dashboard
                  </Link>
                </div>
              </>
            )}

            {!verifying && error && (
              <>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mt-8">
                  <XCircleIcon className="h-6 w-6 text-red-600" />
                </div>
                <h2 className="mt-6 text-2xl font-bold text-gray-900">
                  Verification Failed
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  {error}
                </p>
                <div className="mt-6 space-y-3">
                  <div>
                    <Link
                      to="/sign-in"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      Sign In
                    </Link>
                  </div>
                  <div>
                    <Link
                      to="/sign-up"
                      className="text-gray-600 hover:text-gray-500 font-medium text-sm"
                    >
                      Create a new account
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}