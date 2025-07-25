import React, { useEffect, useRef, useState } from 'react';
import { MapPinIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface GoogleMapsAutocompleteProps {
  value: string;
  onChange: (address: string, placeDetails?: PlaceResult) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  showMap?: boolean;
  showSelectedAddress?: boolean;
}

interface PlaceResult {
  displayName?: { text: string };
  formattedAddress?: string;
  location?: { lat: number; lng: number };
  addressComponents?: Array<{
    longText: string;
    shortText: string;
    types: string[];
  }>;
}

interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

const GoogleMapsAutocomplete: React.FC<GoogleMapsAutocompleteProps> = ({
  value,
  onChange,
  placeholder = "Search for an address...",
  className = "",
  label,
  showMap = true,
  showSelectedAddress = true
}) => {
  const autocompleteRef = useRef<HTMLElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autocompleteElement, setAutocompleteElement] = useState<any>(null);

  // Load Google Maps API with new Places library
  useEffect(() => {
    const initializeGoogleMaps = () => {
      // Check if Google Maps is already loaded
      if (window.google && window.google.maps && (window as any).google?.maps?.importLibrary) {
        setIsLoaded(true);
        return;
      }

      const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        const errorMsg = 'Google Maps API key not found. Please set REACT_APP_GOOGLE_MAPS_API_KEY in your .env file';
        console.error(errorMsg);
        setError(errorMsg);
        return;
      }

      // Check if script is already loading/loaded
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        // If script exists but Google Maps isn't ready, wait for it
        const waitForGoogle = () => {
          if (window.google && window.google.maps && (window as any).google?.maps?.importLibrary) {
            setIsLoaded(true);
          } else {
            setTimeout(waitForGoogle, 100);
          }
        };
        waitForGoogle();
        return;
      }

      // Create and load the script with new API
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker&loading=async&callback=initMap`;
      script.async = true;
      script.defer = true;
      
      // Set up callback
      (window as any).initMap = async () => {
        try {
          // Import the Places library
          await (window as any).google.maps.importLibrary("places");
          await (window as any).google.maps.importLibrary("maps");
          setIsLoaded(true);
        } catch (error) {
          console.error('Error loading Google Maps libraries:', error);
          setError('Failed to load Google Maps libraries');
        }
        delete (window as any).initMap; // Clean up
      };
      
      script.onerror = (error) => {
        const errorMsg = 'Failed to load Google Maps API. Please check your API key and internet connection.';
        console.error(errorMsg, error);
        setError(errorMsg);
      };
      
      document.head.appendChild(script);
    };

    initializeGoogleMaps();
  }, []);

  // Initialize new Places Autocomplete
  useEffect(() => {
    if (!isLoaded) return;

    const initAutocomplete = async () => {
      try {
        // Import the Places library
        const { PlaceAutocompleteElement } = await (window as any).google.maps.importLibrary("places");
        
        // Create the new PlaceAutocompleteElement
        const autocompleteElement = new PlaceAutocompleteElement();
        
        // Configure the autocomplete
        autocompleteElement.id = 'place-autocomplete';
        autocompleteElement.placeholder = placeholder;
        
        // Set country restriction for UAE
        autocompleteElement.options = {
          componentRestrictions: { country: ['AE'] },
          types: ['address']
        };

        // Replace the placeholder div with the autocomplete element
        if (autocompleteRef.current && autocompleteRef.current.parentNode) {
          autocompleteRef.current.parentNode.replaceChild(autocompleteElement, autocompleteRef.current);
          autocompleteRef.current = autocompleteElement;
          setAutocompleteElement(autocompleteElement);
        }

        // Set up event listener for place selection
        autocompleteElement.addEventListener('gmp-placeselect', async (event: any) => {
          console.log('Place selected:', event);
          const place = event.place;
          
          if (place) {
            try {
              // Fetch place details
              await place.fetchFields({
                fields: ['displayName', 'formattedAddress', 'location', 'addressComponents']
              });
              
              console.log('Place details fetched:', place);
              
              if (place.formattedAddress) {
                const selectedPlaceData = {
                  displayName: place.displayName,
                  formattedAddress: place.formattedAddress,
                  location: place.location ? {
                    lat: place.location.lat(),
                    lng: place.location.lng()
                  } : undefined,
                  addressComponents: place.addressComponents
                };
                
                console.log('Setting selected place:', selectedPlaceData);
                setSelectedPlace(selectedPlaceData);
                
                // Update the autocomplete input value immediately
                autocompleteElement.value = place.formattedAddress;
                
                // Call the onChange callback
                onChange(place.formattedAddress, selectedPlaceData);
                
                // Update map if available
                if (map && place.location) {
                  const location = {
                    lat: place.location.lat(),
                    lng: place.location.lng()
                  };
                  
                  console.log('Updating map to location:', location);
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
                  }
                }
              }
            } catch (error) {
              console.error('Error fetching place details:', error);
            }
          }
        });

        // Add input event listener to handle manual typing
        autocompleteElement.addEventListener('input', (event: any) => {
          const inputValue = event.target.value;
          console.log('Input value changed:', inputValue);
          
          // If user is manually typing, clear the selected place
          if (selectedPlace && inputValue !== selectedPlace.formattedAddress) {
            setSelectedPlace(null);
          }
          
          // Call onChange for manual input
          onChange(inputValue);
        });

      } catch (error) {
        console.error('Error initializing Google Maps Autocomplete:', error);
        setError('Failed to initialize address search');
      }
    };

    initAutocomplete();
  }, [isLoaded, placeholder, onChange, map, marker, selectedPlace]);

  // Update autocomplete input value when prop value changes
  useEffect(() => {
    if (autocompleteElement && value !== undefined) {
      // Only update if the value is different to prevent infinite loops
      const currentValue = autocompleteElement.value || '';
      if (value !== currentValue) {
        console.log('Updating autocomplete value from prop:', value);
        autocompleteElement.value = value;
      }
    }
  }, [value, autocompleteElement]);

  // Prevent value from being overridden by form resets
  useEffect(() => {
    if (autocompleteElement && selectedPlace && selectedPlace.formattedAddress) {
      // Ensure the selected address stays in the input
      const currentValue = autocompleteElement.value || '';
      if (currentValue !== selectedPlace.formattedAddress) {
        console.log('Restoring selected address:', selectedPlace.formattedAddress);
        autocompleteElement.value = selectedPlace.formattedAddress;
      }
    }
  }, [autocompleteElement, selectedPlace]);

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !showMap || map) return;

    try {
      // Ensure Google Maps is available
      if (!window.google?.maps?.Map) {
        console.error('Google Maps library not loaded');
        return;
      }

      // Default to Dubai coordinates
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
          },
          {
            featureType: 'road',
            elementType: 'geometry',
            stylers: [{ color: '#ffffff' }]
          },
          {
            featureType: 'road',
            elementType: 'geometry.stroke',
            stylers: [{ color: '#e2e8f0' }]
          },
          {
            featureType: 'poi',
            elementType: 'geometry',
            stylers: [{ color: '#f1f5f9' }]
          },
          {
            featureType: 'poi.park',
            elementType: 'geometry',
            stylers: [{ color: '#ecfdf5' }]
          }
        ],
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: 'cooperative'
      });

      setMap(mapInstance);
    } catch (error) {
      console.error('Error initializing Google Maps:', error);
    }
  }, [isLoaded, showMap, map]);

  return (
    <div className="google-maps-autocomplete">
      <style>{`
        .google-maps-autocomplete {
          position: relative;
        }
        
        .address-input-container {
          position: relative;
        }
        
        gmp-place-autocomplete {
          width: 100%;
          --gmp-place-autocomplete-input-padding: 16px 48px 16px 16px;
          --gmp-place-autocomplete-input-border: 2px solid #e2e8f0;
          --gmp-place-autocomplete-input-border-radius: 12px;
          --gmp-place-autocomplete-input-background: #f8fafc;
          --gmp-place-autocomplete-input-font-size: 16px;
          --gmp-place-autocomplete-input-font-weight: 500;
          --gmp-place-autocomplete-input-color: #374151;
          --gmp-place-autocomplete-input-box-shadow: none;
          --gmp-place-autocomplete-input-transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        gmp-place-autocomplete:focus-within {
          --gmp-place-autocomplete-input-border: 2px solid #10b981;
          --gmp-place-autocomplete-input-background: #ffffff;
          --gmp-place-autocomplete-input-box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
        }
        
        /* Style the dropdown suggestions */
        gmp-place-autocomplete .pac-container {
          background: #ffffff !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 12px !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
          margin-top: 4px !important;
          overflow: hidden !important;
          font-family: inherit !important;
        }
        
        gmp-place-autocomplete .pac-item {
          background: #ffffff !important;
          border: none !important;
          border-bottom: 1px solid #f1f5f9 !important;
          padding: 12px 16px !important;
          font-size: 14px !important;
          color: #374151 !important;
          transition: background-color 0.2s ease !important;
          cursor: pointer !important;
        }
        
        gmp-place-autocomplete .pac-item:last-child {
          border-bottom: none !important;
        }
        
        gmp-place-autocomplete .pac-item:hover,
        gmp-place-autocomplete .pac-item-selected {
          background: #f0fdfa !important;
        }
        
        gmp-place-autocomplete .pac-item-query {
          color: #059669 !important;
          font-weight: 600 !important;
        }
        
        gmp-place-autocomplete .pac-matched {
          color: #10b981 !important;
          font-weight: 600 !important;
        }
        
        gmp-place-autocomplete .pac-icon {
          background-image: none !important;
          width: 20px !important;
          height: 20px !important;
          background: #e6fffa !important;
          border-radius: 6px !important;
          margin-right: 12px !important;
          position: relative !important;
        }
        
        gmp-place-autocomplete .pac-icon::after {
          content: "📍";
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 12px;
        }
        
        .search-icon {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
          transition: color 0.3s ease;
          pointer-events: none;
          z-index: 10;
        }
        
        .address-input-container:focus-within .search-icon {
          color: #10b981;
        }
        
        .map-container {
          margin-top: 16px;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
          border: 2px solid #e2e8f0;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          position: relative;
        }
        
        .map-loading {
          height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          color: #64748b;
          font-weight: 500;
        }
        
        .map-element {
          height: 200px;
          width: 100%;
        }
        
        .selected-address {
          margin-top: 12px;
          padding: 12px 16px;
          background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
          border: 1px solid #a7f3d0;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .selected-address-text {
          color: #065f46;
          font-size: 14px;
          font-weight: 500;
          flex: 1;
        }
        
        .map-pin-icon {
          color: #059669;
          flex-shrink: 0;
        }
        
        .label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }
        
        .error-message {
          margin-top: 12px;
          padding: 12px 16px;
          background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
          border: 1px solid #fca5a5;
          border-radius: 12px;
        }
      `}</style>

      {label && <label className="label">{label}</label>}
      
      <div className="address-input-container">
        <div 
          ref={autocompleteRef as any}
          data-placeholder={placeholder}
          style={{ width: '100%' }}
        />
        <MagnifyingGlassIcon className="search-icon w-5 h-5" />
      </div>

      {error && (
        <div className="error-message">
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {showMap && !error && (
        <div className="map-container">
          {!isLoaded ? (
            <div className="map-loading">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                Loading map...
              </div>
            </div>
          ) : (
            <div ref={mapRef} className="map-element" />
          )}
        </div>
      )}

      {showSelectedAddress && selectedPlace && selectedPlace.formattedAddress && (
        <div className="selected-address">
          <MapPinIcon className="map-pin-icon w-4 h-4" />
          <span className="selected-address-text">
            {selectedPlace.formattedAddress}
          </span>
        </div>
      )}
    </div>
  );
};

export default GoogleMapsAutocomplete; 