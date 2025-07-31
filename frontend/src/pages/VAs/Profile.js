import React, { useState, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { CameraIcon, InformationCircleIcon } from '@heroicons/react/24/solid';
import { PhotoIcon, VideoCameraIcon, ArrowUpTrayIcon, EyeIcon } from '@heroicons/react/24/outline';

const validationSchema = Yup.object({
  name: Yup.string().required('Name is required'),
  hero: Yup.string().required('Hero statement is required'),
  bio: Yup.string().required('Bio is required').min(100, 'Bio must be at least 100 characters'),
  location: Yup.object({
    city: Yup.string().required('City is required'),
    state: Yup.string().required('Province is required'),
  }),
  email: Yup.string().email('Invalid email').required('Email is required'),
  phone: Yup.string(),
  website: Yup.string().url('Must be a valid URL'),
  meta: Yup.string(),
  instagram: Yup.string(),
  linkedin: Yup.string(),
  whatsapp: Yup.string(),
  twitter: Yup.string(),
  viber: Yup.string(),
});

const philippineProvinces = [
  "Metro Manila", "Abra", "Agusan del Norte", "Agusan del Sur", "Aklan", "Albay", 
  "Antique", "Apayao", "Aurora", "Basilan", "Bataan", "Batanes", "Batangas", 
  "Benguet", "Biliran", "Bohol", "Bukidnon", "Bulacan", "Cagayan", "Camarines Norte", 
  "Camarines Sur", "Camiguin", "Capiz", "Catanduanes", "Cavite", "Cebu", "Cotabato", 
  "Davao de Oro", "Davao del Norte", "Davao del Sur", "Davao Occidental", "Davao Oriental", 
  "Dinagat Islands", "Eastern Samar", "Guimaras", "Ifugao", "Ilocos Norte", "Ilocos Sur", 
  "Iloilo", "Isabela", "Kalinga", "La Union", "Laguna", "Lanao del Norte", "Lanao del Sur", 
  "Leyte", "Maguindanao", "Marinduque", "Masbate", "Misamis Occidental", "Misamis Oriental", 
  "Mountain Province", "Negros Occidental", "Negros Oriental", "Northern Samar", "Nueva Ecija", 
  "Nueva Vizcaya", "Occidental Mindoro", "Oriental Mindoro", "Palawan", "Pampanga", 
  "Pangasinan", "Quezon", "Quirino", "Rizal", "Romblon", "Samar", "Sarangani", 
  "Siquijor", "Sorsogon", "South Cotabato", "Southern Leyte", "Sultan Kudarat", "Sulu", 
  "Surigao del Norte", "Surigao del Sur", "Tarlac", "Tawi-Tawi", "Zambales", 
  "Zamboanga del Norte", "Zamboanga del Sur", "Zamboanga Sibugay"
];

export default function VAProfile() {
  const queryClient = useQueryClient();
  const coverInputRef = useRef(null);
  const avatarInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);

  // Fetch current VA profile
  const { data: profile, isLoading } = useQuery(
    'vaProfile',
    async () => {
      const response = await api.get('/vas/me');
      return response.data.data;
    }
  );

  // Fetch specialties
  const { data: specialties = [] } = useQuery(
    'specialties',
    async () => {
      const response = await api.get('/specialties');
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
      location: {
        street: profile?.location?.street || '',
        city: profile?.location?.city || '',
        state: profile?.location?.state || '',
        postal_code: profile?.location?.postal_code || '',
        country: 'Philippines',
        country_code: 'PH'
      },
      email: profile?.email || '',
      phone: profile?.phone || '',
      website: profile?.website || '',
      meta: profile?.meta || '',
      instagram: profile?.instagram || '',
      linkedin: profile?.linkedin || '',
      whatsapp: profile?.whatsapp || '',
      twitter: profile?.twitter || '',
      viber: profile?.viber || '',
      schedulingLink: profile?.schedulingLink || '',
      preferredMinHourlyRate: profile?.preferredMinHourlyRate || '',
      preferredMaxHourlyRate: profile?.preferredMaxHourlyRate || '',
      specialtyIds: profile?.specialties?.map(s => s._id) || [],
      searchStatus: profile?.searchStatus || 'actively_looking',
      roleType: {
        part_time_contract: profile?.roleType?.part_time_contract || false,
        full_time_contract: profile?.roleType?.full_time_contract || false,
        full_time_employment: profile?.roleType?.full_time_employment || false,
      },
      roleLevel: {
        junior: profile?.roleLevel?.junior || false,
        mid: profile?.roleLevel?.mid || false,
        senior: profile?.roleLevel?.senior || false,
        principal: profile?.roleLevel?.principal || false,
        c_level: profile?.roleLevel?.c_level || false,
      },
      profileReminderNotifications: profile?.profileReminderNotifications ?? true,
      productAnnouncementNotifications: profile?.productAnnouncementNotifications ?? true,
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

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image file size must be less than 5MB');
      return;
    }

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
      console.error('Cover upload error:', error);
      toast.error(error.response?.data?.error || 'Failed to upload cover image');
      setCoverPreview(null);
    } finally {
      setUploadingCover(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image file size must be less than 5MB');
      return;
    }

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
      console.error('Avatar upload error:', error);
      toast.error(error.response?.data?.error || 'Failed to upload profile picture');
      setAvatarPreview(null);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleVideoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a valid video file');
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('Video file size must be less than 50MB');
      return;
    }

    setUploadingVideo(true);
    setVideoProgress(0);

    const formData = new FormData();
    formData.append('video', file);

    try {
      const response = await api.post('/vas/me/upload-video', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setVideoProgress(percentCompleted);
        },
      });
      
      await api.put('/vas/me', { videoIntroduction: response.data.url });
      queryClient.invalidateQueries('vaProfile');
      toast.success('Video uploaded successfully');
    } catch (error) {
      console.error('Video upload error:', error);
      toast.error(error.response?.data?.error || 'Failed to upload video');
    } finally {
      setUploadingVideo(false);
      setVideoProgress(0);
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

      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mx-4 lg:mx-0 mt-8 lg:mt-16">
            <h1 className="text-3xl font-bold leading-tight text-gray-900">
              Edit Your VA Profile
            </h1>
            {profile?._id && (
              <div className="mt-4 sm:mt-0">
                <Link
                  to={`/vas/${profile._id}`}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  <EyeIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  View Public Profile
                </Link>
              </div>
            )}
          </div>

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
                    <p>A complete profile helps businesses find and connect with you.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={formik.handleSubmit} className="space-y-8">
            {/* Profile Section */}
            <section className="bg-white shadow px-4 py-5 lg:rounded-lg sm:p-6">
              <div className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1">
                  <h2 className="text-lg font-medium leading-6 text-gray-900">Profile</h2>
                  <p className="mt-2 text-sm text-gray-500">
                    This information will be displayed publicly so be careful what you share.
                  </p>
                </div>

                <div className="mt-5 md:mt-0 md:col-span-2">
                  <div className="space-y-6">
                    {/* Name */}
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Full Name
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="name"
                          id="name"
                          value={formik.values.name}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          className={`block w-full rounded-md shadow-sm sm:text-sm ${
                            formik.touched.name && formik.errors.name
                              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                              : 'border-gray-300 focus:ring-gray-500 focus:border-gray-500'
                          }`}
                        />
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        Your name will be displayed on your profile and in search results.
                      </p>
                      {formik.touched.name && formik.errors.name && (
                        <p className="mt-1 text-sm text-red-600">{formik.errors.name}</p>
                      )}
                    </div>

                    {/* Hero */}
                    <div>
                      <label htmlFor="hero" className="block text-sm font-medium text-gray-700">
                        Hero Statement
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="hero"
                          id="hero"
                          value={formik.values.hero}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          placeholder="e.g., Virtual Assistant specializing in e-commerce support"
                          className={`block w-full rounded-md shadow-sm sm:text-sm ${
                            formik.touched.hero && formik.errors.hero
                              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                              : 'border-gray-300 focus:ring-gray-500 focus:border-gray-500'
                          }`}
                        />
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        A brief statement that describes what you do.
                      </p>
                      {formik.touched.hero && formik.errors.hero && (
                        <p className="mt-1 text-sm text-red-600">{formik.errors.hero}</p>
                      )}
                    </div>

                    {/* Location */}
                    <div>
                      <div className="space-y-4">
                        {/* Street Address */}
                        <div>
                          <label htmlFor="location.street" className="block text-sm font-medium text-gray-700">
                            Street Address
                          </label>
                          <div className="mt-1">
                            <input
                              type="text"
                              name="location.street"
                              id="location.street"
                              value={formik.values.location.street}
                              onChange={formik.handleChange}
                              placeholder="e.g. 123 Rizal Street, Barangay San Juan"
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* City/Municipality */}
                          <div>
                            <label htmlFor="location.city" className="block text-sm font-medium text-gray-700">
                              City/Municipality *
                            </label>
                            <div className="mt-1">
                              <input
                                type="text"
                                name="location.city"
                                id="location.city"
                                value={formik.values.location.city}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                placeholder="e.g. Manila, Cebu City, Davao"
                                className={`block w-full rounded-md shadow-sm sm:text-sm ${
                                  formik.touched.location?.city && formik.errors.location?.city
                                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                    : 'border-gray-300 focus:ring-gray-500 focus:border-gray-500'
                                }`}
                              />
                            </div>
                          </div>

                          {/* Postal Code */}
                          <div>
                            <label htmlFor="location.postal_code" className="block text-sm font-medium text-gray-700">
                              Postal Code
                            </label>
                            <div className="mt-1">
                              <input
                                type="text"
                                name="location.postal_code"
                                id="location.postal_code"
                                value={formik.values.location.postal_code}
                                onChange={formik.handleChange}
                                placeholder="e.g. 1000"
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Province */}
                        <div>
                          <label htmlFor="location.state" className="block text-sm font-medium text-gray-700">
                            Province *
                          </label>
                          <div className="mt-1">
                            <select
                              name="location.state"
                              id="location.state"
                              value={formik.values.location.state}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              className={`block w-full rounded-md shadow-sm sm:text-sm ${
                                formik.touched.location?.state && formik.errors.location?.state
                                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                  : 'border-gray-300 focus:ring-gray-500 focus:border-gray-500'
                              }`}
                            >
                              <option value="">Select Province</option>
                              {philippineProvinces.map(province => (
                                <option key={province} value={province}>{province}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 p-3 bg-blue-50 rounded-md">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <InformationCircleIcon className="h-5 w-5 text-blue-400" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-blue-700">
                              🇵🇭 All VAs on Linkage VA Hub are based in the Philippines (GMT+8 timezone). This helps businesses plan collaboration and meetings.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Avatar */}
                    <div>
                      <span className="block text-sm font-medium text-gray-700">Profile Picture</span>
                      <div className="mt-1 flex items-center">
                        <div className="relative">
                          {profile?.avatar || avatarPreview ? (
                            <img
                              className="h-24 w-24 rounded-full object-cover"
                              src={avatarPreview || profile?.avatar}
                              alt="Avatar"
                            />
                          ) : (
                            <div className="h-24 w-24 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-3xl font-medium text-gray-700">
                                {formik.values.name?.[0]?.toUpperCase() || 'V'}
                              </span>
                            </div>
                          )}
                          {uploadingAvatar && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 rounded-full">
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

                    {/* Cover Image */}
                    <div>
                      <span className="block text-sm font-medium text-gray-700">Cover Image</span>
                      <p className="mt-1 text-sm text-gray-500">
                        Upload a professional banner image for your profile. Best dimensions: 1200×400 pixels. PNG, JPG, GIF up to 10MB.
                      </p>
                      <div className="relative mt-2">
                        <div className="relative h-48 rounded-md overflow-hidden bg-gray-100">
                          <img
                            className="w-full h-full object-cover"
                            src={coverPreview || profile?.coverImage || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=300&fit=crop'}
                            alt="Cover"
                          />
                          {uploadingCover && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => coverInputRef.current?.click()}
                            className="absolute right-4 bottom-4 bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                          >
                            Change
                          </button>
                        </div>
                        <input
                          ref={coverInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleCoverChange}
                          className="hidden"
                        />
                      </div>
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
                  <p className="mt-1 text-sm text-gray-500">Your contact details for employers to reach you.</p>
                </div>
                <div className="mt-5 md:mt-0 md:col-span-2">
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email Address
                      </label>
                      <div className="mt-1">
                        <input
                          type="email"
                          name="email"
                          id="email"
                          value={formik.values.email}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          placeholder="your.email@example.com"
                          className={`block w-full rounded-md shadow-sm sm:text-sm ${
                            formik.touched.email && formik.errors.email
                              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                              : 'border-gray-300 focus:ring-gray-500 focus:border-gray-500'
                          }`}
                        />
                      </div>
                      <p className="mt-2 text-sm text-gray-500">Your professional email address for employers to contact you.</p>
                    </div>
                    
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                        Phone Number
                      </label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                          +63
                        </span>
                        <input
                          type="text"
                          name="phone"
                          id="phone"
                          value={formik.values.phone}
                          onChange={formik.handleChange}
                          placeholder="9171234567"
                          className="flex-1 block w-full rounded-none rounded-r-md border-gray-300 focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                        />
                      </div>
                      <p className="mt-2 text-sm text-gray-500">Your primary phone number for employers to contact you directly.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Video Introduction */}
            <section className="bg-white shadow mt-8 px-4 py-5 lg:rounded-lg sm:p-6">
              <div className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1">
                  <h2 className="text-lg font-medium leading-6 text-gray-900">Video Introduction</h2>
                  <p className="mt-2 text-sm text-gray-500">
                    A short video introduction helps you stand out. Upload a 1-2 minute video telling employers about yourself.
                  </p>
                  <p className="mt-2 text-sm text-gray-500">Videos up to 1GB are supported.</p>
                </div>

                <div className="mt-5 md:mt-0 md:col-span-2">
                  <div className="space-y-6">
                    {profile?.videoIntroduction ? (
                      <div>
                        <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                          <video controls className="w-full h-full object-cover">
                            <source src={profile.videoIntroduction} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                        </div>
                        <p className="mt-2 text-sm text-green-600 text-center">✓ Video uploaded successfully</p>
                        <div className="text-center mt-4">
                          <button
                            type="button"
                            onClick={() => videoInputRef.current?.click()}
                            className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                          >
                            <ArrowUpTrayIcon className="-ml-1 mr-2 h-5 w-5" />
                            Replace Video
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                        <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-blue-100 mb-4">
                          <VideoCameraIcon className="h-12 w-12 text-blue-600" />
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => videoInputRef.current?.click()}
                          className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <ArrowUpTrayIcon className="-ml-1 mr-3 h-6 w-6" />
                          Upload Video Introduction
                        </button>
                        
                        <p className="mt-3 text-sm text-gray-500">Upload a 1-2 minute video introducing yourself</p>
                        <p className="mt-1 text-xs text-gray-400">MP4, MOV, WebM up to 1GB</p>
                      </div>
                    )}

                    {uploadingVideo && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="animate-spin h-8 w-8 text-blue-600">
                              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            </div>
                          </div>
                          <div className="ml-4 flex-1">
                            <h3 className="text-sm font-medium text-blue-800">Uploading video...</h3>
                            <div className="mt-2">
                              <div className="bg-white rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                  style={{ width: `${videoProgress}%` }}
                                ></div>
                              </div>
                              <p className="mt-2 text-sm text-blue-600">{videoProgress}% complete</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/*"
                      onChange={handleVideoChange}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Bio */}
            <section className="bg-white shadow mt-8 px-4 py-5 lg:rounded-lg sm:p-6">
              <div className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1">
                  <h2 className="text-lg font-medium leading-6 text-gray-900">Bio</h2>
                  <p className="mt-2 text-sm text-gray-500">
                    Share some information about yourself. What you did before, what you're doing now, and what you're looking for next.
                  </p>

                  <h4 className="font-medium uppercase tracking-wide text-gray-500 text-sm mt-4">EXAMPLES</h4>
                  <ul className="text-sm text-gray-500 list-disc list-inside">
                    <li className="mt-1">Where you're originally from</li>
                    <li className="mt-1">What you've accomplished</li>
                    <li className="mt-1">What you've learned</li>
                    <li className="mt-1">What you're passionate about</li>
                    <li className="mt-1">How you can help businesses</li>
                    <li className="mt-1">What makes you unique</li>
                  </ul>

                  <p className="mt-4 text-sm text-gray-500">You can use Markdown for formatting.</p>
                </div>

                <div className="mt-5 md:mt-0 md:col-span-2">
                  <div className="space-y-6">
                    <div>
                      <textarea
                        name="bio"
                        id="bio"
                        rows={20}
                        value={formik.values.bio}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className={`block w-full rounded-md shadow-sm sm:text-sm ${
                          formik.touched.bio && formik.errors.bio
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                            : 'border-gray-300 focus:ring-gray-500 focus:border-gray-500'
                        }`}
                      />
                      <p className="mt-2 text-sm text-gray-500">
                        {formik.values.bio.length} characters. Minimum 100 characters.
                      </p>
                      {formik.touched.bio && formik.errors.bio && (
                        <p className="mt-1 text-sm text-red-600">{formik.errors.bio}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Specialties */}
            <section className="bg-white shadow mt-8 px-4 py-5 lg:rounded-lg sm:p-6">
              <div className="md:grid md:grid-cols-3 md:gap-6">
                <div>
                  <h2 className="text-lg font-medium leading-6 text-gray-900">Specialties</h2>
                  <p className="mt-2 text-sm text-gray-500">
                    Pick the things you're good at, have experience with, or want to learn.
                  </p>
                  <p className="mt-2 text-sm text-gray-500">
                    Missing a specialty? <a href="mailto:hello@linkage.ph?subject=New specialty suggestion" className="text-gray-700 font-medium underline hover:text-gray-900">Let us know</a>.
                  </p>

                  <h4 className="font-medium uppercase tracking-wide text-gray-500 text-sm mt-4">NOTE</h4>
                  <p className="mt-1 text-sm text-gray-500">
                    These affect the search results and are public, so be honest about your skills.
                  </p>
                </div>

                <div className="mt-5 md:mt-0 md:col-span-2">
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {specialties.map((specialty) => (
                        <div key={specialty._id} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`specialty-${specialty._id}`}
                            value={specialty._id}
                            checked={formik.values.specialtyIds.includes(specialty._id)}
                            onChange={(e) => {
                              const { checked, value } = e.target;
                              if (checked) {
                                formik.setFieldValue('specialtyIds', [...formik.values.specialtyIds, value]);
                              } else {
                                formik.setFieldValue('specialtyIds', formik.values.specialtyIds.filter(id => id !== value));
                              }
                            }}
                            className="h-4 w-4 border-gray-300 rounded text-gray-600 focus:ring-gray-500"
                          />
                          <label htmlFor={`specialty-${specialty._id}`} className="ml-3 text-sm text-gray-700">
                            {specialty.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Work Preferences */}
            <section className="bg-white shadow mt-8 px-4 py-5 lg:rounded-lg sm:p-6">
              <div className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1">
                  <h2 className="text-lg font-medium leading-6 text-gray-900">Work preferences</h2>
                  <p className="mt-2 text-sm text-gray-500">Let businesses know your work preferences and availability.</p>
                </div>

                <div className="mt-5 md:mt-0 md:col-span-2">
                  <div className="space-y-6">
                    {/* Search Status */}
                    <fieldset>
                      <legend className="text-base font-medium text-gray-900">
                        Search status
                      </legend>
                      <div className="mt-4 space-y-4">
                        <div className="flex items-start">
                          <div className="h-5 flex items-center">
                            <input
                              id="actively_looking"
                              name="searchStatus"
                              type="radio"
                              value="actively_looking"
                              checked={formik.values.searchStatus === 'actively_looking'}
                              onChange={formik.handleChange}
                              className="focus:ring-gray-500 h-4 w-4 text-gray-600 border-gray-300"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label htmlFor="actively_looking" className="font-medium text-gray-700">
                              Actively looking
                            </label>
                            <p className="text-gray-500">You're actively looking for new opportunities.</p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              id="open"
                              name="searchStatus"
                              type="radio"
                              value="open"
                              checked={formik.values.searchStatus === 'open'}
                              onChange={formik.handleChange}
                              className="focus:ring-gray-500 h-4 w-4 text-gray-600 border-gray-300"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label htmlFor="open" className="font-medium text-gray-700">
                              Open to opportunities
                            </label>
                            <p className="text-gray-500">You're not looking but open to hearing about new opportunities.</p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              id="not_interested"
                              name="searchStatus"
                              type="radio"
                              value="not_interested"
                              checked={formik.values.searchStatus === 'not_interested'}
                              onChange={formik.handleChange}
                              className="focus:ring-gray-500 h-4 w-4 text-gray-600 border-gray-300"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label htmlFor="not_interested" className="font-medium text-gray-700">
                              Not interested
                            </label>
                            <p className="text-gray-500">You're not interested in new opportunities.</p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              id="invisible"
                              name="searchStatus"
                              type="radio"
                              value="invisible"
                              checked={formik.values.searchStatus === 'invisible'}
                              onChange={formik.handleChange}
                              className="focus:ring-gray-500 h-4 w-4 text-gray-600 border-gray-300"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label htmlFor="invisible" className="font-medium text-gray-700">
                              Invisible
                            </label>
                            <p className="text-gray-500">Your profile is hidden from search results.</p>
                          </div>
                        </div>
                      </div>
                    </fieldset>

                    {/* Role Type */}
                    <fieldset>
                      <div>
                        <legend className="text-base font-medium text-gray-900">
                          Role type
                        </legend>
                        <p className="text-sm text-gray-500">What type of work are you interested in?</p>
                      </div>
                      <div className="mt-4 space-y-4">
                        <div className="flex items-center">
                          <input
                            id="part_time_contract"
                            name="roleType.part_time_contract"
                            type="checkbox"
                            checked={formik.values.roleType.part_time_contract}
                            onChange={formik.handleChange}
                            className="focus:ring-gray-500 h-4 w-4 text-gray-600 border-gray-300 rounded"
                          />
                          <label htmlFor="part_time_contract" className="ml-3 block text-sm font-medium text-gray-700">
                            Part-time contract
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            id="full_time_contract"
                            name="roleType.full_time_contract"
                            type="checkbox"
                            checked={formik.values.roleType.full_time_contract}
                            onChange={formik.handleChange}
                            className="focus:ring-gray-500 h-4 w-4 text-gray-600 border-gray-300 rounded"
                          />
                          <label htmlFor="full_time_contract" className="ml-3 block text-sm font-medium text-gray-700">
                            Full-time contract
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            id="full_time_employment"
                            name="roleType.full_time_employment"
                            type="checkbox"
                            checked={formik.values.roleType.full_time_employment}
                            onChange={formik.handleChange}
                            className="focus:ring-gray-500 h-4 w-4 text-gray-600 border-gray-300 rounded"
                          />
                          <label htmlFor="full_time_employment" className="ml-3 block text-sm font-medium text-gray-700">
                            Full-time employment
                          </label>
                        </div>
                      </div>
                    </fieldset>

                    {/* Role Level */}
                    <fieldset>
                      <div>
                        <legend className="text-base font-medium text-gray-900">
                          Role level
                        </legend>
                        <p className="text-sm text-gray-500">What level of role are you looking for?</p>
                      </div>
                      <div className="mt-4 space-y-4">
                        <div className="flex items-center">
                          <input
                            id="junior"
                            name="roleLevel.junior"
                            type="checkbox"
                            checked={formik.values.roleLevel.junior}
                            onChange={formik.handleChange}
                            className="focus:ring-gray-500 h-4 w-4 text-gray-600 border-gray-300 rounded"
                          />
                          <label htmlFor="junior" className="ml-3 block text-sm font-medium text-gray-700">
                            Junior
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            id="mid"
                            name="roleLevel.mid"
                            type="checkbox"
                            checked={formik.values.roleLevel.mid}
                            onChange={formik.handleChange}
                            className="focus:ring-gray-500 h-4 w-4 text-gray-600 border-gray-300 rounded"
                          />
                          <label htmlFor="mid" className="ml-3 block text-sm font-medium text-gray-700">
                            Mid
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            id="senior"
                            name="roleLevel.senior"
                            type="checkbox"
                            checked={formik.values.roleLevel.senior}
                            onChange={formik.handleChange}
                            className="focus:ring-gray-500 h-4 w-4 text-gray-600 border-gray-300 rounded"
                          />
                          <label htmlFor="senior" className="ml-3 block text-sm font-medium text-gray-700">
                            Senior
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            id="principal"
                            name="roleLevel.principal"
                            type="checkbox"
                            checked={formik.values.roleLevel.principal}
                            onChange={formik.handleChange}
                            className="focus:ring-gray-500 h-4 w-4 text-gray-600 border-gray-300 rounded"
                          />
                          <label htmlFor="principal" className="ml-3 block text-sm font-medium text-gray-700">
                            Principal
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            id="c_level"
                            name="roleLevel.c_level"
                            type="checkbox"
                            checked={formik.values.roleLevel.c_level}
                            onChange={formik.handleChange}
                            className="focus:ring-gray-500 h-4 w-4 text-gray-600 border-gray-300 rounded"
                          />
                          <label htmlFor="c_level" className="ml-3 block text-sm font-medium text-gray-700">
                            C-level
                          </label>
                        </div>
                      </div>
                    </fieldset>
                  </div>
                </div>
              </div>
            </section>

            {/* Online Presence */}
            <section className="bg-white shadow mt-8 px-4 py-5 lg:rounded-lg sm:p-6">
              <div className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1">
                  <h2 className="text-lg font-medium leading-6 text-gray-900">Online presence</h2>
                  <p className="mt-2 text-sm text-gray-500">Where can people find you online?</p>
                </div>

                <div className="mt-5 md:mt-0 md:col-span-2">
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                        Website
                      </label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                          https://
                        </span>
                        <input
                          type="text"
                          name="website"
                          id="website"
                          value={formik.values.website}
                          onChange={formik.handleChange}
                          className="flex-1 block w-full rounded-none rounded-r-md border-gray-300 focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="meta" className="block text-sm font-medium text-gray-700">
                        Facebook
                      </label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                          facebook.com/
                        </span>
                        <input
                          type="text"
                          name="meta"
                          id="meta"
                          value={formik.values.meta}
                          onChange={formik.handleChange}
                          className="flex-1 block w-full rounded-none rounded-r-md border-gray-300 focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="instagram" className="block text-sm font-medium text-gray-700">
                        Instagram
                      </label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                          instagram.com/
                        </span>
                        <input
                          type="text"
                          name="instagram"
                          id="instagram"
                          value={formik.values.instagram}
                          onChange={formik.handleChange}
                          className="flex-1 block w-full rounded-none rounded-r-md border-gray-300 focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700">
                        LinkedIn
                      </label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                          linkedin.com/in/
                        </span>
                        <input
                          type="text"
                          name="linkedin"
                          id="linkedin"
                          value={formik.values.linkedin}
                          onChange={formik.handleChange}
                          className="flex-1 block w-full rounded-none rounded-r-md border-gray-300 focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700">
                        WhatsApp
                      </label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                          +63
                        </span>
                        <input
                          type="text"
                          name="whatsapp"
                          id="whatsapp"
                          value={formik.values.whatsapp}
                          onChange={formik.handleChange}
                          placeholder="9171234567"
                          className="flex-1 block w-full rounded-none rounded-r-md border-gray-300 focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="twitter" className="block text-sm font-medium text-gray-700">
                        Twitter
                      </label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                          twitter.com/
                        </span>
                        <input
                          type="text"
                          name="twitter"
                          id="twitter"
                          value={formik.values.twitter}
                          onChange={formik.handleChange}
                          className="flex-1 block w-full rounded-none rounded-r-md border-gray-300 focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="viber" className="block text-sm font-medium text-gray-700">
                        Viber
                      </label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                          +63
                        </span>
                        <input
                          type="text"
                          name="viber"
                          id="viber"
                          value={formik.values.viber}
                          onChange={formik.handleChange}
                          placeholder="9171234567"
                          className="flex-1 block w-full rounded-none rounded-r-md border-gray-300 focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Notifications */}
            <section className="bg-white shadow mt-8 px-4 py-5 lg:rounded-lg sm:p-6">
              <fieldset className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1">
                  <legend className="text-lg font-medium leading-6 text-gray-900">Notifications</legend>
                </div>

                <div className="mt-5 md:mt-0 md:col-span-2 space-y-4">
                  <fieldset>
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <div className="h-5 flex items-center">
                          <input
                            id="profileReminderNotifications"
                            name="profileReminderNotifications"
                            type="checkbox"
                            checked={formik.values.profileReminderNotifications}
                            onChange={formik.handleChange}
                            className="focus:ring-gray-500 h-4 w-4 text-gray-600 border-gray-300 rounded"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="profileReminderNotifications" className="font-medium text-gray-700">
                            Profile reminders
                          </label>
                          <p className="text-gray-500">Get notified when you haven't updated your profile in a while.</p>
                        </div>
                      </div>
                    </div>
                  </fieldset>
                  <fieldset>
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <div className="h-5 flex items-center">
                          <input
                            id="productAnnouncementNotifications"
                            name="productAnnouncementNotifications"
                            type="checkbox"
                            checked={formik.values.productAnnouncementNotifications}
                            onChange={formik.handleChange}
                            className="focus:ring-gray-500 h-4 w-4 text-gray-600 border-gray-300 rounded"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="productAnnouncementNotifications" className="font-medium text-gray-700">
                            Product announcements
                          </label>
                          <p className="text-gray-500">Get notified about new features and updates.</p>
                        </div>
                      </div>
                    </div>
                  </fieldset>
                </div>
              </fieldset>
            </section>

            {/* Submit Button */}
            <div className="flex justify-end mt-8 mb-16 mr-4 sm:mr-6 lg:mr-0">
              <button
                type="submit"
                disabled={updateProfileMutation.isLoading}
                className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
              >
                {updateProfileMutation.isLoading ? 'Updating...' : 'Update profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}