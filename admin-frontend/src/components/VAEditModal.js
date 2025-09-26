import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { XMarkIcon, PhotoIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { adminAPI } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

const VAEditModal = ({ isOpen, onClose, vaId, onSuccess }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Fetch complete VA profile
  useEffect(() => {
    const fetchVAProfile = async () => {
      if (!vaId || !isOpen) return;
      
      setIsLoading(true);
      try {
        console.log('Fetching VA profile for ID:', vaId);
        const response = await adminAPI.getVAFullProfile(vaId);
        console.log('VA Profile Response:', response.data);
        
        const data = response.data.data || response.data;
        
        // Initialize form with fetched data - ensure all fields are populated
        setFormData({
          // Basic Information
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          whatsapp: data.whatsapp || '',
          viber: data.viber || '',
          
          // Profile Content
          hero: data.hero || '',
          bio: data.bio || '',
          tagline: data.tagline || '',
          
          // Location
          location: data.location?._id || data.location || '',
          timezone: data.timezone || 'Asia/Manila',
          
          // Professional Information
          yearsOfExperience: data.yearsOfExperience || 0,
          industry: data.industry || '',
          skills: Array.isArray(data.skills) ? data.skills.join(', ') : (data.skills || ''),
          certifications: Array.isArray(data.certifications) ? data.certifications.join(', ') : (data.certifications || ''),
          languages: data.languages || [],
          portfolio: data.portfolio || [],
          
          // Rates
          preferredMinHourlyRate: data.preferredMinHourlyRate || 15,
          preferredMaxHourlyRate: data.preferredMaxHourlyRate || 50,
          preferredMinSalary: data.preferredMinSalary || 0,
          preferredMaxSalary: data.preferredMaxSalary || 0,
          
          // Availability
          availability: data.availability || 'full-time',
          workingHours: data.workingHours || {},
          
          // Social Links
          linkedin: data.linkedin || '',
          github: data.github || '',
          twitter: data.twitter || '',
          facebook: data.facebook || '',
          website: data.website || '',
          
          // Media
          avatar: data.avatar || '',
          coverImage: data.coverImage || '',
          introVideo: data.introVideo || '',
          videoTranscript: data.videoTranscript || '',
          
          // Admin Settings
          status: data.status || 'active',
          searchStatus: data.searchStatus || 'actively_looking',
          featured: data.featured || false,
          featuredUntil: data.featuredUntil || '',
          searchScore: data.searchScore || 0,
          responseRate: data.responseRate || 0,
          adminNotes: data.adminNotes || ''
        });
      } catch (error) {
        console.error('Error fetching VA profile:', error);
        toast.error('Failed to load VA profile');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchVAProfile();
  }, [vaId, isOpen]);

  // Update VA mutation
  const updateVAMutation = useMutation({
    mutationFn: async (data) => {
      const response = await adminAPI.updateVAFullProfile(vaId, data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Updated ${data.modifiedFields?.length || 0} fields successfully`);
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update VA profile');
    }
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    
    // Process form data
    const processedData = {
      ...formData,
      skills: formData.skills ? formData.skills.split(',').map(s => s.trim()).filter(s => s) : [],
      certifications: formData.certifications ? formData.certifications.split(',').map(s => s.trim()).filter(s => s) : []
    };

    // For now, send all data since we don't have the original to compare
    // In production, you might want to track original data separately
    updateVAMutation.mutate(processedData);
    setIsLoading(false);
  };

  const handleLanguageAdd = () => {
    const newLanguages = [...(formData.languages || []), { language: '', proficiency: 'basic' }];
    handleInputChange('languages', newLanguages);
  };

  const handleLanguageRemove = (index) => {
    const newLanguages = formData.languages.filter((_, i) => i !== index);
    handleInputChange('languages', newLanguages);
  };

  const handleLanguageChange = (index, field, value) => {
    const newLanguages = [...formData.languages];
    newLanguages[index][field] = value;
    handleInputChange('languages', newLanguages);
  };

  const handlePortfolioAdd = () => {
    const newPortfolio = [...(formData.portfolio || []), { title: '', description: '', url: '', image: '' }];
    handleInputChange('portfolio', newPortfolio);
  };

  const handlePortfolioRemove = (index) => {
    const newPortfolio = formData.portfolio.filter((_, i) => i !== index);
    handleInputChange('portfolio', newPortfolio);
  };

  const handlePortfolioChange = (index, field, value) => {
    const newPortfolio = [...formData.portfolio];
    newPortfolio[index][field] = value;
    handleInputChange('portfolio', newPortfolio);
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'professional', label: 'Professional' },
    { id: 'rates', label: 'Rates & Availability' },
    { id: 'social', label: 'Social & Links' },
    { id: 'media', label: 'Media' },
    { id: 'admin', label: 'Admin Settings' }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className={`absolute right-0 top-0 h-full w-full max-w-4xl shadow-xl ${
        isDark ? 'bg-[#374151]' : 'bg-white'
      }`}>
        <div className={`flex h-full flex-col va-edit-modal ${isDark ? 'dark-theme' : ''}`}>
          {/* Header */}
          <div className="bg-[#1e3a8a] border-b border-[#1e3a8a] px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">
                Edit VA Profile: {formData.name || 'Loading...'}
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
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">
                          Name *
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                          value={formData.name || ''}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                          value={formData.email || ''}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">
                          Phone
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                          value={formData.phone || ''}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">
                          WhatsApp
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                          value={formData.whatsapp || ''}
                          onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">
                          Viber
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                          value={formData.viber || ''}
                          onChange={(e) => handleInputChange('viber', e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">
                        Hero/Tagline
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                        value={formData.hero || ''}
                        onChange={(e) => handleInputChange('hero', e.target.value)}
                        placeholder="Professional tagline or hero text"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">
                        Bio *
                      </label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 resize-none"
                        rows={6}
                        value={formData.bio || ''}
                        onChange={(e) => handleInputChange('bio', e.target.value)}
                        placeholder="Professional biography"
                      />
                    </div>
                  </div>
                )}

                {/* Professional Tab */}
                {activeTab === 'professional' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Years of Experience
                        </label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                          value={formData.yearsOfExperience || ''}
                          onChange={(e) => handleInputChange('yearsOfExperience', parseInt(e.target.value))}
                          min="0"
                          max="50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Industry
                        </label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                          value={formData.industry || 'other'}
                          onChange={(e) => handleInputChange('industry', e.target.value)}
                        >
                          <option value="ecommerce">E-commerce</option>
                          <option value="real_estate">Real Estate</option>
                          <option value="digital_marketing">Digital Marketing</option>
                          <option value="social_media_management">Social Media Management</option>
                          <option value="customer_service">Customer Service</option>
                          <option value="bookkeeping">Bookkeeping</option>
                          <option value="content_creation">Content Creation</option>
                          <option value="graphic_design">Graphic Design</option>
                          <option value="virtual_assistance">Virtual Assistance</option>
                          <option value="data_entry">Data Entry</option>
                          <option value="lead_generation">Lead Generation</option>
                          <option value="email_marketing">Email Marketing</option>
                          <option value="amazon_fba">Amazon FBA</option>
                          <option value="shopify">Shopify</option>
                          <option value="wordpress">WordPress</option>
                          <option value="video_editing">Video Editing</option>
                          <option value="podcast_management">Podcast Management</option>
                          <option value="project_management">Project Management</option>
                          <option value="human_resources">Human Resources</option>
                          <option value="online_tutoring">Online Tutoring</option>
                          <option value="travel_planning">Travel Planning</option>
                          <option value="healthcare">Healthcare</option>
                          <option value="finance">Finance</option>
                          <option value="saas">SaaS</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Skills (comma-separated)
                      </label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                        rows={3}
                        value={formData.skills || ''}
                        onChange={(e) => handleInputChange('skills', e.target.value)}
                        placeholder="JavaScript, React, Node.js, MongoDB, etc."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Certifications (comma-separated)
                      </label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                        rows={2}
                        value={formData.certifications || ''}
                        onChange={(e) => handleInputChange('certifications', e.target.value)}
                        placeholder="AWS Certified, Google Analytics, etc."
                      />
                    </div>

                    {/* Languages */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Languages
                        </label>
                        <button
                          type="button"
                          onClick={handleLanguageAdd}
                          className="text-sm text-primary-600 hover:text-primary-700"
                        >
                          + Add Language
                        </button>
                      </div>
                      <div className="space-y-2">
                        {formData.languages?.map((lang, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="text"
                              className="admin-input flex-1"
                              placeholder="Language"
                              value={lang.language || ''}
                              onChange={(e) => handleLanguageChange(index, 'language', e.target.value)}
                            />
                            <select
                              className="admin-select w-40"
                              value={lang.proficiency || 'basic'}
                              onChange={(e) => handleLanguageChange(index, 'proficiency', e.target.value)}
                            >
                              <option value="native">Native</option>
                              <option value="fluent">Fluent</option>
                              <option value="conversational">Conversational</option>
                              <option value="basic">Basic</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => handleLanguageRemove(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Portfolio */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Portfolio Items
                        </label>
                        <button
                          type="button"
                          onClick={handlePortfolioAdd}
                          className="text-sm text-primary-600 hover:text-primary-700"
                        >
                          + Add Portfolio Item
                        </button>
                      </div>
                      <div className="space-y-3">
                        {formData.portfolio?.map((item, index) => (
                          <div key={index} className="border rounded-lg p-3 space-y-2">
                            <input
                              type="text"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                              placeholder="Title"
                              value={item.title || ''}
                              onChange={(e) => handlePortfolioChange(index, 'title', e.target.value)}
                            />
                            <textarea
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                              rows={2}
                              placeholder="Description"
                              value={item.description || ''}
                              onChange={(e) => handlePortfolioChange(index, 'description', e.target.value)}
                            />
                            <input
                              type="url"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                              placeholder="URL"
                              value={item.url || ''}
                              onChange={(e) => handlePortfolioChange(index, 'url', e.target.value)}
                            />
                            <input
                              type="url"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                              placeholder="Image URL"
                              value={item.image || ''}
                              onChange={(e) => handlePortfolioChange(index, 'image', e.target.value)}
                            />
                            <button
                              type="button"
                              onClick={() => handlePortfolioRemove(index)}
                              className="text-sm text-red-600 hover:text-red-700"
                            >
                              Remove Item
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Rates & Availability Tab */}
                {activeTab === 'rates' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Min Hourly Rate ($)
                        </label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                          value={formData.preferredMinHourlyRate || ''}
                          onChange={(e) => handleInputChange('preferredMinHourlyRate', parseFloat(e.target.value))}
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Max Hourly Rate ($)
                        </label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                          value={formData.preferredMaxHourlyRate || ''}
                          onChange={(e) => handleInputChange('preferredMaxHourlyRate', parseFloat(e.target.value))}
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Min Monthly Salary ($)
                        </label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                          value={formData.preferredMinSalary || ''}
                          onChange={(e) => handleInputChange('preferredMinSalary', parseFloat(e.target.value))}
                          min="0"
                          step="1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Max Monthly Salary ($)
                        </label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                          value={formData.preferredMaxSalary || ''}
                          onChange={(e) => handleInputChange('preferredMaxSalary', parseFloat(e.target.value))}
                          min="0"
                          step="1"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Availability
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                        value={formData.availability || 'immediately'}
                        onChange={(e) => handleInputChange('availability', e.target.value)}
                      >
                        <option value="immediately">Immediately</option>
                        <option value="within_week">Within a Week</option>
                        <option value="within_month">Within a Month</option>
                        <option value="not_available">Not Available</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Timezone
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                          value={formData.workingHours?.timezone || ''}
                          onChange={(e) => handleInputChange('workingHours', { ...formData.workingHours, timezone: e.target.value })}
                          placeholder="e.g., EST, PST, Asia/Manila"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Preferred Hours
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                          value={formData.workingHours?.preferredHours || ''}
                          onChange={(e) => handleInputChange('workingHours', { ...formData.workingHours, preferredHours: e.target.value })}
                          placeholder="e.g., 9AM-5PM EST"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Social & Links Tab */}
                {activeTab === 'social' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Website
                        </label>
                        <input
                          type="url"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                          value={formData.website || ''}
                          onChange={(e) => handleInputChange('website', e.target.value)}
                          placeholder="https://example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          LinkedIn
                        </label>
                        <input
                          type="url"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                          value={formData.linkedin || ''}
                          onChange={(e) => handleInputChange('linkedin', e.target.value)}
                          placeholder="https://linkedin.com/in/username"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          GitHub
                        </label>
                        <input
                          type="url"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                          value={formData.github || ''}
                          onChange={(e) => handleInputChange('github', e.target.value)}
                          placeholder="https://github.com/username"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          GitLab
                        </label>
                        <input
                          type="url"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                          value={formData.gitlab || ''}
                          onChange={(e) => handleInputChange('gitlab', e.target.value)}
                          placeholder="https://gitlab.com/username"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Twitter
                        </label>
                        <input
                          type="url"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                          value={formData.twitter || ''}
                          onChange={(e) => handleInputChange('twitter', e.target.value)}
                          placeholder="https://twitter.com/username"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Instagram
                        </label>
                        <input
                          type="url"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                          value={formData.instagram || ''}
                          onChange={(e) => handleInputChange('instagram', e.target.value)}
                          placeholder="https://instagram.com/username"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Stack Overflow
                        </label>
                        <input
                          type="url"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                          value={formData.stackoverflow || ''}
                          onChange={(e) => handleInputChange('stackoverflow', e.target.value)}
                          placeholder="https://stackoverflow.com/users/..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Scheduling Link
                        </label>
                        <input
                          type="url"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                          value={formData.schedulingLink || ''}
                          onChange={(e) => handleInputChange('schedulingLink', e.target.value)}
                          placeholder="https://calendly.com/username"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Media Tab */}
                {activeTab === 'media' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Profile Avatar
                      </label>
                      <div className="space-y-3">
                        {/* Current Avatar Preview */}
                        <div className="flex items-center space-x-4">
                          {formData.avatar ? (
                            <img
                              src={formData.avatar}
                              alt="Current avatar"
                              className="h-24 w-24 rounded-full object-cover border-2 border-admin-200"
                            />
                          ) : (
                            <div className="h-24 w-24 rounded-full bg-admin-100 flex items-center justify-center border-2 border-admin-200">
                              <PhotoIcon className="h-12 w-12 text-admin-400" />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="text-sm text-admin-600 mb-2">
                              Upload a new image or enter a URL
                            </p>
                            <div className="flex gap-2">
                              <label className="cursor-pointer inline-flex items-center px-3 py-2 border border-admin-300 rounded-md shadow-sm text-sm font-medium text-admin-700 bg-white hover:bg-admin-50 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                                <PhotoIcon className="h-4 w-4 mr-2" />
                                Choose File
                                <input
                                  type="file"
                                  className="sr-only"
                                  accept="image/*"
                                  onChange={async (e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                      try {
                                        // Validate file size (5MB limit for profile images)
                                        if (file.size > 5 * 1024 * 1024) {
                                          toast.error('Avatar image must be under 5MB');
                                          return;
                                        }

                                        // Validate file type
                                        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
                                        if (!allowedTypes.includes(file.type)) {
                                          toast.error('Avatar must be a JPEG, PNG, WebP, or GIF image');
                                          return;
                                        }

                                        // Show loading state
                                        toast.info('Uploading avatar...');

                                        // Create FormData for Supabase upload
                                        const formData = new FormData();
                                        formData.append('avatar', file);

                                        // Upload via admin API endpoint
                                        const response = await adminAPI.updateVAMedia(vaId, formData);
                                        
                                        if (response.data.success) {
                                          const avatarUrl = response.data.data.avatar;
                                          handleInputChange('avatar', avatarUrl);
                                          toast.success('Avatar uploaded successfully');
                                        } else {
                                          throw new Error(response.data.error || 'Upload failed');
                                        }

                                      } catch (error) {
                                        console.error('Avatar upload error:', error);
                                        toast.error(error.response?.data?.error || error.message || 'Failed to upload avatar');
                                      }
                                    }
                                  }}
                                />
                              </label>
                              {formData.avatar && (
                                <button
                                  type="button"
                                  onClick={() => handleInputChange('avatar', '')}
                                  className="inline-flex items-center px-3 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* URL Input */}
                        <div>
                          <label className="block text-xs font-medium text-admin-600 mb-1">
                            Or enter image URL directly:
                          </label>
                          <input
                            type="url"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                            value={formData.avatar || ''}
                            onChange={(e) => handleInputChange('avatar', e.target.value)}
                            placeholder="https://example.com/avatar.jpg"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Cover Image URL
                      </label>
                      <div className="flex items-center space-x-4">
                        <input
                          type="url"
                          className="admin-input flex-1"
                          value={formData.coverImage || ''}
                          onChange={(e) => handleInputChange('coverImage', e.target.value)}
                          placeholder="https://example.com/cover.jpg"
                        />
                        {formData.coverImage && (
                          <img
                            src={formData.coverImage}
                            alt="Cover preview"
                            className="h-12 w-20 rounded object-cover"
                          />
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Video Introduction URL
                      </label>
                      <input
                        type="url"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                        value={formData.videoIntroduction || ''}
                        onChange={(e) => handleInputChange('videoIntroduction', e.target.value)}
                        placeholder="https://example.com/intro-video.mp4"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Video Transcription
                      </label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                        rows={4}
                        value={formData.videoTranscription || ''}
                        onChange={(e) => handleInputChange('videoTranscription', e.target.value)}
                        placeholder="Transcribed text from video introduction"
                      />
                    </div>
                  </div>
                )}

                {/* Admin Settings Tab */}
                {activeTab === 'admin' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Profile Status
                        </label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                          value={formData.status || 'approved'}
                          onChange={(e) => handleInputChange('status', e.target.value)}
                        >
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                          <option value="suspended">Suspended</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Search Status
                        </label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                          value={formData.searchStatus || 'open'}
                          onChange={(e) => handleInputChange('searchStatus', e.target.value)}
                        >
                          <option value="actively_looking">Actively Looking</option>
                          <option value="open">Open to Opportunities</option>
                          <option value="not_interested">Not Interested</option>
                          <option value="invisible">Invisible</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Search Score
                        </label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                          value={formData.searchScore || 0}
                          onChange={(e) => handleInputChange('searchScore', parseInt(e.target.value))}
                          min="0"
                          max="100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Response Rate (%)
                        </label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                          value={formData.responseRate || 0}
                          onChange={(e) => handleInputChange('responseRate', parseInt(e.target.value))}
                          min="0"
                          max="100"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Conversations Count
                        </label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                          value={formData.conversationsCount || 0}
                          onChange={(e) => handleInputChange('conversationsCount', parseInt(e.target.value))}
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Featured Date
                        </label>
                        <input
                          type="datetime-local"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                          value={formData.featuredAt ? new Date(formData.featuredAt).toISOString().slice(0, 16) : ''}
                          onChange={(e) => handleInputChange('featuredAt', e.target.value ? new Date(e.target.value).toISOString() : null)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          checked={formData.sourceContributor || false}
                          onChange={(e) => handleInputChange('sourceContributor', e.target.checked)}
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Source Contributor</span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          checked={formData.productAnnouncementNotifications || false}
                          onChange={(e) => handleInputChange('productAnnouncementNotifications', e.target.checked)}
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Product Announcement Notifications</span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          checked={formData.profileReminderNotifications || false}
                          onChange={(e) => handleInputChange('profileReminderNotifications', e.target.checked)}
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Profile Reminder Notifications</span>
                      </label>
                    </div>

                    {/* Read-only fields */}
                    <div className="border-t pt-4">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Read-only Information</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Public Profile Key:</span>
                          <span className="ml-2 font-mono">{formData.publicProfileKey}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Completion:</span>
                          <span className="ml-2">{formData.completionPercentage}%</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Created:</span>
                          <span className="ml-2">{new Date(formData.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Last Updated:</span>
                          <span className="ml-2">{new Date(formData.profileUpdatedAt || formData.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
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
                disabled={isLoading || updateVAMutation.isLoading}
                className="admin-button-primary"
              >
                {isLoading || updateVAMutation.isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VAEditModal;