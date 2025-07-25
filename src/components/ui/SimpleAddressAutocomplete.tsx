import React, { useEffect, useRef, useState } from 'react';

interface SimpleAddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  placeholder?: string;
  className?: string;
}

const SimpleAddressAutocomplete: React.FC<SimpleAddressAutocompleteProps> = ({
  value,
  onChange,
  placeholder = "Search for an address...",
  className = ""
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load Google Maps API
  useEffect(() => {
    const loadGoogleMaps = () => {
      // Check if already loaded
      if (window.google && window.google.maps && window.google.maps.places) {
        setIsLoaded(true);
        return;
      }

      // Check if script already exists
      if (document.querySelector('script[src*="maps.googleapis.com"]')) {
        const checkGoogle = () => {
          if (window.google && window.google.maps && window.google.maps.places) {
            setIsLoaded(true);
          } else {
            setTimeout(checkGoogle, 100);
          }
        };
        checkGoogle();
        return;
      }

      // Create script
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places&callback=initGoogleMaps`;
      script.async = true;
      script.defer = true;
      
      (window as any).initGoogleMaps = () => {
        setIsLoaded(true);
        delete (window as any).initGoogleMaps;
      };
      
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, []);

  // Initialize autocomplete
  useEffect(() => {
    if (!isLoaded || !inputRef.current) return;

    try {
      // Create autocomplete
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: ['AE'] },
        types: ['address']
      });

      autocompleteRef.current = autocomplete;

      // Add listener for place selection
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        console.log('Place selected:', place);
        
        if (place.formatted_address) {
          console.log('Calling onChange with address:', place.formatted_address);
          onChange(place.formatted_address);
        }
      });

      // Clean up on unmount
      return () => {
        if (autocompleteRef.current) {
          window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        }
      };
    } catch (error) {
      console.error('Error initializing autocomplete:', error);
    }
  }, [isLoaded, onChange]);

  // Update input value when prop changes
  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== value) {
      inputRef.current.value = value;
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={`w-full p-3 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none ${className}`}
        disabled={!isLoaded}
      />
      {!isLoaded && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-emerald-500 rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

export default SimpleAddressAutocomplete; 