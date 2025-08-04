import React, { useState, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useBranding } from '../../contexts/BrandingContext';
import { 
  CameraIcon, 
  InformationCircleIcon, 
  PlusIcon, 
  TrashIcon,
  BuildingOfficeIcon,
  GlobeAltIcon,
  StarIcon
} from '@heroicons/react/24/solid';

// Industry options adapted for business needs
const INDUSTRIES = [
  'Accounting', 'Advertising & Marketing', 'Agriculture', 'Architecture & Planning',
  'Automotive', 'Banking', 'Biotechnology', 'Construction', 'Consulting',
  'Consumer Electronics', 'Consumer Goods', 'Design', 'E-Learning',
  'Education', 'Energy', 'Engineering', 'Entertainment', 'Fashion & Apparel',
  'Financial Services', 'Food & Beverages', 'Government', 'Healthcare',
  'Hospitality', 'Human Resources', 'Information Technology', 'Insurance',
  'Internet', 'Legal', 'Logistics & Supply Chain', 'Manufacturing',
  'Media & Communications', 'Non-profit', 'Oil & Gas', 'Pharmaceuticals',
  'Real Estate', 'Retail', 'Security & Investigations', 'Software',
  'Telecommunications', 'Transportation', 'Travel & Tourism', 'Utilities',
  'Venture Capital & Private Equity', 'Other'
];

// Company size options
const COMPANY_SIZES = [
  '1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5001-10000', '10000+'
];

// Work environment options
const WORK_ENVIRONMENTS = [
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'On-site' },
  { value: 'flexible', label: 'Flexible' }
];

const validationSchema = Yup.object({
  // Basic Information
  contactName: Yup.string().required('Contact name is required'),
  company: Yup.string().required('Company name is required'),
  bio: Yup.string().required('Company description is required').min(100, 'Description must be at least 100 characters'),
  contactRole: Yup.string().required('Contact role is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  phone: Yup.string(),
  website: Yup.string().url('Must be a valid URL'),
  
  // Company Details
  industry: Yup.string().required('Industry is required'),
  companySize: Yup.string().required('Company size is required'),
  foundedYear: Yup.number().min(1800).max(new Date().getFullYear()),
  headquartersLocation: Yup.string(),
  workEnvironment: Yup.string(),
  
  // Address
  streetAddress: Yup.string(),
  city: Yup.string(),
  state: Yup.string(),
  postalCode: Yup.string(),
  country: Yup.string(),
  
  // Professional Information
  missionStatement: Yup.string(),
  companyCulture: Yup.string(),
  vaRequirements: Yup.string(),
  workingHours: Yup.string(),
  
  // Social Media
  linkedin: Yup.string().url('Must be a valid URL'),
  facebook: Yup.string().url('Must be a valid URL'),
  twitter: Yup.string().url('Must be a valid URL'),
  instagram: Yup.string().url('Must be a valid URL'),
  youtube: Yup.string().url('Must be a valid URL'),
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
      // Basic Information
      contactName: profile?.contactName || '',
      company: profile?.company || '',
      bio: profile?.bio || '',
      contactRole: profile?.contactRole || '',
      email: profile?.email || '',
      phone: profile?.phone || '',
      website: profile?.website || '',
      
      // Company Details
      industry: profile?.industry || '',
      companySize: profile?.companySize || '',
      foundedYear: profile?.foundedYear || '',
      employeeCount: profile?.employeeCount || '',
      headquartersLocation: profile?.headquartersLocation || '',
      workEnvironment: profile?.workEnvironment || '',
      
      // Address
      streetAddress: profile?.streetAddress || '',
      city: profile?.city || '',
      state: profile?.state || '',
      postalCode: profile?.postalCode || '',
      country: profile?.country || '',
      
      // Professional Information
      missionStatement: profile?.missionStatement || '',
      companyCulture: profile?.companyCulture || '',
      vaRequirements: profile?.vaRequirements || '',
      workingHours: profile?.workingHours || '',
      
      // Arrays
      specialties: profile?.specialties || [],
      benefits: profile?.benefits || [],
      certifications: profile?.certifications || [],
      awards: profile?.awards || [],
      companyValues: profile?.companyValues || [],
      languages: profile?.languages || [],
      
      // Social Media
      linkedin: profile?.linkedin || '',
      facebook: profile?.facebook || '',
      twitter: profile?.twitter || '',
      instagram: profile?.instagram || '',
      youtube: profile?.youtube || '',
      
      // Settings
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

  // Helper functions for array management
  const addArrayItem = (fieldName, newItem = '') => {
    if (newItem.trim()) {
      const currentArray = formik.values[fieldName] || [];
      formik.setFieldValue(fieldName, [...currentArray, newItem.trim()]);
    }
  };

  const removeArrayItem = (fieldName, index) => {
    const currentArray = formik.values[fieldName] || [];
    const newArray = currentArray.filter((_, i) => i !== index);
    formik.setFieldValue(fieldName, newArray);
  };

  const updateArrayItem = (fieldName, index, newValue) => {
    const currentArray = formik.values[fieldName] || [];
    const newArray = [...currentArray];
    newArray[index] = newValue;
    formik.setFieldValue(fieldName, newArray);
  };

  // Calculate profile completion
  const calculateCompletion = () => {
    const requiredFields = ['contactName', 'company', 'bio', 'industry', 'companySize', 'contactRole', 'email'];
    const professionalFields = ['missionStatement', 'companyCulture', 'workEnvironment', 'headquartersLocation'];
    const socialFields = ['linkedin', 'facebook', 'twitter', 'instagram'];
    const arrayFields = ['specialties', 'benefits', 'companyValues'];

    let completed = 0;
    let total = requiredFields.length + professionalFields.length + arrayFields.length + 1; // +1 for at least one social

    // Required fields
    requiredFields.forEach(field => {
      if (formik.values[field] && formik.values[field].toString().length > 0) completed++;
    });

    // Professional fields
    professionalFields.forEach(field => {
      if (formik.values[field] && formik.values[field].length > 0) completed++;
    });

    // Array fields (at least one item each)
    arrayFields.forEach(field => {
      if (formik.values[field] && formik.values[field].length > 0) completed++;
    });

    // At least one social link
    const hasSocial = socialFields.some(field => formik.values[field] && formik.values[field].length > 0);
    if (hasSocial) completed++;

    return Math.round((completed / total) * 100);
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
          <div className="flex items-center justify-between mx-4 lg:mx-0 mt-8 lg:mt-16">
            <h1 className="text-3xl font-bold leading-tight text-gray-900">
              {branding.isESystemsMode ? 'Company Profile' : 'Business Profile'}
            </h1>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">Profile Completion</div>
                <div className="flex items-center">
                  <div className="text-2xl font-bold text-gray-900">{calculateCompletion()}%</div>
                  <StarIcon className="h-5 w-5 text-yellow-400 ml-1" />
                </div>
              </div>
            </div>
          </div>

          {/* Profile Completion Progress */}
          <div className="mx-4 lg:mx-0">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <BuildingOfficeIcon className="h-6 w-6 text-blue-500" />
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-blue-800">Build Your Professional Company Profile</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>Create a comprehensive profile similar to LinkedIn to attract top VAs. Complete all sections to maximize your visibility.</p>
                  </div>
                  <div className="mt-3">
                    <div className="bg-white rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${calculateCompletion()}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={formik.handleSubmit} className="space-y-8">
            {/* 1. Company Header - Like LinkedIn's Intro/Header card */}
            <section className="bg-white shadow px-4 py-5 lg:rounded-lg sm:p-6">
              <div className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1">
                  <h2 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
                    <BuildingOfficeIcon className="h-5 w-5 mr-2 text-blue-500" />
                    Company Header
                  </h2>
                  <p className="mt-2 text-sm text-gray-500">
                    Your company's primary information that VAs will see first.
                  </p>
                </div>

                <div className="mt-5 md:mt-0 md:col-span-2">
                  <div className="space-y-6">
                    {/* Company Logo */}
                    <div>
                      <span className="block text-sm font-medium text-gray-700">Company Logo *</span>
                      <div className="mt-1 flex items-center">
                        <div className="relative">
                          {profile?.avatar || avatarPreview ? (
                            <img
                              className="h-24 w-24 rounded-lg object-cover border-2 border-gray-200"
                              src={avatarPreview || profile?.avatar}
                              alt="Company Logo"
                            />
                          ) : (
                            <div className="h-24 w-24 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center border-2 border-gray-200">
                              <span className="text-2xl font-bold text-white">
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
                        <div className="ml-5">
                          <button
                            type="button"
                            onClick={() => avatarInputRef.current?.click()}
                            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <CameraIcon className="h-4 w-4 inline mr-2" />
                            Upload Logo
                          </button>
                          <p className="mt-2 text-xs text-gray-500">Recommended: 400x400px minimum</p>
                        </div>
                        <input
                          ref={avatarInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="hidden"
                        />
                      </div>
                    </div>

                    {/* Company Name & Industry Row */}
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
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
                            placeholder="e.g., Microsoft Corporation"
                            className={`block w-full rounded-md shadow-sm sm:text-sm ${
                              formik.touched.company && formik.errors.company
                                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                            }`}
                          />
                        </div>
                        {formik.touched.company && formik.errors.company && (
                          <p className="mt-1 text-sm text-red-600">{formik.errors.company}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="industry" className="block text-sm font-medium text-gray-700">
                          Industry *
                        </label>
                        <div className="mt-1">
                          <select
                            name="industry"
                            id="industry"
                            value={formik.values.industry}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            className={`block w-full rounded-md shadow-sm sm:text-sm ${
                              formik.touched.industry && formik.errors.industry
                                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                            }`}
                          >
                            <option value="">Select Industry</option>
                            {INDUSTRIES.map(industry => (
                              <option key={industry} value={industry}>{industry}</option>
                            ))}
                          </select>
                        </div>
                        {formik.touched.industry && formik.errors.industry && (
                          <p className="mt-1 text-sm text-red-600">{formik.errors.industry}</p>
                        )}
                      </div>
                    </div>

                    {/* Company Size & Founded Year Row */}
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-3">
                      <div>
                        <label htmlFor="companySize" className="block text-sm font-medium text-gray-700">
                          Company Size *
                        </label>
                        <div className="mt-1">
                          <select
                            name="companySize"
                            id="companySize"
                            value={formik.values.companySize}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            className={`block w-full rounded-md shadow-sm sm:text-sm ${
                              formik.touched.companySize && formik.errors.companySize
                                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                            }`}
                          >
                            <option value="">Select Size</option>
                            {COMPANY_SIZES.map(size => (
                              <option key={size} value={size}>{size} employees</option>
                            ))}
                          </select>
                        </div>
                        {formik.touched.companySize && formik.errors.companySize && (
                          <p className="mt-1 text-sm text-red-600">{formik.errors.companySize}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="foundedYear" className="block text-sm font-medium text-gray-700">
                          Founded Year
                        </label>
                        <div className="mt-1">
                          <input
                            type="number"
                            name="foundedYear"
                            id="foundedYear"
                            min="1800"
                            max={new Date().getFullYear()}
                            value={formik.values.foundedYear}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            placeholder="2020"
                            className={`block w-full rounded-md shadow-sm sm:text-sm ${
                              formik.touched.foundedYear && formik.errors.foundedYear
                                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                            }`}
                          />
                        </div>
                        {formik.touched.foundedYear && formik.errors.foundedYear && (
                          <p className="mt-1 text-sm text-red-600">{formik.errors.foundedYear}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="workEnvironment" className="block text-sm font-medium text-gray-700">
                          Work Environment
                        </label>
                        <div className="mt-1">
                          <select
                            name="workEnvironment"
                            id="workEnvironment"
                            value={formik.values.workEnvironment}
                            onChange={formik.handleChange}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          >
                            <option value="">Select Environment</option>
                            {WORK_ENVIRONMENTS.map(env => (
                              <option key={env.value} value={env.value}>{env.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Website & Headquarters */}
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                          <GlobeAltIcon className="h-4 w-4 inline mr-1" />
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
                            placeholder="https://www.yourcompany.com"
                            className={`block w-full rounded-md shadow-sm sm:text-sm ${
                              formik.touched.website && formik.errors.website
                                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                            }`}
                          />
                        </div>
                        {formik.touched.website && formik.errors.website && (
                          <p className="mt-1 text-sm text-red-600">{formik.errors.website}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="headquartersLocation" className="block text-sm font-medium text-gray-700">
                          Headquarters Location
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            name="headquartersLocation"
                            id="headquartersLocation"
                            value={formik.values.headquartersLocation}
                            onChange={formik.handleChange}
                            placeholder="e.g., New York, NY, USA"
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                        </div>
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