import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery } from 'react-query';
import api from '../../services/api';
import VACard from '../../components/VACard';
import { FunnelIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { INDUSTRIES } from '../../constants/industries';
import { useBranding } from '../../contexts/BrandingContext';

export default function VAList() {
  const { branding } = useBranding();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    specialties: [],
    roleTypes: [],
    roleLevels: [],
    locations: [],
    industry: [],
    yearsOfExperience: '',
    availability: ''
  });
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading, error } = useQuery(
    ['vas', { search, ...filters, page }],
    async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filters.industry.length > 0) {
        filters.industry.forEach(ind => params.append('industry', ind));
      }
      if (filters.yearsOfExperience) params.append('yearsOfExperience', filters.yearsOfExperience);
      if (filters.availability) params.append('availability', filters.availability);
      params.append('page', page);
      params.append('limit', 20);
      
      const response = await api.get(`/vas?${params}`);
      return response.data;
    },
    {
      keepPreviousData: true
    }
  );

  // Fetch industry counts
  const { data: industryCounts } = useQuery(
    'industryCounts',
    async () => {
      const response = await api.get('/vas/industries');
      return response.data;
    }
  );

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
  };

  return (
    <>
      <Helmet>
        <title>Virtual Assistants - {branding.name}</title>
        <meta name="description" content={branding.isESystemsMode ? 'Browse and connect with pre-screened professionals for your team' : 'Browse and connect with talented Filipino virtual assistants'} />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Virtual Assistants
            </h2>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mt-6 bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <form onSubmit={handleSearch} className="sm:flex sm:items-center">
              <div className="w-full sm:max-w-xs">
                <label htmlFor="search" className="sr-only">
                  Search
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    type="search"
                    name="search"
                    id="search"
                    className="shadow-sm focus:ring-gray-500 focus:border-gray-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                    placeholder={branding.isESystemsMode ? "Search team members..." : "Search VAs..."}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <button
                type="submit"
                className="mt-3 w-full inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="mt-3 w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                <FunnelIcon className="h-5 w-5 mr-2 -ml-1" aria-hidden="true" />
                Filters
                {(filters.industry.length > 0 || filters.yearsOfExperience || filters.availability) && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-white">
                    {filters.industry.length + (filters.yearsOfExperience ? 1 : 0) + (filters.availability ? 1 : 0)}
                  </span>
                )}
              </button>
            </form>

            {/* Quick filters */}
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                Actively looking
              </span>
              <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                Philippines
              </span>
              <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                Full-time
              </span>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <div className="mt-6 border-t border-gray-200 pt-6">
                <div className="space-y-6">
                  {/* Industry Filter */}
                  <div className="col-span-full">
                    <label className="block text-sm font-medium text-gray-700 mb-3">Industry</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {INDUSTRIES.map((industry) => {
                        const count = industryCounts?.data?.find(ic => ic.value === industry.value)?.count || 0;
                        return (
                          <label key={industry.value} className="flex items-center">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                              checked={filters.industry.includes(industry.value)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFilters({ ...filters, industry: [...filters.industry, industry.value] });
                                } else {
                                  setFilters({ ...filters, industry: filters.industry.filter(i => i !== industry.value) });
                                }
                                setPage(1);
                              }}
                            />
                            <span className="ml-2 text-sm text-gray-700">
                              {industry.label} {count > 0 && `(${count})`}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Other Filters */}
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {/* Years of Experience */}
                    <div>
                    <label htmlFor="yearsOfExperience" className="block text-sm font-medium text-gray-700">
                      Minimum Years of Experience
                    </label>
                    <select
                      id="yearsOfExperience"
                      value={filters.yearsOfExperience}
                      onChange={(e) => {
                        setFilters({ ...filters, yearsOfExperience: e.target.value });
                        setPage(1);
                      }}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm rounded-md"
                    >
                      <option value="">Any experience</option>
                      <option value="1">1+ years</option>
                      <option value="3">3+ years</option>
                      <option value="5">5+ years</option>
                      <option value="10">10+ years</option>
                    </select>
                  </div>

                  {/* Availability */}
                  <div>
                    <label htmlFor="availability" className="block text-sm font-medium text-gray-700">
                      Availability
                    </label>
                    <select
                      id="availability"
                      value={filters.availability}
                      onChange={(e) => {
                        setFilters({ ...filters, availability: e.target.value });
                        setPage(1);
                      }}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm rounded-md"
                    >
                      <option value="">Any availability</option>
                      <option value="immediately">Immediately</option>
                      <option value="within_week">Within a week</option>
                      <option value="within_month">Within a month</option>
                    </select>
                  </div>
                  </div>
                </div>

                {/* Clear Filters */}
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setFilters({
                        specialties: [],
                        roleTypes: [],
                        roleLevels: [],
                        locations: [],
                        industry: [],
                        yearsOfExperience: '',
                        availability: ''
                      });
                      setPage(1);
                    }}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    <XMarkIcon className="h-4 w-4 mr-1" />
                    Clear all filters
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-sm text-gray-500">Error loading VAs. Please try again.</p>
            </div>
          ) : data?.data?.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No VAs found</h3>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <>
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {data?.data?.map((va) => (
                    <li key={va._id}>
                      <VACard va={va} />
                    </li>
                  ))}
                </ul>
              </div>

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
                        of <span className="font-medium">{data.pagination.total}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => setPage(Math.max(1, page - 1))}
                          disabled={page === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
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
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
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