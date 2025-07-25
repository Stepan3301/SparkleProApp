import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import DirhamIcon from '../components/ui/DirhamIcon';
import Button from '../components/ui/Button';
import ReviewNotification from '../components/ui/ReviewNotification';
import { useReviewNotifications } from '../hooks/useReviewNotifications';
import { SIZE_OPTIONS, ADDON_OPTIONS } from '../types/booking';
import LanguageSwitcher from '../components/ui/LanguageSwitcher';
import { useSimpleTranslation } from '../utils/i18n';
import { 
  MapPinIcon, 
  BellIcon, 
  HomeIcon, 
  StarIcon,
  UserIcon,
  CalendarIcon,
  DocumentTextIcon,
  SparklesIcon,
  BuildingOfficeIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline';
import { 
  HomeIcon as HomeSolid,
  CalendarIcon as CalendarSolid,
  DocumentTextIcon as DocumentSolid,
  UserIcon as UserSolid
} from '@heroicons/react/24/solid';

interface UserStats {
  totalBookings: number;
  averageRating: number;
  totalAddresses: number;
}

interface RecentBooking {
  id: number;
  property_size: string | null;
  cleaners_count: number;
  own_materials: boolean;
  service_date: string;
  additional_notes?: string;
  created_at: string;
  service_name?: string;
}

interface ServiceData {
  id: number;
  name: string;
  description: string;
  base_price: number;
  price_per_hour: number | null;
  is_active: boolean;
}

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useSimpleTranslation();
  const { currentReviewBooking, dismissCurrentReview, markReviewCompleted } = useReviewNotifications();
  const [userStats, setUserStats] = useState<UserStats>({
    totalBookings: 0,
    averageRating: 4.9,
    totalAddresses: 0
  });
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [services, setServices] = useState<ServiceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserStats();
      fetchRecentBookings();
      fetchServices();
    }
  }, [user]);

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
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentBookings = async () => {
    if (!user) return;

    try {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          id, 
          property_size, 
          cleaners_count, 
          own_materials, 
          service_date, 
          additional_notes, 
          created_at,
          services (
            name
          )
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      
      // Transform the data to include service_name
      const transformedBookings = (bookings || []).map(booking => ({
        ...booking,
        service_name: booking.services?.[0]?.name || null
      }));
      
      setRecentBookings(transformedBookings);
    } catch (error) {
      console.error('Error fetching recent bookings:', error);
    }
  };

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('home.greeting.morning', 'Good morning');
    if (hour < 17) return t('home.greeting.afternoon', 'Good afternoon');
    return t('home.greeting.evening', 'Good evening');
  };

  const getUserName = () => {
    return user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  };

  const getServiceImage = (serviceName: string | null) => {
    // Handle null or empty service name
    if (!serviceName) {
      return '/regular-cleaning.jpg'; // Default image
    }
    
    const imageMap: { [key: string]: string } = {
      'regular': '/regular-cleaning.jpg',
      'deep': '/deep-cleaning.JPG',
      'move': '/move-in-move-out.JPG',
      'office': '/office-cleaning.JPG',
      'villa': '/villa-deep-cleaning.png',
      'apartment': '/appartment-deep-cleaning.png',
      'window': '/window-cleaning.JPG',
      'kitchen': '/kitchen-deep-cleaning.png',
      'bathroom': '/bathroom-deep-cleaning.png',
      'facade': '/villa-facade-cleaning.png',
      'postconstruction': '/post-construction-cleaning.png',
      'construction': '/post-construction-cleaning.png',
      'post': '/post-construction-cleaning.png',
      'wardrobe': '/wardrobe-cabinet-cleaning.png',
      'cabinet': '/wardrobe-cabinet-cleaning.png',
      'sofa': '/carpet-cleaning.JPG',
      'mattress': '/carpet-cleaning.JPG',
      'curtains': '/window-cleaning.JPG'
    };
    
    // Convert to lowercase for case-insensitive matching
    const name = serviceName.toLowerCase();
    
    // Specific service name matching (most specific first)
    if (name.includes('full villa deep')) return '/villa-deep-cleaning.png';
    if (name.includes('full apartment deep')) return '/appartment-deep-cleaning.png';
    if (name.includes('villa facade')) return '/villa-facade-cleaning.png';
    if (name.includes('bathroom deep')) return '/bathroom-deep-cleaning.png';
    if (name.includes('kitchen deep')) return '/kitchen-deep-cleaning.png';
    if (name.includes('post-construction') || name.includes('postconstruction')) return '/post-construction-cleaning.png';
    if (name.includes('wardrobe') || name.includes('cabinet')) return '/wardrobe-cabinet-cleaning.png';
    
    // General keyword matching
    for (const [key, image] of Object.entries(imageMap)) {
      if (name.includes(key)) {
        return image;
      }
    }
    return '/regular-cleaning.jpg'; // Default image
  };

  const getServiceName = (propertySize: string | null) => {
    // Handle null or empty property size
    if (!propertySize) {
      return 'Cleaning Service';
    }
    
    const nameMap: { [key: string]: string } = {
      'small': 'Regular Cleaning',
      'medium': 'Deep Cleaning', 
      'large': 'Office Cleaning',
      'villa': 'Move In/Out',
      // Add mappings for common service keywords
      'regular': 'Regular Cleaning',
      'deep': 'Deep Cleaning',
      'move': 'Move In/Out Cleaning',
      'office': 'Office Cleaning',
      'post': 'Post-Construction Cleaning',
      'construction': 'Post-Construction Cleaning',
      'kitchen': 'Kitchen Deep Cleaning',
      'bathroom': 'Bathroom Deep Cleaning',
      'window': 'Window Cleaning',
      'facade': 'Facade Cleaning'
    };
    
    // Convert to lowercase for matching
    const lowerPropertySize = propertySize.toLowerCase();
    
    // Try to match keywords
    for (const [key, name] of Object.entries(nameMap)) {
      if (lowerPropertySize.includes(key)) {
        return name;
      }
    }
    
    return propertySize || 'Cleaning Service';
  };

  const getServiceKey = (serviceName: string) => {
    if (serviceName.toLowerCase().includes('regular')) return 'regular';
    if (serviceName.toLowerCase().includes('deep')) return 'deep';
    if (serviceName.toLowerCase().includes('move')) return 'move';
    if (serviceName.toLowerCase().includes('office')) return 'office';
    return serviceName.toLowerCase().replace(/\s/g, '');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <style>{`
        .header-gradient {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          position: relative;
          overflow: hidden;
        }
        
        .header-gradient::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -20%;
          width: 100%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          animation: shimmer 6s infinite;
        }
        
        @keyframes shimmer {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
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

      {/* Header */}
      <header className="header-gradient px-5 py-4 text-white rounded-b-[30px] relative overflow-visible">
        <div className="header-top flex justify-between items-start mb-4 relative z-10">
          <div className="greeting flex-1 pr-4">
            <h1 className="text-xl font-bold mb-1 drop-shadow-sm">
              {getGreeting()}, {getUserName()}! 👋
            </h1>
            <div className="location flex items-center gap-1 text-sm opacity-90">
              <MapPinIcon className="w-3 h-3" />
              <span>{t('home.location', 'Dubai, UAE')}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 relative z-[100]">
            <LanguageSwitcher variant="header" showText={false} />
            <Button
              variant="secondary"
              shape="bubble"
              size="sm"
              onClick={() => navigate('/profile')}
              className="!min-w-[45px] !w-11 !h-11 !p-0 !bg-white/20 !border-white/30 !text-white hover:!bg-white/30 backdrop-blur-sm"
            >
              <UserIcon className="w-5 h-5" />
            </Button>
          </div>
        </div>
        
        <div className="welcome-card bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-4 relative z-[5]">
          <div className="welcome-title text-base font-semibold mb-2">✨ {t('home.welcome', 'Welcome to SparkleNCS!')}</div>
          <div className="welcome-text text-sm opacity-90 leading-relaxed">
            {t('home.welcomeDescription', 'Your trusted cleaning service partner in Dubai. Book your first service today!')}
          </div>
        </div>
      </header>

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

        {/* Book Again Section */}
        <section className="mb-8">
          <div className="section-title mb-5">
            <h2 className="text-xl font-bold text-gray-800">{t('home.bookAgain', 'Book Again?')}</h2>
          </div>

          {recentBookings.length > 0 ? (
            <div className="book-again-carousel">
              {recentBookings.map((booking) => (
                <div 
                  key={booking.id} 
                  className="book-again-card bg-white rounded-2xl shadow-sm border border-gray-100 cursor-pointer"
                  onClick={() => navigate('/booking')}
                >
                  <div className="relative z-10">
                    <img
                      src={getServiceImage(booking.service_name || booking.property_size || '')}
                      alt={getServiceName(booking.service_name || booking.property_size || '')}
                      className="w-full h-32 object-cover rounded-t-2xl"
                    />
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-800 mb-2">{getServiceName(booking.service_name || booking.property_size || '')}</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        {getServiceName(booking.service_name || booking.property_size || '')} with {booking.cleaners_count} cleaner{booking.cleaners_count > 1 ? 's' : ''} and {booking.own_materials ? 'own materials' : 'provided materials'}
                      </p>
                      {booking.additional_notes && (
                        <p className="text-xs text-gray-500 italic mb-3 line-clamp-2">
                          "{booking.additional_notes}"
                        </p>
                      )}
                      <div className="text-xs text-emerald-600 font-medium">
                        Last booked: {new Date(booking.service_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="book-again-carousel">
              {/* Demo/Placeholder Cards */}
              <div className="book-again-card bg-white rounded-2xl shadow-sm border border-gray-100 cursor-pointer"
                   onClick={() => navigate('/booking?service=regular')}>
                <div className="relative z-10">
                  <img
                    src="/regular-cleaning.jpg"
                    alt="Regular Cleaning"
                    className="w-full h-32 object-cover rounded-t-2xl"
                  />
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 mb-2">Regular Cleaning</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Regular Cleaning with 2 cleaners and provided materials
                    </p>
                    <p className="text-xs text-gray-500 italic mb-3">
                      "Perfect for weekly maintenance"
                    </p>
                    <div className="text-xs text-emerald-600 font-medium">
                      Try this popular service
                    </div>
                  </div>
                </div>
              </div>

              <div className="book-again-card bg-white rounded-2xl shadow-sm border border-gray-100 cursor-pointer"
                   onClick={() => navigate('/booking?service=deep')}>
                <div className="relative z-10">
                  <img
                    src="/deep-cleaning.JPG"
                    alt="Deep Cleaning"
                    className="w-full h-32 object-cover rounded-t-2xl"
                  />
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 mb-2">Deep Cleaning</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Deep Cleaning with 3 cleaners and provided materials
                    </p>
                    <p className="text-xs text-gray-500 italic mb-3">
                      "Thorough cleaning for your space"
                    </p>
                    <div className="text-xs text-emerald-600 font-medium">
                      Most comprehensive service
                    </div>
                  </div>
                </div>
              </div>

              <div className="book-again-card bg-white rounded-2xl shadow-sm border border-gray-100 cursor-pointer"
                   onClick={() => navigate('/booking?service=office')}>
                <div className="relative z-10">
                  <img
                    src="/office-cleaning.JPG"
                    alt="Office Cleaning"
                    className="w-full h-32 object-cover rounded-t-2xl"
                  />
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 mb-2">Office Cleaning</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Office Cleaning with 2 cleaners and provided materials
                    </p>
                    <p className="text-xs text-gray-500 italic mb-3">
                      "Professional workspace cleaning"
                    </p>
                    <div className="text-xs text-emerald-600 font-medium">
                      Perfect for business
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Stats Row */}
        <section className="stats-row flex justify-around bg-white rounded-2xl p-5 mb-6 shadow-sm">
          <div className="stat-item text-center">
            <div className="stat-number text-xl font-bold text-emerald-600 mb-1">
              {userStats.totalBookings}
            </div>
            <div className="stat-label text-xs text-gray-500">
              Booking{userStats.totalBookings !== 1 ? 's' : ''}
            </div>
          </div>
          <div className="stat-item text-center">
            <div className="stat-number text-xl font-bold text-emerald-600 mb-1 flex items-center justify-center gap-1">
              {userStats.averageRating}★
            </div>
            <div className="stat-label text-xs text-gray-500">Rating</div>
          </div>
          <div className="stat-item text-center">
            <div className="stat-number text-xl font-bold text-emerald-600 mb-1">24/7</div>
            <div className="stat-label text-xs text-gray-500">Support</div>
          </div>
        </section>

        {/* Popular Services */}
        <section className="mb-8">
          <div className="section-title flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-800">{t('home.popularServices', 'Popular Services')}</h2>
            <button
              onClick={() => navigate('/services')}
              className="px-4 py-2 bg-sky-500 text-white text-sm font-semibold rounded-full hover:bg-sky-600 transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-md"
            >
              {t('home.seeAll', 'See All')}
            </button>
          </div>

          <div className="services-grid grid grid-cols-2 gap-4 mb-8">
            {services.slice(0, 4).map((service, index) => {
              const serviceKey = getServiceKey(service.name);
              const isPopular = index === 0; // First service is marked as popular
              
              return (
                <div key={service.id} className="service-card bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer relative"
                     onClick={() => navigate(`/booking?service=${serviceKey}`)}>
                  {isPopular && (
                    <div className="popular-badge absolute top-3 right-3 bg-gradient-to-r from-emerald-400 to-emerald-500 text-white text-xs font-semibold px-2 py-1 rounded-lg shadow-sm">
                      {t('booking.mostPopular', 'Popular')}
                    </div>
                  )}
                  <div className="service-image w-full h-28 bg-gradient-to-br from-emerald-50 to-sky-50 rounded-xl mb-4 overflow-hidden border-2 border-dashed border-gray-300">
                    <img src={getServiceImage(serviceKey)} alt={service.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="service-info relative z-10">
                    <div className="service-name text-base font-semibold text-gray-800 mb-1">{service.name}</div>
                    <div className="service-price text-sm text-emerald-600 font-semibold mb-2 flex items-center gap-1">
                      From <DirhamIcon size="sm" />{service.price_per_hour || service.base_price}/hour
                    </div>
                    <div className="service-description text-xs text-gray-500 leading-relaxed">
                      {service.description}
                    </div>
                  </div>
                </div>
              );
            })}
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
          onClick={() => navigate('/history')}
        />
        <NavItem 
          icon={<UserSolid className="w-5 h-5" />} 
          label={t('navigation.profile', 'Profile')} 
          onClick={() => navigate('/profile')}
        />
      </nav>
    </div>
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