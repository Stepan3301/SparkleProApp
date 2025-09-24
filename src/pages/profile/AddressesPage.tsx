import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/OptimizedAuthContext';
import { supabase } from '../../lib/supabase';
import Button from '../../components/ui/Button';
import PlacesAutocomplete from '../../components/ui/PlacesAutocomplete';
import AddressSuccessAnimation from '../../components/ui/AddressSuccessAnimation';

import { 
  ArrowLeftIcon, 
  MapPinIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  HomeIcon
} from '@heroicons/react/24/outline';

interface Address {
  id: number;
  street: string;
  city: string;
  apartment?: string;
  is_default: boolean;
}

const AddressesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  useEffect(() => {
    fetchAddresses();
  }, [user]);

  const fetchAddresses = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

      if (error) throw error;

      setAddresses(data || []);
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const setDefaultAddress = async (addressId: number) => {
    if (!user) return;

    try {
      // Remove default from all addresses
      const { error: clearError } = await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);

      if (clearError) {
        console.error('Error clearing default addresses:', clearError);
        alert('Error setting default address. Please try again.');
        return;
      }

      // Set new default
      const { error: setError } = await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', addressId);

      if (setError) {
        console.error('Error setting default address:', setError);
        alert('Error setting default address. Please try again.');
        return;
      }

      fetchAddresses();
    } catch (error) {
      console.error('Error setting default address:', error);
      alert('Error setting default address. Please try again.');
    }
  };

  const deleteAddress = async (addressId: number) => {
    try {
      const addressToDelete = addresses.find(addr => addr.id === addressId);
      
      if (!addressToDelete) {
        console.error('Address not found');
        return;
      }

      // Check if address is referenced by any bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, status')
        .eq('address_id', addressId);

      if (bookingsError) {
        console.error('Error checking bookings:', bookingsError);
        alert('Error checking address usage. Please try again.');
        return;
      }

      if (bookings && bookings.length > 0) {
        // Address is referenced by bookings, need to handle this
        const confirmed = window.confirm(
          `This address is used by ${bookings.length} booking(s). ` +
          `Deleting it will remove the address reference from those bookings. ` +
          `Do you want to continue?`
        );

        if (!confirmed) return;

        // Update bookings to use a different address or set to NULL
        const otherAddresses = addresses.filter(addr => addr.id !== addressId);
        
        if (otherAddresses.length > 0) {
          // Use another address from the same user
          const { error: updateBookingsError } = await supabase
            .from('bookings')
            .update({ address_id: otherAddresses[0].id })
            .eq('address_id', addressId);

          if (updateBookingsError) {
            console.error('Error updating bookings:', updateBookingsError);
            alert('Error updating bookings. Please try again.');
            return;
          }
        } else {
          // No other addresses, set address_id to NULL
          const { error: updateBookingsError } = await supabase
            .from('bookings')
            .update({ address_id: null })
            .eq('address_id', addressId);

          if (updateBookingsError) {
            console.error('Error updating bookings:', updateBookingsError);
            alert('Error updating bookings. Please try again.');
            return;
          }
        }
      }

      // If deleting the default address and there are other addresses
      if (addressToDelete.is_default && addresses.length > 1) {
        // Find the first non-default address to make it the new default
        const otherAddress = addresses.find(addr => addr.id !== addressId);
        if (otherAddress) {
          // Set another address as default first
          await supabase
            .from('addresses')
            .update({ is_default: true })
            .eq('id', otherAddress.id);
        }
      }

      // Now delete the address
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', addressId);

      if (error) {
        console.error('Error deleting address:', error);
        alert('Error deleting address. Please try again.');
        return;
      }

      fetchAddresses();
    } catch (error) {
      console.error('Error deleting address:', error);
      alert('Error deleting address. Please try again.');
    }
  };

  const editAddress = (address: Address) => {
    setEditingAddress(address);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading addresses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7FBFD' }}>
      {/* Header */}
      <header className="bg-white px-4 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="nav-back"
            shape="bubble"
            size="sm"
            onClick={() => navigate('/profile')}
            className="!min-w-[44px] !w-11 !h-11 !p-0"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-black text-gray-900 tracking-wide">Addresses</h1>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-cyan-500 to-emerald-400 text-white rounded-xl font-black text-sm shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
        >
          <PlusIcon className="w-4 h-4" />
          Add
        </button>
      </header>

      {/* Content */}
      <div className="p-4 max-w-4xl mx-auto">
        {addresses.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPinIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No Addresses Added</h3>
            <p className="text-gray-600 mb-6">Add your first address to start booking cleaning services.</p>
            <Button
              variant="primary"
              shape="bubble"
              size="md"
              onClick={() => setShowAddForm(true)}
              leftIcon={<PlusIcon className="w-5 h-5" />}
            >
              Add Your First Address
            </Button>
          </div>
        ) : (
          /* Address List */
          <ul className="space-y-3">
            {addresses.map((address) => (
              <AddressCard
                key={address.id}
                address={address}
                onSetDefault={() => setDefaultAddress(address.id)}
                onEdit={() => editAddress(address)}
                onDelete={() => deleteAddress(address.id)}
              />
            ))}
          </ul>
        )}

        {/* Add/Edit Address Form Modal */}
        {(showAddForm || editingAddress) && (
          <AddAddressModal
            address={editingAddress}
            onClose={() => {
              setShowAddForm(false);
              setEditingAddress(null);
            }}
            onSuccess={(isNewAddress: boolean) => {
              setShowAddForm(false);
              setEditingAddress(null);
              if (isNewAddress) {
                setShowSuccessAnimation(true);
              } else {
                fetchAddresses();
              }
            }}
          />
        )}

        {/* Address Success Animation */}
        <AddressSuccessAnimation
          isVisible={showSuccessAnimation}
          onComplete={() => {
            setShowSuccessAnimation(false);
            fetchAddresses();
          }}
        />
      </div>
    </div>
  );
};

// Address Card Component
interface AddressCardProps {
  address: Address;
  onSetDefault: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const AddressCard: React.FC<AddressCardProps> = ({ address, onSetDefault, onEdit, onDelete }) => (
  <li 
    className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${
      address.is_default 
        ? 'border-cyan-400 shadow-cyan-100' 
        : 'border-gray-200'
    }`}
    style={{
      padding: '12px',
      boxShadow: address.is_default 
        ? '0 8px 22px rgba(10,189,198,.15), 0 8px 20px rgba(10,30,40,.08)' 
        : '0 8px 20px rgba(10,30,40,.08)'
    }}
    onClick={onEdit}
  >
    <div className="flex items-start gap-3">
      {/* Icon */}
      <div 
        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          address.is_default 
            ? 'bg-gradient-to-br from-cyan-500 to-emerald-400 text-white' 
            : 'bg-gradient-to-br from-cyan-100 to-emerald-50 text-cyan-600 border border-cyan-200'
        }`}
      >
        <HomeIcon className="w-5 h-5" />
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-black text-gray-900 text-base tracking-wide">
            {address.apartment ? `${address.apartment}, ` : ''}{address.street}
          </h3>
          {address.is_default && (
            <span 
              className="text-xs font-black text-cyan-800 bg-cyan-100 border border-cyan-300 px-2 py-1 rounded-full"
            >
              Default
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 mt-1">{address.city}</p>
      </div>
      
      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onEdit}
          className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 transition-colors duration-150 shadow-sm hover:shadow-md"
          aria-label="Edit address"
        >
          <PencilIcon className="w-4 h-4 text-gray-700" />
        </button>
        <button
          onClick={onDelete}
          className="w-8 h-8 rounded-lg border border-red-200 bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors duration-150 shadow-sm hover:shadow-md"
          aria-label="Delete address"
        >
          <TrashIcon className="w-4 h-4 text-red-600" />
        </button>
      </div>
    </div>
    
    {/* Set as Default Link */}
    {!address.is_default && (
      <div className="mt-3 flex items-center justify-between">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSetDefault();
          }}
          className="relative text-cyan-700 font-black text-sm px-3 py-2 rounded-lg hover:bg-cyan-50 transition-colors duration-150"
          style={{
            position: 'relative',
            border: 'none',
            background: 'transparent',
            fontWeight: '900',
            letterSpacing: '0.15px',
            cursor: 'pointer',
            padding: '9px 12px',
            borderRadius: '10px'
          }}
        >
          <span className="relative z-10">Set as Default</span>
          <span 
            className="absolute left-3 right-3 bottom-2 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent rounded-full scale-x-75 origin-center transition-transform duration-200 hover:scale-x-100"
            style={{
              content: '""',
              position: 'absolute',
              left: '10px',
              right: '10px',
              bottom: '6px',
              height: '2px',
              background: 'linear-gradient(90deg, transparent, rgba(10,189,198,.6), transparent)',
              transform: 'scaleX(.7)',
              transformOrigin: 'center',
              transition: 'transform .2s ease'
            }}
          />
        </button>
      </div>
    )}
  </li>
);

// Add/Edit Address Modal Component
interface AddAddressModalProps {
  address?: Address | null;
  onClose: () => void;
  onSuccess: (isNewAddress: boolean) => void;
}

const AddAddressModal: React.FC<AddAddressModalProps> = ({ address, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    apartment: address?.apartment || '',
    city: address?.city || 'Dubai',
  });
  const [searchValue, setSearchValue] = useState(address?.street || '');
  const [loading, setLoading] = useState(false);
  const isEditing = !!address;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !searchValue.trim()) return;

    setLoading(true);

    try {
      if (isEditing && address) {
        // Update existing address
        const { error } = await supabase
          .from('addresses')
          .update({
            street: searchValue.trim(),
            apartment: formData.apartment.trim() || null,
            city: formData.city,
          })
          .eq('id', address.id);

        if (error) throw error;
      } else {
        // Check if this will be the first address (make it default)
        const { data: existingAddresses } = await supabase
          .from('addresses')
          .select('id')
          .eq('user_id', user.id);

        const isFirstAddress = !existingAddresses || existingAddresses.length === 0;

        // Create new address
        const { error } = await supabase
          .from('addresses')
          .insert({
            user_id: user.id,
            street: searchValue,
            apartment: formData.apartment || null,
            city: formData.city,
            is_default: isFirstAddress,
          });

        if (error) throw error;

        // If this is the first address, we're done
        // If this is not the first address, ensure only one default exists
        if (!isFirstAddress) {
          // Remove default from all other addresses
          await supabase
            .from('addresses')
            .update({ is_default: false })
            .eq('user_id', user.id)
            .neq('street', searchValue);
        }
      }

      onSuccess(!isEditing);
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'adding'} address:`, error);
      alert(`Error ${isEditing ? 'updating' : 'adding'} address. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddressChange = (address: string, placeDetails?: any) => {
    // Extract building/place name from placeDetails if available, otherwise use the search term
    let buildingName = address;
    
    if (placeDetails && placeDetails.displayName) {
      buildingName = placeDetails.displayName;
    } else if (placeDetails && placeDetails.name) {
      buildingName = placeDetails.name;
    }
    
    setSearchValue(buildingName);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
      <div className="bg-white w-full rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">{isEditing ? 'Edit Address' : 'Add New Address'}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center hover:bg-orange-200 transition-colors"
          >
            <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Search Building/Place Name</label>
              <PlacesAutocomplete
                value={searchValue}
                onChange={(address: string, placeDetails?: any) => {
                  console.log('Places API - Address changed:', address, placeDetails);
                  handleAddressChange(address, placeDetails);
                }}
                placeholder="Search for building name (e.g., Westwood Grande 2 by Imtiaz)..."
                showMap={true}
                mapHeight={200}
                onError={(error: string) => {
                  console.error('Places API error:', error);
                  // Show user-friendly error message
                  if (error.includes('RefererNotAllowedMapError')) {
                    alert('Google Maps API key is not authorized for this domain. Please add localhost to your API key restrictions in Google Cloud Console.');
                  } else if (error.includes('ApiNotActivatedMapError')) {
                    alert('Google Maps API is not enabled. Please enable the Maps JavaScript API in Google Cloud Console.');
                  } else if (error.includes('InvalidKeyMapError')) {
                    alert('Invalid Google Maps API key. Please check your API key configuration.');
                  } else {
                    alert('Google Maps error: ' + error);
                  }
                }}
                includedRegionCodes={['ae']}
              />
            </div>
          </div>

          {/* Selected Building Name Display */}
          {searchValue && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Selected Building</label>
              <div className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-blue-50 text-gray-900 font-medium border-blue-200">
                {searchValue}
              </div>
              <p className="text-xs text-blue-600 mt-1">This is the building name that will be saved</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Apartment/Unit/Floor (Optional)</label>
            <input
              type="text"
              value={formData.apartment}
              onChange={(e) => setFormData({ ...formData, apartment: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="e.g., Apt 101, Floor 5, Unit A..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              required
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            shape="bubble"
            size="md"
            disabled={loading || !searchValue.trim()}
            fullWidth={true}
            className="!py-3 !shadow-lg"
          >
            {loading 
              ? (isEditing ? 'Updating...' : 'Adding...') 
              : (isEditing ? 'Update Address' : 'Add Address')
            }
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AddressesPage; 