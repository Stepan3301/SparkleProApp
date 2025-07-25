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

export const t = (key: string, fallback?: string): string => {
  const lang = getCurrentLanguage() as keyof typeof translations;
  const translationData = translations[lang] || translations.en;
  
  // Simple nested key access
  const keys = key.split('.');
  let result: any = translationData;
  
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
    i18n: {
      language: currentLanguage,
      changeLanguage
    }
  };
}; 