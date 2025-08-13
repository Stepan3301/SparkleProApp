import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
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

const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

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
      
      .booking-card:hover {
        box-shadow: 0 8px 25px rgba(0, 150, 136, 0.15);
        transform: translateY(-2px) !important;
      }
      
      .rope-animation {
        animation: ropeGlow 3s ease-in-out infinite;
      }
      
      @keyframes ropeGlow {
        0%, 100% { box-shadow: 0 0 10px rgba(16, 185, 129, 0.3); }
        50% { box-shadow: 0 0 20px rgba(16, 185, 129, 0.6); }
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
      year: 'numeric',
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

  const handleCardClick = (booking: Booking, index: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent stack toggle when clicking individual cards
    
    // If collapsed and clicking the top card (index 0), expand the stack instead of opening details
    if (!isExpanded && index === 0) {
      setIsExpanded(true);
      return;
    }
    
    // If expanded or not the top card, open booking details
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedBooking(null);
  };

  const cancelBooking = async (bookingId: number) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId);

      if (error) throw error;

      // Remove from local state
      setBookings(prev => prev.filter(b => b.id !== bookingId));
      
      // Close modal
      closeModal();
      
      // Show success notification
      alert('Booking cancelled successfully!');
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Failed to cancel booking. Please try again.');
    }
  };

  const orderAgain = (booking: Booking) => {
    // Navigate to booking page with pre-filled data
    const bookingData = {
      propertySize: booking.property_size,
      sizePrice: booking.size_price,
      cleanersCount: booking.cleaners_count,
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading booking history...</p>
        </div>
      </div>
    );
  }

  return (
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
              height: isExpanded ? `${Math.max(420, bookings.length * 90 + 100)}px` : '420px',
              cursor: !isExpanded ? 'pointer' : 'default'
            }}
            onClick={!isExpanded ? toggleStack : undefined}
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
              const randomRotation = (Math.sin(booking.id) * 6); // Consistent but random-looking rotation
              
              return (
                <div
                  key={booking.id}
                  className="booking-card absolute left-0 w-full h-20 bg-white rounded-2xl shadow-md border border-gray-100 flex items-center px-5 gap-4 cursor-pointer hover:shadow-lg"
                  style={{
                    transform: isExpanded 
                      ? `translateY(${index * 90 + 10}px) rotate(0deg)`
                      : `translateY(${index * 4}px) rotate(${randomRotation}deg)`,
                    opacity: isExpanded ? 1 : Math.max(0.3, 1 - index * 0.15),
                    zIndex: bookings.length - index,
                    pointerEvents: isExpanded || isTopCard ? 'auto' : 'none',
                    transitionDelay: isExpanded ? `${index * 0.06}s` : `${(bookings.length - index - 1) * 0.03}s`,
                    willChange: 'transform, opacity'
                  }}
                  onClick={(e) => handleCardClick(booking, index, e)}
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
                      {getSizeLabel(booking.property_size)} Cleaning
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      #{booking.id} • {formatShortDate(booking.service_date)}
                    </div>
                  </div>
                  
                  {/* Price */}
                  <div className="flex items-center gap-1 text-emerald-600 font-bold text-sm flex-shrink-0">
                    <DirhamIcon size="sm" />
                    {booking.total_price}
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
          💡 Tap top card to expand bookings
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
            className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 relative overflow-hidden">
              {/* Decorative background */}
              <div className="absolute inset-0 bg-white opacity-10">
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white opacity-20 transform translate-x-16 -translate-y-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white opacity-20 transform -translate-x-12 translate-y-12"></div>
              </div>
              
              {/* Close button */}
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors z-10"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
              
              {/* Status badge */}
              <div className="absolute top-4 left-4 z-10">
                <span className="bg-white/90 backdrop-blur-sm text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold">
                  {getBookingStatusLabel(selectedBooking.status)}
                </span>
              </div>
              
              {/* Service title */}
              <div className="relative z-10 mt-8">
                <h2 className="text-2xl font-bold mb-1">
                  {getSizeLabel(selectedBooking.property_size)} Cleaning
                </h2>
                <p className="text-emerald-100 text-sm">Booking #{selectedBooking.id}</p>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                      <CalendarIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Date</div>
                      <div className="text-sm font-semibold text-gray-900">{formatDate(selectedBooking.service_date)}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <ClockIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Time</div>
                      <div className="text-sm font-semibold text-gray-900">{formatTimeSlot(selectedBooking.service_time)}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Cleaners</div>
                      <div className="text-sm font-semibold text-gray-900">{selectedBooking.cleaners_count} cleaner{selectedBooking.cleaners_count > 1 ? 's' : ''}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                      <MapPinIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Address</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {selectedBooking.custom_address ? 'Custom address' : 'Saved address'}
                      </div>
                    </div>
                  </div>
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

              {/* Add-ons Section */}
              {selectedBooking.addons && selectedBooking.addons.length > 0 && (
                <div className="bg-blue-50 rounded-2xl p-5 mb-6 border border-blue-100">
                  <h3 className="text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add-ons
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedBooking.addons.map((addon, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-sm font-medium border border-blue-200"
                      >
                        {addon.name}
                      </span>
                    ))}
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
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold flex items-center justify-center gap-2">
                    <DirhamIcon size="lg" />
                    {selectedBooking.total_price}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-4">
                <Button
                  variant="secondary"
                  shape="bubble"
                  size="md"
                  onClick={() => orderAgain(selectedBooking)}
                  leftIcon={<ArrowPathIcon className="w-5 h-5" />}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700"
                >
                  Order Again
                </Button>
                <Button
                  variant="secondary"
                  shape="bubble"
                  size="md"
                  onClick={() => cancelBooking(selectedBooking.id)}
                  leftIcon={<TrashIcon className="w-5 h-5" />}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700"
                >
                  Cancel Booking
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage; 