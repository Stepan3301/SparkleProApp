import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// Types
interface ServiceType {
  id: number;
  name: string;
  description: string;
  base_price: number | null;
  price_per_hour: number | null;
  is_active: boolean;
  image: string;
  image_url?: string;
}

interface Addon {
  id: number;
  name: string;
  price: number;
  quantity?: number;
  category?: string;
}

interface Address {
  id: number;
  building_name: string;
  apartment?: string;
  city: string;
}

interface Profile {
  id: string;
  full_name: string;
  phone: string;
  email?: string;
}

interface PaymentCard {
  id: number;
  card_number: string;
  card_holder_name: string;
  expiry_date: string;
  is_default: boolean;
}

interface BookingState {
  // Step 1 - Service Selection
  selectedMainCategory: string | null;
  selectedService: ServiceType | null;
  showSubServices: boolean;
  
  // Step 1 - Service Configuration
  selectedPropertySize: string | null;
  selectedCleaners: number | null;
  selectedHours: number | null;
  ownMaterials: boolean;
  windowPanelsCount: number | null;
  
  // Step 2 - Add-ons
  selectedAddons: Addon[];
  activeAddonSection: 'sofa' | 'carpet' | 'mattress' | 'curtains' | 'other';
  
  // Step 3 - Date & Time
  serviceDate: string;
  serviceTime: string;
  
  // Step 4 - Contact & Address
  selectedAddressId: number | null;
  customerName: string;
  customerPhone: string;
  additionalNotes: string;
  addresses: Address[];
  profile: Profile | null;
  
  // Step 5 - Payment
  selectedPaymentMethod: 'cash' | 'card' | null;
  selectedCardId: number | null;
  savedCards: PaymentCard[];
  
  // UI State
  currentStep: number;
  loading: boolean;
  showGuestSignupModal: boolean;
  activePackageSection: 'apartments' | 'villas' | 'other';
  
  // Services data
  services: ServiceType[];
  additionalServices: any[];
  
  // Actions
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  
  // Step 1 Actions
  setSelectedMainCategory: (category: string | null) => void;
  setSelectedService: (service: ServiceType | null) => void;
  setShowSubServices: (show: boolean) => void;
  setSelectedPropertySize: (size: string | null) => void;
  setSelectedCleaners: (cleaners: number | null) => void;
  setSelectedHours: (hours: number | null) => void;
  setOwnMaterials: (ownMaterials: boolean) => void;
  setWindowPanelsCount: (count: number | null) => void;
  
  // Step 2 Actions
  addAddon: (addon: Addon) => void;
  removeAddon: (addonId: number) => void;
  updateAddonQuantity: (addonId: number, quantity: number) => void;
  setActiveAddonSection: (section: 'sofa' | 'carpet' | 'mattress' | 'curtains' | 'other') => void;
  
  // Step 3 Actions
  setServiceDate: (date: string) => void;
  setServiceTime: (time: string) => void;
  
  // Step 4 Actions
  setSelectedAddressId: (id: number | null) => void;
  setCustomerName: (name: string) => void;
  setCustomerPhone: (phone: string) => void;
  setAdditionalNotes: (notes: string) => void;
  setAddresses: (addresses: Address[]) => void;
  setProfile: (profile: Profile | null) => void;
  
  // Step 5 Actions
  setSelectedPaymentMethod: (method: 'cash' | 'card' | null) => void;
  setSelectedCardId: (id: number | null) => void;
  setSavedCards: (cards: PaymentCard[]) => void;
  
  // UI Actions
  setLoading: (loading: boolean) => void;
  setShowGuestSignupModal: (show: boolean) => void;
  setActivePackageSection: (section: 'apartments' | 'villas' | 'other') => void;
  
  // Data Actions
  setServices: (services: ServiceType[]) => void;
  setAdditionalServices: (services: any[]) => void;
  
  // Reset
  resetBooking: () => void;
}

const initialState = {
  // Step 1
  selectedMainCategory: null,
  selectedService: null,
  showSubServices: false,
  selectedPropertySize: null,
  selectedCleaners: null,
  selectedHours: null,
  ownMaterials: false,
  windowPanelsCount: null,
  
  // Step 2
  selectedAddons: [],
  activeAddonSection: 'sofa' as const,
  
  // Step 3
  serviceDate: '',
  serviceTime: '',
  
  // Step 4
  selectedAddressId: null,
  customerName: '',
  customerPhone: '',
  additionalNotes: '',
  addresses: [],
  profile: null,
  
  // Step 5
  selectedPaymentMethod: null,
  selectedCardId: null,
  savedCards: [],
  
  // UI
  currentStep: 1,
  loading: false,
  showGuestSignupModal: false,
  activePackageSection: 'apartments' as const,
  
  // Data
  services: [],
  additionalServices: [],
};

export const useBookingStore = create<BookingState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        // Step navigation
        setCurrentStep: (step) => set({ currentStep: step }),
        nextStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),
        prevStep: () => set((state) => ({ currentStep: state.currentStep - 1 })),
        
        // Step 1 Actions
        setSelectedMainCategory: (category) => set({ selectedMainCategory: category }),
        setSelectedService: (service) => set({ selectedService: service }),
        setShowSubServices: (show) => set({ showSubServices: show }),
        setSelectedPropertySize: (size) => set({ selectedPropertySize: size }),
        setSelectedCleaners: (cleaners) => set({ selectedCleaners: cleaners }),
        setSelectedHours: (hours) => set({ selectedHours: hours }),
        setOwnMaterials: (ownMaterials) => set({ ownMaterials }),
        setWindowPanelsCount: (count) => set({ windowPanelsCount: count }),
        
        // Step 2 Actions
        addAddon: (addon) => set((state) => ({
          selectedAddons: [...state.selectedAddons, addon]
        })),
        removeAddon: (addonId) => set((state) => ({
          selectedAddons: state.selectedAddons.filter(a => a.id !== addonId)
        })),
        updateAddonQuantity: (addonId, quantity) => set((state) => ({
          selectedAddons: state.selectedAddons.map(a =>
            a.id === addonId ? { ...a, quantity } : a
          )
        })),
        setActiveAddonSection: (section) => set({ activeAddonSection: section }),
        
        // Step 3 Actions
        setServiceDate: (date) => set({ serviceDate: date }),
        setServiceTime: (time) => set({ serviceTime: time }),
        
        // Step 4 Actions
        setSelectedAddressId: (id) => set({ selectedAddressId: id }),
        setCustomerName: (name) => set({ customerName: name }),
        setCustomerPhone: (phone) => set({ customerPhone: phone }),
        setAdditionalNotes: (notes) => set({ additionalNotes: notes }),
        setAddresses: (addresses) => set({ addresses }),
        setProfile: (profile) => set({ profile }),
        
        // Step 5 Actions
        setSelectedPaymentMethod: (method) => set({ selectedPaymentMethod: method }),
        setSelectedCardId: (id) => set({ selectedCardId: id }),
        setSavedCards: (cards) => set({ savedCards: cards }),
        
        // UI Actions
        setLoading: (loading) => set({ loading }),
        setShowGuestSignupModal: (show) => set({ showGuestSignupModal: show }),
        setActivePackageSection: (section) => set({ activePackageSection: section }),
        
        // Data Actions
        setServices: (services) => set({ services }),
        setAdditionalServices: (services) => set({ additionalServices: services }),
        
        // Reset
        resetBooking: () => set(initialState),
      }),
      {
        name: 'booking-storage',
        partialize: (state) => ({
          // Only persist essential booking data
          selectedMainCategory: state.selectedMainCategory,
          selectedService: state.selectedService,
          selectedPropertySize: state.selectedPropertySize,
          selectedCleaners: state.selectedCleaners,
          selectedHours: state.selectedHours,
          ownMaterials: state.ownMaterials,
          windowPanelsCount: state.windowPanelsCount,
          selectedAddons: state.selectedAddons,
          serviceDate: state.serviceDate,
          serviceTime: state.serviceTime,
          selectedAddressId: state.selectedAddressId,
          additionalNotes: state.additionalNotes,
          selectedPaymentMethod: state.selectedPaymentMethod,
          selectedCardId: state.selectedCardId,
          currentStep: state.currentStep,
        }),
      }
    )
  )
);

