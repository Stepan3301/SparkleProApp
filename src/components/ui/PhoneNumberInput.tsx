import React, { useState, useRef, useEffect } from 'react';

interface Country {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
  format: string;
  placeholder: string;
  maxDigits: number;
}

const COUNTRIES: Country[] = [
  // CIS Countries
  { code: 'RU', name: 'Russia', flag: '🇷🇺', dialCode: '+7', format: '### ### ## ##', placeholder: '999 123 45 67', maxDigits: 10 },
  { code: 'KZ', name: 'Kazakhstan', flag: '🇰🇿', dialCode: '+7', format: '### ### ## ##', placeholder: '999 123 45 67', maxDigits: 10 },
  { code: 'BY', name: 'Belarus', flag: '🇧🇾', dialCode: '+375', format: '## ### ## ##', placeholder: '29 123 45 67', maxDigits: 9 },
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦', dialCode: '+380', format: '## ### ## ##', placeholder: '99 123 45 67', maxDigits: 9 },
  { code: 'UZ', name: 'Uzbekistan', flag: '🇺🇿', dialCode: '+998', format: '## ### ## ##', placeholder: '99 123 45 67', maxDigits: 9 },
  { code: 'AZ', name: 'Azerbaijan', flag: '🇦🇿', dialCode: '+994', format: '## ### ## ##', placeholder: '99 123 45 67', maxDigits: 9 },
  { code: 'GE', name: 'Georgia', flag: '🇬🇪', dialCode: '+995', format: '### ### ###', placeholder: '599 123 456', maxDigits: 9 },
  { code: 'AM', name: 'Armenia', flag: '🇦🇲', dialCode: '+374', format: '## ### ###', placeholder: '99 123 456', maxDigits: 8 },
  { code: 'MD', name: 'Moldova', flag: '🇲🇩', dialCode: '+373', format: '## ### ###', placeholder: '99 123 456', maxDigits: 8 },
  { code: 'KG', name: 'Kyrgyzstan', flag: '🇰🇬', dialCode: '+996', format: '### ### ###', placeholder: '999 123 456', maxDigits: 9 },
  { code: 'TJ', name: 'Tajikistan', flag: '🇹🇯', dialCode: '+992', format: '### ### ###', placeholder: '999 123 456', maxDigits: 9 },
  { code: 'TM', name: 'Turkmenistan', flag: '🇹🇲', dialCode: '+993', format: '## ### ###', placeholder: '99 123 456', maxDigits: 8 },
  
  // GCC Countries
  { code: 'AE', name: 'UAE', flag: '🇦🇪', dialCode: '+971', format: '## ### ####', placeholder: '50 123 4567', maxDigits: 9 },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', dialCode: '+966', format: '## ### ####', placeholder: '50 123 4567', maxDigits: 9 },
  { code: 'KW', name: 'Kuwait', flag: '🇰🇼', dialCode: '+965', format: '### ### ##', placeholder: '999 123 45', maxDigits: 8 },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦', dialCode: '+974', format: '### ### ##', placeholder: '999 123 45', maxDigits: 8 },
  { code: 'BH', name: 'Bahrain', flag: '🇧🇭', dialCode: '+973', format: '#### ####', placeholder: '9999 1234', maxDigits: 8 },
  { code: 'OM', name: 'Oman', flag: '🇴🇲', dialCode: '+968', format: '#### ####', placeholder: '9999 1234', maxDigits: 8 },
];

interface PhoneNumberInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: string;
  required?: boolean;
}

const PhoneNumberInput: React.FC<PhoneNumberInputProps> = ({
  value,
  onChange,
  placeholder,
  className = '',
  error,
  required = false
}) => {
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[12]); // Default to UAE
  const [showDropdown, setShowDropdown] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialize with existing value on mount only
  useEffect(() => {
    if (value && value.trim() !== '') {
      const country = COUNTRIES.find(c => value.startsWith(c.dialCode));
      if (country) {
        setSelectedCountry(country);
        const phoneOnly = value.replace(country.dialCode, '');
        setInputValue(formatNumber(phoneOnly, country.format));
      }
    }
  }, []); // Only run once on mount

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatNumber = (digits: string, format: string): string => {
    let result = '';
    let digitIndex = 0;

    for (let i = 0; i < format.length && digitIndex < digits.length; i++) {
      if (format[i] === '#') {
        result += digits[digitIndex];
        digitIndex++;
      } else if (digitIndex > 0) { // Only add separator if we have digits
        result += format[i];
      }
    }

    return result;
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    
    // Extract only digits
    const digits = newValue.replace(/\D/g, '');
    
    // Limit to max digits for selected country
    const limitedDigits = digits.slice(0, selectedCountry.maxDigits);
    
    // Format the digits
    const formatted = formatNumber(limitedDigits, selectedCountry.format);
    
    // Update local state
    setInputValue(formatted);
    
    // Call parent onChange with full number
    const fullNumber = selectedCountry.dialCode + limitedDigits;
    onChange(fullNumber);
  };

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setShowDropdown(false);
    
    // Keep current digits but apply new country format
    const currentDigits = inputValue.replace(/\D/g, '');
    const limitedDigits = currentDigits.slice(0, country.maxDigits);
    const formatted = formatNumber(limitedDigits, country.format);
    
    setInputValue(formatted);
    
    // Update parent with new country code
    const fullNumber = country.dialCode + limitedDigits;
    onChange(fullNumber);
  };

  const isValid = (): boolean => {
    const digits = inputValue.replace(/\D/g, '');
    return digits.length === selectedCountry.maxDigits;
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex">
        {/* Country Selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 px-3 py-3 border border-r-0 border-gray-200 rounded-l-xl bg-white hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <span className="text-lg">{selectedCountry.flag}</span>
            <span className="text-sm font-medium text-gray-700">{selectedCountry.dialCode}</span>
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown */}
          {showDropdown && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-[9999] max-h-60 overflow-y-auto">
              <div className="p-2">
                <div className="text-xs font-medium text-gray-500 mb-2 px-2">CIS Countries</div>
                {COUNTRIES.slice(0, 12).map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleCountrySelect(country)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <span className="text-lg">{country.flag}</span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{country.name}</div>
                      <div className="text-sm text-gray-500">{country.dialCode}</div>
                    </div>
                  </button>
                ))}
                
                <div className="text-xs font-medium text-gray-500 mb-2 px-2 mt-3">GCC Countries</div>
                {COUNTRIES.slice(12).map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleCountrySelect(country)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <span className="text-lg">{country.flag}</span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{country.name}</div>
                      <div className="text-sm text-gray-500">{country.dialCode}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Phone Number Input */}
        <input
          type="tel"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={selectedCountry.placeholder}
          className={`flex-1 px-4 py-3 border border-gray-200 rounded-r-xl bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
            error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''
          }`}
          required={required}
        />
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}

      {/* Validation Message */}
      {inputValue && !isValid() && !error && (
        <p className="text-orange-500 text-sm mt-1">
          Please enter a valid {selectedCountry.name} phone number ({selectedCountry.format.replace(/#/g, 'X')})
        </p>
      )}
    </div>
  );
};

export default PhoneNumberInput; 