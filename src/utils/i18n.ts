// Simple translation utility
import enTranslations from '../i18n/locales/en.json';
import ruTranslations from '../i18n/locales/ru.json';

type Translations = typeof enTranslations;

const translations = {
  en: enTranslations,
  ru: ruTranslations
} as const;

export const getCurrentLanguage = (): string => {
  return localStorage.getItem('i18nextLng') || 'en';
};

export const setLanguage = (lang: string): void => {
  localStorage.setItem('i18nextLng', lang);
  window.location.reload();
};

export const t = (key: string, fallback?: string, options?: { count?: number }): string => {
  const lang = getCurrentLanguage() as keyof typeof translations;
  const translationData = translations[lang] || translations.en;
  
  // Simple nested key access
  let result: any = translationData;
  
  // Handle pluralization
  if (options?.count !== undefined) {
    // Try to find plural key first
    const pluralKey = `${key}_plural`;
    const keys = pluralKey.split('.');
    
    for (const k of keys) {
      if (result && typeof result === 'object' && k in result) {
        result = result[k];
      } else {
        break;
      }
    }
    
    // If plural key exists and count > 1, use it
    if (typeof result === 'string' && options.count > 1) {
      return result;
    }
    
    // Reset for singular key
    result = translationData;
  }
  
  // Regular key access
  const keys = key.split('.');
  for (const k of keys) {
    if (result && typeof result === 'object' && k in result) {
      result = result[k];
    } else {
      return fallback || key;
    }
  }
  
  return typeof result === 'string' ? result : (fallback || key);
};

export const useSimpleTranslation = () => {
  const changeLanguage = (lang: string) => {
    setLanguage(lang);
  };
  
  const currentLanguage = getCurrentLanguage();
  
  return {
    t,
    // Helper function for pluralization
    tPlural: (key: string, count: number, fallback?: string) => t(key, fallback, { count }),
    i18n: {
      language: currentLanguage,
      changeLanguage
    }
  };
}; 