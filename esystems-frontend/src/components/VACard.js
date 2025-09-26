import React from 'react';
import { Link } from 'react-router-dom';
import { MapPinIcon, BriefcaseIcon } from '@heroicons/react/24/outline';
import { useBranding } from '../contexts/BrandingContext';

export default function VACard({ va }) {
  const { branding } = useBranding();

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
                  <span className="ml-2 text-xs text-gray-700">
                    • {va.yearsOfExperience} years exp
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-700">{va.hero}</div>
              <div className="mt-2 flex items-center text-sm text-gray-700">
                {va.location && (
                  <div className="flex items-center">
                    <MapPinIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-700" />
                    {/* Smart location display: prioritize proper city names */}
                    {va.location.city?.toLowerCase().includes('barangay') 
                      ? `Angeles City, ${va.location.countryCode || 'PH'}`
                      : `${va.location.city}, ${va.location.countryCode || 'PH'}`
                    }
                  </div>
                )}
                {va.specialties?.length > 0 && (
                  <div className="ml-6 flex items-center">
                    <BriefcaseIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-700" />
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
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                {va.industry.charAt(0).toUpperCase() + va.industry.slice(1).replace(/_/g, ' ')}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}