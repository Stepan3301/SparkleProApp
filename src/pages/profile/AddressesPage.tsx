import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Button from '../../components/ui/Button';
import GoogleMapsAutocomplete from '../../components/ui/GoogleMapsAutocomplete';
import { PlaceDetails, AddressComponent, PlaceResult } from '../../types/places';
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
  zip_code: string;
  is_default: boolean;
}

const AddressesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

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
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);

      // Set new default
      await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', addressId);

      fetchAddresses();
    } catch (error) {
      console.error('Error setting default address:', error);
    }
  };

  const deleteAddress = async (addressId: number) => {
    try {
      await supabase
        .from('addresses')
        .delete()
        .eq('id', addressId);

      fetchAddresses();
    } catch (error) {
      console.error('Error deleting address:', error);
    }
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="nav-back"
            shape="bubble"
            size="sm"
            onClick={() => navigate('/profile')}
            className="!min-w-[44px] !w-11 !h-11 !p-0"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-gray-900">Addresses</h1>
        </div>
        <Button
          variant="primary"
          shape="bubble"
          size="sm"
          onClick={() => setShowAddForm(true)}
          className="!min-w-[44px] !w-11 !h-11 !p-0"
        >
          <PlusIcon className="w-5 h-5" />
        </Button>
      </header>

      {/* Content */}
      <div className="p-5">
        {addresses.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-2xl p-8 text-center">
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
          <div className="space-y-4">
            {addresses.map((address) => (
              <AddressCard
                key={address.id}
                address={address}
                onSetDefault={() => setDefaultAddress(address.id)}
                onEdit={() => console.log('Edit address:', address.id)}
                onDelete={() => deleteAddress(address.id)}
              />
            ))}
          </div>
        )}

        {/* Add Address Form Modal */}
        {showAddForm && (
          <AddAddressModal
            onClose={() => setShowAddForm(false)}
            onSuccess={() => {
              setShowAddForm(false);
              fetchAddresses();
            }}
          />
        )}
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
  <div className={`bg-white rounded-2xl p-5 border-2 ${address.is_default ? 'border-primary bg-primary-50' : 'border-transparent'}`}>
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          address.is_default ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
        }`}>
          <HomeIcon className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900">
              {address.apartment ? `${address.apartment}, ` : ''}{address.street}
            </h3>
            {address.is_default && (
              <span className="bg-primary text-white text-xs font-semibold px-2 py-1 rounded-lg">
                Default
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600">{address.city}, {address.zip_code}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="edit"
          shape="bubble"
          size="sm"
          onClick={onEdit}
          className="!p-2 !min-w-[32px] !w-8 !h-8"
        >
          <PencilIcon className="w-4 h-4" />
        </Button>
        <Button
          variant="delete"
          shape="bubble"
          size="sm"
          onClick={onDelete}
          className="!p-2 !min-w-[32px] !w-8 !h-8"
        >
          <TrashIcon className="w-4 h-4" />
        </Button>
      </div>
    </div>
    
    {!address.is_default && (
      <Button
        variant="selection"
        shape="organic"
        size="sm"
        onClick={onSetDefault}
        className="!w-full !py-2 !text-sm !min-w-0 !border-primary !text-primary"
      >
        Set as Default
      </Button>
    )}
  </div>
);

// Add Address Modal Component
interface AddAddressModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const AddAddressModal: React.FC<AddAddressModalProps> = ({ onClose, onSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    street: '',
    apartment: '',
    city: 'Dubai',
    zipCode: '',
  });
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.street) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('addresses')
        .insert({
          user_id: user.id,
          street: formData.street,
          apartment: formData.apartment || null,
          city: formData.city,
          zip_code: formData.zipCode,
          is_default: false,
        });

      if (error) throw error;

      onSuccess();
    } catch (error) {
      console.error('Error adding address:', error);
      alert('Error adding address. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddressChange = (address: string, placeDetails?: PlaceResult) => {
    setSearchValue(address);
    
    if (placeDetails && placeDetails.addressComponents) {
      // Parse address components
      let street = '';
      let city = '';
      let zipCode = '';
      
      placeDetails.addressComponents.forEach((component: any) => {
        const types = component.types;
        if (types.includes('street_number') || types.includes('route')) {
          street += component.longText + ' ';
        } else if (types.includes('locality') || types.includes('administrative_area_level_1')) {
          city = component.longText;
        } else if (types.includes('postal_code')) {
          zipCode = component.longText;
        }
      });
      
      setFormData({
        ...formData,
        street: street.trim() || address,
        city: city || formData.city,
        zipCode: zipCode || formData.zipCode
      });
    } else {
      setFormData({ ...formData, street: address });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
      <div className="bg-white w-full rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Add New Address</h2>
          <Button
            variant="secondary"
            shape="bubble"
            size="sm"
            onClick={onClose}
            className="!p-2 !min-w-[40px] !w-10 !h-10"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <GoogleMapsAutocomplete
              value={searchValue}
              onChange={handleAddressChange}
              label="Search Address"
              placeholder="Search for your address..."
              showMap={true}
            />
          </div>

          {/* Read-only Street Name Field */}
          {formData.street && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Street Name</label>
              <div className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-100 text-gray-700 font-medium">
                {formData.street}
              </div>
              <p className="text-xs text-gray-500 mt-1">This field was auto-filled from your search</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Apartment/Unit (Optional)</label>
            <input
              type="text"
              value={formData.apartment}
              onChange={(e) => setFormData({ ...formData, apartment: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="Apt, Suite, Unit, etc."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">ZIP Code</label>
              <input
                type="text"
                value={formData.zipCode}
                onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="12345"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            shape="bubble"
            size="md"
            disabled={loading || !formData.street}
            fullWidth={true}
            className="!py-3 !shadow-lg"
          >
            {loading ? 'Adding...' : 'Add Address'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AddressesPage; 