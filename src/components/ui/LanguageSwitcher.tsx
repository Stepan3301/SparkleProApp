import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { useSimpleTranslation } from '../../utils/i18n';

interface Language {
  code: string;
  name: string;
  flag: string;
}

interface LanguageSwitcherProps {
  variant?: 'header' | 'profile' | 'floating';
  showText?: boolean;
}

const languages: Language[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' }
];

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ 
  variant = 'header', 
  showText = true 
}) => {
  const { i18n } = useSimpleTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  // Calculate dropdown position for header variant
  useEffect(() => {
    const updatePosition = () => {
      if (isOpen && variant === 'header' && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + 8, // 8px gap
          right: window.innerWidth - rect.right
        });
      }
    };

    updatePosition();
    
    // Recalculate on window resize
    if (isOpen && variant === 'header') {
      window.addEventListener('resize', updatePosition);
      return () => window.removeEventListener('resize', updatePosition);
    }
  }, [isOpen, variant]);

  const changeLanguage = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    setIsOpen(false);
  };

  // Simplified styling based on variant
  let containerClass = 'relative z-[9999]'; // Highest z-index for container
  let buttonClass = '';
  let dropdownClass = '';
  let itemClass = 'flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 cursor-pointer text-gray-700 transition-colors rounded-lg mx-1';

  if (variant === 'header') {
    buttonClass = 'flex items-center gap-1 px-2 py-1.5 bg-white/25 backdrop-blur-sm border border-white/40 text-white rounded-lg hover:bg-white/35 transition-all relative z-[9999] shadow-sm';
    dropdownClass = 'fixed bg-white rounded-xl shadow-2xl border border-gray-100 py-2 min-w-[160px] z-[99999]';
  } else if (variant === 'profile') {
    buttonClass = 'flex items-center gap-2 px-4 py-3 bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-all w-full justify-between relative z-[9999]';
    dropdownClass = 'absolute top-full left-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 py-1 w-full z-[9999]';
  } else {
    buttonClass = 'flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-full shadow-xl hover:bg-emerald-700 transition-all relative z-[99999] border-2 border-white/20 backdrop-blur-sm';
    dropdownClass = 'absolute top-full right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 min-w-[160px] z-[99999]';
  }

  return (
    <div className={containerClass}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={buttonClass}
        type="button"
      >
        <span className="text-lg">{currentLanguage.flag}</span>
        {showText && (
          <span className="text-sm font-medium">{currentLanguage.name}</span>
        )}
        <ChevronDownIcon 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && variant === 'header' && createPortal(
        <>
          <div 
            className="fixed inset-0 z-[99998]" 
            onClick={() => setIsOpen(false)}
          />
          
          <div 
            className={dropdownClass}
            style={{ 
              top: `${dropdownPosition.top}px`, 
              right: `${dropdownPosition.right}px` 
            }}
          >
            {languages.map((language) => (
              <div
                key={language.code}
                onClick={() => changeLanguage(language.code)}
                className={`${itemClass} ${
                  currentLanguage.code === language.code ? 'bg-emerald-100 text-emerald-700 font-medium' : ''
                }`}
              >
                <span className="text-xl">{language.flag}</span>
                <span className="text-sm font-medium">{language.name}</span>
                {currentLanguage.code === language.code && (
                  <svg className="w-4 h-4 ml-auto text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </>, 
        document.body
      )}

      {isOpen && variant !== 'header' && (
        <>
          <div 
            className="fixed inset-0 z-[9998]" 
            onClick={() => setIsOpen(false)}
          />
          
          <div className={dropdownClass}>
            {languages.map((language) => (
              <div
                key={language.code}
                onClick={() => changeLanguage(language.code)}
                className={`${itemClass} ${
                  currentLanguage.code === language.code ? 'bg-emerald-100 text-emerald-700 font-medium' : ''
                }`}
              >
                <span className="text-xl">{language.flag}</span>
                <span className="text-sm font-medium">{language.name}</span>
                {currentLanguage.code === language.code && (
                  <svg className="w-4 h-4 ml-auto text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSwitcher; 