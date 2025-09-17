import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/OptimizedAuthContext';
import { encryptCardData, getCardType, getLastFourDigits } from '../../utils/cardEncryption';

interface AddCardFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  showAsModal?: boolean;
}

const AddCardForm: React.FC<AddCardFormProps> = ({ 
  onSuccess, 
  onCancel, 
  showAsModal = false 
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardName: '',
    expiry: '',
    cvv: ''
  });
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const formatCardNumber = (value: string) => {
    const number = value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
    const formattedValue = number.match(/.{1,4}/g)?.join(' ') || number;
    return formattedValue.substring(0, 19); // Max 16 digits + 3 spaces
  };

  const formatExpiry = (value: string) => {
    const number = value.replace(/\D/g, '');
    if (number.length >= 2) {
      return number.substring(0, 2) + '/' + number.substring(2, 4);
    }
    return number;
  };

  const handleInputChange = (field: string, value: string) => {
    let formattedValue = value;
    
    if (field === 'cardNumber') {
      formattedValue = formatCardNumber(value);
    } else if (field === 'expiry') {
      formattedValue = formatExpiry(value);
    } else if (field === 'cvv') {
      formattedValue = value.replace(/[^0-9]/g, '').substring(0, 3);
    } else if (field === 'cardName') {
      formattedValue = value.substring(0, 25);
    }
    
    setFormData(prev => ({ ...prev, [field]: formattedValue }));
  };

  const validateForm = () => {
    const { cardNumber, cardName, expiry, cvv } = formData;
    const cleanCardNumber = cardNumber.replace(/\s/g, '');
    
    if (cleanCardNumber.length < 13 || cleanCardNumber.length > 19) {
      alert('Please enter a valid card number');
      return false;
    }
    
    if (!cardName.trim()) {
      alert('Please enter the cardholder name');
      return false;
    }
    
    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      alert('Please enter a valid expiry date (MM/YY)');
      return false;
    }
    
    if (cvv.length !== 3) {
      alert('Please enter a valid CVV');
      return false;
    }
    
    // Check if expiry date is in the future
    const [month, year] = expiry.split('/').map(Number);
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;
    
    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      alert('Card has expired. Please enter a valid expiry date');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !user) return;
    
    setLoading(true);
    
    try {
      const cleanCardNumber = formData.cardNumber.replace(/\s/g, '');
      const [month, year] = formData.expiry.split('/').map(Number);
      
      // Encrypt sensitive data
      const encryptedCardNumber = encryptCardData(cleanCardNumber);
      const encryptedCardName = encryptCardData(formData.cardName);
      const encryptedCvv = encryptCardData(formData.cvv);
      
      const cardData = {
        user_id: user.id,
        card_name: encryptedCardName,
        card_number_encrypted: encryptedCardNumber,
        card_number_last4: getLastFourDigits(cleanCardNumber),
        expiry_month: month,
        expiry_year: 2000 + year, // Convert YY to YYYY
        cvv_encrypted: encryptedCvv,
        card_type: getCardType(cleanCardNumber),
        is_default: false // User can set default later
      };
      
      const { error } = await supabase
        .from('payment_cards')
        .insert(cardData);
      
      if (error) {
        console.error('Error adding card:', error);
        alert('Failed to add card. Please try again.');
        return;
      }
      
      setShowSuccess(true);
      
      setTimeout(() => {
        setShowSuccess(false);
        setFormData({ cardNumber: '', cardName: '', expiry: '', cvv: '' });
        onSuccess?.();
      }, 2000);
      
    } catch (error) {
      console.error('Error adding card:', error);
      alert('Failed to add card. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({ cardNumber: '', cardName: '', expiry: '', cvv: '' });
    onCancel?.();
  };

  if (showSuccess) {
    return (
      <div className={showAsModal ? "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" : ""}>
        <div className={`${showAsModal ? 'bg-white rounded-2xl p-8 max-w-sm w-full' : 'p-8'} text-center`}>
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-accent mb-2">Card Added Successfully!</h2>
          <p className="text-gray-600">Your payment method has been saved securely.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={showAsModal ? "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" : ""}>
      <div className={`${showAsModal ? 'bg-white rounded-2xl p-6 max-w-sm w-full max-h-[90vh] overflow-y-auto' : ''}`}>
        {showAsModal && (
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Add Payment Card</h2>
            <button
              onClick={handleCancel}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        )}

        <style>{`
          .credit-card {
            width: 100%;
            height: 200px;
            background: linear-gradient(135deg, #50C878 0%, #40E0D0 25%, #48D1CC 50%, #20B2AA 75%, #008B8B 100%);
            border-radius: 16px;
            padding: 20px;
            color: white;
            position: relative;
            margin-bottom: 25px;
            box-shadow: 0 15px 35px rgba(72, 209, 204, 0.4);
            overflow: hidden;
          }

          .credit-card::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%);
            animation: shimmer 4s infinite;
          }

          @keyframes shimmer {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .card-chip {
            width: 35px;
            height: 25px;
            background: linear-gradient(135deg, #ffd700, #ffed4e);
            border-radius: 6px;
            margin-bottom: 20px;
            position: relative;
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
          }

          .card-input {
            background: transparent;
            border: none;
            color: white;
            font-family: 'Courier New', monospace;
            outline: none;
            text-shadow: 0 1px 2px rgba(0,0,0,0.3);
            z-index: 10;
            position: relative;
            width: 100%;
          }

          .card-input::placeholder {
            color: rgba(255, 255, 255, 0.7);
          }

          .card-input:focus {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 6px;
            padding: 4px;
          }

          .card-number-input {
            font-size: 16px;
            font-weight: 600;
            letter-spacing: 2px;
            margin-bottom: 20px;
          }

          .card-info {
            display: flex;
            justify-content: space-between;
            gap: 15px;
          }

          .card-field {
            flex: 1;
          }

          .card-label {
            font-size: 8px;
            opacity: 0.8;
            margin-bottom: 4px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }

          .card-name-input {
            font-size: 12px;
            font-weight: 600;
          }

          .card-expiry-input, .card-cvv-input {
            font-size: 12px;
            font-weight: 600;
            text-align: center;
          }

          .card-logo {
            position: absolute;
            top: 20px;
            right: 20px;
            font-size: 20px;
          }
        `}</style>

        <div className="credit-card">
          <div className="card-logo">💳</div>
          <div className="card-chip"></div>
          
          <input
            type="text"
            className="card-input card-number-input"
            placeholder="XXXX XXXX XXXX XXXX"
            value={formData.cardNumber}
            onChange={(e) => handleInputChange('cardNumber', e.target.value)}
            maxLength={19}
          />
          
          <div className="card-info">
            <div className="card-field">
              <div className="card-label">Card Holder</div>
              <input
                type="text"
                className="card-input card-name-input"
                placeholder="Your Name"
                value={formData.cardName}
                onChange={(e) => handleInputChange('cardName', e.target.value)}
                maxLength={25}
              />
            </div>
            
            <div className="card-field">
              <div className="card-label">Expires</div>
              <input
                type="text"
                className="card-input card-expiry-input"
                placeholder="MM/YY"
                value={formData.expiry}
                onChange={(e) => handleInputChange('expiry', e.target.value)}
                maxLength={5}
              />
            </div>
            
            <div className="card-field">
              <div className="card-label">CVV</div>
              <input
                type="text"
                className="card-input card-cvv-input"
                placeholder="123"
                value={formData.cvv}
                onChange={(e) => handleInputChange('cvv', e.target.value)}
                maxLength={3}
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {onCancel && (
            <button
              onClick={handleCancel}
              className="w-full py-3 px-4 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:border-primary hover:text-primary transition-all"
            >
              Cancel
            </button>
          )}
          
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-accent to-primary text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? 'Adding Card...' : 'Add Card'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddCardForm; 