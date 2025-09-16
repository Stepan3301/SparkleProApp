import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import DirhamIcon from '../components/ui/DirhamIcon';
import ReviewNotification from '../components/ui/ReviewNotification';
import ServiceDetailModal from '../components/ui/ServiceDetailModal';
import Toast from '../components/ui/Toast';
import GuestAccessModal from '../components/ui/GuestAccessModal';
import HomeHeader from '../components/ui/HomeHeader';
import { useReviewNotifications } from '../hooks/useReviewNotifications';
import { useSimpleTranslation } from '../utils/i18n';
import { handleReferralShare } from '../utils/shareUtils';
import { 
  ShareIcon
} from '@heroicons/react/24/outline';
import { 
  HomeIcon as HomeSolid,
  CalendarIcon as CalendarSolid,
  DocumentTextIcon as DocumentSolid,
  UserIcon as UserSolid
} from '@heroicons/react/24/solid';
import SEO from '../components/seo/SEO';
import LoadingScreen from '../components/ui/LoadingScreen';
import PWAInstallPrompt from '../components/ui/PWAInstallPrompt';

interface UserStats {
  totalBookings: number;
  averageRating: number;
  totalAddresses: number;
}


interface ActiveBooking {
  id: number;
  service_date: string;
  service_time: string;
  status: string;
  total_price: number;
  service_name: string;
  service_image_url?: string;
  property_size: string;
}

interface ServiceData {
  id: number;
  name: string;
  description: string;
  base_price: number;
  price_per_hour: number | null;
  is_active: boolean;
  image_url: string;
}

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isGuest } = useAuth();
  const { t } = useSimpleTranslation();
  const { currentReviewBooking, dismissCurrentReview, markReviewCompleted } = useReviewNotifications();
  const [userStats, setUserStats] = useState<UserStats>({
    totalBookings: 0,
    averageRating: 4.9,
    totalAddresses: 0
  });
  const [activeBookings, setActiveBookings] = useState<ActiveBooking[]>([]);
  const [services, setServices] = useState<ServiceData[]>([]);
  const [popularServices, setPopularServices] = useState<ServiceData[]>([]);
  const [userPreferences, setUserPreferences] = useState<string[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Service Detail Modal State
  const [selectedService, setSelectedService] = useState<ServiceData | null>(null);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  
  // Toast notification state
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  const [isToastVisible, setIsToastVisible] = useState(false);
  
  // Guest access modal state
  const [showGuestAccessModal, setShowGuestAccessModal] = useState(false);
  const [guestAccessType, setGuestAccessType] = useState<'profile' | 'history'>('profile');

  useEffect(() => {
    // Load data for both authenticated users and guests
    const loadAllData = async () => {
      setLoading(true);
      try {
        if (user) {
          // For authenticated users, load all data
          await Promise.all([
            fetchUserStats(),
            fetchProfile(),
            fetchActiveBookings(),
            fetchServices(),
            fetchPopularServices()
          ]);
          // These can load in parallel without affecting layout
          fetchUserPreferences();
        } else if (isGuest) {
          // For guest users, only load public data
          await Promise.all([
            fetchServices(),
            fetchPopularServices()
          ]);
        }
      } catch (error) {
        console.error('Error loading homepage data:', error);
      } finally {
        setLoading(false);
        // Only set initial loading to false after the first load
        if (initialLoading) {
          setInitialLoading(false);
        }
      }
    };
    
    loadAllData();

    // Set up real-time updates every 30 seconds (only for authenticated users)
    if (user) {
      const interval = setInterval(() => {
        // Only refresh data, don't show loading for background updates
        fetchUserStats();
        fetchActiveBookings();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [user, isGuest]);

  const fetchUserStats = async () => {
    if (!user) return;

    try {
      // Fetch user's booking count
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id')
        .eq('customer_id', user.id);

      // Fetch user's address count
      const { data: addresses, error: addressesError } = await supabase
        .from('addresses')
        .select('id')
        .eq('user_id', user.id);

      if (bookingsError) throw bookingsError;
      if (addressesError) throw addressesError;

      setUserStats({
        totalBookings: bookings?.length || 0,
        averageRating: 4.9, // Company rating
        totalAddresses: addresses?.length || 0
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };


  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('id, name, description, base_price, price_per_hour, is_active, image_url')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const fetchActiveBookings = async () => {
    if (!user) return;

    try {
      const now = new Date().toISOString();
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          id,
          service_date,
          service_time,
          status,
          total_price,
          property_size,
          services (
            name,
            image_url
          )
        `)
        .eq('customer_id', user.id)
        .in('status', ['confirmed', 'in_progress'])
        .gte('service_date', now.split('T')[0])
        .order('service_date', { ascending: true })
        .limit(3);

      if (error) throw error;

      const transformedBookings = (bookings || []).map(booking => ({
        ...booking,
        service_name: booking.services?.[0]?.name || 'Cleaning Service',
        service_image_url: booking.services?.[0]?.image_url || '/regular-cleaning.jpg'
      }));

      setActiveBookings(transformedBookings);
    } catch (error) {
      console.error('Error fetching active bookings:', error);
    }
  };

  const fetchPopularServices = async () => {
    try {
      // Get most booked services (top 4)
      const { data, error } = await supabase
        .from('services')
        .select('id, name, description, base_price, price_per_hour, is_active, image_url')
        .eq('is_active', true)
        .order('base_price', { ascending: true })
        .limit(4);

      if (error) throw error;
      setPopularServices(data || []);
    } catch (error) {
      console.error('Error fetching popular services:', error);
    }
  };

  const fetchUserPreferences = async () => {
    if (!user) return;

    try {
      // Get user's most booked service types for recommendations
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          services (name)
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const serviceNames = bookings?.map(b => b.services?.[0]?.name).filter(Boolean) || [];
      setUserPreferences(serviceNames);
    } catch (error) {
      console.error('Error fetching user preferences:', error);
    }
  };


  const getRecommendedServices = () => {
    if (userPreferences.length === 0) {
      return services.slice(0, 2);
    }
    
    // Find services similar to user's preferences
    const recommended = services.filter(service => 
      userPreferences.some(pref => 
        service.name.toLowerCase().includes(pref.toLowerCase().split(' ')[0])
      )
    ).slice(0, 2);
    
    return recommended.length > 0 ? recommended : services.slice(0, 2);
  };



  const getServiceKey = (serviceName: string) => {
    const name = serviceName.toLowerCase();
    
    // Specific service mappings for better matching
    if (name.includes('bathroom') && name.includes('deep')) return 'bathroomdeepcleaning';
    if (name.includes('kitchen') && name.includes('deep')) return 'kitchendeepcleaning';
    if (name.includes('internal') && name.includes('window')) return 'internalwindowcleaning';
    if (name.includes('external') && name.includes('window')) return 'externalwindowcleaning';
    if (name.includes('villa') && name.includes('window')) return 'villawindowpackage';
    if (name.includes('villa') && name.includes('deep')) return 'villadeeppackage';
    if (name.includes('apartment') && name.includes('deep')) return 'apartmentdeeppackage';
    if (name.includes('move') && (name.includes('in') || name.includes('out'))) return 'moveinoutcleaning';
    if (name.includes('post') && name.includes('construction')) return 'postconstructioncleaning';
    if (name.includes('facade')) return 'facadecleaning';
    
    // General category mappings
    if (name.includes('regular')) return 'regular';
    if (name.includes('deep') && !name.includes('bathroom') && !name.includes('kitchen') && !name.includes('villa') && !name.includes('apartment')) return 'deep';
    if (name.includes('office')) return 'office';
    
    // Default: remove spaces and special characters
    return name.replace(/[^a-z0-9]/g, '');
  };

  // Service Detail Modal Handlers
  const handleServiceClick = (service: ServiceData) => {
    setSelectedService(service);
    setIsServiceModalOpen(true);
  };

  const handleCloseServiceModal = () => {
    setIsServiceModalOpen(false);
    setSelectedService(null);
  };

  // Guest mode restriction handlers
  const handleProfileClick = () => {
    if (isGuest) {
      setGuestAccessType('profile');
      setShowGuestAccessModal(true);
    } else {
      navigate('/profile');
    }
  };

  const handleHistoryClick = () => {
    if (isGuest) {
      setGuestAccessType('history');
      setShowGuestAccessModal(true);
    } else {
      navigate('/history');
    }
  };

  // Guest access modal handlers
  const handleGuestSignup = () => {
    setShowGuestAccessModal(false);
    navigate('/auth', { state: { fromProfile: guestAccessType === 'profile' } });
  };

  const handleGoHome = () => {
    setShowGuestAccessModal(false);
    navigate('/home');
  };

  // Toast notification helpers
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setIsToastVisible(true);
  };

  const hideToast = () => {
    setIsToastVisible(false);
  };

  // Referral sharing handler
  const handleInviteFriend = async () => {
    const userName = profile?.full_name || profile?.email?.split('@')[0] || 'A friend';
    
    await handleReferralShare(
      userName,
      (method) => {
        if (method === 'clipboard') {
          showToast('Link copied to clipboard! 📋', 'success');
        }
        // For native sharing, no toast needed as the system handles feedback
      },
      (error) => {
        console.error('Sharing failed:', error);
        showToast('Failed to share. Please try again.', 'error');
      }
    );
  };

  const homePageSEO = {
    title: "Professional Cleaning Services in UAE",
    description: "Book professional cleaning services in UAE with SparklePro. Regular cleaning, deep cleaning, move-in/move-out, and office cleaning. Trusted by 1000+ customers.",
    keywords: "cleaning services UAE, professional cleaners Dubai, house cleaning Abu Dhabi, maid service UAE, deep cleaning Dubai",
    type: "website" as const,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "SparklePro - Professional Cleaning Services UAE",
      "description": "Book professional cleaning services in UAE with SparklePro. Regular cleaning, deep cleaning, move-in/move-out, and office cleaning.",
      "url": "https://sparklepro.ae/home"
    }
  };

  return (
    <>
      <SEO {...homePageSEO} />
      
      {/* Loading Screen */}
      <LoadingScreen 
        isLoading={initialLoading} 
        onLoadingComplete={() => {}}
        minDuration={1000}
        smartLoading={true}
      />
      
      <div className="min-h-screen bg-gray-50 pb-20">
        <style>{`
          
          .quick-book-gradient {
            background: linear-gradient(135deg, #10b981, #06b6d4);
            position: relative;
            overflow: hidden;
          }
          
          .quick-book-gradient::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            animation: float 8s infinite ease-in-out;
          }
          
          @keyframes float {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            33% { transform: translate(30px, -30px) rotate(120deg); }
            66% { transform: translate(-20px, 20px) rotate(240deg); }
          }
          
          .service-card {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
          }
          
          .service-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.1), transparent);
            transition: left 0.6s ease;
          }
          
          .service-card:hover::before {
            left: 100%;
          }
          
          .service-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 12px 40px rgba(0,0,0,0.15);
          }
          
          .book-again-carousel {
            display: flex;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            gap: 16px;
            padding: 4px;
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          
          .book-again-carousel::-webkit-scrollbar {
            display: none;
          }
          
          .book-again-card {
            flex: 0 0 280px;
            scroll-snap-align: start;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
          }
          
          .book-again-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 30px rgba(0,0,0,0.12);
          }
          
          .book-again-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.1), transparent);
            transition: left 0.6s ease;
          }
          
          .book-again-card:hover::before {
            left: 100%;
          }
        `}</style>



        {/* Review Notification */}
        {currentReviewBooking && (
          <ReviewNotification
            bookingId={currentReviewBooking.id}
            customerName={currentReviewBooking.customer_name}
            onClose={dismissCurrentReview}
            onSubmitted={markReviewCompleted}
          />
        )}

        {/* New Home Header */}
        <HomeHeader 
          userStats={{
            totalBookings: userStats.totalBookings,
            totalAddresses: userStats.totalAddresses
          }}
          onProfileClick={handleProfileClick}
        />

        {/* PWA Install Prompt - Only shows for browser users */}
        <div className="px-5 -mt-2 mb-4">
          <PWAInstallPrompt />
        </div>

        {/* Main Content */}
        <main className="px-5 pt-6">
          {/* Quick Book Section */}
          <section className="quick-book-gradient rounded-2xl p-6 mb-8 text-white shadow-lg cursor-pointer transition-all hover:scale-[1.02]" onClick={() => navigate('/booking')}>
            <div className="quick-book-content flex items-center justify-center text-center relative z-10">
              <div className="quick-book-text">
                <div className="quick-book-title text-xl font-bold mb-1">{t('home.quickBook', 'Quick Book')}</div>
                <div className="quick-book-subtitle text-sm opacity-90">{t('home.quickBookSubtitle', 'Get instant cleaning in 2 taps')}</div>
              </div>
            </div>
          </section>

          {/* Active Booking / Next Booking Section - Always reserve space to prevent layout shifts */}
          {loading ? (
            // Skeleton placeholder - maintains consistent height during loading
            <section className="mb-6">
              <div className="section-title mb-4">
                <div className="h-6 bg-gray-200 rounded w-40 animate-pulse"></div>
              </div>
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-xl animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-5 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
                    <div className="flex items-center justify-between">
                      <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </section>
          ) : activeBookings.length > 0 ? (
            <section className="mb-6">
              <div className="section-title mb-4">
                <h2 className="text-lg font-bold text-gray-800">🔄 Your Next Cleaning</h2>
              </div>
              
              {activeBookings.slice(0, 1).map((booking) => (
                <div key={booking.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 cursor-pointer hover:shadow-md transition-all"
                     onClick={() => navigate('/history')}>
                  <div className="flex items-center gap-4">
                    <img
                      src={booking.service_image_url}
                      alt={booking.service_name}
                      className="w-16 h-16 object-cover rounded-xl border-2 border-white shadow-sm"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{booking.service_name}</h3>
                      <div className="text-sm text-gray-600 mb-2">
                        📅 {new Date(booking.service_date).toLocaleDateString('en-AE', { 
                          weekday: 'long', 
                          month: 'short', 
                          day: 'numeric' 
                        })} at {booking.service_time || '09:00'}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                          {booking.status === 'confirmed' ? 'Confirmed' : 'In Progress'}
                        </span>
                        <span className="text-sm font-semibold text-gray-800 flex items-center gap-1">
                          <DirhamIcon size="sm" />{booking.total_price}
                        </span>
                      </div>
                    </div>
                    <div className="text-blue-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </section>
          ) : null}

          {/* Smart Recommendations Section */}
          <section className="mb-6">
            <div className="section-title mb-4">
              {loading ? (
                <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
              ) : (
                <h2 className="text-lg font-bold text-gray-800">
                  {userStats.totalBookings > 0 ? '🎯 Based on Your History' : '⭐ Recommended for You'}
                </h2>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {loading ? (
                // Skeleton placeholders for services
                Array.from({ length: 4 }, (_, index) => (
                  <div key={index} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <div className="w-full h-24 bg-gray-200 rounded-xl mb-3 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-16 mb-1 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                  </div>
                ))
              ) : (
                getRecommendedServices().map((service) => (
                  <div key={service.id} 
                       className="service-card bg-white rounded-2xl p-4 shadow-sm border border-gray-100 cursor-pointer"
                       onClick={() => handleServiceClick(service)}>
                    <img
                      src={service.image_url || '/regular-cleaning.jpg'}
                      alt={service.name}
                      className="w-full h-24 object-cover rounded-xl mb-3"
                    />
                    <h3 className="font-semibold text-gray-800 mb-1 text-sm">{service.name}</h3>
                    <div className="text-emerald-600 font-semibold text-sm flex items-center gap-1">
                      From <DirhamIcon size="sm" />
                      {(() => {
                        // Show adjusted prices for regular and deep cleaning services
                        if (service.id === 6 || service.id === 7) { // Regular cleaning (with/without materials)
                          return '35';
                        } else if (service.id === 8 || service.id === 9) { // Deep cleaning (with/without materials)
                          return '45';
                        }
                        return service.base_price;
                      })()}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {userStats.totalBookings > 0 ? 'You might like this' : 'Popular choice'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Popular Services Grid */}
          <section className="mb-6">
            <div className="section-title flex items-center justify-between mb-4">
              {loading ? (
                <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
              ) : (
                <>
                  <h2 className="text-lg font-bold text-gray-800">🔥 Popular Services</h2>
                  {/* See All button hidden for simplified UX */}
                </>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {loading ? (
                // Skeleton placeholders for popular services
                Array.from({ length: 4 }, (_, index) => (
                  <div key={index} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 relative">
                    {index === 0 && (
                      <div className="absolute top-2 right-2 w-8 h-5 bg-gray-200 rounded animate-pulse"></div>
                    )}
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-20 mb-2 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="h-3 bg-gray-200 rounded w-full mb-1 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                    </div>
                  </div>
                ))
              ) : (
                popularServices.map((service, index) => (
                  <div key={service.id} 
                       className="service-card bg-white rounded-2xl p-4 shadow-sm border border-gray-100 cursor-pointer relative"
                       onClick={() => handleServiceClick(service)}>
                    {index === 0 && (
                      <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
                        #1
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <img
                        src={service.image_url || '/regular-cleaning.jpg'}
                        alt={service.name}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 text-sm mb-1">{service.name}</h3>
                        <div className="text-emerald-600 font-semibold text-sm flex items-center gap-1">
                          <DirhamIcon size="sm" />
                          {(() => {
                            // Show adjusted prices for regular and deep cleaning services
                            if (service.id === 6 || service.id === 7) { // Regular cleaning (with/without materials)
                              return '35';
                            } else if (service.id === 8 || service.id === 9) { // Deep cleaning (with/without materials)
                              return '45';
                            }
                            return service.base_price;
                          })()}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-2 leading-tight">
                      {(() => {
                        // Clean description to remove placeholder text
                        let description = service.description.replace(/\{\{count\}\}/g, '1');
                        return description.length > 60 
                          ? description.substring(0, 60) + '...'
                          : description;
                      })()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Promo / Loyalty Section */}
          <section className="mb-6">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-5 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🎁</span>
                  <h3 className="font-bold text-lg">Special Offer!</h3>
                </div>
                <p className="text-sm opacity-90 mb-3">
                  {userStats.totalBookings === 0 
                    ? "Get 15% off your first cleaning service. Use code FIRST15"
                    : "Invite a friend and get 10% off your next booking!"
                  }
                </p>
                <button 
                  onClick={() => userStats.totalBookings === 0 ? navigate('/booking') : handleInviteFriend()}
                  className="bg-white text-purple-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors flex items-center gap-2"
                >
                  {userStats.totalBookings === 0 ? (
                    "Book Now"
                  ) : (
                    <>
                      <ShareIcon className="w-4 h-4" />
                      Invite Friend
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>

          {/* Bottom Stats for Context */}
          <section className="mb-8">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="grid grid-cols-3 divide-x divide-gray-200">
                <div className="text-center px-3">
                  <div className="text-lg font-bold text-emerald-600 mb-1">
                    {userStats.totalBookings}
                  </div>
                  <div className="text-xs text-gray-500">
                    Total Booking{userStats.totalBookings !== 1 ? 's' : ''}
                  </div>
                </div>
                <div className="text-center px-3">
                  <div className="text-lg font-bold text-emerald-600 mb-1 flex items-center justify-center gap-1">
                    {userStats.averageRating}★
                  </div>
                  <div className="text-xs text-gray-500">Our Rating</div>
                </div>
                <div className="text-center px-3">
                  <div className="text-lg font-bold text-emerald-600 mb-1">24/7</div>
                  <div className="text-xs text-gray-500">Support</div>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 grid grid-cols-4 pt-2 pb-5 z-50">
          <NavItem 
            icon={<HomeSolid className="w-5 h-5" />} 
            label={t('navigation.home', 'Home')} 
            active 
            onClick={() => navigate('/home')}
          />
          <NavItem 
            icon={<CalendarSolid className="w-5 h-5" />} 
            label={t('navigation.booking', 'Book')} 
            onClick={() => navigate('/booking')}
          />
          <NavItem 
            icon={<DocumentSolid className="w-5 h-5" />} 
            label={t('navigation.history', 'History')} 
            onClick={handleHistoryClick}
          />
          <NavItem 
            icon={<UserSolid className="w-5 h-5" />} 
            label={t('navigation.profile', 'Profile')} 
            onClick={handleProfileClick}
          />
        </nav>

        {/* Service Detail Modal */}
        <ServiceDetailModal
          service={selectedService}
          serviceImage={selectedService ? selectedService.image_url || '/regular-cleaning.jpg' : ''}
          serviceKey={selectedService ? getServiceKey(selectedService.name) : ''}
          isOpen={isServiceModalOpen}
          onClose={handleCloseServiceModal}
        />

        {/* Toast Notification */}
        <Toast
          message={toastMessage}
          type={toastType}
          isVisible={isToastVisible}
          onClose={hideToast}
        />

        {/* Guest Access Modal */}
        <GuestAccessModal
          isVisible={showGuestAccessModal}
          onClose={() => setShowGuestAccessModal(false)}
          onSignup={handleGuestSignup}
          onGoHome={handleGoHome}
          title="Sign Up Required"
          message={guestAccessType === 'profile' 
            ? 'Sign up to open your profile and manage your account settings'
            : 'Sign up to view your booking history and track your orders'
          }
        />
      </div>
    </>
  );
};

// Navigation Item Component
interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active = false, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 py-2 px-1 transition-all active:scale-95 ${
      active ? 'text-primary' : 'text-gray-400'
    }`}
  >
    {icon}
    <span className="text-xs font-medium">{label}</span>
  </button>
);

export default HomePage; 