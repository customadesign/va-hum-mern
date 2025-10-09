import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useBranding } from '../contexts/BrandingContext';
import { useAuth } from '../contexts/AuthContext';

export default function VerifyEmailSent() {
  const { branding } = useBranding();
  const { resendVerificationEmail } = useAuth();

  const handleResendEmail = async () => {
    try {
      await resendVerificationEmail();
    } catch (error) {
      // Error is handled in the context
    }
  };

  return (
    <>
      <Helmet>
        <title>Check Your Email - {branding.name}</title>
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="text-center">
              <img
                className="mx-auto h-24 w-auto object-contain mb-6"
                src="https://storage.googleapis.com/msgsndr/H12yHzS5PDSz1dtmxbxH/media/67d446905106d57ab03054ed.png"
                alt={branding.name}
              />
            </div>
            <div className="mt-6 text-center">
              <h2 className="text-3xl font-extrabold text-gray-900">
                Check your email
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                We've sent you a verification link at your email address.
                Please click link to verify your account and continue.
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="text-sm">
                <h3 className="font-medium text-blue-800 mb-2">What's next?</h3>
                <ul className="text-blue-700 space-y-1">
                  <li>1. Check your email inbox (and spam folder)</li>
                  <li>2. Click the verification link in the email</li>
                  <li>3. Complete your profile setup</li>
                </ul>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Didn't receive the email?{' '}
                <button
                  onClick={handleResendEmail}
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Resend verification email
                </button>
              </p>
            </div>

            <div className="text-center">
              <Link
                to="/sign-in"
                className="text-sm text-gray-600 hover:text-gray-500"
              >
                Back to sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}