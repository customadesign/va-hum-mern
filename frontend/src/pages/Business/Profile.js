import React, { useState, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useBranding } from '../../contexts/BrandingContext';
import { CameraIcon, InformationCircleIcon } from '@heroicons/react/24/solid';

const validationSchema = Yup.object({
  contactName: Yup.string().required('Contact name is required'),
  company: Yup.string().required('Company name is required'),
  bio: Yup.string().required('Company bio is required').min(50, 'Bio must be at least 50 characters'),
  contactRole: Yup.string().required('Contact role is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  phone: Yup.string(),
  website: Yup.string().url('Must be a valid URL'),
  streetAddress: Yup.string(),
  city: Yup.string(),
  state: Yup.string(),
  postalCode: Yup.string(),
  country: Yup.string(),
});

export default function BusinessProfile() {
  const queryClient = useQueryClient();
  const { branding } = useBranding();
  const avatarInputRef = useRef(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Fetch current business profile
  const { data: profile, isLoading } = useQuery(
    'businessProfile',
    async () => {
      const response = await api.get('/businesses/me');
      return response.data.data;
    }
  );

  // Update profile mutation
  const updateProfileMutation = useMutation(
    async (data) => {
      const response = await api.put('/businesses/me', data);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('businessProfile');
        toast.success('Profile updated successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to update profile');
      },
    }
  );

  const formik = useFormik({
    initialValues: {
      contactName: profile?.contactName || '',
      company: profile?.company || '',
      bio: profile?.bio || '',
      contactRole: profile?.contactRole || '',
      email: profile?.email || '',
      phone: profile?.phone || '',
      website: profile?.website || '',
      streetAddress: profile?.streetAddress || '',
      city: profile?.city || '',
      state: profile?.state || '',
      postalCode: profile?.postalCode || '',
      country: profile?.country || '',
      vaNotifications: profile?.vaNotifications || 'no',
      invisible: profile?.invisible || false,
      surveyRequestNotifications: profile?.surveyRequestNotifications ?? true,
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      await updateProfileMutation.mutateAsync(values);
    },
  });

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload to server
    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await api.post('/businesses/me/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      // Update the profile with new avatar URL
      await api.put('/businesses/me', { avatar: response.data.url });
      queryClient.invalidateQueries('businessProfile');
      toast.success('Company logo updated successfully');
    } catch (error) {
      toast.error('Failed to upload company logo');
      setAvatarPreview(null);
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Business Profile - {branding.name}</title>
      </Helmet>

      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col space-y-6">
          <h1 className="text-3xl font-bold leading-tight text-gray-900 mx-4 lg:mx-0 mt-8 lg:mt-16">
            {branding.isESystemsMode ? 'Company Profile' : 'Business Profile'}
          </h1>

          {/* Profile Completion Progress */}
          <div className="mx-4 lg:mx-0">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <InformationCircleIcon className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Complete Your Profile</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>A complete profile helps VAs understand your company and needs better.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={formik.handleSubmit} className="space-y-8">
            {/* Company Information */}
            <section className="bg-white shadow px-4 py-5 lg:rounded-lg sm:p-6">
              <div className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1">
                  <h2 className="text-lg font-medium leading-6 text-gray-900">Company Information</h2>
                  <p className="mt-2 text-sm text-gray-500">
                    Basic information about your company.
                  </p>
                </div>

                <div className="mt-5 md:mt-0 md:col-span-2">
                  <div className="space-y-6">
                    {/* Company Logo */}
                    <div>
                      <span className="block text-sm font-medium text-gray-700">Company Logo</span>
                      <div className="mt-1 flex items-center">
                        <div className="relative">
                          {profile?.avatar || avatarPreview ? (
                            <img
                              className="h-24 w-24 rounded-lg object-cover"
                              src={avatarPreview || profile?.avatar}
                              alt="Company Logo"
                            />
                          ) : (
                            <div className="h-24 w-24 rounded-lg bg-gray-300 flex items-center justify-center">
                              <span className="text-2xl font-medium text-gray-700">
                                {formik.values.company?.[0]?.toUpperCase() || 'C'}
                              </span>
                            </div>
                          )}
                          {uploadingAvatar && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 rounded-lg">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => avatarInputRef.current?.click()}
                          className="ml-5 bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                        >
                          Change
                        </button>
                        <input
                          ref={avatarInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="hidden"
                        />
                      </div>
                    </div>

                    {/* Company Name */}
                    <div>
                      <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                        Company Name *
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="company"
                          id="company"
                          value={formik.values.company}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          className={`block w-full rounded-md shadow-sm sm:text-sm ${
                            formik.touched.company && formik.errors.company
                              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                              : 'border-gray-300 focus:ring-gray-500 focus:border-gray-500'
                          }`}
                        />
                      </div>
                      {formik.touched.company && formik.errors.company && (
                        <p className="mt-1 text-sm text-red-600">{formik.errors.company}</p>
                      )}
                    </div>

                    {/* Website */}
                    <div>
                      <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                        Company Website
                      </label>
                      <div className="mt-1">
                        <input
                          type="url"
                          name="website"
                          id="website"
                          value={formik.values.website}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          placeholder="https://example.com"
                          className={`block w-full rounded-md shadow-sm sm:text-sm ${
                            formik.touched.website && formik.errors.website
                              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                              : 'border-gray-300 focus:ring-gray-500 focus:border-gray-500'
                          }`}
                        />
                      </div>
                      {formik.touched.website && formik.errors.website && (
                        <p className="mt-1 text-sm text-red-600">{formik.errors.website}</p>
                      )}
                    </div>

                    {/* Company Bio */}
                    <div>
                      <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                        About Your Company *
                      </label>
                      <div className="mt-1">
                        <textarea
                          id="bio"
                          name="bio"
                          rows={4}
                          value={formik.values.bio}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          placeholder="Tell VAs about your company, culture, and what you're looking for..."
                          className={`block w-full rounded-md shadow-sm sm:text-sm ${
                            formik.touched.bio && formik.errors.bio
                              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                              : 'border-gray-300 focus:ring-gray-500 focus:border-gray-500'
                          }`}
                        />
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        {formik.values.bio.length} characters (minimum 50)
                      </p>
                      {formik.touched.bio && formik.errors.bio && (
                        <p className="mt-1 text-sm text-red-600">{formik.errors.bio}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Contact Information */}
            <section className="bg-white shadow mt-8 px-4 py-5 lg:rounded-lg sm:p-6">
              <div className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Contact Information</h3>
                  <p className="mt-1 text-sm text-gray-500">Contact details for VAs to reach you.</p>
                </div>
                <div className="mt-5 md:mt-0 md:col-span-2">
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                      <label htmlFor="contactName" className="block text-sm font-medium text-gray-700">
                        Contact Name *
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="contactName"
                          id="contactName"
                          value={formik.values.contactName}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          className={`block w-full rounded-md shadow-sm sm:text-sm ${
                            formik.touched.contactName && formik.errors.contactName
                              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                              : 'border-gray-300 focus:ring-gray-500 focus:border-gray-500'
                          }`}
                        />
                      </div>
                      {formik.touched.contactName && formik.errors.contactName && (
                        <p className="mt-1 text-sm text-red-600">{formik.errors.contactName}</p>
                      )}
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="contactRole" className="block text-sm font-medium text-gray-700">
                        Role/Title *
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="contactRole"
                          id="contactRole"
                          value={formik.values.contactRole}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          placeholder="e.g., CEO, HR Manager"
                          className={`block w-full rounded-md shadow-sm sm:text-sm ${
                            formik.touched.contactRole && formik.errors.contactRole
                              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                              : 'border-gray-300 focus:ring-gray-500 focus:border-gray-500'
                          }`}
                        />
                      </div>
                      {formik.touched.contactRole && formik.errors.contactRole && (
                        <p className="mt-1 text-sm text-red-600">{formik.errors.contactRole}</p>
                      )}
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email Address *
                      </label>
                      <div className="mt-1">
                        <input
                          type="email"
                          name="email"
                          id="email"
                          value={formik.values.email}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          className={`block w-full rounded-md shadow-sm sm:text-sm ${
                            formik.touched.email && formik.errors.email
                              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                              : 'border-gray-300 focus:ring-gray-500 focus:border-gray-500'
                          }`}
                        />
                      </div>
                      {formik.touched.email && formik.errors.email && (
                        <p className="mt-1 text-sm text-red-600">{formik.errors.email}</p>
                      )}
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                        Phone Number
                      </label>
                      <div className="mt-1">
                        <input
                          type="tel"
                          name="phone"
                          id="phone"
                          value={formik.values.phone}
                          onChange={formik.handleChange}
                          placeholder="+1 (555) 123-4567"
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Company Location */}
            <section className="bg-white shadow mt-8 px-4 py-5 lg:rounded-lg sm:p-6">
              <div className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Company Location</h3>
                  <p className="mt-1 text-sm text-gray-500">Where your company is based.</p>
                </div>
                <div className="mt-5 md:mt-0 md:col-span-2">
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-6">
                      <label htmlFor="streetAddress" className="block text-sm font-medium text-gray-700">
                        Street Address
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="streetAddress"
                          id="streetAddress"
                          value={formik.values.streetAddress}
                          onChange={formik.handleChange}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                        City
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="city"
                          id="city"
                          value={formik.values.city}
                          onChange={formik.handleChange}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                        State / Province
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="state"
                          id="state"
                          value={formik.values.state}
                          onChange={formik.handleChange}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
                        ZIP / Postal Code
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="postalCode"
                          id="postalCode"
                          value={formik.values.postalCode}
                          onChange={formik.handleChange}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                        Country
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="country"
                          id="country"
                          value={formik.values.country}
                          onChange={formik.handleChange}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Preferences */}
            <section className="bg-white shadow mt-8 px-4 py-5 lg:rounded-lg sm:p-6">
              <div className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Preferences</h3>
                  <p className="mt-1 text-sm text-gray-500">Manage your notification and visibility settings.</p>
                </div>
                <div className="mt-5 md:mt-0 md:col-span-2">
                  <div className="space-y-6">
                    {/* VA Notifications */}
                    <div>
                      <label htmlFor="vaNotifications" className="block text-sm font-medium text-gray-700">
                        New VA Notifications
                      </label>
                      <p className="text-sm text-gray-500">Get notified when new VAs join the platform</p>
                      <div className="mt-2">
                        <select
                          id="vaNotifications"
                          name="vaNotifications"
                          value={formik.values.vaNotifications}
                          onChange={formik.handleChange}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                        >
                          <option value="no">No notifications</option>
                          <option value="daily">Daily digest</option>
                          <option value="weekly">Weekly digest</option>
                        </select>
                      </div>
                    </div>

                    {/* Visibility */}
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="invisible"
                          name="invisible"
                          type="checkbox"
                          checked={formik.values.invisible}
                          onChange={formik.handleChange}
                          className="focus:ring-gray-500 h-4 w-4 text-gray-600 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="invisible" className="font-medium text-gray-700">
                          Make my profile invisible
                        </label>
                        <p className="text-gray-500">Hide your profile from VAs</p>
                      </div>
                    </div>

                    {/* Survey Notifications */}
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="surveyRequestNotifications"
                          name="surveyRequestNotifications"
                          type="checkbox"
                          checked={formik.values.surveyRequestNotifications}
                          onChange={formik.handleChange}
                          className="focus:ring-gray-500 h-4 w-4 text-gray-600 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="surveyRequestNotifications" className="font-medium text-gray-700">
                          Survey notifications
                        </label>
                        <p className="text-gray-500">Receive occasional surveys to help improve the platform</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 mx-4 lg:mx-0 pb-8">
              <button
                type="button"
                onClick={() => formik.resetForm()}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formik.isSubmitting || updateProfileMutation.isLoading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {formik.isSubmitting || updateProfileMutation.isLoading ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}