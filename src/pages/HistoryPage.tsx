import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ArrowLeftIcon, CalendarIcon, ClockIcon, UserIcon, MapPinIcon } from '@heroicons/react/24/outline';
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white px-5 py-4 border-b border-gray-100 flex items-center gap-4 sticky top-0 z-10">
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
      <div className="p-5">
        {bookings.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
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
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              >
                {/* Header with status */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {getSizeLabel(booking.property_size)} Property Cleaning
                    </h3>
                    <p className="text-sm text-gray-600">Booking #{booking.id}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getBookingStatusColor(booking.status)}`}>
                    {getBookingStatusLabel(booking.status)}
                  </span>
                </div>

                {/* Service Details */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{formatDate(booking.service_date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{formatTimeSlot(booking.service_time)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{booking.cleaners_count} cleaner{booking.cleaners_count > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPinIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {booking.custom_address ? 'Custom address' : 'Saved address'}
                    </span>
                  </div>
                </div>

                {/* Additional Details */}
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Materials:</span>
                      <span className="ml-2 font-medium">
                        {booking.own_materials ? 'Customer provided' : 'Cleaner provided'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Customer:</span>
                      <span className="ml-2 font-medium">{booking.customer_name}</span>
                    </div>
                    {booking.addons && booking.addons.length > 0 && (
                      <div className="col-span-2">
                        <span className="text-gray-600">Add-ons:</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {booking.addons.map((addon, index) => (
                            <span
                              key={index}
                              className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-lg text-xs"
                            >
                              {addon.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {booking.additional_notes && (
                      <div className="col-span-2">
                        <span className="text-gray-600">Notes:</span>
                        <p className="mt-1 text-gray-800">{booking.additional_notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pricing */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    <span className="flex items-center gap-1">Base: <DirhamIcon size="sm" />{booking.base_price}</span>
                    {booking.addons_total > 0 && (
                      <span className="ml-2 flex items-center gap-1">+ Add-ons: <DirhamIcon size="sm" />{booking.addons_total}</span>
                    )}
                  </div>
                  <div className="text-xl font-bold text-gray-900 flex items-center gap-1">
                    <DirhamIcon size="md" />{booking.total_price}
                  </div>
                </div>

                {/* Action button for pending bookings */}
                {booking.status === 'pending' && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">
                      We'll call you at {booking.customer_phone} to confirm your booking.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage; 