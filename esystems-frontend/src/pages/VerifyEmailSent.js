import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useBranding } from '../contexts/BrandingContext';
import { useAuth } from '../contexts/AuthContext';

export default function VerifyEmailSent() {
  const { branding } = useBranding();
  const { resendVerificationEmail } = useAuth();
  const [resendEmail, setResendEmail] = useState('');
  const [sendingResend, setSendingResend] = useState(false);

  const handleResendEmail = async () => {
    if (!resendEmail || !resendEmail.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }
    
    setSendingResend(true);
    try {
      await resendVerificationEmail(resendEmail);
      alert('Verification email sent! Please check your inbox.');
    } catch (error) {
      // Error is handled in the context
    } finally {
      setSendingResend(false);
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
              <p className="text-sm text-gray-700 mb-2">
                Didn't receive the email?
              </p>
              <div className="flex gap-2 max-w-sm mx-auto">
                <input
                  type="email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                />
                <button
                  onClick={handleResendEmail}
                  disabled={sendingResend}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {sendingResend ? 'Sending...' : 'Resend'}
                </button>
              </div>
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