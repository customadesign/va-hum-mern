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
            <img
              className="mx-auto h-24 w-auto object-contain"
              src={branding.logoUrl}
              alt={branding.name}
            />
            <div className="mt-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900">
                Check your email
              </h2>
              <p className="mt-2 text-sm text-gray-700">
                We've sent you a verification link at your email address.
                Please click the link to verify your account and continue.
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
              <p className="text-sm text-gray-700">
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
                className="text-sm text-gray-700 hover:text-gray-700"
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