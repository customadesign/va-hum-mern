import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import authService from '../services/auth';
import { toast } from 'react-toastify';

const validationSchema = Yup.object({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
});

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const formik = useFormik({
    initialValues: {
      email: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        await authService.forgotPassword(values.email);
        setSubmitted(true);
        toast.success('Password reset instructions sent to your email');
      } catch (error) {
        toast.error(error.response?.data?.error || 'Failed to send reset email');
      } finally {
        setLoading(false);
      }
    },
  });

  if (submitted) {
    return (
      <>
        <Helmet>
          <title>Check Your Email - Linkage VA Hub</title>
        </Helmet>

        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <img
                className="mx-auto h-24 w-auto object-contain"
                src="https://storage.googleapis.com/msgsndr/H12yHzS5PDSz1dtmxbxH/media/6887516ca12d9403f02837dd.png"
                alt="Linkage VA Hub"
              />
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Check your email
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                We've sent password reset instructions to {formik.values.email}
              </p>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-sm text-green-800">
                Please check your email and click the reset link to set a new password. 
                The link will expire in 1 hour.
              </p>
            </div>

            <div className="text-center">
              <Link
                to="/login"
                className="font-medium text-gray-600 hover:text-gray-500"
              >
                Back to sign in
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Forgot Password - Linkage VA Hub</title>
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <img
              className="mx-auto h-24 w-auto object-contain"
              src="https://storage.googleapis.com/msgsndr/H12yHzS5PDSz1dtmxbxH/media/6887516ca12d9403f02837dd.png"
              alt="Linkage VA Hub"
            />
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Forgot your password?
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Enter your email address and we'll send you instructions to reset your password.
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={formik.handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                  formik.touched.email && formik.errors.email
                    ? 'border-red-300'
                    : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500 focus:z-10 sm:text-sm`}
                placeholder="Enter your email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {formik.touched.email && formik.errors.email && (
                <p className="mt-1 text-sm text-red-600">{formik.errors.email}</p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send reset instructions'}
              </button>
            </div>

            <div className="text-center">
              <Link
                to="/login"
                className="font-medium text-gray-600 hover:text-gray-500"
              >
                Back to sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}