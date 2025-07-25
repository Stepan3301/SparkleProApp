import React, { useEffect, useRef, useState, useCallback, useLayoutEffect } from 'react';
import { loadGoogleMapsForComponent } from '../../lib/googleMapsLoader';
import type { GoogleMapsLoadResult } from '../../lib/googleMapsLoader';

interface PlaceDetails {
  displayName?: string;
  formattedAddress: string;
  location?: {
    lat: number;
    lng: number;
  };
  addressComponents?: any[];
  placeId?: string;
}

interface UnifiedAddressAutocompleteProps {
  value?: string;
  onChange: (address: string, placeDetails?: PlaceDetails) => void;
  placeholder?: string;
  className?: string;
  showMap?: boolean;
  mapHeight?: number;
  disabled?: boolean;
  onError?: (error: string) => void;
  onLoadingStateChange?: (isLoading: boolean) => void;
  // Advanced configuration
  countryRestriction?: string[];
  types?: string[];
  bounds?: google.maps.LatLngBounds;
  componentRestrictions?: google.maps.places.ComponentRestrictions;
}

const UnifiedAddressAutocomplete: React.FC<UnifiedAddressAutocompleteProps> = ({
  value = '',
  onChange,
  placeholder = "Search for an address...",
  className = "",
  showMap = true,
  mapHeight = 200,
  disabled = false,
  onError,
  onLoadingStateChange,
  countryRestriction = ['AE'], // Default to UAE
  types = ['address'],
  bounds,
  componentRestrictions = { country: ['AE'] }
}) => {
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [autocompleteElement, setAutocompleteElement] = useState<any>(null);
  const [useNewAPI, setUseNewAPI] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [isComponentReady, setIsComponentReady] = useState(false);
  const [googleMapsResult, setGoogleMapsResult] = useState<GoogleMapsLoadResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // Track if component is visible in modal

  // Internal value management to prevent React warnings
  const [internalValue, setInternalValue] = useState(value);
  const internalValueRef = useRef(value);

  // Error handling
  const handleError = useCallback((error: string) => {
    console.error('UnifiedAddressAutocomplete:', error);
    setLoadError(error);
    onError?.(error);
  }, [onError]);

  // Loading state management
  const setLoadingState = useCallback((loading: boolean) => {
    setIsLoading(loading);
    onLoadingStateChange?.(loading);
  }, [onLoadingStateChange]);

  // Wait for refs to be available with modal-aware timeout and validation
  const waitForRefs = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 60; // 60 * 100ms = 6 seconds timeout (longer for modals)
      
      const checkRefs = () => {
        attempts++;
        
        // Check if refs exist and elements are actually visible/accessible
        const containerElement = containerRef.current;
        const inputElement = inputRef.current;
        const mapElement = mapRef.current;
        
        const containerReady = containerElement !== null && containerElement.offsetParent !== null;
        const inputReady = inputElement !== null && inputElement.offsetParent !== null;
        const mapReady = !showMap || (mapElement !== null && mapElement.offsetParent !== null);
        
        // Additional check: ensure elements are actually visible in the DOM
        const containerVisible = containerElement ? containerElement.getBoundingClientRect().width > 0 : false;
        const inputVisible = inputElement ? inputElement.getBoundingClientRect().width > 0 : false;
        
        // Only log every 15 attempts to reduce spam, but always log first and last
        if (attempts === 1 || attempts % 15 === 0 || attempts >= maxAttempts - 1) {
          console.log(`UnifiedAddressAutocomplete: Modal-aware ref check ${attempts}/${maxAttempts}:`, {
            containerReady,
            inputReady,
            mapReady,
            containerVisible,
            inputVisible,
            showMap,
            isModalOpen
          });
        }
        
        // All refs must be ready AND visible
        if (containerReady && inputReady && mapReady && containerVisible && inputVisible) {
          console.log('UnifiedAddressAutocomplete: All required refs are available and visible');
          resolve();
        } else if (attempts >= maxAttempts) {
          const errorState = {
            containerReady,
            inputReady, 
            mapReady,
            containerVisible,
            inputVisible,
            showMap,
            isModalOpen,
            containerExists: !!containerRef.current,
            inputExists: !!inputRef.current,
            mapExists: !!mapRef.current
          };
          console.error('UnifiedAddressAutocomplete: Timeout waiting for modal refs. Final state:', errorState);
          reject(new Error(`Modal refs timeout. State: ${JSON.stringify(errorState)}`));
        } else {
          setTimeout(checkRefs, 100); // Slower checks for modal scenarios
        }
      };
      checkRefs();
    });
  }, [showMap, isModalOpen]);

  // Initialize Google Maps API only once
  useEffect(() => {
    const initializeGoogleMaps = async () => {
      try {
        setLoadingState(true);
        setLoadError(null);

        console.log('UnifiedAddressAutocomplete: Starting Google Maps initialization');
        const result: GoogleMapsLoadResult = await loadGoogleMapsForComponent('UnifiedAddressAutocomplete');

        if (!result.success) {
          handleError(result.error || 'Failed to load Google Maps API');
          setLoadingState(false);
          return;
        }

        console.log('UnifiedAddressAutocomplete: Google Maps loaded successfully', result);
        setGoogleMapsResult(result);

      } catch (error) {
        handleError(error instanceof Error ? error.message : 'Initialization failed');
        setLoadingState(false);
      }
    };

    initializeGoogleMaps();
  }, []); // Only run once

  // Detect when component becomes visible (for modal handling)
  useEffect(() => {
    // Check if the component is visible in a modal by monitoring the container
    const checkVisibility = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const isVisible = rect.width > 0 && rect.height > 0 && rect.top >= 0;
        
        if (isVisible && !isModalOpen) {
          console.log('UnifiedAddressAutocomplete: Component became visible (modal opened)');
          setIsModalOpen(true);
        } else if (!isVisible && isModalOpen) {
          console.log('UnifiedAddressAutocomplete: Component became hidden (modal closed)');
          setIsModalOpen(false);
        }
      }
    };

    // Initial check
    checkVisibility();

    // Set up mutation observer to detect DOM changes (modal opening/closing)
    const observer = new MutationObserver(checkVisibility);
    if (containerRef.current) {
      observer.observe(document.body, { 
        childList: true, 
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
      });
    }

    // Also check on resize/scroll events
    const handleResize = () => setTimeout(checkVisibility, 100);
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize);
    };
  }, [isModalOpen]);

  // Mark component as ready after DOM is set up and modal is open
  useLayoutEffect(() => {
    setIsComponentReady(true);
    console.log('UnifiedAddressAutocomplete: Component layout ready, checking refs and visibility:', {
      containerRef: !!containerRef.current,
      inputRef: !!inputRef.current,
      mapRef: !!mapRef.current,
      showMap,
      isModalOpen
    });
  }, [showMap, isModalOpen]);

  // Initialize map
  const initializeMap = useCallback(() => {
    console.log('UnifiedAddressAutocomplete: initializeMap called', {
      mapRefCurrent: !!mapRef.current,
      mapExists: !!map,
      googleMapsAvailable: !!(window.google?.maps?.Map),
      showMap
    });

    if (!mapRef.current) {
      console.warn('UnifiedAddressAutocomplete: mapRef.current is null, cannot initialize map');
      return;
    }

    if (map) {
      console.log('UnifiedAddressAutocomplete: Map already exists, skipping initialization');
      return;
    }

    if (!window.google?.maps?.Map) {
      console.error('UnifiedAddressAutocomplete: Google Maps library not available');
      return;
    }

    try {
      console.log('UnifiedAddressAutocomplete: Starting map initialization...');
      
      // Default to Dubai center
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
      console.log('UnifiedAddressAutocomplete: Map initialized successfully!');
    } catch (error) {
      console.error('UnifiedAddressAutocomplete: Map initialization failed:', error);
      handleError('Failed to initialize map');
    }
  }, [map, showMap, handleError]);

  // Initialize autocomplete only when Google Maps is loaded, component is ready, AND modal is open
  useEffect(() => {
    // Critical: Only initialize when all conditions are met
    if (!googleMapsResult || !isComponentReady || !googleMapsResult.success || !isModalOpen) {
      console.log('UnifiedAddressAutocomplete: Waiting for all conditions to be met:', {
        googleMapsResult: !!googleMapsResult,
        isComponentReady,
        googleMapsSuccess: googleMapsResult?.success,
        isModalOpen
      });
      return;
    }

    const initializeAutocomplete = async () => {
      try {
        console.log('UnifiedAddressAutocomplete: Starting modal-aware autocomplete initialization...');
        
        // CRITICAL: For modal components, we must wait for DOM elements to be fully visible
        // before initializing Google Places API. This prevents ref availability issues.
        try {
          console.log('UnifiedAddressAutocomplete: Waiting for modal refs to be ready...');
          await waitForRefs();
          console.log('UnifiedAddressAutocomplete: Modal refs ready, proceeding with initialization');
        } catch (refError) {
          console.warn('UnifiedAddressAutocomplete: Modal ref waiting timed out, checking fallback options:', refError);
          
          // For modal scenarios, if refs aren't ready after timeout, it's likely a serious issue
          if (!containerRef.current || !containerRef.current.offsetParent) {
            console.error('UnifiedAddressAutocomplete: Modal container not properly mounted or visible');
            handleError('Component not properly mounted in modal');
            setLoadingState(false);
            return;
          }
        }

        // Determine which API to use
        if (googleMapsResult.hasNewPlacesAPI) {
          console.log('UnifiedAddressAutocomplete: Using new Places API');
          setUseNewAPI(true);
          await initializeNewPlacesAPI();
        } else if (googleMapsResult.hasLegacyPlacesAPI) {
          console.log('UnifiedAddressAutocomplete: Using legacy Places API');
          setUseNewAPI(false);
          await initializeLegacyPlacesAPI();
        } else {
          handleError('No compatible Places API found');
          setLoadingState(false);
          return;
        }

        // Initialize map if needed (with additional safety check)
        if (showMap) {
          console.log('UnifiedAddressAutocomplete: Initializing map...');
          setTimeout(() => {
            initializeMap(); // Delay map init slightly to ensure DOM is ready
          }, 100);
        } else {
          console.log('UnifiedAddressAutocomplete: Skipping map initialization (showMap=false)');
        }

        console.log('UnifiedAddressAutocomplete: Initialization complete');
        setLoadingState(false);

      } catch (error) {
        console.error('UnifiedAddressAutocomplete: Autocomplete initialization failed:', error);
        handleError(error instanceof Error ? error.message : 'Autocomplete initialization failed');
        setLoadingState(false);
      }
    };

    initializeAutocomplete();
  }, [googleMapsResult, isComponentReady, showMap, waitForRefs, initializeMap, isModalOpen]);

  // Cleanup when modal closes - Important for preventing memory leaks and stale references
  useEffect(() => {
    if (!isModalOpen && autocompleteElement) {
      console.log('UnifiedAddressAutocomplete: Modal closed, cleaning up autocomplete');
      
      // Clean up Google Maps event listeners to prevent memory leaks
      if (autocompleteElement.legacy) {
        // Legacy API cleanup
        window.google?.maps?.event?.clearInstanceListeners?.(autocompleteElement.legacy);
      }
      
      // Reset autocomplete state when modal closes
      setAutocompleteElement(null);
      setUseNewAPI(false);
      
      // Reset loading state for next modal open
      if (!googleMapsResult?.success) {
        setIsLoading(true);
      }
    }
  }, [isModalOpen, autocompleteElement, googleMapsResult]);

  // Initialize new Places API (with improved ref checking)
  const initializeNewPlacesAPI = async () => {
    try {
      console.log('UnifiedAddressAutocomplete: Initializing new Places API');

      // Check refs with retry mechanism
      let retries = 0;
      const maxRetries = 3;
      
      while ((!containerRef.current || !inputRef.current) && retries < maxRetries) {
        console.log(`UnifiedAddressAutocomplete: Refs not ready, retry ${retries + 1}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
      }
      
      if (!containerRef.current || !inputRef.current) {
        console.error('UnifiedAddressAutocomplete: Refs still not available after retries');
        throw new Error('Component refs not available after retries');
      }

      // Import the new Places library
      const { PlaceAutocompleteElement } = await (window as any).google.maps.importLibrary("places");
      
      // Create the autocomplete element
      const autocompleteElement = new PlaceAutocompleteElement();
      
      // FIXED: Use correct syntax for new Places API
      autocompleteElement.placeholder = placeholder;
      
      // FIXED: Set component restrictions correctly for new API
      if (componentRestrictions?.country) {
        autocompleteElement.componentRestrictions = componentRestrictions;
      }
      
      // FIXED: Set types correctly for new API
      if (types && types.length > 0) {
        autocompleteElement.types = types;
      }

      // Additional configuration for UAE market
      if (bounds) {
        autocompleteElement.bounds = bounds;
      }

      console.log('UnifiedAddressAutocomplete: New API configured', {
        componentRestrictions: autocompleteElement.componentRestrictions,
        types: autocompleteElement.types,
        placeholder: autocompleteElement.placeholder
      });

      // Replace input with autocomplete element safely
      const parentNode = inputRef.current.parentNode;
      if (parentNode) {
        parentNode.replaceChild(autocompleteElement, inputRef.current);
        inputRef.current = autocompleteElement as any;
        setAutocompleteElement(autocompleteElement);
        console.log('UnifiedAddressAutocomplete: New API element attached to DOM');
      } else {
        throw new Error('Parent node not available for element replacement');
      }

      // Set up new API event listener (FIXED: correct event name)
      autocompleteElement.addEventListener('gmp-placeselect', async (event: any) => {
        console.log('UnifiedAddressAutocomplete: New API - Place selected:', event);
        
        try {
          const place = event.place;
          if (!place) {
            console.warn('UnifiedAddressAutocomplete: No place object in event');
            return;
          }

          // Fetch place details
          await place.fetchFields({
            fields: ['displayName', 'formattedAddress', 'location', 'addressComponents', 'placeId']
          });

          console.log('UnifiedAddressAutocomplete: Place details fetched:', place);

          if (place.formattedAddress) {
            const placeDetails: PlaceDetails = {
              displayName: place.displayName,
              formattedAddress: place.formattedAddress,
              location: place.location ? {
                lat: place.location.lat(),
                lng: place.location.lng()
              } : undefined,
              addressComponents: place.addressComponents,
              placeId: place.placeId
            };

            // Update internal state
            setInternalValue(place.formattedAddress);
            setInputValue(place.formattedAddress);
            internalValueRef.current = place.formattedAddress;

            // Call onChange callback
            onChange(place.formattedAddress, placeDetails);

            // Update map
            updateMap(placeDetails.location, place.formattedAddress);
          }
        } catch (error) {
          console.error('UnifiedAddressAutocomplete: Error processing place selection:', error);
          handleError('Failed to process selected place');
        }
      });

      // Handle manual input for new API
      autocompleteElement.addEventListener('input', (event: any) => {
        const newValue = event.target.value || '';
        console.log('UnifiedAddressAutocomplete: New API - Input changed:', newValue);
        
        if (newValue !== internalValueRef.current) {
          setInternalValue(newValue);
          setInputValue(newValue);
          internalValueRef.current = newValue;
          onChange(newValue);
        }
      });

      console.log('UnifiedAddressAutocomplete: New API initialized successfully');

    } catch (error) {
      console.error('UnifiedAddressAutocomplete: New API initialization failed:', error);
      throw error;
    }
  };

  // Initialize legacy Places API (with improved ref checking)
  const initializeLegacyPlacesAPI = async () => {
    try {
      console.log('UnifiedAddressAutocomplete: Initializing legacy Places API');

      // Check refs with retry mechanism
      let retries = 0;
      const maxRetries = 3;
      
      while (!inputRef.current && retries < maxRetries) {
        console.log(`UnifiedAddressAutocomplete: Input ref not ready, retry ${retries + 1}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
      }
      
      if (!inputRef.current) {
        console.error('UnifiedAddressAutocomplete: Input ref still not available after retries');
        throw new Error('Input ref not available after retries');
      }

      // Create legacy autocomplete with proper configuration
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions,
        types,
        bounds
      });

      setAutocompleteElement({ legacy: autocomplete });

      // Set up legacy API event listener (FIXED: correct event name)
      autocomplete.addListener('place_changed', () => {
        console.log('UnifiedAddressAutocomplete: Legacy API - Place changed');
        
        try {
          const place = autocomplete.getPlace();
          console.log('UnifiedAddressAutocomplete: Legacy place data:', place);

          if (place.formatted_address) {
            const placeDetails: PlaceDetails = {
              formattedAddress: place.formatted_address,
              location: place.geometry?.location ? {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng()
              } : undefined,
              addressComponents: place.address_components,
              placeId: place.place_id
            };

            // Update internal state
            setInternalValue(place.formatted_address);
            setInputValue(place.formatted_address);
            internalValueRef.current = place.formatted_address;

            // Call onChange callback
            onChange(place.formatted_address, placeDetails);

            // Update map
            updateMap(placeDetails.location, place.formatted_address);
          }
        } catch (error) {
          console.error('UnifiedAddressAutocomplete: Error processing legacy place:', error);
          handleError('Failed to process selected place');
        }
      });

      // Handle manual input for legacy API
      if (inputRef.current) {
        inputRef.current.addEventListener('input', (event: any) => {
          const newValue = event.target.value || '';
          console.log('UnifiedAddressAutocomplete: Legacy API - Input changed:', newValue);
          
          if (newValue !== internalValueRef.current) {
            setInternalValue(newValue);
            setInputValue(newValue);
            internalValueRef.current = newValue;
            onChange(newValue);
          }
        });
      }

      console.log('UnifiedAddressAutocomplete: Legacy API initialized successfully');

    } catch (error) {
      console.error('UnifiedAddressAutocomplete: Legacy API initialization failed:', error);
      throw error;
    }
  };

  // Update map with new location
  const updateMap = useCallback((location?: { lat: number; lng: number }, title?: string) => {
    if (!map || !location) return;

    try {
      console.log('UnifiedAddressAutocomplete: Updating map to:', location);
      
      // Pan to location and zoom in
      map.panTo(location);
      map.setZoom(16);

      // Update or create marker
      if (marker) {
        marker.setPosition(location);
        if (title) marker.setTitle(title);
      } else {
        const newMarker = new window.google.maps.Marker({
          position: location,
          map: map,
          title: title || 'Selected location',
          animation: window.google.maps.Animation.DROP
        });
        setMarker(newMarker);
      }
    } catch (error) {
      console.error('UnifiedAddressAutocomplete: Map update failed:', error);
    }
  }, [map, marker]);

  // Sync external value with internal state
  useEffect(() => {
    if (value !== internalValue) {
      setInternalValue(value);
      setInputValue(value);
      internalValueRef.current = value;

      // Update autocomplete element value if it exists
      if (autocompleteElement) {
        if (useNewAPI && autocompleteElement.value !== undefined) {
          autocompleteElement.value = value;
        } else if (!useNewAPI && autocompleteElement.legacy && inputRef.current) {
          inputRef.current.value = value;
        }
      }
    }
  }, [value, internalValue, autocompleteElement, useNewAPI]);

  // Render loading state
  if (isLoading) {
    return (
      <div className={`unified-address-autocomplete ${className}`}>
        <div className="flex items-center gap-2 p-3 border-2 border-gray-300 rounded-lg bg-gray-50">
          <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">Loading address search...</span>
        </div>
        {showMap && (
          <div className="mt-3 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
            <span className="text-gray-500">Loading map...</span>
          </div>
        )}
      </div>
    );
  }

  // Render error state
  if (loadError) {
    return (
      <div className={`unified-address-autocomplete ${className}`}>
        <div className="p-3 border-2 border-red-300 rounded-lg bg-red-50">
          <div className="flex items-center gap-2 text-red-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Address search unavailable</span>
          </div>
          <p className="text-red-600 text-sm mt-1">{loadError}</p>
        </div>
        
        {/* Fallback input */}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            onChange(e.target.value);
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="mt-2 w-full p-3 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none"
        />
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className={`unified-address-autocomplete ${className}`}
      // Modal-aware container that tracks visibility for proper initialization timing
    >
      <style>{`
        .unified-address-autocomplete {
          position: relative;
        }
        
        /* New API Styling */
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
        
        /* Legacy API and Dropdown Styling */
        .pac-container {
          background: #ffffff !important;
          border: 1px solid #e5e7eb !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
          margin-top: 4px !important;
          overflow: hidden !important;
          font-family: inherit !important;
          z-index: 9999 !important;
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
      `}</style>
      
      {/* Input element (will be replaced by autocomplete for new API) */}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          onChange(e.target.value);
        }}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none transition-colors"
      />
      
      {/* Map container */}
      {showMap && (
        <div 
          className="mt-3 border-2 border-gray-200 rounded-lg overflow-hidden"
          style={{ height: `${mapHeight}px` }}
        >
          <div ref={mapRef} className="w-full h-full" />
        </div>
      )}
    </div>
  );
};

export default UnifiedAddressAutocomplete; 