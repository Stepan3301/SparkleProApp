import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import LoadingScreen from '../components/ui/LoadingScreen';
import BookingCancelAnimation from '../components/ui/BookingCancelAnimation';
import { ArrowLeftIcon, CalendarIcon, ClockIcon, UserIcon, MapPinIcon, XMarkIcon, TrashIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import DirhamIcon from '../components/ui/DirhamIcon';
import Button from '../components/ui/Button';
import { 
  Booking, 
  getBookingStatusLabel, 
  getBookingStatusColor, 
  formatTimeSlot,
  SIZE_OPTIONS
} from '../types/booking';
import { canCancelBooking, getCancellationBlockedReason } from '../utils/bookingUtils';

const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  
  // Tooltip state for detail boxes
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  
  // Animation state
  const [showCancelAnimation, setShowCancelAnimation] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<number | null>(null);

  // Add custom styles for smooth animations
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .booking-stack-page {
        background: linear-gradient(135deg, #e3f2fd 0%, #f0f8ff 100%);
      }
      
      .booking-card {
        will-change: transform, opacity, box-shadow;
        transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), 
                    opacity 0.3s ease, 
                    box-shadow 0.3s ease;
      }
      
      .expanded .booking-card {
        transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), 
                    opacity 0.3s ease, 
                    box-shadow 0.3s ease;
      }
      
      .collapsed .booking-card {
        transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), 
                    opacity 0.3s ease, 
                    box-shadow 0.3s ease;
      }
      
      .collapsed .booking-card:not(:first-child) {
        border: 2px solid rgba(255, 255, 255, 0.8);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
      
      .booking-card:hover {
        box-shadow: 0 8px 25px rgba(0, 150, 136, 0.15);
      }
      
      /* Prevent hover effects on touch devices during scrolling */
      @media (hover: hover) and (pointer: fine) {
        .booking-card:hover {
          box-shadow: 0 8px 25px rgba(0, 150, 136, 0.15);
        }
      }
      
      /* Ensure cards stay in place during touch interactions */
      .booking-card {
        touch-action: manipulation;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        user-select: none;
      }
      
      .rope-animation {
        animation: ropeGlow 3s ease-in-out infinite;
      }
      
      @keyframes ropeGlow {
        0%, 100% { box-shadow: 0 0 10px rgba(16, 185, 129, 0.3); }
        50% { box-shadow: 0 0 20px rgba(16, 185, 129, 0.6); }
      }
      
      /* Status-based styling without conflicting transforms */
      .booking-card.pending {
        background: linear-gradient(to right, #f3f4f6, #ffffff) !important;
      }
      
      .booking-card.confirmed {
        background: linear-gradient(to right, #e0f2fe, #ffffff) !important;
      }
      
      .booking-card.completed {
        background: linear-gradient(to right, #d1fae5, #ffffff) !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    if (user) {
      fetchBookings();
      fetchServices();
      fetchAddresses();

      // Set up real-time updates every 20 seconds for booking history
      const interval = setInterval(() => {
        fetchBookings();
      }, 20000);

      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchBookings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
      // Only set initial loading to false after the first load
      if (initialLoading) {
        setInitialLoading(false);
      }
    }
  };

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('id, name');

      if (error) throw error;

      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const fetchAddresses = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('id, street')
        .eq('user_id', user.id);

      if (error) throw error;

      setAddresses(data || []);
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  const getSizeLabel = (size: string) => {
    const option = SIZE_OPTIONS.find(opt => opt.size === size);
    return option ? option.label : size;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AE', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatShortDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AE', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getServiceName = (serviceId: number | undefined | null) => {
    if (!serviceId) return getSizeLabel(selectedBooking?.property_size || '') + ' Cleaning';
    const service = services.find(s => s.id === serviceId);
    
    if (service) {
      let serviceName = service.name;
      
      // Remove redundant materials info for regular/deep cleaning services
      if (serviceName.includes('(with materials)') || serviceName.includes('(without materials)')) {
        serviceName = serviceName.replace(/\s*\(with materials\)/gi, '');
        serviceName = serviceName.replace(/\s*\(without materials\)/gi, '');
      }
      
      return serviceName;
    }
    
    return getSizeLabel(selectedBooking?.property_size || '') + ' Cleaning';
  };

  // Helper to get addon image
  const getAddonImage = (addonId: string) => {
    const imageMap: { [key: string]: string } = {
      '1': '/fridge-cleaning.JPG',           // Fridge Cleaning
      '2': '/oven-cleaning.JPG',             // Oven Cleaning  
      '3': '/balcony-cleaning.JPG',          // Balcony Cleaning
      '4': '/wardrobe-cabinet-cleaning.png', // Wardrobe/Cabinet Cleaning
      '5': '/laundry-service.JPG',           // Ironing Service
      '6': '/sofa-cleaning.png',             // Sofa Cleaning
      '7': '/carpet-cleaning.JPG',           // Carpet Cleaning
      '8': '/matress-cleaning.png',          // Mattress Cleaning Single
      '9': '/matress-cleaning.png',          // Mattress Cleaning Double
      '10': '/curtains-cleaning.JPG'         // Curtains Cleaning
    };
    return imageMap[addonId] || '/regular-cleaning.jpg'; // Fallback to main service image
  };

  // Helper function to map service_id to main category
  const getServiceMainCategory = (serviceId: number | undefined | null): string | null => {
    if (!serviceId) return null;
    
    // Map service IDs to main categories based on the BookingPage categories
    if ([6, 7].includes(serviceId)) return 'regular'; // Regular Cleaning (without/with materials)
    if ([8, 9].includes(serviceId)) return 'deep'; // Deep Cleaning (without/with materials)
    if ([10, 11, 12, 13, 14, 15, 16].includes(serviceId)) return 'packages'; // Complete Packages
    if ([17, 18, 19].includes(serviceId)) return 'specialized'; // Specialized Services
    
    return null;
  };

  const getAddressName = (addressId: number | undefined | null, customAddress: string | undefined | null) => {
    if (customAddress) return customAddress;
    if (!addressId) return 'Saved address';
    const address = addresses.find(a => a.id === addressId);
    return address ? address.street : 'Saved address';
  };

  const formatTime = (timeString: string) => {
    // Convert time to HH:MM format without seconds
    const time = new Date(`2000-01-01T${timeString}`);
    return time.toLocaleTimeString('en-AE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const handleCardClick = (booking: Booking, index: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent stack toggle when clicking individual cards
    
    // If collapsed and clicking the top card (index 0), expand the stack
    if (!isExpanded && index === 0) {
      setIsExpanded(true);
      return;
    }
    
    // If collapsed and clicking any other card, expand first then open details
    if (!isExpanded && index > 0) {
      setIsExpanded(true);
      // Delay opening the modal to allow animation to complete
      setTimeout(() => {
        setSelectedBooking(booking);
        setIsModalOpen(true);
      }, 300);
      return;
    }
    
    // If expanded, open booking details immediately
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedBooking(null);
    setActiveTooltip(null); // Close any open tooltips
  };

  const initiateCancelBooking = (bookingId: number) => {
    // Store the booking ID and start the animation
    setBookingToCancel(bookingId);
    setShowCancelAnimation(true);
    // Close the detail modal
    closeModal();
  };

  const completeCancelBooking = async () => {
    if (!bookingToCancel) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingToCancel);

      if (error) throw error;

      // Remove from local state
      setBookings(prev => prev.filter(b => b.id !== bookingToCancel));
      
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Error cancelling booking. Please try again.');
    } finally {
      // Reset animation state
      setShowCancelAnimation(false);
      setBookingToCancel(null);
    }
  };

  const orderAgain = (booking: Booking) => {
    // Get the main category for the service
    const mainCategory = getServiceMainCategory(booking.service_id);
    
    // Navigate to booking page with pre-filled data
    const bookingData = {
      serviceId: booking.service_id, // Include the service ID
      mainCategory: mainCategory, // Include the main category
      propertySize: booking.property_size,
      sizePrice: booking.size_price,
      cleanersCount: booking.cleaners_count,
      durationHours: booking.duration_hours, // Include the number of hours
      ownMaterials: booking.own_materials,
      selectedAddons: booking.addons,
      step: 3 // Start at step 3 (scheduling)
    };
    
    // Store in localStorage for the booking page to use
    localStorage.setItem('orderAgainData', JSON.stringify(bookingData));
    
    // Navigate to booking page
    navigate('/booking');
    
    // Close modal
    closeModal();
  };

  const toggleStack = () => {
    if (!isExpanded && bookings.length > 0) {
      setIsExpanded(true);
    }
  };

  const collapseStack = () => {
    setIsExpanded(false);
  };

  return (
    <>
      {/* Loading Screen */}
      <LoadingScreen 
        isLoading={initialLoading} 
        onLoadingComplete={() => {}}
        minDuration={800}
        smartLoading={true}
      />
      
      {loading && !initialLoading && (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading booking history...</p>
          </div>
        </div>
      )}
      
      {!loading && (
    <div 
      className="min-h-screen booking-stack-page flex flex-col"
      onClick={isExpanded ? collapseStack : undefined}
    >
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
        <h1 className="text-xl font-bold text-gray-900">Booking History</h1>
      </header>

      {/* Content */}
      <div className={`flex-1 flex items-center justify-center transition-all duration-500 ${
        isExpanded ? 'items-start pt-8' : 'items-center'
      }`}>
        {bookings.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center max-w-md">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No Bookings Yet</h2>
            <p className="text-gray-600 mb-6">You haven't made any bookings yet. Start by booking your first cleaning service!</p>
            <Button
              variant="primary"
              shape="bubble"
              size="md"
              onClick={() => navigate('/booking')}
              leftIcon={<CalendarIcon className="w-5 h-5" />}
            >
              Book Your First Service
            </Button>
          </div>
        ) : (
          <div 
            className={`stack-container relative transition-all duration-500 select-none ${
              isExpanded ? 'expanded' : 'collapsed'
            }`}
            style={{
              width: '340px',
              height: isExpanded ? `${Math.max(420, bookings.length * 90 + 100)}px` : `${Math.max(100, bookings.length * 4 + 80)}px`,
              cursor: !isExpanded ? 'pointer' : 'default',
              overflow: 'visible',
              position: 'relative'
            }}
            onClick={!isExpanded ? toggleStack : undefined}
            onTouchMove={(e) => {
              // Prevent default touch behavior that might interfere with card positioning
              if (!isExpanded) {
                e.preventDefault();
              }
            }}
          >
            {/* Stack Label */}
            <div className="absolute -top-10 left-0 text-lg font-bold text-emerald-600 z-10 transition-colors duration-300">
              {isExpanded ? `${bookings.length} Booking${bookings.length > 1 ? 's' : ''}` : 'Bookings'}
            </div>
            
            {/* Rope Effect */}
            <div className="absolute left-1/2 -top-8 w-1 h-8 bg-gradient-to-b from-teal-300 to-emerald-600 rounded-full transform -translate-x-1/2 z-20"></div>
            <div className="absolute left-1/2 -top-10 w-4 h-4 bg-emerald-600 rounded-full transform -translate-x-1/2 z-20 rope-animation border-2 border-teal-100"></div>
            
            {/* Booking Cards */}
            {bookings.map((booking, index) => {
              const isTopCard = index === 0;
              const randomRotation = (Math.sin(booking.id) * 3); // Consistent but random-looking rotation
              
              return (
                <div
                  key={booking.id}
                  className={`booking-card absolute left-0 w-full h-20 rounded-2xl shadow-lg border flex items-center px-5 gap-4 cursor-pointer hover:shadow-xl transition-all duration-500 ${
                    booking.status === 'pending' 
                      ? 'bg-gradient-to-r from-gray-100 to-white border-gray-200' 
                      : booking.status === 'confirmed' 
                      ? 'bg-gradient-to-r from-sky-100 to-white border-sky-200' 
                      : booking.status === 'completed' 
                      ? 'bg-gradient-to-r from-emerald-100 to-white border-emerald-200' 
                      : 'bg-white border-gray-100'
                  } ${!isExpanded && index > 0 ? 'ring-1 ring-gray-200/50' : ''}`}
                  style={{
                    top: isExpanded 
                      ? `${index * 90 + 10}px`
                      : `${index * 4}px`,
                    left: isExpanded 
                      ? '0px'
                      : `${index * 2}px`,
                    transform: isExpanded 
                      ? 'rotate(0deg)'
                      : `rotate(${randomRotation}deg)`,
                    opacity: isExpanded ? 1 : Math.max(0.8, 1 - index * 0.1),
                    zIndex: bookings.length - index,
                    pointerEvents: 'auto',
                    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    transitionDelay: isExpanded ? `${index * 0.05}s` : `${(bookings.length - index - 1) * 0.02}s`
                  }}
                  onClick={(e) => handleCardClick(booking, index, e)}
                  onTouchStart={(e) => {
                    // Prevent hover effects during touch
                    e.currentTarget.style.pointerEvents = 'auto';
                  }}
                  onTouchEnd={(e) => {
                    // Restore pointer events after touch
                    setTimeout(() => {
                      if (e.currentTarget) {
                        e.currentTarget.style.pointerEvents = 'auto';
                      }
                    }, 100);
                  }}
                >
                  {/* Service Icon */}
                  <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 1v4m8-4v4" />
                    </svg>
                  </div>
                  
                  {/* Booking Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm truncate">
                      {(() => {
                        const service = services.find(s => s.id === booking.service_id);
                        return service ? service.name : getSizeLabel(booking.property_size) + ' Cleaning';
                      })()}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      #{booking.id} • {formatShortDate(booking.service_date)}
                    </div>
                  </div>
                  
                  {/* Price */}
                  <div className="flex items-center gap-1 text-emerald-600 font-bold text-sm flex-shrink-0">
                    <DirhamIcon size="sm" />
                    {booking.total_cost || booking.total_price}
                  </div>
                  
                  {/* Status Badge */}
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    booking.status === 'pending' 
                      ? 'bg-gray-200 text-gray-700' 
                      : booking.status === 'confirmed' 
                      ? 'bg-sky-200 text-sky-700' 
                      : booking.status === 'completed' 
                      ? 'bg-emerald-200 text-emerald-700' 
                      : 'bg-gray-200 text-gray-700'
                  }`}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Instructions */}
      {bookings.length > 0 && !isExpanded && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 text-sm text-gray-600 shadow-lg z-10">
          💡 Tap any card to expand bookings
        </div>
      )}
      
      {bookings.length > 0 && isExpanded && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 text-sm text-gray-600 shadow-lg z-10">
          💡 Tap cards for details • Tap outside to collapse
        </div>
      )}

      {/* Detailed Booking Modal */}
      {isModalOpen && selectedBooking && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Fixed Modal Header - Independent positioning */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white relative overflow-hidden flex-shrink-0" style={{ height: '200px' }}>
              {/* Decorative background */}
              <div className="absolute inset-0 bg-white opacity-10">
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white opacity-20 transform translate-x-16 -translate-y-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white opacity-20 transform -translate-x-12 translate-y-12"></div>
              </div>
              
              {/* Close button - Top right */}
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors z-20"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
              
              {/* Status badge - Top left */}
              <div className="absolute top-4 left-4 z-20">
                <span className="bg-white/90 backdrop-blur-sm text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold">
                  {getBookingStatusLabel(selectedBooking.status)}
                </span>
              </div>
              
              {/* Service title - Centered */}
              <div className="absolute inset-x-0 top-16 z-10 px-6">
                <h2 className="text-2xl font-bold mb-1 text-center leading-tight">
                  {getServiceName(selectedBooking.service_id)}
                </h2>
                <p className="text-emerald-100 text-sm text-center">Booking #{selectedBooking.id}</p>
              </div>

              {/* Action Buttons - Bottom of header */}
              <div className="absolute bottom-4 left-6 right-6 flex justify-between items-center z-20">
                <Button
                  variant="primary"
                  shape="bubble"
                  size="sm"
                  onClick={() => orderAgain(selectedBooking)}
                  leftIcon={<ArrowPathIcon className="w-4 h-4" />}
                >
                  Order Again
                </Button>
                
                {/* Cancel Button - Only show if cancellation is allowed */}
                {canCancelBooking(selectedBooking) ? (
                  <Button
                    variant="signout"
                    shape="bubble"
                    size="sm"
                    onClick={() => initiateCancelBooking(selectedBooking.id)}
                    leftIcon={<TrashIcon className="w-4 h-4" />}
                  >
                    Cancel
                  </Button>
                ) : (
                  <div className="relative group">
                    <Button
                      variant="signout"
                      shape="bubble"
                      size="sm"
                      disabled={true}
                      leftIcon={<TrashIcon className="w-4 h-4 opacity-50" />}
                      className="opacity-50 cursor-not-allowed"
                    >
                      Cancel
                    </Button>
                    {/* Tooltip for why cancellation is blocked */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-30">
                      {getCancellationBlockedReason(selectedBooking)}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Content */}
            <div 
              className="flex-1 overflow-y-auto p-6"
              onClick={(e) => {
                // Close tooltips when clicking in content area but not on detail boxes
                if (e.target === e.currentTarget) {
                  setActiveTooltip(null);
                }
              }}
            >
              {/* Info Grid with Tooltips */}
              <div className="grid grid-cols-2 gap-4 mb-6 relative">
                {/* Date */}
                <div className="relative">
                  <div 
                    className="bg-gray-50 rounded-2xl p-4 border border-gray-100 min-h-[80px] cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => setActiveTooltip(activeTooltip === 'date' ? null : 'date')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <CalendarIcon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Date</div>
                        <div className="text-sm font-semibold text-gray-900 truncate">{formatDate(selectedBooking.service_date)}</div>
                      </div>
                    </div>
                  </div>
                  {activeTooltip === 'date' && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gray-100 text-gray-800 text-xs px-3 py-2 rounded-lg shadow-lg z-30 transform translate-y-full border border-gray-200">
                      {new Date(selectedBooking.service_date).toLocaleDateString('en-AE', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  )}
                </div>

                {/* Time */}
                <div className="relative">
                  <div 
                    className="bg-gray-50 rounded-2xl p-4 border border-gray-100 min-h-[80px] cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => setActiveTooltip(activeTooltip === 'time' ? null : 'time')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <ClockIcon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Time</div>
                        <div className="text-sm font-semibold text-gray-900 truncate">{formatTime(selectedBooking.service_time)}</div>
                      </div>
                    </div>
                  </div>
                  {activeTooltip === 'time' && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gray-100 text-gray-800 text-xs px-3 py-2 rounded-lg shadow-lg z-30 transform translate-y-full border border-gray-200">
                      Service time: {formatTime(selectedBooking.service_time)}
                    </div>
                  )}
                </div>

                {/* Cleaners */}
                <div className="relative">
                  <div 
                    className="bg-gray-50 rounded-2xl p-4 border border-gray-100 min-h-[80px] cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => setActiveTooltip(activeTooltip === 'cleaners' ? null : 'cleaners')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <UserIcon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Cleaners</div>
                        <div className="text-sm font-semibold text-gray-900 truncate">{selectedBooking.cleaners_count} cleaner{selectedBooking.cleaners_count > 1 ? 's' : ''}</div>
                      </div>
                    </div>
                  </div>
                  {activeTooltip === 'cleaners' && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gray-100 text-gray-800 text-xs px-3 py-2 rounded-lg shadow-lg z-30 transform translate-y-full border border-gray-200">
                      {selectedBooking.cleaners_count} professional cleaner{selectedBooking.cleaners_count > 1 ? 's' : ''} assigned
                    </div>
                  )}
                </div>

                {/* Address */}
                <div className="relative">
                  <div 
                    className="bg-gray-50 rounded-2xl p-4 border border-gray-100 min-h-[80px] cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => setActiveTooltip(activeTooltip === 'address' ? null : 'address')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <MapPinIcon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Address</div>
                        <div className="text-sm font-semibold text-gray-900 truncate">
                          {getAddressName(selectedBooking.address_id, selectedBooking.custom_address)}
                        </div>
                      </div>
                    </div>
                  </div>
                  {activeTooltip === 'address' && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gray-100 text-gray-800 text-xs px-3 py-2 rounded-lg shadow-lg z-30 transform translate-y-full border border-gray-200">
                      {getAddressName(selectedBooking.address_id, selectedBooking.custom_address)}
                    </div>
                  )}
                </div>
              </div>

              {/* Order Details Section */}
              <div className="bg-gray-50 rounded-2xl p-5 mb-6 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Order Details
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600">Materials:</span>
                    <span className="font-semibold text-gray-900">
                      {selectedBooking.own_materials ? 'Customer provided' : 'Cleaner provided'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600">Customer:</span>
                    <span className="font-semibold text-gray-900">{selectedBooking.customer_name}</span>
                  </div>
                  {selectedBooking.customer_phone && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-semibold text-gray-900">{selectedBooking.customer_phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Window Panels Section (if applicable) */}
              {selectedBooking.window_panels_count && (
                <div className="bg-blue-50 rounded-2xl p-5 mb-6 border border-blue-100">
                  <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                    <span className="text-2xl">🪟</span>
                    Window Cleaning Details
                  </h3>
                  <div className="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg text-sm font-medium border border-blue-200 inline-block">
                    {selectedBooking.window_panels_count} window panel{selectedBooking.window_panels_count > 1 ? 's' : ''}
                  </div>
                </div>
              )}

              {/* Detailed Add-ons Section */}
              {selectedBooking.addons && selectedBooking.addons.length > 0 && (
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-5 mb-6 border border-emerald-100">
                  <h3 className="text-lg font-bold text-emerald-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Additional Services
                  </h3>
                  
                  <div className="space-y-3">
                    {selectedBooking.addons.map((addon, index) => (
                      <div key={index} className="bg-white rounded-xl p-4 border border-emerald-100 shadow-sm">
                        <div className="flex items-center gap-4">
                          {/* Service Image */}
                          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                            <img
                              src={getAddonImage(addon.id?.toString() || '0')}
                              alt={addon.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.currentTarget;
                                target.src = '/regular-cleaning.jpg'; // Fallback image
                              }}
                            />
                          </div>
                          
                          {/* Service Details */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 text-sm mb-1">{addon.name}</h4>
                            <p className="text-gray-600 text-xs">Additional cleaning service</p>
                          </div>
                          
                          {/* Price */}
                          <div className="flex items-center gap-1 text-emerald-600 font-bold text-sm">
                            <DirhamIcon size="sm" />
                            <span>{addon.price || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Total Add-ons Price */}
                  <div className="mt-4 pt-4 border-t border-emerald-200">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-emerald-900">Add-ons Total:</span>
                      <div className="flex items-center gap-1 text-emerald-600 font-bold">
                        <DirhamIcon size="sm" />
                        <span>
                          {selectedBooking.addons.reduce((total, addon) => total + (addon.price || 0), 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes Section */}
              {selectedBooking.additional_notes && (
                <div className="bg-green-50 rounded-2xl p-5 mb-6 border border-green-100">
                  <h3 className="text-lg font-bold text-green-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    Notes
                  </h3>
                  <p className="text-green-800 leading-relaxed">{selectedBooking.additional_notes}</p>
                </div>
              )}

              {/* Pricing Section */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-5 text-white">
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center py-2 border-b border-white/20">
                    <span className="text-emerald-100">Base price:</span>
                    <span className="font-semibold flex items-center gap-1">
                      <DirhamIcon size="sm" />
                      {selectedBooking.base_price}
                    </span>
                  </div>
                  {selectedBooking.addons_total > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-white/20">
                      <span className="text-emerald-100">Add-ons:</span>
                      <span className="font-semibold flex items-center gap-1">
                        <DirhamIcon size="sm" />
                        {selectedBooking.addons_total}
                      </span>
                    </div>
                  )}
                  {selectedBooking.vat_amount && selectedBooking.vat_amount > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-white/20">
                      <span className="text-emerald-100">VAT (5%):</span>
                      <span className="font-semibold flex items-center gap-1">
                        <DirhamIcon size="sm" />
                        {selectedBooking.vat_amount}
                      </span>
                    </div>
                  )}
                  {selectedBooking.cash_fee && selectedBooking.cash_fee > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-white/20">
                      <span className="text-emerald-100">Cash fee:</span>
                      <span className="font-semibold flex items-center gap-1">
                        <DirhamIcon size="sm" />
                        {selectedBooking.cash_fee}
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold flex items-center justify-center gap-2">
                    <DirhamIcon size="lg" />
                    {selectedBooking.total_cost || selectedBooking.total_price}
                  </div>
                </div>
              </div>


            </div>
          </div>
        </div>
      )}

      {/* Cancel Animation */}
      <BookingCancelAnimation
        isVisible={showCancelAnimation}
        onComplete={completeCancelBooking}
      />
    </div>
      )}
    </>
  );
};

export default HistoryPage; 