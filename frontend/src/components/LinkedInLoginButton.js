import React from 'react';
import { useBranding } from '../contexts/BrandingContext';

export default function LinkedInLoginButton({ 
  onLinkedInData, 
  text = "Continue with LinkedIn",
  className = "",
  disabled = false 
}) {
  const { branding } = useBranding();

  // Only show on E Systems mode
  if (!branding.isESystemsMode) {
    return null;
  }

  const handleLinkedInLogin = async () => {
    if (disabled) return;
    
    try {
      // Redirect to backend LinkedIn OAuth endpoint
      const clientId = process.env.REACT_APP_LINKEDIN_CLIENT_ID;
      if (!clientId) {
        throw new Error('LinkedIn client ID not configured');
      }

      const redirectUri = encodeURIComponent(`${window.location.origin}/auth/linkedin/callback`);
      const state = Math.random().toString(36).substring(2, 15);
      
      // Store state in sessionStorage for verification
      sessionStorage.setItem('linkedin_oauth_state', state);
      
      const linkedinAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=r_liteprofile%20r_emailaddress`;
      
      window.location.href = linkedinAuthUrl;
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