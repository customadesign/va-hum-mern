import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import {
  BookmarkIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ViewColumnsIcon,
  ListBulletIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { toast } from 'react-toastify';
import { useBranding } from '../contexts/BrandingContext';
import { useAuth } from '../contexts/AuthContext';
import savedVAsService from '../services/savedVAs';
import VACard from '../components/VACard';
import SaveVAButton from '../components/SaveVAButton';

export default function SavedVAs() {
  const { branding, loading: brandingLoading } = useBranding();
  const { user, loading: authLoading } = useAuth();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('saved_date');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [filters, setFilters] = useState({
    status: 'all', // 'all', 'active', 'inactive'
    industry: [],
    specialties: []
  });
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Check if user can access saved VAs
  const canAccessSavedVAs = () => {
    // Debug logging
    console.log('SavedVAs Access Check:', {
      hasUser: !!user,
      userRole: user?.role,
      hasBusiness: !!user?.business,
      isESystemsMode: branding?.isESystemsMode,
      userEmail: user?.email
    });

    return user &&
           user.business &&
           user.role === 'business' &&
           branding.isESystemsMode;
  };

  // Track page view analytics
  useEffect(() => {
    if (canAccessSavedVAs() && window.gtag) {
      window.gtag('event', 'saved_vas_page_viewed', {
        user_role: user.role,
        brand: 'esystems',
        page: '/saved-vas'
      });
    }
  }, [user, branding.isESystemsMode]);

  // Fetch saved VAs
  const { data, isLoading, error, refetch } = useQuery(
    ['savedVAs', { search, sortBy, ...filters, page }],
    async () => {
      const params = {
        page,
        limit: 20,
        sortBy
      };

      if (search) params.search = search;
      if (filters.status !== 'all') params.status = filters.status;
      if (filters.industry.length > 0) params.industry = filters.industry;
      if (filters.specialties.length > 0) params.specialties = filters.specialties;

      return await savedVAsService.getSavedVAs(params);
    },
    {
      enabled: canAccessSavedVAs(),
      keepPreviousData: true
    }
  );

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);

    // Track search analytics
    if (search.trim() && window.gtag) {
      window.gtag('event', 'saved_vas_search_used', {
        search_term: search.trim(),
        user_role: user.role,
        brand: 'esystems',
        page: '/saved-vas'
      });
    }
  };

  // Handle unsave VA (for grid view action buttons)
  const handleUnsaveVA = async (vaId, vaName) => {
    try {
      await savedVAsService.unsaveVA(vaId);
      toast.success(`${vaName} removed from saved list`);
      refetch();
    } catch (error) {
      toast.error('Failed to remove from saved list');
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      status: 'all',
      industry: [],
      specialties: []
    });
    setSearch('');
    setSortBy('saved_date');
    setPage(1);
  };

  // ---------- UI helpers (Grid view) ----------
  const getFullName = (va) => {
    if (!va) return 'Unnamed';
    const base = [va.firstName, va.lastName].filter(Boolean).join(' ').trim();
    return base || va.displayName || va.name || 'Unnamed';
  };

  const getHero = (va) => {
    if (!va) return '';
    return va.hero || va.headline || va.title || '';
  };

  const filterSpecialties = (va) => {
    const list = Array.isArray(va?.specialties) ? va.specialties : [];
    return list.filter((s) => s?.name && s.name.toLowerCase() !== 'other');
  };

  const visibleSpecialties = (va, max = 6) => {
    const filtered = filterSpecialties(va);
    return filtered.slice(0, max);
  };

  const remainingSpecialtiesCount = (va, max = 6) => {
    const filtered = filterSpecialties(va);
    const extra = filtered.length - max;
    return extra > 0 ? extra : 0;
  };

  // Show loading state while auth/branding is loading
  if (authLoading || brandingLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  // Redirect if user doesn't have access
  if (!canAccessSavedVAs()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow rounded-lg p-6">
          <div className="text-center">
            <BookmarkIcon className="mx-auto h-12 w-12 text-gray-700" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Access Restricted</h3>
            <p className="mt-1 text-sm text-gray-700">
              This feature is available to E-Systems business accounts only.
            </p>
            <div className="mt-6">
              <Link
                to="/vas"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Browse Team Members
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Saved Team Members - {branding.name}</title>
        <meta name="description" content="Manage your saved team members and professionals" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center">
              <BookmarkSolidIcon
                className="h-8 w-8 mr-3"
                style={{ color: branding.primaryColor }}
              />
              <h2
                style={{ color: branding.primaryColor }}
                className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate"
              >
                Saved Team Members
              </h2>
            </div>
            <p className="mt-1 text-sm text-gray-700">
              Manage your collection of saved professionals
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <div className="inline-flex rounded-md shadow-sm">
              <button
                onClick={() => {
                  setViewMode('list');
                  // Track view mode change
                  if (window.gtag && viewMode !== 'list') {
                    window.gtag('event', 'saved_vas_view_mode_changed', {
                      view_mode: 'list',
                      user_role: user.role,
                      brand: 'esystems',
                      page: '/saved-vas'
                    });
                  }
                }}
                className={`relative inline-flex items-center px-3 py-2 rounded-l-md border text-sm font-medium focus:z-10 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 ${
                  viewMode === 'list'
                    ? 'bg-orange-50 border-orange-200 text-orange-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <ListBulletIcon className="h-4 w-4" />
                <span className="ml-2 hidden sm:block">List</span>
              </button>
              <button
                onClick={() => {
                  setViewMode('grid');
                  // Track view mode change
                  if (window.gtag && viewMode !== 'grid') {
                    window.gtag('event', 'saved_vas_view_mode_changed', {
                      view_mode: 'grid',
                      user_role: user.role,
                      brand: 'esystems',
                      page: '/saved-vas'
                    });
                  }
                }}
                className={`relative inline-flex items-center px-3 py-2 rounded-r-md border text-sm font-medium focus:z-10 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 ${
                  viewMode === 'grid'
                    ? 'bg-orange-50 border-orange-200 text-orange-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <ViewColumnsIcon className="h-4 w-4" />
                <span className="ml-2 hidden sm:block">Grid</span>
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mt-6 bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <form onSubmit={handleSearch} className="sm:flex sm:items-center">
              <div className="w-full sm:max-w-xs">
                <label htmlFor="search" className="sr-only">Search</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-700" aria-hidden="true" />
                  </div>
                  <input
                    type="search"
                    name="search"
                    id="search"
                    className="shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                    placeholder="Search saved team members..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-3 sm:mt-0 sm:ml-3">
                <select
                  value={sortBy}
                  onChange={(e) => {
                    const newSortBy = e.target.value;
                    setSortBy(newSortBy);

                    // Track sort usage
                    if (window.gtag) {
                      window.gtag('event', 'saved_vas_sort_used', {
                        sort_option: newSortBy,
                        user_role: user.role,
                        brand: 'esystems',
                        page: '/saved-vas'
                      });
                    }
                  }}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md"
                >
                  <option value="saved_date">Recently Saved</option>
                  <option value="name">Name (A-Z)</option>
                  <option value="experience">Experience</option>
                  <option value="last_active">Last Active</option>
                </select>
              </div>
              <button
                type="submit"
                style={{ backgroundColor: branding.accentColor }}
                className="mt-3 w-full inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm font-medium rounded-md text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="mt-3 w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                <FunnelIcon className="h-5 w-5 mr-2 -ml-1" aria-hidden="true" />
                Filters
                {(filters.status !== 'all' || filters.industry.length > 0 || filters.specialties.length > 0) && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    {(filters.status !== 'all' ? 1 : 0) + filters.industry.length + filters.specialties.length}
                  </span>
                )}
              </button>
            </form>

            {/* Expanded Filters */}
            {showFilters && (
              <div className="mt-6 border-t border-gray-200 pt-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  {/* Status Filter */}
                  <div>
                    <label htmlFor="status" style={{ color: branding.primaryColor }} className="block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <select
                      id="status"
                      value={filters.status}
                      onChange={(e) => {
                        const newStatus = e.target.value;
                        setFilters({ ...filters, status: newStatus });
                        setPage(1);

                        // Track filter usage
                        if (window.gtag && newStatus !== 'all') {
                          window.gtag('event', 'saved_vas_filter_used', {
                            filter_type: 'status',
                            filter_value: newStatus,
                            user_role: user.role,
                            brand: 'esystems',
                            page: '/saved-vas'
                          });
                        }
                      }}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md"
                    >
                      <option value="all">All</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Clear Filters */}
                <div className="mt-4 flex justify-between items-center">
                  <p className="text-sm text-gray-700">
                    {data?.data?.length || 0} saved team members
                  </p>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                  >
                    <XMarkIcon className="h-4 w-4 mr-1" />
                    Clear all
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="mt-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <BookmarkIcon className="mx-auto h-12 w-12 text-gray-700" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading saved team members</h3>
              <p className="mt-1 text-sm text-gray-700">Please try again later.</p>
              <div className="mt-6">
                <button
                  onClick={() => refetch()}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : data?.data?.length === 0 ? (
            <div className="text-center py-12">
              <BookmarkIcon className="mx-auto h-12 w-12 text-gray-700" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No saved team members</h3>
              <p className="mt-1 text-sm text-gray-700">
                {search || filters.status !== 'all' || filters.industry.length > 0 || filters.specialties.length > 0
                  ? 'Try adjusting your search or filters.'
                  : 'Start saving team members you\'re interested in.'
                }
              </p>
              <div className="mt-6">
                {search || filters.status !== 'all' || filters.industry.length > 0 || filters.specialties.length > 0 ? (
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                  >
                    Clear Filters
                  </button>
                ) : (
                  <Link
                    to="/vas"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                  >
                    Browse Team Members
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <>
              {viewMode === 'list' ? (
                /* List View */
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <ul className="divide-y divide-gray-200">
                    {data?.data?.map((savedVA) => (
                      <li key={savedVA._id} className="relative">
                        <div className="pr-16 md:pr-20">
                          <VACard va={savedVA.va} />
                        </div>
                        {/* Save button overlay */}
                        <div className="absolute top-4 right-4">
                          <SaveVAButton
                            vaId={savedVA.va._id}
                            vaName={`${savedVA.va.firstName} ${savedVA.va.lastName}`}
                            size="sm"
                            showText={false}
                          />
                        </div>
                        {/* Saved date */}
                        <div className="absolute bottom-4 right-16 text-xs text-gray-700">
                          Saved {new Date(savedVA.savedAt).toLocaleDateString()}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                /* Grid View */
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {data?.data?.map((savedVA) => (
                    <div
                      key={savedVA._id}
                      className="bg-white overflow-hidden shadow rounded-lg relative flex flex-col h-full"
                    >
                      <Link to={`/vas/${savedVA.va._id}`} className="block flex-1">
                        <div className="p-6 h-full flex flex-col">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              {savedVA.va.avatar ? (
                                <img
                                  className="h-16 w-16 rounded-full object-cover"
                                  src={savedVA.va.avatar}
                                  alt={getFullName(savedVA.va)}
                                />
                              ) : (
                                <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                                  <span className="text-xl font-medium text-gray-700">
                                    {savedVA.va.firstName?.[0]?.toUpperCase() || 'P'}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="ml-4 flex-1 min-w-0">
                              {/* Name (show clearly, clamp to 2 lines) */}
                              <h3
                                className="text-lg font-medium text-gray-900"
                                style={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden'
                                }}
                              >
                                {getFullName(savedVA.va)}
                              </h3>

                              {/* Headline/Hero (clamp to 2 lines) */}
                              {getHero(savedVA.va) && (
                                <p
                                  className="text-sm text-gray-700 mt-0.5"
                                  style={{
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                  }}
                                >
                                  {getHero(savedVA.va)}
                                </p>
                              )}

                              {savedVA.va.yearsOfExperience && (
                                <p className="text-xs text-gray-700 mt-1">
                                  {savedVA.va.yearsOfExperience} years experience
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Specialties — show visibly with wrap */}
                          {filterSpecialties(savedVA.va).length > 0 && (
                            <div className="mt-4">
                              <div className="flex flex-wrap gap-1">
                                {visibleSpecialties(savedVA.va, 6).map((specialty, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                                  >
                                    {specialty.name}
                                  </span>
                                ))}
                                {remainingSpecialtiesCount(savedVA.va, 6) > 0 && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    +{remainingSpecialtiesCount(savedVA.va, 6)} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Push footer to bottom */}
                          <div className="mt-auto"></div>
                        </div>
                      </Link>

                      {/* Action buttons */}
                      <div className="absolute top-4 right-4">
                        <SaveVAButton
                          vaId={savedVA.va._id}
                          vaName={getFullName(savedVA.va)}
                          size="sm"
                          showText={false}
                        />
                      </div>

                      {/* Saved date */}
                      <div className="px-6 pb-4 pr-16">
                        <p className="text-xs text-gray-700">
                          Saved on {new Date(savedVA.savedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {data?.pagination && data.pagination.pages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4 rounded-lg shadow">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(Math.min(data.pagination.pages, page + 1))}
                      disabled={page === data.pagination.pages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing{' '}
                        <span className="font-medium">{(page - 1) * data.pagination.limit + 1}</span>{' '}
                        to{' '}
                        <span className="font-medium">
                          {Math.min(page * data.pagination.limit, data.pagination.total)}
                        </span>{' '}
                        of <span className="font-medium">{data.pagination.total}</span> saved team members
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => setPage(Math.max(1, page - 1))}
                          disabled={page === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          <span className="sr-only">Previous</span>
                          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                          Page {page} of {data.pagination.pages}
                        </span>
                        <button
                          onClick={() => setPage(Math.min(data.pagination.pages, page + 1))}
                          disabled={page === data.pagination.pages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          <span className="sr-only">Next</span>
                          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}