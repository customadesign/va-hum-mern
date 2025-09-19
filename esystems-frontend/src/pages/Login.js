import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../contexts/AuthContext';
import { useBranding } from '../contexts/BrandingContext';
import LinkedInLoginButton from '../components/LinkedInLoginButton';
import { toast } from 'react-toastify';

const validationSchema = Yup.object({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  twoFactorCode: Yup.string()
    .when('showTwoFactor', {
      is: true,
      then: Yup.string()
        .matches(/^[0-9]{6}$/, 'Must be 6 digits')
        .required('2FA code is required')
    }),
});

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [tempAuthData, setTempAuthData] = useState(null);
  const { login, linkedinLogin } = useAuth();
  const { branding, loading: brandingLoading } = useBranding();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Check for impersonation on component mount
  useEffect(() => {
    const handleImpersonation = async () => {
      if (searchParams.get('impersonate') === 'true') {
        // Check for impersonation token in sessionStorage
        const impersonationToken = sessionStorage.getItem('impersonationToken');
        const impersonationData = sessionStorage.getItem('impersonationData');
        
        if (impersonationToken && impersonationData) {
          try {
            // Store the token in localStorage for auth context
            localStorage.setItem('token', impersonationToken);
            localStorage.setItem('user', impersonationData);
            
            // Clear the session storage
            sessionStorage.removeItem('impersonationToken');
            sessionStorage.removeItem('impersonationData');
            
            // Parse the user data
            const userData = JSON.parse(impersonationData);
            
            // Show success message
            toast.success(`Successfully impersonating user: ${userData.email}`);
            
            // Force a page reload to trigger auth context update
            window.location.href = '/dashboard';
          } catch (error) {
            console.error('Failed to process impersonation:', error);
            toast.error('Failed to impersonate user');
          }
        }
      }
    };

    handleImpersonation();
  }, [searchParams, navigate]);

  // ALL HOOKS MUST BE CALLED FIRST - Form handling
  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
      twoFactorCode: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      console.log('🚀 Form submitted with values:', values);
      setLoading(true);
      try {
        console.log('📞 Calling login function...');
        if (showTwoFactor && values.twoFactorCode) {
          // Login with 2FA code
          await login(values.email, values.password, values.twoFactorCode);
        } else {
          // Regular login - might require 2FA
          const response = await login(values.email, values.password);
          // If login response indicates 2FA is required, show 2FA form
          if (response && response.requiresTwoFactor) {
            setShowTwoFactor(true);
            setTempAuthData(response);
            toast.info('Please enter your 2FA code from Google Authenticator');
            setLoading(false);
            return;
          }
        }
        console.log('✅ Login function completed successfully');
      } catch (error) {
        console.log('❌ Login function threw error:', error);
        // Reset 2FA form on error
        if (error.message && error.message.includes('2FA')) {
          setShowTwoFactor(false);
          setTempAuthData(null);
          formik.setFieldValue('twoFactorCode', '');
        }
        // Error is handled in AuthContext
      } finally {
        setLoading(false);
        console.log('🏁 Login form processing complete');
      }
    },
  });

  // CONDITIONAL RETURNS AFTER ALL HOOKS - Show loading spinner while branding context is loading
  if (brandingLoading || !branding) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Sign In - {branding.name}</title>
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <img
              className="mx-auto h-24 w-auto object-contain"
              src={branding.logoUrl}
              alt={branding.name}
            />
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Sign in to your account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Or{' '}
              <Link
                to="/register"
                className="font-medium text-gray-600 hover:text-gray-500"
              >
                create a new account
              </Link>
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={formik.handleSubmit}>
            <input type="hidden" name="remember" defaultValue="true" />
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                    formik.touched.email && formik.errors.email
                      ? 'border-red-300'
                      : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-gray-500 focus:border-gray-500 focus:z-10 sm:text-sm`}
                  placeholder="Email address"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.email && formik.errors.email && (
                  <p className="mt-1 text-sm text-red-600">{formik.errors.email}</p>
                )}
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                    formik.touched.password && formik.errors.password
                      ? 'border-red-300'
                      : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-gray-500 focus:border-gray-500 focus:z-10 sm:text-sm`}
                  placeholder="Password"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.password && formik.errors.password && (
                  <p className="mt-1 text-sm text-red-600">{formik.errors.password}</p>
                )}
              </div>
              
              {/* 2FA Code Input - Show only when 2FA is required */}
              {showTwoFactor && (
                <div className="mt-4">
                  <label htmlFor="twoFactorCode" className="sr-only">
                    Two-Factor Authentication Code
                  </label>
                  <input
                    id="twoFactorCode"
                    name="twoFactorCode"
                    type="text"
                    maxLength="6"
                    placeholder="Enter 6-digit code from your authenticator app"
                    className={`appearance-none rounded-md relative block w-full px-3 py-2 border ${
                      formik.touched.twoFactorCode && formik.errors.twoFactorCode
                        ? 'border-red-300'
                        : 'border-gray-300'
                    } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 focus:z-10 sm:text-sm text-center text-lg tracking-widest`}
                    value={formik.values.twoFactorCode}
                    onChange={(e) => {
                      // Only allow numbers
                      const value = e.target.value.replace(/\D/g, '');
                      formik.setFieldValue('twoFactorCode', value);
                    }}
                    onBlur={formik.handleBlur}
                    autoFocus
                  />
                  {formik.touched.twoFactorCode && formik.errors.twoFactorCode && (
                    <p className="mt-1 text-sm text-red-600">{formik.errors.twoFactorCode}</p>
                  )}
                  <div className="mt-2 text-sm text-gray-600 text-center">
                    <p>Enter the 6-digit code from your Google Authenticator app</p>
                    <button
                      type="button"
                      onClick={() => {
                        setShowTwoFactor(false);
                        setTempAuthData(null);
                        formik.setFieldValue('twoFactorCode', '');
                      }}
                      className="mt-1 text-gray-500 hover:text-gray-700 underline"
                    >
                      Use different account
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="font-medium text-gray-600 hover:text-gray-500"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading 
                  ? (showTwoFactor ? 'Verifying 2FA...' : 'Signing in...') 
                  : (showTwoFactor ? 'Verify & Sign in' : 'Sign in')
                }
              </button>
            </div>

            {/* LinkedIn Login Section */}
            <>
              {/* Divider */}
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-gray-50 text-gray-500">
                      {branding.isESystemsMode ? 'For Employers' : 'Or continue with'}
                    </span>
                  </div>
                </div>
              </div>

              {/* LinkedIn OAuth Button */}
              <div className="mt-6">
                <button
                  type="button"
                  onClick={linkedinLogin}
                  disabled={loading}
                  className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  {branding.isESystemsMode ? 'Sign in with LinkedIn & Auto-fill Profile' : 'Sign in with LinkedIn'}
                </button>
                <p className="mt-2 text-xs text-center text-gray-500">
                  {branding.isESystemsMode 
                    ? 'Automatically fill your company profile from LinkedIn'
                    : 'Automatically create your profile from LinkedIn'
                  }
                </p>
              </div>
            </>
          </form>
        </div>
      </div>
    </>
  );
}