import React from 'react';
import { SignIn, SignUp, UserProfile } from '@clerk/clerk-react';

// Clerk Sign In Page Component
export const ClerkSignIn = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Access the Linkage VA Hub
          </p>
        </div>
        <SignIn 
          path="/sign-in" 
          routing="path"
          signInUrl="/sign-in"
          forceRedirectUrl="/dashboard"
          appearance={{
            elements: {
              formButtonPrimary: 'bg-indigo-600 hover:bg-indigo-700 text-sm normal-case',
            },
          }}
        />
      </div>
    </div>
  );
};

// Clerk Sign Up Page Component
export const ClerkSignUp = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join the Linkage VA Hub community
          </p>
        </div>
        <SignUp 
          path="/sign-up" 
          routing="path"
          signUpUrl="/sign-up"
          forceRedirectUrl="/profile-setup"
          appearance={{
            elements: {
              formButtonPrimary: 'bg-indigo-600 hover:bg-indigo-700 text-sm normal-case',
            },
          }}
        />
        {/* Clerk CAPTCHA container - removes console warning */}
        <div id="clerk-captcha" style={{ display: 'none' }}></div>
      </div>
    </div>
  );
};

// Clerk User Profile Component
export const ClerkUserProfile = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Account Settings
            </h3>
            <UserProfile 
              appearance={{
                elements: {
                  formButtonPrimary: 'bg-indigo-600 hover:bg-indigo-700 text-sm normal-case',
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};