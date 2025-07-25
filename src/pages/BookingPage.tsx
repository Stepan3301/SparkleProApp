import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import DirhamIcon from '../components/ui/DirhamIcon';
import Button from '../components/ui/Button';
import StepIndicator from '../components/ui/StepIndicator';
import EnhancedDateTimePicker from '../components/booking/EnhancedDateTimePicker';
import AddCardForm from '../components/ui/AddCardForm';
import UnifiedAddressAutocomplete from '../components/ui/UnifiedAddressAutocomplete';
import { maskCardNumber } from '../utils/cardEncryption';
import { PlaceResult } from '../types/places';
import { 
  Address, 
  Addon, 
  calculateBookingTotal,
  Profile
} from '../types/booking';
import { 
  getRecommendation, 
  getServiceKey, 
  PROPERTY_SIZES,
  PROPERTY_SIZE_MAP,
  calculateCost,
  RecommendationResult
} from '../utils/recommendationAlgorithm';

// Form validation schema for step 5 (was step 4)
const contactSchema = z.object({
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  customerPhone: z.string().min(10, 'Please enter a valid phone number'),
  selectedAddressId: z.number().optional(),
  newAddress: z.string().optional(),
  additionalNotes: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface PaymentCard {
  id: number;
  card_name: string;
  card_number_last4: string;
  card_type: string;
  expiry_month: number;
  expiry_year: number;
  is_default: boolean;
}

// Service type definitions - now dynamic from database
interface ServiceType {
  id: number;
  name: string;
  description: string;
  base_price: number;
  price_per_hour: number | null;
  is_active: boolean;
  image: string; // We'll add this for UI
  category: string; // We'll categorize services
}

// Main service categories for the first step
const MAIN_SERVICE_CATEGORIES = [
  {
    key: 'regular',
    name: 'Regular Cleaning',
    description: 'Standard home cleaning service',
    image: '/regular-cleaning.jpg',
    serviceIds: [6, 7] // without/with materials
  },
  {
    key: 'deep',
    name: 'Deep Cleaning', 
    description: 'Thorough deep cleaning service',
    image: '/deep-cleaning.JPG',
    serviceIds: [8, 9] // without/with materials
  },
  {
    key: 'move',
    name: 'Move In/Out',
    description: 'Comprehensive cleaning for moving',
    image: '/move-in-move-out.JPG',
    serviceIds: [13] // move in/out cleaning
  },
  {
    key: 'office',
    name: 'Office Cleaning',
    description: 'Professional workspace cleaning', 
    image: '/office-cleaning.JPG',
    serviceIds: [6, 7] // using regular cleaning services
  }
];

// Service categories for the new two-staged selection
const MAIN_SERVICE_CATEGORIES_NEW = [
  {
    key: 'regular',
    icon: '🏠',
    title: 'Regular Cleaning',
    subtitle: 'Perfect for weekly maintenance',
    price: 'From 70 AED',
    description: 'Standard home cleaning service',
    serviceIds: [6, 7] // Regular Cleaning (without/with materials)
  },
  {
    key: 'deep',
    icon: '✨',
    title: 'Deep Cleaning',
    subtitle: 'Thorough cleaning service',
    price: 'From 90 AED',
    description: 'Complete deep cleaning',
    serviceIds: [8, 9] // Deep Cleaning (without/with materials)
  },
  {
    key: 'packages',
    icon: '📦',
    title: 'Complete Packages',
    subtitle: 'All-inclusive cleaning solutions',
    price: 'From 299 AED',
    description: 'Fixed-price comprehensive services',
    serviceIds: [10, 11, 12, 13, 14, 15, 16] // Full Villa Deep Cleaning, Full Apartment Deep Cleaning, Villa Façade Cleaning, Move in/Move out Cleaning, Post-construction Cleaning, Kitchen Deep Cleaning, Bathroom Deep Cleaning
  },
  {
    key: 'specialized',
    icon: '🪟',
    title: 'Specialized Services',
    subtitle: 'Professional specialized cleaning',
    price: 'From 20 AED',
    description: 'Per-unit specialized services',
    serviceIds: [17, 18, 19] // Internal Window Cleaning, External Window Cleaning, Full Villa Window Package
  }
];

const BookingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // State management
  const [currentStep, setCurrentStep] = useState(1);
  
  // State for two-staged selection
  const [selectedMainCategory, setSelectedMainCategory] = useState<string | null>(null);
  const [showSubServices, setShowSubServices] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isUsingNewAddress, setIsUsingNewAddress] = useState(false);
  const [savedCards, setSavedCards] = useState<PaymentCard[]>([]);
  
  // Service data from database
  const [services, setServices] = useState<ServiceType[]>([]);
  const [additionalServices, setAdditionalServices] = useState<any[]>([]);
  
  // Booking data state
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
  const [selectedPropertySize, setSelectedPropertySize] = useState<string | null>(null);
  const [selectedCleaners, setSelectedCleaners] = useState<number | null>(null);
  const [selectedHours, setSelectedHours] = useState<number | null>(null);
  const [ownMaterials, setOwnMaterials] = useState(false);
  const [selectedAddons, setSelectedAddons] = useState<any[]>([]);
  const [serviceDate, setServiceDate] = useState('');
  const [serviceTime, setServiceTime] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [showAddCardForm, setShowAddCardForm] = useState(false);
  const [newAddressValue, setNewAddressValue] = useState('');
  const [newAddressStreet, setNewAddressStreet] = useState('');
  const [recommendation, setRecommendation] = useState<RecommendationResult | null>(null);

  // State for eco-friendly info expansion
  const [showEcoInfo, setShowEcoInfo] = useState(false);

  // Form for contact details
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  // Watch for changes in newAddress to keep state in sync
  const watchedNewAddress = watch('newAddress');

  // Handle URL parameters for pre-selected service
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const serviceParam = urlParams.get('service');
    
    if (serviceParam) {
      // Map service parameters to categories
      let categoryKey = '';
      if (serviceParam.includes('regular') || serviceParam === 'regular') categoryKey = 'regular';
      else if (serviceParam.includes('deep') || serviceParam === 'deep') categoryKey = 'deep';
      else if (serviceParam.includes('move') || serviceParam === 'move') categoryKey = 'move';
      else if (serviceParam.includes('office') || serviceParam === 'office') categoryKey = 'office';
      
      if (categoryKey) {
        setSelectedMainCategory(categoryKey);
        setCurrentStep(2); // Skip to step 2 if service is pre-selected
      }
    }
  }, [location.search]);

  // Synchronize newAddressValue with form field
  useEffect(() => {
    if (newAddressValue && newAddressValue !== watchedNewAddress) {
      setValue('newAddress', newAddressValue);
    }
  }, [newAddressValue, setValue, watchedNewAddress]);

  // Fetch data when user is available
  useEffect(() => {
    if (user) {
      fetchUserData();
      fetchAddresses();
      fetchSavedCards();
      fetchServices();
    }
  }, [user]);

  // Set minimum date to tomorrow
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = tomorrow.toISOString().split('T')[0];
    const dateInput = document.getElementById('serviceDate') as HTMLInputElement;
    if (dateInput) {
      dateInput.min = minDate;
    }
  }, [currentStep]);

  // Fetch profile data when reaching contact details step
  useEffect(() => {
    if (user && currentStep === 4 && !profile) {
      fetchUserData();
    }
  }, [currentStep, user, profile]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data && !error) {
        setProfile(data);
        // Set form values with profile data
        setValue('customerName', data.full_name || '');
        setValue('customerPhone', data.phone_number || '');
      } else {
        // Fallback to user metadata if profile doesn't exist
        const fallbackName = user.user_metadata?.full_name || user.user_metadata?.name || '';
        const fallbackPhone = user.phone || user.user_metadata?.phone || '';
        
        setValue('customerName', fallbackName);
        setValue('customerPhone', fallbackPhone);
        
        console.log('Profile not found, using fallback data:', { fallbackName, fallbackPhone });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Use fallback data in case of error
      const fallbackName = user.user_metadata?.full_name || user.user_metadata?.name || '';
      const fallbackPhone = user.phone || user.user_metadata?.phone || '';
      
      setValue('customerName', fallbackName);
      setValue('customerPhone', fallbackPhone);
    }
  };

  const fetchAddresses = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
      
      // Auto-select default address
      const defaultAddress = data?.find(addr => addr.is_default);
      if (defaultAddress) {
        setValue('selectedAddressId', defaultAddress.id);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  const fetchSavedCards = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('payment_cards')
        .select('id, card_name, card_number_last4, card_type, expiry_month, expiry_year, is_default')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedCards(data || []);
    } catch (error) {
      console.error('Error fetching saved cards:', error);
    }
  };

  const fetchServices = async () => {
    if (!user) return;

    try {
      // Fetch main services
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('id');

      if (servicesError) throw servicesError;
      
      // Add UI-specific fields to services
      const servicesWithUI = servicesData?.map(service => ({
        ...service,
        image: getServiceImageByName(service.name),
        category: getCategoryByName(service.name)
      })) || [];
      
      setServices(servicesWithUI);

      // Fetch additional services  
      const { data: addonsData, error: addonsError } = await supabase
        .from('additional_services')
        .select('*')
        .eq('is_active', true)
        .order('id');

      if (addonsError) throw addonsError;
      
      // Transform additional services to match UI format
      const addonsWithUI = addonsData?.map(addon => ({
        id: addon.id.toString(),
        name: addon.name,
        price: parseFloat(addon.price),
        description: addon.description,
        unit: addon.unit
      })) || [];
      
      setAdditionalServices(addonsWithUI);

      // Initialize selectedService based on pre-selected category
      if (selectedMainCategory) {
        const category = MAIN_SERVICE_CATEGORIES_NEW.find(cat => cat.key === selectedMainCategory);
        if (category) {
          const service = servicesWithUI?.find(s => category.serviceIds.includes(s.id));
          if (service) {
            setSelectedService(service);
            setCurrentStep(2); // Skip to step 2 if service is pre-selected
          }
        }
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  // Helper functions for service mapping
  const getServiceImageByName = (serviceName: string): string => {
    const name = serviceName.toLowerCase();
    
    // Specific service mappings
    if (name.includes('full villa deep')) return '/villa-deep-cleaning.png';
    if (name.includes('full apartment deep')) return '/appartment-deep-cleaning.png';
    if (name.includes('villa facade')) return '/villa-facade-cleaning.png';
    if (name.includes('bathroom deep')) return '/bathroom-deep-cleaning.png';
    if (name.includes('kitchen deep')) return '/kitchen-deep-cleaning.png';
    if (name.includes('post-construction') || name.includes('postconstruction')) return '/post-construction-cleaning.png';
    if (name.includes('wardrobe') || name.includes('cabinet')) return '/wardrobe-cabinet-cleaning.png';
    
    // General category mappings
    if (name.includes('regular')) return '/regular-cleaning.jpg';
    if (name.includes('deep')) return '/deep-cleaning.JPG';
    if (name.includes('move')) return '/move-in-move-out.JPG';
    if (name.includes('office')) return '/office-cleaning.JPG';
    if (name.includes('villa')) return '/villa-deep-cleaning.png';
    if (name.includes('apartment')) return '/appartment-deep-cleaning.png';
    if (name.includes('window')) return '/window-cleaning.JPG';
    if (name.includes('bathroom')) return '/bathroom-deep-cleaning.png';
    if (name.includes('kitchen')) return '/kitchen-deep-cleaning.png';
    if (name.includes('facade')) return '/villa-facade-cleaning.png';
    
    return '/regular-cleaning.jpg';
  };

  const getCategoryByName = (serviceName: string): string => {
    if (serviceName.includes('Regular')) return 'regular';
    if (serviceName.includes('Deep')) return 'deep';
    if (serviceName.includes('Move')) return 'move';
    return 'other';
  };

  // Step navigation
  const nextStep = () => {
    if (currentStep === 1) {
      if (!selectedMainCategory) {
        alert('Please select a service category');
        return;
      }
    } else if (currentStep === 2) {
      if (!selectedService) {
        alert('Please select a service');
        return;
      }
      // Only validate size/cleaners for hourly services
      if (selectedService.price_per_hour && (!selectedPropertySize || !selectedCleaners)) {
        alert('Please select property size and number of cleaners for hourly services');
        return;
      }
    } else if (currentStep === 3) {
      if (!serviceDate || !serviceTime) {
        alert('Please select date and time');
        return;
      }
    } else if (currentStep === 4) {
      if (!selectedPaymentMethod) {
        alert('Please select a payment method');
        return;
      }
    }
    
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  // Calculations - Updated for new service structure
  const calculatePricing = () => {
    if (!selectedService) {
      return { basePrice: 0, addonsTotal: 0, total: 0 };
    }

    // For fixed price services (packages)
    if (!selectedService.price_per_hour || selectedMainCategory === 'packages') {
      const addonsTotal = selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
      const basePrice = parseFloat(selectedService.base_price.toString());
      return {
        basePrice: Math.round(basePrice),
        addonsTotal: Math.round(addonsTotal),
        total: Math.round(basePrice + addonsTotal)
      };
    }

    // For hourly services (regular, deep, specialized) - use recommendation algorithm
    if (selectedPropertySize && selectedCleaners && selectedHours) {
      const serviceKey = getServiceKey(selectedService.name);
      const basePrice = calculateCost(serviceKey, selectedCleaners, selectedHours, !ownMaterials);
      const addonsTotal = selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
      
      return {
        basePrice: Math.round(basePrice),
        addonsTotal: Math.round(addonsTotal),
        total: Math.round(basePrice + addonsTotal)
      };
    }

    return { basePrice: 0, addonsTotal: 0, total: 0 };
  };

  // Handle booking submission
  const onSubmit = async (data: ContactFormData) => {
    if (!user || !selectedService) return;

    // Validate user has a valid ID
    if (!user.id) {
      alert('User authentication error. Please log in again.');
      return;
    }

    // For hourly services, validate size/cleaners
    if (selectedService.price_per_hour && (!selectedPropertySize || !selectedCleaners || !selectedHours)) {
      alert('Please complete all service configuration (property size, cleaners, and hours)');
      return;
    }

    // Validate address selection
    if (!isUsingNewAddress && !data.selectedAddressId) {
      alert('Please select an address or choose "New Address"');
      return;
    }
    
    if (isUsingNewAddress && !data.newAddress) {
      alert('Please search and select a new address');
      return;
    }

    setLoading(true);

    try {
      const pricing = calculatePricing();
      
      // Ensure we have clean integer values
      const cleanersValue = selectedService.price_per_hour ? 
        (Array.isArray(selectedCleaners) ? selectedCleaners[0] : selectedCleaners) || 1 : 1;
      const hoursValue = selectedService.price_per_hour ? 
        (Array.isArray(selectedHours) ? selectedHours[0] : selectedHours) || 1 : 1;
      const serviceIdValue = Array.isArray(selectedService.id) ? selectedService.id[0] : selectedService.id;
      
      console.log('Clean values:', { cleanersValue, hoursValue, serviceIdValue });

      const bookingData = {
        customer_id: user.id,
        service_id: parseInt(serviceIdValue.toString()),
        // Address handling
        address_id: isUsingNewAddress ? null : (data.selectedAddressId ? parseInt(data.selectedAddressId.toString()) : null),
        custom_address: isUsingNewAddress ? (data.newAddress || '') : null,
        // Schedule (using the correct field names from schema)
        requested_date: serviceDate,
        requested_time: serviceTime,
        service_date: serviceDate,
        service_time: serviceTime,
        duration_hours: parseInt(hoursValue.toString()),
        // Service details (matching schema field names)
        property_size: selectedService.price_per_hour ? (selectedPropertySize || null) : null,
        size_price: selectedService.price_per_hour && selectedPropertySize ? 
          Math.round(PROPERTY_SIZE_MAP[selectedPropertySize as keyof typeof PROPERTY_SIZE_MAP]?.multiplier || 1) : null,
        cleaners_count: parseInt(cleanersValue.toString()),
        own_materials: selectedService.price_per_hour ? ownMaterials : false,
        // Customer info
        customer_name: data.customerName || '',
        customer_phone: data.customerPhone || '',
        // Notes
        special_instructions: data.additionalNotes || '',
        additional_notes: data.additionalNotes || '',
        // Pricing (matching schema data types - integers)
        base_price: Math.round(pricing.basePrice),
        addons_total: Math.round(pricing.addonsTotal),
        total_price: Math.round(pricing.total),
        total_cost: parseFloat(pricing.total.toFixed(2)), // This is numeric(10,2) in schema
        status: 'pending'
      };

      console.log('Booking data being inserted:', bookingData);
      console.log('User ID:', user.id);
      console.log('Selected Service:', selectedService);
      console.log('Pricing calculation:', pricing);
      console.log('Individual field values:');
      console.log('- service_id:', parseInt(serviceIdValue.toString()));
      console.log('- cleaners_count:', parseInt(cleanersValue.toString()));
      console.log('- duration_hours:', parseInt(hoursValue.toString()));
      console.log('- size_price:', selectedService.price_per_hour && selectedPropertySize ? 
        Math.round(PROPERTY_SIZE_MAP[selectedPropertySize as keyof typeof PROPERTY_SIZE_MAP]?.multiplier || 1) : null);
      console.log('- address_id:', isUsingNewAddress ? null : (data.selectedAddressId ? parseInt(data.selectedAddressId.toString()) : null));
      
      const { error, data: insertData } = await supabase
        .from('bookings')
        .insert(bookingData)
        .select();

      if (error) {
        console.error('Booking insertion error:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        alert(`Failed to create booking: ${error.message}`);
        throw error;
      }
      
      console.log('Booking created successfully:', insertData);
      
      // Insert additional services if any
      if (selectedAddons.length > 0 && insertData && insertData[0]) {
        const bookingId = insertData[0].id;
        
        const addonInserts = selectedAddons.map(addon => ({
          booking_id: parseInt(bookingId.toString()),
          additional_service_id: parseInt(addon.id.toString()),
          quantity: 1,
          unit_price: Math.round(addon.price),
          total_price: Math.round(addon.price)
        }));
        
        console.log('Addon inserts data:', addonInserts);
        
        const { error: addonError } = await supabase
          .from('booking_additional_services')
          .insert(addonInserts);
          
        if (addonError) {
          console.error('Error inserting additional services:', addonError);
        }
      }

      // Show success and redirect
      setCurrentStep(5); // Success step
      setTimeout(() => {
        navigate('/history');
      }, 3000);

    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Error creating booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to toggle addon selection
  const toggleAddon = (addon: any) => {
    setSelectedAddons(prev => {
      const isSelected = prev.some(a => a.id === addon.id);
      if (isSelected) {
        return prev.filter(a => a.id !== addon.id);
      } else {
        return [...prev, addon];
      }
    });
  };

  // Helper to get addon image
  const getAddonImage = (addonId: string) => {
    const imageMap: { [key: string]: string } = {
      '1': '/fridge-cleaning.JPG',           // Fridge Cleaning
      '2': '/oven-cleaning.JPG',             // Oven Cleaning  
      '3': '/balcony-cleaning.JPG',          // Balcony Cleaning
      '4': '/wardrobe-cabinet-cleaning.png', // Wardrobe/Cabinet Cleaning
      '5': '/laundry-service.JPG',           // Ironing Service
      '6': '/carpet-cleaning.JPG',           // Sofa Cleaning  
      '7': '/carpet-cleaning.JPG',           // Carpet Cleaning
      '8': '/carpet-cleaning.JPG',           // Mattress Cleaning Single
      '9': '/carpet-cleaning.JPG',           // Mattress Cleaning Double
      '10': '/window-cleaning.JPG'           // Curtains Cleaning
    };
    return imageMap[addonId] || '/regular-cleaning.jpg'; // Fallback to main service image
  };

  // Helper to get service description
  const getServiceDescription = (serviceId: string) => {
    // Find the service in additionalServices array
    const service = additionalServices.find(s => s.id === serviceId);
    return service?.description || '';
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div>
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-primary mb-2">Select Your Service</h2>
              <p className="text-gray-600">Choose from our professional cleaning services</p>
            </div>
            
            {/* Stage 1: Main Service Categories (4 cards) */}
            {!selectedMainCategory && (
              <div className="grid grid-cols-2 gap-4 mb-6">
                {MAIN_SERVICE_CATEGORIES_NEW.map((category) => (
                  <div
                    key={category.key}
                    className="border-2 border-gray-200 rounded-2xl p-4 cursor-pointer transition-all hover:border-primary hover:bg-primary/5 hover:shadow-lg"
                    onClick={() => {
                      setSelectedMainCategory(category.key);
                      setShowSubServices(true);
                      
                      // For regular and deep cleaning, automatically select the base service (without materials)
                      if (category.key === 'regular') {
                        const regularService = services.find(s => s.id === 6); // Regular Cleaning (without materials)
                        if (regularService) {
                          setSelectedService(regularService);
                        }
                      } else if (category.key === 'deep') {
                        const deepService = services.find(s => s.id === 8); // Deep Cleaning (without materials)
                        if (deepService) {
                          setSelectedService(deepService);
                        }
                      }
                      
                      // Reset other selections
                      setSelectedPropertySize(null);
                      setSelectedCleaners(null);
                      setSelectedHours(null);
                      setRecommendation(null);
                    }}
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-3">{category.icon}</div>
                      <h3 className="font-bold text-lg text-gray-900 mb-1">{category.title}</h3>
                      <p className="text-gray-600 text-sm mb-2">{category.subtitle}</p>
                      <div className="text-primary font-bold text-lg">
                        {category.price}
                      </div>
                      <p className="text-gray-500 text-xs mt-1">{category.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Stage 2: Specific Service Selection within Category */}
            {selectedMainCategory && (
              <div className="animate-fadeIn">
                {/* Back button */}
                <button
                  onClick={() => {
                    setSelectedMainCategory(null);
                    setShowSubServices(false);
                    setSelectedService(null);
                    setSelectedPropertySize(null);
                    setSelectedCleaners(null);
                    setSelectedHours(null);
                    setRecommendation(null);
                  }}
                  className="flex items-center gap-2 text-gray-600 hover:text-primary mb-4 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to categories
                </button>

                {/* Selected category header */}
                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">
                      {MAIN_SERVICE_CATEGORIES_NEW.find(cat => cat.key === selectedMainCategory)?.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">
                        {MAIN_SERVICE_CATEGORIES_NEW.find(cat => cat.key === selectedMainCategory)?.title}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {MAIN_SERVICE_CATEGORIES_NEW.find(cat => cat.key === selectedMainCategory)?.subtitle}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pricing Information Note - For Packages and Specialized Services */}
                {(selectedMainCategory === 'packages' || selectedMainCategory === 'specialized') && (
                  <div className="mb-6">
                    <div className="bg-gradient-to-r from-sky-50 to-emerald-50 border border-sky-200 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="text-sky-500 mt-0.5">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800 text-sm mb-1">💫 Pricing Information</h4>
                          <p className="text-gray-600 text-sm leading-relaxed">
                            The prices shown are starting rates. Your final price may vary based on property size, specific requirements, and additional services. We'll provide a detailed quote before confirming your booking! ✨
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Service options within the selected category */}
                {(selectedMainCategory === 'packages' || selectedMainCategory === 'specialized') && (
                  <div className="space-y-4 mb-6">
                    <h3 className="font-semibold text-gray-800">Choose Specific Service</h3>
                    {services
                      .filter(service => {
                        const category = MAIN_SERVICE_CATEGORIES_NEW.find(cat => cat.key === selectedMainCategory);
                        return category ? category.serviceIds.includes(service.id) : false;
                      })
                      .map((service) => (
                        <div
                          key={service.id}
                          className={`border-2 rounded-2xl p-4 cursor-pointer transition-all ${
                            selectedService?.id === service.id
                              ? 'border-primary bg-primary/5'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => {
                            setSelectedService(service);
                            // Reset dependent selections when service changes
                            setSelectedPropertySize(null);
                            setSelectedCleaners(null);
                            setSelectedHours(null);
                            setRecommendation(null);
                          }}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                              <img
                                src={service.image}
                                alt={service.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg text-gray-900 mb-1">{service.name}</h3>
                              <p className="text-gray-600 text-sm mb-2">{service.description}</p>
                              <div className="flex items-center gap-1 text-primary font-bold">
                                <DirhamIcon size="sm" />
                                <span>{service.base_price}</span>
                                {service.price_per_hour && <span> (Base) + {service.price_per_hour}/hour</span>}
                              </div>
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 ${
                              selectedService?.id === service.id
                                ? 'border-primary bg-primary'
                                : 'border-gray-300'
                            }`}>
                              {selectedService?.id === service.id && (
                                <div className="w-full h-full flex items-center justify-center">
                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                {/* Package Services Special Notice */}
                {selectedMainCategory === 'packages' && selectedService && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <div className="text-amber-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-amber-800 mb-1">Package Service Information</h4>
                        <p className="text-amber-700 text-sm">
                          This is a fixed-price package. Our administrators will form a special team size and determine the optimal duration for your service. Packages are not customizable for cleaners and hours.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Property Size Selection (for all services) */}
                {selectedService && (
                  <div className="space-y-4 mb-6 animate-fadeIn">
                    <h3 className="font-semibold text-gray-800">Property Size</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {PROPERTY_SIZES.map((option) => (
                        <Button
                          key={option.size}
                          variant="selection"
                          shape="soap"
                          size="md"
                          selected={selectedPropertySize === option.size}
                          onClick={() => {
                            setSelectedPropertySize(option.size);
                            // Reset dependent selections for non-package services
                            if (selectedMainCategory !== 'packages') {
                              setSelectedCleaners(null);
                              setSelectedHours(null);
                            }
                            setRecommendation(null);
                          }}
                          className="!p-4 !min-w-0 !w-full !h-auto !text-left"
                        >
                          <div className="font-semibold">{option.label}</div>
                          <div className={`text-sm ${selectedPropertySize === option.size ? 'text-white opacity-80' : 'text-gray-600'}`}>
                            {option.details}
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Materials Selection (for all services) */}
                {selectedService && selectedPropertySize && (
                  <div className="space-y-4 mb-6 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-800">Cleaning Materials</h3>
                      <button
                        type="button"
                        onClick={() => {
                          console.log('Eco button clicked, current state:', showEcoInfo);
                          console.log('Current service and property size:', { selectedService: selectedService?.name, selectedPropertySize });
                          setShowEcoInfo(!showEcoInfo);
                        }}
                        className="flex items-center gap-1 px-3 py-2 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors border border-emerald-300 shadow-sm"
                        title="Eco-Friendly Materials Info"
                      >
                        <img 
                          src="/eco-friendly.svg" 
                          alt="Eco Friendly" 
                          className="w-5 h-5"
                          onLoad={() => console.log('Eco-friendly SVG loaded successfully')}
                          onError={(e) => {
                            console.log('Eco-friendly SVG failed to load');
                            e.currentTarget.style.display = 'none';
                            // Show fallback
                            const fallback = e.currentTarget.parentElement?.querySelector('.eco-fallback');
                            if (fallback) {
                              (fallback as HTMLElement).style.display = 'block';
                            }
                          }}
                        />
                        <span className="eco-fallback text-emerald-700 text-xs font-bold hidden">🌱 ECO</span>
                        <span className="text-emerald-700 text-xs font-medium">ECO</span>
                      </button>
                    </div>
                    
                    {/* Eco-Friendly Materials Info - Expanded */}
                    {showEcoInfo && (
                      <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg animate-fadeIn">
                        <div className="flex items-center gap-2 text-emerald-800 text-sm">
                          <span>Our materials are powered by TCL eco-friendly materials</span>
                          <img 
                            src="/heart-nature.svg" 
                            alt="Nature Heart" 
                            className="w-4 h-4 ml-1"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="selection"
                        shape="droplet"
                        size="md"
                        selected={!ownMaterials}
                        onClick={() => {
                          setOwnMaterials(false);
                          
                          // For regular and deep cleaning, switch to the "with materials" service
                          if (selectedMainCategory === 'regular') {
                            const regularWithMaterials = services.find(s => s.id === 7); // Regular Cleaning (with materials)
                            if (regularWithMaterials) {
                              setSelectedService(regularWithMaterials);
                            }
                          } else if (selectedMainCategory === 'deep') {
                            const deepWithMaterials = services.find(s => s.id === 9); // Deep Cleaning (with materials)
                            if (deepWithMaterials) {
                              setSelectedService(deepWithMaterials);
                            }
                          }
                          
                          // Update recommendation if this is not a package
                          if (selectedMainCategory !== 'packages' && selectedCleaners && selectedHours) {
                            const serviceKey = getServiceKey(selectedService.name);
                            const newRec = getRecommendation(serviceKey, selectedPropertySize, selectedCleaners, selectedHours, true);
                            setRecommendation(newRec);
                          }
                        }}
                        className="!p-4 !min-w-0 !w-full !h-auto !text-left"
                      >
                        <div className="font-semibold">Cleaners Provide</div>
                        <div className={`text-sm ${!ownMaterials ? 'text-white opacity-80' : 'text-gray-600'}`}>
                          Professional supplies included
                        </div>
                      </Button>
                      <Button
                        variant="selection"
                        shape="droplet"
                        size="md"
                        selected={ownMaterials}
                        onClick={() => {
                          setOwnMaterials(true);
                          
                          // For regular and deep cleaning, switch to the "without materials" service
                          if (selectedMainCategory === 'regular') {
                            const regularWithoutMaterials = services.find(s => s.id === 6); // Regular Cleaning (without materials)
                            if (regularWithoutMaterials) {
                              setSelectedService(regularWithoutMaterials);
                            }
                          } else if (selectedMainCategory === 'deep') {
                            const deepWithoutMaterials = services.find(s => s.id === 8); // Deep Cleaning (without materials)
                            if (deepWithoutMaterials) {
                              setSelectedService(deepWithoutMaterials);
                            }
                          }
                          
                          // Update recommendation if this is not a package
                          if (selectedMainCategory !== 'packages' && selectedCleaners && selectedHours) {
                            const serviceKey = getServiceKey(selectedService.name);
                            const newRec = getRecommendation(serviceKey, selectedPropertySize, selectedCleaners, selectedHours, false);
                            setRecommendation(newRec);
                          }
                        }}
                        className="!p-4 !min-w-0 !w-full !h-auto !text-left"
                      >
                        <div className="font-semibold">Use Own Materials</div>
                        <div className={`text-sm ${ownMaterials ? 'text-white opacity-80' : 'text-gray-600'}`}>
                          Lower cost option
                        </div>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Number of Cleaners (only for non-package services) */}
                {selectedService && selectedPropertySize && selectedMainCategory !== 'packages' && selectedService.price_per_hour && (
                  <div className="space-y-4 mb-6 animate-fadeIn">
                    <h3 className="font-semibold text-gray-800">Number of Cleaners</h3>
                    {(() => {
                      const serviceKey = getServiceKey(selectedService.name);
                      const recommendedCleaners = getRecommendation(serviceKey, selectedPropertySize).recommended_cleaners;
                      
                      return (
                        <div className="grid grid-cols-3 gap-2">
                          {[2, 3, 4].map((count) => {
                            const isRecommended = count === recommendedCleaners;
                            return (
                              <Button
                                key={count}
                                variant="selection"
                                shape="bubble"
                                size="sm"
                                selected={selectedCleaners === count}
                                onClick={() => {
                                  setSelectedCleaners(count);
                                  setSelectedHours(null);
                                  // Update recommendation
                                  const serviceKey = getServiceKey(selectedService.name);
                                  const newRec = getRecommendation(serviceKey, selectedPropertySize, count, undefined, !ownMaterials);
                                  setRecommendation(newRec);
                                }}
                                className={`!p-3 !min-w-0 relative ${isRecommended ? '!border-emerald-500' : ''}`}
                              >
                                {isRecommended && (
                                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold whitespace-nowrap">
                                    Best
                                  </div>
                                )}
                                <div className={`${isRecommended ? 'mt-2' : ''} text-center`}>
                                  {count} cleaner{count > 1 ? 's' : ''}
                                </div>
                              </Button>
                            );
                          })}
                        </div>
                      );
                    })()}
                    {recommendation && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-800">
                        💡 {recommendation.efficiency_message}
                      </div>
                    )}
                  </div>
                )}

                {/* Number of Hours (only for non-package services) */}
                {selectedService && selectedPropertySize && selectedCleaners && selectedMainCategory !== 'packages' && selectedService.price_per_hour && (
                  <div className="space-y-4 mb-6 animate-fadeIn">
                    <h3 className="font-semibold text-gray-800">Duration (Hours)</h3>
                    {(() => {
                      const serviceKey = getServiceKey(selectedService.name);
                      const recommendedHours = getRecommendation(serviceKey, selectedPropertySize, selectedCleaners).recommended_hours;
                      const hourOptions = [];
                      for (let i = 2; i <= 7; i += 0.5) {
                        hourOptions.push(i);
                      }
                      
                      return (
                        <div className="grid grid-cols-4 gap-2">
                          {hourOptions.slice(0, 8).map((hours) => {
                            const isRecommended = hours === recommendedHours;
                            return (
                              <Button
                                key={hours}
                                variant="selection"
                                shape="bubble"
                                size="sm"
                                selected={selectedHours === hours}
                                onClick={() => {
                                  setSelectedHours(hours);
                                  // Update recommendation with final selection
                                  const serviceKey = getServiceKey(selectedService.name);
                                  const newRec = getRecommendation(serviceKey, selectedPropertySize, selectedCleaners, hours, !ownMaterials);
                                  setRecommendation(newRec);
                                }}
                                className={`!p-3 !min-w-0 relative ${isRecommended ? '!border-sky-500' : ''}`}
                              >
                                {isRecommended && (
                                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 bg-sky-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold whitespace-nowrap">
                                    Best
                                  </div>
                                )}
                                <div className={`${isRecommended ? 'mt-2' : ''} text-center`}>
                                  {hours}h
                                </div>
                              </Button>
                            );
                          })}
                        </div>
                      );
                    })()}
                    {recommendation && selectedHours && (
                      <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-sm text-sky-800">
                        ⏱️ Estimated completion time with {selectedCleaners} cleaners: {selectedHours} hours
                      </div>
                    )}
                  </div>
                )}

                {/* Fixed Price Service Notice (for packages) */}
                {selectedService && !selectedService.price_per_hour && selectedPropertySize && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center animate-fadeIn">
                    <p className="text-emerald-800 font-medium">
                      Fixed-price package service: <span className="font-bold">{selectedService.base_price} AED</span>
                    </p>
                    <p className="text-emerald-600 text-sm mt-1">
                      {selectedService.description}
                    </p>
                    <p className="text-emerald-600 text-xs mt-2">
                      Our team will handle all details - no customization needed!
                    </p>
                  </div>
                )}

                {/* Final Price Summary (for hourly services) */}
                {recommendation && selectedService?.price_per_hour && selectedPropertySize && selectedCleaners && selectedHours && (
                  <div className="bg-gradient-to-br from-emerald-50 to-sky-50 border-2 border-emerald-200 rounded-2xl p-5 text-center relative overflow-hidden animate-fadeIn">
                    <div className="relative z-10">
                      <div className="text-gray-600 text-sm mb-2">Total Price</div>
                      <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-sky-600 bg-clip-text text-transparent flex items-center justify-center gap-2">
                        <DirhamIcon size="lg" />
                        {recommendation.estimated_cost}
                      </div>
                      <div className="text-sm text-gray-600 mt-2">
                        {selectedCleaners} cleaners × {selectedHours} hours × {ownMaterials ? 
                          (getServiceKey(selectedService.name) === 'regular' ? '35' : '45') : 
                          (getServiceKey(selectedService.name) === 'regular' ? '45' : '55')} AED/hour/cleaner
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div>
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-primary mb-2">Extra Services</h2>
              <p className="text-gray-600">Add optional services to enhance your cleaning</p>
            </div>
            
            <div className="space-y-4">
              {/* New Rectangular Grid Layout */}
              <div className="grid grid-cols-2 gap-3">
                {additionalServices.map((addon) => {
                  const isSelected = selectedAddons.some(selected => selected.id === addon.id);
                  
                  return (
                    <div
                      key={addon.id}
                      className={`border-2 rounded-2xl cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-emerald-100/50' 
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                      onClick={() => toggleAddon(addon)}
                    >
                      {/* Rectangular Image on Top */}
                      <div className="relative">
                        <div className="w-full h-24 rounded-t-2xl overflow-hidden bg-gray-100">
                          <img
                            src={getAddonImage(addon.id)}
                            alt={addon.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.style.display = 'none';
                              if (target.nextElementSibling) {
                                (target.nextElementSibling as HTMLElement).style.display = 'flex';
                              }
                            }}
                          />
                          <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-emerald-200 hidden items-center justify-center">
                            <span className="text-emerald-600 text-2xl font-bold">
                              {addon.name.charAt(0)}
                            </span>
                          </div>
                        </div>
                        
                        {/* Selection Indicator */}
                        <div className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected 
                            ? 'border-emerald-500 bg-emerald-500' 
                            : 'border-white bg-white/80'
                        }`}>
                          {isSelected && (
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                      
                      {/* Text and Price Under Image */}
                      <div className="p-3">
                        <div className="text-center">
                          <h3 className={`font-semibold text-sm mb-2 ${
                            isSelected ? 'text-emerald-900' : 'text-gray-900'
                          }`}>
                            {addon.name}
                          </h3>
                          
                          <p className={`text-xs leading-relaxed mb-3 ${
                            isSelected ? 'text-emerald-700' : 'text-gray-600'
                          }`}>
                            {addon.description}
                          </p>
                          
                          <div className="flex items-center justify-center">
                            <span className="text-base font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                              +{addon.price} AED
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Total Section */}
            {selectedAddons.length > 0 && (
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-5 text-center relative overflow-hidden">
                <div className="shimmer"></div>
                <div className="relative z-10">
                  <div className="text-gray-600 text-sm mb-2">Extra Services Total</div>
                  <div className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    {selectedAddons.reduce((sum, addon) => sum + addon.price, 0)} AED
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div>
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-primary mb-2">Schedule Service</h2>
              <p className="text-gray-600">Choose your preferred date and time</p>
            </div>
            
            <EnhancedDateTimePicker
              selectedDate={serviceDate}
              selectedTime={serviceTime}
              onDateChange={setServiceDate}
              onTimeChange={setServiceTime}
            />
          </div>
        );

      case 4:
        return (
          <div>
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-primary mb-2">Contact Details</h2>
              <p className="text-gray-600">Confirm your information</p>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block font-medium mb-2">
                  Full Name
                  {profile && profile.full_name && (
                    <span className="text-xs text-emerald-600 ml-2">✓ From your profile</span>
                  )}
                </label>
                <input
                  type="text"
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                  placeholder="Enter your full name"
                  {...register('customerName')}
                />
                {errors.customerName && (
                  <p className="text-red-500 text-sm mt-1">{errors.customerName.message}</p>
                )}
              </div>

              <div>
                <label className="block font-medium mb-2">
                  Phone Number
                  {profile && profile.phone_number && (
                    <span className="text-xs text-emerald-600 ml-2">✓ From your profile</span>
                  )}
                </label>
                <input
                  type="tel"
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                  placeholder="Enter your phone number"
                  {...register('customerPhone')}
                />
                {errors.customerPhone && (
                  <p className="text-red-500 text-sm mt-1">{errors.customerPhone.message}</p>
                )}
              </div>

              <div>
                <label className="block font-medium mb-2">Service Address</label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="selection"
                      shape="organic"
                      size="md"
                      selected={!isUsingNewAddress}
                      onClick={() => setIsUsingNewAddress(false)}
                      className="!flex-1 !p-3 !min-w-0"
                    >
                      Saved Address
                    </Button>
                    <Button
                      type="button"
                      variant="selection"
                      shape="organic"
                      size="md"
                      selected={isUsingNewAddress}
                      onClick={() => setIsUsingNewAddress(true)}
                      className="!flex-1 !p-3 !min-w-0"
                    >
                      New Address
                    </Button>
                  </div>

                  {!isUsingNewAddress ? (
                    <select
                      className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                      {...register('selectedAddressId', { valueAsNumber: true })}
                    >
                      <option value="">Select an address</option>
                      {addresses.map((address) => (
                        <option key={address.id} value={address.id}>
                          {address.street}, {address.city} {address.zip_code}
                          {address.is_default && ' (Default)'}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="space-y-4">
                      <UnifiedAddressAutocomplete
                        value={newAddressValue}
                        onChange={(address: string, placeDetails?: any) => {
                          console.log('Unified API - Address changed:', address, placeDetails);
                          setNewAddressValue(address);
                          setNewAddressStreet(address);
                          // Update form field immediately
                          setValue('newAddress', address);
                        }}
                        placeholder="Search for your address..."
                        showMap={true}
                        onError={(error: string) => {
                          console.error('Address search error:', error);
                        }}
                        componentRestrictions={{ country: ['AE'] }}
                        types={['address']}
                      />
                      {/* Hidden input to register newAddress with react-hook-form */}
                      <input
                        type="hidden"
                        {...register('newAddress')}
                        value={newAddressValue}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Always show address input field when New Address is selected */}
              <div>
                <label className="block font-medium text-gray-700 mb-2">Selected Address</label>
                <input
                  type="text"
                  value={newAddressValue}
                  readOnly
                  className="w-full p-3 border-2 border-emerald-200 rounded-lg bg-emerald-50 text-gray-800 focus:outline-none"
                  placeholder="Address will appear here when selected from search above"
                />
              </div>

              {/* Display selected address confirmation */}
              {newAddressValue && (
                <div className="p-3 bg-gradient-to-r from-emerald-50 to-sky-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-emerald-600 text-sm font-medium">Address confirmed for your cleaning service</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-medium mb-2">Additional Notes (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Any special instructions or notes..."
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none resize-none"
                  {...register('additionalNotes')}
                />
              </div>
            </form>

            {/* Payment Section */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">💳 Payment Method</h3>
              <div className="space-y-3">
                {/* Apple Pay */}
                <div
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedPaymentMethod === 'apple_pay'
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPaymentMethod('apple_pay')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-white border">
                        <img 
                          src="/apple-pay-og.jpg" 
                          alt="Apple Pay" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span className="font-medium">Apple Pay</span>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 ${
                      selectedPaymentMethod === 'apple_pay'
                        ? 'border-primary bg-primary'
                        : 'border-gray-300'
                    }`}>
                      {selectedPaymentMethod === 'apple_pay' && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tabby */}
                <div
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedPaymentMethod === 'tabby'
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPaymentMethod('tabby')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-white border">
                        <img 
                          src="/tabby-logo-1.png" 
                          alt="Tabby" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <span className="font-medium">Tabby</span>
                        <p className="text-sm text-gray-600">Pay in 4 installments</p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 ${
                      selectedPaymentMethod === 'tabby'
                        ? 'border-primary bg-primary'
                        : 'border-gray-300'
                    }`}>
                      {selectedPaymentMethod === 'tabby' && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cash on Delivery */}
                <div
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedPaymentMethod === 'cash'
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPaymentMethod('cash')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-xs font-bold">💵</span>
                      </div>
                      <div>
                        <span className="font-medium">Cash on Delivery</span>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <span>+</span>
                          <DirhamIcon size="sm" />
                          <span>5 fee</span>
                        </div>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 ${
                      selectedPaymentMethod === 'cash'
                        ? 'border-primary bg-primary'
                        : 'border-gray-300'
                    }`}>
                      {selectedPaymentMethod === 'cash' && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Saved Cards */}
                {savedCards.length > 0 && (
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-md font-semibold text-gray-800 mb-3">💳 My Cards</h4>
                  </div>
                )}
                {savedCards.map((card) => (
                  <div
                    key={card.id}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      selectedPaymentMethod === `card_${card.id}`
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedPaymentMethod(`card_${card.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center border">
                          <span className="text-gray-600 text-xs font-bold">
                            {card.card_type === 'visa' ? '💳' : 
                             card.card_type === 'mastercard' ? '💳' : 
                             card.card_type === 'amex' ? '💳' : '💳'}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">
                            •••••••••••• {card.card_number_last4}
                            {card.is_default && ' (Default)'}
                          </span>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 ${
                        selectedPaymentMethod === `card_${card.id}`
                          ? 'border-primary bg-primary'
                          : 'border-gray-300'
                      }`}>
                        {selectedPaymentMethod === `card_${card.id}` && (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add New Card */}
                <div
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedPaymentMethod === 'new_card'
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    setSelectedPaymentMethod('new_card');
                    setShowAddCardForm(true);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-xs font-bold">💳</span>
                      </div>
                      <span className="font-medium">Add New Card</span>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 ${
                      selectedPaymentMethod === 'new_card'
                        ? 'border-primary bg-primary'
                        : 'border-gray-300'
                    }`}>
                      {selectedPaymentMethod === 'new_card' && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <div className="text-white text-2xl font-bold">✓</div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
            <p className="text-gray-600 mb-4">Your cleaning service has been scheduled. We'll call you shortly to confirm.</p>
            <p className="text-sm text-gray-500">Redirecting to booking history...</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <style>
        {`
          .animate-fadeIn {
            animation: fadeIn 0.5s ease-in-out;
          }
          
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .shimmer {
            position: absolute;
            top: -50%;
            right: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%);
            animation: shimmer 4s infinite;
          }
          
          @keyframes shimmer {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white px-5 py-4 border-b border-gray-100 flex items-center gap-4 sticky top-0 z-50">
        <Button
          variant="nav-back"
          shape="bubble"
          size="sm"
          onClick={() => navigate('/home')}
          className="!min-w-[44px] !w-11 !h-11 !p-0"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold text-gray-900">Make Booking</h1>
      </header>

      <div className="max-w-2xl mx-auto p-4 pb-32">
        {/* Step Indicator */}
        {currentStep <= 4 && (
          <StepIndicator currentStep={currentStep} totalSteps={4} />
        )}

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-4">
          <div className="p-6">
            {renderStepContent()}
          </div>
        </div>



        {/* Navigation Buttons */}
        {currentStep <= 4 && (
          <div className={`flex items-center mt-6 ${currentStep === 3 ? 'justify-between px-4' : 'justify-between'}`}>
            {currentStep > 1 ? (
              <Button
                variant="nav-back"
                shape="organic"
                size="md"
                onClick={prevStep}
                className="!w-auto !px-6"
                leftIcon={<ArrowLeftIcon className="w-5 h-5" />}
              >
                Back
              </Button>
            ) : (
              <div></div>
            )}

            <Button
              variant="primary"
              shape="organic"
              size="md"
              onClick={currentStep === 4 ? handleSubmit(onSubmit) : nextStep}
              disabled={
                loading ||
                (currentStep === 1 && (!selectedMainCategory || 
                  // For packages and specialized, need specific service selection
                  ((selectedMainCategory === 'packages' || selectedMainCategory === 'specialized') && !selectedService) ||
                  // For packages, only need property size
                  (selectedMainCategory === 'packages' && selectedService && !selectedPropertySize) ||
                  // For regular/deep/specialized hourly services, need full configuration
                  ((selectedMainCategory === 'regular' || selectedMainCategory === 'deep' || 
                    (selectedMainCategory === 'specialized' && selectedService?.price_per_hour)) && 
                   (!selectedPropertySize || !selectedCleaners || !selectedHours))
                )) ||
                (currentStep === 3 && (!serviceDate || !serviceTime))
              }
              className="!w-auto !px-6"
            >
              {loading ? 'Processing...' : currentStep === 4 ? 'Book Now' : 'Next'}
            </Button>
          </div>
        )}
      </div>

      {/* Floating Cart - Display Only */}
      {currentStep <= 4 && selectedService && (
        // For packages, only need property size
        (selectedMainCategory === 'packages' && selectedPropertySize) ||
        // For regular/deep cleaning, need property size, cleaners, and hours  
        ((selectedMainCategory === 'regular' || selectedMainCategory === 'deep') && selectedPropertySize && selectedCleaners && selectedHours) ||
        // For specialized services with hourly pricing, need full configuration
        (selectedMainCategory === 'specialized' && selectedService.price_per_hour && selectedPropertySize && selectedCleaners && selectedHours) ||
        // For specialized services with fixed pricing, only need property size
        (selectedMainCategory === 'specialized' && !selectedService.price_per_hour && selectedPropertySize)
      ) && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
          <div className="max-w-2xl mx-auto p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="text-primary">
                    <DirhamIcon size="lg" color="inherit" />
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{calculatePricing().total}</span>
                </div>
                <div className="text-sm text-gray-600">
                  {selectedMainCategory === 'packages' ? (
                    <>
                                             {selectedPropertySize ? selectedPropertySize.charAt(0).toUpperCase() + selectedPropertySize.slice(1) : 'Unknown'} • Package Service • {ownMaterials ? 'Own materials' : 'Materials provided'}
                      {selectedAddons.length > 0 && ` • +${selectedAddons.length} extra${selectedAddons.length > 1 ? 's' : ''}`}
                    </>
                  ) : selectedService.price_per_hour && selectedPropertySize && selectedCleaners && selectedHours ? (
                    <>
                      {selectedPropertySize.charAt(0).toUpperCase() + selectedPropertySize.slice(1)} • {selectedCleaners} cleaner{selectedCleaners > 1 ? 's' : ''} • {selectedHours}h • {ownMaterials ? 'Own materials' : 'Materials provided'}
                      {selectedAddons.length > 0 && ` • +${selectedAddons.length} extra${selectedAddons.length > 1 ? 's' : ''}`}
                    </>
                  ) : (
                    <>
                      {selectedService.name} • Fixed Price Service
                      {selectedAddons.length > 0 && ` • +${selectedAddons.length} extra${selectedAddons.length > 1 ? 's' : ''}`}
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 mt-2">
              {selectedMainCategory === 'packages' ? (
                `Package Service • Our team handles all details`
              ) : selectedService.price_per_hour && selectedCleaners && selectedHours ? (
                `${selectedCleaners} professional cleaner${selectedCleaners > 1 ? 's' : ''} • ${selectedHours} hours`
              ) : (
                `${selectedService.name} • Professional Service`
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Card Modal during booking */}
      {showAddCardForm && (
        <AddCardForm
          showAsModal={true}
          onSuccess={() => {
            setShowAddCardForm(false);
            fetchSavedCards(); // Refresh saved cards list
            // Card was added, user can continue with booking
          }}
          onCancel={() => {
            setShowAddCardForm(false);
            setSelectedPaymentMethod(''); // Reset payment method selection
          }}
        />
      )}
    </div>
    </>
  );
};

export default BookingPage; 