import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { XMarkIcon, PhotoIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { adminAPI } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

const BusinessEditModal = ({ isOpen, onClose, businessId, onSuccess }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Fetch complete Business profile
  useEffect(() => {
    const fetchBusinessProfile = async () => {
      if (!businessId || !isOpen) return;
      
      setIsLoading(true);
      try {
        console.log('Fetching Business profile for ID:', businessId);
        const response = await adminAPI.getBusinessFullProfile(businessId);
        console.log('Business Profile Response:', response.data);
        
        const data = response.data.data || response.data;
        
        // Initialize form with fetched data
        setFormData({
          company: data.company || '',
          contactName: data.contactName || '',
          contactRole: data.contactRole || '',
          email: data.email || '',
          phone: data.phone || '',
          bio: data.bio || '',
          website: data.website || '',
          missionStatement: data.missionStatement || '',
          vaRequirements: data.vaRequirements || '',
          companyCulture: data.companyCulture || '',
          streetAddress: data.streetAddress || '',
          city: data.city || '',
          state: data.state || '',
          postalCode: data.postalCode || '',
          country: data.country || '',
          headquartersLocation: data.headquartersLocation || '',
          companySize: data.companySize || '',
          industry: data.industry || '',
          foundedYear: data.foundedYear || '',
          employeeCount: data.employeeCount || 0,
          workEnvironment: data.workEnvironment || 'onsite',
          workingHours: data.workingHours || '',
          specialties: Array.isArray(data.specialties) ? data.specialties.join(', ') : (data.specialties || ''),
          benefits: Array.isArray(data.benefits) ? data.benefits.join(', ') : (data.benefits || ''),
          certifications: Array.isArray(data.certifications) ? data.certifications.join(', ') : (data.certifications || ''),
          awards: Array.isArray(data.awards) ? data.awards.join(', ') : (data.awards || ''),
          companyValues: Array.isArray(data.companyValues) ? data.companyValues.join(', ') : (data.companyValues || ''),
          languages: Array.isArray(data.languages) ? data.languages.join(', ') : (data.languages || ''),
          linkedin: data.linkedin || '',
          facebook: data.facebook || '',
          twitter: data.twitter || '',
          instagram: data.instagram || '',
          youtube: data.youtube || '',
          vaNotifications: data.vaNotifications || 'no',
          invisible: data.invisible || false,
          status: data.status || 'approved',
          surveyRequestNotifications: data.surveyRequestNotifications !== false,
          emailNotifications: data.emailNotifications || {
            newMessages: true,
            vaApplications: true,
            vaMatches: true,
            platformUpdates: false,
            marketingEmails: false,
            weeklyDigest: true
          },
          communicationPreferences: data.communicationPreferences || {
            preferredContactMethod: 'email',
            responseTime: 'within-24h',
            availableForInterviews: true,
            allowDirectMessages: true,
            autoReplyEnabled: false,
            autoReplyMessage: ''
          },
          privacySettings: data.privacySettings || {
            showEmail: false,
            showPhone: false,
            showLocation: true,
            showCompanySize: true,
            allowAnalytics: true
          },
          avatar: data.avatar || '',
          conversationsCount: data.conversationsCount || 0
        });
      } catch (error) {
        console.error('Error fetching Business profile:', error);
        toast.error('Failed to load Business profile');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBusinessProfile();
  }, [businessId, isOpen]);

  // Update Business mutation
  const updateBusinessMutation = useMutation({
    mutationFn: async (data) => {
      const response = await adminAPI.updateBusinessFullProfile(businessId, data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Updated ${data.modifiedFields?.length || 0} fields successfully`);
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update Business profile');
    }
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedChange = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    
    // Process form data - convert comma-separated strings to arrays
    const processedData = {
      ...formData,
      specialties: formData.specialties ? formData.specialties.split(',').map(s => s.trim()).filter(s => s) : [],
      benefits: formData.benefits ? formData.benefits.split(',').map(s => s.trim()).filter(s => s) : [],
      certifications: formData.certifications ? formData.certifications.split(',').map(s => s.trim()).filter(s => s) : [],
      awards: formData.awards ? formData.awards.split(',').map(s => s.trim()).filter(s => s) : [],
      companyValues: formData.companyValues ? formData.companyValues.split(',').map(s => s.trim()).filter(s => s) : [],
      languages: formData.languages ? formData.languages.split(',').map(s => s.trim()).filter(s => s) : []
    };

    updateBusinessMutation.mutate(processedData);
    setIsLoading(false);
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'details', label: 'Company Details' },
    { id: 'location', label: 'Location' },
    { id: 'social', label: 'Social & Media' },
    { id: 'preferences', label: 'Preferences' },
    { id: 'admin', label: 'Admin Settings' }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className={`absolute right-0 top-0 h-full w-full max-w-4xl shadow-xl ${
        isDark ? 'bg-[#374151]' : 'bg-white'
      }`}>
        <div className={`flex h-full flex-col business-edit-modal ${isDark ? 'dark-theme' : ''}`}>
          {/* Header */}
          <div className="bg-[#1e3a8a] border-b border-[#1e3a8a] px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">
                Edit Business Profile: {formData.company || 'Loading...'}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-200 hover:text-white transition-colors duration-200"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            {/* Tabs */}
            <div className="mt-4 flex space-x-4 overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap pb-2 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'border-blue-300 text-white'
                      : 'border-transparent text-blue-200 hover:text-white hover:border-blue-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="admin-loading"></div>
              </div>
            ) : (
              <>
                {/* Basic Info Tab */}
                {activeTab === 'basic' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Company Name *
                        </label>
                        <input
                          type="text"
                          value={formData.company || ''}
                          onChange={(e) => handleInputChange('company', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Contact Name *
                        </label>
                        <input
                          type="text"
                          value={formData.contactName || ''}
                          onChange={(e) => handleInputChange('contactName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value={formData.email || ''}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={formData.phone || ''}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Industry
                      </label>
                      <input
                        type="text"
                        value={formData.industry || ''}
                        onChange={(e) => handleInputChange('industry', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                        placeholder="e.g., Technology, Healthcare"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Website
                      </label>
                      <input
                        type="url"
                        value={formData.website || ''}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                        placeholder="https://example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Company Bio *
                      </label>
                      <textarea
                        value={formData.bio || ''}
                        onChange={(e) => handleInputChange('bio', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 resize-none"
                        rows="4"
                      />
                    </div>
                  </div>
                )}

                {/* Company Details Tab */}
                {activeTab === 'details' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Mission Statement
                      </label>
                      <textarea
                        value={formData.missionStatement || ''}
                        onChange={(e) => handleInputChange('missionStatement', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 resize-none"
                        rows="3"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        VA Requirements
                      </label>
                      <textarea
                        value={formData.vaRequirements || ''}
                        onChange={(e) => handleInputChange('vaRequirements', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 resize-none"
                        rows="3"
                        placeholder="What you're looking for in a VA"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Company Size
                      </label>
                      <select
                        value={formData.companySize || ''}
                        onChange={(e) => handleInputChange('companySize', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                      >
                        <option value="">Select size</option>
                        <option value="1-10">1-10 employees</option>
                        <option value="11-50">11-50 employees</option>
                        <option value="51-200">51-200 employees</option>
                        <option value="201-500">201-500 employees</option>
                        <option value="501-1000">501-1000 employees</option>
                        <option value="1000+">1000+ employees</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Location Tab */}
                {activeTab === 'location' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Street Address
                      </label>
                      <input
                        type="text"
                        value={formData.streetAddress || ''}
                        onChange={(e) => handleInputChange('streetAddress', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          value={formData.city || ''}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          State/Province
                        </label>
                        <input
                          type="text"
                          value={formData.state || ''}
                          onChange={(e) => handleInputChange('state', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Country
                        </label>
                        <input
                          type="text"
                          value={formData.country || ''}
                          onChange={(e) => handleInputChange('country', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Postal Code
                        </label>
                        <input
                          type="text"
                          value={formData.postalCode || ''}
                          onChange={(e) => handleInputChange('postalCode', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Social & Media Tab */}
                {activeTab === 'social' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        LinkedIn
                      </label>
                      <input
                        type="url"
                        value={formData.linkedin || ''}
                        onChange={(e) => handleInputChange('linkedin', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                        placeholder="https://linkedin.com/company/..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Facebook
                      </label>
                      <input
                        type="url"
                        value={formData.facebook || ''}
                        onChange={(e) => handleInputChange('facebook', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                        placeholder="https://facebook.com/..."
                      />
                    </div>
                  </div>
                )}

                {/* Preferences Tab */}
                {activeTab === 'preferences' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        VA Notifications
                      </label>
                      <select
                        value={formData.vaNotifications || ''}
                        onChange={(e) => handleInputChange('vaNotifications', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                      >
                        <option value="no">No notifications</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Admin Settings Tab */}
                {activeTab === 'admin' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Account Status
                      </label>
                      <select
                        value={formData.status || ''}
                        onChange={(e) => handleInputChange('status', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                      >
                        <option value="approved">Approved</option>
                        <option value="suspended">Suspended</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>

                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.invisible || false}
                          onChange={(e) => handleInputChange('invisible', e.target.checked)}
                          className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Invisible (Hide from public listings)
                        </span>
                      </label>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className={`border-t px-6 py-4 ${
            isDark ? 'border-gray-600' : 'border-gray-200'
          }`}>
            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="admin-button-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading || updateBusinessMutation.isLoading}
                className="admin-button-primary"
              >
                {isLoading || updateBusinessMutation.isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessEditModal;