import React, { useEffect, useRef, useState } from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';

const GooglePlacesAutocomplete = ({ 
  onPlaceSelect, 
  placeholder = "Start typing your address...",
  defaultValue = "",
  className = ""
}) => {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if Google Maps API is loaded
    if (!window.google || !window.google.maps || !window.google.maps.places) {
      // Load Google Maps API
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setIsLoading(false);
        initializeAutocomplete();
      };
      script.onerror = () => {
        setError('Failed to load Google Maps API');
        setIsLoading(false);
      };
      
      // Check if script already exists
      const existingScript = document.querySelector(`script[src="${script.src}"]`);
      if (!existingScript) {
        document.head.appendChild(script);
      } else {
        // If script exists, wait for it to load
        existingScript.addEventListener('load', () => {
          setIsLoading(false);
          initializeAutocomplete();
        });
      }
    } else {
      setIsLoading(false);
      initializeAutocomplete();
    }

    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const initializeAutocomplete = () => {
    if (!inputRef.current || !window.google?.maps?.places) return;

    // Create autocomplete instance with Philippines restriction
    autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'ph' },
      fields: ['address_components', 'formatted_address', 'geometry'],
      types: ['address']
    });

    // Add place changed listener
    autocompleteRef.current.addListener('place_changed', handlePlaceSelect);
  };

  const handlePlaceSelect = () => {
    const place = autocompleteRef.current.getPlace();
    
    if (!place.address_components) {
      return;
    }

    // Parse address components
    const addressData = {
      street: '',
      barangay: '',
      city: '',
      province: '',
      postal_code: '',
      formatted_address: place.formatted_address || ''
    };

    // Extract components
    place.address_components.forEach((component) => {
      const types = component.types;

      // Street number and route
      if (types.includes('street_number')) {
        addressData.street = component.long_name + ' ' + addressData.street;
      }
      if (types.includes('route')) {
        addressData.street += component.long_name;
      }

      // Barangay (neighborhood/sublocality)
      if (types.includes('neighborhood') || types.includes('sublocality_level_1') || types.includes('sublocality')) {
        addressData.barangay = component.long_name;
      }

      // City (locality or administrative_area_level_2)
      if (types.includes('locality')) {
        addressData.city = component.long_name;
      } else if (types.includes('administrative_area_level_2') && !addressData.city) {
        // Sometimes city is stored as admin area level 2
        addressData.city = component.long_name;
      }

      // Province (administrative_area_level_1)
      if (types.includes('administrative_area_level_1')) {
        addressData.province = component.long_name;
      }

      // Postal code
      if (types.includes('postal_code')) {
        addressData.postal_code = component.long_name;
      }
    });

    // Clean up street address
    addressData.street = addressData.street.trim();

    // If no street was found, try to extract from formatted address
    if (!addressData.street && place.formatted_address) {
      // Extract the first part before the first comma as street
      const parts = place.formatted_address.split(',');
      if (parts.length > 0) {
        addressData.street = parts[0].trim();
      }
    }

    // Call the callback with parsed data
    if (onPlaceSelect) {
      onPlaceSelect(addressData);
    }
  };

  if (error) {
    return (
      <div className="text-red-600 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <MapPinIcon className="h-5 w-5 text-gray-400" />
      </div>
      <input
        ref={inputRef}
        type="text"
        defaultValue={defaultValue}
        placeholder={placeholder}
        disabled={isLoading}
        className={`block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm 
          focus:ring-gray-500 focus:border-gray-500 sm:text-sm
          ${isLoading ? 'bg-gray-50' : ''}`}
      />
      {isLoading && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
        </div>
      )}
    </div>
  );
};

export default GooglePlacesAutocomplete;