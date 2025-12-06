"use client";

import { useRef, useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faTimes } from "@fortawesome/free-solid-svg-icons";
import itemsRelationData from "../../../data/items_relation.json";
import { useTranslation, itemTranslations } from "../../i18n";
import { ItemData } from "../../types/graph";

// Prevent FontAwesome from adding its CSS automatically since we're importing it manually
config.autoAddCss = false;

interface QuickSearchBarProps {
  selectedEdgeTypes: Set<string>;
  onItemSelect?: (itemName: string) => void; // Optional callback for modal use
}

export default function QuickSearchBar({ selectedEdgeTypes, onItemSelect }: QuickSearchBarProps) {
  const { t, tItem, language } = useTranslation();
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Get current item translations for search
  const currentItemTranslations = useMemo(() => itemTranslations[language] || {}, [language]);

  // Get all item names for search
  const allItemNames = useMemo(() => {
    return (itemsRelationData as ItemData[]).map((item) => item.name);
  }, []);

  // Filter items based on search query
  const filteredSearchItems = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return allItemNames
      .filter((name) => {
        const matchesOriginal = name.toLowerCase().includes(query);
        const translatedName = currentItemTranslations[name] || name;
        const matchesTranslated = translatedName.toLowerCase().includes(query);
        return matchesOriginal || matchesTranslated;
      })
      .slice(0, 10); // Limit to 10 results
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

  // Navigate to selected item from search
  const handleSearchItemSelect = (name: string) => {
    if (onItemSelect) {
      // Use callback for modal navigation
      onItemSelect(name);
    } else {
      // Use router for page navigation
      const filterParam = Array.from(selectedEdgeTypes).join(",");
      router.push(`/crafting-graph?item=${encodeURIComponent(name)}&filters=${filterParam}`, {
        scroll: false,
      });
    }
    setSearchQuery("");
    setIsSearchFocused(false);
  };

  return (
    <div ref={searchContainerRef} className="absolute top-4 right-4 z-20 w-64 md:w-80">
      <div className="relative">
        <div className="relative flex items-center">
          <FontAwesomeIcon
            icon={faSearch}
            className="absolute left-3 text-gray-300 text-sm pointer-events-none z-10"
          />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            placeholder={t("search.placeholder")}
            className="w-full pl-9 pr-8 py-2 bg-black/60 backdrop-blur-xl border border-white/20 rounded-lg text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all"
          />
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

        {/* Search Dropdown */}
        {isSearchFocused && filteredSearchItems.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-black/90 backdrop-blur-xl border border-white/20 rounded-lg shadow-2xl overflow-hidden max-h-80 overflow-y-auto">
            {filteredSearchItems.map((name) => (
              <button
                key={name}
                onClick={() => handleSearchItemSelect(name)}
                className="w-full px-4 py-2.5 text-left hover:bg-purple-500/20 transition-colors border-b border-white/5 last:border-b-0"
              >
                <span className="text-sm text-gray-100">{tItem(name)}</span>
                {currentItemTranslations[name] && (
                  <span className="ml-2 text-xs text-gray-500">({name})</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* No results message */}
        {isSearchFocused && searchQuery.trim() && filteredSearchItems.length === 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-black/90 backdrop-blur-xl border border-white/20 rounded-lg shadow-2xl p-3">
            <span className="text-sm text-gray-400">{t("search.noResults")}</span>
          </div>
        )}
      </div>
    </div>
  );
}
