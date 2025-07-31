import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery } from 'react-query';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useBranding } from '../../contexts/BrandingContext';
import { 
  MapPinIcon, 
  BriefcaseIcon, 
  CurrencyDollarIcon,
  EnvelopeIcon,
  PhoneIcon,
  GlobeAltIcon,
  CalendarIcon,
  CheckCircleIcon,
  ChatBubbleLeftIcon,
  ShareIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

export default function VADetail() {
  const { id } = useParams();
  const { user, isBusiness } = useAuth();
  const { branding } = useBranding();
  const [shareUrl, setShareUrl] = useState(null);
  const [isCreatingShare, setIsCreatingShare] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const { data: va, isLoading, error } = useQuery(
    ['va', id],
    async () => {
      const response = await api.get(`/vas/${id}`);
      return response.data.data;
    }
  );

  const handleStartConversation = async () => {
    // This would open a modal or redirect to start a conversation
    console.log('Start conversation with VA:', id);
  };

  const handleCreateShareUrl = async () => {
    if (!user) {
      toast.error('Please log in to create a shareable link');
      return;
    }

    setIsCreatingShare(true);
    try {
      const response = await api.post(`/shorturls/vas/${id}`);
      setShareUrl(response.data.data.fullShortUrl);
      setShowShareModal(true);
      toast.success('Shareable link created successfully!');
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.shortUrl) {
        // URL already exists
        setShareUrl(error.response.data.shortUrl.fullShortUrl || 
          `${window.location.origin}/s/${error.response.data.shortUrl.shortCode}`);
        setShowShareModal(true);
      } else {
        toast.error(error.response?.data?.error || 'Failed to create shareable link');
      }
    } finally {
      setIsCreatingShare(false);
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error || !va) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">{branding.isESystemsMode ? 'Team member not found' : 'VA not found'}</h3>
          <div className="mt-2">
            <Link to="/vas" className="text-gray-600 hover:text-gray-500">
              {branding.isESystemsMode ? 'Back to team members' : 'Back to VAs'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{va.name} - {branding.name}</title>
        <meta name="description" content={va.bio?.substring(0, 160)} />
      </Helmet>

      <div className="bg-white">
        {/* Cover Image */}
        <div className="relative h-48 sm:h-64 lg:h-80">
          <img
            className="w-full h-full object-cover"
            src={va.coverImage || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=300&fit=crop'}
            alt="Cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        </div>

        {/* Header */}
        <div className="relative -mt-8 sm:-mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="md:flex md:items-end md:justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-end">
                  {va.avatar ? (
                    <img
                      className="h-24 w-24 sm:h-32 sm:w-32 rounded-full border-4 border-white shadow-lg"
                      src={va.avatar}
                      alt={va.name}
                    />
                  ) : (
                    <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full bg-gray-300 border-4 border-white shadow-lg flex items-center justify-center">
                      <span className="text-3xl font-medium text-gray-700">
                        {va.name?.[0]?.toUpperCase() || (branding.isESystemsMode ? 'P' : 'V')}
                      </span>
                    </div>
                  )}
                  <div className="ml-4 pb-4">
                    <div className="bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-sm">
                      <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                        {va.name}
                      </h1>
                      <p className="text-sm text-gray-600">{va.hero}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex md:mt-0 md:ml-4 pb-4 space-x-3">
                {user && va?.user === user.id && (
                  <button
                    onClick={handleCreateShareUrl}
                    disabled={isCreatingShare}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                  >
                    <ShareIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                    {isCreatingShare ? 'Creating...' : 'Share Profile'}
                  </button>
                )}
                {isBusiness && (
                  <button
                    onClick={handleStartConversation}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    <EnvelopeIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                    {branding.isESystemsMode ? 'Contact Professional' : 'Start Conversation'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>



        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Status */}
              {va.searchStatus && (
                <div className="bg-white shadow rounded-lg p-6 mb-6">
                  <div className="flex justify-center">
                    {va.searchStatus === 'actively_looking' && (
                      <span className="inline-flex items-center px-4 py-2 rounded-full text-base font-semibold bg-green-100 text-green-800 border-2 border-green-200 shadow-sm">
                        <CheckCircleIcon className="h-5 w-5 mr-2 text-green-600" />
                        {branding.isESystemsMode ? 'Available immediately' : 'Actively looking for opportunities'}
                      </span>
                    )}
                    {va.searchStatus === 'open' && (
                      <span className="inline-flex items-center px-4 py-2 rounded-full text-base font-semibold bg-blue-100 text-blue-800 border-2 border-blue-200 shadow-sm">
                        <CheckCircleIcon className="h-5 w-5 mr-2 text-blue-600" />
                        {branding.isESystemsMode ? 'Open to new projects' : 'Open to opportunities'}
                      </span>
                    )}
                    {va.searchStatus === 'not_interested' && (
                      <span className="inline-flex items-center px-4 py-2 rounded-full text-base font-semibold bg-gray-100 text-gray-800 border-2 border-gray-200 shadow-sm">
                        <CheckCircleIcon className="h-5 w-5 mr-2 text-gray-600" />
                        Not currently available
                      </span>
                    )}
                    {va.searchStatus === 'invisible' && (
                      <span className="inline-flex items-center px-4 py-2 rounded-full text-base font-semibold bg-yellow-100 text-yellow-800 border-2 border-yellow-200 shadow-sm">
                        <CheckCircleIcon className="h-5 w-5 mr-2 text-yellow-600" />
                        Profile hidden
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Bio */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">About</h2>
                <div className="prose prose-sm text-gray-500">
                  <p>{va.bio}</p>
                </div>
              </div>

              {/* Video Introduction */}
              {va.videoIntroduction && (
                <div className="bg-white shadow rounded-lg p-6 mt-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Video Introduction</h2>
                  <video controls className="w-full rounded-lg">
                    <source src={va.videoIntroduction} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}


            </div>

            {/* Sidebar */}
            <div className="mt-8 lg:mt-0">
              {/* Details Card */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Details</h3>
                <dl className="space-y-3">
                  {va.location && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        Location
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {va.location.city}{va.location.state ? `, ${va.location.state}` : ''}, Philippines
                      </dd>
                    </div>
                  )}

                  {(va.preferredMinHourlyRate || va.preferredMinSalary) && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                        Rate
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {va.preferredMinHourlyRate && va.preferredMaxHourlyRate
                          ? `$${va.preferredMinHourlyRate}-${va.preferredMaxHourlyRate}/hr`
                          : va.preferredMinSalary && va.preferredMaxSalary
                          ? `$${va.preferredMinSalary}-${va.preferredMaxSalary}/mo`
                          : 'Rate negotiable'}
                      </dd>
                    </div>
                  )}

                  {va.roleType && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <BriefcaseIcon className="h-4 w-4 mr-1" />
                        Availability
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {Object.entries(va.roleType || {})
                          .filter(([key, value]) => value === true && key !== '_id')
                          .map(([key]) => key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
                          .join(', ') || 'Not specified'}
                      </dd>
                    </div>
                  )}

                  {va.roleLevel && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Experience Level</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {Object.entries(va.roleLevel || {})
                          .filter(([key, value]) => value === true && key !== '_id')
                          .map(([key]) => key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
                          .join(', ') || 'Not specified'}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Skills */}
              {va.specialties?.length > 0 && (
                <div className="bg-white shadow rounded-lg p-6 mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {va.specialties.map((specialty) => (
                      <span
                        key={specialty._id}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        {specialty.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Online Presence */}
              <div className="bg-white shadow rounded-lg p-6 mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Online Presence</h3>
                <div className="space-y-3">
                  {va.website && (
                    <a
                      href={va.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gray-600 hover:text-gray-500 flex items-center"
                    >
                      <GlobeAltIcon className="h-4 w-4 mr-2" />
                      Portfolio Website
                    </a>
                  )}
                  {va.linkedin && (
                    <a
                      href={va.linkedin.startsWith('http') ? va.linkedin : `https://linkedin.com/in/${va.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gray-600 hover:text-gray-500 flex items-center"
                    >
                      <GlobeAltIcon className="h-4 w-4 mr-2" />
                      LinkedIn
                    </a>
                  )}
                  {va.twitter && (
                    <a
                      href={va.twitter.startsWith('http') ? va.twitter : `https://twitter.com/${va.twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gray-600 hover:text-gray-500 flex items-center"
                    >
                      <GlobeAltIcon className="h-4 w-4 mr-2" />
                      Twitter
                    </a>
                  )}
                  {va.instagram && (
                    <a
                      href={va.instagram.startsWith('http') ? va.instagram : `https://instagram.com/${va.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gray-600 hover:text-gray-500 flex items-center"
                    >
                      <GlobeAltIcon className="h-4 w-4 mr-2" />
                      Instagram
                    </a>
                  )}
                  {va.email && user && (
                    <a
                      href={`mailto:${va.email}`}
                      className="text-sm text-gray-600 hover:text-gray-500 flex items-center"
                    >
                      <EnvelopeIcon className="h-4 w-4 mr-2" />
                      {va.email}
                    </a>
                  )}
                  {va.schedulingLink && (
                    <a
                      href={va.schedulingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gray-600 hover:text-gray-500 flex items-center"
                    >
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      Schedule a call
                    </a>
                  )}
                </div>
              </div>

              {/* Member Since */}
              {va.createdAt && (
                <div className="bg-white shadow rounded-lg p-6 mt-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Member since</p>
                    <p className="text-lg font-medium text-gray-900">
                      {format(new Date(va.createdAt), 'MMMM yyyy')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && shareUrl && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-green-100 rounded-full">
                <ShareIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="mt-4 text-center">
                <h3 className="text-lg font-medium text-gray-900">Share Your Profile</h3>
                <div className="mt-4">
                  <div className="flex items-center border border-gray-300 rounded-md p-3 bg-gray-50">
                    <input
                      type="text"
                      value={shareUrl}
                      readOnly
                      className="flex-1 bg-transparent text-sm text-gray-600 focus:outline-none"
                    />
                    <button
                      onClick={handleCopyToClipboard}
                      className="ml-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                <div className="mt-6 flex justify-center space-x-3">
                  <button
                    onClick={() => setShowShareModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-400"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: `${va.name} - ${branding.name}`,
                          text: `Check out ${va.name}'s profile on ${branding.name}`,
                          url: shareUrl
                        });
                      } else {
                        handleCopyToClipboard();
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                  >
                    {navigator.share ? 'Share' : 'Copy & Share'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}