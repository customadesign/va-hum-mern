import React from 'react';
import { useBranding } from '../contexts/BrandingContext';
import linkedinAuth from '../services/linkedinAuth';

export default function LinkedInLoginButton({ 
  onLinkedInData, 
  text = "Continue with LinkedIn",
  className = "",
  disabled = false 
}) {
  const { branding } = useBranding();

  // Only show on E Systems and when LinkedIn is available
  if (!branding.isESystemsMode || !linkedinAuth.isAvailable()) {
    return null;
  }

  const handleLinkedInLogin = () => {
    if (disabled) return;
    
    try {
      linkedinAuth.login();
    } catch (error) {
      console.error('LinkedIn login error:', error);
      alert('LinkedIn login is currently unavailable. Please try again later.');
    }
  };

  return (
    <button
      type="button"
      onClick={handleLinkedInLogin}
      disabled={disabled}
      className={`
        w-full flex justify-center items-center px-4 py-3 border border-gray-300 rounded-md shadow-sm 
        text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 
        focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors duration-200
        ${className}
      `}
    >
      <svg 
        className="w-5 h-5 mr-3" 
        viewBox="0 0 24 24" 
        fill="#0077B5"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
      {text}
    </button>
  );
}

// LinkedIn callback handler component
export function LinkedInCallback() {
  const { branding } = useBranding();
  
  React.useEffect(() => {
    const handleCallback = async () => {
      // Only process on E Systems
      if (!branding.isESystemsMode) {
        window.location.href = '/login';
        return;
      }

      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');

      if (error) {
        console.error('LinkedIn OAuth error:', error);
        alert('LinkedIn authentication failed. Please try again.');
        window.location.href = '/login';
        return;
      }

      if (code && state) {
        try {
          const result = await linkedinAuth.handleCallback(code, state);
          
          // Store LinkedIn data in session for auto-fill
          sessionStorage.setItem('linkedinProfile', JSON.stringify(result.linkedinData));
          
          // Store auth token
          localStorage.setItem('token', result.token);
          
          // Redirect to profile setup with LinkedIn data
          window.location.href = '/business/profile?linkedin=true';
        } catch (error) {
          console.error('LinkedIn callback error:', error);
          alert('Failed to complete LinkedIn authentication. Please try again.');
          window.location.href = '/login';
        }
      } else {
        window.location.href = '/login';
      }
    };

    handleCallback();
  }, [branding.isESystemsMode]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">
            Completing LinkedIn Authentication...
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Please wait while we set up your account.
          </p>
        </div>
      </div>
    </div>
  );
}