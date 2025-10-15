import React, { useState, useRef, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useBranding } from '../../contexts/BrandingContext';
import { getAllCountries, getStatesForCountry, getCitiesForState } from '../../data/locationData';
import GooglePlacesAutocomplete from '../../components/GooglePlacesAutocomplete';
import { 
  CameraIcon, 
  InformationCircleIcon, 
  PlusIcon, 
  TrashIcon,
  BuildingOfficeIcon,
  GlobeAltIcon,
  StarIcon,
  SparklesIcon
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

// Comprehensive country list
const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda',
  'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas',
  'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize',
  'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil',
  'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon',
  'Canada', 'Cape Verde', 'Central African Republic', 'Chad', 'Chile', 'China',
  'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba',
  'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic',
  'East Timor', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea',
  'Estonia', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon',
  'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada',
  'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras',
  'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq',
  'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan',
  'Kazakhstan', 'Kenya', 'Kiribati', 'North Korea', 'South Korea', 'Kosovo',
  'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho',
  'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Macedonia',
  'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta',
  'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova',
  'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar',
  'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua',
  'Niger', 'Nigeria', 'Norway', 'Oman', 'Pakistan', 'Palau',
  'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines',
  'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda',
  'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines',
  'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal',
  'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia',
  'Solomon Islands', 'Somalia', 'South Africa', 'South Sudan', 'Spain', 'Sri Lanka',
  'Sudan', 'Suriname', 'Swaziland', 'Sweden', 'Switzerland', 'Syria',
  'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Togo', 'Tonga',
  'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda',
  'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay',
  'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam', 'Yemen',
  'Zambia', 'Zimbabwe'
].sort();

// Example suggestions for company specialties
const SPECIALTY_SUGGESTIONS = [
  'Digital Marketing', 'Web Development', 'E-commerce', 'Social Media Management',
  'Content Creation', 'SEO/SEM', 'Brand Strategy', 'Mobile App Development',
  'Data Analytics', 'Cloud Services', 'AI/Machine Learning', 'Cybersecurity',
  'Project Management', 'Customer Support', 'Sales', 'Business Development',
  'Graphic Design', 'Video Production', 'UX/UI Design', 'Consulting'
];

// Example suggestions for benefits & perks
const BENEFITS_SUGGESTIONS = [
  'Flexible Hours', 'Remote Work', 'Health Insurance', 'Paid Time Off',
  'Professional Development', 'Performance Bonuses', 'Equipment Provided',
  'Team Building Events', 'Career Growth', 'Work-Life Balance',
  'Competitive Salary', 'Commission Structure', 'Training Programs',
  'Mentorship', 'Parental Leave', 'Retirement Plan', 'Wellness Programs',
  'Internet Stipend', 'Home Office Setup', 'Conference Attendance'
];

// Example suggestions for company values
const VALUES_SUGGESTIONS = [
  'Innovation', 'Integrity', 'Excellence', 'Teamwork', 'Customer Focus',
  'Transparency', 'Accountability', 'Diversity & Inclusion', 'Sustainability',
  'Continuous Learning', 'Quality', 'Trust', 'Respect', 'Collaboration',
  'Entrepreneurship', 'Creativity', 'Passion', 'Results-Driven', 'Agility',
  'Social Responsibility', 'Work-Life Balance', 'Growth Mindset', 'Empowerment'
];

const validationSchema = Yup.object({
  // Basic Information
  contactName: Yup.string().required('Contact name is required'),
  company: Yup.string().required('Company name is required'),
  bio: Yup.string().required('Company description is required').min(100, 'Description must be at least 100 characters'),
  contactRole: Yup.string().required('Contact role is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  phone: Yup.string(),
  website: Yup.string()
    .test('valid-url', 'Must be a valid URL', function(value) {
      if (!value) return true; // Allow empty
      // Check if it's already a valid URL with protocol
      if (/^https?:\/\/.+/.test(value)) {
        return /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/.test(value);
      }
      // Check if it's a valid domain without protocol (we'll add https:// later)
      return /^(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/.test(value);
    }),
  
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
  const [linkedinFilled, setLinkedinFilled] = useState(false);
  const [showLinkedinSuccess, setShowLinkedinSuccess] = useState(false);
  const [availableStates, setAvailableStates] = useState([]);
  const [availableCities, setAvailableCities] = useState([]);

  // Fetch current business profile
  const { data: profile, isLoading } = useQuery(
    'businessProfile',
    async () => {
      const response = await api.get('/businesses/me');
      console.log('Business Profile Data:', response.data.data);
      console.log('Specialties:', response.data.data?.specialties);
      console.log('Benefits:', response.data.data?.benefits);
      console.log('Company Values:', response.data.data?.companyValues);
      return response.data.data;
    }
  );

  // Update profile mutation
  const updateProfileMutation = useMutation(
    async (data) => {
      console.log('Updating profile with data:', data);
      console.log('Specialties being sent:', data.specialties);
      console.log('Benefits being sent:', data.benefits);
      console.log('Company Values being sent:', data.companyValues);
      const response = await api.put('/businesses/me', data);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('businessProfile');
        queryClient.invalidateQueries(['profile', user?.id]);
        toast.success('Profile updated successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to update profile');
      },
    }
  );

  // If bio/contactName are still defaults from setup, show as placeholders
  const { user } = require('../../contexts/AuthContext').useAuth();
  const emailUsername = user?.email ? user.email.split('@')[0] : '';
  const isDefaultBio = profile?.bio === 'Tell us about your business...';
  const isDefaultCompany = !profile?.company || profile?.company === 'Your Company';
  const isDefaultContact = profile?.contactName === 'Primary Contact' || (emailUsername && profile?.contactName === emailUsername);

  const formik = useFormik({
    initialValues: {
      // Basic Information
      contactName: isDefaultContact ? '' : (profile?.contactName || ''),
      company: isDefaultCompany ? '' : (profile?.company || ''),
      bio: isDefaultBio ? '' : (profile?.bio || ''),
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
      
      // Email Notifications
      emailNotifications: {
        newMessages: profile?.emailNotifications?.newMessages ?? true,
        vaApplications: profile?.emailNotifications?.vaApplications ?? true,
        vaMatches: profile?.emailNotifications?.vaMatches ?? true,
        platformUpdates: profile?.emailNotifications?.platformUpdates ?? false,
        marketingEmails: profile?.emailNotifications?.marketingEmails ?? false,
        weeklyDigest: profile?.emailNotifications?.weeklyDigest ?? true
      },
      
      // Communication Preferences
      communicationPreferences: {
        preferredContactMethod: profile?.communicationPreferences?.preferredContactMethod || 'email',
        responseTime: profile?.communicationPreferences?.responseTime || 'within-24h',
        availableForInterviews: profile?.communicationPreferences?.availableForInterviews ?? true,
        allowDirectMessages: profile?.communicationPreferences?.allowDirectMessages ?? true,
        autoReplyEnabled: profile?.communicationPreferences?.autoReplyEnabled ?? false,
        autoReplyMessage: profile?.communicationPreferences?.autoReplyMessage || ''
      },
      
      // Privacy Settings
      privacySettings: {
        showEmail: profile?.privacySettings?.showEmail ?? false,
        showPhone: profile?.privacySettings?.showPhone ?? false,
        showLocation: profile?.privacySettings?.showLocation ?? true,
        showCompanySize: profile?.privacySettings?.showCompanySize ?? true,
        allowAnalytics: profile?.privacySettings?.allowAnalytics ?? true
      },
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      // Auto-prepend https:// to website if it doesn't have a protocol
      const processedValues = {
        ...values,
        website: values.website && !values.website.match(/^https?:\/\//) 
          ? `https://${values.website}` 
          : values.website
      };
      
      await updateProfileMutation.mutateAsync(processedValues);
    },
  });

  // Update states when country changes
  useEffect(() => {
    if (formik.values.country) {
      const states = getStatesForCountry(formik.values.country);
      setAvailableStates(states);
      // Reset state and city if country changed and no states available
      if (states.length === 0) {
        formik.setFieldValue('state', '');
        formik.setFieldValue('city', '');
        setAvailableCities([]);
      }
    } else {
      setAvailableStates([]);
      setAvailableCities([]);
    }
  }, [formik.values.country]);

  // Update cities when state changes
  useEffect(() => {
    if (formik.values.country && formik.values.state) {
      const cities = getCitiesForState(formik.values.country, formik.values.state);
      setAvailableCities(cities);
      // Only reset city if it's empty or if user is changing states manually (not from Google Places)
      // Keep the city value if it was set by Google Places
      if (cities.length > 0 && !formik.values.city) {
        // Don't reset if city has a value from Google Places
      } else if (cities.length > 0 && cities.includes(formik.values.city)) {
        // City is in the list, keep it
      } else if (cities.length === 0) {
        // No predefined cities for this state, keep whatever city value exists
      }
    } else {
      setAvailableCities([]);
    }
  }, [formik.values.state, formik.values.country]);

  // LinkedIn Auto-fill Effect (E Systems only)
  React.useEffect(() => {
    if (!branding.isESystemsMode || linkedinFilled) return;

    const urlParams = new URLSearchParams(window.location.search);
    const isLinkedInFlow = urlParams.get('linkedin') === 'true';
    const linkedinData = sessionStorage.getItem('linkedinProfile');

    if (isLinkedInFlow && linkedinData) {
      try {
        const profileData = JSON.parse(linkedinData);
        
        // Auto-fill the form with LinkedIn data
        formik.setValues({
          ...formik.values,
          ...profileData,
        });

        // Mark as LinkedIn filled and show success message
        setLinkedinFilled(true);
        setShowLinkedinSuccess(true);
        
        // Clear LinkedIn data from session
        sessionStorage.removeItem('linkedinProfile');
        
        // Show success toast
        toast.success('✨ Profile auto-filled from LinkedIn!', {
          position: 'top-center',
          autoClose: 5000,
        });

        // Hide success banner after 10 seconds
        setTimeout(() => setShowLinkedinSuccess(false), 10000);

        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (error) {
        console.error('Error auto-filling from LinkedIn:', error);
        toast.error('Failed to auto-fill from LinkedIn data');
      }
    }
  }, [branding.isESystemsMode, linkedinFilled, formik]);

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
                <div className="text-sm text-gray-700">Profile Completion</div>
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

          {/* LinkedIn Auto-fill Success Banner */}
          {showLinkedinSuccess && (
            <div className="mx-4 lg:mx-0">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <SparklesIcon className="h-6 w-6 text-green-500" />
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-sm font-medium text-green-800">
                      🎉 LinkedIn Profile Auto-filled Successfully!
                    </h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>
                        Your company information has been automatically populated from your LinkedIn profile. 
                        Please review and complete any missing information below.
                      </p>
                    </div>
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => setShowLinkedinSuccess(false)}
                        className="text-green-800 hover:text-green-600 text-sm underline"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={formik.handleSubmit} className="space-y-8">
            {/* 1. Company Header - Like LinkedIn's Intro/Header card */}
            <section className="bg-white shadow px-4 py-5 lg:rounded-lg sm:p-6">
              <div className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1">
                  <h2 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
                    <BuildingOfficeIcon className="h-5 w-5 mr-2 text-blue-500" />
                    Company Header
                  </h2>
                  <p className="mt-2 text-sm text-gray-700">
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
                          <p className="mt-2 text-xs text-gray-700">Recommended: 400x400px minimum</p>
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
                            type="text"
                            name="website"
                            id="website"
                            value={formik.values.website}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            placeholder="www.yourcompany.com"
                            className={`block w-full rounded-md shadow-sm sm:text-sm ${
                              formik.touched.website && formik.errors.website
                                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                            }`}
                          />
                          <p className="mt-1 text-xs text-gray-700">
                            No need to include https:// - we'll add it automatically
                          </p>
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

            {/* 2. About/Summary - Like LinkedIn's About section */}
            <section className="bg-white shadow px-4 py-5 lg:rounded-lg sm:p-6">
              <div className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1">
                  <h2 className="text-lg font-medium leading-6 text-gray-900">About Your Company</h2>
                  <p className="mt-2 text-sm text-gray-700">
                    Tell your company's story. This is like LinkedIn's About section.
                  </p>
                </div>
                <div className="mt-5 md:mt-0 md:col-span-2">
                  <div className="space-y-6">
                    {/* Company Description */}
                    <div>
                      <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                        Company Description *
                      </label>
                      <div className="mt-1">
                        <textarea
                          id="bio"
                          name="bio"
                          rows={6}
                          value={formik.values.bio}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          placeholder="Describe your company's mission, culture, values, and what makes you unique as an employer. Tell VAs why they should want to work with you..."
                          className={`block w-full rounded-md shadow-sm sm:text-sm ${
                            formik.touched.bio && formik.errors.bio
                              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                              : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                          }`}
                        />
                      </div>
                      <div className="mt-2 flex justify-between">
                        <p className="text-sm text-gray-700">
                          {formik.values.bio.length}/2600 characters (minimum 100)
                        </p>
                        <p className="text-sm text-gray-700">
                          {formik.values.bio.length >= 100 ? '✓' : '○'} Complete
                        </p>
                      </div>
                      {formik.touched.bio && formik.errors.bio && (
                        <p className="mt-1 text-sm text-red-600">{formik.errors.bio}</p>
                      )}
                    </div>

                    {/* Mission Statement */}
                    <div>
                      <label htmlFor="missionStatement" className="block text-sm font-medium text-gray-700">
                        Mission Statement
                      </label>
                      <div className="mt-1">
                        <textarea
                          id="missionStatement"
                          name="missionStatement"
                          rows={2}
                          value={formik.values.missionStatement}
                          onChange={formik.handleChange}
                          placeholder="Your company's mission in 1-2 sentences"
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    {/* Company Culture */}
                    <div>
                      <label htmlFor="companyCulture" className="block text-sm font-medium text-gray-700">
                        Company Culture
                      </label>
                      <div className="mt-1">
                        <textarea
                          id="companyCulture"
                          name="companyCulture"
                          rows={3}
                          value={formik.values.companyCulture}
                          onChange={formik.handleChange}
                          placeholder="Describe your company culture, work environment, and team dynamics"
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    {/* What You're Looking for in VAs */}
                    <div>
                      <label htmlFor="vaRequirements" className="block text-sm font-medium text-gray-700">
                        What We Look for in Virtual Assistants
                      </label>
                      <div className="mt-1">
                        <textarea
                          id="vaRequirements"
                          name="vaRequirements"
                          rows={3}
                          value={formik.values.vaRequirements}
                          onChange={formik.handleChange}
                          placeholder="Describe the skills, experience, and qualities you value in VAs"
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 4. Company Specialties - Like LinkedIn Skills */}
            <section className="bg-white shadow px-4 py-5 lg:rounded-lg sm:p-6">
              <div className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1">
                  <h2 className="text-lg font-medium leading-6 text-gray-900">Company Specialties</h2>
                  <p className="mt-2 text-sm text-gray-700">
                    What your company specializes in. Like LinkedIn skills for companies.
                  </p>
                </div>
                <div className="mt-5 md:mt-0 md:col-span-2">
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {formik.values.specialties?.map((specialty, index) => (
                        <div key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
                          {specialty}
                          <button
                            type="button"
                            onClick={() => removeArrayItem('specialties', index)}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            <TrashIcon className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex">
                      <input
                        type="text"
                        id="specialties-input"
                        placeholder="Add a specialty (e.g. Digital Marketing, Web Development)"
                        className="flex-1 rounded-l-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addArrayItem('specialties', e.target.value);
                            e.target.value = '';
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.getElementById('specialties-input');
                          if (input && input.value) {
                            addArrayItem('specialties', input.value);
                            input.value = '';
                          }
                        }}
                        className="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <PlusIcon className="h-4 w-4" />
                      </button>
                    </div>
                    {/* Suggestions */}
                    <div className="mt-3">
                      <p className="text-xs text-gray-700 mb-2">Suggestions (click to add):</p>
                      <div className="flex flex-wrap gap-1">
                        {SPECIALTY_SUGGESTIONS.filter(suggestion => 
                          !formik.values.specialties?.includes(suggestion)
                        ).map((suggestion, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => addArrayItem('specialties', suggestion)}
                            className="text-xs px-2 py-1 bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 rounded-full transition-colors"
                          >
                            + {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 5. Benefits & Perks */}
            <section className="bg-white shadow px-4 py-5 lg:rounded-lg sm:p-6">
              <div className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1">
                  <h2 className="text-lg font-medium leading-6 text-gray-900">Benefits & Perks</h2>
                  <p className="mt-2 text-sm text-gray-700">
                    What you offer to VAs beyond compensation.
                  </p>
                </div>
                <div className="mt-5 md:mt-0 md:col-span-2">
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {formik.values.benefits?.map((benefit, index) => (
                        <div key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center">
                          {benefit}
                          <button
                            type="button"
                            onClick={() => removeArrayItem('benefits', index)}
                            className="ml-2 text-green-600 hover:text-green-800"
                          >
                            <TrashIcon className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex">
                      <input
                        type="text"
                        id="benefits-input"
                        placeholder="Add a benefit (e.g. Flexible Hours, Professional Development)"
                        className="flex-1 rounded-l-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addArrayItem('benefits', e.target.value);
                            e.target.value = '';
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.getElementById('benefits-input');
                          if (input && input.value) {
                            addArrayItem('benefits', input.value);
                            input.value = '';
                          }
                        }}
                        className="bg-green-500 text-white px-4 py-2 rounded-r-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <PlusIcon className="h-4 w-4" />
                      </button>
                    </div>
                    {/* Suggestions */}
                    <div className="mt-3">
                      <p className="text-xs text-gray-700 mb-2">Suggestions (click to add):</p>
                      <div className="flex flex-wrap gap-1">
                        {BENEFITS_SUGGESTIONS.filter(suggestion => 
                          !formik.values.benefits?.includes(suggestion)
                        ).map((suggestion, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => addArrayItem('benefits', suggestion)}
                            className="text-xs px-2 py-1 bg-gray-100 hover:bg-green-100 text-gray-700 hover:text-green-700 rounded-full transition-colors"
                          >
                            + {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 6. Company Values */}
            <section className="bg-white shadow px-4 py-5 lg:rounded-lg sm:p-6">
              <div className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1">
                  <h2 className="text-lg font-medium leading-6 text-gray-900">Company Values</h2>
                  <p className="mt-2 text-sm text-gray-700">
                    Core values that guide your company culture.
                  </p>
                </div>
                <div className="mt-5 md:mt-0 md:col-span-2">
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {formik.values.companyValues?.map((value, index) => (
                        <div key={index} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center">
                          {value}
                          <button
                            type="button"
                            onClick={() => removeArrayItem('companyValues', index)}
                            className="ml-2 text-purple-600 hover:text-purple-800"
                          >
                            <TrashIcon className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex">
                      <input
                        type="text"
                        id="company-values-input"
                        placeholder="Add a company value (e.g. Innovation, Integrity, Collaboration)"
                        className="flex-1 rounded-l-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addArrayItem('companyValues', e.target.value);
                            e.target.value = '';
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.getElementById('company-values-input');
                          if (input && input.value) {
                            addArrayItem('companyValues', input.value);
                            input.value = '';
                          }
                        }}
                        className="bg-purple-500 text-white px-4 py-2 rounded-r-md hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <PlusIcon className="h-4 w-4" />
                      </button>
                    </div>
                    {/* Suggestions */}
                    <div className="mt-3">
                      <p className="text-xs text-gray-700 mb-2">Suggestions (click to add):</p>
                      <div className="flex flex-wrap gap-1">
                        {VALUES_SUGGESTIONS.filter(suggestion => 
                          !formik.values.companyValues?.includes(suggestion)
                        ).map((suggestion, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => addArrayItem('companyValues', suggestion)}
                            className="text-xs px-2 py-1 bg-gray-100 hover:bg-purple-100 text-gray-700 hover:text-purple-700 rounded-full transition-colors"
                          >
                            + {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 7. Social Media & Online Presence */}
            <section className="bg-white shadow px-4 py-5 lg:rounded-lg sm:p-6">
              <div className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1">
                  <h2 className="text-lg font-medium leading-6 text-gray-900">Social Media & Links</h2>
                  <p className="mt-2 text-sm text-gray-700">
                    Your company's online presence and social media profiles.
                  </p>
                </div>
                <div className="mt-5 md:mt-0 md:col-span-2">
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700">
                        LinkedIn Company Page
                      </label>
                      <div className="mt-1">
                        <input
                          type="url"
                          name="linkedin"
                          id="linkedin"
                          value={formik.values.linkedin}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          placeholder="https://linkedin.com/company/your-company"
                          className={`block w-full rounded-md shadow-sm sm:text-sm ${
                            formik.touched.linkedin && formik.errors.linkedin
                              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                              : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                          }`}
                        />
                      </div>
                      {formik.touched.linkedin && formik.errors.linkedin && (
                        <p className="mt-1 text-sm text-red-600">{formik.errors.linkedin}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="facebook" className="block text-sm font-medium text-gray-700">
                        Facebook Page
                      </label>
                      <div className="mt-1">
                        <input
                          type="url"
                          name="facebook"
                          id="facebook"
                          value={formik.values.facebook}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          placeholder="https://facebook.com/your-company"
                          className={`block w-full rounded-md shadow-sm sm:text-sm ${
                            formik.touched.facebook && formik.errors.facebook
                              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                              : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                          }`}
                        />
                      </div>
                      {formik.touched.facebook && formik.errors.facebook && (
                        <p className="mt-1 text-sm text-red-600">{formik.errors.facebook}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="twitter" className="block text-sm font-medium text-gray-700">
                        Twitter/X Profile
                      </label>
                      <div className="mt-1">
                        <input
                          type="url"
                          name="twitter"
                          id="twitter"
                          value={formik.values.twitter}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          placeholder="https://twitter.com/your-company"
                          className={`block w-full rounded-md shadow-sm sm:text-sm ${
                            formik.touched.twitter && formik.errors.twitter
                              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                              : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                          }`}
                        />
                      </div>
                      {formik.touched.twitter && formik.errors.twitter && (
                        <p className="mt-1 text-sm text-red-600">{formik.errors.twitter}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="instagram" className="block text-sm font-medium text-gray-700">
                        Instagram Profile
                      </label>
                      <div className="mt-1">
                        <input
                          type="url"
                          name="instagram"
                          id="instagram"
                          value={formik.values.instagram}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          placeholder="https://instagram.com/your-company"
                          className={`block w-full rounded-md shadow-sm sm:text-sm ${
                            formik.touched.instagram && formik.errors.instagram
                              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                              : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                          }`}
                        />
                      </div>
                      {formik.touched.instagram && formik.errors.instagram && (
                        <p className="mt-1 text-sm text-red-600">{formik.errors.instagram}</p>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="youtube" className="block text-sm font-medium text-gray-700">
                        YouTube Channel
                      </label>
                      <div className="mt-1">
                        <input
                          type="url"
                          name="youtube"
                          id="youtube"
                          value={formik.values.youtube}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          placeholder="https://youtube.com/your-company"
                          className={`block w-full rounded-md shadow-sm sm:text-sm ${
                            formik.touched.youtube && formik.errors.youtube
                              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                              : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                          }`}
                        />
                      </div>
                      {formik.touched.youtube && formik.errors.youtube && (
                        <p className="mt-1 text-sm text-red-600">{formik.errors.youtube}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. Contact Information */}
            <section className="bg-white shadow px-4 py-5 lg:rounded-lg sm:p-6">
              <div className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1">
                  <h2 className="text-lg font-medium leading-6 text-gray-900">Contact Information</h2>
                  <p className="mt-2 text-sm text-gray-700">
                    How VAs can reach you for opportunities.
                  </p>
                </div>
                <div className="mt-5 md:mt-0 md:col-span-2">
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="contactName" className="block text-sm font-medium text-gray-700">
                        Primary Contact Name *
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="contactName"
                          id="contactName"
                          value={formik.values.contactName}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          placeholder="John Smith"
                          className={`block w-full rounded-md shadow-sm sm:text-sm ${
                            formik.touched.contactName && formik.errors.contactName
                              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                              : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                          }`}
                        />
                      </div>
                      {formik.touched.contactName && formik.errors.contactName && (
                        <p className="mt-1 text-sm text-red-600">{formik.errors.contactName}</p>
                      )}
                    </div>

                    <div>
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
                          placeholder="e.g., CEO, HR Director, Operations Manager"
                          className={`block w-full rounded-md shadow-sm sm:text-sm ${
                            formik.touched.contactRole && formik.errors.contactRole
                              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                              : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                          }`}
                        />
                      </div>
                      {formik.touched.contactRole && formik.errors.contactRole && (
                        <p className="mt-1 text-sm text-red-600">{formik.errors.contactRole}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Business Email Address *
                      </label>
                      <div className="mt-1">
                        <input
                          type="email"
                          name="email"
                          id="email"
                          value={formik.values.email}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          placeholder="john@company.com"
                          className={`block w-full rounded-md shadow-sm sm:text-sm ${
                            formik.touched.email && formik.errors.email
                              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                              : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                          }`}
                        />
                      </div>
                      {formik.touched.email && formik.errors.email && (
                        <p className="mt-1 text-sm text-red-600">{formik.errors.email}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                        Business Phone Number
                      </label>
                      <div className="mt-1">
                        <input
                          type="tel"
                          name="phone"
                          id="phone"
                          value={formik.values.phone}
                          onChange={formik.handleChange}
                          placeholder="+1 (555) 123-4567"
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="workingHours" className="block text-sm font-medium text-gray-700">
                        Working Hours / Time Zone
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="workingHours"
                          id="workingHours"
                          value={formik.values.workingHours}
                          onChange={formik.handleChange}
                          placeholder="e.g., 9 AM - 5 PM EST, Monday - Friday"
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                  <h2 className="text-lg font-medium leading-6 text-gray-900">8. Office Location</h2>
                  <p className="mt-2 text-sm text-gray-700">Physical address (optional, for VAs who prefer local companies).</p>
                </div>
                <div className="mt-5 md:mt-0 md:col-span-2">
                  <div className="space-y-6">
                    {/* Google Places Autocomplete */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quick Address Search
                      </label>
                      <GooglePlacesAutocomplete
                        onPlaceSelected={(place) => {
                          // Auto-fill form fields with Google Places data
                          formik.setFieldValue('streetAddress', place.streetAddress);
                          formik.setFieldValue('city', place.city);
                          formik.setFieldValue('state', place.state);
                          formik.setFieldValue('country', place.country);
                          formik.setFieldValue('postalCode', place.postalCode);
                          
                          // Update available states and cities based on country
                          if (place.country) {
                            const states = getStatesForCountry(place.country);
                            setAvailableStates(states);
                            if (place.state) {
                              const cities = getCitiesForState(place.country, place.state);
                              setAvailableCities(cities);
                            }
                          }
                        }}
                        defaultValue={formik.values.streetAddress}
                        placeholder="Start typing your office address..."
                      />
                    </div>

                    {/* Divider */}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-gray-300" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-700">Or enter manually</span>
                      </div>
                    </div>

                    {/* Manual Entry Fields */}
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
                        {availableCities.length > 0 && !formik.values.city ? (
                          // Show dropdown only if no city is selected yet
                          <select
                            name="city"
                            id="city"
                            value={formik.values.city}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === "Other") {
                                // Switch to text input for custom city
                                setAvailableCities([]);
                                formik.setFieldValue('city', '');
                              } else {
                                formik.setFieldValue('city', value);
                              }
                            }}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                          >
                            <option value="">Select a city</option>
                            {availableCities.map(city => (
                              <option key={city} value={city}>
                                {city}
                              </option>
                            ))}
                            <option value="Other">Other (Enter manually)</option>
                          </select>
                        ) : (
                          // Show text input for custom cities or when Google Places fills it
                          <input
                            type="text"
                            name="city"
                            id="city"
                            value={formik.values.city}
                            onChange={formik.handleChange}
                            placeholder={formik.values.state ? "Enter city" : formik.values.country ? "Enter city" : "Select a country first"}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                            disabled={!formik.values.country}
                          />
                        )}
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                        State / Province
                      </label>
                      <div className="mt-1">
                        {availableStates.length > 0 ? (
                          <select
                            name="state"
                            id="state"
                            value={formik.values.state}
                            onChange={formik.handleChange}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                          >
                            <option value="">Select a state/province</option>
                            {availableStates.map(state => (
                              <option key={state} value={state}>
                                {state}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            name="state"
                            id="state"
                            value={formik.values.state}
                            onChange={formik.handleChange}
                            placeholder={formik.values.country ? "Enter state/province" : "Select a country first"}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                            disabled={!formik.values.country}
                          />
                        )}
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
                        <select
                          name="country"
                          id="country"
                          value={formik.values.country}
                          onChange={formik.handleChange}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                        >
                          <option value="">Select a country</option>
                          {COUNTRIES.map(country => (
                            <option key={country} value={country}>
                              {country}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Preferences - Enhanced Section */}
            <section className="bg-white shadow mt-8 px-4 py-5 lg:rounded-lg sm:p-6">
              <div className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Notification & Communication Preferences</h3>
                  <p className="mt-1 text-sm text-gray-700">Manage how you want to be contacted and what notifications you receive.</p>
                </div>
                <div className="mt-5 md:mt-0 md:col-span-2">
                  <div className="space-y-8">
                    
                    {/* Email Notifications */}
                    <div>
                      <h4 className="text-base font-medium text-gray-900 mb-4">Email Notifications</h4>
                      <div className="space-y-4">
                        <div className="flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              id="emailNotifications.newMessages"
                              name="emailNotifications.newMessages"
                              type="checkbox"
                              checked={formik.values.emailNotifications.newMessages}
                              onChange={formik.handleChange}
                              className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label htmlFor="emailNotifications.newMessages" className="font-medium text-gray-700">
                              New Messages
                            </label>
                            <p className="text-gray-700">Get notified when you receive new messages from VAs</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              id="emailNotifications.vaApplications"
                              name="emailNotifications.vaApplications"
                              type="checkbox"
                              checked={formik.values.emailNotifications.vaApplications}
                              onChange={formik.handleChange}
                              className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label htmlFor="emailNotifications.vaApplications" className="font-medium text-gray-700">
                              VA Applications
                            </label>
                            <p className="text-gray-700">Get notified when VAs apply to your job postings</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              id="emailNotifications.vaMatches"
                              name="emailNotifications.vaMatches"
                              type="checkbox"
                              checked={formik.values.emailNotifications.vaMatches}
                              onChange={formik.handleChange}
                              className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label htmlFor="emailNotifications.vaMatches" className="font-medium text-gray-700">
                              VA Matches
                            </label>
                            <p className="text-gray-700">Get notified when we find VAs that match your requirements</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              id="emailNotifications.weeklyDigest"
                              name="emailNotifications.weeklyDigest"
                              type="checkbox"
                              checked={formik.values.emailNotifications.weeklyDigest}
                              onChange={formik.handleChange}
                              className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label htmlFor="emailNotifications.weeklyDigest" className="font-medium text-gray-700">
                              Weekly Digest
                            </label>
                            <p className="text-gray-700">Receive a weekly summary of platform activity</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              id="emailNotifications.platformUpdates"
                              name="emailNotifications.platformUpdates"
                              type="checkbox"
                              checked={formik.values.emailNotifications.platformUpdates}
                              onChange={formik.handleChange}
                              className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label htmlFor="emailNotifications.platformUpdates" className="font-medium text-gray-700">
                              Platform Updates
                            </label>
                            <p className="text-gray-700">Get notified about new features and platform updates</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              id="emailNotifications.marketingEmails"
                              name="emailNotifications.marketingEmails"
                              type="checkbox"
                              checked={formik.values.emailNotifications.marketingEmails}
                              onChange={formik.handleChange}
                              className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label htmlFor="emailNotifications.marketingEmails" className="font-medium text-gray-700">
                              Marketing Emails
                            </label>
                            <p className="text-gray-700">Receive promotional offers and marketing communications</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Communication Preferences */}
                    <div>
                      <h4 className="text-base font-medium text-gray-900 mb-4">Communication Preferences</h4>
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="communicationPreferences.preferredContactMethod" className="block text-sm font-medium text-gray-700">
                            Preferred Contact Method
                          </label>
                          <div className="mt-1">
                            <select
                              id="communicationPreferences.preferredContactMethod"
                              name="communicationPreferences.preferredContactMethod"
                              value={formik.values.communicationPreferences.preferredContactMethod}
                              onChange={formik.handleChange}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            >
                              <option value="email">Email</option>
                              <option value="phone">Phone</option>
                              <option value="platform">Platform Messages</option>
                              <option value="any">Any Method</option>
                            </select>
                          </div>
                        </div>
                        
                        <div>
                          <label htmlFor="communicationPreferences.responseTime" className="block text-sm font-medium text-gray-700">
                            Expected Response Time
                          </label>
                          <div className="mt-1">
                            <select
                              id="communicationPreferences.responseTime"
                              name="communicationPreferences.responseTime"
                              value={formik.values.communicationPreferences.responseTime}
                              onChange={formik.handleChange}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            >
                              <option value="immediate">Immediate</option>
                              <option value="within-24h">Within 24 hours</option>
                              <option value="within-48h">Within 48 hours</option>
                              <option value="within-week">Within a week</option>
                            </select>
                          </div>
                        </div>
                        
                        <div className="flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              id="communicationPreferences.availableForInterviews"
                              name="communicationPreferences.availableForInterviews"
                              type="checkbox"
                              checked={formik.values.communicationPreferences.availableForInterviews}
                              onChange={formik.handleChange}
                              className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label htmlFor="communicationPreferences.availableForInterviews" className="font-medium text-gray-700">
                              Available for Interviews
                            </label>
                            <p className="text-gray-700">VAs can request interviews with you</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              id="communicationPreferences.allowDirectMessages"
                              name="communicationPreferences.allowDirectMessages"
                              type="checkbox"
                              checked={formik.values.communicationPreferences.allowDirectMessages}
                              onChange={formik.handleChange}
                              className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label htmlFor="communicationPreferences.allowDirectMessages" className="font-medium text-gray-700">
                              Allow Direct Messages
                            </label>
                            <p className="text-gray-700">VAs can send you direct messages through the platform</p>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex items-start">
                            <div className="flex items-center h-5">
                              <input
                                id="communicationPreferences.autoReplyEnabled"
                                name="communicationPreferences.autoReplyEnabled"
                                type="checkbox"
                                checked={formik.values.communicationPreferences.autoReplyEnabled}
                                onChange={formik.handleChange}
                                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                              />
                            </div>
                            <div className="ml-3 text-sm flex-1">
                              <label htmlFor="communicationPreferences.autoReplyEnabled" className="font-medium text-gray-700">
                                Enable Auto-Reply
                              </label>
                              <p className="text-gray-700">Automatically reply to new messages when you're unavailable</p>
                            </div>
                          </div>
                          {formik.values.communicationPreferences.autoReplyEnabled && (
                            <div className="mt-3 ml-7">
                              <label htmlFor="communicationPreferences.autoReplyMessage" className="block text-sm font-medium text-gray-700">
                                Auto-Reply Message
                              </label>
                              <textarea
                                id="communicationPreferences.autoReplyMessage"
                                name="communicationPreferences.autoReplyMessage"
                                rows={3}
                                value={formik.values.communicationPreferences.autoReplyMessage}
                                onChange={formik.handleChange}
                                placeholder="Thank you for your message. I'll get back to you within 24 hours."
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Privacy Settings */}
                    <div>
                      <h4 className="text-base font-medium text-gray-900 mb-4">Privacy Settings</h4>
                      <div className="space-y-4">
                        <div className="flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              id="privacySettings.showEmail"
                              name="privacySettings.showEmail"
                              type="checkbox"
                              checked={formik.values.privacySettings.showEmail}
                              onChange={formik.handleChange}
                              className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label htmlFor="privacySettings.showEmail" className="font-medium text-gray-700">
                              Show Email Address
                            </label>
                            <p className="text-gray-700">Display your email address on your public profile</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              id="privacySettings.showPhone"
                              name="privacySettings.showPhone"
                              type="checkbox"
                              checked={formik.values.privacySettings.showPhone}
                              onChange={formik.handleChange}
                              className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label htmlFor="privacySettings.showPhone" className="font-medium text-gray-700">
                              Show Phone Number
                            </label>
                            <p className="text-gray-700">Display your phone number on your public profile</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              id="privacySettings.showLocation"
                              name="privacySettings.showLocation"
                              type="checkbox"
                              checked={formik.values.privacySettings.showLocation}
                              onChange={formik.handleChange}
                              className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label htmlFor="privacySettings.showLocation" className="font-medium text-gray-700">
                              Show Company Location
                            </label>
                            <p className="text-gray-700">Display your company's location on your public profile</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              id="privacySettings.showCompanySize"
                              name="privacySettings.showCompanySize"
                              type="checkbox"
                              checked={formik.values.privacySettings.showCompanySize}
                              onChange={formik.handleChange}
                              className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label htmlFor="privacySettings.showCompanySize" className="font-medium text-gray-700">
                              Show Company Size
                            </label>
                            <p className="text-gray-700">Display your company size on your public profile</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              id="privacySettings.allowAnalytics"
                              name="privacySettings.allowAnalytics"
                              type="checkbox"
                              checked={formik.values.privacySettings.allowAnalytics}
                              onChange={formik.handleChange}
                              className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label htmlFor="privacySettings.allowAnalytics" className="font-medium text-gray-700">
                              Allow Analytics
                            </label>
                            <p className="text-gray-700">Help us improve the platform by sharing anonymous usage data</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Legacy Settings */}
                    <div>
                      <h4 className="text-base font-medium text-gray-900 mb-4">General Settings</h4>
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="vaNotifications" className="block text-sm font-medium text-gray-700">
                            New VA Notifications
                          </label>
                          <p className="text-sm text-gray-700">Get notified when new VAs join the platform</p>
                          <div className="mt-2">
                            <select
                              id="vaNotifications"
                              name="vaNotifications"
                              value={formik.values.vaNotifications}
                              onChange={formik.handleChange}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            >
                              <option value="no">No notifications</option>
                              <option value="daily">Daily digest</option>
                              <option value="weekly">Weekly digest</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              id="invisible"
                              name="invisible"
                              type="checkbox"
                              checked={formik.values.invisible}
                              onChange={formik.handleChange}
                              className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label htmlFor="invisible" className="font-medium text-gray-700">
                              Make my profile invisible
                            </label>
                            <p className="text-gray-700">Hide your profile from VAs</p>
                          </div>
                        </div>

                        <div className="flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              id="surveyRequestNotifications"
                              name="surveyRequestNotifications"
                              type="checkbox"
                              checked={formik.values.surveyRequestNotifications}
                              onChange={formik.handleChange}
                              className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label htmlFor="surveyRequestNotifications" className="font-medium text-gray-700">
                              Survey notifications
                            </label>
                            <p className="text-gray-700">Receive occasional surveys to help improve the platform</p>
                          </div>
                        </div>
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
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#ef8f00' }}
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