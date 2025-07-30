import React from 'react';
import { Link } from 'react-router-dom';
import { MapPinIcon, BriefcaseIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

export default function VACard({ va }) {
  const formatRate = () => {
    if (va.preferredMinHourlyRate && va.preferredMaxHourlyRate) {
      return `$${va.preferredMinHourlyRate}-${va.preferredMaxHourlyRate}/hr`;
    } else if (va.preferredMinHourlyRate) {
      return `$${va.preferredMinHourlyRate}+/hr`;
    } else if (va.preferredMinSalary && va.preferredMaxSalary) {
      return `$${va.preferredMinSalary}-${va.preferredMaxSalary}/mo`;
    } else if (va.preferredMinSalary) {
      return `$${va.preferredMinSalary}+/mo`;
    }
    return 'Rate negotiable';
  };

  const getStatusBadge = () => {
    switch (va.searchStatus) {
      case 'actively_looking':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Actively looking
          </span>
        );
      case 'open':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Open to opportunities
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
                    {va.name?.[0]?.toUpperCase() || 'V'}
                  </span>
                </div>
              )}
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900">{va.name}</div>
              <div className="text-sm text-gray-500">{va.hero}</div>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                {va.location && (
                  <div className="flex items-center">
                    <MapPinIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                    {va.location.city}, {va.location.countryCode}
                  </div>
                )}
                {va.specialties?.length > 0 && (
                  <div className="ml-6 flex items-center">
                    <BriefcaseIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                    {va.specialties.slice(0, 2).map(s => s.name).join(', ')}
                    {va.specialties.length > 2 && ` +${va.specialties.length - 2}`}
                  </div>
                )}
                <div className="ml-6 flex items-center">
                  <CurrencyDollarIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                  {formatRate()}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center">
            {getStatusBadge()}
          </div>
        </div>
      </div>
    </Link>
  );
}