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
import LoadingScreen from '../components/ui/LoadingScreen';
import PlacesAutocomplete from '../components/ui/PlacesAutocomplete';
import Lottie from 'lottie-react';
import bookingSuccessAnimation from '../assets/animations/booking-success.json';
import { 
  Address, 
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
import { useSimpleTranslation } from '../utils/i18n';
import { scrollToTop } from '../utils/scrollToTop';
import SEO from '../components/seo/SEO';

// Form validation schema for step 5 (was step 4)
const contactSchema = z.object({
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  customerPhone: z.string().min(10, 'Please enter a valid phone number'),
  selectedAddressId: z.number().optional(),
  newAddress: z.string().optional(),
  newAddressFloor: z.string().optional(),
  newAddressApartment: z.string().optional(),
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
const getMainServiceCategories = (t: any) => [
  {
    key: 'regular',
    icon: '🏠',
    title: t('booking.services.regular', 'Regular Cleaning'),
    subtitle: t('booking.services.regularDesc', 'Perfect for weekly maintenance'),
    price: t('booking.from', 'From') + ' 70 ' + t('booking.aed', 'AED'),
    description: t('booking.services.regularDesc', 'Standard home cleaning service'),
    serviceIds: [6, 7] // Regular Cleaning (without/with materials)
  },
  {
    key: 'deep',
    icon: '✨',
    title: t('booking.services.deep', 'Deep Cleaning'),
    subtitle: t('booking.services.deepDesc', 'Thorough cleaning service'),
    price: t('booking.from', 'From') + ' 90 ' + t('booking.aed', 'AED'),
    description: t('booking.services.deepDesc', 'Complete deep cleaning'),
    serviceIds: [8, 9] // Deep Cleaning (without/with materials)
  },
  {
    key: 'packages',
    icon: '📦',
    title: t('booking.services.packages', 'Complete Packages'),
    subtitle: t('booking.services.packagesDesc', 'All-inclusive cleaning solutions'),
    price: t('booking.from', 'From') + ' 299 ' + t('booking.aed', 'AED'),
    description: t('common.fixedPriceComprehensive', 'Fixed-price comprehensive services'),
    serviceIds: [10, 11, 12, 13, 14, 15, 16] // Full Villa Deep Cleaning, Full Apartment Deep Cleaning, Villa Façade Cleaning, Move in/Move out Cleaning, Post-construction Cleaning, Kitchen Deep Cleaning, Bathroom Deep Cleaning
  },
  {
    key: 'specialized',
    icon: '🪟',
    title: t('booking.services.specialized', 'Specialized Services'),
    subtitle: t('booking.services.specializedDesc', 'Professional specialized cleaning'),
    price: t('booking.from', 'From') + ' 20 ' + t('booking.aed', 'AED'),
    description: t('common.perUnitSpecialized', 'Per-unit specialized services'),
    serviceIds: [17, 18, 19] // Internal Window Cleaning, External Window Cleaning, Full Villa Window Package
  }
];

const BookingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useSimpleTranslation();
  
  // State management
  const [currentStep, setCurrentStep] = useState(1);
  
  // State for two-staged selection
  const [selectedMainCategory, setSelectedMainCategory] = useState<string | null>(null);
  const [showSubServices, setShowSubServices] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
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
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cash');
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

  // Handle URL parameters for pre-selected service and order again data
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
        // Stay on step 1 but with category pre-selected
      }
    }

    // Handle order again data from localStorage
    const orderAgainData = localStorage.getItem('orderAgainData');
    if (orderAgainData) {
      try {
        const data = JSON.parse(orderAgainData);
        
        // Pre-fill the form with order again data
        if (data.propertySize) {
          setSelectedPropertySize(data.propertySize);
        }
        if (data.cleanersCount) {
          setSelectedCleaners(data.cleanersCount);
        }
        if (data.ownMaterials !== undefined) {
          setOwnMaterials(data.ownMaterials);
        }
        if (data.selectedAddons && data.selectedAddons.length > 0) {
          setSelectedAddons(data.selectedAddons);
        }
        
        // Set the main category and service for order again
        if (data.mainCategory) {
          setSelectedMainCategory(data.mainCategory);
        }
        
        // Navigate to step 3 (scheduling) if specified
        if (data.step === 3) {
          setCurrentStep(3);
          // Scroll to top when changing steps
          scrollToTop();
        }
        
        // Store the order again data temporarily for service selection
        // Don't clear localStorage yet - it will be cleared after service selection
        if (data.serviceId) {
          // Keep the data for the service selection useEffect
        } else {
          // Clear the localStorage data if no service ID
          localStorage.removeItem('orderAgainData');
        }
      } catch (error) {
        console.error('Error parsing order again data:', error);
        localStorage.removeItem('orderAgainData');
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
      const loadInitialData = async () => {
        try {
          await Promise.all([
            fetchUserData(),
            fetchAddresses(),
            fetchSavedCards(),
            fetchServices()
          ]);
        } catch (error) {
          console.error('Error loading booking page data:', error);
        } finally {
          if (initialLoading) {
            setInitialLoading(false);
          }
        }
      };
      
      loadInitialData();
    }
  }, [user]);

  // Handle service selection when both category and services are available
  useEffect(() => {
    if (selectedMainCategory && services.length > 0 && !selectedService) {
      // Check if we have order again data with a specific service ID first
      const orderAgainData = localStorage.getItem('orderAgainData');
      if (orderAgainData) {
        try {
          const data = JSON.parse(orderAgainData);
          if (data.serviceId) {
            // If we have a specific service ID from order again, use that instead
            const targetService = services.find(s => s.id === data.serviceId);
            if (targetService) {
              setSelectedService(targetService);
              // Clear the localStorage data after successful service selection
              localStorage.removeItem('orderAgainData');
              return; // Exit early, don't auto-select generic service
            }
          }
        } catch (error) {
          console.error('Error parsing order again data:', error);
          localStorage.removeItem('orderAgainData');
        }
      }
      
      // If no specific service from order again, auto-select based on category
      let targetService = null;
      if (selectedMainCategory === 'regular') {
        targetService = services.find(s => s.id === 6); // Regular Cleaning (without materials)
      } else if (selectedMainCategory === 'deep') {
        targetService = services.find(s => s.id === 8); // Deep Cleaning (without materials)  
      } else {
        // For packages and specialized, find the first service in the category
        const category = getMainServiceCategories(t).find(cat => cat.key === selectedMainCategory);
        if (category) {
          targetService = services.find(s => category.serviceIds.includes(s.id));
        }
      }
      
      if (targetService) {
        setSelectedService(targetService);
      }
    }
  }, [selectedMainCategory, services, selectedService, t]);



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

  // Force re-render when payment method changes to update floating cart
  useEffect(() => {
    // This effect triggers re-render when selectedPaymentMethod changes
    // This ensures the floating cart updates with VAT and cash fees
  }, [selectedPaymentMethod]);

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
        .select('id, name, description, base_price, price_per_hour, is_active, image_url')
        .eq('is_active', true)
        .order('id');

      if (servicesError) throw servicesError;
      
      // Add UI-specific fields to services
      const servicesWithUI = servicesData?.map(service => ({
        ...service,
        image: service.image_url || '/regular-cleaning.jpg', // Use database image_url
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

      // Service selection is now handled by the dedicated useEffect above
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  // Helper function for service image (now using database image_url)
  const getServiceImageByName = (serviceName: string): string => {
    // This function is kept for backward compatibility but should use database image_url
    // For new implementations, use service.image_url directly
    return '/regular-cleaning.jpg'; // Fallback
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
    // Scroll to top when changing steps
    scrollToTop();
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
    // Scroll to top when changing steps
    scrollToTop();
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

  // Calculate final price with VAT and cash fees
  const calculateFinalPrice = (): number => {
    const baseTotal = calculatePricing().total;
    const vat = Math.round(baseTotal * 0.05);
    const cashFee = selectedPaymentMethod === 'cash' ? 5 : 0;
    return baseTotal + vat + cashFee;
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

      // Calculate final price with VAT and cash fees (matching what's shown in UI)
      const baseTotal = pricing.total;
      const vat = Math.round(baseTotal * 0.05);
      const cashFee = selectedPaymentMethod === 'cash' ? 5 : 0;
      const finalTotal = baseTotal + vat + cashFee;
      
      console.log('Price breakdown:', {
        baseTotal,
        vat,
        cashFee,
        finalTotal,
        selectedPaymentMethod
      });

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
        vat_amount: vat, // Store VAT amount separately
        cash_fee: cashFee, // Store cash fee separately
        total_cost: parseFloat(finalTotal.toFixed(2)), // Store final price with VAT and fees
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
      
      // Send notification to admin about new order
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_BASE_URL}/api/push/new-order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId: insertData[0].id,
            orderDetails: {
              customer_name: data.customerName,
              service_date: serviceDate,
              service_time: serviceTime,
              total_price: finalTotal, // Use final price with VAT and fees
              property_size: selectedPropertySize,
              cleaners_count: selectedCleaners
            }
          })
        });

        if (response.ok) {
          console.log('Admin notification sent successfully');
        } else {
          console.log('Failed to send admin notification');
        }
      } catch (error) {
        console.error('Error sending admin notification:', error);
        // Don't fail the booking if notification fails
      }
      
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
      // Scroll to top when changing steps
      scrollToTop();
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
      '6': '/sofa-cleaning.png',             // Sofa Cleaning - NEW IMAGE
      '7': '/carpet-cleaning.JPG',           // Carpet Cleaning
      '8': '/matress-cleaning.png',          // Mattress Cleaning Single - NEW IMAGE
      '9': '/matress-cleaning.png',          // Mattress Cleaning Double - NEW IMAGE
      '10': '/curtains-cleaning.JPG'         // Curtains Cleaning - NEW IMAGE
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
              <h2 className="text-xl font-bold text-primary mb-2">{t('common.selectYourService', 'Select Your Service')}</h2>
              <p className="text-gray-600">{t('common.chooseFromProfessional', 'Choose from our professional cleaning services')}</p>
            </div>
            
            {/* Stage 1: Main Service Categories (4 cards) */}
            {!selectedMainCategory && (
              <div className="grid grid-cols-2 gap-4 mb-6">
                {getMainServiceCategories(t).map((category) => (
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
                      
                      // Scroll to top when changing selections
                      scrollToTop();
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
                      {getMainServiceCategories(t).find(cat => cat.key === selectedMainCategory)?.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">
                        {getMainServiceCategories(t).find(cat => cat.key === selectedMainCategory)?.title}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {getMainServiceCategories(t).find(cat => cat.key === selectedMainCategory)?.subtitle}
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
                        const category = getMainServiceCategories(t).find(cat => cat.key === selectedMainCategory);
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
                        <span className="text-emerald-700 text-xs font-medium">ECO</span>
                      </button>
                    </div>
                    
                    {/* Eco-Friendly Materials Info - Expanded */}
                    {showEcoInfo && (
                      <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg animate-fadeIn">
                        <div className="flex items-center gap-2 text-emerald-800 text-sm">
                          <span>Our materials are powered by TCL eco-friendly materials</span>
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
                        <div className="grid grid-cols-4 gap-2">
                          {[1, 2, 3, 4].map((count) => {
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
                    {/* Custom message for 1 cleaner */}
                    {selectedCleaners === 1 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800">
                        🧹 Single cleaner option - perfect for small spaces and focused cleaning
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
                      const hourOptions = [2, 3, 4, 5]; // Only integer hours
                      
                      return (
                        <div className="grid grid-cols-4 gap-2">
                          {hourOptions.map((hours) => {
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
              <h2 className="text-xl font-bold text-primary mb-2">{t('booking.steps.extraServices', 'Extra Services')}</h2>
              <p className="text-gray-600">{t('booking.steps.extraServicesDesc', 'Add optional services to enhance your cleaning')}</p>
            </div>
            
            <div className="space-y-4">
              {/* Horizontal Carousel Layout */}
              <div className="relative">
                <div className="overflow-x-auto scrollbar-hide">
                  <div className="flex gap-4 pb-4"  >
                    {additionalServices.map((addon) => {
                      const isSelected = selectedAddons.some(selected => selected.id === addon.id);
                      
                      return (
                        <div
                          key={addon.id}
                          className={`flex-shrink-0 w-64 border-2 rounded-2xl cursor-pointer transition-all ${
                            isSelected 
                              ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-emerald-100/50' 
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                          onClick={() => toggleAddon(addon)}
                        >
                          {/* Horizontal Rectangular Image on Top */}
                          <div className="relative">
                            <div className="w-full h-32 rounded-t-2xl overflow-hidden bg-gray-100">
                              <img
                                src={getAddonImage(addon.id)}
                                alt={addon.name}
                                className="w-full h-full object-cover"
                                style={{ aspectRatio: '2/1' }}
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  target.style.display = 'none';
                                  if (target.nextElementSibling) {
                                    (target.nextElementSibling as HTMLElement).style.display = 'flex';
                                  }
                                }}
                              />
                              <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-emerald-200 hidden items-center justify-center">
                                <span className="text-emerald-600 text-3xl font-bold">
                                  {addon.name.charAt(0)}
                                </span>
                              </div>
                            </div>
                            
                            {/* Selection Indicator */}
                            <div className={`absolute top-3 right-3 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                              isSelected 
                                ? 'border-emerald-500 bg-emerald-500' 
                                : 'border-white bg-white/90'
                            }`}>
                              {isSelected && (
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </div>
                          
                          {/* Text and Price Under Image */}
                          <div className="p-4">
                            <div className="text-center">
                              <h3 className={`font-semibold text-base mb-2 ${
                                isSelected ? 'text-emerald-900' : 'text-gray-900'
                              }`}>
                                {addon.name}
                              </h3>
                              
                              <p className={`text-sm leading-relaxed mb-4 ${
                                isSelected ? 'text-emerald-700' : 'text-gray-600'
                              }`}>
                                {addon.description}
                              </p>
                              
                              <div className="flex items-center justify-center">
                                <span className="text-lg font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200">
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
                
                {/* Scroll indicators */}
                <div className="flex justify-center mt-2">
                  <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {t('booking.additionalServices.scrollHint', '← Scroll to see all services →')}
                  </div>
                </div>
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
                  {address.street}, {address.city}
                  {address.is_default && ' (Default)'}
                </option>
                      ))}
                    </select>
                  ) : (
                    <div className="space-y-4">
                      <PlacesAutocomplete
                        value={newAddressValue}
                        onChange={(address: string, placeDetails?: any) => {
                          console.log('Places API - Address changed:', address, placeDetails);
                          
                          // Extract building/place name from placeDetails if available, otherwise use the search term
                          let buildingName = address;
                          
                          if (placeDetails && placeDetails.displayName) {
                            buildingName = placeDetails.displayName;
                          } else if (placeDetails && placeDetails.name) {
                            buildingName = placeDetails.name;
                          }
                          
                          setNewAddressValue(buildingName);
                          setNewAddressStreet(buildingName);
                          setValue('newAddress', buildingName);
                        }}
                        placeholder="Search for building name (e.g., Westwood Grande 2 by Imtiaz)..."
                        showMap={true}
                        mapHeight={200}
                        onError={(error: string) => {
                          console.error('Places API error:', error);
                        }}
                        includedRegionCodes={['ae']}
                      />
                      
                      {/* Selected Building Name Display */}
                      {newAddressValue && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Selected Building</label>
                          <div className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-blue-50 text-gray-900 font-medium border-blue-200">
                            {newAddressValue}
                          </div>
                          <p className="text-xs text-blue-600 mt-1">This building name will be used for your service</p>
                        </div>
                      )}

                      {/* Floor and Apartment Number Fields */}
                      {newAddressValue && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Floor (Optional)</label>
                            <input
                              type="text"
                              {...register('newAddressFloor')}
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                              placeholder="e.g., 5th, Ground, etc."
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Apartment (Optional)</label>
                            <input
                              type="text"
                              {...register('newAddressApartment')}
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                              placeholder="e.g., 501, A12, etc."
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>



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

            {/* Order Review Section */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Order Review</h3>
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Service Type:</span>
                  <span className="font-semibold text-gray-900">
                    {selectedService?.name || 'Service'}
                  </span>
                </div>
                
                {selectedPropertySize && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Property Size:</span>
                    <span className="font-semibold text-gray-900">
                      {selectedPropertySize.charAt(0).toUpperCase() + selectedPropertySize.slice(1)}
                    </span>
                  </div>
                )}
                
                {selectedCleaners && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Number of Cleaners:</span>
                    <span className="font-semibold text-gray-900">
                      {selectedCleaners} cleaner{selectedCleaners > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
                
                {selectedHours && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-semibold text-gray-900">
                      {selectedHours} hour{selectedHours > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Materials:</span>
                  <span className="font-semibold text-gray-900">
                    {ownMaterials ? 'Customer provided' : 'Cleaner provided'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Date & Time:</span>
                  <span className="font-semibold text-gray-900">
                    {serviceDate && serviceTime ? `${new Date(serviceDate).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })} at ${serviceTime}` : 'Not selected'}
                  </span>
                </div>
                
                {selectedAddons.length > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Extra Services:</span>
                    <span className="font-semibold text-gray-900">
                      {selectedAddons.map(addon => addon.name).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Summary Section */}
            <div className="mt-6 bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">💰 Payment Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Service Price:</span>
                  <span className="font-semibold text-gray-900">
                    <DirhamIcon size="sm" />
                    {calculatePricing().basePrice}
                  </span>
                </div>
                
                {selectedAddons.length > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Extra Services:</span>
                    <span className="font-semibold text-gray-900">
                      <DirhamIcon size="sm" />
                      {calculatePricing().addonsTotal}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">VAT (5%):</span>
                  <span className="font-semibold text-gray-900">
                    <DirhamIcon size="sm" />
                    {Math.round(calculatePricing().total * 0.05)}
                  </span>
                </div>
                
                {selectedPaymentMethod === 'cash' && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Cash Payment Fee:</span>
                    <span className="font-semibold text-gray-900">
                      <DirhamIcon size="sm" />
                      5
                    </span>
                  </div>
                )}
                
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Total:</span>
                                      <span className="text-xl font-bold text-primary">
                    <DirhamIcon size="sm" />
                    {calculateFinalPrice()}
                  </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Section */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">💳 Payment Method</h3>
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 <strong>Note:</strong> Currently only cash payment is available. Apple Pay, Tabby, and credit card payments are coming soon!
                </p>
              </div>
              <div className="space-y-3">
                {/* Apple Pay - Disabled */}
                <div
                  className="border-2 rounded-lg p-4 cursor-not-allowed transition-all border-gray-200 bg-gray-50 opacity-60"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-white border">
                        <img 
                          src="/apple-pay-og.jpg" 
                          alt="Apple Pay" 
                          className="w-full h-full object-contain grayscale"
                        />
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">Apple Pay</span>
                        <p className="text-sm text-gray-400">Coming Soon</p>
                      </div>
                    </div>
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 bg-gray-200">
                    </div>
                  </div>
                </div>

                {/* Tabby - Disabled */}
                <div
                  className="border-2 rounded-lg p-4 cursor-not-allowed transition-all border-gray-200 bg-gray-50 opacity-60"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-white border">
                        <img 
                          src="/tabby-logo-1.png" 
                          alt="Tabby" 
                          className="w-full h-full object-contain grayscale"
                        />
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">Tabby</span>
                        <p className="text-sm text-gray-400">Coming Soon</p>
                      </div>
                    </div>
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 bg-gray-200">
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

                {/* Saved Cards - Disabled */}
                {savedCards.length > 0 && (
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-md font-semibold text-gray-400 mb-3">💳 My Cards (Coming Soon)</h4>
                  </div>
                )}
                {savedCards.map((card) => (
                  <div
                    key={card.id}
                    className="border-2 rounded-lg p-4 cursor-not-allowed transition-all border-gray-200 bg-gray-50 opacity-60"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center border">
                          <span className="text-gray-400 text-xs font-bold">💳</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-500">
                            •••••••••••• {card.card_number_last4}
                            {card.is_default && ' (Default)'}
                          </span>
                          <p className="text-sm text-gray-400">Coming Soon</p>
                        </div>
                      </div>
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300 bg-gray-200">
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add New Card - Disabled */}
                <div
                  className="border-2 rounded-lg p-4 cursor-not-allowed transition-all border-gray-200 bg-gray-50 opacity-60"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-400 rounded-lg flex items-center justify-center">
                        <span className="text-gray-600 text-xs font-bold">💳</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">Add New Card</span>
                        <p className="text-sm text-gray-400">Coming Soon</p>
                      </div>
                    </div>
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 bg-gray-200">
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
            {/* Shining particles background effect */}
            <div className="absolute inset-0 overflow-hidden">
              {/* Multiple shining particles */}
              <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-gradient-to-r from-blue-200 to-transparent rounded-full animate-pulse opacity-60"></div>
              <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-gradient-to-r from-emerald-200 to-transparent rounded-full animate-pulse opacity-40"></div>
              <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-gradient-to-r from-purple-200 to-transparent rounded-full animate-pulse opacity-50"></div>
              <div className="absolute top-2/3 right-1/4 w-2 h-2 bg-gradient-to-r from-blue-200 to-transparent rounded-full animate-pulse opacity-70"></div>
              <div className="absolute top-3/4 left-1/3 w-1 h-1 bg-gradient-to-r from-emerald-200 to-transparent rounded-full animate-pulse opacity-30"></div>
              <div className="absolute top-1/6 right-1/2 w-2 h-2 bg-gradient-to-r from-purple-200 to-transparent rounded-full animate-pulse opacity-60"></div>
              <div className="absolute top-2/3 left-1/6 w-1 h-1 bg-gradient-to-r from-blue-200 to-transparent rounded-full animate-pulse opacity-50"></div>
              <div className="absolute top-1/4 right-1/6 w-3 h-3 bg-gradient-to-r from-emerald-200 to-transparent rounded-full animate-pulse opacity-40"></div>
            </div>
            
            {/* Success Lottie Animation */}
            <div className="text-center relative z-10">
              <div className="mb-6">
                <Lottie
                  animationData={bookingSuccessAnimation}
                  loop={false}
                  autoplay={true}
                  style={{ width: 160, height: 160 }}
                  className="mx-auto"
                />
              </div>
              
              {/* Thank you message */}
              <div className="text-center">
                <p className="text-black font-medium text-lg">Thank you for choosing SparklePro!</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const bookingPageSEO = {
    title: "Book Cleaning Service",
    description: "Book your professional cleaning service online. Choose your service type, select date and time, and get instant confirmation. Easy online booking in UAE.",
    keywords: "book cleaning service UAE, online cleaning booking Dubai, schedule cleaning Abu Dhabi",
    type: "website" as const,
    noIndex: true // Booking pages typically shouldn't be indexed
  };

  return (
    <>
      <SEO {...bookingPageSEO} />
      
      {/* Loading Screen */}
      <LoadingScreen 
        isLoading={initialLoading} 
        onLoadingComplete={() => {}}
        minDuration={800}
        smartLoading={true}
      />
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

      <div className="max-w-2xl mx-auto p-4 pb-40">
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
          <div className={`flex items-center mt-6 mb-8 ${currentStep === 3 ? 'justify-between px-4' : 'justify-between'}`}>
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
                (currentStep === 3 && (!serviceDate || !serviceTime)) ||
                // Allow navigation from step 3 to step 4 if we have order again data with service
                (currentStep === 3 && !selectedService && !localStorage.getItem('orderAgainData'))
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
        (selectedMainCategory === 'specialized' && !selectedService.price_per_hour && selectedPropertySize) ||
        // For order again data, show cart if we have the service and basic data
        (localStorage.getItem('orderAgainData') && selectedService)
      ) && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
          <div className="max-w-2xl mx-auto p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="text-primary">
                    <DirhamIcon size="lg" color="inherit" />
                  </div>
                  <span className="text-2xl font-bold text-gray-900">
                    {calculateFinalPrice()}
                  </span>
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
                  ) : localStorage.getItem('orderAgainData') ? (
                    <>
                      {selectedService.name} • Order Again
                      {selectedAddons.length > 0 && ` • +${selectedAddons.length} extra${selectedAddons.length > 1 ? 's' : ''}`}
                    </>
                  ) : (
                    <>
                      {selectedService.name} • Fixed Price Service
                      {selectedAddons.length > 0 && ` • +${selectedAddons.length} extra${selectedAddons.length > 1 ? 's' : ''}`}
                    </>
                  )}
                </div>
                {/* Show VAT and fees info */}
                <div className="text-xs text-gray-500 mt-1">
                  <span>+5% VAT</span>
                  {selectedPaymentMethod === 'cash' && <span className="ml-2">+5 AED cash fee</span>}
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 mt-2">
              {selectedMainCategory === 'packages' ? (
                `Package Service • Our team handles all details`
              ) : selectedService.price_per_hour && selectedCleaners && selectedHours ? (
                `${selectedCleaners} professional cleaner${selectedCleaners > 1 ? 's' : ''} • ${selectedHours} hours`
              ) : localStorage.getItem('orderAgainData') ? (
                `${selectedService.name} • Reordering previous service`
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
