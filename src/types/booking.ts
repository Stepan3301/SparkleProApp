// TypeScript types for the booking system

export interface Address {
  id: number;
  user_id: string;
  street: string;
  apartment?: string;
  city: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name?: string;
  phone_number?: string;
  role?: 'customer' | 'admin';
  member_since?: string;
  created_at: string;
  updated_at: string;
}

export interface Addon {
  id: string;
  name: string;
  price: number;
}

export type PropertySize = 'small' | 'medium' | 'large' | 'villa';
export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export interface Booking {
  id: number;
  customer_id: string;
  
  // Service details
  service_id?: number;
  property_size: PropertySize;
  size_price: number;
  cleaners_count: number;
  own_materials: boolean;
  
  // Schedule
  service_date: string; // ISO date string
  service_time: string; // HH:MM format
  
  // Customer info
  customer_name: string;
  customer_phone: string;
  
  // Address
  address_id?: number;
  custom_address?: string;
  
  // Additional info
  additional_notes?: string;
  
  // Addons
  addons: Addon[];
  
  // Pricing
  base_price: number;
  addons_total: number;
  total_price: number;
  
  // Status
  status: BookingStatus;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface CreateBookingData {
  customer_id: string;
  property_size: PropertySize;
  size_price: number;
  cleaners_count: number;
  own_materials: boolean;
  service_date: string;
  service_time: string;
  customer_name: string;
  customer_phone: string;
  address_id?: number;
  custom_address?: string;
  additional_notes?: string;
  addons: Addon[];
  base_price: number;
  addons_total: number;
  total_price: number;
  status?: BookingStatus;
}

export interface BookingFormData {
  propertySize: PropertySize;
  sizePrice: number;
  cleanersCount: number;
  ownMaterials: boolean;
  selectedAddons: Addon[];
  serviceDate: string;
  serviceTime: string;
  customerName: string;
  customerPhone: string;
  selectedAddressId?: number;
  newAddress?: string;
  additionalNotes?: string;
}

// Pre-defined service options
export interface SizeOption {
  size: PropertySize;
  label: string;
  details: string;
  price: number;
}

export const SIZE_OPTIONS: SizeOption[] = [
  { size: 'small', label: 'Small', details: '< 40 sqm', price: 100 },
  { size: 'medium', label: 'Medium', details: '40-80 sqm', price: 150 },
  { size: 'large', label: 'Large', details: '80-100 sqm', price: 200 },
  { size: 'villa', label: 'Villa', details: '> 100 sqm', price: 300 },
];

export const ADDON_OPTIONS: Addon[] = [
  { id: 'windows', name: 'Window Cleaning', price: 60 },
  { id: 'carpet', name: 'Carpet Deep Clean', price: 100 },
  { id: 'oven', name: 'Oven Cleaning', price: 80 },
  { id: 'fridge', name: 'Fridge Cleaning', price: 50 },
  { id: 'balcony', name: 'Balcony/Patio', price: 90 },
  { id: 'laundry', name: 'Laundry Service', price: 40 },
];

export const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', 
  '14:00', '15:00', '16:00'
];

export const TIME_SLOT_LABELS: Record<string, string> = {
  '08:00': '8:00 AM',
  '09:00': '9:00 AM',
  '10:00': '10:00 AM',
  '11:00': '11:00 AM',
  '14:00': '2:00 PM',
  '15:00': '3:00 PM',
  '16:00': '4:00 PM',
};

// Helper functions
export const formatTimeSlot = (time: string): string => {
  return TIME_SLOT_LABELS[time] || time;
};

export const calculateBookingTotal = (
  sizePrice: number,
  cleanersCount: number,
  ownMaterials: boolean,
  addons: Addon[],
  hours: number = 2 // Minimum 2 hours
): { basePrice: number; addonsTotal: number; total: number } => {
  const materialsCharge = ownMaterials ? 0 : 10 * cleanersCount;
  const basePrice = (sizePrice + materialsCharge) * cleanersCount * hours;
  const addonsTotal = addons.reduce((sum, addon) => sum + addon.price, 0);
  const total = basePrice + addonsTotal;
  
  return { basePrice, addonsTotal, total };
};

export const getBookingStatusLabel = (status: BookingStatus): string => {
  switch (status) {
    case 'pending':
      return 'Pending Confirmation';
    case 'confirmed':
      return 'Confirmed';
    case 'in_progress':
      return 'In Progress';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return 'Unknown';
  }
};

export const getBookingStatusColor = (status: BookingStatus): string => {
  switch (status) {
    case 'pending':
      return 'text-yellow-600 bg-yellow-100';
    case 'confirmed':
      return 'text-blue-600 bg-blue-100';
    case 'in_progress':
      return 'text-purple-600 bg-purple-100';
    case 'completed':
      return 'text-green-600 bg-green-100';
    case 'cancelled':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}; 