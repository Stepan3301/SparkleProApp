import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { decryptCardData, maskCardNumber } from '../../utils/cardEncryption';
import Button from '../../components/ui/Button';
import AddCardForm from '../../components/ui/AddCardForm';
import { 
  ArrowLeftIcon, 
  CreditCardIcon,
  PlusIcon,
  TrashIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

interface PaymentCard {
  id: number;
  card_name: string;
  card_number_encrypted: string;
  card_number_last4: string;
  expiry_month: number;
  expiry_year: number;
  card_type: string;
  is_default: boolean;
  created_at: string;
}

const PaymentMethodsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cards, setCards] = useState<PaymentCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddCard, setShowAddCard] = useState(false);
  const [deletingCard, setDeletingCard] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      fetchCards();
    }
  }, [user]);

  const fetchCards = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('payment_cards')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCards(data || []);
    } catch (error) {
      console.error('Error fetching cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (cardId: number) => {
    try {
      const { error } = await supabase
        .from('payment_cards')
        .update({ is_default: true })
        .eq('id', cardId)
        .eq('user_id', user?.id);

      if (error) throw error;
      await fetchCards(); // Refresh the list
    } catch (error) {
      console.error('Error setting default card:', error);
      alert('Failed to set default card');
    }
  };

  const handleDeleteCard = async (cardId: number) => {
    if (!window.confirm('Are you sure you want to delete this payment method?')) {
      return;
    }

    setDeletingCard(cardId);
    try {
      const { error } = await supabase
        .from('payment_cards')
        .delete()
        .eq('id', cardId)
        .eq('user_id', user?.id);

      if (error) throw error;
      await fetchCards(); // Refresh the list
    } catch (error) {
      console.error('Error deleting card:', error);
      alert('Failed to delete payment method');
    } finally {
      setDeletingCard(null);
    }
  };

  const getCardIcon = (cardType: string) => {
    switch (cardType.toLowerCase()) {
      case 'visa':
        return '💳';
      case 'mastercard':
        return '💳';
      case 'amex':
        return '💳';
      default:
        return '💳';
    }
  };

  const formatExpiryDate = (month: number, year: number) => {
    return `${month.toString().padStart(2, '0')}/${year.toString().slice(-2)}`;
  };

  const getCardName = (encryptedName: string) => {
    try {
      return decryptCardData(encryptedName);
    } catch {
      return 'Card Holder';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment methods...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white px-5 py-4 border-b border-gray-100 flex items-center gap-4">
        <Button
          variant="nav-back"
          shape="bubble"
          size="sm"
          onClick={() => navigate('/profile')}
          className="!min-w-[44px] !w-11 !h-11 !p-0"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold text-gray-900">Payment Methods</h1>
      </header>

      {/* Content */}
      <div className="p-5">
        {/* Add New Card Button */}
        <div className="mb-6">
          <Button
            variant="primary"
            shape="bubble"
            size="md"
            onClick={() => setShowAddCard(true)}
            leftIcon={<PlusIcon className="w-5 h-5" />}
            className="!w-full !py-4"
          >
            Add New Payment Method
          </Button>
        </div>

        {/* Cards List */}
        {cards.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCardIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No Payment Methods</h2>
            <p className="text-gray-600 mb-6">Add a payment method to make booking easier.</p>
            <Button
              variant="primary"
              shape="bubble"
              size="md"
              onClick={() => setShowAddCard(true)}
              leftIcon={<PlusIcon className="w-5 h-5" />}
            >
              Add Your First Card
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {cards.map((card) => (
              <div
                key={card.id}
                className={`bg-white rounded-2xl p-5 border-2 transition-all ${
                  card.is_default 
                    ? 'border-primary bg-primary/5' 
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-8 bg-gradient-to-r from-primary to-primary-light rounded-lg flex items-center justify-center text-white text-lg">
                      {getCardIcon(card.card_type)}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        •••• •••• •••• {card.card_number_last4}
                      </div>
                      <div className="text-sm text-gray-600">
                        {getCardName(card.card_name)} • Expires {formatExpiryDate(card.expiry_month, card.expiry_year)}
                      </div>
                      {card.is_default && (
                        <div className="inline-flex items-center gap-1 text-xs text-primary font-medium mt-1">
                          <CheckIcon className="w-3 h-3" />
                          Default
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!card.is_default && (
                      <Button
                        variant="secondary"
                        shape="bubble"
                        size="sm"
                        onClick={() => handleSetDefault(card.id)}
                        className="!px-3 !py-1 !text-xs"
                      >
                        Set Default
                      </Button>
                    )}
                    
                    <Button
                      variant="secondary"
                      shape="bubble"
                      size="sm"
                      onClick={() => handleDeleteCard(card.id)}
                      disabled={deletingCard === card.id}
                      className="!min-w-[32px] !w-8 !h-8 !p-0 !bg-red-500 hover:!bg-red-600 !text-white !border-red-500"
                    >
                      {deletingCard === card.id ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                      ) : (
                        <TrashIcon className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Card Modal */}
      {showAddCard && (
        <AddCardForm
          showAsModal={true}
          onSuccess={() => {
            setShowAddCard(false);
            fetchCards();
          }}
          onCancel={() => setShowAddCard(false)}
        />
      )}
    </div>
  );
};

export default PaymentMethodsPage; 