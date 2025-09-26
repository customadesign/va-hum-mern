import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

const Select = ({
  options = [],
  value,
  onChange,
  placeholder = 'Select...',
  disabled = false,
  multiple = false,
  searchable = false,
  clearable = false,
  className = '',
  size = 'default',
  error = false,
  loading = false,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  const sizes = {
    small: 'px-3 py-1.5 text-sm',
    default: 'px-3 py-2 text-sm',
    large: 'px-4 py-2.5 text-base'
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter options based on search term
  const filteredOptions = searchable && searchTerm
    ? options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  // Get display value
  const getDisplayValue = () => {
    if (multiple) {
      if (!value || value.length === 0) return placeholder;
      const selectedOptions = options.filter(opt => value.includes(opt.value));
      return selectedOptions.map(opt => opt.label).join(', ');
    } else {
      const selectedOption = options.find(opt => opt.value === value);
      return selectedOption ? selectedOption.label : placeholder;
    }
  };

  // Handle option selection
  const handleSelect = (optionValue) => {
    if (multiple) {
      const newValue = value?.includes(optionValue)
        ? value.filter(v => v !== optionValue)
        : [...(value || []), optionValue];
      onChange(newValue);
    } else {
      onChange(optionValue);
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  // Handle clear
  const handleClear = (e) => {
    e.stopPropagation();
    onChange(multiple ? [] : null);
  };

  const hasValue = multiple ? value?.length > 0 : value !== null && value !== undefined;

  return (
    <div ref={dropdownRef} className="relative">
      {/* Select Input */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          relative w-full
          ${sizes[size]}
          border ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
          rounded-md
          bg-white dark:bg-gray-700
          text-black dark:text-white
          ${!hasValue ? 'text-gray-400 dark:text-gray-500' : ''}
          ${disabled ? 'bg-gray-50 dark:bg-gray-800 cursor-not-allowed' : 'cursor-pointer'}
          focus:outline-none focus:ring-2 ${error ? 'focus:ring-red-500' : 'focus:ring-[#1e3a8a] dark:focus:ring-[#5da0f5]'}
          transition-colors duration-200
          ${className}
        `}
      >
        <div className="flex items-center justify-between">
          <span className="block truncate pr-8">
            {getDisplayValue()}
          </span>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            {loading ? (
              <svg className="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : clearable && hasValue ? (
              <button
                onClick={handleClear}
                className="pointer-events-auto text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            ) : (
              <ChevronDownIcon className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            )}
          </div>
        </div>
      </div>

      {/* Dropdown Options */}
      {isOpen && !disabled && (
        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700">
          {searchable && (
            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#1e3a8a] dark:focus:ring-[#5da0f5]"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
          <div className="max-h-60 overflow-auto py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                No options found
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = multiple
                  ? value?.includes(option.value)
                  : value === option.value;

                return (
                  <div
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    className={`
                      relative px-3 py-2 text-sm cursor-pointer
                      ${isSelected
                        ? 'bg-[#1e3a8a] text-white'
                        : 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                      }
                      ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`block truncate ${isSelected ? 'font-semibold' : 'font-normal'}`}>
                        {option.label}
                      </span>
                      {isSelected && (
                        <CheckIcon className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Option component for better organization
Select.Option = ({ value, children, ...props }) => {
  return { value, label: children, ...props };
};

export default Select;