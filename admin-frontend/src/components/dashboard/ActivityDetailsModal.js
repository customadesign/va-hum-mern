import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  UserIcon, 
  EnvelopeIcon, 
  PhoneIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { adminAPI } from '../../services/api';
import { format } from 'date-fns';

const ActivityDetailsModal = ({ isOpen, onClose, type, title }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && type) {
      fetchData();
    }
  }, [isOpen, type]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      let response;
      switch (type) {
        case 'newUsersToday':
          response = await adminAPI.getTodayNewUsers();
          break;
        case 'newVAsToday':
          response = await adminAPI.getTodayNewVAs();
          break;
        case 'newBusinessesToday':
          response = await adminAPI.getTodayNewBusinesses();
          break;
        case 'activeUsers30Days':
          response = await adminAPI.getActiveUsers30Days();
          break;
        default:
          throw new Error('Invalid type');
      }
      
      // Handle different response structures
      let userData = [];
      if (response && response.data) {
        // Check if response.data is an array
        if (Array.isArray(response.data)) {
          userData = response.data;
        } else if (response.data.users && Array.isArray(response.data.users)) {
          // If the data is nested under 'users'
          userData = response.data.users;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          // If the data is nested under 'data'
          userData = response.data.data;
        } else {
          console.warn('Unexpected response structure:', response.data);
          userData = [];
        }
      }
      
      setData(userData);
    } catch (err) {
      console.error('Error fetching activity details:', err);
      setError(err.message || 'Failed to load data');
      setData([]); // Ensure data is always an array
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const renderUserCard = (user) => {
    const isVA = type === 'newVAsToday' || user.role === 'va';
    const isBusiness = type === 'newBusinessesToday' || user.role === 'business';

    return (
      <div key={user._id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${
              isVA ? 'bg-green-100' : isBusiness ? 'bg-purple-100' : 'bg-blue-100'
            }`}>
              <UserIcon className={`h-5 w-5 ${
                isVA ? 'text-green-600' : isBusiness ? 'text-purple-600' : 'text-blue-600'
              }`} />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">
                {user.name || user.firstName + ' ' + user.lastName || 'N/A'}
              </h4>
              <p className="text-sm text-gray-500 capitalize">
                {user.role || 'User'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            {user.isVerified ? (
              <CheckCircleIcon className="h-5 w-5 text-green-500" title="Verified" />
            ) : (
              <XCircleIcon className="h-5 w-5 text-gray-400" title="Not Verified" />
            )}
            {user.isActive !== false && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Active
              </span>
            )}
          </div>
        </div>

        <div className="space-y-2 text-sm">
          {user.email && (
            <div className="flex items-center space-x-2 text-gray-600">
              <EnvelopeIcon className="h-4 w-4 text-gray-400" />
              <span className="truncate">{user.email}</span>
            </div>
          )}
          
          {user.phone && (
            <div className="flex items-center space-x-2 text-gray-600">
              <PhoneIcon className="h-4 w-4 text-gray-400" />
              <span>{user.phone}</span>
            </div>
          )}

          {isBusiness && user.company && (
            <div className="flex items-center space-x-2 text-gray-600">
              <BuildingOfficeIcon className="h-4 w-4 text-gray-400" />
              <span>{user.company}</span>
            </div>
          )}

          {isVA && user.skills && user.skills.length > 0 && (
            <div className="flex items-center space-x-2 text-gray-600">
              <BriefcaseIcon className="h-4 w-4 text-gray-400" />
              <span className="truncate">
                {user.skills.slice(0, 3).join(', ')}
                {user.skills.length > 3 && ` +${user.skills.length - 3} more`}
              </span>
            </div>
          )}

          {user.location && (
            <div className="flex items-center space-x-2 text-gray-600">
              <MapPinIcon className="h-4 w-4 text-gray-400" />
              <span>{user.location}</span>
            </div>
          )}

          <div className="flex items-center space-x-2 text-gray-600">
            <CalendarIcon className="h-4 w-4 text-gray-400" />
            <span>
              Joined {user.createdAt ? format(new Date(user.createdAt), 'MMM dd, yyyy') : 'N/A'}
            </span>
          </div>

          {type === 'activeUsers30Days' && user.lastActive && (
            <div className="flex items-center space-x-2 text-gray-600">
              <ClockIcon className="h-4 w-4 text-gray-400" />
              <span>
                Last active: {format(new Date(user.lastActive), 'MMM dd, yyyy HH:mm')}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex space-x-2">
          <button
            onClick={() => {
              // Navigate to user detail page
              if (isVA) {
                window.location.href = `/va-management?id=${user._id}`;
              } else if (isBusiness) {
                window.location.href = `/business-management?id=${user._id}`;
              } else {
                window.location.href = `/user-management?id=${user._id}`;
              }
            }}
            className="flex-1 text-sm px-3 py-1.5 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            View Details
          </button>
          {user.email && (
            <button
              onClick={() => window.location.href = `mailto:${user.email}`}
              className="flex-1 text-sm px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Contact
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-hidden">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative w-full max-w-4xl transform overflow-hidden rounded-xl bg-white shadow-2xl transition-all">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">{title}</h2>
                  <p className="text-primary-100 text-sm mt-1">
                    {Array.isArray(data) ? data.length : 0} {Array.isArray(data) && data.length === 1 ? 'record' : 'records'} found
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <div className="text-red-500 mb-2">
                    <XCircleIcon className="h-12 w-12 mx-auto" />
                  </div>
                  <p className="text-gray-600">{error}</p>
                  <button
                    onClick={fetchData}
                    className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                  >
                    Retry
                  </button>
                </div>
              ) : !Array.isArray(data) || data.length === 0 ? (
                <div className="text-center py-12">
                  <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No records found</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {Array.isArray(data) && data.map(user => renderUserCard(user))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityDetailsModal;
