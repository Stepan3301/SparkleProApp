import React from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/OptimizedAuthContext';
import Button from './Button';

const TestReviewButton: React.FC = () => {
  const { user } = useAuth();

  const simulateBookingCompletion = async () => {
    if (!user) {
      alert('Please log in first');
      return;
    }

    try {
      // Find the most recent pending or confirmed booking for this user
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('id, status')
        .eq('customer_id', user.id)
        .in('status', ['pending', 'confirmed', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (!bookings || bookings.length === 0) {
        alert('No pending bookings found to complete');
        return;
      }

      const booking = bookings[0];

      // Update the booking status to completed
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'completed' })
        .eq('id', booking.id);

      if (updateError) throw updateError;

      alert(`Booking ${booking.id} marked as completed! Review notification should appear.`);
    } catch (error) {
      console.error('Error simulating booking completion:', error);
      alert('Error simulating booking completion');
    }
  };

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <Button
        variant="secondary"
        shape="bubble"
        size="sm"
        onClick={simulateBookingCompletion}
        className="!bg-yellow-500 hover:!bg-yellow-600 !text-white"
      >
        🧪 Test Review
      </Button>
    </div>
  );
};

export default TestReviewButton; 