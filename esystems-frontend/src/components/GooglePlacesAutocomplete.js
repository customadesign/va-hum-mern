import React, { useRef, useEffect, useState } from 'react';
import { LoadScript, Autocomplete } from '@react-google-maps/api';
import { MapPinIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const libraries = ['places'];

const GooglePlacesAutocomplete = ({ 
  onPlaceSelected, 
  placeholder = "Search for your office address",
  defaultValue = "",
  apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'AIzaSyASgY24eTreJFqEFsSnRrNAMQNKg-dbmNs'
}) => {
  const [autocomplete, setAutocomplete] = useState(null);
  const [inputValue, setInputValue] = useState(defaultValue);
  const [isLoaded, setIsLoaded] = useState(false);

  const onLoad = (autocompleteInstance) => {
    setAutocomplete(autocompleteInstance);
    setIsLoaded(true);
  };

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      
      if (place.address_components) {
        const addressComponents = place.address_components;
        const formattedAddress = place.formatted_address;
        
        // Parse address components
        let streetNumber = '';
        let streetName = '';
        let city = '';
        let state = '';
        let country = '';
        let postalCode = '';
        
        addressComponents.forEach(component => {
          const types = component.types;
          
          if (types.includes('street_number')) {
            streetNumber = component.long_name;
          }
          if (types.includes('route')) {
            streetName = component.long_name;
          }
          if (types.includes('locality')) {
            city = component.long_name;
          }
          if (types.includes('administrative_area_level_1')) {
            state = component.long_name;
          }
          if (types.includes('country')) {
            country = component.long_name;
          }
          if (types.includes('postal_code')) {
            postalCode = component.long_name;
          }
        });
        
        const streetAddress = streetNumber && streetName 
          ? `${streetNumber} ${streetName}` 
          : streetName || '';
        
        // Call the parent callback with parsed data
        onPlaceSelected({
          streetAddress,
          city,
          state,
          country,
          postalCode,
          formattedAddress,
          placeId: place.place_id,
          latitude: place.geometry?.location?.lat(),
          longitude: place.geometry?.location?.lng()
        });
        
        setInputValue(formattedAddress);
      }
    }
  };

  return (
    <LoadScript
      googleMapsApiKey={apiKey}
      libraries={libraries}
      loadingElement={
        <div className="flex items-center justify-center p-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-500">Loading Google Maps...</span>
        </div>
      }
    >
      <div className="relative">
        <Autocomplete
          onLoad={onLoad}
          onPlaceChanged={onPlaceChanged}
          options={{
            types: ['address'],
            componentRestrictions: { country: ['us', 'ca', 'gb', 'au'] }, // You can remove this to allow all countries
          }}
        >
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MapPinIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder={placeholder}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            {isLoaded && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
            )}
          </div>
        </Autocomplete>
        <p className="mt-1 text-xs text-gray-500">
          Powered by Google Maps - Start typing to search for your office location
        </p>
      </div>
    </LoadScript>
  );
};

export default GooglePlacesAutocomplete;