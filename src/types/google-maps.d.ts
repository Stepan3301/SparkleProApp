// TypeScript definitions for Google Maps JavaScript API
declare global {
  interface Window {
    google: typeof google;
    googleMapsReady: boolean;
  }
}

declare namespace google.maps {
  // Core Map functionality
  function importLibrary(library: string): Promise<any>;

  interface Map {
    new (element: HTMLElement | null, opts: MapOptions): Map;
    fitBounds(bounds: LatLngBounds | LatLngBoundsLiteral): void;
    setCenter(latLng: LatLng | LatLngLiteral): void;
    setZoom(zoom: number): void;
    panTo(latLng: LatLng | LatLngLiteral): void;
    controls: Array<Array<HTMLElement>>;
  }

  interface MapOptions {
    center?: LatLng | LatLngLiteral;
    zoom?: number;
    mapId?: string;
    mapTypeControl?: boolean;
    streetViewControl?: boolean;
    fullscreenControl?: boolean;
    styles?: MapTypeStyle[];
  }

  interface MapTypeStyle {
    featureType?: string;
    elementType?: string;
    stylers?: Array<{ [key: string]: string | number }>;
  }

  interface LatLng {
    lat(): number;
    lng(): number;
  }

  interface LatLngLiteral {
    lat: number;
    lng: number;
  }

  interface LatLngBounds {
    contains(latLng: LatLng | LatLngLiteral): boolean;
    extend(point: LatLng | LatLngLiteral): LatLngBounds;
  }

  interface LatLngBoundsLiteral {
    east: number;
    north: number;
    south: number;
    west: number;
  }

  enum ControlPosition {
    TOP_LEFT = 1,
    TOP_CENTER = 2,
    TOP_RIGHT = 3
  }

  // Advanced Markers (New API)
  namespace marker {
    interface AdvancedMarkerElement {
      new (opts?: AdvancedMarkerElementOptions): AdvancedMarkerElement;
      position: LatLng | LatLngLiteral | null;
      title?: string;
      map?: Map;
    }

    interface AdvancedMarkerElementOptions {
      position?: LatLng | LatLngLiteral;
      map?: Map;
      title?: string;
    }
  }

  // Legacy Markers
  interface Marker {
    new (opts?: MarkerOptions): Marker;
    setPosition(latLng: LatLng | LatLngLiteral | null): void;
    setVisible(visible: boolean): void;
    setTitle(title: string): void;
    setAnimation(animation: Animation | null): void;
  }

  interface MarkerOptions {
    position?: LatLng | LatLngLiteral;
    map?: Map;
    title?: string;
    animation?: Animation;
    visible?: boolean;
  }

  enum Animation {
    BOUNCE = 1,
    DROP = 2
  }

  interface InfoWindow {
    new (opts?: InfoWindowOptions): InfoWindow;
    close(): void;
    open(openOptions?: { map?: Map; anchor?: any; shouldFocus?: boolean }): void;
    setContent(content: string | HTMLElement): void;
    setPosition(position: LatLng | LatLngLiteral): void;
  }

  interface InfoWindowOptions {
    content?: string | HTMLElement;
    maxWidth?: number;
  }

  namespace places {
    // New Places API
    interface PlaceAutocompleteElement extends HTMLElement {
      new (): PlaceAutocompleteElement;
      id: string;
      placeholder: string;
      locationBias: LatLng | LatLngLiteral;
      componentRestrictions: ComponentRestrictions;
      addEventListener(type: 'gmp-select', listener: (event: PlaceSelectEvent) => void): void;
    }

    interface PlaceSelectEvent {
      placePrediction: PlacePrediction;
    }

    interface PlacePrediction {
      toPlace(): Place;
    }

    interface Place {
      id: string;
      displayName: string;
      formattedAddress: string;
      location: LatLng;
      viewport?: LatLngBounds;
      fetchFields(options: { fields: string[] }): Promise<void>;
    }

    // Legacy Places API (for compatibility)
    interface Autocomplete {
      new (inputField: HTMLInputElement, opts?: AutocompleteOptions): Autocomplete;
      addListener(eventName: string, handler: () => void): void;
      bindTo(key: string, target: any): void;
      getPlace(): PlaceResult;
      setComponentRestrictions(restrictions: ComponentRestrictions): void;
      setTypes(types: string[]): void;
      setOptions(options: AutocompleteOptions): void;
      setBounds(bounds: LatLngBounds | LatLngBoundsLiteral): void;
    }

    interface AutocompleteOptions {
      bounds?: LatLngBounds | LatLngBoundsLiteral;
      componentRestrictions?: ComponentRestrictions;
      fields?: string[];
      strictBounds?: boolean;
      types?: string[];
    }

    interface ComponentRestrictions {
      country?: string | string[];
    }

    interface PlaceResult {
      address_components?: AddressComponent[];
      formatted_address?: string;
      geometry?: PlaceGeometry;
      name?: string;
      place_id?: string;
      types?: string[];
    }

    interface AddressComponent {
      long_name: string;
      short_name: string;
      types: string[];
    }

    interface PlaceGeometry {
      location?: LatLng;
      viewport?: LatLngBounds;
    }
  }

  namespace event {
    function clearInstanceListeners(instance: any): void;
  }
}

export {};