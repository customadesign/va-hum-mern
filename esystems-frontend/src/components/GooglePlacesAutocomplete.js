import React, { useEffect, useRef, useState } from 'react';

const GOOGLE_MAPS_API_KEY = 'AIzaSyASgY24eTreJFqEFsSnRrNAMQNKg-dbmNs';

// Load Google Maps script
const loadGoogleMapsScript = () => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      resolve();
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', resolve);
      existingScript.addEventListener('error', reject);
      return;
    }

    // Create and load script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.addEventListener('load', resolve);
    script.addEventListener('error', reject);
    document.head.appendChild(script);
  });
};

const GooglePlacesAutocomplete = ({ 
  onPlaceSelected, 
  placeholder = "Enter your address",
  className = "",
  value = "",
  name = "",
  id = ""
}) => {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    loadGoogleMapsScript()
      .then(() => {
        setIsLoaded(true);
      })
      .catch((error) => {
        console.error('Error loading Google Maps script:', error);
      });
  }, []);

  useEffect(() => {
    if (!isLoaded || !inputRef.current) return;

    // Initialize Google Places Autocomplete
    const options = {
      componentRestrictions: { country: 'ph' }, // Restrict to Philippines
      fields: ['address_components', 'formatted_address', 'geometry', 'name'],
      types: ['address']
    };

    autocompleteRef.current = new window.google.maps.places.Autocomplete(
      inputRef.current,
      options
    );

    // Listen for place selection
    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current.getPlace();
      
      if (!place || !place.address_components) {
        return;
      }

      // Parse address components
      const addressComponents = place.address_components;
      const parsedAddress = {
        street: '',
        city: '',
        province: '',
        barangay: '',
        postalCode: '',
        country: 'Philippines',
        formattedAddress: place.formatted_address || ''
      };

      // Extract components
      addressComponents.forEach(component => {
        const types = component.types;
        
        if (types.includes('street_number') || types.includes('route')) {
          parsedAddress.street += (parsedAddress.street ? ' ' : '') + component.long_name;
        }
        
        if (types.includes('sublocality') || types.includes('sublocality_level_1')) {
          // Barangay is usually a sublocality in Philippines
          parsedAddress.barangay = component.long_name;
        }
        
        if (types.includes('locality') || types.includes('administrative_area_level_2')) {
          parsedAddress.city = component.long_name;
        }
        
        if (types.includes('administrative_area_level_1')) {
          parsedAddress.province = component.long_name;
        }
        
        if (types.includes('postal_code')) {
          parsedAddress.postalCode = component.long_name;
        }
      });

      // If street is empty, try to use the place name
      if (!parsedAddress.street && place.name) {
        parsedAddress.street = place.name;
      }

      // Update input value
      setInputValue(place.formatted_address);

      // Call the callback with parsed address
      if (onPlaceSelected) {
        onPlaceSelected(parsedAddress);
      }
    });

    // Cleanup
    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [isLoaded, onPlaceSelected]);

  const handleChange = (e) => {
    setInputValue(e.target.value);
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={className}
        name={name}
        id={id}
        autoComplete="off"
      />
      {!isLoaded && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full"></div>
        </div>
      )}
    </div>
  );
};

export default GooglePlacesAutocomplete;
