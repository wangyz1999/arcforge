import enTranslations from './translations/en.json';
import frTranslations from './translations/fr.json';
import itemsFrTranslations from './translations/items_fr.json';
import { Language } from './LanguageContext';

// Export all UI translations as a single object
export const translations: Record<Language, Record<string, string>> = {
  en: enTranslations,
  fr: frTranslations,
};

// Export item translations
export const itemTranslations: Record<Language, Record<string, string>> = {
  en: {}, // English uses original names
  fr: itemsFrTranslations,
};

// Re-export everything from LanguageContext
export * from './LanguageContext';
