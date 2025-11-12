import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { debounce } from 'lodash';
import api from '../../services/api';
import {
  MagnifyingGlassIcon,
  UserIcon,
  BriefcaseIcon,
  UsersIcon,
  ChatBubbleLeftRightIcon,
  BellIcon,
  ChatBubbleBottomCenterTextIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const UniversalSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Entity icons mapping
  const entityIcons = {
    va: UsersIcon,
    business: BriefcaseIcon,
    user: UserIcon,
    message: ChatBubbleLeftRightIcon,
    notification: BellIcon,
    conversation: ChatBubbleBottomCenterTextIcon,
  };

  // Entity type labels
  const entityLabels = {
    vas: 'Virtual Assistants',
    businesses: 'Businesses',
    users: 'Users',
    messages: 'Messages',
    notifications: 'Notifications',
    conversations: 'Conversations',
  };

  // Entity colors for better visual distinction
  const entityColors = {
    va: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20',
    business: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20',
    user: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20',
    message: 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20',
    notification: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20',
    conversation: 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900/20',
  };

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchQuery) => {
      if (!searchQuery || searchQuery.trim().length < 2) {
        setResults(null);
        setShowDropdown(false);
        return;
      }

      setLoading(true);
      try {
        const response = await api.get('/admin/search/universal', {
          params: { query: searchQuery, limit: 5 }
        });
        
        if (response.data.success) {
          setResults(response.data.data);
          setShowDropdown(true);
          setSelectedIndex(-1);
        }
      } catch (error) {
        console.error('Search error:', error);
        setResults(null);
      } finally {
        setLoading(false);
      }
    }, 800),
    []
  );

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  // Navigate to result
  const handleResultClick = (result) => {
    console.log('🔍 Search result clicked:', result);
    console.log('🔗 Navigating to:', result.link);
    setQuery('');
    setShowDropdown(false);
    setResults(null);
    navigate(result.link);
  };

  // Clear search
  const handleClear = () => {
    setQuery('');
    setResults(null);
    setShowDropdown(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!showDropdown || !results) return;

    const allResults = [];
    Object.keys(entityLabels).forEach(category => {
      if (results[category] && results[category].length > 0) {
        allResults.push(...results[category]);
      }
    });

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < allResults.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : allResults.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < allResults.length) {
          handleResultClick(allResults[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculate total results
  const getTotalResults = () => {
    if (!results) return 0;
    return Object.values(results).reduce((total, items) => 
      total + (Array.isArray(items) ? items.length : 0), 0
    );
  };

  // Flatten results for keyboard navigation
  const getFlatResults = () => {
    const flat = [];
    if (!results) return flat;
    
    Object.keys(entityLabels).forEach(category => {
      if (results[category] && results[category].length > 0) {
        results[category].forEach((item, index) => {
          flat.push({ ...item, category, globalIndex: flat.length });
        });
      }
    });
    return flat;
  };

  const flatResults = getFlatResults();

  return (
    <div className="relative flex-1 max-w-lg mx-4" ref={searchRef}>
      {/* Search Input */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={handleSearchChange}
          onKeyDown={handleKeyDown}
          placeholder="Search VAs, Businesses, Users..."
          className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] dark:focus:ring-[#5da0f5] transition-all"
        />
        {/* Loading spinner */}
        {loading && (
          <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
          </div>
        )}
        {/* Clear button */}
        {query && !loading && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showDropdown && results && getTotalResults() > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-h-[500px] overflow-y-auto z-50"
        >
          {/* Results by category */}
          {Object.keys(entityLabels).map((category) => {
            if (!results[category] || results[category].length === 0) return null;

            return (
              <div key={category} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                {/* Category header */}
                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 sticky top-0 z-10">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {entityLabels[category]}
                  </h3>
                </div>

                {/* Category results */}
                <div className="py-1">
                  {results[category].map((result, index) => {
                    const Icon = entityIcons[result.type];
                    const globalIdx = flatResults.findIndex(r => r.id === result.id);
                    const isSelected = selectedIndex === globalIdx;

                    return (
                      <button
                        key={result.id}
                        onClick={() => handleResultClick(result)}
                        className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left ${
                          isSelected ? 'bg-gray-100 dark:bg-gray-700' : ''
                        }`}
                      >
                        {/* Icon */}
                        <div className={`p-2 rounded-lg ${entityColors[result.type]}`}>
                          <Icon className="h-5 w-5" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {result.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                            {result.description}
                          </p>
                          {result.meta && (
                            <div className="flex items-center gap-2 mt-1">
                              {result.meta.status && (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                  result.meta.status === 'active' 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                                }`}>
                                  {result.meta.status}
                                </span>
                              )}
                              {result.meta.isAdmin && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                                  Admin
                                </span>
                              )}
                              {result.meta.hourlyRate && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  ${result.meta.hourlyRate}/hr
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Results summary */}
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {getTotalResults()} results found for "{query}"
            </p>
          </div>
        </div>
      )}

      {/* No results message */}
      {showDropdown && results && getTotalResults() === 0 && !loading && (
        <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-8 text-center z-50">
          <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No results found for "{query}"
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Try searching with different keywords
          </p>
        </div>
      )}
    </div>
  );
};

export default UniversalSearch;