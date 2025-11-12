import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files - Only the three languages needed
import enTranslations from './locales/en.json';
import esTranslations from './locales/es.json';
import tlTranslations from './locales/tl.json';

const resources = {
  en: { translation: enTranslations },
  es: { translation: esTranslations },
  tl: { translation: tlTranslations }
};

// Get saved language preference from localStorage
const getSavedLanguage = () => {
  try {
    const settings = localStorage.getItem('userSettings');
    if (settings) {
      const parsed = JSON.parse(settings);
      return parsed.display?.language || 'en';
    }
  } catch (error) {
    console.error('Error getting saved language:', error);
  }
  return 'en';
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: getSavedLanguage(),
    fallbackLng: 'en',
    debug: false,
    
    interpolation: {
      escapeValue: false // React already escapes values
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    },
    
    react: {
      useSuspense: false // Disable suspense for smoother loading
    }
  });

// Listen for settings changes to update language
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'userSettings' && e.newValue) {
      try {
        const settings = JSON.parse(e.newValue);
        const newLang = settings.display?.language;
        if (newLang && newLang !== i18n.language) {
          i18n.changeLanguage(newLang);
        }
      } catch (error) {
        console.error('Error updating language from storage:', error);
      }
    }
  });
}

export default i18n;

// Helper function to change language
export const changeLanguage = (lang) => {
  i18n.changeLanguage(lang);
  
  // Update localStorage
  try {
    const settings = JSON.parse(localStorage.getItem('userSettings') || '{}');
    if (!settings.display) settings.display = {};
    settings.display.language = lang;
    localStorage.setItem('userSettings', JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving language preference:', error);
  }
  
  // Update document direction for RTL languages (not needed for our three languages)
  document.documentElement.setAttribute('dir', 'ltr');
};

// Helper function to get current language
export const getCurrentLanguage = () => i18n.language;

// Helper function to get available languages - Only the three requested
export const getAvailableLanguages = () => [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'tl', name: 'Tagalog', flag: '🇵🇭' }
];