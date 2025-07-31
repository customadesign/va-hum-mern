import React, { useState, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { CameraIcon } from '@heroicons/react/24/solid';
import { PhotoIcon } from '@heroicons/react/24/outline';

const validationSchema = Yup.object({
  name: Yup.string().required('Name is required'),
  hero: Yup.string().required('Hero statement is required'),
  bio: Yup.string().required('Bio is required'),
  website: Yup.string().url('Must be a valid URL'),
  github: Yup.string().url('Must be a valid URL'),
  linkedin: Yup.string().url('Must be a valid URL'),
  twitter: Yup.string().url('Must be a valid URL'),
});

export default function VAProfile() {
  const queryClient = useQueryClient();
  const coverInputRef = useRef(null);
  const avatarInputRef = useRef(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Fetch current VA profile
  const { data: profile, isLoading } = useQuery(
    'vaProfile',
    async () => {
      const response = await api.get('/vas/me');
      return response.data.data;
    }
  );

  // Update profile mutation
  const updateProfileMutation = useMutation(
    async (data) => {
      const response = await api.put('/vas/me', data);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('vaProfile');
        toast.success('Profile updated successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to update profile');
      },
    }
  );

  const formik = useFormik({
    initialValues: {
      name: profile?.name || '',
      hero: profile?.hero || '',
      bio: profile?.bio || '',
      website: profile?.website || '',
      github: profile?.github || '',
      linkedin: profile?.linkedin || '',
      twitter: profile?.twitter || '',
      schedulingLink: profile?.schedulingLink || '',
      preferredMinHourlyRate: profile?.preferredMinHourlyRate || '',
      preferredMaxHourlyRate: profile?.preferredMaxHourlyRate || '',
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: (values) => {
      updateProfileMutation.mutate(values);
    },
  });

  const handleCoverChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload to server
    setUploadingCover(true);
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', 'cover');

    try {
      const response = await api.post('/vas/me/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      // Update the profile with new cover image URL
      await api.put('/vas/me', { coverImage: response.data.url });
      queryClient.invalidateQueries('vaProfile');
      toast.success('Cover image updated successfully');
    } catch (error) {
      toast.error('Failed to upload cover image');
      setCoverPreview(null);
    } finally {
      setUploadingCover(false);
    }
  };

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
    formData.append('type', 'avatar');

    try {
      const response = await api.post('/vas/me/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      // Update the profile with new avatar URL
      await api.put('/vas/me', { avatar: response.data.url });
      queryClient.invalidateQueries('vaProfile');
      toast.success('Profile picture updated successfully');
    } catch (error) {
      toast.error('Failed to upload profile picture');
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
        <title>Edit Profile - Linkage VA Hub</title>
      </Helmet>

      <div className="bg-white">
        {/* Cover Image Section */}
        <div className="relative h-48 sm:h-64 lg:h-80">
          <img
            className="w-full h-full object-cover"
            src={coverPreview || profile?.coverImage || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=300&fit=crop'}
            alt="Cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-25"></div>
          
          {/* Cover Upload Button */}
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            disabled={uploadingCover}
            className="absolute bottom-4 right-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 bg-opacity-75 hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            <PhotoIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            {uploadingCover ? 'Uploading...' : 'Change Cover'}
          </button>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            onChange={handleCoverChange}
            className="hidden"
          />
        </div>

        {/* Profile Header */}
        <div className="relative -mt-16 sm:-mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative">
              {/* Avatar */}
              <div className="relative inline-block">
                {profile?.avatar || avatarPreview ? (
                  <img
                    className="h-24 w-24 sm:h-32 sm:w-32 rounded-full border-4 border-white"
                    src={avatarPreview || profile?.avatar}
                    alt={profile?.name}
                  />
                ) : (
                  <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full bg-gray-300 border-4 border-white flex items-center justify-center">
                    <span className="text-3xl font-medium text-gray-700">
                      {profile?.name?.[0]?.toUpperCase() || 'V'}
                    </span>
                  </div>
                )}
                
                {/* Avatar Upload Button */}
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-gray-800 border-2 border-white flex items-center justify-center hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  <CameraIcon className="h-4 w-4 text-white" aria-hidden="true" />
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
          </div>
        </div>

        {/* Form */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <form onSubmit={formik.handleSubmit} className="space-y-8 divide-y divide-gray-200">
            {/* Basic Information */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">Basic Information</h3>
                <p className="mt-1 text-sm text-gray-500">
                  This information will be displayed publicly on your profile.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-4">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`mt-1 focus:ring-gray-500 focus:border-gray-500 block w-full shadow-sm sm:text-sm rounded-md ${
                      formik.touched.name && formik.errors.name
                        ? 'border-red-300'
                        : 'border-gray-300'
                    }`}
                  />
                  {formik.touched.name && formik.errors.name && (
                    <p className="mt-1 text-sm text-red-600">{formik.errors.name}</p>
                  )}
                </div>

                <div className="sm:col-span-6">
                  <label htmlFor="hero" className="block text-sm font-medium text-gray-700">
                    Hero Statement
                  </label>
                  <input
                    type="text"
                    name="hero"
                    id="hero"
                    value={formik.values.hero}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="e.g., Virtual Assistant specializing in e-commerce support"
                    className={`mt-1 focus:ring-gray-500 focus:border-gray-500 block w-full shadow-sm sm:text-sm rounded-md ${
                      formik.touched.hero && formik.errors.hero
                        ? 'border-red-300'
                        : 'border-gray-300'
                    }`}
                  />
                  {formik.touched.hero && formik.errors.hero && (
                    <p className="mt-1 text-sm text-red-600">{formik.errors.hero}</p>
                  )}
                </div>

                <div className="sm:col-span-6">
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    rows={4}
                    value={formik.values.bio}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`mt-1 focus:ring-gray-500 focus:border-gray-500 block w-full shadow-sm sm:text-sm rounded-md ${
                      formik.touched.bio && formik.errors.bio
                        ? 'border-red-300'
                        : 'border-gray-300'
                    }`}
                  />
                  {formik.touched.bio && formik.errors.bio && (
                    <p className="mt-1 text-sm text-red-600">{formik.errors.bio}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Links */}
            <div className="pt-8 space-y-6">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">Links & Social Media</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Add links to help businesses learn more about you.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                    Website
                  </label>
                  <input
                    type="url"
                    name="website"
                    id="website"
                    value={formik.values.website}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="https://example.com"
                    className="mt-1 focus:ring-gray-500 focus:border-gray-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="schedulingLink" className="block text-sm font-medium text-gray-700">
                    Scheduling Link
                  </label>
                  <input
                    type="url"
                    name="schedulingLink"
                    id="schedulingLink"
                    value={formik.values.schedulingLink}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="https://calendly.com/yourname"
                    className="mt-1 focus:ring-gray-500 focus:border-gray-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700">
                    LinkedIn
                  </label>
                  <input
                    type="url"
                    name="linkedin"
                    id="linkedin"
                    value={formik.values.linkedin}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="https://linkedin.com/in/yourname"
                    className="mt-1 focus:ring-gray-500 focus:border-gray-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="github" className="block text-sm font-medium text-gray-700">
                    GitHub
                  </label>
                  <input
                    type="url"
                    name="github"
                    id="github"
                    value={formik.values.github}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="https://github.com/yourname"
                    className="mt-1 focus:ring-gray-500 focus:border-gray-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>

            {/* Rates */}
            <div className="pt-8 space-y-6">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">Rates</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Set your preferred hourly rates (optional).
                </p>
              </div>

              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="preferredMinHourlyRate" className="block text-sm font-medium text-gray-700">
                    Minimum Hourly Rate ($)
                  </label>
                  <input
                    type="number"
                    name="preferredMinHourlyRate"
                    id="preferredMinHourlyRate"
                    value={formik.values.preferredMinHourlyRate}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="25"
                    className="mt-1 focus:ring-gray-500 focus:border-gray-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="preferredMaxHourlyRate" className="block text-sm font-medium text-gray-700">
                    Maximum Hourly Rate ($)
                  </label>
                  <input
                    type="number"
                    name="preferredMaxHourlyRate"
                    id="preferredMaxHourlyRate"
                    value={formik.values.preferredMaxHourlyRate}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="50"
                    className="mt-1 focus:ring-gray-500 focus:border-gray-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="pt-5">
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={updateProfileMutation.isLoading}
                  className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                >
                  {updateProfileMutation.isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}