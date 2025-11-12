import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPinIcon, BriefcaseIcon, XMarkIcon, PlayIcon, HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { useBranding } from '../contexts/BrandingContext';
import { useFavorites } from '../contexts/FavoritesContext';

export default function VACard({ va }) {
  const { branding } = useBranding();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    message: ''
  });

  const getStatusBadge = () => {
    switch (va.searchStatus) {
      case 'actively_looking':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
            {branding.isESystemsMode ? 'Available now' : 'Actively looking'}
          </span>
        );
      case 'open':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
            {branding.isESystemsMode ? 'Open to offers' : 'Open to opportunities'}
          </span>
        );
      default:
        return null;
    }
  };

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
    <Link to={`/vas/${va._id}`} className="block hover:bg-gray-50">
        <div className="px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
            <div className="flex items-center">
            <div className="flex-shrink-0">
                {va.avatar ? (
                <img
                    className="h-12 w-12 rounded-full"
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
            <div className="ml-4">
                <div className="text-sm font-medium text-gray-900">
                {va.name}
                {va.yearsOfExperience && (
                    <span className="ml-2 text-xs text-gray-500">
                    • {va.yearsOfExperience} years exp
                    </span>
                )}
                </div>
                <div className="text-sm text-gray-500">{va.hero}</div>
                <div className="mt-2 flex items-center text-sm text-gray-500">
                {va.location && (
                    <div className="flex items-center">
                    <MapPinIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                    {/* Smart location display: prioritize proper city names */}
                    {va.location.city?.toLowerCase().includes('barangay') 
                        ? `Angeles City, ${va.location.countryCode || 'PH'}`
                        : `${va.location.city}, ${va.location.countryCode || 'PH'}`
                    }
                    </div>
                )}
                {va.specialties?.length > 0 && (
                    <div className="ml-6 flex items-center">
                    <BriefcaseIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                    {va.specialties.slice(0, 2).map(s => s.name).join(', ')}
                    {va.specialties.length > 2 && ` +${va.specialties.length - 2}`}
                    </div>
                )}
                </div>
            </div>
            </div>
            <div className="flex flex-col items-end space-y-2">
            {getStatusBadge()}
            {va.industry && va.industry.toLowerCase() !== 'other' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700 border border-gray-200">
                {va.industry.charAt(0).toUpperCase() + va.industry.slice(1).replace(/_/g, ' ')}
                </span>
            )}
            </div>
        </div>
        </div>
    </Link>
  );
} 