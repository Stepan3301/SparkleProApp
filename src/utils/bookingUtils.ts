import { Booking, BookingStatus } from '../types/booking';

/**
 * Check if a booking can be cancelled based on business rules:
 * 1. Must be more than 24 hours before the service date/time
 * 2. Must have status "pending" or "confirmed" (not in_progress, completed, or cancelled)
 */
export const canCancelBooking = (booking: Booking): boolean => {
  // Check status - only allow cancellation for pending or confirmed bookings
  const allowedStatuses: BookingStatus[] = ['pending', 'confirmed'];
  if (!allowedStatuses.includes(booking.status)) {
    return false;
  }

  // Check if booking is more than 24 hours away
  const now = new Date();
  const serviceDateTime = new Date(`${booking.service_date}T${booking.service_time}`);
  const timeDifferenceMs = serviceDateTime.getTime() - now.getTime();
  const timeDifferenceHours = timeDifferenceMs / (1000 * 60 * 60);

  // Must be more than 24 hours before service
  return timeDifferenceHours > 24;
};

/**
 * Get a human-readable reason why cancellation is not allowed
 */
export const getCancellationBlockedReason = (booking: Booking): string => {
  const allowedStatuses: BookingStatus[] = ['pending', 'confirmed'];
  if (!allowedStatuses.includes(booking.status)) {
    switch (booking.status) {
      case 'in_progress':
        return 'Cannot cancel booking that is currently in progress';
      case 'completed':
        return 'Cannot cancel completed booking';
      case 'cancelled':
        return 'Booking is already cancelled';
      default:
        return 'Cannot cancel booking with current status';
    }
  }

  const now = new Date();
  const serviceDateTime = new Date(`${booking.service_date}T${booking.service_time}`);
  const timeDifferenceMs = serviceDateTime.getTime() - now.getTime();
  const timeDifferenceHours = timeDifferenceMs / (1000 * 60 * 60);

  if (timeDifferenceHours <= 24) {
    if (timeDifferenceHours <= 0) {
      return 'Cannot cancel booking after service time has passed';
    }
    return `Cannot cancel booking less than 24 hours before service (${Math.round(timeDifferenceHours)} hours remaining)`;
  }

  return 'Cancellation not allowed';
};

/**
 * Format time remaining until service
 */
export const getTimeUntilService = (booking: Booking): string => {
  const now = new Date();
  const serviceDateTime = new Date(`${booking.service_date}T${booking.service_time}`);
  const timeDifferenceMs = serviceDateTime.getTime() - now.getTime();
  
  if (timeDifferenceMs <= 0) {
    return 'Service time has passed';
  }

  const days = Math.floor(timeDifferenceMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeDifferenceMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeDifferenceMs % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} and ${hours} hour${hours !== 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''} and ${minutes} minute${minutes !== 1 ? 's' : ''}`;
  } else {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
};
