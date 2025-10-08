import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/OptimizedAuthContext';
import { supabase } from '../../lib/supabase';
import { useSimpleTranslation } from '../../utils/i18n';
// Removed useNotifications import as it's no longer needed
import DirhamIcon from '../../components/ui/DirhamIcon';
// Removed unused import: Button
import { 
  ArrowRightOnRectangleIcon,
  ClipboardDocumentListIcon,
  UsersIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import SupportChat from './SupportChat';
import { StaffManagement } from '../../components/admin/StaffManagement';
import { AssignStaffModal } from '../../components/admin/AssignStaffModal';
import { AddCleanerModal } from '../../components/admin/AddCleanerModal';

interface DashboardStats {
  totalBookings: number;
  activeBookings: number;
  completedToday: number;
  totalRevenue: number;
  monthlyRevenue: number;
  monthlyCompletedOrders: number;
  avgRating: number;
  totalUsers: number;
  newUsersThisMonth: number;
  activeClients: number;
  satisfaction: number;
}

interface Booking {
  id: number;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  property_size: string;
  service_date: string;
  service_time: string;
  total_cost: number;
  status: string;
  created_at: string;
  additional_notes?: string;
  cleaners_count?: number;
  own_materials?: boolean;
  address_id?: number;
  custom_address?: string;
  addons?: any;
  base_price?: number;
  addons_total?: number;
  street?: string; // For fetched address info
  service_id?: number; // Service ID for fetching service name
  assigned_cleaners?: string[]; // Array of cleaner IDs
  assigned_cleaners_details?: Array<{
    id: string;
    name: string;
    phone?: string;
    sex?: string;
    avatar_url?: string;
    is_active: boolean;
  }>;
  detailed_addons?: Array<{
    id: number;
    name: string;
    description?: string;
    price: number;
    quantity: number;
    unit_price: number;
  }>;
}

interface User {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  role: string;
  created_at: string;
}

const AdminDashboard: React.FC = () => {
  const { signOut, profile } = useAuth();
  const { t } = useSimpleTranslation();

  // Handle logout with error handling
  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout by clearing local state and redirecting
      window.location.href = '/auth';
    }
  };
  // Removed notification-related hooks as they're no longer needed
  const [activeTab, setActiveTab] = useState('orders');
  const [usersSubTab, setUsersSubTab] = useState('customers'); // 'customers' or 'staff'
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [unreadSupportCount, setUnreadSupportCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userBookings, setUserBookings] = useState<Booking[]>([]);
  const [isAssignStaffModalOpen, setIsAssignStaffModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [orderFilter, setOrderFilter] = useState<'all' | 'new' | 'processed'>('all');
  const [showModal, setShowModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();

    // Set up real-time updates every 15 seconds for admin dashboard
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Filter users based on search query
    if (userSearchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const query = userSearchQuery.toLowerCase();
      const filtered = users.filter(user => 
        (user.full_name || '').toLowerCase().includes(query) ||
        (user.email || '').toLowerCase().includes(query) ||
        (user.phone_number || '').toLowerCase().includes(query) ||
        user.id.toLowerCase().includes(query)
      );
      setFilteredUsers(filtered);
    }
  }, [userSearchQuery, users]);

  // Filter orders based on selected filter
  const filteredOrders = bookings.filter(booking => {
    if (orderFilter === 'new') {
      return booking.status === 'pending';
    } else if (orderFilter === 'processed') {
      return booking.status !== 'pending';
    }
    return true; // 'all' - show all orders
  });

  const fetchUnreadSupportCount = async () => {
    try {
      const { count, error } = await supabase
        .from('support_messages')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'unread');

      if (error) throw error;
      setUnreadSupportCount(count || 0);
    } catch (error) {
      console.error('Error fetching unread support count:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      // Fetch services first, then other data
      await fetchServices();
      await Promise.all([
        fetchStats(),
        fetchBookings(),
        fetchUsers(),
        fetchUnreadSupportCount()
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch booking stats with total_cost (includes VAT and fees)
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('status, total_cost, created_at');

      if (bookingsError) {
        console.error('Error fetching bookings for stats:', bookingsError);
        return;
      }

      // Fetch users stats - only use columns that exist in your database
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('role, member_since');

      if (usersError) {
        console.error('Error fetching users for stats:', usersError);
        return;
      }

      if (bookingsData && usersData) {
        const today = new Date().toDateString();
        const thisMonth = new Date().toISOString().slice(0, 7);

        const totalBookings = bookingsData.length;
        
        // Active orders: pending and confirmed statuses
        const activeBookings = bookingsData.filter(b => 
          ['pending', 'confirmed'].includes(b.status)
        ).length;
        
        const completedToday = bookingsData.filter(b => 
          b.status === 'completed' && new Date(b.created_at).toDateString() === today
        ).length;
        
        // Total revenue: sum of total_cost for all orders except cancelled
        const totalRevenue = bookingsData
          .filter(b => b.status !== 'cancelled')
          .reduce((sum, b) => sum + (b.total_cost || 0), 0);
        
        // Monthly revenue: sum of total_cost for all orders this month except cancelled
        const monthlyRevenue = bookingsData
          .filter(b => 
            b.status !== 'cancelled' && 
            b.created_at.startsWith(thisMonth)
          )
          .reduce((sum, b) => sum + (b.total_cost || 0), 0);
        
        // Monthly completed orders count
        const monthlyCompletedOrders = bookingsData.filter(b => 
          b.status === 'completed' && b.created_at.startsWith(thisMonth)
        ).length;
        
        const totalUsers = usersData.length;
        const newUsersThisMonth = usersData.filter(u => 
          u.member_since && u.member_since.startsWith(thisMonth)
        ).length;
        const activeClients = usersData.filter(u => u.role === 'customer').length;

        setStats({
          totalBookings,
          activeBookings,
          completedToday,
          totalRevenue,
          monthlyRevenue,
          monthlyCompletedOrders,
          avgRating: 0, // Skip for now as requested
          totalUsers,
          newUsersThisMonth,
          activeClients,
          satisfaction: 0 // Skip for now as requested
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      console.log('📡 fetchBookings: Starting to fetch bookings...');
      
      // First, fetch all bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (bookingsError) {
        console.error('❌ fetchBookings: Error fetching bookings:', bookingsError);
        throw bookingsError;
      }

      console.log('✅ fetchBookings: Bookings fetched successfully:', bookingsData?.length);

      // Process each booking to fetch related data
      const bookingsWithDetails = await Promise.all(
        (bookingsData || []).map(async (booking) => {
          let updatedBooking = { ...booking };
          
          // Fetch additional services through the junction table
          try {
            const { data: addonsData, error: addonsError } = await supabase
              .from('booking_additional_services')
              .select(`
                id,
                quantity,
                unit_price,
                total_price,
                additional_services (
                  id,
                  name,
                  description,
                  price
                )
              `)
              .eq('booking_id', booking.id);

            if (addonsError) {
              console.warn('⚠️ fetchBookings: Error fetching addons for booking', booking.id, ':', addonsError);
              updatedBooking.detailed_addons = [];
            } else if (addonsData && addonsData.length > 0) {
              // Flatten the data structure
              updatedBooking.detailed_addons = addonsData.map((item: any) => ({
                id: item.additional_services.id,
                name: item.additional_services.name,
                description: item.additional_services.description,
                price: item.additional_services.price,
                quantity: item.quantity,
                unit_price: item.unit_price,
                total_price: item.total_price
              }));
              console.log('✅ fetchBookings: Processed addons for booking', booking.id, ':', updatedBooking.detailed_addons);
            } else {
              updatedBooking.detailed_addons = [];
            }
          } catch (error) {
            console.warn('⚠️ fetchBookings: Failed to fetch addons for booking', booking.id, ':', error);
            updatedBooking.detailed_addons = [];
          }
          
          // Fetch address information
          if (booking.address_id) {
            try {
              const { data: addressData } = await supabase
                .from('addresses')
                .select('street')
                .eq('id', booking.address_id)
                .single();
              updatedBooking.street = addressData?.street;
            } catch {
              // Address fetch failed, continue without it
            }
          }
          
          // Fetch assigned cleaners details
          if (booking.assigned_cleaners && booking.assigned_cleaners.length > 0) {
            try {
              const { data: cleanersData } = await supabase
                .from('cleaners')
                .select('id, name, phone, sex, avatar_url, is_active')
                .in('id', booking.assigned_cleaners);
              updatedBooking.assigned_cleaners_details = cleanersData || [];
              console.log('✅ fetchBookings: Cleaners fetched for booking', booking.id, ':', cleanersData?.length);
            } catch {
              // Cleaners fetch failed, continue without them
              updatedBooking.assigned_cleaners_details = [];
            }
          } else {
            updatedBooking.assigned_cleaners_details = [];
          }
          
          return updatedBooking;
        })
      );
      
      setBookings(bookingsWithDetails || []);
      console.log('✅ fetchBookings: All bookings processed and set successfully');
    } catch (error) {
      console.error('❌ fetchBookings: Error fetching bookings:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      // Fetch profiles with user emails from auth metadata
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return;
      }

      // Use profile data directly - email will be 'N/A' since we can't access auth.users from client
      const usersWithEmails = (profilesData || []).map((profile) => ({
        ...profile,
        email: 'N/A', // Email not available without server-side admin privileges
        created_at: profile.created_at
      }));

      setUsers(usersWithEmails);
      setFilteredUsers(usersWithEmails);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('id, name');

      if (error) {
        console.error('Error fetching services:', error);
        return;
      }

      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const fetchUserBookings = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          customer_id,
          customer_name,
          customer_phone,
          property_size,
          service_date,
          service_time,
          total_cost,
          status,
          created_at,
          additional_notes,
          address_id,
          custom_address,
          service_id
        `)
        .eq('customer_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserBookings(data || []);
    } catch (error) {
      console.error('Error fetching user bookings:', error);
      setUserBookings([]);
    }
  };

  const refreshSelectedBooking = async () => {
    if (!selectedBooking) {
      console.log('❌ refreshSelectedBooking: No selectedBooking to refresh');
      return;
    }
    
    console.log('🔄 refreshSelectedBooking: Starting refresh for booking ID:', selectedBooking.id);
    
    try {
      // Fetch updated booking data
      console.log('📡 refreshSelectedBooking: Fetching booking data from bookings table...');
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', selectedBooking.id)
        .single();

      if (bookingError) {
        console.error('❌ refreshSelectedBooking: Error fetching booking data:', bookingError);
        throw bookingError;
      }
      
      console.log('✅ refreshSelectedBooking: Booking data fetched successfully:', bookingData);
      console.log('🧹 refreshSelectedBooking: Assigned cleaners from DB:', bookingData.assigned_cleaners);
      
      let updatedBooking = { ...bookingData };
      
      // Fetch additional services through the junction table
      try {
        const { data: addonsData, error: addonsError } = await supabase
          .from('booking_additional_services')
          .select(`
            id,
            quantity,
            unit_price,
            total_price,
            additional_services (
              id,
              name,
              description,
              price
            )
          `)
          .eq('booking_id', selectedBooking.id);

        if (addonsError) {
          console.warn('⚠️ refreshSelectedBooking: Error fetching addons:', addonsError);
          updatedBooking.detailed_addons = [];
        } else if (addonsData && addonsData.length > 0) {
          // Flatten the data structure
          updatedBooking.detailed_addons = addonsData.map((item: any) => ({
            id: item.additional_services.id,
            name: item.additional_services.name,
            description: item.additional_services.description,
            price: item.additional_services.price,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price
          }));
          console.log('📦 refreshSelectedBooking: Processed additional services:', updatedBooking.detailed_addons);
        } else {
          updatedBooking.detailed_addons = [];
        }
      } catch (error) {
        console.warn('⚠️ refreshSelectedBooking: Failed to fetch addons:', error);
        updatedBooking.detailed_addons = [];
      }
      
      // Fetch address information
      if (bookingData.address_id) {
        try {
          console.log('🏠 refreshSelectedBooking: Fetching address data for address_id:', bookingData.address_id);
          const { data: addressData } = await supabase
            .from('addresses')
            .select('street')
            .eq('id', bookingData.address_id)
            .single();
          updatedBooking.street = addressData?.street;
          console.log('✅ refreshSelectedBooking: Address data fetched:', addressData?.street);
        } catch (error) {
          console.warn('⚠️ refreshSelectedBooking: Address fetch failed:', error);
        }
      }
      
      // Fetch assigned cleaners details
      if (bookingData.assigned_cleaners && bookingData.assigned_cleaners.length > 0) {
        try {
          console.log('👥 refreshSelectedBooking: Fetching cleaners details for IDs:', bookingData.assigned_cleaners);
          const { data: cleanersData, error: cleanersError } = await supabase
            .from('cleaners')
            .select('id, name, phone, sex, avatar_url, is_active')
            .in('id', bookingData.assigned_cleaners);
          
          if (cleanersError) {
            console.error('❌ refreshSelectedBooking: Error fetching cleaners data:', cleanersError);
            updatedBooking.assigned_cleaners_details = [];
          } else {
            console.log('✅ refreshSelectedBooking: Cleaners data fetched successfully:', cleanersData);
            updatedBooking.assigned_cleaners_details = cleanersData || [];
          }
        } catch (error) {
          console.error('❌ refreshSelectedBooking: Cleaners fetch failed:', error);
          updatedBooking.assigned_cleaners_details = [];
        }
      } else {
        console.log('ℹ️ refreshSelectedBooking: No assigned cleaners found, setting empty array');
        updatedBooking.assigned_cleaners_details = [];
      }
      
      console.log('🔄 refreshSelectedBooking: Final updated booking data:', updatedBooking);
      console.log('👥 refreshSelectedBooking: Final assigned_cleaners_details:', updatedBooking.assigned_cleaners_details);
      
      // Update the selected booking with fresh data
      setSelectedBooking(updatedBooking);
      console.log('✅ refreshSelectedBooking: Selected booking state updated successfully');
    } catch (error) {
      console.error('❌ refreshSelectedBooking: Error refreshing selected booking:', error);
    }
  };

  const viewBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowModal(true);
  };

  const viewUser = async (user: User) => {
    // Reset state first to ensure clean modal opening
    setSelectedUser(null);
    setUserBookings([]);
    setShowUserModal(false);
    
    // Small delay to ensure state is reset
    setTimeout(async () => {
      setSelectedUser(user);
      await fetchUserBookings(user.id);
      setShowUserModal(true);
    }, 50);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedBooking(null);
  };

  const closeUserModal = () => {
    setShowUserModal(false);
    setSelectedUser(null);
    setUserBookings([]);
  };

  const updateBookingStatus = async (bookingId: number, newStatus: string) => {
    setUpdatingStatus(bookingId);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) throw error;

      // Update local state
      setBookings(prev => prev.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: newStatus }
          : booking
      ));

      // Update selected booking if it's the one being updated
      if (selectedBooking?.id === bookingId) {
        setSelectedBooking(prev => prev ? { ...prev, status: newStatus } : null);
      }

      // Send notification to customer about status change
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_BASE_URL}/api/push/order-status-change`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customerId: selectedBooking?.customer_id,
            orderId: bookingId,
            newStatus: newStatus,
            orderDetails: {
              customer_name: selectedBooking?.customer_name,
              service_date: selectedBooking?.service_date,
              total_cost: selectedBooking?.total_cost
            }
          })
        });

        if (response.ok) {
          console.log('Customer notification sent successfully');
        } else {
          console.log('Failed to send customer notification');
        }
      } catch (error) {
        console.error('Error sending customer notification:', error);
        // Don't fail the status update if notification fails
      }

      // Refresh stats
      fetchStats();
    } catch (error) {
      console.error('Error updating booking status:', error);
      alert('Error updating booking status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const getStatusOptions = () => {
    return ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number, iconColor: 'black' | 'white' | 'inherit' = 'white') => {
    return (
      <span className="flex items-center gap-1">
        <DirhamIcon size="sm" color={iconColor} />
        {amount.toFixed(2)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="max-w-md mx-auto p-4">
        {/* Header */}
        <div className="bg-white p-4 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="text-xl font-bold text-emerald-600">🧽 SparklePro Admin</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {profile?.full_name?.charAt(0) || 'A'}
                </span>
              </div>
              <span className="text-sm font-medium text-gray-700">{profile?.full_name || 'Admin'}</span>
              <button
                onClick={handleLogout}
                className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs hover:text-gray-800 transition-colors focus:outline-none"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white mb-6">
          <div className="p-6">
            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-6 text-center">Orders Management</h2>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-emerald-500 text-white p-4 rounded-lg text-center">
                    <div className="text-xl font-bold">{stats?.activeBookings || 0}</div>
                    <div className="text-xs opacity-90">Active Orders</div>
                  </div>
                  <div className="bg-sky-500 text-white p-4 rounded-lg text-center">
                    <div className="text-xl font-bold">{stats?.completedToday || 0}</div>
                    <div className="text-xs opacity-90">Completed Today</div>
                  </div>
                  <div className="bg-emerald-500 text-white p-4 rounded-lg text-center">
                    <div className="text-xl font-bold">{stats ? formatCurrency(stats.totalRevenue) : <span className="flex items-center gap-1"><DirhamIcon size="sm" color="white" />0</span>}</div>
                    <div className="text-xs opacity-90">Total Revenue</div>
                  </div>
                  <div className="bg-sky-500 text-white p-4 rounded-lg text-center">
                    <div className="text-xl font-bold">{stats?.avgRating || 0}</div>
                    <div className="text-xs opacity-90">Avg Rating</div>
                  </div>
                </div>

                {/* Order Filter Buttons */}
                <div className="flex gap-2 mb-6 justify-center">
                  <button
                    onClick={() => setOrderFilter('all')}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors focus:outline-none ${
                      orderFilter === 'all'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:text-emerald-600'
                    }`}
                  >
                    All Orders
                  </button>
                  <button
                    onClick={() => setOrderFilter('new')}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors focus:outline-none ${
                      orderFilter === 'new'
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:text-orange-600'
                    }`}
                  >
                    New (Pending)
                  </button>
                  <button
                    onClick={() => setOrderFilter('processed')}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors focus:outline-none ${
                      orderFilter === 'processed'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    Processed
                  </button>
                </div>

                {/* Bookings List */}
                <div className="space-y-4">
                  {services.length === 0 && (
                    <div className="text-center text-gray-500 py-4">
                      Loading services...
                    </div>
                  )}
                  {filteredOrders.map((booking) => (
                    <div 
                      key={booking.id} 
                      className="bg-gray-50 border border-gray-200 rounded-lg p-4 border-l-4 border-l-emerald-500 cursor-pointer hover:border-l-emerald-600 transition-colors focus:outline-none"
                      onClick={() => viewBooking(booking)}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="font-semibold text-emerald-600 text-sm">#{booking.id}</div>
                        {getStatusBadge(booking.status)}
                      </div>
                      
                      <div className="space-y-2 text-sm mb-4">
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-medium">Client:</span>
                          <span className="text-gray-800 font-semibold">{booking.customer_name || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-medium">Service:</span>
                          <span className="text-gray-800 font-semibold">
                            {(() => {
                              if (booking.service_id) {
                                const service = services.find(s => s.id === booking.service_id);
                                return service ? service.name : `${booking.property_size || 'Unknown'} Property`;
                              } else {
                                return `${booking.property_size || 'Unknown'} Property`;
                              }
                            })()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-medium">Date:</span>
                          <span className="text-gray-800 font-semibold">{formatDate(booking.service_date)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-medium">Amount:</span>
                          <span className="text-gray-800 font-semibold">{formatCurrency(booking.total_cost || 0)}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent card click when button is clicked
                            viewBooking(booking);
                          }}
                          className="flex items-center gap-1 px-3 py-1 bg-sky-500 text-white rounded-lg text-xs hover:bg-sky-600 transition-colors"
                        >
                          <EyeIcon className="w-3 h-3" />
                          View
                        </button>
                        <div className="relative">
                          <select
                            value={booking.status}
                            onChange={(e) => updateBookingStatus(booking.id, e.target.value)}
                            disabled={updatingStatus === booking.id}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1 rounded-lg text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {getStatusOptions().map((status) => (
                              <option key={status} value={status} className="text-black">
                                {status.replace('_', ' ').toUpperCase()}
                              </option>
                            ))}
                          </select>
                          {updatingStatus === booking.id && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="pb-8">
                {/* Title */}
                <h1 className="text-lg font-bold text-slate-800 mb-3 text-center">Users Management</h1>
                
                {/* Segmented Control with SparklePro styling */}
                <div className="relative grid grid-cols-2 bg-emerald-50 border border-emerald-200 rounded-2xl overflow-hidden max-w-md mx-auto mb-3">
                  <button
                    onClick={() => setUsersSubTab('customers')}
                    className={`relative py-2.5 px-4 font-black text-sm transition-colors duration-200 focus:outline-none user-select-none ${
                      usersSubTab === 'customers'
                        ? 'bg-white text-emerald-600 shadow-lg shadow-emerald-100 z-10'
                        : 'text-slate-600 hover:text-emerald-600'
                    }`}
                  >
                    Customers
                  </button>
                  <button
                    onClick={() => setUsersSubTab('staff')}
                    className={`relative py-2.5 px-4 font-black text-sm transition-colors duration-200 focus:outline-none user-select-none ${
                      usersSubTab === 'staff'
                        ? 'bg-white text-emerald-600 shadow-lg shadow-emerald-100 z-10'
                        : 'text-slate-600 hover:text-emerald-600'
                    }`}
                  >
                    Staff
                  </button>
                </div>

                {/* Stats Cards - Customers */}
                <div className={`grid grid-cols-2 gap-2.5 mb-3 ${usersSubTab === 'staff' ? 'hidden' : ''}`}>
                  <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-lg shadow-slate-100/50">
                    <div className="text-xl font-black text-slate-800">{stats?.totalUsers || 0}</div>
                    <div className="text-xs text-slate-500 mt-0.5 font-medium">Total Users</div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-lg shadow-slate-100/50">
                    <div className="text-xl font-black text-slate-800">{stats?.newUsersThisMonth || 0}</div>
                    <div className="text-xs text-slate-500 mt-0.5 font-medium">New This Month</div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-lg shadow-slate-100/50">
                    <div className="text-xl font-black text-slate-800">{stats?.activeClients || 0}</div>
                    <div className="text-xs text-slate-500 mt-0.5 font-medium">Active Clients</div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-lg shadow-slate-100/50">
                    <div className="text-xl font-black text-slate-800">{stats?.satisfaction || 0}%</div>
                    <div className="text-xs text-slate-500 mt-0.5 font-medium">Satisfaction</div>
                  </div>
                </div>

                {/* Stats Cards - Staff */}
                <div className={`grid grid-cols-2 gap-2.5 mb-3 ${usersSubTab === 'customers' ? 'hidden' : ''}`}>
                  <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-lg shadow-slate-100/50">
                    <div className="text-xl font-black text-slate-800">7</div>
                    <div className="text-xs text-slate-500 mt-0.5 font-medium">Total Staff</div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-lg shadow-slate-100/50">
                    <div className="text-xl font-black text-slate-800">7</div>
                    <div className="text-xs text-slate-500 mt-0.5 font-medium">Active Staff</div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-lg shadow-slate-100/50">
                    <div className="text-xl font-black text-slate-800">0</div>
                    <div className="text-xs text-slate-500 mt-0.5 font-medium">Inactive</div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-lg shadow-slate-100/50">
                    <div className="text-xl font-black text-slate-800">3</div>
                    <div className="text-xs text-slate-500 mt-0.5 font-medium">Female Staff</div>
                  </div>
                </div>

                {/* Toolbar */}
                <div className="flex gap-2.5 items-center mb-4">
                  <div className="flex-1 flex items-center gap-2.5 bg-white border border-slate-200 rounded-xl px-3 py-2.5 shadow-sm">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search users by name, email, phone, or ID…"
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="flex-1 border-0 outline-none text-sm text-slate-700 placeholder-slate-400"
                    />
                  </div>
                  {usersSubTab === 'staff' && (
                    <button
                      onClick={() => setIsAddModalOpen(true)}
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-3 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 shadow-lg shadow-emerald-200/50 hover:shadow-xl hover:shadow-emerald-200/70 transition-all duration-200 focus:outline-none user-select-none"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14M5 12h14" />
                      </svg>
                      Add Cleaner
                    </button>
                  )}
                </div>

                {/* Customers List */}
                {usersSubTab === 'customers' && (
                  <div className="space-y-2.5">
                    {filteredUsers.slice(0, 20).map((user) => (
                      <div key={user.id} className="bg-white border border-slate-200 rounded-2xl p-3 shadow-lg shadow-slate-100/50">
                        <div className="flex items-center justify-between gap-2.5 mb-2">
                          <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                            CUSTOMER
                          </span>
                          <button
                            onClick={() => viewUser(user)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs px-3 py-1.5 rounded-full transition-colors duration-200 focus:outline-none user-select-none"
                          >
                            View
                          </button>
                        </div>
                        <div className="space-y-1.5">
                          <div className="font-black text-sm text-slate-800">#{user.id.slice(0, 8)}</div>
                          <div className="flex gap-2 text-xs">
                            <span className="text-slate-500 font-bold w-16 shrink-0">Name:</span>
                            <span className="flex-1 text-slate-700 font-medium">{user.full_name || 'N/A'}</span>
                          </div>
                          <div className="flex gap-2 text-xs">
                            <span className="text-slate-500 font-bold w-16 shrink-0">Phone:</span>
                            <span className="flex-1 text-slate-700 font-medium">{user.phone_number || 'N/A'}</span>
                          </div>
                          <div className="flex gap-2 text-xs">
                            <span className="text-slate-500 font-bold w-16 shrink-0">Email:</span>
                            <span className="flex-1 break-all text-slate-700 font-medium">{user.email}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {filteredUsers.length === 0 && userSearchQuery && (
                      <div className="text-center text-slate-500 py-8 font-medium">
                        No users found matching "{userSearchQuery}"
                      </div>
                    )}
                  </div>
                )}

                {/* Staff List */}
                {usersSubTab === 'staff' && (
                  <StaffManagement />
                )}
              </div>
            )}

            {/* Support Chat Tab */}
            {activeTab === 'support' && (
              <SupportChat />
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-6 text-center">Analytics Dashboard</h2>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-emerald-500 text-white p-4 rounded-lg text-center">
                    <div className="text-xl font-bold">{stats ? formatCurrency(stats.monthlyRevenue) : <span className="flex items-center gap-1"><DirhamIcon size="sm" color="white" />0</span>}</div>
                    <div className="text-xs opacity-90">Monthly Revenue</div>
                  </div>
                  <div className="bg-sky-500 text-white p-4 rounded-lg text-center">
                    <div className="text-xl font-bold">{stats?.monthlyCompletedOrders || 0}</div>
                    <div className="text-xs opacity-90">Orders This Month</div>
                  </div>
                  <div className="bg-emerald-500 text-white p-4 rounded-lg text-center">
                    <div className="text-xl font-bold">{stats?.avgRating || 0}</div>
                    <div className="text-xs opacity-90">Average Rating</div>
                  </div>
                  <div className="bg-sky-500 text-white p-4 rounded-lg text-center">
                    <div className="text-xl font-bold">{stats?.satisfaction || 0}%</div>
                    <div className="text-xs opacity-90">Customer Satisfaction</div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {bookings.slice(0, 5).map((booking) => (
                      <div key={booking.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                        <div>
                          <div className="font-medium text-gray-800">#{booking.id}</div>
                          <div className="text-sm text-gray-500">{booking.customer_name || 'N/A'}</div>
                        </div>
                        <div className="text-right text-sm">
                          <div className="font-semibold text-emerald-600">{formatCurrency(booking.total_cost || 0)}</div>
                          <div className="text-gray-500">{formatDate(booking.service_date)}</div>
                        </div>
                      </div>
                    ))}
                    {bookings.length === 0 && (
                      <div className="text-center text-gray-500 py-4">No recent bookings</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-6 text-center">Profile Settings</h2>
                
                <div className="space-y-6">

                  {/* Profile Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800">Account Information</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                      <input 
                        type="text" 
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" 
                        defaultValue={profile?.full_name || 'Administrator'} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                      <input 
                        type="tel" 
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" 
                        defaultValue={profile?.phone_number || ''} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                      <input 
                        type="password" 
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" 
                        placeholder="Enter current password" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                      <input 
                        type="password" 
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" 
                        placeholder="Enter new password" 
                      />
                    </div>
                    <button className="w-full bg-emerald-500 text-white py-3 rounded-lg font-medium hover:bg-emerald-600 transition-colors">
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Details Modal */}
      {showModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">{t('admin.bookingDetails', 'Booking Details')}</h2>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              {/* Booking Info */}
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">{t('admin.orderInformation', 'Order Information')}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('admin.orderId', 'Order ID')}:</span>
                      <span className="font-semibold">#{selectedBooking.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('admin.status', 'Status')}:</span>
                      {getStatusBadge(selectedBooking.status)}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('admin.serviceDate', 'Service Date')}:</span>
                      <span className="font-semibold">{formatDate(selectedBooking.service_date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('admin.serviceTime', 'Service Time')}:</span>
                      <span className="font-semibold">{selectedBooking.service_time}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('admin.propertySize', 'Property Size')}:</span>
                      <span className="font-semibold">{selectedBooking.property_size}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('admin.totalAmount', 'Total Amount')}:</span>
                      <span className="font-semibold text-indigo-600">{formatCurrency(selectedBooking.total_cost || 0, 'black')}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Customer Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-semibold">{selectedBooking.customer_name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-semibold">{selectedBooking.customer_phone || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Service Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('admin.serviceName', 'Service Name')}:</span>
                      <span className="font-semibold">
                        {selectedBooking.service_id ? 
                          (() => {
                            const service = services.find(s => s.id === selectedBooking.service_id);
                            return service ? service.name : 'Unknown Service';
                          })() : 
                          `${selectedBooking.property_size || 'Unknown'} Property Cleaning`
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('admin.cleaners', 'Cleaners')}:</span>
                      <span className="font-semibold">{selectedBooking.cleaners_count || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('admin.materials', 'Materials')}:</span>
                      <span className="font-semibold">{selectedBooking.own_materials ? 'Customer Provided' : 'Cleaner Provided'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('admin.basePrice', 'Base Price')}:</span>
                      <span className="font-semibold">{selectedBooking.base_price ? formatCurrency(selectedBooking.base_price, 'black') : 'N/A'}</span>
                    </div>
                    {selectedBooking.addons && selectedBooking.addons.length > 0 && (
                      <div>
                        <span className="text-gray-600">{t('admin.addons', 'Add-ons')}:</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {selectedBooking.addons.map((addon: any, index: number) => (
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
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Service Location</h3>
                  <div className="space-y-2 text-sm">
                    {selectedBooking.custom_address ? (
                      <div>
                        <span className="text-gray-600">Address:</span>
                        <p className="font-semibold mt-1">{selectedBooking.custom_address}</p>
                      </div>
                    ) : selectedBooking.street ? (
                      <div>
                        <span className="text-gray-600">Address:</span>
                        <p className="font-semibold mt-1">{selectedBooking.street}</p>
                      </div>
                    ) : (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Address ID:</span>
                        <span className="font-semibold">{selectedBooking.address_id || 'N/A'}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Services Section */}
                {selectedBooking.detailed_addons && selectedBooking.detailed_addons.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 mb-3">{t('admin.addons', 'Additional Services')}</h3>
                    <div className="space-y-2">
                      {selectedBooking.detailed_addons.map((addon: any, index: number) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-800">{addon.name}</span>
                            {addon.description && (
                              <p className="text-xs text-gray-600 mt-1">{addon.description}</p>
                            )}
                            <span className="text-xs text-gray-500">Qty: {addon.quantity}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-semibold text-gray-800">
                              {formatCurrency(addon.price, 'black')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Assigned Staff Section */}
                {(() => {
                  console.log('🔍 Assigned Staff Section: Checking if should render...');
                  console.log('🔍 Assigned Staff Section: selectedBooking.assigned_cleaners_details:', selectedBooking.assigned_cleaners_details);
                  console.log('🔍 Assigned Staff Section: Length check:', selectedBooking.assigned_cleaners_details?.length);
                  console.log('🔍 Assigned Staff Section: Should render:', selectedBooking.assigned_cleaners_details && selectedBooking.assigned_cleaners_details.length > 0);
                  
                  return selectedBooking.assigned_cleaners_details && selectedBooking.assigned_cleaners_details.length > 0 ? (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-800 mb-3">Assigned Staff</h3>
                      <div className="space-y-3">
                        {selectedBooking.assigned_cleaners_details.map((cleaner: any, index: number) => {
                          console.log('👤 Rendering cleaner:', cleaner);
                          return (
                            <div key={cleaner.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                                  {cleaner.avatar_url ? (
                                    <img
                                      src={cleaner.avatar_url}
                                      alt={cleaner.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                  )}
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-800">{cleaner.name}</div>
                                  {cleaner.phone && (
                                    <div className="text-sm text-gray-600">{cleaner.phone}</div>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  cleaner.is_active 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {cleaner.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-800 mb-3">Assigned Staff</h3>
                      <div className="text-sm text-gray-500 italic">
                        No staff assigned yet
                      </div>
                    </div>
                  );
                })()}

                {selectedBooking.additional_notes && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 mb-3">Additional Notes</h3>
                    <p className="text-sm text-gray-700">{selectedBooking.additional_notes}</p>
                  </div>
                )}

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Booking Timeline</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-semibold">{formatDate(selectedBooking.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 space-y-3">
                <div className="flex gap-3">
                  <button
                    onClick={closeModal}
                    className="flex-1 bg-gray-300 hover:text-gray-900 text-gray-800 py-2 px-4 rounded-lg font-medium transition-colors focus:outline-none"
                  >
                    Close
                  </button>
                  <select
                    value={selectedBooking.status}
                    onChange={(e) => {
                      updateBookingStatus(selectedBooking.id, e.target.value);
                      closeModal();
                    }}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                  >
                    {getStatusOptions().map((status) => (
                      <option key={status} value={status} className="text-black">
                        Update to {status.replace('_', ' ').toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
                
                <button
                  onClick={() => setIsAssignStaffModalOpen(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  <span>Assign Staff</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">User Details</h2>
                <button
                  onClick={closeUserModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              {/* User Info */}
              <div className="space-y-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">User Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">ID:</span>
                      <span className="font-semibold text-xs">#{selectedUser.id.slice(0, 8)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-semibold">{selectedUser.full_name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-semibold text-xs break-all">{selectedUser.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-semibold">{selectedUser.phone_number || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Role:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedUser.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {selectedUser.role.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Joined:</span>
                      <span className="font-semibold">{formatDate(selectedUser.created_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Order History */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Order History ({userBookings.length})</h3>
                  {userBookings.length > 0 ? (
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {userBookings.map((booking) => (
                        <div key={booking.id} className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-semibold text-indigo-600 text-sm">#{booking.id}</div>
                            {getStatusBadge(booking.status)}
                          </div>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Service:</span>
                              <span className="font-semibold">
                                {booking.service_id ? 
                                  (() => {
                                    const service = services.find(s => s.id === booking.service_id);
                                    return service ? service.name : `${booking.property_size || 'Unknown'} Property`;
                                  })() : 
                                  `${booking.property_size || 'Unknown'} Property`
                                }
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Date:</span>
                              <span className="font-semibold">{formatDate(booking.service_date)}</span>
                            </div>
                                                         <div className="flex justify-between">
                               <span className="text-gray-600">Amount:</span>
                               <span className="font-semibold text-indigo-600">{formatCurrency(booking.total_cost || 0)}</span>
                             </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-4 text-sm">No orders found</div>
                  )}
                </div>
              </div>

              {/* Close Button */}
              <div className="mt-6">
                <button
                  onClick={closeUserModal}
                  className="w-full bg-gray-500 text-white py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors focus:outline-none"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="flex justify-around py-3">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex flex-col items-center px-3 py-2 rounded-lg transition-colors duration-200 focus:outline-none ${
              activeTab === 'orders' ? 'bg-emerald-100 text-emerald-600' : 'text-gray-600 hover:text-emerald-600'
            }`}
          >
            <ClipboardDocumentListIcon className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Orders</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex flex-col items-center px-3 py-2 rounded-lg transition-colors duration-200 focus:outline-none ${
              activeTab === 'users' ? 'bg-sky-100 text-sky-600' : 'text-gray-600 hover:text-sky-600'
            }`}
          >
            <UsersIcon className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Users</span>
          </button>
          <button
            onClick={() => setActiveTab('support')}
            className={`flex flex-col items-center px-3 py-2 rounded-lg transition-colors duration-200 focus:outline-none relative ${
              activeTab === 'support' ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:text-purple-600'
            }`}
          >
            <div className="relative">
              <ChatBubbleLeftRightIcon className="w-5 h-5 mb-1" />
              {unreadSupportCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {unreadSupportCount > 99 ? '99+' : unreadSupportCount}
                </span>
              )}
            </div>
            <span className="text-xs font-medium">Support</span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex flex-col items-center px-3 py-2 rounded-lg transition-colors duration-200 focus:outline-none ${
              activeTab === 'analytics' ? 'bg-emerald-100 text-emerald-600' : 'text-gray-600 hover:text-emerald-600'
            }`}
          >
            <ChartBarIcon className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Analytics</span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center px-3 py-2 rounded-lg transition-colors duration-200 focus:outline-none ${
              activeTab === 'profile' ? 'bg-sky-100 text-sky-600' : 'text-gray-600 hover:text-sky-600'
            }`}
          >
            <Cog6ToothIcon className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Profile</span>
          </button>
        </div>
      </div>

      {/* Assign Staff Modal */}
      {selectedBooking && (
        <AssignStaffModal
          isOpen={isAssignStaffModalOpen}
          onClose={() => setIsAssignStaffModalOpen(false)}
          bookingId={selectedBooking.id}
          currentAssignedCleaners={selectedBooking.assigned_cleaners || []}
          onSuccess={async () => {
            console.log('🎉 AssignStaffModal onSuccess: Staff assignment completed');
            console.log('⏳ AssignStaffModal onSuccess: Waiting 500ms for DB update to complete...');
            
            // Close the modal first
            setIsAssignStaffModalOpen(false);
            
            // Wait a bit for the database update to complete
            await new Promise(resolve => setTimeout(resolve, 500));
            
            console.log('🔄 AssignStaffModal onSuccess: Starting booking refresh...');
            // Refresh the selected booking data to show updated assignments
            await refreshSelectedBooking();
            console.log('✅ AssignStaffModal onSuccess: Booking refresh completed');
          }}
        />
      )}

      {/* Add Cleaner Modal */}
      <AddCleanerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          // Refresh the dashboard data
          fetchDashboardData();
          setIsAddModalOpen(false);
        }}
      />
    </div>
  );
};

export default AdminDashboard; 