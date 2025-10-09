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
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  
  // Check if this is a shared view (came from short URL or has share query param)
  const isSharedView = React.useMemo(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hasShareParam = urlParams.get('share') === 'true';
    const referrer = document.referrer;
    const cameFromShortUrl = referrer && (referrer.includes('/s/') || referrer.includes('localhost:8000'));
    return hasShareParam || cameFromShortUrl;
  }, []);

  const { data: vaResponse, isLoading, error } = useQuery(
    ['va', id],
    async () => {
      // Add via=shortlink if this is a shared view
      const queryParams = isSharedView ? '?via=shortlink' : '';
      console.log('Fetching VA profile:', `/vas/${id}${queryParams}`);
      const response = await api.get(`/vas/${id}${queryParams}`);
      console.log('VA Response:', response.data);
      console.log('Messaging config:', response.data?.messaging);
      return response.data;
    }
  );
  
  const va = vaResponse?.data;
  const messaging = vaResponse?.messaging;

  const handleStartConversation = async () => {
    if (!user) {
      toast.error('Please log in to start a conversation');
      return;
    }
    setShowChatModal(true);
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setIsSendingMessage(true);
    try {
      // Use the VA's ID directly (not the user ID)
      const vaId = va._id;
      const response = await api.post(`/conversations/start/${vaId}`, {
        message: chatMessage
      });
      
      toast.success('Message sent successfully!');
      setShowChatModal(false);
      setChatMessage('');
      
      // Redirect to conversation
      window.location.href = `/conversations/${response.data.data._id}`;
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to send message');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleCreateShareUrl = async () => {
    setIsCreatingShare(true);
    try {
      // Use public API endpoint that doesn't require authentication
      const apiUrl = process.env.REACT_APP_API_URL || 'https://esystems-management-hub.onrender.com/api';
      const response = await fetch(`${apiUrl}/shorturls/vas/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to create shareable link');
      }

      const data = await response.json();
      setShareUrl(data.data.fullShortUrl);
      setShowShareModal(true);
      toast.success('Shareable link created successfully!');
    } catch (error) {
      console.error('Share URL creation error:', error);
      toast.error('Failed to create shareable link');
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
            src={va.coverImage ||
              'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=300&fit=crop'
            }
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
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(va.name)}&background=6366f1&color=ffffff&size=128`;
                      }}
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
                <button
                  onClick={handleCreateShareUrl}
                  disabled={isCreatingShare}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                >
                  <ShareIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  {isCreatingShare ? 'Creating...' : 'Share Profile'}
                </button>
                {/* Show message button or registration button based on messaging config */}
                {console.log('Rendering button - Messaging:', messaging, 'User:', user, 'isBusiness:', isBusiness)}
                {messaging?.actionButton && (
                  <>
                    {console.log('Action button type:', messaging.actionButton.type, 'Text:', messaging.actionButton.text)}
                    {messaging.actionButton.type === 'message' ? (
                      <button
                        onClick={handleStartConversation}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                      >
                        <EnvelopeIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                        {messaging.actionButton.text || (branding.isESystemsMode ? 'Contact Professional' : 'Start Conversation')}
                      </button>
                    ) : messaging.actionButton.type === 'register' ? (
                      <a
                        href={messaging.actionButton.url}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <ChatBubbleLeftIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                        {messaging.actionButton.text}
                      </a>
                    ) : messaging.actionButton.type === 'complete_profile' ? (
                      <a
                        href={messaging.actionButton.url}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                      >
                        <ChatBubbleLeftIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                        {messaging.actionButton.text}
                      </a>
                    ) : null}
                  </>
                )}
                {/* Fallback for old behavior if messaging is not available */}
                {!messaging?.actionButton && isBusiness && (
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
                  <div className="flex justify-center">
                    <video 
                      controls 
                      className="w-full max-w-md lg:max-w-lg rounded-lg" 
                      style={{ maxHeight: '400px' }}
                      onError={(e) => {
                        console.error('Video load error:', e);
                        e.target.parentElement.innerHTML = `
                          <div class="w-full max-w-md lg:max-w-lg rounded-lg bg-gray-100 flex items-center justify-center" style="height: 300px">
                            <div class="text-center text-gray-500">
                              <p class="text-sm">Video temporarily unavailable</p>
                              <p class="text-xs text-gray-400 mt-2">Please check back later</p>
                            </div>
                          </div>
                        `;
                      }}
                    >
                      <source
                        src={va.videoIntroduction}
                        type="video/mp4"
                      />
                      Your browser does not support the video tag.
                    </video>
                  </div>
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
                        {/* Smart location display: fix barangay city names */}
                        {va.location.city?.toLowerCase().includes('barangay') 
                          ? `Angeles City${va.location.state ? `, ${va.location.state}` : ''}, Philippines`
                          : `${va.location.city}${va.location.state ? `, ${va.location.state}` : ''}, Philippines`
                        }
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

              {/* DISC Personality Assessment */}
              {va.discAssessment?.isCompleted && (
                <div className="bg-white shadow rounded-lg p-6 mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Personality Profile (DISC)</h3>
                  <div className="space-y-4">
                    {/* Primary Type */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Primary Type</h4>
                        <p className="text-lg font-semibold text-gray-800">
                          {va.discAssessment.primaryType} - {
                            va.discAssessment.primaryType === 'D' ? 'Dominance' :
                            va.discAssessment.primaryType === 'I' ? 'Influence' :
                            va.discAssessment.primaryType === 'S' ? 'Steadiness' :
                            va.discAssessment.primaryType === 'C' ? 'Conscientiousness' : ''
                          }
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {va.discAssessment.primaryType === 'D' && 'Direct, Results-oriented, Firm, Strong-willed'}
                          {va.discAssessment.primaryType === 'I' && 'Outgoing, Enthusiastic, Optimistic, People-oriented'}
                          {va.discAssessment.primaryType === 'S' && 'Even-tempered, Accommodating, Patient, Humble'}
                          {va.discAssessment.primaryType === 'C' && 'Analytical, Reserved, Precise, Systematic'}
                        </p>
                      </div>
                    </div>

                    {/* DISC Scores */}
                    {(va.discAssessment.scores?.dominance || va.discAssessment.scores?.influence || 
                      va.discAssessment.scores?.steadiness || va.discAssessment.scores?.conscientiousness) && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Assessment Scores</h4>
                        <div className="grid grid-cols-2 gap-3">
                          {va.discAssessment.scores?.dominance && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                              <div className="text-center">
                                <div className="text-sm font-medium text-red-800 mb-1">Dominance (D)</div>
                                <div className="text-2xl font-bold text-red-600">{va.discAssessment.scores.dominance}</div>
                              </div>
                            </div>
                          )}
                          {va.discAssessment.scores?.influence && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                              <div className="text-center">
                                <div className="text-sm font-medium text-yellow-800 mb-1">Influence (I)</div>
                                <div className="text-2xl font-bold text-yellow-600">{va.discAssessment.scores.influence}</div>
                              </div>
                            </div>
                          )}
                          {va.discAssessment.scores?.steadiness && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                              <div className="text-center">
                                <div className="text-sm font-medium text-green-800 mb-1">Steadiness (S)</div>
                                <div className="text-2xl font-bold text-green-600">{va.discAssessment.scores.steadiness}</div>
                              </div>
                            </div>
                          )}
                          {va.discAssessment.scores?.conscientiousness && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <div className="text-center">
                                <div className="text-sm font-medium text-blue-800 mb-1">Conscientiousness (C)</div>
                                <div className="text-2xl font-bold text-blue-600">{va.discAssessment.scores.conscientiousness}</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Assessment Info */}
                    <div className="border-t pt-3">
                      <p className="text-xs text-gray-500">
                        DISC assessment completed
                        {va.discAssessment.completedAt && 
                          ` on ${new Date(va.discAssessment.completedAt).toLocaleDateString()}`
                        }. Learn more about <a 
                          href="https://openpsychometrics.org/tests/ODAT/" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="underline hover:text-gray-700"
                        >
                          DISC personality assessment
                        </a>.
                      </p>
                    </div>
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
          <div className="relative top-20 mx-auto p-6 border w-full max-w-md shadow-lg rounded-lg bg-white">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-blue-100 rounded-full mb-4">
                <ShareIcon className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Share this profile with your network</h3>
              
              {/* Social Media Sharing Buttons */}
              <div className="flex justify-center space-x-3 mb-6">
                {/* Facebook */}
                <button
                  onClick={() => {
                    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
                    window.open(facebookUrl, '_blank', 'width=600,height=400');
                  }}
                  className="w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition-colors"
                  title="Share on Facebook"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </button>

                {/* Twitter/X */}
                <button
                  onClick={() => {
                    const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`Check out ${va.name}'s profile on ${branding.name}`)}`;
                    window.open(twitterUrl, '_blank', 'width=600,height=400');
                  }}
                  className="w-12 h-12 bg-black hover:bg-gray-800 text-white rounded-full flex items-center justify-center transition-colors"
                  title="Share on X (Twitter)"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </button>

                {/* LinkedIn */}
                <button
                  onClick={() => {
                    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
                    window.open(linkedinUrl, '_blank', 'width=600,height=400');
                  }}
                  className="w-12 h-12 bg-blue-700 hover:bg-blue-800 text-white rounded-full flex items-center justify-center transition-colors"
                  title="Share on LinkedIn"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </button>

                {/* WhatsApp */}
                <button
                  onClick={() => {
                    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`Check out ${va.name}'s profile: ${shareUrl}`)}`;
                    window.open(whatsappUrl, '_blank');
                  }}
                  className="w-12 h-12 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center transition-colors"
                  title="Share on WhatsApp"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.149-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.488"/>
                  </svg>
                </button>

                {/* Telegram */}
                <button
                  onClick={() => {
                    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`Check out ${va.name}'s profile`)}`;
                    window.open(telegramUrl, '_blank');
                  }}
                  className="w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-colors"
                  title="Share on Telegram"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                </button>

                {/* Copy Link */}
                <button
                  onClick={handleCopyToClipboard}
                  className="w-12 h-12 bg-gray-600 hover:bg-gray-700 text-white rounded-full flex items-center justify-center transition-colors"
                  title="Copy link"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                  </svg>
                </button>
              </div>

              {/* URL Display */}
              <div className="mb-4">
                <div className="flex items-center border border-gray-300 rounded-md p-3 bg-gray-50">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 bg-transparent text-sm text-gray-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowShareModal(false)}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {showChatModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-blue-100 rounded-full">
                <ChatBubbleLeftIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="mt-4 text-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Start a Conversation with {va.name}
                </h3>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 text-left mb-2">
                    Your Message
                  </label>
                  <textarea
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Hi, I'm interested in working with you..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                  />
                </div>
                <div className="mt-6 flex justify-center space-x-3">
                  <button
                    onClick={() => {
                      setShowChatModal(false);
                      setChatMessage('');
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-400"
                    disabled={isSendingMessage}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendMessage}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                    disabled={isSendingMessage || !chatMessage.trim()}
                  >
                    {isSendingMessage ? 'Sending...' : 'Send Message'}
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