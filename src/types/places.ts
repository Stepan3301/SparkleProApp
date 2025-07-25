export interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

export interface PlaceDetails {
  address_components?: AddressComponent[];
  formatted_address?: string;
  displayName?: { text: string };
  formattedAddress?: string;
  location?: { lat: number; lng: number };
  addressComponents?: Array<{
    longText: string;
    shortText: string;
    types: string[];
  }>;
}

export interface PlaceResult {
  displayName?: { text: string };
  formattedAddress?: string;
  location?: { lat: number; lng: number };
  addressComponents?: Array<{
    longText: string;
    shortText: string;
    types: string[];
  }>;
} 