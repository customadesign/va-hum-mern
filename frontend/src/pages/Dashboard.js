import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { useBranding } from '../contexts/BrandingContext';
import { useQuery } from 'react-query';
import api, { announcementAPI } from '../services/api';
import AnnouncementBanner from '../components/AnnouncementBanner';

export default function Dashboard() {
  const { user } = useAuth();
  const { branding, loading: brandingLoading } = useBranding();

  // Fetch profile data for profile completion calculation
  const { data: profileData } = useQuery({
    queryKey: ['profile', user?.id, branding.isESystemsMode],
    queryFn: async () => {
      if (branding.isESystemsMode) {
        const response = await api.get('/profile/business');
        return response.data || { data: { business: null } };
      } else {
        const response = await api.get('/users/profile');
        return response.data;
      }
    },
    enabled: !!user && !brandingLoading
  });

  // Extract profile based on branding context
  const profile = branding.isESystemsMode 
    ? profileData?.data?.business || null
    : profileData?.data?.va || null;

  // Fetch analytics data (for regular users)
  const { data: analytics } = useQuery({
    queryKey: ['analytics', user?.id],
    queryFn: async () => {
      const response = await api.get('/analytics/dashboard');
      return response.data;
    },
    enabled: !!user && !user?.admin,
    onError: () => {
      // Return default data if API doesn't exist yet
      return {
        activeConversations: 0,
        profileViews: 0,
        contactsMade: 0
      };
    }
  });

  // Fetch admin stats (for admin users)
  const { data: adminStats } = useQuery({
    queryKey: ['admin-stats', user?.id],
    queryFn: async () => {
      const response = await api.get('/admin/stats');
      return response.data.data;
    },
    enabled: !!user && user?.admin,
  });

  // Fetch unread announcements count
  const { data: unreadAnnouncementsCount = 0 } = useQuery({
    queryKey: ['announcements-unread-count', user?.id],
    queryFn: async () => {
      const response = await announcementAPI.getUnreadCount();
      return response.data?.count || 0;
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch latest announcements for display
  const { data: latestAnnouncements = [] } = useQuery({
    queryKey: ['announcements-latest', user?.id],
    queryFn: async () => {
      const response = await announcementAPI.getAnnouncements();
      // Return only the first 3 announcements
      return (response.data?.announcements || []).slice(0, 3);
    },
    enabled: !!user,
  });

  // Calculate profile completion percentage based on user type
  const profileCompletion = useMemo(() => {
    if (!profile) return { percentage: 0, isComplete: false, missingFields: [] };

    // Debug logging for profile
    console.log('Profile Data:', profile);
    console.log('Is E-Systems Mode:', branding.isESystemsMode);

    let requiredFields = [];

    if (branding.isESystemsMode) {
      // Business profile completion logic
      requiredFields = [
        { field: 'contactName', weight: 15, check: () => profile.contactName?.trim() && profile.contactName.length > 2 },
        { field: 'company', weight: 15, check: () => profile.company?.trim() && profile.company.length > 2 },
        { field: 'bio', weight: 15, check: () => profile.bio?.trim() && profile.bio.length >= 50 },
        { field: 'email', weight: 10, check: () => profile.email?.trim() && profile.email.includes('@') },
        { field: 'phone', weight: 10, check: () => profile.phone?.trim() && profile.phone.length >= 10 },
        { field: 'industry', weight: 10, check: () => profile.industry?.trim() },
        { field: 'employeeCount', weight: 5, check: () => Number(profile.employeeCount) > 0 },
        { field: 'website', weight: 10, check: () => profile.website?.trim() },
        { field: 'location', weight: 10, check: () => {
          if (profile.location) {
            if (typeof profile.location === 'object' && profile.location !== null) {
              const hasCity = profile.location.city?.trim();
              const hasProvince = profile.location.province?.trim() || profile.location.state?.trim();
              return !!(hasCity && hasProvince);
            } else if (typeof profile.location === 'string') {
              return true;
            }
          }
          return !!(profile.city?.trim() && (profile.state?.trim() || profile.province?.trim()));
        }}
      ];
    } else {
      // Check if name is just the email prefix (default value)
      const isDefaultName = profile.name === profile.email?.split('@')[0];

      // VA profile completion logic
      requiredFields = [
        // Essential fields (high weight)
        { field: 'name', weight: 10, check: () => profile.name?.trim() && !isDefaultName && profile.name.length > 2 },
        { field: 'hero', weight: 10, check: () => {
          // Check if hero exists and has content (more than 10 chars)
          const heroValue = profile.hero || profile.heroStatement;
          return heroValue?.trim() && heroValue.length > 10;
        }},
        { field: 'bio', weight: 15, check: () => profile.bio?.trim() && profile.bio.length >= 100 },
        { field: 'location', weight: 10, check: () => {
          // Check both possible location structures
          if (profile.location) {
            // If location exists as an object or ID
            if (typeof profile.location === 'object' && profile.location !== null) {
              // Check for populated location with city and some province indicator
              const hasCity = profile.location.city?.trim();
              const hasProvince = profile.location.province?.trim() || profile.location.state?.trim();
              return !!(hasCity && hasProvince);
            } else if (typeof profile.location === 'string') {
              // Location exists as an ID reference, consider it complete
              return true;
            }
          }
          // Fallback to direct fields on profile
          return !!(profile.city?.trim() && (profile.state?.trim() || profile.province?.trim()));
        }},
        { field: 'email', weight: 10, check: () => profile.email?.trim() && profile.email.includes('@') },
        { field: 'specialties', weight: 15, check: () => profile.specialties?.length > 0 || profile.specialtyIds?.length > 0 },
        { field: 'roleType', weight: 5, check: () => Object.values(profile.roleType || {}).some(Boolean) },
        { field: 'roleLevel', weight: 5, check: () => Object.values(profile.roleLevel || {}).some(Boolean) },
        
        // Enhanced fields (medium weight)
        { field: 'hourlyRate', weight: 10, check: () => Number(profile.preferredMinHourlyRate) > 0 && Number(profile.preferredMaxHourlyRate) > 0 && Number(profile.preferredMaxHourlyRate) >= Number(profile.preferredMinHourlyRate) },
        { field: 'phone', weight: 5, check: () => profile.phone?.trim() && profile.phone.length >= 10 },
        { field: 'onlinePresence', weight: 5, check: () => profile.website?.trim() || profile.linkedin?.trim() },
        { field: 'discAssessment', weight: 10, check: () => profile.discAssessment?.primaryType }
      ];
    }

    const totalWeight = requiredFields.reduce((sum, field) => sum + field.weight, 0);
    const completedWeight = requiredFields.reduce((sum, field) => {
      return sum + (field.check() ? field.weight : 0);
    }, 0);

    const percentage = Math.round((completedWeight / totalWeight) * 100);
    const missingFields = requiredFields.filter(field => !field.check());

    return {
      percentage,
      isComplete: percentage >= 100,
      missingFields
    };
  }, [profile, branding.isESystemsMode]);

  // Show loading spinner while branding context is loading
  if (brandingLoading || !branding) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{user?.admin ? 'Admin Dashboard' : 'Dashboard'} - {branding.name}</title>
      </Helmet>

      {/* Announcement Banner - Shows at the very top */}
      <AnnouncementBanner />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              {user?.admin ? 'Admin Dashboard' : 'Dashboard'}
            </h2>
          </div>
        </div>

        {/* Admin Stats Cards */}
        {user?.admin ? (
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total VAs Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg border-t-4 border-blue-500">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                    <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total VAs</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-blue-900">{adminStats?.totalVAs || 0}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 px-5 py-3">
                <div className="text-sm">
                  <Link to="/admin/vas" className="font-medium text-blue-700 hover:text-blue-900">
                    Manage VAs →
                  </Link>
                </div>
              </div>
            </div>

            {/* Active VAs Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg border-t-4 border-green-500">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Active VAs</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-green-900">{adminStats?.activeVAs || 0}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-green-50 px-5 py-3">
                <div className="text-sm">
                  <Link to="/admin/vas?status=active" className="font-medium text-green-700 hover:text-green-900">
                    View active →
                  </Link>
                </div>
              </div>
            </div>

            {/* Total Businesses Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg border-t-4 border-purple-500">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3">
                    <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Businesses</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-purple-900">{adminStats?.totalBusinesses || 0}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-purple-50 px-5 py-3">
                <div className="text-sm">
                  <Link to="/admin/businesses" className="font-medium text-purple-700 hover:text-purple-900">
                    Manage businesses →
                  </Link>
                </div>
              </div>
            </div>

            {/* Pending Approvals Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg border-t-4 border-yellow-500">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-yellow-100 rounded-lg p-3">
                    <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Pending Approvals</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-yellow-900">{adminStats?.pendingApprovals || 0}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-yellow-50 px-5 py-3">
                <div className="text-sm">
                  <Link to="/admin/approvals" className="font-medium text-yellow-700 hover:text-yellow-900">
                    Review approvals →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Regular User Stats Cards */
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Announcements Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg border-t-4 border-purple-500">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3">
                    <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Announcements</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-purple-900">
                          {unreadAnnouncementsCount > 0 ? (
                            <>
                              <span className="text-purple-600">{unreadAnnouncementsCount}</span>
                              <span className="text-sm font-normal text-gray-500 ml-1">unread</span>
                            </>
                          ) : (
                            'All read'
                          )}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-purple-50 px-5 py-3">
                <div className="text-sm">
                  <Link to="/notifications" className="font-medium text-purple-700 hover:text-purple-900">
                    View all →
                  </Link>
                </div>
              </div>
            </div>

            {/* Profile Completion Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg border-t-4 border-blue-500">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                    <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Profile Completion</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-blue-900">{profileCompletion.percentage}%</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 px-5 py-3">
                <div className="text-sm">
                    <Link to={branding.isESystemsMode ? "/business/profile" : "/va/profile"} className="font-medium text-blue-700 hover:text-blue-900">
                     Complete profile →
                   </Link>
                </div>
              </div>
            </div>

            {/* Messages Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg border-t-4 border-sky-500">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-sky-100 rounded-lg p-3">
                    <svg className="h-6 w-6 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Active Conversations</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-sky-900">{analytics?.activeConversations || 0}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-sky-50 px-5 py-3">
                <div className="text-sm">
                  <Link to="/conversations" className="font-medium text-sky-700 hover:text-sky-900">
                    View conversations →
                  </Link>
                </div>
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg border-t-4 border-indigo-500">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-indigo-100 rounded-lg p-3">
                    <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Profile Views
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-indigo-900">
                          {analytics?.profileViews || 0}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-indigo-50 px-5 py-3">
                <div className="text-sm">
                  <Link to="/analytics" className="font-medium text-indigo-700 hover:text-indigo-900">
                    View analytics →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Quick Actions</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Admin Quick Actions */}
            {user?.admin ? (
              <>
                <div className="relative rounded-lg border border-blue-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-blue-500 transition-colors">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-md bg-blue-600 text-white">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to="/admin/vas" className="focus:outline-none">
                      <span className="absolute inset-0" aria-hidden="true" />
                      <p className="text-sm font-medium text-gray-900">Manage VAs</p>
                      <p className="text-sm text-gray-500">View and manage all VAs</p>
                    </Link>
                  </div>
                </div>

                <div className="relative rounded-lg border border-purple-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-purple-500 transition-colors">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-md bg-purple-600 text-white">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to="/admin/businesses" className="focus:outline-none">
                      <span className="absolute inset-0" aria-hidden="true" />
                      <p className="text-sm font-medium text-gray-900">Manage Businesses</p>
                      <p className="text-sm text-gray-500">View all registered businesses</p>
                    </Link>
                  </div>
                </div>

                <div className="relative rounded-lg border border-yellow-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-yellow-500 transition-colors">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-md bg-yellow-600 text-white">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to="/admin/approvals" className="focus:outline-none">
                      <span className="absolute inset-0" aria-hidden="true" />
                      <p className="text-sm font-medium text-gray-900">Pending Approvals</p>
                      <p className="text-sm text-gray-500">Review VA applications</p>
                    </Link>
                  </div>
                </div>

                <div className="relative rounded-lg border border-indigo-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-indigo-500 transition-colors">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-md bg-indigo-600 text-white">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to="/admin" className="focus:outline-none">
                      <span className="absolute inset-0" aria-hidden="true" />
                      <p className="text-sm font-medium text-gray-900">Full Admin Panel</p>
                      <p className="text-sm text-gray-500">Complete admin dashboard</p>
                    </Link>
                  </div>
                </div>
              </>
            ) : (
              /* Regular User Quick Actions */
              <>
                <div className="relative rounded-lg border border-blue-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-blue-500 transition-colors">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-md text-white" style={{backgroundColor: '#1e40af'}}>
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to={branding.isESystemsMode ? "/business/profile" : "/va/profile"} className="focus:outline-none">
                      <span className="absolute inset-0" aria-hidden="true" />
                      <p className="text-sm font-medium text-gray-900">Update Profile</p>
                      <p className="text-sm text-gray-500">Keep your profile up to date</p>
                    </Link>
                  </div>
                </div>

                <div className="relative rounded-lg border border-sky-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-sky-500 transition-colors">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-md text-white" style={{backgroundColor: '#1e40af'}}>
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to="/conversations" className="focus:outline-none">
                      <span className="absolute inset-0" aria-hidden="true" />
                      <p className="text-sm font-medium text-gray-900">Check Messages</p>
                      <p className="text-sm text-gray-500">Respond to potential employers</p>
                    </Link>
                  </div>
                </div>

                <div className="relative rounded-lg border border-green-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-green-500 transition-colors">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-md bg-green-600 text-white">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to="/analytics" className="focus:outline-none">
                      <span className="absolute inset-0" aria-hidden="true" />
                      <p className="text-sm font-medium text-gray-900">View Analytics</p>
                      <p className="text-sm text-gray-500">Check your profile performance</p>
                    </Link>
                  </div>
                </div>

                <div className="relative rounded-lg border border-purple-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-purple-500 transition-colors">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-md bg-purple-600 text-white">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to="/notifications" className="focus:outline-none">
                      <span className="absolute inset-0" aria-hidden="true" />
                      <p className="text-sm font-medium text-gray-900">Notifications</p>
                      <p className="text-sm text-gray-500">Stay updated with announcements</p>
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Latest Announcements Section */}
        {latestAnnouncements.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Latest Announcements</h3>
            <div className="space-y-3">
              {latestAnnouncements.map((announcement) => {
                const priorityColors = {
                  urgent: 'bg-red-50 border-red-200 text-red-900',
                  high: 'bg-orange-50 border-orange-200 text-orange-900',
                  normal: 'bg-blue-50 border-blue-200 text-blue-900',
                  low: 'bg-gray-50 border-gray-200 text-gray-900',
                };
                
                const priorityIcons = {
                  urgent: (
                    <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  ),
                  high: (
                    <svg className="h-5 w-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                    </svg>
                  ),
                  normal: (
                    <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                  low: (
                    <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  ),
                };

                return (
                  <div
                    key={announcement._id}
                    className={`${priorityColors[announcement.priority] || priorityColors.low} border rounded-lg p-4 flex items-start space-x-3 transition-all duration-200 hover:shadow-md`}
                  >
                    <div className="flex-shrink-0">
                      {priorityIcons[announcement.priority] || priorityIcons.low}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold">
                          {announcement.title}
                          {!announcement.isRead && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gradient-to-r from-emerald-400 to-cyan-400 text-white">
                              New
                            </span>
                          )}
                        </h4>
                        <span className="text-xs text-gray-500">
                          {new Date(announcement.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div 
                        className="mt-1 text-sm opacity-90"
                        dangerouslySetInnerHTML={{ 
                          __html: announcement.content.length > 150 
                            ? announcement.content.substring(0, 150) + '...' 
                            : announcement.content 
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4">
              <Link 
                to="/notifications" 
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                View all announcements →
              </Link>
            </div>
          </div>
        )}

        {/* Profile Completion Encouragement Banner - Show for incomplete profiles */}
        {!profileCompletion.isComplete && (
          <div className="mt-8">
            <div className="bg-gradient-to-r from-emerald-50 to-cyan-50 border border-emerald-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-5">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-full text-white shadow-lg" style={{backgroundColor: '#1e40af'}}>
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Get Placed Faster with a Complete Profile
                        </h3>
                        <p className="text-sm text-gray-600 leading-relaxed mb-3">
                          Complete your profile to appear higher in search results and increase your visibility to potential employers.
                          VAs with completed profiles get contacted 3x more often and secure placements faster.
                        </p>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center text-xs text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Higher search ranking
                          </div>
                          <div className="flex items-center text-xs text-cyan-700 bg-cyan-100 px-2 py-1 rounded-full">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Increased visibility
                          </div>
                          <div className="flex items-center text-xs text-indigo-700 bg-indigo-100 px-2 py-1 rounded-full">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Faster placement
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-4">
                        <Link 
                          to={branding.isESystemsMode ? "/business/profile" : "/va/profile"} 
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                          style={{backgroundColor: '#1e40af'}}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#1e3a8a'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#1e40af'}
                        >
                          Complete Profile
                          <svg className="ml-2 -mr-1 w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Progress indicator */}
              <div className="bg-gradient-to-r from-emerald-100 to-cyan-100 px-6 py-3 border-t border-emerald-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 font-medium">Profile Completeness</span>
                  <span className="text-emerald-700 font-semibold">{profileCompletion.percentage}% Complete</span>
                </div>
                <div className="mt-2 bg-white rounded-full h-2 overflow-hidden shadow-inner">
                  <div className="h-full rounded-full transition-all duration-500 ease-out" style={{width: `${profileCompletion.percentage}%`, backgroundColor: '#1e40af'}}></div>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Just a few more details needed to reach 100% and maximize your placement opportunities!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}