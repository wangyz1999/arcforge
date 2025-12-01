import enTranslations from './translations/en.json';
import frTranslations from './translations/fr.json';
import jaTranslations from './translations/ja.json';
import deTranslations from './translations/de.json';
import ptTranslations from './translations/pt.json';
import esTranslations from './translations/es.json';
import itTranslations from './translations/it.json';
import ruTranslations from './translations/ru.json';
import koTranslations from './translations/ko.json';
import zhTranslations from './translations/zh.json';
import zhtTranslations from './translations/zht.json';
import arTranslations from './translations/ar.json';
import itemsFrTranslations from './translations/items_fr.json';
import itemsJaTranslations from './translations/items_ja.json';
import itemsDeTranslations from './translations/items_de.json';
import itemsPtTranslations from './translations/items_pt.json';
import itemsEsTranslations from './translations/items_es.json';
import itemsItTranslations from './translations/items_it.json';
import itemsRuTranslations from './translations/items_ru.json';
import itemsKoTranslations from './translations/items_ko.json';
import itemsZhTranslations from './translations/items_zh.json';
import itemsZhtTranslations from './translations/items_zht.json';
import itemsArTranslations from './translations/items_ar.json';
import { Language } from './LanguageContext';

// Export all UI translations as a single object
export const translations: Record<Language, Record<string, string>> = {
  en: enTranslations,
  fr: frTranslations,
  ja: jaTranslations,
  de: deTranslations,
  pt: ptTranslations,
  es: esTranslations,
  it: itTranslations,
  ru: ruTranslations,
  ko: koTranslations,
  zh: zhTranslations,
  zht: zhtTranslations,
  ar: arTranslations,
};

// Export item translations
export const itemTranslations: Record<Language, Record<string, string>> = {
  en: {}, // English uses original names
  fr: itemsFrTranslations,
  ja: itemsJaTranslations,
  de: itemsDeTranslations,
  pt: itemsPtTranslations,
  es: itemsEsTranslations,
  it: itemsItTranslations,
  ru: itemsRuTranslations,
  ko: itemsKoTranslations,
  zh: itemsZhTranslations,
  zht: itemsZhtTranslations,
  ar: itemsArTranslations,
};

// Re-export everything from LanguageContext
export * from './LanguageContext';
