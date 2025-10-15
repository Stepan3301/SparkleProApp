import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

// ✅ Fetch all services function
const fetchServices = async () => {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('id', { ascending: true });

  if (error) throw new Error(error.message);
  return data;
};

// ✅ Fetch service inclusions function
const fetchServiceInclusions = async (serviceId: number) => {
  const { data, error } = await supabase
    .from('service_inclusions')
    .select('*')
    .eq('service_id', serviceId)
    .order('display_order');

  if (error) throw new Error(error.message);
  return data;
};

// ✅ Fetch structured addons function
const fetchStructuredAddons = async () => {
  const { data, error } = await supabase
    .from('structured_addons')
    .select('*')
    .order('category', { ascending: true });

  if (error) throw new Error(error.message);
  return data;
};

// ✅ Hook for all services
export const useServices = () => {
  return useQuery({
    queryKey: ['services'],
    queryFn: fetchServices,
    staleTime: 1000 * 60 * 5, // Services data is fresh for 5 minutes
    gcTime: 1000 * 60 * 30, // Cache services for 30 minutes (rarely changes)
  });
};

// ✅ Hook for service inclusions
export const useServiceInclusions = (serviceId: number | undefined) => {
  return useQuery({
    queryKey: ['serviceInclusions', serviceId],
    queryFn: () => fetchServiceInclusions(serviceId!),
    enabled: !!serviceId, // Only run if serviceId exists
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
};

// ✅ Hook for structured addons
export const useStructuredAddons = () => {
  return useQuery({
    queryKey: ['structuredAddons'],
    queryFn: fetchStructuredAddons,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
};

