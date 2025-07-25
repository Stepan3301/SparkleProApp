import CryptoJS from 'crypto-js';

// Use environment variable for encryption key in production
const ENCRYPTION_KEY = process.env.REACT_APP_CARD_ENCRYPTION_KEY || 'sparkle-ncs-default-key-change-in-production';

export const encryptCardData = (data: string): string => {
  try {
    const encrypted = CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt card data');
  }
};

export const decryptCardData = (encryptedData: string): string => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt card data');
  }
};

export const getCardType = (cardNumber: string): string => {
  const number = cardNumber.replace(/\s/g, '');
  
  if (/^4/.test(number)) return 'visa';
  if (/^5[1-5]/.test(number)) return 'mastercard';
  if (/^3[47]/.test(number)) return 'amex';
  if (/^6/.test(number)) return 'discover';
  
  return 'unknown';
};

export const formatCardNumber = (cardNumber: string): string => {
  const number = cardNumber.replace(/\s/g, '');
  return number.replace(/(.{4})/g, '$1 ').trim();
};

export const getLastFourDigits = (cardNumber: string): string => {
  return cardNumber.replace(/\s/g, '').slice(-4);
};

export const maskCardNumber = (cardNumber: string): string => {
  const lastFour = getLastFourDigits(cardNumber);
  return `**** **** **** ${lastFour}`;
}; 