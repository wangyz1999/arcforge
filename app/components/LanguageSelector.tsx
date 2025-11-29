'use client';

import { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { useLanguage, SUPPORTED_LANGUAGES, LANGUAGE_LABELS, LANGUAGE_FLAGS, Language } from '../i18n';

export default function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 sm:w-11 sm:h-11 md:w-auto md:h-12 md:px-3 flex-shrink-0 flex items-center justify-center gap-2 bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-lg md:rounded-xl text-gray-300 hover:bg-purple-500/20 hover:text-purple-200 hover:border-purple-400/50 transition-all duration-300 hover:scale-105"
        aria-label={t('language.select')}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="text-base md:text-lg">{LANGUAGE_FLAGS[language]}</span>
        <span className="hidden md:inline text-sm font-medium">{LANGUAGE_LABELS[language]}</span>
        <FontAwesomeIcon 
          icon={faChevronDown} 
          className={`hidden md:inline text-xs transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className="absolute top-full right-0 mt-2 w-40 bg-black/95 backdrop-blur-xl border border-purple-500/40 rounded-xl shadow-2xl shadow-purple-500/20 overflow-hidden z-50 animate-fade-in"
          role="listbox"
          aria-label={t('language.select')}
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang}
              onClick={() => handleLanguageChange(lang)}
              className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-all duration-200 ${
                language === lang
                  ? 'bg-purple-500/30 text-purple-200'
                  : 'text-gray-300 hover:bg-purple-500/20 hover:text-purple-200'
              }`}
              role="option"
              aria-selected={language === lang}
            >
              <span className="text-lg">{LANGUAGE_FLAGS[lang]}</span>
              <span className="font-medium text-sm">{LANGUAGE_LABELS[lang]}</span>
              {language === lang && (
                <span className="ml-auto text-purple-400 text-xs">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

