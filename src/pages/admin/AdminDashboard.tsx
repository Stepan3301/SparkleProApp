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
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import SupportChat from './SupportChat';

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
      const { data, error } = await supabase
        .from('admin_bookings_with_addons')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      // Fetch address information for bookings with address_id
      const bookingsWithAddresses = await Promise.all(
        (data || []).map(async (booking) => {
          if (booking.address_id) {
            try {
              const { data: addressData } = await supabase
                .from('addresses')
                .select('street')
                .eq('id', booking.address_id)
                .single();
              return { ...booking, street: addressData?.street };
            } catch {
              return booking;
            }
          }
          return booking;
        })
      );
      
      setBookings(bookingsWithAddresses || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
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

  const viewBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowModal(true);
  };

  const viewUser = async (user: User) => {
    setSelectedUser(user);
    await fetchUserBookings(user.id);
    setShowUserModal(true);
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
        {amount.toFixed(0)}
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
                className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs hover:bg-gray-200 transition-colors"
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

                {/* Bookings List */}
                <div className="space-y-4">
                  {services.length === 0 && (
                    <div className="text-center text-gray-500 py-4">
                      Loading services...
                    </div>
                  )}
                  {bookings.map((booking) => (
                    <div 
                      key={booking.id} 
                      className="bg-gray-50 border border-gray-200 rounded-lg p-4 border-l-4 border-l-emerald-500 cursor-pointer hover:bg-gray-100 transition-colors"
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
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-6 text-center">Users Management</h2>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-sky-500 text-white p-4 rounded-lg text-center">
                    <div className="text-xl font-bold">{stats?.totalUsers || 0}</div>
                    <div className="text-xs opacity-90">Total Users</div>
                  </div>
                  <div className="bg-emerald-500 text-white p-4 rounded-lg text-center">
                    <div className="text-xl font-bold">{stats?.newUsersThisMonth || 0}</div>
                    <div className="text-xs opacity-90">New This Month</div>
                  </div>
                  <div className="bg-sky-500 text-white p-4 rounded-lg text-center">
                    <div className="text-xl font-bold">{stats?.activeClients || 0}</div>
                    <div className="text-xs opacity-90">Active Clients</div>
                  </div>
                  <div className="bg-emerald-500 text-white p-4 rounded-lg text-center">
                    <div className="text-xl font-bold">{stats?.satisfaction || 0}%</div>
                    <div className="text-xs opacity-90">Satisfaction</div>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="mb-4">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search users by name, email, phone, or ID..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                    />
                  </div>
                </div>

                {/* Users List - Compact Design */}
                <div className="space-y-3">
                  {filteredUsers.slice(0, 20).map((user) => (
                    <div key={user.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3 border-l-4 border-l-sky-500">
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-semibold text-sky-600 text-xs">#{user.id.slice(0, 8)}</div>
                            <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                              user.role === 'admin' ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'
                            }`}>
                              {user.role.toUpperCase()}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-gray-600">Name:</span>
                              <span className="ml-1 font-semibold text-gray-800">{user.full_name || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Phone:</span>
                              <span className="ml-1 font-semibold text-gray-800">{user.phone_number || 'N/A'}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-gray-600">Email:</span>
                              <span className="ml-1 font-semibold text-gray-800 text-xs break-all">{user.email}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="ml-3">
                          <button
                            onClick={() => viewUser(user)}
                            className="flex items-center gap-1 px-3 py-1 bg-sky-500 text-white rounded-lg text-xs hover:bg-sky-600 transition-colors"
                          >
                            <EyeIcon className="w-3 h-3" />
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {filteredUsers.length === 0 && userSearchQuery && (
                    <div className="text-center text-gray-500 py-4">
                      No users found matching "{userSearchQuery}"
                    </div>
                  )}
                </div>
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
              <div className="mt-6 flex gap-3">
                <button
                  onClick={closeModal}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg font-medium transition-colors"
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
                  className="w-full bg-gray-500 text-white py-3 rounded-lg font-medium hover:bg-gray-600 transition-colors"
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
            className={`flex flex-col items-center px-3 py-2 rounded-lg transition-all ${
              activeTab === 'orders' ? 'bg-emerald-100 text-emerald-600' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ClipboardDocumentListIcon className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Orders</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex flex-col items-center px-3 py-2 rounded-lg transition-all ${
              activeTab === 'users' ? 'bg-sky-100 text-sky-600' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <UsersIcon className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Users</span>
          </button>
          <button
            onClick={() => setActiveTab('support')}
            className={`flex flex-col items-center px-3 py-2 rounded-lg transition-all relative ${
              activeTab === 'support' ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:bg-gray-100'
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
            className={`flex flex-col items-center px-3 py-2 rounded-lg transition-all ${
              activeTab === 'analytics' ? 'bg-emerald-100 text-emerald-600' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ChartBarIcon className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Analytics</span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center px-3 py-2 rounded-lg transition-all ${
              activeTab === 'profile' ? 'bg-sky-100 text-sky-600' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Cog6ToothIcon className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 