import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useBranding } from '../contexts/BrandingContext';
import { useSavedVAs } from '../hooks/useSavedVAs';
import SavedVACard from '../components/savedVAs/SavedVACard';

/**
 * Saved VAs Page
 * Displays all VAs saved/bookmarked by the business user
 */
const SavedVAsPage = () => {
  const { branding } = useBranding();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent'); // recent, name, specialty

  // Fetch saved VAs
  const { data: savedVAsData, isLoading, isError } = useSavedVAs();

  const savedVAs = savedVAsData?.data?.data || [];

  // Filter by search query
  const filteredVAs = searchQuery
    ? savedVAs.filter((saved) =>
        saved.va?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : savedVAs;

  // Sort VAs
  const sortedVAs = [...filteredVAs].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return (a.va?.name || '').localeCompare(b.va?.name || '');
      case 'specialty':
        const aSpecialty = a.va?.specialties?.[0] || '';
        const bSpecialty = b.va?.specialties?.[0] || '';
        return aSpecialty.localeCompare(bSpecialty);
      case 'recent':
      default:
        return new Date(b.savedAt) - new Date(a.savedAt);
    }
  });

  return (
    <>
      <Helmet>
        <title>Saved VAs - {branding.name}</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="md:flex md:items-center md:justify-between mb-8">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-gray-900">Saved VAs</h1>
              <p className="mt-2 text-sm text-gray-600">
                Virtual assistants you've saved to review later
              </p>
            </div>
          </div>

          {/* Search and Sort Controls */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search saved VAs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="sm:w-48">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="block w-full pl-3 pr-10 py-3 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg"
              >
                <option value="recent">Recently Saved</option>
                <option value="name">Name (A-Z)</option>
                <option value="specialty">Specialty</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          {!isLoading && !isError && savedVAs.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                {filteredVAs.length === savedVAs.length ? (
                  <>
                    <span className="font-semibold text-gray-900">{savedVAs.length}</span>{' '}
                    {savedVAs.length === 1 ? 'VA' : 'VAs'} saved
                  </>
                ) : (
                  <>
                    Showing{' '}
                    <span className="font-semibold text-gray-900">{filteredVAs.length}</span>{' '}
                    of {savedVAs.length} saved VAs
                  </>
                )}
              </p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse"
                >
                  <div className="p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="h-14 w-14 rounded-full bg-gray-200"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <svg
                className="h-12 w-12 text-red-400 mx-auto mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <h3 className="text-lg font-medium text-red-900 mb-2">
                Failed to load saved VAs
              </h3>
              <p className="text-sm text-red-700 mb-4">
                We couldn't load your saved VAs. Please try again.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !isError && savedVAs.length === 0 && (
            <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
              <svg
                className="h-16 w-16 text-gray-400 mx-auto mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No saved VAs yet
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Browse VAs and click the Save button to add them here for later review
              </p>
              <a
                href="/vas"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Browse Virtual Assistants
                <svg
                  className="ml-2 -mr-1 h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </a>
            </div>
          )}

          {/* No Search Results */}
          {!isLoading && !isError && savedVAs.length > 0 && filteredVAs.length === 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
              <svg
                className="h-12 w-12 text-gray-400 mx-auto mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
              <p className="text-sm text-gray-600">
                No saved VAs match your search "{searchQuery}"
              </p>
            </div>
          )}

          {/* Saved VAs Grid */}
          {!isLoading && !isError && sortedVAs.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedVAs.map((savedVA) => (
                <SavedVACard key={savedVA._id || savedVA.id} savedVA={savedVA} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SavedVAsPage;