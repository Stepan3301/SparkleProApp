import React, { useEffect, useRef, useState } from 'react';

interface ModernAddressAutocompleteProps {
  value: string;
  onChange: (address: string, placeDetails?: any) => void;
  placeholder?: string;
  className?: string;
}

const ModernAddressAutocomplete: React.FC<ModernAddressAutocompleteProps> = ({
  value,
  onChange,
  placeholder = "Search for an address...",
  className = ""
}) => {
  const autocompleteRef = useRef<HTMLElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [autocompleteElement, setAutocompleteElement] = useState<any>(null);
  const [useTraditionalAPI, setUseTraditionalAPI] = useState(false);
  const [internalValue, setInternalValue] = useState(value || '');
  const internalValueRef = useRef(internalValue);

  // Load Google Maps API with new Places library
  useEffect(() => {
    const loadGoogleMaps = async () => {
      console.log('ModernAddressAutocomplete: Starting Google Maps initialization');
      
      // Check if already loaded
      if (window.google && window.google.maps && (window as any).google?.maps?.importLibrary) {
        console.log('ModernAddressAutocomplete: Google Maps already loaded');
        setIsLoaded(true);
        return;
      }

      // Check if script already exists
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        console.log('ModernAddressAutocomplete: Script exists, waiting for Google Maps to be ready');
        const checkGoogle = () => {
          if (window.google && window.google.maps && (window as any).google?.maps?.importLibrary) {
            console.log('ModernAddressAutocomplete: Google Maps is now ready');
            setIsLoaded(true);
          } else {
            setTimeout(checkGoogle, 100);
          }
        };
        checkGoogle();
        return;
      }

      const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.error('ModernAddressAutocomplete: Google Maps API key not found');
        return;
      }

      console.log('ModernAddressAutocomplete: Loading Google Maps script');
      
      // Create script with new API - use a more generic callback name to avoid conflicts
      // Include both marker and places libraries for fallback compatibility
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker,places&loading=async&callback=initGoogleMapsAPI`;
      script.async = true;
      script.defer = true;
      
      // Use a global callback that can be reused
      if (!(window as any).initGoogleMapsAPI) {
        (window as any).initGoogleMapsAPI = async () => {
          try {
            console.log('ModernAddressAutocomplete: Google Maps callback triggered');
            
            // Check if traditional places API is available (for fallback)
            if (window.google?.maps?.places) {
              console.log('ModernAddressAutocomplete: Traditional Places API available');
            }
            
            // Try to import the new Places library (may fail, that's okay)
            try {
              await (window as any).google.maps.importLibrary("places");
              await (window as any).google.maps.importLibrary("maps");
              console.log('ModernAddressAutocomplete: New Places library imported successfully');
            } catch (importError) {
              console.warn('ModernAddressAutocomplete: New Places library import failed (will use traditional):', importError);
            }
            
            console.log('ModernAddressAutocomplete: Libraries loading completed');
            setIsLoaded(true);
            // Trigger loading for any other components waiting
            document.dispatchEvent(new CustomEvent('googleMapsLoaded'));
          } catch (error) {
            console.error('ModernAddressAutocomplete: Error during Google Maps initialization:', error);
            // Still set as loaded so the component can try the traditional API
            setIsLoaded(true);
          }
        };
      }
      
      script.onerror = (error) => {
        console.error('ModernAddressAutocomplete: Failed to load Google Maps script:', error);
      };
      
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, []);

  // Initialize autocomplete - try new API first, fallback to traditional
  useEffect(() => {
    if (!isLoaded) {
      console.log('ModernAddressAutocomplete: Google Maps not loaded yet, skipping autocomplete initialization');
      return;
    }

    const initAutocomplete = async () => {
      try {
        console.log('ModernAddressAutocomplete: Attempting to use new Places API');
        
        // Try the new Places API first
        const { PlaceAutocompleteElement } = await (window as any).google.maps.importLibrary("places");
        console.log('ModernAddressAutocomplete: PlaceAutocompleteElement imported successfully');
        
        // Create the new PlaceAutocompleteElement
        const autocompleteElement = new PlaceAutocompleteElement();
        console.log('ModernAddressAutocomplete: PlaceAutocompleteElement created');
        
        // Configure the autocomplete
        autocompleteElement.id = 'modern-place-autocomplete';
        autocompleteElement.placeholder = placeholder;
        
        console.log('ModernAddressAutocomplete: Autocomplete configuration completed');

        // Replace the placeholder div with the autocomplete element
        if (autocompleteRef.current && autocompleteRef.current.parentNode) {
          autocompleteRef.current.parentNode.replaceChild(autocompleteElement, autocompleteRef.current);
          autocompleteRef.current = autocompleteElement;
          setAutocompleteElement(autocompleteElement);
          console.log('ModernAddressAutocomplete: New API autocomplete element attached to DOM');
        } else {
          throw new Error('Failed to attach autocomplete element - ref or parent not found');
        }

        // Set up event listener for place selection using the new API
        autocompleteElement.addEventListener('gmp-placeselect', async (event: any) => {
          console.log('ModernAddressAutocomplete: Place selected event triggered:', event);
          const place = event.place;
          
          if (place) {
            try {
              console.log('ModernAddressAutocomplete: Fetching place details for:', place);
              
              // Fetch place details using the new API
              await place.fetchFields({
                fields: ['displayName', 'formattedAddress', 'location', 'addressComponents']
              });
              
              console.log('ModernAddressAutocomplete: Place details fetched successfully:', {
                displayName: place.displayName,
                formattedAddress: place.formattedAddress,
                location: place.location,
                addressComponents: place.addressComponents
              });
              
              if (place.formattedAddress) {
                const placeDetails = {
                  displayName: place.displayName,
                  formattedAddress: place.formattedAddress,
                  location: place.location ? {
                    lat: place.location.lat(),
                    lng: place.location.lng()
                  } : undefined,
                  addressComponents: place.addressComponents
                };
                
                console.log('ModernAddressAutocomplete: Calling onChange with place details:', placeDetails);
                
                // Update internal value and call onChange
                setInternalValue(place.formattedAddress);
                onChange(place.formattedAddress, placeDetails);
                
                // Update map if available
                if (map && place.location) {
                  const location = {
                    lat: place.location.lat(),
                    lng: place.location.lng()
                  };
                  
                  console.log('ModernAddressAutocomplete: Updating map to location:', location);
                  map.panTo(location);
                  map.setZoom(16);
                  
                  if (marker) {
                    marker.setPosition(location);
                  } else {
                    const newMarker = new window.google.maps.Marker({
                      position: location,
                      map: map,
                      title: place.formattedAddress,
                      animation: window.google.maps.Animation.DROP
                    });
                    setMarker(newMarker);
                    console.log('ModernAddressAutocomplete: Map marker created and positioned');
                  }
                } else {
                  console.log('ModernAddressAutocomplete: Map not available or place has no location');
                }
              } else {
                console.warn('ModernAddressAutocomplete: Place has no formatted address');
              }
            } catch (error) {
              console.error('ModernAddressAutocomplete: Error fetching place details:', error);
            }
          } else {
            console.warn('ModernAddressAutocomplete: Place selection event fired but no place object found');
          }
        });

        // Add input event listener to handle manual typing
        autocompleteElement.addEventListener('input', (event: any) => {
          const inputValue = event.target.value || '';
          console.log('ModernAddressAutocomplete: New API - Input value changed:', inputValue);
          
          // Update internal value and call onChange
          if (inputValue !== internalValueRef.current) {
            setInternalValue(inputValue);
            onChange(inputValue);
          }
        });

        console.log('ModernAddressAutocomplete: New API event listeners attached successfully');

      } catch (error) {
        console.error('ModernAddressAutocomplete: New API failed, falling back to traditional API:', error);
        
        // Fallback to traditional Places API
        try {
          console.log('ModernAddressAutocomplete: Initializing traditional Places Autocomplete');
          
          // Create a traditional input element
          const inputElement = document.createElement('input');
          inputElement.type = 'text';
          inputElement.id = 'traditional-place-autocomplete';
          inputElement.placeholder = placeholder;
          inputElement.className = 'w-full p-3 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none';
          
          // Replace the placeholder div with the input element
          if (autocompleteRef.current && autocompleteRef.current.parentNode) {
            autocompleteRef.current.parentNode.replaceChild(inputElement, autocompleteRef.current);
            autocompleteRef.current = inputElement;
            console.log('ModernAddressAutocomplete: Traditional input element attached to DOM');
          }
          
          // Create traditional autocomplete
          const autocomplete = new window.google.maps.places.Autocomplete(inputElement, {
            componentRestrictions: { country: ['AE'] },
            types: ['address']
          });
          
          console.log('ModernAddressAutocomplete: Traditional Autocomplete created successfully');
          
          // Add place changed listener
          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            console.log('ModernAddressAutocomplete: Traditional API - Place selected:', place);
            
            if (place.formatted_address) {
              const placeDetails = {
                formattedAddress: place.formatted_address,
                location: place.geometry?.location ? {
                  lat: place.geometry.location.lat(),
                  lng: place.geometry.location.lng()
                } : undefined,
                addressComponents: place.address_components
              };
              
              console.log('ModernAddressAutocomplete: Traditional API - Calling onChange');
              setInternalValue(place.formatted_address);
              onChange(place.formatted_address, placeDetails);
              
              // Update map if available
              if (map && place.geometry?.location) {
                const location = {
                  lat: place.geometry.location.lat(),
                  lng: place.geometry.location.lng()
                };
                
                console.log('ModernAddressAutocomplete: Traditional API - Updating map to location:', location);
                map.panTo(location);
                map.setZoom(16);
                
                if (marker) {
                  marker.setPosition(location);
                } else {
                  const newMarker = new window.google.maps.Marker({
                    position: location,
                    map: map,
                    title: place.formatted_address,
                    animation: window.google.maps.Animation.DROP
                  });
                  setMarker(newMarker);
                  console.log('ModernAddressAutocomplete: Traditional API - Map marker created');
                }
              }
            }
          });
          
          // Add input event listener for manual typing
          inputElement.addEventListener('input', (event: any) => {
            const inputValue = event.target.value || '';
            console.log('ModernAddressAutocomplete: Traditional API - Input value changed:', inputValue);
            if (inputValue !== internalValueRef.current) {
              setInternalValue(inputValue);
              onChange(inputValue);
            }
          });
          
          setAutocompleteElement({ inputElement, autocomplete });
          setUseTraditionalAPI(true);
          console.log('ModernAddressAutocomplete: Traditional API setup completed successfully');
          
        } catch (fallbackError) {
          console.error('ModernAddressAutocomplete: Both new and traditional API failed:', fallbackError);
        }
      }
    };

    initAutocomplete();
  }, [isLoaded, placeholder, onChange, map, marker]);

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || map) return;

    try {
      const dubaiCenter = { lat: 25.2048, lng: 55.2708 };
      
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        zoom: 12,
        center: dubaiCenter,
        styles: [
          {
            featureType: 'all',
            elementType: 'geometry.fill',
            stylers: [{ color: '#f8fafc' }]
          },
          {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#e0f2fe' }]
          }
        ],
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: 'cooperative'
      });

      setMap(mapInstance);
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }, [isLoaded, map]);

  // Sync external value prop with internal state
  useEffect(() => {
    if (value !== internalValue) {
      setInternalValue(value || '');
    }
  }, [value]);

  // Update ref whenever internal value changes
  useEffect(() => {
    internalValueRef.current = internalValue;
  }, [internalValue]);

  // Update autocomplete element value when internal value changes
  useEffect(() => {
    if (autocompleteElement && internalValue !== undefined) {
      // Handle both new API (PlaceAutocompleteElement) and traditional API (input element)
      if (autocompleteElement.inputElement) {
        // Traditional API case - this can be controlled
        const currentValue = autocompleteElement.inputElement.value || '';
        if (internalValue !== currentValue) {
          autocompleteElement.inputElement.value = internalValue;
          console.log('ModernAddressAutocomplete: Traditional API - Updated input value to:', internalValue);
        }
      } else if (autocompleteElement.tagName === 'GMP-PLACE-AUTOCOMPLETE') {
        // New API case - treat as uncontrolled, only sync when necessary
        const currentValue = autocompleteElement.value || '';
        if (internalValue !== currentValue && internalValue !== '') {
          // Only update Web Component value if it's significantly different
          // This prevents the controlled/uncontrolled warnings
          console.log('ModernAddressAutocomplete: New API - Syncing value:', internalValue);
          autocompleteElement.value = internalValue;
        }
      }
    }
  }, [internalValue, autocompleteElement]);

  return (
    <div className="modern-address-autocomplete">
      <style>{`
        .modern-address-autocomplete {
          position: relative;
        }
        
        gmp-place-autocomplete {
          width: 100%;
          --gmp-place-autocomplete-input-padding: 12px 16px;
          --gmp-place-autocomplete-input-border: 2px solid #d1d5db;
          --gmp-place-autocomplete-input-border-radius: 8px;
          --gmp-place-autocomplete-input-background: #ffffff;
          --gmp-place-autocomplete-input-font-size: 16px;
          --gmp-place-autocomplete-input-font-weight: 400;
          --gmp-place-autocomplete-input-color: #374151;
          --gmp-place-autocomplete-input-box-shadow: none;
          --gmp-place-autocomplete-input-transition: all 0.2s ease;
        }
        
        gmp-place-autocomplete:focus-within {
          --gmp-place-autocomplete-input-border: 2px solid #10b981;
          --gmp-place-autocomplete-input-box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
        }
        
        /* Style the dropdown suggestions */
        .pac-container {
          background: #ffffff !important;
          border: 1px solid #e5e7eb !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
          margin-top: 4px !important;
          overflow: hidden !important;
          font-family: inherit !important;
        }
        
        .pac-item {
          background: #ffffff !important;
          border: none !important;
          border-bottom: 1px solid #f3f4f6 !important;
          padding: 12px 16px !important;
          font-size: 14px !important;
          color: #374151 !important;
          transition: background-color 0.2s ease !important;
          cursor: pointer !important;
        }
        
        .pac-item:last-child {
          border-bottom: none !important;
        }
        
        .pac-item:hover,
        .pac-item-selected {
          background: #ecfdf5 !important;
        }
        
        .pac-item-query {
          color: #059669 !important;
          font-weight: 600 !important;
        }
        
        .pac-matched {
          color: #10b981 !important;
          font-weight: 600 !important;
        }
        
        .map-container {
          margin-top: 12px;
          border-radius: 8px;
          overflow: hidden;
          border: 2px solid #e5e7eb;
          height: 200px;
        }
        
        .map-loading {
          height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f9fafb;
          color: #6b7280;
        }
      `}</style>
      
      <div 
        ref={autocompleteRef as any}
        data-placeholder={placeholder}
        className={className}
      />
      
      <div className="map-container">
        {!isLoaded ? (
          <div className="map-loading">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              Loading map...
            </div>
          </div>
        ) : (
          <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
        )}
      </div>
    </div>
  );
};

export default ModernAddressAutocomplete; 