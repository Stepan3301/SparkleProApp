import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

// ✅ Fetch active bookings function
const fetchActiveBookings = async (userId: string) => {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      services (
        id,
        name,
        description,
        base_price,
        price_per_hour
      ),
      structured_addons (
        id,
        name,
        price,
        quantity
      )
    `)
    .eq('customer_id', userId)
    .in('status', ['pending', 'confirmed'])
    .order('service_date', { ascending: true });

  if (error) throw new Error(error.message);
  return data;
};

// ✅ Fetch booking history function
const fetchBookingHistory = async (userId: string) => {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      services (
        id,
        name,
        description,
        base_price,
        price_per_hour
      ),
      structured_addons (
        id,
        name,
        price,
        quantity
      )
    `)
    .eq('customer_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
};

// ✅ Fetch all bookings for admin
const fetchAllBookings = async () => {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      services (
        id,
        name,
        description,
        base_price,
        price_per_hour
      ),
      structured_addons (
        id,
        name,
        price,
        quantity
      ),
      profiles (
        id,
        full_name,
        phone,
        email
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
};

// ✅ Hook for active bookings
export const useActiveBookings = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['activeBookings', userId],
    queryFn: () => fetchActiveBookings(userId!),
    enabled: !!userId, // Only run query if userId exists
    staleTime: 1000 * 60 * 2, // Data is fresh for 2 minutes
    gcTime: 1000 * 60 * 10, // Cache for 10 minutes
  });
};

// ✅ Hook for booking history
export const useBookingHistory = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['bookingHistory', userId],
    queryFn: () => fetchBookingHistory(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
  });
};

// ✅ Hook for all bookings (admin)
export const useAllBookings = (isAdmin: boolean) => {
  return useQuery({
    queryKey: ['allBookings'],
    queryFn: fetchAllBookings,
    enabled: isAdmin, // Only run for admin users
    staleTime: 1000 * 60 * 1, // Fresher data for admin (1 minute)
    gcTime: 1000 * 60 * 5,
  });
};

// ✅ Hook for canceling booking
export const useCancelBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingId: number) => {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      // Automatically refresh cache after successful cancellation
      queryClient.invalidateQueries({ queryKey: ['activeBookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookingHistory'] });
      queryClient.invalidateQueries({ queryKey: ['allBookings'] });
    },
  });
};

// ✅ Hook for rescheduling booking
export const useRescheduleBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      bookingId, 
      newDate, 
      newTime 
    }: { 
      bookingId: number; 
      newDate: string; 
      newTime: string; 
    }) => {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          service_date: newDate,
          service_time: newTime 
        })
        .eq('id', bookingId);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      // Automatically refresh cache after successful reschedule
      queryClient.invalidateQueries({ queryKey: ['activeBookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookingHistory'] });
      queryClient.invalidateQueries({ queryKey: ['allBookings'] });
    },
  });
};

// ✅ Hook for creating booking
export const useCreateBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingData: any) => {
      const { data, error } = await supabase
        .from('bookings')
        .insert([bookingData])
        .select();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      // Automatically refresh cache after successful creation
      queryClient.invalidateQueries({ queryKey: ['activeBookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookingHistory'] });
      queryClient.invalidateQueries({ queryKey: ['allBookings'] });
    },
  });
};

