// Centralized Google Maps API Loader
// Eliminates callback conflicts and provides robust error handling

interface GoogleMapsConfig {
  apiKey: string;
  libraries?: string[];
  version?: string;
  region?: string;
  language?: string;
}

interface GoogleMapsLoadResult {
  success: boolean;
  error?: string;
  hasNewPlacesAPI: boolean;
  hasLegacyPlacesAPI: boolean;
}

class GoogleMapsAPILoader {
  private static instance: GoogleMapsAPILoader;
  private isLoading = false;
  private isLoaded = false;
  private loadPromise: Promise<GoogleMapsLoadResult> | null = null;
  private config: GoogleMapsConfig | null = null;
  private listeners: ((result: GoogleMapsLoadResult) => void)[] = [];

  private constructor() {}

  static getInstance(): GoogleMapsAPILoader {
    if (!GoogleMapsAPILoader.instance) {
      GoogleMapsAPILoader.instance = new GoogleMapsAPILoader();
    }
    return GoogleMapsAPILoader.instance;
  }

  // Check if Google Maps is already loaded
  isGoogleMapsLoaded(): boolean {
    return !!(window.google && window.google.maps);
  }

  // Check if new Places API is available
  hasNewPlacesAPI(): boolean {
    return !!(window.google?.maps && (window as any).google?.maps?.importLibrary);
  }

  // Check if legacy Places API is available
  hasLegacyPlacesAPI(): boolean {
    return !!(window.google?.maps?.places?.Autocomplete);
  }

  // Get current load status
  getLoadStatus(): GoogleMapsLoadResult | null {
    if (!this.isLoaded) return null;
    
    return {
      success: true,
      hasNewPlacesAPI: this.hasNewPlacesAPI(),
      hasLegacyPlacesAPI: this.hasLegacyPlacesAPI()
    };
  }

  // Add listener for load completion
  addLoadListener(callback: (result: GoogleMapsLoadResult) => void): void {
    this.listeners.push(callback);
  }

  // Remove listener
  removeLoadListener(callback: (result: GoogleMapsLoadResult) => void): void {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  // Notify all listeners
  private notifyListeners(result: GoogleMapsLoadResult): void {
    this.listeners.forEach(callback => {
      try {
        callback(result);
      } catch (error) {
        console.error('GoogleMapsLoader: Error in listener callback:', error);
      }
    });
  }

  // Load Google Maps API
  async loadGoogleMaps(config: GoogleMapsConfig): Promise<GoogleMapsLoadResult> {
    // If already loaded, return immediately
    if (this.isLoaded) {
      const result = this.getLoadStatus()!;
      return result;
    }

    // If currently loading, return the existing promise
    if (this.isLoading && this.loadPromise) {
      return this.loadPromise;
    }

    // Validate API key
    if (!config.apiKey) {
      const error = 'Google Maps API key is required';
      console.error('GoogleMapsLoader:', error);
      const result: GoogleMapsLoadResult = { success: false, error, hasNewPlacesAPI: false, hasLegacyPlacesAPI: false };
      this.notifyListeners(result);
      return result;
    }

    // Store config
    this.config = config;
    this.isLoading = true;

    // Create the load promise
    this.loadPromise = new Promise<GoogleMapsLoadResult>(async (resolve) => {
      try {
        // Check if script already exists
        const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
        
        if (existingScript) {
          console.log('GoogleMapsLoader: Script already exists, waiting for Google Maps to be ready');
          await this.waitForGoogleMaps();
        } else {
          console.log('GoogleMapsLoader: Loading Google Maps script');
          await this.loadScript(config);
        }

        // Verify what APIs are available
        const hasNewPlacesAPI = this.hasNewPlacesAPI();
        const hasLegacyPlacesAPI = this.hasLegacyPlacesAPI();

        console.log('GoogleMapsLoader: Load completed', {
          hasNewPlacesAPI,
          hasLegacyPlacesAPI
        });

        const result: GoogleMapsLoadResult = {
          success: true,
          hasNewPlacesAPI,
          hasLegacyPlacesAPI
        };

        this.isLoaded = true;
        this.isLoading = false;
        this.notifyListeners(result);
        resolve(result);

      } catch (error) {
        console.error('GoogleMapsLoader: Failed to load Google Maps:', error);
        const result: GoogleMapsLoadResult = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          hasNewPlacesAPI: false,
          hasLegacyPlacesAPI: false
        };
        
        this.isLoading = false;
        this.notifyListeners(result);
        resolve(result);
      }
    });

    return this.loadPromise;
  }

  // Wait for Google Maps to be ready (when script exists but not loaded)
  private waitForGoogleMaps(): Promise<void> {
    return new Promise((resolve) => {
      const checkGoogle = () => {
        if (this.isGoogleMapsLoaded()) {
          console.log('GoogleMapsLoader: Google Maps is now ready');
          resolve();
        } else {
          setTimeout(checkGoogle, 100);
        }
      };
      checkGoogle();
    });
  }

  // Load the Google Maps script
  private loadScript(config: GoogleMapsConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      // Set up unique callback name to avoid conflicts
      const callbackName = `googleMapsCallback_${Date.now()}`;
      
      // Create script element
      const script = document.createElement('script');
      const libraries = config.libraries || ['places', 'marker'];
      const params = new URLSearchParams({
        key: config.apiKey,
        libraries: libraries.join(','),
        loading: 'async',
        callback: callbackName
      });

      if (config.version) params.append('v', config.version);
      if (config.region) params.append('region', config.region);
      if (config.language) params.append('language', config.language);

      script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
      script.async = true;
      script.defer = true;

      // Set up callback
      (window as any)[callbackName] = async () => {
        try {
          console.log('GoogleMapsLoader: Callback triggered');
          
          // Try to import new libraries if available
          if ((window as any).google?.maps?.importLibrary) {
            try {
              console.log('GoogleMapsLoader: Importing new Places and Maps libraries');
              await Promise.all([
                (window as any).google.maps.importLibrary("places"),
                (window as any).google.maps.importLibrary("maps")
              ]);
              console.log('GoogleMapsLoader: New libraries imported successfully');
            } catch (importError) {
              console.warn('GoogleMapsLoader: Failed to import new libraries (will use legacy):', importError);
            }
          }
          
          // Clean up callback
          delete (window as any)[callbackName];
          
          // Dispatch global event for components that need it
          document.dispatchEvent(new CustomEvent('googleMapsLoaded', {
            detail: {
              hasNewPlacesAPI: this.hasNewPlacesAPI(),
              hasLegacyPlacesAPI: this.hasLegacyPlacesAPI()
            }
          }));
          
          resolve();
        } catch (error) {
          console.error('GoogleMapsLoader: Callback error:', error);
          delete (window as any)[callbackName];
          reject(error);
        }
      };

      // Handle script errors
      script.onerror = (error) => {
        console.error('GoogleMapsLoader: Script load error:', error);
        delete (window as any)[callbackName];
        reject(new Error('Failed to load Google Maps script'));
      };

      // Add script to document
      document.head.appendChild(script);
      console.log('GoogleMapsLoader: Script added to document');
    });
  }

  // Get default configuration
  static getDefaultConfig(): Partial<GoogleMapsConfig> {
    return {
      libraries: ['places', 'marker'],
      region: 'AE', // UAE
      language: 'en'
    };
  }
}

// Export singleton instance
export const googleMapsLoader = GoogleMapsAPILoader.getInstance();

// Export types
export type { GoogleMapsConfig, GoogleMapsLoadResult };

// Helper function for components
export const loadGoogleMapsForComponent = async (componentName: string): Promise<GoogleMapsLoadResult> => {
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    const error = `${componentName}: Google Maps API key not found. Please set REACT_APP_GOOGLE_MAPS_API_KEY in your .env file`;
    console.error(error);
    return { success: false, error, hasNewPlacesAPI: false, hasLegacyPlacesAPI: false };
  }

  const config: GoogleMapsConfig = {
    apiKey,
    ...GoogleMapsAPILoader.getDefaultConfig()
  };

  console.log(`${componentName}: Loading Google Maps API`);
  return await googleMapsLoader.loadGoogleMaps(config);
}; 