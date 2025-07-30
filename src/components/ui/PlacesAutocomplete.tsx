import React, { useEffect, useRef, useState, useCallback } from 'react';

// TypeScript interfaces for Google Places API (New)
declare global {
  interface Window {
    google: any;
    googleMapsReady: boolean;
  }
}

interface PlaceDetails {
  placeId: string;
  formattedAddress: string;
  displayName?: string;
  lat: number;
  lng: number;
}

interface PlacesAutocompleteProps {
  value?: string;
  onChange: (address: string, placeDetails?: PlaceDetails) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onError?: (error: string) => void;
  // Configuration options (CORRECTED for new API)
  includedRegionCodes?: string[]; // Correct property for new Places API
  showMap?: boolean;
  mapHeight?: number;
}

const PlacesAutocomplete: React.FC<PlacesAutocompleteProps> = ({
  value = '',
  onChange,
  placeholder = "Enter your address...",
  className = "",
  disabled = false,
  onError,
  includedRegionCodes = ['ae'], // Correct property for UAE
  showMap = false,
  mapHeight = 200
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const autocompleteElementRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  // Handle Google Maps API loading
  const checkGoogleMapsLoaded = useCallback(() => {
    if (window.google?.maps?.importLibrary) {
      setIsLoaded(true);
      return true;
    }
    return false;
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

  // Initialize map if showMap is true
  const initializeMap = useCallback(async () => {
    if (!showMap || !mapRef.current || !window.google?.maps?.importLibrary) return;

    try {
      // Import required libraries
      const [{ Map }, { AdvancedMarkerElement }] = await Promise.all([
        window.google.maps.importLibrary("maps"),
        window.google.maps.importLibrary("marker")
      ]);

      // Default center to Dubai
      const dubaiCenter = { lat: 25.2048, lng: 55.2708 };
      
      const map = new Map(mapRef.current, {
        center: dubaiCenter,
        zoom: 12,
        mapId: 'DEMO_MAP_ID', // Required for AdvancedMarkerElement
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
      });

      mapInstanceRef.current = map;
      console.log('Map initialized successfully with new API');
    } catch (error) {
      console.error('Failed to initialize map:', error);
      onError?.('Failed to initialize map');
    }
  }, [showMap, onError]);

  // Initialize autocomplete using new Places API (CORRECTED)
  const initializeAutocomplete = useCallback(async () => {
    if (!containerRef.current || !isLoaded || autocompleteElementRef.current) return;

    try {
      // Import the Places library (correct import)
      const { PlaceAutocompleteElement } = await window.google.maps.importLibrary("places");
      
      console.log('Creating PlaceAutocompleteElement with correct syntax...');
      
      // Create the PlaceAutocompleteElement with proper configuration (FIXED)
      const placeAutocomplete = new PlaceAutocompleteElement({
        // Correct UAE restriction (FIXED)
        includedRegionCodes: includedRegionCodes, // Use prop value
        // Set location bias to Dubai for UAE addresses
        locationBias: { lat: 25.2048, lng: 55.2708 }
      });
      
      console.log('PlaceAutocompleteElement created:', placeAutocomplete);
      
      // Configure the autocomplete element
      placeAutocomplete.id = 'place-autocomplete-input';
      
      // Set the placeholder directly as an attribute
      placeAutocomplete.setAttribute('placeholder', placeholder);

      // Ensure the element is properly styled and visible
      placeAutocomplete.style.width = '100%';
      placeAutocomplete.style.display = 'block';
      placeAutocomplete.style.minHeight = '48px';
      
      // Clear container and add the element
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(placeAutocomplete);
      
      console.log('PlaceAutocompleteElement added to container');
      console.log('Container children:', containerRef.current.children);
      
      // Wait a moment for the element to fully render
      setTimeout(() => {
        console.log('PlaceAutocompleteElement after timeout:', placeAutocomplete);
        if (containerRef.current) {
          console.log('Container innerHTML:', containerRef.current.innerHTML);
        }
      }, 1000);
      
      // Listen for place selection using the CORRECT 'gmp-select' event (FIXED)
      placeAutocomplete.addEventListener('gmp-select', async (event: any) => {
        console.log('Place selection event triggered:', event);
        
        // Correct destructuring (FIXED)
        const { placePrediction } = event;
        const place = placePrediction.toPlace();
        
        // Fetch place details with correct method (FIXED)
        await place.fetchFields({ 
          fields: ['displayName', 'formattedAddress', 'location', 'id'] 
        });

        if (!place.location) {
          console.warn('No location for selected place');
          onError?.(`No location details available for: ${place.displayName || 'selected place'}`);
          return;
        }

        const placeDetails: PlaceDetails = {
          placeId: place.id,
          formattedAddress: place.formattedAddress,
          displayName: place.displayName,
          lat: place.location.lat(),
          lng: place.location.lng()
        };

        // Update input value display
        setInputValue(place.formattedAddress);
        
        // Call the onChange callback
        onChange(place.formattedAddress, placeDetails);

        // Update map if available
        if (mapInstanceRef.current) {
          // Center map on selected location
          if (place.viewport) {
            mapInstanceRef.current.fitBounds(place.viewport);
          } else {
            mapInstanceRef.current.setCenter(place.location);
            mapInstanceRef.current.setZoom(17);
          }

          // Update or create marker using AdvancedMarkerElement
          try {
            const { AdvancedMarkerElement } = await window.google.maps.importLibrary("marker");
            
            if (markerRef.current) {
              markerRef.current.position = place.location;
            } else {
              markerRef.current = new AdvancedMarkerElement({
                map: mapInstanceRef.current,
                position: place.location,
                title: place.formattedAddress
              });
            }
          } catch (markerError) {
            console.warn('Could not create advanced marker:', markerError);
          }
        }

        console.log('Place selected (New API):', placeDetails);
      });

      autocompleteElementRef.current = placeAutocomplete;
      console.log('PlaceAutocompleteElement initialized successfully with correct syntax');
    } catch (error) {
      console.error('Failed to initialize PlaceAutocompleteElement:', error);
      
      // Fallback to legacy Autocomplete if PlaceAutocompleteElement fails
      try {
        console.log('Attempting fallback to legacy Autocomplete...');
        await initializeLegacyAutocomplete();
      } catch (fallbackError) {
        console.error('Both new and legacy APIs failed:', fallbackError);
        onError?.('Failed to initialize address search');
      }
    }
  }, [isLoaded, onChange, onError, placeholder, includedRegionCodes]);

  // Fallback to legacy Autocomplete API
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
      componentRestrictions: { country: includedRegionCodes },
      fields: ['place_id', 'formatted_address', 'name', 'geometry']
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      
      if (!place.geometry?.location) {
        console.warn('No geometry location for selected place');
        return;
      }

      const placeDetails: PlaceDetails = {
        placeId: place.place_id || '',
        formattedAddress: place.formatted_address || '',
        displayName: place.name || '',
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      };

      setInputValue(place.formatted_address || '');
      onChange(place.formatted_address || '', placeDetails);

      // Update map if available
      if (mapInstanceRef.current) {
        if (place.geometry.viewport) {
          mapInstanceRef.current.fitBounds(place.geometry.viewport);
        } else {
          mapInstanceRef.current.setCenter(place.geometry.location);
          mapInstanceRef.current.setZoom(17);
        }
      }
    });

    autocompleteElementRef.current = { element: input, autocomplete };
    console.log('Legacy Autocomplete initialized successfully');
  }, [includedRegionCodes, placeholder, onChange]);

  // Initialize components when loaded
  useEffect(() => {
    if (!isLoaded) return;

    initializeMap();
    initializeAutocomplete();
  }, [isLoaded, initializeMap, initializeAutocomplete]);

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autocompleteElementRef.current) {
        try {
          autocompleteElementRef.current.remove();
        } catch (error) {
          console.warn('Error cleaning up autocomplete element:', error);
        }
      }
    };
  }, []);

  return (
    <div className="places-autocomplete-container">
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
        className={`w-full min-h-[48px] ${className} ${!isLoaded ? 'opacity-50' : ''}`}
        style={{ minHeight: '48px' }}
      >
        {!isLoaded && (
          <div className="w-full p-3 border-2 border-gray-300 rounded-lg bg-gray-100 text-gray-500">
            Loading address search...
          </div>
        )}
      </div>
      
      {showMap && (
        <div 
          className="mt-3 border-2 border-gray-200 rounded-lg overflow-hidden"
          style={{ height: `${mapHeight}px` }}
        >
          {!isLoaded ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <div className="flex items-center gap-2 text-gray-500">
                <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                Loading map...
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

export default PlacesAutocomplete;