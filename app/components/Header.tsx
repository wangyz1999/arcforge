"use client";

import { useRef, useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { faCoffee, faSearch, faTimes } from "@fortawesome/free-solid-svg-icons";
import { useTranslation, itemTranslations } from "../i18n";
import LanguageSelector from "./LanguageSelector";
import itemsData from "../../data/items_database.json";
import { Item } from "../types/item";

interface HeaderProps {
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  onCraftingGraphClick?: () => void;
  onOpenCraftingGraph?: (itemName: string) => void;
  isGraphModalOpen?: boolean;
  onLogoClick?: () => void;
}

export default function Header({
  searchQuery,
  setSearchQuery,
  onCraftingGraphClick,
  onOpenCraftingGraph,
  isGraphModalOpen,
  onLogoClick,
}: HeaderProps) {
  const { t, tItem, language } = useTranslation();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const isMac = useMemo(() => {
    if (typeof navigator !== "undefined") {
      return navigator.platform.toUpperCase().indexOf("MAC") >= 0;
    }
    return false;
  }, []);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 640;
    }
    return false;
  });

  // Listen for screen size changes
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Get current item translations for search dropdown
  const currentItemTranslations = useMemo(() => itemTranslations[language] || {}, [language]);

  // Get all item names for search dropdown
  const allItemNames = useMemo(() => {
    return (itemsData as Item[]).map((item) => item.name);
  }, []);

  // Filter items based on search query for dropdown
  const filteredSearchItems = useMemo(() => {
    if (!searchQuery?.trim()) return [];
    const query = searchQuery.toLowerCase();
    return allItemNames
      .filter((name) => {
        const matchesOriginal = name.toLowerCase().includes(query);
        const translatedName = currentItemTranslations[name] || name;
        const matchesTranslated = translatedName.toLowerCase().includes(query);
        return matchesOriginal || matchesTranslated;
      })
      .slice(0, 8); // Limit to 8 results
  }, [searchQuery, allItemNames, currentItemTranslations]);

  // Handle clicking outside search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcuts for desktop: Cmd+K / Ctrl+K to focus search, Escape to unfocus
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if we're on desktop (screen width >= 640px)
      if (window.innerWidth < 640) return;

      // Cmd+K (Mac) or Ctrl+K (Windows/Linux) to focus search
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchFocused(true);
      }

      // Escape to unfocus search bar
      if (event.key === "Escape" && document.activeElement === searchInputRef.current) {
        event.preventDefault();
        searchInputRef.current?.blur();
        setIsSearchFocused(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handle search item select
  const handleSearchItemSelect = (name: string) => {
    // If graph modal is open, navigate to that item in the graph
    if (isGraphModalOpen && onOpenCraftingGraph) {
      onOpenCraftingGraph(name);
    } else if (setSearchQuery) {
      // Otherwise, fill the search box for filtering
      setSearchQuery(name);
    }
    setIsSearchFocused(false);
  };

  return (
    <header
      className="bg-black/20 backdrop-blur-xl border-b border-purple-500/30 sticky top-0 z-40 shadow-lg shadow-purple-500/5"
      style={{ "--header-height": "64px" } as React.CSSProperties}
    >
      <div className="flex items-center justify-between px-2 sm:px-4 md:pr-8 relative gap-2 sm:gap-4">
        {/* Logo */}
        <Link
          href="/"
          onClick={(e) => {
            if (onLogoClick) {
              e.preventDefault();
              onLogoClick();
            }
          }}
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
        </Link>

        {/* Search Bar - Always visible when setSearchQuery is provided */}
        {setSearchQuery && (
          <div ref={searchContainerRef} className="flex-1 max-w-md relative">
            <div className="relative flex items-center">
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute left-3 text-purple-400/70 text-sm pointer-events-none z-10"
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery || ""}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => {
                  // Delay to allow click on dropdown items
                  setTimeout(() => setIsSearchFocused(false), 150);
                }}
                placeholder={isMobile ? t("search.placeholderShort") : t("search.placeholder")}
                className="w-full pl-10 pr-8 sm:pr-20 py-2 sm:py-2.5 bg-black/50 backdrop-blur-sm border border-purple-500/30 rounded-xl text-gray-100 text-sm placeholder-gray-500 focus:outline-none focus:border-purple-400/60 focus:ring-2 focus:ring-purple-500/30 focus:bg-black/60 transition-all duration-300 shadow-lg shadow-purple-500/10 focus:shadow-purple-500/20"
              />
              {/* Keyboard shortcut hint - only on desktop when not focused and no search query */}
              {!isSearchFocused && !searchQuery && (
                <span className="hidden sm:flex absolute right-3 items-center gap-1 text-gray-500 text-xs pointer-events-none">
                  <kbd className="font-mono bg-black/40 border border-gray-600/50 rounded px-1.5 py-0.5 text-[10px]">
                    {isMac ? "⌘" : "Ctrl"}
                  </kbd>
                  <kbd className="font-mono bg-black/40 border border-gray-600/50 rounded px-1.5 py-0.5 text-[10px]">
                    K
                  </kbd>
                </span>
              )}
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-3 text-gray-400 hover:text-gray-200 transition-colors"
                >
                  <FontAwesomeIcon icon={faTimes} className="text-sm" />
                </button>
              )}
            </div>

            {/* Search Dropdown - Only show when crafting graph modal is open */}
            {isGraphModalOpen && isSearchFocused && filteredSearchItems.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-black/95 backdrop-blur-xl border border-purple-500/30 rounded-xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto z-50">
                {filteredSearchItems.map((name) => (
                  <button
                    key={name}
                    onClick={() => handleSearchItemSelect(name)}
                    className="w-full px-4 py-2.5 text-left hover:bg-purple-500/20 transition-colors border-b border-purple-500/10 last:border-b-0"
                  >
                    <span className="text-sm text-gray-100">{tItem(name)}</span>
                    {currentItemTranslations[name] && (
                      <span className="ml-2 text-xs text-gray-500">({name})</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className="flex gap-1 sm:gap-2 md:gap-3 items-center flex-shrink-0">
          {/* Crafting Graph Button - Hidden on mobile to save space for search bar */}
          <button
            onClick={onCraftingGraphClick}
            className={`hidden sm:block group relative px-4 py-2.5 md:px-6 md:py-3 ${
              isGraphModalOpen
                ? "bg-gradient-to-br from-purple-500/30 to-purple-600/30 border border-purple-400/50 text-purple-200 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30"
                : "bg-black/40 backdrop-blur-sm border border-purple-500/30 text-gray-300 hover:bg-purple-500/20 hover:text-purple-200 hover:border-purple-400/50"
            } rounded-lg md:rounded-xl text-sm md:text-base font-semibold ${
              isGraphModalOpen
                ? "hover:from-purple-500/40 hover:to-purple-600/40 hover:border-purple-400/70"
                : ""
            } transition-all duration-300 hover:scale-105 whitespace-nowrap`}
          >
            <span className="relative z-10">{t("nav.craftingGraph")}</span>
            {isGraphModalOpen && (
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400/0 to-purple-600/20 rounded-lg md:rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </button>
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
