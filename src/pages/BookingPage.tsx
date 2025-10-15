import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/OptimizedAuthContext';
import { supabase } from '../lib/supabase';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import DirhamIcon from '../components/ui/DirhamIcon';
import Button from '../components/ui/Button';
import StepIndicator from '../components/ui/StepIndicator';
import EnhancedDateTimePicker from '../components/booking/EnhancedDateTimePicker';
import AddCardForm from '../components/ui/AddCardForm';
import LoadingScreen from '../components/ui/LoadingScreen';
import AddressAutocomplete from '../components/ui/AddressAutocomplete';
import PhoneNumberInput from '../components/ui/PhoneNumberInput';
import GuestSignupModal from '../components/ui/GuestSignupModal';
import ServiceInclusionsModal from '../components/booking/ServiceInclusionsModal';
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

// Form validation schema for step 4 (contact details)
const contactSchema = z.object({
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  customerPhone: z.string()
    .min(10, 'Please enter a valid phone number')
    .regex(/^\+\d{1,4}\d{6,14}$/, 'Please enter a valid phone number with country code'),
  selectedAddressId: z.number().min(1, 'Please select an address'),
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
    price: t('booking.from', 'From') + ' 35 ' + t('booking.aed', 'AED'),
    description: t('booking.services.regularDesc', 'Standard home cleaning service'),
    serviceIds: [6, 7] // Regular Cleaning (without/with materials)
  },
  {
    key: 'deep',
    icon: '✨',
    title: t('booking.services.deep', 'Deep Cleaning'),
    subtitle: t('booking.services.deepDesc', 'Thorough cleaning service'),
    price: t('booking.from', 'From') + ' 45 ' + t('booking.aed', 'AED'),
    description: t('booking.services.deepDesc', 'Complete deep cleaning'),
    serviceIds: [8, 9] // Deep Cleaning (without/with materials)
  },
  {
    key: 'packages',
    icon: '📦',
    title: t('booking.services.packages', 'Complete Packages'),
    subtitle: t('booking.services.packagesDesc', 'All-inclusive cleaning solutions'),
    price: t('booking.from', 'From') + ' 180 ' + t('booking.aed', 'AED'),
    description: t('common.fixedPriceComprehensive', 'Fixed-price comprehensive services'),
    serviceIds: [20, 21, 22, 23, 24, 25, 26, 27, 28, 12, 29, 30, 15, 16] // New Complete Package services
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
  const { user, isGuest } = useAuth();
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
  const [savedCards, setSavedCards] = useState<PaymentCard[]>([]);
  
  // Complete Packages sub-navigation state
  const [activePackageSection, setActivePackageSection] = useState<'apartments' | 'villas' | 'other'>('apartments');
  const [isPackageNavSticky, setIsPackageNavSticky] = useState(false);
  
  // Add-ons sub-navigation state
  const [activeAddonSection, setActiveAddonSection] = useState<'sofa' | 'carpet' | 'mattress' | 'curtains' | 'other'>('sofa');
  const [isAddonNavSticky, setIsAddonNavSticky] = useState(false);
  const [addonImagesLoading, setAddonImagesLoading] = useState(true);
  
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
  
  // Guest signup modal state
  const [showGuestSignupModal, setShowGuestSignupModal] = useState(false);
  
  // Address creation modal state
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  
  // Service inclusions modal state
  const [showServiceInclusionsModal, setShowServiceInclusionsModal] = useState(false);
  const [selectedPackageService, setSelectedPackageService] = useState<ServiceType | null>(null);
  
  // Window cleaning specific state
  const [windowPanelsCount, setWindowPanelsCount] = useState<number | null>(null);
  
  // Helper function to check if service is window cleaning
  const isWindowCleaningService = (serviceId: number | undefined): boolean => {
    return serviceId ? [17, 18, 19].includes(serviceId) : false;
  };
  
  // Helper function to check if service requires panels count (not full villa package)
  const requiresPanelsCount = (serviceId: number | undefined): boolean => {
    return serviceId ? [17, 18].includes(serviceId) : false; // Only internal (17) and external (18)
  };
  const [showAddCardForm, setShowAddCardForm] = useState(false);
  const [recommendation, setRecommendation] = useState<RecommendationResult | null>(null);

  // State for eco-friendly info expansion
  const [showEcoInfo, setShowEcoInfo] = useState(false);

  // Form for contact details
  const { register, handleSubmit, formState: { errors }, setValue, watch, control } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });


  // Handle URL parameters for pre-selected service and order again data
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const serviceParam = urlParams.get('service');
    
    if (serviceParam && services.length > 0) {
      console.log('Service parameter:', serviceParam);
      
      // Find the exact service by name matching
      const matchedService = services.find(service => {
        const serviceName = service.name.toLowerCase();
        const param = serviceParam.toLowerCase();
        
        // Direct name matching or key matching
        return serviceName.includes(param) || 
               serviceName.replace(/\s/g, '') === param ||
               param.includes(serviceName.replace(/\s/g, ''));
      });
      
      if (matchedService) {
        console.log('Matched service:', matchedService);
        
        // Determine category based on service ID
        let categoryKey = '';
        if ([6, 7].includes(matchedService.id)) categoryKey = 'regular';
        else if ([8, 9].includes(matchedService.id)) categoryKey = 'deep';
        else if ([20, 21, 22, 23, 24, 25, 26, 27, 28, 12, 29, 30, 15, 16].includes(matchedService.id)) categoryKey = 'packages';
        else if ([17, 18, 19].includes(matchedService.id)) categoryKey = 'specialized';
        
        if (categoryKey) {
          setSelectedMainCategory(categoryKey);
          setSelectedService(matchedService);
          console.log('Auto-selected category and service:', categoryKey, matchedService.name);
        }
      } else {
        // Fallback to basic category matching
      let categoryKey = '';
      if (serviceParam.includes('regular') || serviceParam === 'regular') categoryKey = 'regular';
      else if (serviceParam.includes('deep') || serviceParam === 'deep') categoryKey = 'deep';
        else if (serviceParam.includes('move') || serviceParam === 'move') categoryKey = 'packages'; // Move is in packages
        else if (serviceParam.includes('office') || serviceParam === 'office') categoryKey = 'regular'; // Office uses regular cleaning
        else if (serviceParam.includes('window') || serviceParam.includes('internal') || serviceParam.includes('external')) categoryKey = 'specialized';
        else if (serviceParam.includes('bathroom') || serviceParam.includes('kitchen') || serviceParam.includes('villa') || serviceParam.includes('apartment')) categoryKey = 'packages';
      
      if (categoryKey) {
        setSelectedMainCategory(categoryKey);
          console.log('Auto-selected category:', categoryKey);
        }
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
        if (data.durationHours) {
          setSelectedHours(data.durationHours);
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
  }, [location.search, services]);


  // Fetch data when user is available or for guests
  useEffect(() => {
      const loadInitialData = async () => {
        try {
        if (user) {
          // For authenticated users, load all data
          await Promise.all([
            fetchUserData(),
            fetchAddresses(),
            fetchSavedCards(),
            fetchServices()
          ]);
        } else if (isGuest) {
          // For guest users, only load services
          await fetchServices();
        }
        } catch (error) {
          console.error('Error loading booking page data:', error);
        } finally {
          if (initialLoading) {
            setInitialLoading(false);
          }
        }
      };
      
      loadInitialData();
  }, [user, isGuest]);

  // Restore guest progress after signup/login
  useEffect(() => {
    if (user && services.length > 0) {
      try {
        const raw = localStorage.getItem('guestBookingProgress');
        if (!raw) return;
        const progress = JSON.parse(raw);
        if (progress.selectedMainCategory) setSelectedMainCategory(progress.selectedMainCategory);
        if (progress.selectedService) {
          const svcId = progress.selectedService.id || progress.selectedService;
          const svc = services.find(s => s.id === svcId);
          if (svc) setSelectedService(svc);
        }
        if (progress.selectedPropertySize) setSelectedPropertySize(progress.selectedPropertySize);
        if (progress.selectedCleaners) setSelectedCleaners(progress.selectedCleaners);
        if (progress.selectedHours) setSelectedHours(progress.selectedHours);
        if (typeof progress.ownMaterials === 'boolean') setOwnMaterials(progress.ownMaterials);
        if (progress.windowPanelsCount) setWindowPanelsCount(progress.windowPanelsCount);
        if (Array.isArray(progress.selectedAddons)) setSelectedAddons(progress.selectedAddons);
        if (progress.step) {
          setCurrentStep(Math.min(3, progress.step));
          scrollToTop();
        }
      } catch (e) {
        console.warn('Failed to restore guest progress:', e);
      } finally {
        try { localStorage.removeItem('guestBookingProgress'); } catch {}
      }
    }
  }, [user, services]);

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
      } else if (selectedMainCategory === 'packages') {
        // For packages, specifically select Studio Deep Cleaning (ID: 20) as default
        targetService = services.find(s => s.id === 20); // Studio Deep Cleaning with Materials
      } else {
        // For specialized, find the first service in the category
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

  // Preload addon images when additional services are loaded or when moving to step 2
  useEffect(() => {
    if (additionalServices.length > 0 && (currentStep === 2 || currentStep > 2)) {
      preloadAddonImages();
    }
  }, [additionalServices, currentStep]);

  // Reset addon images loading state when moving to step 2
  useEffect(() => {
    if (currentStep === 2 && additionalServices.length > 0) {
      setAddonImagesLoading(true);
      preloadAddonImages();
    }
  }, [currentStep]);

  // Ensure floating cart stays fixed at bottom
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .floating-cart-fixed {
        position: fixed !important;
        bottom: 0 !important;
        left: 0 !important;
        right: 0 !important;
        z-index: 9999 !important;
        transform: none !important;
      }
      
      /* Ensure scrollable content doesn't overlap cart */
      .booking-content-with-cart {
        padding-bottom: 180px !important;
      }
      
      /* For modals and popups that need to account for floating cart */
      .modal-with-cart {
        margin-bottom: 120px !important;
      }
      
      /* For full-screen modals that need bottom padding */
      .modal-content-with-cart {
        padding-bottom: 140px !important;
      }
      
      /* Ensure buttons in modals are accessible */
      .modal-button-area {
        margin-bottom: 20px !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Complete Packages sub-navigation scroll listener
  useEffect(() => {
    if (selectedMainCategory !== 'packages') return;

    const handleScroll = () => {
      const apartmentsSection = document.getElementById('apartments-section');
      const villasSection = document.getElementById('villas-section');
      const otherSection = document.getElementById('other-section');
      const packagesContainer = document.getElementById('packages-container');

      if (!apartmentsSection || !villasSection || !otherSection || !packagesContainer) return;

      const scrollTop = window.scrollY;
      const containerTop = packagesContainer.offsetTop;
      
      // Check if navigation should be sticky
      setIsPackageNavSticky(scrollTop > containerTop - 100);

      // Determine active section based on scroll position
      const apartmentsTop = apartmentsSection.offsetTop - 150;
      const villasTop = villasSection.offsetTop - 150;
      const otherTop = otherSection.offsetTop - 150;

      if (scrollTop >= otherTop) {
        setActivePackageSection('other');
      } else if (scrollTop >= villasTop) {
        setActivePackageSection('villas');
      } else if (scrollTop >= apartmentsTop) {
        setActivePackageSection('apartments');
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [selectedMainCategory]);

  // Add-ons sub-navigation scroll listener
  useEffect(() => {
    if (currentStep !== 2) return;

    const handleScroll = () => {
      const sofaSection = document.getElementById('sofa-addons-section');
      const carpetSection = document.getElementById('carpet-addons-section');
      const mattressSection = document.getElementById('mattress-addons-section');
      const curtainsSection = document.getElementById('curtains-addons-section');
      const otherAddonsSection = document.getElementById('other-addons-section');
      const addonsContainer = document.getElementById('addons-container');

      if (!sofaSection || !carpetSection || !mattressSection || !curtainsSection || !otherAddonsSection || !addonsContainer) return;

      const scrollTop = window.scrollY;
      const containerTop = addonsContainer.offsetTop;
      
      // Check if navigation should be sticky
      setIsAddonNavSticky(scrollTop > containerTop - 100);

      // Determine active section based on scroll position
      const sofaTop = sofaSection.offsetTop - 150;
      const carpetTop = carpetSection.offsetTop - 150;
      const mattressTop = mattressSection.offsetTop - 150;
      const curtainsTop = curtainsSection.offsetTop - 150;
      const otherTop = otherAddonsSection.offsetTop - 150;

      if (scrollTop >= otherTop) {
        setActiveAddonSection('other');
      } else if (scrollTop >= curtainsTop) {
        setActiveAddonSection('curtains');
      } else if (scrollTop >= mattressTop) {
        setActiveAddonSection('mattress');
      } else if (scrollTop >= carpetTop) {
        setActiveAddonSection('carpet');
      } else if (scrollTop >= sofaTop) {
        setActiveAddonSection('sofa');
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentStep]);

  // Function to scroll to specific package section
  const scrollToPackageSection = (section: 'apartments' | 'villas' | 'other') => {
    const sectionId = `${section}-section`;
    const element = document.getElementById(sectionId);
    if (element) {
      const offsetTop = element.offsetTop - 120; // Account for sticky nav
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
    }
    setActivePackageSection(section);
  };

  // Function to scroll to specific addon section
  const scrollToAddonSection = (section: 'sofa' | 'carpet' | 'mattress' | 'curtains' | 'other') => {
    const sectionId = `${section}-addons-section`;
    const element = document.getElementById(sectionId);
    if (element) {
      const offsetTop = element.offsetTop - 120; // Account for sticky nav
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
    }
    setActiveAddonSection(section);
  };

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
    if (!user) return [];

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
      
      return data || [];
    } catch (error) {
      console.error('Error fetching addresses:', error);
      return [];
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
    // Allow both authenticated users and guests to fetch services
    console.log('fetchServices: Starting fetch for user:', user?.id, 'isGuest:', isGuest);

    try {
      // Fetch main services
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('id, name, description, base_price, price_per_hour, is_active, image_url')
        .eq('is_active', true)
        .order('id');

      console.log('fetchServices: Services data:', servicesData, 'Error:', servicesError);
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
        .order('category', { ascending: true })
        .order('subcategory', { ascending: true })
        .order('price', { ascending: true });

      if (addonsError) throw addonsError;
      
      // Transform additional services to match UI format
      const addonsWithUI = addonsData?.map(addon => ({
        id: addon.id.toString(),
        name: addon.name,
        price: parseFloat(addon.price),
        description: addon.description,
        unit: addon.unit,
        category: addon.category || 'other',
        subcategory: addon.subcategory || 'general',
        image_url: addon.image_url
      })) || [];
      
      console.log('🔍 Additional services with images:', addonsWithUI.map(a => ({ id: a.id, name: a.name, image_url: a.image_url })));
      
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
      // Validate based on service type
      if (isWindowCleaningService(selectedService.id)) {
        // For window services: validate panels count (for 17,18) and materials
        if (requiresPanelsCount(selectedService.id) && !windowPanelsCount) {
          alert('Please select the number of window panels');
          return;
        }
      } else if (selectedService.price_per_hour && (!selectedPropertySize || !selectedCleaners)) {
        // For hourly services: validate size/cleaners
        alert('Please select property size and number of cleaners for hourly services');
        return;
      }
    } else if (currentStep === 3) {
      if (!user && isGuest) {
        const progress = {
          selectedMainCategory,
          selectedService,
          selectedPropertySize,
          selectedCleaners,
          selectedHours,
          ownMaterials,
          windowPanelsCount,
          selectedAddons,
          step: currentStep
        } as any;
        try { localStorage.setItem('guestBookingProgress', JSON.stringify(progress)); } catch {}
        setShowGuestSignupModal(true);
        return;
      }
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

  // Guest signup modal handlers
  const handleGuestSignup = () => {
    setShowGuestSignupModal(false);
    navigate('/auth', { state: { fromBooking: true } });
  };

  // Preload addon images
  const preloadAddonImages = async () => {
    if (additionalServices.length === 0) return;
    
    const imagePromises = additionalServices
      .filter(addon => addon.image_url)
      .map(addon => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = resolve;
          img.onerror = resolve; // Resolve even on error to not block loading
          img.src = addon.image_url;
        });
      });

    try {
      await Promise.all(imagePromises);
      setAddonImagesLoading(false);
    } catch (error) {
      console.log('Some images failed to load, but continuing...');
      setAddonImagesLoading(false);
    }
  };

  const handleCloseGuestSignupModal = () => {
    setShowGuestSignupModal(false);
  };

  // Handle service selection from modal
  const handleSelectPackageService = () => {
    if (selectedPackageService) {
      setSelectedService(selectedPackageService);
      setShowServiceInclusionsModal(false);
      setSelectedPackageService(null);
      // For packages, we don't need property size, cleaners, or hours
      // They are fixed price services
    }
  };

  // Calculations - Updated for new service structure including window services
  const calculatePricing = () => {
    if (!selectedService) {
      return { basePrice: 0, addonsTotal: 0, total: 0 };
    }

    // For window cleaning services
    if (isWindowCleaningService(selectedService.id)) {
      const addonsTotal = selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
      let basePrice = 0;
      
      if (selectedService.id === 19) {
        // Full villa package - fixed price
        basePrice = parseFloat(selectedService.base_price.toString());
      } else if (requiresPanelsCount(selectedService.id) && windowPanelsCount) {
        // Internal/external cleaning - per panel pricing
        basePrice = windowPanelsCount * parseFloat(selectedService.base_price.toString());
      }
      
      return {
        basePrice: Math.round(basePrice),
        addonsTotal: Math.round(addonsTotal),
        total: Math.round(basePrice + addonsTotal)
      };
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
    const vat = parseFloat((baseTotal * 0.05).toFixed(2)); // Precise 5% VAT calculation
    const cashFee = selectedPaymentMethod === 'cash' ? 5 : 0;
    return parseFloat((baseTotal + vat + cashFee).toFixed(2));
  };

  // Handle booking submission
  const onSubmit = async (data: ContactFormData) => {
    if (!user || !selectedService) return;

    // Validate user has a valid ID
    if (!user.id) {
      alert('User authentication error. Please log in again.');
      return;
    }

    // Validate configuration based on service type
    if (isWindowCleaningService(selectedService.id)) {
      // For window services: validate panels count (for 17,18)
      if (requiresPanelsCount(selectedService.id) && !windowPanelsCount) {
        alert('Please select the number of window panels');
        return;
      }
    } else if (selectedService.price_per_hour && (!selectedPropertySize || !selectedCleaners || !selectedHours)) {
      // For hourly services: validate all required fields
      alert('Please complete all service configuration (property size, cleaners, and hours)');
      return;
    }

    // Validate address selection
    if (!data.selectedAddressId) {
      alert('Please select an address');
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
      const vat = parseFloat((baseTotal * 0.05).toFixed(2)); // Precise 5% VAT calculation
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
        // Address handling - now using saved addresses only
        address_id: data.selectedAddressId ? parseInt(data.selectedAddressId.toString()) : null,
        // Schedule (using the correct field names from schema)
        requested_date: serviceDate,
        requested_time: serviceTime,
        service_date: serviceDate,
        service_time: serviceTime,
        duration_hours: parseInt(hoursValue.toString()),
        // Service details (matching schema field names)
        property_size: isWindowCleaningService(selectedService.id) ? null : (selectedPropertySize || null),
        size_price: selectedService.price_per_hour && selectedPropertySize ? 
          Math.round(PROPERTY_SIZE_MAP[selectedPropertySize as keyof typeof PROPERTY_SIZE_MAP]?.multiplier || 1) : null,
        cleaners_count: isWindowCleaningService(selectedService.id) ? 1 : parseInt(cleanersValue.toString()),
        own_materials: ownMaterials,
        // Window cleaning specific field
        window_panels_count: requiresPanelsCount(selectedService.id) ? windowPanelsCount : null,
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
      console.log('- address_id:', data.selectedAddressId ? parseInt(data.selectedAddressId.toString()) : null);
      
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
      
      // Address is now handled by the modal, so no need for inline creation
      
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
      '6': '/sofa-cleaning-banner.png',      // Sofa Cleaning (updated)
      '7': '/carpet-cleaning-banner.png',    // Carpet Cleaning (updated)
      '8': '/mattress-cleaning-banner.png',  // Mattress Cleaning Single (updated)
      '9': '/mattress-cleaning-banner.png',  // Mattress Cleaning Double (updated)
      '10': '/curtain-cleaning-banner.png',  // Curtain Cleaning (new)
      
      // New specific addon mappings
      // Sofa sizes
      '11': '/single-seat-sofa.png',         // Single Seat Sofa
      '12': '/2-seater-sofa.png',            // 2 Seater Sofa
      '13': '/3-seater-sofa.png',            // 3 Seater Sofa
      '14': '/4-seater-sofa.png',            // 4 Seater (L-Shape) Sofa
      '15': '/5-seater-sofa.png',            // 5 Seater Sofa
      
      // Carpet sizes
      '16': '/small-carpet.png',             // Small Carpet
      '17': '/medium-carpet.png',            // Medium Carpet
      '18': '/large-carpet.png',             // Large Carpet
      '19': '/extra-large-carpet.png',       // Extra Large Carpet
      
      // Mattress sizes
      '20': '/single-mattress.png',          // Single Mattress
      '21': '/double-mattress.png',          // Double Mattress
      '22': '/queen-mattress.png',           // Queen Mattress
      '23': '/king-mattress.png',            // King Mattress
      
      // Curtain sizes
      '24': '/small-curtains.png',           // Small Curtains
      '25': '/medium-curtains.png',          // Medium Curtains
      '26': '/large-curtains.png',           // Large Curtains
      '27': '/extra-large-curtains.png'      // Extra Large Curtains
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

                {/* Complete Packages Workflow */}
                {selectedMainCategory === 'packages' && (
                  <div id="packages-container" className="space-y-6 mb-6">
                    {/* Sub-navigation for Complete Packages */}
                    <div className={`bg-white/80 backdrop-blur-sm border-b border-gray-200 transition-all duration-300 ${
                      isPackageNavSticky ? 'fixed top-0 left-0 right-0 z-40 shadow-md' : 'relative'
                    }`}>
                      <div className="max-w-md mx-auto px-4">
                        <div className="flex justify-center space-x-1 py-3">
                          {[
                            { key: 'apartments', label: 'Apartments', icon: '🏢' },
                            { key: 'villas', label: 'Villas', icon: '🏡' },
                            { key: 'other', label: 'Other', icon: '🧹' }
                          ].map((section) => (
                            <button
                              key={section.key}
                              onClick={() => scrollToPackageSection(section.key as 'apartments' | 'villas' | 'other')}
                              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border-2 ${
                                activePackageSection === section.key
                                  ? 'border-emerald-500 text-emerald-700 bg-emerald-50/30'
                                  : 'border-gray-200 text-gray-600 bg-white/50 hover:border-gray-300 hover:bg-white/70'
                              }`}
                            >
                              <span className="text-base">{section.icon}</span>
                              <span>{section.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Add spacing when nav is sticky */}
                    {isPackageNavSticky && <div className="h-16"></div>}

                    {/* Apartments Deep Cleaning Section */}
                    <div id="apartments-section">
                      <h3 className="font-semibold text-gray-800 text-lg mb-4">Apartments deep cleaning with materials</h3>
                      <div className="grid grid-cols-1 gap-3">
                        {services
                          .filter(service => [20, 21, 22, 23, 24].includes(service.id)) // Apartment services
                          .sort((a, b) => a.id - b.id)
                          .map((service) => {
                            const propertyType = service.name.includes('Studio') ? 'Studio' : 
                                               service.name.includes('1 Bedroom') ? '1 bedroom' :
                                               service.name.includes('2 Bedroom') ? '2 bedrooms' :
                                               service.name.includes('3 Bedroom') ? '3 bedrooms' :
                                               service.name.includes('4 Bedroom') ? '4 bedrooms' : service.name;
                            
                            return (
                              <div
                                key={service.id}
                                className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                                  selectedService?.id === service.id
                                    ? 'border-emerald-500 bg-emerald-50'
                                    : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                                }`}
                                onClick={() => {
                                  setSelectedPackageService(service);
                                  setShowServiceInclusionsModal(true);
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="font-semibold text-gray-900">{propertyType}</h4>
                                  </div>
                                  <div className="flex items-center gap-1 text-emerald-600 font-bold text-lg">
                                    <DirhamIcon size="sm" />
                                    <span className="flex items-center gap-1">
                                      {service.base_price} <DirhamIcon size="sm" />
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    {/* Villa Deep Cleaning Section */}
                    <div id="villas-section">
                      <h3 className="font-semibold text-gray-800 text-lg mb-4">Villa deep cleaning with materials</h3>
                      <div className="grid grid-cols-1 gap-3">
                        {services
                          .filter(service => [25, 26, 27, 28].includes(service.id)) // Villa services
                          .sort((a, b) => a.id - b.id)
                          .map((service) => {
                            const propertyType = service.name.includes('2 Bedroom') ? '2 bedroom' :
                                               service.name.includes('3 Bedroom') ? '3 bedroom' :
                                               service.name.includes('4 Bedroom') ? '4 bedroom' :
                                               service.name.includes('5 Bedroom') ? '5 bedroom' : service.name;
                            
                            return (
                              <div
                                key={service.id}
                                className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                                  selectedService?.id === service.id
                                    ? 'border-emerald-500 bg-emerald-50'
                                    : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                                }`}
                                onClick={() => {
                                  setSelectedPackageService(service);
                                  setShowServiceInclusionsModal(true);
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="font-semibold text-gray-900">{propertyType}</h4>
                                  </div>
                                  <div className="flex items-center gap-1 text-emerald-600 font-bold text-lg">
                                    <DirhamIcon size="sm" />
                                    <span className="flex items-center gap-1">
                                      {service.base_price} <DirhamIcon size="sm" />
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    {/* Other Packages Section */}
                    <div id="other-section">
                      <h3 className="font-semibold text-gray-800 text-lg mb-4">Other packages</h3>
                      <div className="grid grid-cols-1 gap-3">
                        {services
                          .filter(service => [12, 29, 30, 15, 16].includes(service.id)) // Other packages
                          .sort((a, b) => a.id - b.id)
                          .map((service) => (
                            <div
                              key={service.id}
                              className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                                selectedService?.id === service.id
                                  ? 'border-emerald-500 bg-emerald-50'
                                  : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                              }`}
                              onClick={() => {
                                setSelectedPackageService(service);
                                setShowServiceInclusionsModal(true);
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-semibold text-gray-900">{service.name}</h4>
                                  <p className="text-gray-600 text-sm">{service.description}</p>
                                </div>
                                <div className="flex items-center gap-1 text-emerald-600 font-bold text-lg">
                                  {service.base_price} <DirhamIcon size="sm" />
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Service options for specialized services only */}
                {selectedMainCategory === 'specialized' && (
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

                {/* Window Panels Selection (for internal/external window cleaning only) */}
                {selectedService && requiresPanelsCount(selectedService.id) && (
                  <div className="space-y-4 mb-6 animate-fadeIn">
                    <h3 className="font-semibold text-gray-800">Number of Window Panels</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Select the number of window panels you need cleaned
                    </p>
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                      <label className="flex items-center gap-2 text-gray-700 font-medium">
                        Panels:
                      </label>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setWindowPanelsCount(Math.max(1, (windowPanelsCount || 1) - 1))}
                          className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center font-bold text-gray-700 transition-colors"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={windowPanelsCount || 1}
                          onChange={(e) => setWindowPanelsCount(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-20 text-center border-2 border-gray-200 rounded-lg py-2 font-semibold focus:border-primary focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setWindowPanelsCount(Math.min(100, (windowPanelsCount || 1) + 1))}
                          className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center font-bold text-gray-700 transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    {windowPanelsCount && (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                        <p className="text-blue-800 font-medium">
                          {windowPanelsCount} panel{windowPanelsCount > 1 ? 's' : ''} × {selectedService.base_price} <DirhamIcon size="sm" className="inline" /> = <span className="font-bold flex items-center gap-1">{windowPanelsCount * (selectedService.base_price || 0)} <DirhamIcon size="sm" /></span>
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Property Size Selection (for non-window services and non-package services) */}
                {selectedService && !isWindowCleaningService(selectedService.id) && selectedMainCategory !== 'packages' && (
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
                {selectedService && (
                  // Show materials for non-window services with property size selected
                  // OR for window services (with or without panels count depending on service type)
                  ((!isWindowCleaningService(selectedService.id) && selectedPropertySize) ||
                   (isWindowCleaningService(selectedService.id) && (
                     selectedService.id === 19 || // Full villa package - no panels needed
                     (requiresPanelsCount(selectedService.id) && windowPanelsCount) // Internal/external with panels
                   )))
                ) && (
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
                          if (selectedMainCategory !== 'packages' && selectedPropertySize && selectedCleaners && selectedHours) {
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
                          if (selectedMainCategory !== 'packages' && selectedPropertySize && selectedCleaners && selectedHours) {
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

                {/* Number of Cleaners (only for non-package and non-window services) */}
                {selectedService && selectedPropertySize && selectedMainCategory !== 'packages' && selectedService.price_per_hour && !isWindowCleaningService(selectedService.id) && (
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
                    {/* Unified recommendation display in green box */}
                    {(recommendation || selectedCleaners === 1) && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-800">
                        {selectedCleaners === 1 
                          ? "💡 Single cleaner option - perfect for small spaces and focused cleaning"
                          : `💡 ${recommendation?.efficiency_message}`
                        }
                      </div>
                    )}
                  </div>
                )}

                {/* Number of Hours (only for non-package and non-window services) */}
                {selectedService && selectedPropertySize && selectedCleaners && selectedMainCategory !== 'packages' && selectedService.price_per_hour && !isWindowCleaningService(selectedService.id) && (
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

                {/* Window Service Price Summary */}
                {selectedService && isWindowCleaningService(selectedService.id) && (
                  (selectedService.id === 19 || // Full villa package
                   (requiresPanelsCount(selectedService.id) && windowPanelsCount)) // Internal/external with panels
                ) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center animate-fadeIn">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="text-2xl">🪟</span>
                      <h4 className="font-bold text-blue-800">Window Cleaning Service</h4>
                    </div>
                    {selectedService.id === 19 ? (
                      <>
                        <p className="text-blue-800 font-medium">
                          Complete Villa Window Package: <span className="font-bold flex items-center gap-1">{selectedService.base_price} <DirhamIcon size="sm" /></span>
                        </p>
                        <p className="text-blue-600 text-sm mt-1">
                          All windows cleaned inside and outside
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-blue-800 font-medium">
                          {windowPanelsCount} panel{windowPanelsCount && windowPanelsCount > 1 ? 's' : ''} × {selectedService.base_price} <DirhamIcon size="sm" className="inline" /> = <span className="font-bold flex items-center gap-1">{(windowPanelsCount || 0) * (selectedService.base_price || 0)} <DirhamIcon size="sm" /></span>
                        </p>
                        <p className="text-blue-600 text-sm mt-1">
                          {selectedService.name} - Professional quality guaranteed
                        </p>
                      </>
                    )}
                    <p className="text-blue-600 text-xs mt-2">
                      Materials: {ownMaterials ? 'Customer provided' : 'Professional materials included'}
                    </p>
                  </div>
                )}

                {/* Fixed Price Service Notice (for non-window packages) */}
                {selectedService && !selectedService.price_per_hour && selectedPropertySize && !isWindowCleaningService(selectedService.id) && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center animate-fadeIn">
                    <p className="text-emerald-800 font-medium">
                      Fixed-price package service: <span className="font-bold flex items-center gap-1">{selectedService.base_price} <DirhamIcon size="sm" /></span>
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
                          (getServiceKey(selectedService.name) === 'regular' ? '45' : '55')} <DirhamIcon size="sm" className="inline" />/hour/cleaner
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

            {/* Loading state for addon images */}
            {addonImagesLoading && (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                <p className="text-gray-600 text-sm">Loading services...</p>
              </div>
            )}

            {/* Show content only when images are loaded */}
            {!addonImagesLoading && (
            <div id="addons-container" className="space-y-6 mb-6">
              {/* Sub-navigation for Add-ons */}
              <div className={`bg-white/80 backdrop-blur-sm border-b border-gray-200 transition-all duration-300 ${
                isAddonNavSticky ? 'fixed top-0 left-0 right-0 z-40 shadow-md' : 'relative'
              }`}>
                <div className="w-full px-2">
                  <div className="flex gap-3 py-3 overflow-x-auto scrollbar-hide" style={{ scrollSnapType: 'x mandatory' }}>
                    {[
                      { key: 'sofa', label: 'Sofa', icon: '🛋️' },
                      { key: 'carpet', label: 'Carpet', icon: '🏠' },
                      { key: 'mattress', label: 'Mattress', icon: '🛏️' },
                      { key: 'curtains', label: 'Curtains', icon: '🪟' },
                      { key: 'other', label: 'Other', icon: '✨' }
                    ].map((section) => (
                      <button
                        key={section.key}
                        onClick={() => scrollToAddonSection(section.key as 'sofa' | 'carpet' | 'mattress' | 'curtains' | 'other')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 border-2 whitespace-nowrap flex-shrink-0 ${
                          activeAddonSection === section.key
                            ? 'border-emerald-500 text-emerald-700 bg-emerald-50'
                            : 'border-gray-200 text-gray-600 bg-white hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        style={{ scrollSnapAlign: 'start' }}
                      >
                        <span className="text-base">{section.icon}</span>
                        <span>{section.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Add spacing when nav is sticky */}
              {isAddonNavSticky && <div className="h-16"></div>}

              {/* Sofa Cleaning Section */}
              <div id="sofa-addons-section">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 text-xl">🛋️</span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Sofa</h2>
                </div>
                
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-2xl p-4 mb-4">
                  <img
                    src="/sofa-cleaning-banner.png"
                    alt="Sofa Cleaning"
                    className="w-full h-32 object-cover rounded-xl mb-4"
                    onLoad={() => {
                      console.log('✅ Sofa banner loaded successfully');
                    }}
                    onError={(e) => {
                      console.error('❌ Failed to load sofa banner image');
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      if (target.nextElementSibling) {
                        (target.nextElementSibling as HTMLElement).style.display = 'flex';
                      }
                    }}
                  />
                  <div className="w-full h-32 bg-gradient-to-br from-orange-200 to-orange-300 rounded-xl hidden items-center justify-center mb-4">
                    <span className="text-orange-700 text-4xl font-bold">Sofa</span>
                  </div>
                </div>
                
                <div className="overflow-x-auto scrollbar-hide">
                  <div className="flex gap-4 pb-4 min-w-max">
                    {additionalServices
                      .filter(addon => addon.category === 'furniture' && addon.subcategory === 'sofa')
                      .map((addon) => {
                        const isSelected = selectedAddons.some(selected => selected.id === addon.id);
                        
                        return (
                          <div
                            key={addon.id}
                            className={`flex-shrink-0 w-48 border-2 rounded-xl cursor-pointer transition-all ${
                              isSelected 
                                ? 'border-emerald-500 bg-emerald-50' 
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                            onClick={() => toggleAddon(addon)}
                          >
                            <div className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                  {addon.image_url ? (
                                    <img
                                      src={addon.image_url}
                                      alt={addon.name}
                                      className="w-full h-full object-cover rounded-lg"
                                    />
                                  ) : (
                                    <span className="text-gray-400 text-xl">🛋️</span>
                                  )}
                                </div>
                                <button
                                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                                    isSelected 
                                      ? 'border-emerald-500 bg-emerald-500' 
                                      : 'border-gray-300 bg-white'
                                  }`}
                                >
                                  {isSelected && (
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </button>
                              </div>
                              
                              <h4 className="font-semibold text-gray-900 mb-1">{addon.name}</h4>
                              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{addon.description}</p>
                              
                              <div className="flex items-center justify-between">
                                <span className="text-lg font-bold text-emerald-600">
                                  <DirhamIcon size="sm" className="mr-1" /> {addon.price}
                                </span>
                                <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">
                                  ADD +
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>

              {/* Carpet Cleaning Section */}
              <div id="carpet-addons-section">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-xl">🏠</span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Carpet</h2>
                </div>
                
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-4 mb-4">
                  <img
                    src="/carpet-cleaning-banner.png"
                    alt="Carpet Cleaning"
                    className="w-full h-32 object-cover rounded-xl mb-4"
                    onLoad={() => {
                      console.log('✅ Carpet banner loaded successfully');
                    }}
                    onError={(e) => {
                      console.error('❌ Failed to load carpet banner image');
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      if (target.nextElementSibling) {
                        (target.nextElementSibling as HTMLElement).style.display = 'flex';
                      }
                    }}
                  />
                  <div className="w-full h-32 bg-gradient-to-br from-blue-200 to-blue-300 rounded-xl hidden items-center justify-center mb-4">
                    <span className="text-blue-700 text-4xl font-bold">Carpet</span>
                  </div>
                </div>
                
                <div className="overflow-x-auto scrollbar-hide">
                  <div className="flex gap-4 pb-4 min-w-max">
                    {additionalServices
                      .filter(addon => addon.category === 'furniture' && addon.subcategory === 'carpet')
                      .map((addon) => {
                        const isSelected = selectedAddons.some(selected => selected.id === addon.id);
                        
                        return (
                          <div
                            key={addon.id}
                            className={`flex-shrink-0 w-48 border-2 rounded-xl cursor-pointer transition-all ${
                              isSelected 
                                ? 'border-emerald-500 bg-emerald-50' 
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                            onClick={() => toggleAddon(addon)}
                          >
                            <div className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                  {addon.image_url ? (
                                    <img
                                      src={addon.image_url}
                                      alt={addon.name}
                                      className="w-full h-full object-cover rounded-lg"
                                    />
                                  ) : (
                                    <span className="text-gray-400 text-xl">🏠</span>
                                  )}
                                </div>
                                <button
                                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                                    isSelected 
                                      ? 'border-emerald-500 bg-emerald-500' 
                                      : 'border-gray-300 bg-white'
                                  }`}
                                >
                                  {isSelected && (
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </button>
                              </div>
                              
                              <h4 className="font-semibold text-gray-900 mb-1">{addon.name}</h4>
                              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{addon.description}</p>
                              
                              <div className="flex items-center justify-between">
                                <span className="text-lg font-bold text-emerald-600">
                                  <DirhamIcon size="sm" className="mr-1" /> {addon.price}
                                </span>
                                <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">
                                  ADD +
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>

              {/* Mattress Cleaning Section */}
              <div id="mattress-addons-section">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 text-xl">🛏️</span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Mattress</h2>
                </div>
                
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-2xl p-4 mb-4">
                  <img
                    src="/mattress-cleaning-banner.png"
                    alt="Mattress Cleaning"
                    className="w-full h-32 object-cover rounded-xl mb-4"
                    onLoad={() => {
                      console.log('✅ Mattress banner loaded successfully');
                    }}
                    onError={(e) => {
                      console.error('❌ Failed to load mattress banner image');
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      if (target.nextElementSibling) {
                        (target.nextElementSibling as HTMLElement).style.display = 'flex';
                      }
                    }}
                  />
                  <div className="w-full h-32 bg-gradient-to-br from-purple-200 to-purple-300 rounded-xl hidden items-center justify-center mb-4">
                    <span className="text-purple-700 text-4xl font-bold">Mattress</span>
                  </div>
                </div>
                
                <div className="overflow-x-auto scrollbar-hide">
                  <div className="flex gap-4 pb-4 min-w-max">
                    {additionalServices
                      .filter(addon => addon.category === 'furniture' && addon.subcategory === 'mattress')
                      .map((addon) => {
                        const isSelected = selectedAddons.some(selected => selected.id === addon.id);
                        
                        return (
                          <div
                            key={addon.id}
                            className={`flex-shrink-0 w-48 border-2 rounded-xl cursor-pointer transition-all ${
                              isSelected 
                                ? 'border-emerald-500 bg-emerald-50' 
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                            onClick={() => toggleAddon(addon)}
                          >
                            <div className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                  {addon.image_url ? (
                                    <img
                                      src={addon.image_url}
                                      alt={addon.name}
                                      className="w-full h-full object-cover rounded-lg"
                                    />
                                  ) : (
                                    <span className="text-gray-400 text-xl">🛏️</span>
                                  )}
                                </div>
                                <button
                                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                                    isSelected 
                                      ? 'border-emerald-500 bg-emerald-500' 
                                      : 'border-gray-300 bg-white'
                                  }`}
                                >
                                  {isSelected && (
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </button>
                              </div>
                              
                              <h4 className="font-semibold text-gray-900 mb-1">{addon.name}</h4>
                              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{addon.description}</p>
                              
                              <div className="flex items-center justify-between">
                                <span className="text-lg font-bold text-emerald-600">
                                  <DirhamIcon size="sm" className="mr-1" /> {addon.price}
                                </span>
                                <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">
                                  ADD +
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>

              {/* Curtains Cleaning Section */}
              <div id="curtains-addons-section">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-100 to-teal-200 rounded-full flex items-center justify-center">
                    <span className="text-teal-600 text-xl">🪟</span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Curtains</h2>
                </div>
                
                <div className="bg-gradient-to-r from-teal-50 to-teal-100 rounded-2xl p-4 mb-4">
                  <img
                    src="/curtain-cleaning-banner.png"
                    alt="Curtain Cleaning"
                    className="w-full h-32 object-cover rounded-xl mb-4"
                    onLoad={() => {
                      console.log('✅ Curtain banner loaded successfully');
                    }}
                    onError={(e) => {
                      console.error('❌ Failed to load curtain banner image');
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      if (target.nextElementSibling) {
                        (target.nextElementSibling as HTMLElement).style.display = 'flex';
                      }
                    }}
                  />
                  <div className="w-full h-32 bg-gradient-to-br from-teal-200 to-teal-300 rounded-xl hidden items-center justify-center mb-4">
                    <span className="text-teal-700 text-4xl font-bold">Curtains</span>
                  </div>
                </div>
                
                <div className="overflow-x-auto scrollbar-hide">
                  <div className="flex gap-4 pb-4 min-w-max">
                    {additionalServices
                      .filter(addon => addon.category === 'furniture' && addon.subcategory === 'curtain')
                      .map((addon) => {
                        const isSelected = selectedAddons.some(selected => selected.id === addon.id);
                        
                        return (
                          <div
                            key={addon.id}
                            className={`flex-shrink-0 w-48 border-2 rounded-xl cursor-pointer transition-all ${
                              isSelected 
                                ? 'border-emerald-500 bg-emerald-50' 
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                            onClick={() => toggleAddon(addon)}
                          >
                            <div className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                  {addon.image_url ? (
                                    <img
                                      src={addon.image_url}
                                      alt={addon.name}
                                      className="w-full h-full object-cover rounded-lg"
                                    />
                                  ) : (
                                    <span className="text-gray-400 text-xl">🪟</span>
                                  )}
                                </div>
                                <button
                                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                                    isSelected 
                                      ? 'border-emerald-500 bg-emerald-500' 
                                      : 'border-gray-300 bg-white'
                                  }`}
                                >
                                  {isSelected && (
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </button>
                              </div>
                              
                              <h4 className="font-semibold text-gray-900 mb-1">{addon.name}</h4>
                              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{addon.description}</p>
                              
                              <div className="flex items-center justify-between">
                                <span className="text-lg font-bold text-emerald-600">
                                  <DirhamIcon size="sm" className="mr-1" /> {addon.price}
                                </span>
                                <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">
                                  ADD +
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>

              {/* Other Services Section */}
              <div id="other-addons-section">
                <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Other Services</h2>
                
                <div className="overflow-x-auto scrollbar-hide">
                  <div className="flex gap-4 pb-4 min-w-max">
                    {additionalServices
                      .filter(addon => addon.category === 'other')
                      .map((addon) => {
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
                                  src={addon.image_url || getAddonImage(addon.id)}
                                alt={addon.name}
                                className="w-full h-full object-cover"
                                style={{ aspectRatio: '2/1' }}
                                onLoad={() => {
                                  console.log(`✅ Image loaded successfully: ${addon.name} - ${addon.image_url || getAddonImage(addon.id)}`);
                                }}
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  const imageSrc = addon.image_url || getAddonImage(addon.id);
                                  console.error(`❌ Failed to load image: ${addon.name} - ${imageSrc}`);
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
                                  <span className="flex items-center gap-1">+{addon.price} <DirhamIcon size="sm" /></span>
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            )}

            {/* Total Section */}
            {selectedAddons.length > 0 && (
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-5 text-center relative overflow-hidden">
                <div className="shimmer"></div>
                <div className="relative z-10 flex flex-col items-center justify-center">
                  <div className="text-gray-600 text-sm mb-2">Extra Services Total</div>
                  <div className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    <span className="flex items-center justify-center gap-1">{selectedAddons.reduce((sum, addon) => sum + addon.price, 0)} <DirhamIcon size="sm" /></span>
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
                <Controller
                  name="customerPhone"
                  control={control}
                  render={({ field }) => (
                    <PhoneNumberInput
                      value={field.value || ''}
                      onChange={field.onChange}
                      error={errors.customerPhone?.message}
                      required={true}
                    />
                  )}
                />
              </div>

              <div>
                <label className="block font-medium mb-2">Service Address</label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <div className="flex-1">
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
                          </div>
                    <Button
                      type="button"
                      variant="primary"
                      shape="bubble"
                      size="md"
                      onClick={() => setShowAddAddressModal(true)}
                      className="!ml-3 !px-4"
                      leftIcon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>}
                    >
                      Add New
                    </Button>
                        </div>

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
                <div className="flex justify-between items-start">
                  <span className="text-gray-600 flex-shrink-0">Service Type:</span>
                  <span className="font-semibold text-gray-900 text-right flex-1 ml-2">
                    {selectedService?.name || 'Service'}
                  </span>
                </div>
                
                {selectedPropertySize && !isWindowCleaningService(selectedService?.id) && selectedMainCategory !== 'packages' && (
                  <div className="flex justify-between items-start">
                    <span className="text-gray-600 flex-shrink-0">Property Size:</span>
                    <span className="font-semibold text-gray-900 text-right flex-1 ml-2">
                      {selectedPropertySize.charAt(0).toUpperCase() + selectedPropertySize.slice(1)}
                    </span>
                  </div>
                )}
                
                {windowPanelsCount && requiresPanelsCount(selectedService?.id) && (
                  <div className="flex justify-between items-start">
                    <span className="text-gray-600 flex-shrink-0">Window Panels:</span>
                    <span className="font-semibold text-gray-900 text-right flex-1 ml-2">
                      {windowPanelsCount} panel{windowPanelsCount > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
                
                {selectedCleaners && selectedMainCategory !== 'packages' && (
                  <div className="flex justify-between items-start">
                    <span className="text-gray-600 flex-shrink-0">Number of Cleaners:</span>
                    <span className="font-semibold text-gray-900 text-right flex-1 ml-2">
                      {selectedCleaners} cleaner{selectedCleaners > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
                
                {selectedHours && selectedMainCategory !== 'packages' && (
                  <div className="flex justify-between items-start">
                    <span className="text-gray-600 flex-shrink-0">Duration:</span>
                    <span className="font-semibold text-gray-900 text-right flex-1 ml-2">
                      {selectedHours} hour{selectedHours > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between items-start">
                  <span className="text-gray-600 flex-shrink-0">Materials:</span>
                  <span className="font-semibold text-gray-900 text-right flex-1 ml-2">
                    {selectedMainCategory === 'packages' ? 'All included' : (ownMaterials ? 'Customer provided' : 'Cleaner provided')}
                  </span>
                </div>
                
                <div className="flex justify-between items-start">
                  <span className="text-gray-600 flex-shrink-0">Date & Time:</span>
                  <span className="font-semibold text-gray-900 text-right flex-1 ml-2">
                    {serviceDate && serviceTime ? `${new Date(serviceDate).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })} at ${serviceTime}` : 'Not selected'}
                  </span>
                </div>
                
                {selectedAddons.length > 0 && (
                  <div className="flex justify-between items-start">
                    <span className="text-gray-600 flex-shrink-0">Extra Services:</span>
                    <div className="font-semibold text-gray-900 text-right flex-1 ml-2">
                      {selectedAddons.map((addon, index) => (
                        <div key={index} className="text-right">
                          {addon.name}
                        </div>
                      ))}
                    </div>
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
                    {(calculatePricing().total * 0.05).toFixed(2)}
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

      <div className="max-w-2xl mx-auto p-4 booking-content-with-cart">
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



        {/* Booking Policy Notice - Only show on step 4 */}
        {currentStep === 4 && (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-amber-800 mb-1">Important Booking Policy</h4>
                <p className="text-sm text-amber-700">
                  <strong>Once your order is created, it cannot be cancelled.</strong> However, you can reschedule your booking up to 24 hours before the scheduled service time. By proceeding, you agree to these terms.
                </p>
              </div>
            </div>
          </div>
        )}

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
                  // For packages, only need service selection (no property size, cleaners, hours)
                  (selectedMainCategory === 'packages' && !selectedService) ||
                  // For specialized, need specific service selection
                  (selectedMainCategory === 'specialized' && !selectedService) ||
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
        // For packages, only need service selection (no property size needed)
        (selectedMainCategory === 'packages') ||
        // For regular/deep cleaning, need property size, cleaners, and hours  
        ((selectedMainCategory === 'regular' || selectedMainCategory === 'deep') && selectedPropertySize && selectedCleaners && selectedHours) ||
        // For window cleaning services
        (isWindowCleaningService(selectedService.id) && (
          selectedService.id === 19 || // Full villa package - just need service selection
          (requiresPanelsCount(selectedService.id) && windowPanelsCount) // Internal/external with panels
        )) ||
        // For other specialized services with hourly pricing, need full configuration
        (selectedMainCategory === 'specialized' && !isWindowCleaningService(selectedService.id) && selectedService.price_per_hour && selectedPropertySize && selectedCleaners && selectedHours) ||
        // For other specialized services with fixed pricing, only need property size
        (selectedMainCategory === 'specialized' && !isWindowCleaningService(selectedService.id) && !selectedService.price_per_hour && selectedPropertySize) ||
        // For order again data, show cart if we have the service and basic data
        (localStorage.getItem('orderAgainData') && selectedService)
      ) && (
        <div className="floating-cart-fixed bg-white border-t border-gray-200 shadow-lg">
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
                  {isWindowCleaningService(selectedService.id) ? (
                    <>
                      {selectedService.id === 19 
                        ? 'Complete Villa Window Package' 
                        : `${windowPanelsCount || 0} panel${(windowPanelsCount || 0) > 1 ? 's' : ''} • ${selectedService.name}`
                      } • {ownMaterials ? 'Own materials' : 'Materials provided'}
                      {selectedAddons.length > 0 && ` • +${selectedAddons.length} extra${selectedAddons.length > 1 ? 's' : ''}`}
                    </>
                  ) : selectedMainCategory === 'packages' ? (
                    <>
                      Complete Package • All materials included
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
                  {selectedPaymentMethod === 'cash' && <span className="ml-2 flex items-center gap-1">+5 <DirhamIcon size="sm" /> cash fee</span>}
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

      {/* Guest Signup Modal */}
      <GuestSignupModal
        isVisible={showGuestSignupModal}
        onClose={handleCloseGuestSignupModal}
        message="To continue for scheduling you will need to sign up"
        onSignup={handleGuestSignup}
      />

      {/* Service Inclusions Modal */}
      <ServiceInclusionsModal
        isOpen={showServiceInclusionsModal}
        onClose={() => {
          setShowServiceInclusionsModal(false);
          setSelectedPackageService(null);
        }}
        onSelect={handleSelectPackageService}
        serviceId={selectedPackageService?.id || 0}
        serviceName={selectedPackageService?.name || ''}
        servicePrice={selectedPackageService?.base_price || 0}
        serviceImage={selectedPackageService?.image}
      />

      {/* Add Address Modal */}
      {showAddAddressModal && (
        <AddAddressModal
          onClose={() => setShowAddAddressModal(false)}
          onSuccess={async (isNewAddress: boolean) => {
            setShowAddAddressModal(false);
            if (isNewAddress) {
              // Refresh addresses and get fresh data
              const freshAddresses = await fetchAddresses();
              const defaultAddress = freshAddresses.find(addr => addr.is_default);
              if (defaultAddress) {
                setValue('selectedAddressId', defaultAddress.id);
              }
            }
          }}
        />
      )}
    </div>
    </>
  );
};

// Add/Edit Address Modal Component for Booking
interface AddAddressModalProps {
  address?: Address | null;
  onClose: () => void;
  onSuccess: (isNewAddress: boolean) => void;
}

const AddAddressModal: React.FC<AddAddressModalProps> = ({ address, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    apartment: address?.apartment || '',
    city: address?.city || 'Dubai',
    // Canonical address fields
    place_id: null as string | null,
    formatted_address: '',
    lat: null as number | null,
    lng: null as number | null,
    country: 'AE',
    emirate: '',
    route: '',
    street_number: '',
  });
  const [searchValue, setSearchValue] = useState(address?.street || '');
  const [loading, setLoading] = useState(false);
  const isEditing = !!address;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !searchValue.trim()) return;

    // Validate canonical address data
    if (!formData.place_id || !formData.lat || !formData.lng) {
      alert('Please select a valid address from the search results');
      return;
    }

    if (formData.country !== 'AE') {
      alert('Address must be within the UAE');
      return;
    }

    setLoading(true);

    try {
      if (isEditing && address) {
        // Update existing address
        const { error } = await supabase
          .from('addresses')
          .update({
            street: searchValue.trim(),
            apartment: formData.apartment.trim() || null,
            city: formData.city,
          })
          .eq('id', address.id);

        if (error) throw error;
      } else {
        // Check if this will be the first address (make it default)
        const { data: existingAddresses } = await supabase
          .from('addresses')
          .select('id')
          .eq('user_id', user.id);

        const isFirstAddress = !existingAddresses || existingAddresses.length === 0;

        // Create new address with canonical data
        const { error } = await supabase
          .from('addresses')
          .insert({
            user_id: user.id,
            street: searchValue, // User-facing label
            apartment: formData.apartment || null,
            city: formData.city,
            is_default: isFirstAddress,
            // Canonical address data
            place_id: formData.place_id,
            formatted_address: formData.formatted_address,
            lat: formData.lat,
            lng: formData.lng,
            country: formData.country,
            emirate: formData.emirate,
            route: formData.route,
            street_number: formData.street_number,
          });

        if (error) throw error;

        // If this is the first address, we're done
        // If this is not the first address, ensure only one default exists
        if (!isFirstAddress) {
          // Remove default from all other addresses
          await supabase
            .from('addresses')
            .update({ is_default: false })
            .eq('user_id', user.id)
            .neq('street', searchValue);
        }
      }

      onSuccess(!isEditing);
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'adding'} address:`, error);
      alert(`Error ${isEditing ? 'updating' : 'adding'} address. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddressChange = (address: string, placeDetails?: any) => {
    // Use display name for user-facing label, fallback to formatted address
    const label = placeDetails?.displayName || placeDetails?.name || address;
    setSearchValue(label);
    
    // Capture canonical address data
    if (placeDetails) {
      setFormData(prev => ({
        ...prev,
        place_id: placeDetails.placeId ?? null,
        formatted_address: placeDetails.formattedAddress ?? '',
        lat: placeDetails.lat ?? null,
        lng: placeDetails.lng ?? null,
        country: placeDetails.components?.country ?? 'AE',
        emirate: placeDetails.components?.emirate ?? '',
        city: placeDetails.components?.city || prev.city,
        route: placeDetails.components?.route ?? '',
        street_number: placeDetails.components?.streetNumber ?? '',
      }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50 modal-content-with-cart">
      <div className="bg-white w-full rounded-t-3xl p-6 max-h-[75vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {isEditing ? 'Edit Address' : 'Add New Address'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center hover:bg-orange-200 transition-colors"
          >
            <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Search Building/Place Name</label>
            <AddressAutocomplete
              value={searchValue}
              onChange={handleAddressChange}
              placeholder="Search for building name (e.g., Westwood Grande 2 by Imtiaz)..."
              showMap={true}
              mapHeight={200}
              onError={(error: string) => {
                console.error('Places API error:', error);
              }}
            />
            {searchValue && (
              <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-600">
                  <strong>Selected:</strong> {searchValue}
                </p>
                <p className="text-xs text-blue-500 mt-1">
                  This is the building name that will be saved
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Apartment/Unit/Floor (Optional)</label>
            <input
              type="text"
              value={formData.apartment}
              onChange={(e) => setFormData({ ...formData, apartment: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="e.g., Apt 101, Floor 5, Unit A..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              required
            />
          </div>

          <div className="modal-button-area">
            <Button
              type="submit"
              variant="primary"
              shape="bubble"
              size="md"
              disabled={loading || !searchValue.trim()}
              fullWidth={true}
              className="!py-3 !shadow-lg"
            >
              {loading 
                ? (isEditing ? 'Updating...' : 'Adding...') 
                : (isEditing ? 'Update Address' : 'Add Address')
              }
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingPage; 
