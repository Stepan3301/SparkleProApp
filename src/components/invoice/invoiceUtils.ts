import { InvoiceData } from './InvoiceGenerator';
import { supabase } from '../../lib/supabase';

// Transform booking data to invoice format
export const transformBookingToInvoice = async (booking: any): Promise<InvoiceData> => {
  // Generate booking number if not exists
  const bookingNumber = `SP${String(booking.id).padStart(6, '0')}`;
  
  // Format dates
  const serviceDate = new Date(booking.service_date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  
  const invoiceDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  
  const createdAt = new Date(booking.created_at).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  
  // Format service time
  const serviceTime = booking.service_time || '09:00';
  
  // Get customer info
  const customerName = booking.customer_name || booking.profile?.full_name || 'Customer';
  const customerPhone = booking.customer_phone || booking.profile?.phone_number || '';
  
  // Fetch proper address from addresses table
  let customerAddress = 'Address not provided';
  if (booking.address_id) {
    try {
      const { data: addressData, error } = await supabase
        .from('addresses')
        .select('street, city, emirate, country')
        .eq('id', booking.address_id)
        .single();
      
      if (!error && addressData) {
        customerAddress = [
          addressData.street,
          addressData.city,
          addressData.emirate,
          addressData.country
        ].filter(Boolean).join(', ');
      }
    } catch (error) {
      console.warn('Could not fetch address:', error);
    }
  }
  
  // Fallback to custom address if no address_id
  if (customerAddress === 'Address not provided') {
    customerAddress = booking.custom_address || booking.service_address || 'Address not provided';
  }
  
  // Get service details
  const serviceName = booking.service_name || 'Cleaning Service';
  const cleaners = booking.cleaners_count || booking.selected_cleaners || booking.cleaners || booking.number_of_cleaners || 1;
  const hours = booking.duration_hours || booking.hours || booking.service_hours || 2;
  const materials = booking.own_materials ? 'own' : 'provided';
  
  // Process additional services
  const additionalServices: Array<{
    name: string;
    price: number;
    quantity?: number;
  }> = [];
  if (booking.detailed_addons && booking.detailed_addons.length > 0) {
    booking.detailed_addons.forEach((addon: any) => {
      additionalServices.push({
        name: addon.name,
        price: parseFloat(addon.price) || parseFloat(addon.unit_price) || 0,
        quantity: addon.quantity || 1
      });
    });
  }
  
  // Calculate pricing
  const totalCost = parseFloat(booking.total_cost) || 0;
  const vatAmount = parseFloat(booking.vat_amount) || 0;
  const cashFee = parseFloat(booking.cash_fee) || 0;
  
  // Calculate subtotal (total - vat - cash fee)
  const subtotal = totalCost - vatAmount - cashFee;
  
  return {
    // Booking information
    bookingId: booking.id.toString(),
    bookingNumber,
    serviceName,
    serviceDate,
    serviceTime,
    status: booking.status || 'completed',
    
    // Customer information
    customerName,
    customerPhone,
    customerAddress,
    
    // Service details
    cleaners,
    hours,
    materials,
    
    // Additional services
    additionalServices,
    
    // Pricing
    subtotal: Math.max(0, subtotal),
    vatAmount,
    cashFee,
    totalCost,
    
    // Dates
    createdAt,
    invoiceDate
  };
};

// Generate filename for PDF download
export const generateInvoiceFilename = (bookingNumber: string, customerName: string): string => {
  const sanitizedCustomerName = customerName.replace(/[^a-zA-Z0-9]/g, '_');
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  return `Invoice_${bookingNumber}_${sanitizedCustomerName}_${date}.pdf`;
};
