import React, { useEffect, useRef, useState, useCallback, memo } from 'react';

// TypeScript interfaces for Google Places API (New)
declare global {
  interface Window {
    google: any;
    googleMapsReady: boolean;
    gm_authFailure?: () => void;
  }
}

interface AddressComponents {
  country: string;
  emirate: string;
  city: string;
  route: string;
  streetNumber: string;
  postalCode: string;
}

export interface PlaceDetails {
  placeId: string;
  formattedAddress: string;
  displayName: string;
  lat: number;
  lng: number;
  components: AddressComponents;
}

export interface AddressAutocompleteProps {
  value?: string;
  onChange: (address: string, placeDetails?: PlaceDetails) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onError?: (error: string) => void;
  includedRegionCodes?: string[];
  showMap?: boolean;
  mapHeight?: number;
  variant?: 'modern' | 'simple'; // ✅ Support for different styles if needed
}

/**
 * ✅ Unified Address Autocomplete Component
 * 
 * This is the single, optimized address autocomplete component that replaces:
 * - ModernAddressAutocomplete.tsx (507 lines)
 * - SimpleAddressAutocomplete.tsx (125 lines)
 * - UnifiedAddressAutocomplete.tsx (791 lines)
 * - GoogleMapsAutocomplete.tsx (531 lines)
 * 
 * Features:
 * - Google Places API (New) with fallback to legacy API
 * - Optional map display with marker
 * - UAE address validation
 * - Memoized for performance
 * - Customizable via props
 */
const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value = '',
  onChange,
  placeholder = "Enter your address...",
  className = "",
  disabled = false,
  onError,
  includedRegionCodes = ['AE'], // Uppercase ISO codes
  showMap = false,
  mapHeight = 200,
  variant = 'modern'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const autocompleteElementRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const pendingLocationRef = useRef<any>(null);
  const isMapInitializedRef = useRef<boolean>(false);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  // ✅ Memoized: Parse address components helper
  const parseAddressComponents = useCallback((place: any) => {
    const dict = new Map<string, any>();
    (place.addressComponents || []).forEach((c: any) => 
      c.types.forEach((t: string) => dict.set(t, c))
    );
    const pick = (t: string, k: 'shortText' | 'longText' = 'longText') => 
      dict.get(t)?.[k] ?? dict.get(t)?.[k.replace('Text', '_name')];
    
    return {
      country: pick('country', 'shortText'),
      emirate: pick('administrative_area_level_1'),
      city: pick('locality') || pick('sublocality') || pick('administrative_area_level_2'),
      route: pick('route'),
      streetNumber: pick('street_number'),
      postalCode: pick('postal_code'),
    };
  }, []);

  // ✅ Memoized: Robust marker management system
  const ensureMarker = useCallback(async (location: any, title: string = 'Selected Location') => {
    if (!mapInstanceRef.current) {
      return;
    }

    const mapId = process.env.REACT_APP_GOOGLE_MAPS_MAP_ID;
    
    try {
      // Import marker libraries
      const { Marker, AdvancedMarkerElement } = await window.google.maps.importLibrary("marker");
      
      // If marker doesn't exist, create it
      if (!markerRef.current) {
        if (mapId && AdvancedMarkerElement) {
          markerRef.current = new AdvancedMarkerElement({
            map: mapInstanceRef.current,
            position: location,
            title: title
          });
        } else {
          markerRef.current = new Marker({
            map: mapInstanceRef.current,
            position: location,
            title: title
          });
        }
      } else {
        // Ensure marker is attached to map
        if (mapId && AdvancedMarkerElement) {
          if (!markerRef.current.map) {
            markerRef.current.map = mapInstanceRef.current;
          }
          markerRef.current.position = location;
        } else {
          if (!markerRef.current.getMap()) {
            markerRef.current.setMap(mapInstanceRef.current);
          }
          markerRef.current.setPosition(location);
        }
      }
      
      // Force marker visibility
      setTimeout(() => {
        if (markerRef.current && mapInstanceRef.current) {
          if (mapId && AdvancedMarkerElement) {
            markerRef.current.map = mapInstanceRef.current;
            markerRef.current.position = location;
          } else {
            markerRef.current.setMap(mapInstanceRef.current);
            markerRef.current.setPosition(location);
          }
          
          // Trigger map refresh
          window.google.maps.event.trigger(mapInstanceRef.current, 'resize');
        }
      }, 50);
      
    } catch (error) {
      console.error('Error creating/updating marker:', error);
    }
  }, []);

  // ✅ Memoized: Set marker and pan map
  const setMarker = useCallback((location: any, title: string = 'Selected Location') => {
    ensureMarker(location, title);
    
    // Pan map to location
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo(location);
    }
  }, [ensureMarker]);

  // ✅ Memoized: Handle Google Maps API loading
  const checkGoogleMapsLoaded = useCallback(() => {
    if (window.google?.maps?.importLibrary) {
      setIsLoaded(true);
      return true;
    }
    return false;
  }, []);

  // Handle Google Maps authentication errors
  useEffect(() => {
    const handleAuthError = () => {
      console.error('Google Maps authentication failed');
    };

    window.gm_authFailure = handleAuthError;
    
    return () => {
      window.gm_authFailure = undefined;
    };
  }, []);

  useEffect(() => {
    // Check if already loaded
    if (checkGoogleMapsLoaded()) return;

    // Listen for the load event
    const handleGoogleMapsLoad = () => {
      if (checkGoogleMapsLoaded()) {
        console.log('Google Maps API loaded successfully');
      }
    };

    window.addEventListener('google-maps-loaded', handleGoogleMapsLoad);
    
    return () => {
      window.removeEventListener('google-maps-loaded', handleGoogleMapsLoad);
    };
  }, [checkGoogleMapsLoaded]);

  // ✅ Memoized: Initialize map if showMap is true
  const initializeMap = useCallback(async () => {
    if (!showMap || !mapRef.current || !window.google?.maps?.importLibrary) return;

    try {
      // Import required libraries
      const [{ Map }] = await Promise.all([
        window.google.maps.importLibrary("maps"),
        window.google.maps.importLibrary("marker")
      ]);

      // Default center to Dubai
      const dubaiCenter = { lat: 25.2048, lng: 55.2708 };
      
      const map = new Map(mapRef.current, {
        center: dubaiCenter,
        zoom: 12,
        mapId: process.env.REACT_APP_GOOGLE_MAPS_MAP_ID || undefined,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
      });

      mapInstanceRef.current = map;
      isMapInitializedRef.current = true;

      // Handle pending location if place was selected before map was ready
      if (pendingLocationRef.current) {
        const { location, viewport } = pendingLocationRef.current;
        if (viewport && map.fitBounds) {
          map.fitBounds(viewport);
        } else {
          map.setCenter(location);
          map.setZoom(17);
        }

        setMarker(location, 'Selected Location');
        pendingLocationRef.current = null;
      }
    } catch (error) {
      console.error('Failed to initialize map:', error);
      
      // Check for specific Google Maps API errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('RefererNotAllowedMapError')) {
        onError?.('Google Maps API key is not authorized for this domain.');
      } else if (errorMessage.includes('ApiNotActivatedMapError')) {
        onError?.('Google Maps API is not enabled.');
      } else if (errorMessage.includes('InvalidKeyMapError')) {
        onError?.('Invalid Google Maps API key.');
      } else {
        onError?.('Failed to initialize map.');
      }
    }
  }, [showMap, onError, setMarker]);

  // ✅ Memoized: Initialize autocomplete using new Places API
  const initializeAutocomplete = useCallback(async () => {
    if (!containerRef.current || !isLoaded || autocompleteElementRef.current) return;

    try {
      // Import the Places library
      const { PlaceAutocompleteElement } = await window.google.maps.importLibrary("places");
      
      // Create the PlaceAutocompleteElement with proper configuration
      const placeAutocomplete = new PlaceAutocompleteElement({
        includedRegionCodes: includedRegionCodes,
        locationBias: { lat: 25.2048, lng: 55.2708 }
      });
      
      // Configure the autocomplete element
      placeAutocomplete.id = 'place-autocomplete-input';
      placeAutocomplete.setAttribute('placeholder', placeholder);
      placeAutocomplete.style.width = '100%';
      placeAutocomplete.style.display = 'block';
      placeAutocomplete.style.minHeight = '48px';
      
      // Clear container and add the element
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(placeAutocomplete);
      
      // Listen for place selection using the 'gmp-select' event
      placeAutocomplete.addEventListener('gmp-select', async (event: any) => {
        const { placePrediction } = event;
        const place = placePrediction.toPlace();
        
        // Fetch place details with correct fields
        await place.fetchFields({ 
          fields: ['id', 'displayName', 'formattedAddress', 'location', 'viewport', 'addressComponents'] 
        });

        if (!place.location) {
          onError?.('No location details available for selected place');
          return;
        }

        // Parse address components and validate UAE
        const components = parseAddressComponents(place);
        if (components.country !== 'AE') {
          onError?.('Address must be within the UAE');
          return;
        }

        const placeDetails: PlaceDetails = {
          placeId: place.id,
          formattedAddress: place.formattedAddress,
          displayName: place.displayName?.text ?? '',
          lat: place.location.lat(),
          lng: place.location.lng(),
          components: components
        };

        // Update input value display
        setInputValue(place.formattedAddress);
        
        // Call the onChange callback
        onChange(place.formattedAddress, placeDetails);

        // Handle map updates with race condition protection
        if (!mapInstanceRef.current) {
          pendingLocationRef.current = { 
            location: place.location, 
            viewport: place.viewport 
          };
          return;
        }

        // Update map if available
        if (place.viewport && mapInstanceRef.current.fitBounds) {
          mapInstanceRef.current.fitBounds(place.viewport);
        } else {
          mapInstanceRef.current.setCenter(place.location);
          mapInstanceRef.current.setZoom(17);
        }

        setMarker(place.location, place.formattedAddress);
      });

      autocompleteElementRef.current = placeAutocomplete;
    } catch (error) {
      console.error('Failed to initialize PlaceAutocompleteElement:', error);
      
      // Check for specific Google Maps API errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('RefererNotAllowedMapError') || 
          errorMessage.includes('ApiNotActivatedMapError') || 
          errorMessage.includes('InvalidKeyMapError')) {
        onError?.('Google Maps API configuration error.');
        return;
      }
      
      // Fallback to legacy Autocomplete if PlaceAutocompleteElement fails
      try {
        await initializeLegacyAutocomplete();
      } catch (fallbackError) {
        console.error('Both new and legacy APIs failed:', fallbackError);
        onError?.('Failed to initialize address search.');
      }
    }
  }, [isLoaded, onChange, onError, placeholder, includedRegionCodes, parseAddressComponents, setMarker]);

  // ✅ Memoized: Fallback to legacy Autocomplete API
  const initializeLegacyAutocomplete = useCallback(async () => {
    if (!containerRef.current) return;

    // Create a simple input element
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = placeholder;
    input.className = 'w-full p-3 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none transition-colors';
    
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(input);

    const autocomplete = new window.google.maps.places.Autocomplete(input, {
      types: ['address'],
      componentRestrictions: { country: 'AE' },
      fields: ['place_id', 'formatted_address', 'name', 'geometry', 'address_components']
    });

    autocomplete.addListener('place_changed', async () => {
      const place = autocomplete.getPlace();
      
      if (!place.geometry?.location) {
        return;
      }

      // Parse address components for legacy API
      const components = parseAddressComponents(place);
      if (components.country !== 'AE') {
        onError?.('Address must be within the UAE');
        return;
      }

      const placeDetails: PlaceDetails = {
        placeId: place.place_id || '',
        formattedAddress: place.formatted_address || '',
        displayName: place.name || '',
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        components: components
      };

      setInputValue(place.formatted_address || '');
      onChange(place.formatted_address || '', placeDetails);

      // Handle map updates with race condition protection
      if (!mapInstanceRef.current) {
        pendingLocationRef.current = { 
          location: place.geometry.location, 
          viewport: place.geometry.viewport 
        };
        return;
      }

      // Update map if available
      if (place.geometry.viewport) {
        mapInstanceRef.current.fitBounds(place.geometry.viewport);
      } else {
        mapInstanceRef.current.setCenter(place.geometry.location);
        mapInstanceRef.current.setZoom(17);
      }

      setMarker(place.geometry.location, place.formatted_address);
    });

    autocompleteElementRef.current = { element: input, autocomplete };
  }, [placeholder, onChange, parseAddressComponents, onError, setMarker]);

  // Initialize components when loaded (fix race conditions)
  useEffect(() => {
    if (!isLoaded) return;

    const initializeComponents = async () => {
      // Initialize map first, then autocomplete
      await initializeMap();
      await initializeAutocomplete();
    };

    initializeComponents();
  }, [isLoaded, initializeMap, initializeAutocomplete]);

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Handle map resize when component becomes visible (fixes modal sizing bug)
  useEffect(() => {
    if (!mapInstanceRef.current || !showMap) return;

    const handleResize = () => {
      if (mapInstanceRef.current) {
        window.google.maps.event.trigger(mapInstanceRef.current, 'resize');
      }
    };

    // Resize map after a short delay to ensure modal is fully visible
    const timeoutId = setTimeout(handleResize, 100);
    
    // Also listen for window resize events
    window.addEventListener('resize', handleResize);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, [showMap]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const ref = autocompleteElementRef.current;
      if (!ref) return;
      
      try {
        if (ref instanceof Element && ref.tagName === 'GMP-PLACE-AUTOCOMPLETE') {
          ref.remove();
        } else if (ref.autocomplete && ref.element) {
          window.google.maps.event.clearInstanceListeners(ref.autocomplete);
          ref.element.remove();
        }
      } catch (error) {
        console.warn('Error cleaning up autocomplete element:', error);
      }
      
      // Clean up marker
      if (markerRef.current) {
        try {
          if (markerRef.current.setMap) {
            markerRef.current.setMap(null);
          }
          markerRef.current = null;
        } catch (error) {
          console.warn('Error cleaning up marker:', error);
        }
      }
      
      // Reset map initialization flag
      isMapInitializedRef.current = false;
    };
  }, []);

  return (
    <div className="address-autocomplete-container">
      <style>{`
        gmp-place-autocomplete {
          width: 100% !important;
          display: block !important;
          --gmp-place-autocomplete-input-padding: 12px 16px;
          --gmp-place-autocomplete-input-border: 2px solid #d1d5db;
          --gmp-place-autocomplete-input-border-radius: 8px;
          --gmp-place-autocomplete-input-background: #ffffff;
          --gmp-place-autocomplete-input-font-size: 16px;
          --gmp-place-autocomplete-input-font-weight: 400;
          --gmp-place-autocomplete-input-color: #374151;
          --gmp-place-autocomplete-input-box-shadow: none;
          --gmp-place-autocomplete-input-transition: all 0.2s ease;
          --gmp-place-autocomplete-input-height: 48px;
        }
        
        gmp-place-autocomplete:focus-within {
          --gmp-place-autocomplete-input-border: 2px solid #10b981;
          --gmp-place-autocomplete-input-box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
        }
        
        /* Ensure input is visible */
        gmp-place-autocomplete input {
          width: 100% !important;
          height: 48px !important;
          padding: 12px 16px !important;
          border: 2px solid #d1d5db !important;
          border-radius: 8px !important;
          font-size: 16px !important;
          background: #ffffff !important;
          color: #374151 !important;
          transition: all 0.2s ease !important;
        }
        
        gmp-place-autocomplete input:focus {
          border-color: #10b981 !important;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1) !important;
          outline: none !important;
        }
        
        /* Dropdown suggestions styling */
        .gmp-place-autocomplete-dropdown,
        gmp-place-autocomplete .pac-container {
          background: #ffffff !important;
          border: 1px solid #e5e7eb !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
          margin-top: 4px !important;
          overflow: hidden !important;
          font-family: inherit !important;
          z-index: 9999 !important;
        }
      `}</style>
      
      {/* Container for the PlaceAutocompleteElement */}
      <div 
        ref={containerRef}
        className={`w-full min-h-[48px] ${className} ${!isLoaded ? 'opacity-50' : ''} ${disabled ? 'pointer-events-none opacity-50' : ''}`}
        style={{ minHeight: '48px' }}
      >
        {!isLoaded && (
          <div className="w-full p-3 border-2 border-gray-300 rounded-lg bg-gray-100 text-gray-500">
            Loading address search...
          </div>
        )}
      </div>
      
      {/* Fallback input when Google Maps fails to load */}
      {!isLoaded && (
        <div className="mt-2">
          <input
            type="text"
            placeholder="Enter address manually (Google Maps unavailable)"
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none"
            disabled={disabled}
            onChange={(e) => {
              const address = e.target.value;
              if (address.trim()) {
                // Create a basic place details object for manual entry
                const placeDetails: PlaceDetails = {
                  placeId: 'manual_' + Date.now(),
                  formattedAddress: address,
                  displayName: address,
                  lat: 25.2048, // Default to Dubai center
                  lng: 55.2708,
                  components: {
                    country: 'AE',
                    emirate: 'Dubai',
                    city: 'Dubai',
                    route: '',
                    streetNumber: '',
                    postalCode: ''
                  }
                };
                onChange(address, placeDetails);
              }
            }}
          />
          <p className="text-xs text-gray-500 mt-1">
            Google Maps is unavailable. You can enter the address manually.
          </p>
        </div>
      )}
      
      {showMap && (
        <div 
          className="mt-3 border-2 border-gray-200 rounded-lg overflow-hidden"
          style={{ height: `${mapHeight}px` }}
        >
          {!isLoaded ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <div className="flex flex-col items-center gap-2 text-gray-500">
                <div className="w-8 h-8 text-gray-400">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-sm">Map unavailable</p>
              </div>
            </div>
          ) : (
            <div ref={mapRef} className="w-full h-full" />
          )}
        </div>
      )}
    </div>
  );
};

// ✅ Memoize the entire component for performance
export default memo(AddressAutocomplete);

