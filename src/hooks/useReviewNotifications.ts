import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface CompletedBooking {
  id: number;
  customer_name: string;
  hasReview: boolean;
}

export const useReviewNotifications = () => {
  const { user } = useAuth();
  const [pendingReviews, setPendingReviews] = useState<CompletedBooking[]>([]);
  const [currentReviewBooking, setCurrentReviewBooking] = useState<CompletedBooking | null>(null);

  // Check for completed bookings without reviews
  const checkForCompletedBookings = async () => {
    if (!user) return;

    try {
      // Get completed bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, customer_name, status')
        .eq('customer_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;

      if (!bookings || bookings.length === 0) return;

      // Get existing reviews for these bookings
      const bookingIds = bookings.map(b => b.id);
      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('booking_id')
        .in('booking_id', bookingIds);

      if (reviewsError) throw reviewsError;

      // Find bookings without reviews
      const reviewedBookingIds = new Set(reviews?.map(r => r.booking_id) || []);
      const completedWithoutReviews = bookings
        .filter(booking => !reviewedBookingIds.has(booking.id))
        .map(booking => ({
          id: booking.id,
          customer_name: booking.customer_name,
          hasReview: false
        }));

      setPendingReviews(completedWithoutReviews);

      // Auto-show the first pending review if there is one
      if (completedWithoutReviews.length > 0 && !currentReviewBooking) {
        setCurrentReviewBooking(completedWithoutReviews[0]);
      }
    } catch (error) {
      console.error('Error checking for completed bookings:', error);
    }
  };

  // Listen for booking status changes using Supabase realtime
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('booking-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `customer_id=eq.${user.id}`,
        },
        (payload) => {
          // Check if booking status changed to completed
          if (payload.new.status === 'completed' && payload.old.status !== 'completed') {
            // Add a small delay to ensure UI updates are complete
            setTimeout(() => {
              checkForCompletedBookings();
            }, 1000);
          }
        }
      )
      .subscribe();

    // Initial check
    checkForCompletedBookings();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const dismissCurrentReview = () => {
    if (!currentReviewBooking) return;
    
    // Remove current booking from pending reviews
    setPendingReviews(prev => prev.filter(b => b.id !== currentReviewBooking.id));
    
    // Show next pending review if available
    const remaining = pendingReviews.filter(b => b.id !== currentReviewBooking.id);
    setCurrentReviewBooking(remaining.length > 0 ? remaining[0] : null);
  };

  const markReviewCompleted = () => {
    if (!currentReviewBooking) return;
    
    // Remove from pending reviews
    setPendingReviews(prev => prev.filter(b => b.id !== currentReviewBooking.id));
    
    // Show next pending review if available
    const remaining = pendingReviews.filter(b => b.id !== currentReviewBooking.id);
    setCurrentReviewBooking(remaining.length > 0 ? remaining[0] : null);
  };

  return {
    currentReviewBooking,
    pendingReviewsCount: pendingReviews.length,
    dismissCurrentReview,
    markReviewCompleted,
    refreshPendingReviews: checkForCompletedBookings
  };
}; 