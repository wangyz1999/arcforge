"use client";

import { useRef, useEffect, useState } from "react";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { faCoffee, faSearch } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "../i18n";
import LanguageSelector from "./LanguageSelector";

interface HeaderProps {
  activePage: "database";
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  onLogoClick?: () => void;
}

export default function Header({
  activePage,
  searchQuery,
  setSearchQuery,
  onLogoClick,
}: HeaderProps) {
  const { t } = useTranslation();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isMac, setIsMac] = useState(true);

  // Detect if user is on macOS
  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf("MAC") >= 0);
  }, []);

  // Cmd+K / Ctrl+K keyboard shortcut to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Escape key to blur search input
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      searchInputRef.current?.blur();
    }
  };

  return (
    <header className="bg-black/20 backdrop-blur-xl border-b border-purple-500/30 sticky top-0 z-40 shadow-lg shadow-purple-500/5">
      <div className="flex items-center px-2 sm:px-4 md:px-8 relative">
        {/* Logo */}
        <button
          onClick={onLogoClick}
          className="flex-shrink-0 h-16 sm:h-20 md:h-24 flex items-center cursor-pointer"
        >
          <Image
            src="/logo.webp"
            alt="ARC Forge"
            width={320}
            height={96}
            className="h-full w-auto drop-shadow-2xl"
            priority
          />
        </button>

        {/* Search Bar - Centered */}
        {setSearchQuery && (
          <div className="flex-1 flex justify-center px-4">
            <div className="relative group w-full max-w-md lg:max-w-xl hidden sm:block">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FontAwesomeIcon
                  icon={faSearch}
                  className="text-purple-400/70 text-base group-focus-within:text-purple-400 transition-colors"
                />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                placeholder={t("search.placeholder")}
                value={searchQuery || ""}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="w-full h-11 sm:h-12 md:h-14 pl-12 pr-20 bg-black/50 backdrop-blur-sm border border-purple-500/30 rounded-xl md:rounded-2xl text-gray-100 text-base placeholder-gray-500 focus:outline-none focus:border-purple-400/60 focus:ring-2 focus:ring-purple-500/30 focus:bg-black/60 transition-all duration-300"
              />
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <kbd className="hidden md:inline-flex items-center gap-0.5 px-2 py-1 text-xs font-medium text-gray-400 bg-black/60 border border-purple-500/30 rounded-lg">
                  {isMac ? (
                    <span className="text-[10px]">⌘</span>
                  ) : (
                    <span className="text-[10px]">Ctrl+</span>
                  )}
                  K
                </kbd>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex gap-1 sm:gap-2 md:gap-3 items-center flex-shrink-0">
          <LanguageSelector />
          <a
            href="https://buymeacoffee.com/wangyz1999"
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 flex-shrink-0 flex items-center justify-center bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-lg md:rounded-xl text-gray-300 hover:bg-yellow-500/20 hover:text-yellow-300 hover:border-yellow-400/50 transition-all duration-300 hover:scale-105"
            aria-label={t("nav.buyMeACoffee")}
          >
            <FontAwesomeIcon icon={faCoffee} className="text-lg sm:text-xl" />
          </a>
          <a
            href="https://github.com/wangyz1999/arcforge"
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 flex-shrink-0 flex items-center justify-center bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-lg md:rounded-xl text-gray-300 hover:bg-purple-500/20 hover:text-purple-200 hover:border-purple-400/50 transition-all duration-300 hover:scale-105"
            aria-label={t("nav.viewOnGithub")}
          >
            <FontAwesomeIcon icon={faGithub} className="text-lg sm:text-xl" />
          </a>
        </nav>
      </div>
    </header>
  );
}
