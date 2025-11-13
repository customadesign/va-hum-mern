import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { XMarkIcon, HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { useBranding } from '../contexts/BrandingContext';
import { useFavorites } from '../contexts/FavoritesContext';

export default function VACard({ va }) {
  const { branding } = useBranding();
  const { addToFavorites, isFavorite } = useFavorites();
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    message: ''
  });


  const handleImageClick = (e) => {
    console.log('Video clicked:', va.videoIntroduction);
    console.log('Video type:', va.videoIntroduction?.includes('supabase') ? 'supabase' : 'direct');
    if (va.videoIntroduction) {
      e.preventDefault();
      e.stopPropagation();
      setShowVideoModal(true);
    }
  };

  const getVideoThumbnail = () => {
    if (!va.videoIntroduction) {
      return null;
    }
    
    // For now, we'll use a placeholder thumbnail
    // In a real implementation, you might want to generate actual thumbnails from video
    return 'https://images.unsplash.com/photo-1573164713619-24c631fe8b9c?w=400&h=300&fit=crop';
  };

  const getFullVideoUrl = () => {
    if (!va.videoIntroduction) {
      return null;
    }
    
    // If it's already a full URL (http/https), return as is
    if (va.videoIntroduction.startsWith('http')) {
      return va.videoIntroduction;
    }
    
    // If it's a relative path, construct full URL
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    const baseUrl = API_URL.replace('/api', '');
    return `${baseUrl}${va.videoIntroduction}`;
  };

  // Debug log to check if videoIntroduction exists
  useEffect(() => {
    if (va.videoIntroduction) {
      console.log('VA has video:', va.name, va.videoIntroduction);
    }
  }, [va.videoIntroduction, va.name]);

  return (
    <>
      <Link to={`/vas/${va._id}`} className="va-card  rounded-lg">
          <div className="flex items-center rounde-xl bg-stone-100 px-6 p-10 justify-between">
            <div className="flex items-center max-w-[40%] w-[40%] pr-[30px]">
              <div className="flex-shrink-0">
                {va.avatar ? (
                  <img
                    className="va-profile-pic rounded-full h-[150px] max-w-[150px] w-48"
                    src={va.avatar}
                    alt={va.name}
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-lg font-medium text-gray-700">
                      {va.name?.[0]?.toUpperCase() || (branding.isESystemsMode ? 'P' : 'V')}
                    </span>
                  </div>
                )}
              </div>
              <div className="ml-6">
                <div className="text-sm font-medium text-gray-900">
                  <h2 className='va-card-title-va-name'>
                    {va.name?.split(' ')[0]}
                  </h2>
                  {va.yearsOfExperience && (
                    <span className="ml-2 text-xs text-gray-700">
                      • {va.yearsOfExperience} years exp
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-700 va-role">{va.hero}</div>
              </div>
            </div>
              
            <div className="flex va-categories-wrapper pl-[20px] align-center max-w-[20%] w-[20%] items-center">
                <div className="flex column items-center text-sm text-gray-700">
                  {va.specialties?.length > 0 && (
                    <ul className="va-capabilities flex flex-col">
                      {va.specialties.slice(0, 2).map(s => (
                        <li key={s.name}>{s.name}</li>
                      ))}
                      {va.specialties.length > 2 && (
                        <li>+{va.specialties.length - 2} more</li>
                      )}
                    </ul>
                  )}
                </div>
            </div>

            <div className="flex va-video-wrapper items-center align-center justify-center max-w-[20%] w-[20%]">
                <div className="text-sm text-gray-700">
                  {va.videoIntroduction ? (
                    <div
                      className="relative cursor-pointer group"
                      onClick={handleImageClick}
                    >
                      <img
                        className="w-42 h-[140px] object-cover rounded-lg"
                        src={'https://blocks.astratic.com/img/general-video.png'}
                        alt={`${va.name} video thumbnail`}
                      />

                      {/* <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg">
                        <PlayIcon className="h-8 w-8 text-white" />
                      </div> */}
                      <div className="absolute bottom-1 right-1 bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold">
                        Video
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-500">No video available</span>
                  )}
                </div>
            </div>

            <div className="flex flex-col items-end space-y-2 max-w-[20%] w-[20%]">

              {/* {getStatusBadge()}
              {va.industry && va.industry.toLowerCase() !== 'other' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  {va.industry.charAt(0).toUpperCase() + va.industry.slice(1).replace(/_/g, ' ')}
                </span>
              )} */}

              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowRequestModal(true);
                }}
                className="transition-all duration-300 mb-2 bg-accent-700 hover:bg-accent-600 text-white w-full px-3 py-3 rounded-md text-lg font-medium"
              >
                    Request details / Interview
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  addToFavorites(va);
                }}
                className={`transition-all duration-300 w-full px-3 py-3 rounded-md text-lg font-medium ${
                  isFavorite(va._id)
                    ? 'bg-grey-400 hover:bg-primary-700 text-black hover:text-white'
                    : 'bg-primary-700 hover:bg-primary-500 text-white'
                }`}
              >
                <span className="flex items-center justify-center">
                  {isFavorite(va._id) ? (
                    <>
                      <HeartSolidIcon className="h-5 w-5 mr-2" />
                      Remove from Favorites
                    </>
                  ) : (
                    <>
                      <HeartIcon className="h-5 w-5 mr-2" />
                      Add to Favorites
                    </>
                  )}
                </span>
              </button>
            </div>
          </div>
      </Link>

      {/* Video Modal */}
      {showVideoModal && va.videoIntroduction && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Video Introduction - {va.name}
              </h3>
              <button
                onClick={() => setShowVideoModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
             
            {/* Video Content */}
            <div className="p-4">
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <video
                  controls
                  autoPlay
                  className="absolute top-0 left-0 w-full h-full rounded-lg"
                  poster={getVideoThumbnail()}
                  onError={(e) => {
                    console.error('Video error:', e);
                    console.error('Video src:', getFullVideoUrl());
                  }}
                  onLoadStart={() => console.log('Video loading started:', getFullVideoUrl())}
                  onCanPlay={() => console.log('Video can play:', getFullVideoUrl())}
                >
                  <source src={getFullVideoUrl()} type="video/mp4" />
                  Your browser does not support video tag.
                </video>
              </div>
            </div>


             
            {/* Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Learn more about {va.name}'s experience and skills
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowVideoModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                    Close
                  </button>
                  <Link
                    to={`/vas/${va._id}`}
                    onClick={() => setShowVideoModal(false)}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors">
                    View Full Profile
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Request Details Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg max-w-lg w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Request Details / Interview
              </h3>
              <button
                onClick={() => setShowRequestModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            {/* Form Content */}
            <div className="p-4">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  You're requesting details for:
                </p>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="font-medium text-gray-900">{va.name}</p>
                  <p className="text-sm text-gray-500">ID: {va._id}</p>
                </div>
              </div>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                // Handle form submission here
                console.log('Form submitted:', {
                  vaId: va._id,
                  vaName: va.name,
                  email: formData.email,
                  message: formData.message
                });
                // Reset form and close modal
                setFormData({ email: '', message: '' });
                setShowRequestModal(false);
              }}>
                <div className="mb-4">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="your.email@example.com"
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows="4"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Please provide details about your request or interview..."
                  ></textarea>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="submit"
                    className="transition-all duration-300 bg-primary-700 hover:bg-primary-500 text-white w-full px-3 py-3 rounded-md text-lg font-medium"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 