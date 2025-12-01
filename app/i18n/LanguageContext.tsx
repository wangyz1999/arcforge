'use client';
 
import React, { createContext, useContext, useState, ReactNode, useCallback, useRef } from 'react';

// Define supported languages (ordered for dropdown)
export const SUPPORTED_LANGUAGES = [
  'en', // English
  'es', // Spanish
  'fr', // French
  'de', // German
  'it', // Italian
  'pt', // Portuguese
  'ru', // Russian
  'ja', // Japanese
  'ko', // Korean
  'zh', // Simplified Chinese
  'zht', // Traditional Chinese
  'ar', // Arabic
] as const;
export type Language = typeof SUPPORTED_LANGUAGES[number];

// Language labels for the selector
export const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'English',
  fr: 'Français',
  ja: '日本語',
  de: 'Deutsch',
  pt: 'Português',
  es: 'Español',
  it: 'Italiano',
  ru: 'Русский',
  ko: '한국어',
  zh: '简体中文',
  zht: '繁體中文',
  ar: 'العربية',
};

// Short language codes for consistent baseline alignment across platforms
export const LANGUAGE_CODES: Record<Language, string> = {
  en: 'EN',
  fr: 'FR',
  ja: 'JA',
  de: 'DE',
  pt: 'PT',
  es: 'ES',
  it: 'IT',
  ru: 'RU',
  ko: 'KO',
  zh: 'ZH',
  zht: 'HK',
  ar: 'AR',
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  tItem: (itemName: string) => string;
  translations: Record<string, string>;
  itemTranslations: Record<string, string>;
  isHydrated: boolean;
  showTranslationWarning: boolean;
  dismissTranslationWarning: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Storage key for persisting language preference
const LANGUAGE_STORAGE_KEY = 'arcforge-language';

// Default language
const DEFAULT_LANGUAGE: Language = 'en';

interface LanguageProviderProps {
  children: ReactNode;
  translations: Record<Language, Record<string, string>>;
  itemTranslations: Record<Language, Record<string, string>>;
}

export function LanguageProvider({ children, translations, itemTranslations }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_LANGUAGE;
    }

    try {
      const savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language | null;
      if (savedLanguage && SUPPORTED_LANGUAGES.includes(savedLanguage)) {
        return savedLanguage;
      }

      const browserLang = window.navigator.language.split('-')[0] as Language;
      if (SUPPORTED_LANGUAGES.includes(browserLang)) {
        return browserLang;
      }
    } catch {
      // localStorage or navigator not available
    }

    return DEFAULT_LANGUAGE;
  });
  const [isHydrated] = useState<boolean>(() => typeof window !== 'undefined');
  const [showTranslationWarning, setShowTranslationWarning] = useState(false);
  const isUserAction = useRef(false);

  // Save language preference when it changes (user action only)
  const setLanguage = useCallback((lang: Language) => {
    isUserAction.current = true;
    setLanguageState(lang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      // Update html lang attribute
      if (typeof document !== 'undefined') {
        document.documentElement.lang = lang;
      }
    } catch {
      // localStorage not available
    }
    
    // Show warning only when user switches to non-English
    if (lang !== 'en') {
      setShowTranslationWarning(true);
    } else {
      setShowTranslationWarning(false);
    }
  }, []);

  // Dismiss the translation warning
  const dismissTranslationWarning = useCallback(() => {
    setShowTranslationWarning(false);
  }, []);

  // Translation function for UI strings
  const t = useCallback((key: string): string => {
    const currentTranslations = translations[language] || translations[DEFAULT_LANGUAGE];
    return currentTranslations[key] || translations[DEFAULT_LANGUAGE]?.[key] || key;
  }, [language, translations]);

  // Translation function for item names
  const tItem = useCallback((itemName: string): string => {
    // If language is English, return original name
    if (language === 'en') {
      return itemName;
    }
    // Otherwise, look up translation
    const currentItemTranslations = itemTranslations[language] || {};
    return currentItemTranslations[itemName] || itemName;
  }, [language, itemTranslations]);

  // Get current translations objects
  const currentTranslations = translations[language] || translations[DEFAULT_LANGUAGE];
  const currentItemTranslations = itemTranslations[language] || {};

  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage, 
      t, 
      tItem,
      translations: currentTranslations,
      itemTranslations: currentItemTranslations,
      isHydrated,
      showTranslationWarning,
      dismissTranslationWarning,
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

// Custom hook to use language context
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Custom hook for just translation function (convenience)
export function useTranslation() {
  const { t, tItem, language, isHydrated, showTranslationWarning, dismissTranslationWarning } = useLanguage();
  return { t, tItem, language, isHydrated, showTranslationWarning, dismissTranslationWarning };
}
