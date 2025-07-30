import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery } from 'react-query';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { 
  MapPinIcon, 
  BriefcaseIcon, 
  CurrencyDollarIcon,
  EnvelopeIcon,
  PhoneIcon,
  GlobeAltIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

export default function VADetail() {
  const { id } = useParams();
  const { user, isBusiness } = useAuth();

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
          <h3 className="text-lg font-medium text-gray-900">VA not found</h3>
          <div className="mt-2">
            <Link to="/vas" className="text-gray-600 hover:text-gray-500">
              Back to VAs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{va.name} - Linkage VA Hub</title>
        <meta name="description" content={va.bio?.substring(0, 160)} />
      </Helmet>

      <div className="bg-white">
        {/* Header */}
        <div className="bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="md:flex md:items-center md:justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center">
                  {va.avatar ? (
                    <img
                      className="h-16 w-16 rounded-full"
                      src={va.avatar}
                      alt={va.name}
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-xl font-medium text-gray-700">
                        {va.name?.[0]?.toUpperCase() || 'V'}
                      </span>
                    </div>
                  )}
                  <div className="ml-4">
                    <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                      {va.name}
                    </h1>
                    <p className="text-sm text-gray-500">{va.hero}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex md:mt-0 md:ml-4">
                {isBusiness && (
                  <button
                    onClick={handleStartConversation}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    <EnvelopeIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                    Start Conversation
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

              {/* Experience */}
              <div className="bg-white shadow rounded-lg p-6 mt-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Experience</h2>
                <div className="space-y-4">
                  {/* This would be populated from VA screening data */}
                  <p className="text-sm text-gray-500">
                    Experience details would go here...
                  </p>
                </div>
              </div>
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
                        {va.location.city}, {va.location.country}
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
                        {va.roleType.selectedTypes?.join(', ')}
                      </dd>
                    </div>
                  )}

                  {va.roleLevel && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Experience Level</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {va.roleLevel.selectedLevels?.join(', ')}
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

              {/* Contact */}
              <div className="bg-white shadow rounded-lg p-6 mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Contact</h3>
                <div className="space-y-3">
                  {va.website && (
                    <a
                      href={va.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gray-600 hover:text-gray-500 flex items-center"
                    >
                      <GlobeAltIcon className="h-4 w-4 mr-2" />
                      Website
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
            </div>
          </div>
        </div>
      </div>
    </>
  );
}