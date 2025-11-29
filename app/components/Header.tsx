'use client';

import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { faCoffee } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '../i18n';
import LanguageSelector from './LanguageSelector';

interface HeaderProps {
  activePage: 'database' | 'graph';
}

export default function Header({ activePage }: HeaderProps) {
  const { t } = useTranslation();
  const isDatabaseActive = activePage === 'database';
  const isGraphActive = activePage === 'graph';

  return (
    <header className="bg-black/20 backdrop-blur-xl border-b border-purple-500/30 sticky top-0 z-40 shadow-lg shadow-purple-500/5">
      <div className="flex items-center justify-between px-2 sm:px-4 md:pr-8 relative">
        {/* Logo */}
        <a href="/" className="flex-shrink-0 h-16 sm:h-20 md:h-24 flex items-center cursor-pointer">
          <Image
            src="/logo.webp"
            alt="ARC Forge"
            width={320}
            height={96}
            className="h-full w-auto drop-shadow-2xl"
            priority
          />
        </a>
        
        {/* Navigation */}
        <nav className="flex gap-1 sm:gap-2 md:gap-3 items-center">
          <a
            href="/"
            className={`group relative px-2 py-2 sm:px-4 sm:py-2.5 md:px-6 md:py-3 ${
              isDatabaseActive
                ? 'bg-gradient-to-br from-purple-500/30 to-purple-600/30 border border-purple-400/50 text-purple-200 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30'
                : 'bg-black/40 backdrop-blur-sm border border-purple-500/30 text-gray-300 hover:bg-purple-500/20 hover:text-purple-200 hover:border-purple-400/50'
            } rounded-lg md:rounded-xl text-xs sm:text-sm md:text-base font-semibold ${
              isDatabaseActive ? 'hover:from-purple-500/40 hover:to-purple-600/40 hover:border-purple-400/70' : ''
            } transition-all duration-300 hover:scale-105 whitespace-nowrap`}
          >
            <span className="relative z-10 hidden sm:inline">{t('nav.itemDatabase')}</span>
            <span className="relative z-10 sm:hidden">{t('nav.itemDatabaseShort')}</span>
            {isDatabaseActive && (
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400/0 to-purple-600/20 rounded-lg md:rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </a>
          <a
            href="/crafting-graph?item=Power%20Rod"
            className={`group relative px-2 py-2 sm:px-4 sm:py-2.5 md:px-6 md:py-3 ${
              isGraphActive
                ? 'bg-gradient-to-br from-purple-500/30 to-purple-600/30 border border-purple-400/50 text-purple-200 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30'
                : 'bg-black/40 backdrop-blur-sm border border-purple-500/30 text-gray-300 hover:bg-purple-500/20 hover:text-purple-200 hover:border-purple-400/50'
            } rounded-lg md:rounded-xl text-xs sm:text-sm md:text-base font-semibold ${
              isGraphActive ? 'hover:from-purple-500/40 hover:to-purple-600/40 hover:border-purple-400/70' : ''
            } transition-all duration-300 hover:scale-105 whitespace-nowrap`}
          >
            <span className="relative z-10 hidden sm:inline">{t('nav.craftingGraph')}</span>
            <span className="relative z-10 sm:hidden">{t('nav.craftingGraphShort')}</span>
            {isGraphActive && (
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400/0 to-purple-600/20 rounded-lg md:rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </a>
          <LanguageSelector />
          <a
            href="https://buymeacoffee.com/wangyz1999"
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 flex-shrink-0 flex items-center justify-center bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-lg md:rounded-xl text-gray-300 hover:bg-yellow-500/20 hover:text-yellow-300 hover:border-yellow-400/50 transition-all duration-300 hover:scale-105"
            aria-label={t('nav.buyMeACoffee')}
          >
            <FontAwesomeIcon icon={faCoffee} className="text-lg sm:text-xl" />
          </a>
          <a
            href="https://github.com/wangyz1999/arcforge"
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 flex-shrink-0 flex items-center justify-center bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-lg md:rounded-xl text-gray-300 hover:bg-purple-500/20 hover:text-purple-200 hover:border-purple-400/50 transition-all duration-300 hover:scale-105"
            aria-label={t('nav.viewOnGithub')}
          >
            <FontAwesomeIcon icon={faGithub} className="text-lg sm:text-xl" />
          </a>
        </nav>
      </div>
    </header>
  );
}
