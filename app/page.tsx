"use client";

import { useState, useMemo, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faCog, faEye } from "@fortawesome/free-solid-svg-icons";
import itemsData from "../data/items_database.json";
import StructuredData from "./components/StructuredData";
import Header from "./components/Header";
import ItemFiltersPanel, { SortField } from "./components/items/ItemFiltersPanel";
import ItemsGrid from "./components/items/ItemsGrid";
import ItemDetailPanel from "./components/items/ItemDetailPanel";
import SettingsPanel from "./components/items/SettingsPanel";
import CraftingGraphModal from "./components/graph/CraftingGraphModal";
import { Item } from "./types/item";
import { typeToCategory } from "./config/categoryConfig";
import { rarityOrder } from "./config/rarityConfig";
import { useTranslation, itemTranslations } from "./i18n";
import TrackedItemsPanel from "./components/items/TrackedItemsPanel";

// Prevent FontAwesome from adding its CSS automatically since we're importing it manually
config.autoAddCss = false;

function HomeContent() {
  const { t, tItem, language } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortAscending, setSortAscending] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isTrackedOpen, setIsTrackedOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [itemSize, setItemSize] = useState<"tiny" | "small" | "medium" | "large">("small");
  const [displayPrice, setDisplayPrice] = useState(false);
  const [displayWeight, setDisplayWeight] = useState(false);
  const [showTrackIcons, setShowTrackIcons] = useState(false);
  const [openCraftingGraphOnClick, setOpenCraftingGraphOnClick] = useState(false);
  const [lightweightMode, setLightweightMode] = useState(false);
  const [showSpecialIcons, setShowSpecialIcons] = useState(false);

  // Crafting Graph Modal state - check URL params for initial state
  const graphItemParam = searchParams.get("graph");
  const [isGraphModalOpen, setIsGraphModalOpen] = useState(!!graphItemParam);
  const [graphItemName, setGraphItemName] = useState(graphItemParam || "Power Rod");

  // Handle URL parameter changes for graph modal
  useEffect(() => {
    if (graphItemParam) {
      // Use requestAnimationFrame to defer setState and avoid cascading renders
      requestAnimationFrame(() => {
        setGraphItemName(graphItemParam);
        setIsGraphModalOpen(true);
      });
    }
  }, [graphItemParam]);

  // Fix hydration bug: Initialize trackedItems as empty Set on both server and client
  const [trackedItems, setTrackedItems] = useState<Set<string>>(new Set());

  // Load tracked items from localStorage after component mounts (client-side only)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("tracked_items");
      if (raw) {
        const arr = JSON.parse(raw);
        const next = new Set<string>(Array.isArray(arr) ? arr : []);
        // Avoid calling setState directly in the effect body
        setTimeout(() => {
          setTrackedItems(next);
        }, 0);
      }
    } catch (error) {
      console.error("Failed to load tracked items from localStorage:", error);
    }
  }, []);

  // Load item view settings (size, price/weight visibility, track icons) from localStorage
  // If no lightweightMode is stored yet, default to enabled on small/mobile viewports.
  useEffect(() => {
    try {
      const raw = localStorage.getItem("item_view_settings");

      let parsed: {
        itemSize?: string;
        displayPrice?: unknown;
        displayWeight?: unknown;
        showTrackIcons?: unknown;
        openCraftingGraphOnClick?: unknown;
        lightweightMode?: unknown;
        showSpecialIcons?: unknown;
      } | null = null;

      if (raw) {
        parsed = JSON.parse(raw);
      }

      // Avoid calling setState directly in the effect body
      setTimeout(() => {
        if (parsed) {
          if (
            parsed.itemSize === "tiny" ||
            parsed.itemSize === "small" ||
            parsed.itemSize === "medium" ||
            parsed.itemSize === "large"
          ) {
            setItemSize(parsed.itemSize);
          }

          if (typeof parsed.displayPrice === "boolean") {
            setDisplayPrice(parsed.displayPrice);
          }

          if (typeof parsed.displayWeight === "boolean") {
            setDisplayWeight(parsed.displayWeight);
          }

          if (typeof parsed.showTrackIcons === "boolean") {
            setShowTrackIcons(parsed.showTrackIcons);
          }

          if (typeof parsed.openCraftingGraphOnClick === "boolean") {
            setOpenCraftingGraphOnClick(parsed.openCraftingGraphOnClick);
          }

          if (typeof parsed.lightweightMode === "boolean") {
            setLightweightMode(parsed.lightweightMode);
          }

          if (typeof parsed.showSpecialIcons === "boolean") {
            setShowSpecialIcons(parsed.showSpecialIcons);
          }
        }

        // No stored lightweightMode preference – enable by default on mobile-sized screens.
        if (typeof window !== "undefined") {
          const isMobile = window.innerWidth < 768;
          if (isMobile) {
            setLightweightMode(true);
          }
        }
      }, 0);
    } catch (error) {
      console.error("Failed to load item view settings from localStorage:", error);
    }
  }, []);

  // Persist item view settings whenever they change (client-side only)
  useEffect(() => {
    try {
      const settings = {
        itemSize,
        displayPrice,
        displayWeight,
        showTrackIcons,
        openCraftingGraphOnClick,
        lightweightMode,
        showSpecialIcons,
      };
      localStorage.setItem("item_view_settings", JSON.stringify(settings));
    } catch {
      // Ignore write errors (e.g., private mode / quota exceeded)
    }
  }, [
    itemSize,
    displayPrice,
    displayWeight,
    showTrackIcons,
    openCraftingGraphOnClick,
    lightweightMode,
    showSpecialIcons,
  ]);

  const toggleItemTracked = (name: string) => {
    setTrackedItems((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }

      try {
        localStorage.setItem("tracked_items", JSON.stringify(Array.from(next)));
      } catch {}

      return next;
    });
  };

  const isTracked = (name: string) => trackedItems.has(name);

  // Callback to open crafting graph modal for a specific item
  const openCraftingGraph = useCallback(
    (itemName: string) => {
      setGraphItemName(itemName);
      setIsGraphModalOpen(true);
      // Update URL without navigation
      router.push(`/?graph=${encodeURIComponent(itemName)}`, { scroll: false });
    },
    [router],
  );

  // Handle crafting graph button click (opens with current/default item)
  const handleCraftingGraphClick = useCallback(() => {
    setIsGraphModalOpen(true);
    router.push(`/?graph=${encodeURIComponent(graphItemName)}`, { scroll: false });
  }, [router, graphItemName]);

  // Initialize with no types selected
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(() => new Set());

  // Handle modal close - clear URL parameter
  const handleGraphModalClose = useCallback(() => {
    setIsGraphModalOpen(false);
    router.push("/", { scroll: false });
  }, [router]);

  // Handle logo click - reset all state
  const handleLogoClick = useCallback(() => {
    setSearchQuery("");
    setSelectedTypes(new Set());
    setSelectedItem(null);
    setIsSidebarOpen(false);
    setIsTrackedOpen(false);
    setIsSettingsOpen(false);
    setIsGraphModalOpen(false);
    router.push("/", { scroll: false });
  }, [router]);

  // Escape key to close item detail panel (desktop only)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only on desktop
      if (window.innerWidth < 640) return;

      if (event.key === "Escape" && selectedItem) {
        setSelectedItem(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedItem]);

  // Get all unique types grouped by category
  const typesByCategory = useMemo(() => {
    const grouped: { [category: string]: string[] } = {
      Special: [],
      Weapon: [],
      Modification: [],
      "Quick Use": [],
      Equipment: [],
      Loots: [],
    };

    // Add regular types
    const typesSet = new Set<string>();
    (itemsData as Item[]).forEach((item) => {
      if (item.infobox?.type) {
        typesSet.add(item.infobox.type);
      }
    });

    Array.from(typesSet).forEach((type) => {
      const category = typeToCategory[type];
      if (category && grouped[category]) {
        grouped[category].push(type);
      }
    });

    // Add special types
    const specialTypesSet = new Set<string>();
    (itemsData as Item[]).forEach((item) => {
      if (item.infobox?.special_types) {
        item.infobox.special_types.forEach((st) => specialTypesSet.add(st));
      }
    });
    grouped["Special"] = Array.from(specialTypesSet).sort();

    // Sort types within each category
    Object.keys(grouped).forEach((category) => {
      if (category !== "Special") {
        grouped[category].sort();
      }
    });

    return grouped;
  }, []);

  // Get current item translations for search, memoized by language
  const currentItemTranslations = useMemo(() => itemTranslations[language] || {}, [language]);

  const filteredAndSortedItems = useMemo(() => {
    let items = itemsData as Item[];

    // Filter by search query - search works with both original AND translated names
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter((item) => {
        // Search in original name
        const matchesOriginal = item.name.toLowerCase().includes(query);

        // Search in translated name (if available)
        const translatedName = currentItemTranslations[item.name] || item.name;
        const matchesTranslated = translatedName.toLowerCase().includes(query);

        // Search in rarity and type
        const matchesRarity = item.infobox?.rarity?.toLowerCase().includes(query);
        const matchesType = item.infobox?.type?.toLowerCase().includes(query);

        return matchesOriginal || matchesTranslated || matchesRarity || matchesType;
      });
    }

    // Filter by selected types (includes both regular types and special types)
    if (selectedTypes.size > 0) {
      // Separate regular types from special types
      const specialTypes = typesByCategory["Special"] || [];
      const regularTypes = new Set<string>();
      const selectedSpecialTypes = new Set<string>();

      selectedTypes.forEach((type) => {
        if (specialTypes.includes(type)) {
          selectedSpecialTypes.add(type);
        } else {
          regularTypes.add(type);
        }
      });

      items = items.filter((item) => {
        let matchesRegularType = false;
        let matchesSpecialType = false;

        // Check regular type
        if (regularTypes.size > 0) {
          matchesRegularType = !!(item.infobox?.type && regularTypes.has(item.infobox.type));
        }

        // Check special types
        if (selectedSpecialTypes.size > 0) {
          matchesSpecialType = !!item.infobox?.special_types?.some((st) =>
            selectedSpecialTypes.has(st),
          );
        }

        // If both regular and special types are selected, item must match both
        // If only one type of filter is active, item must match that one
        if (regularTypes.size > 0 && selectedSpecialTypes.size > 0) {
          return matchesRegularType && matchesSpecialType;
        } else if (regularTypes.size > 0) {
          return matchesRegularType;
        } else {
          return matchesSpecialType;
        }
      });
    }

    // Sort
    items = [...items].sort((a, b) => {
      let compareResult = 0;

      switch (sortField) {
        case "name":
          // Sort by translated name when in non-English language
          const nameA = tItem(a.name);
          const nameB = tItem(b.name);
          compareResult = nameA.localeCompare(nameB);
          break;
        case "rarity":
          const rarityA = rarityOrder[a.infobox?.rarity || "Common"] || 0;
          const rarityB = rarityOrder[b.infobox?.rarity || "Common"] || 0;
          compareResult = rarityA - rarityB;
          // Secondary sort by name when rarity is the same
          if (compareResult === 0) {
            compareResult = tItem(a.name).localeCompare(tItem(b.name));
          }
          break;
        case "sellprice":
          const priceA = Array.isArray(a.infobox?.sellprice)
            ? Number(a.infobox.sellprice[0])
            : Number(a.infobox?.sellprice || 0);
          const priceB = Array.isArray(b.infobox?.sellprice)
            ? Number(b.infobox.sellprice[0])
            : Number(b.infobox?.sellprice || 0);
          compareResult = priceA - priceB;
          // Secondary sort by name when price is the same
          if (compareResult === 0) {
            compareResult = tItem(a.name).localeCompare(tItem(b.name));
          }
          break;
        case "weight":
          const weightA = Number(a.infobox?.weight || 0);
          const weightB = Number(b.infobox?.weight || 0);
          compareResult = weightA - weightB;
          // Secondary sort by name when weight is the same
          if (compareResult === 0) {
            compareResult = tItem(a.name).localeCompare(tItem(b.name));
          }
          break;
      }

      return sortAscending ? compareResult : -compareResult;
    });

    return items;
  }, [
    searchQuery,
    sortField,
    sortAscending,
    selectedTypes,
    typesByCategory,
    currentItemTranslations,
    tItem,
  ]);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

  return (
    <>
      {/* Structured Data for SEO */}
      <StructuredData
        type="WebSite"
        data={{
          name: "ARC Forge",
          description:
            "Complete ARC Raiders item database with crafting graphs, recipes, and item information",
          url: baseUrl,
        }}
      />
      <StructuredData
        type="ItemList"
        data={{
          name: "ARC Raiders Items",
          description: "Complete list of items in ARC Raiders",
          numberOfItems: (itemsData as Item[]).length,
          items: (itemsData as Item[]).slice(0, 100).map((item) => ({
            name: item.name,
            description: item.infobox?.quote || `${item.infobox?.rarity} ${item.infobox?.type}`,
            image: item.image_urls?.thumb,
            url: `${baseUrl}/?search=${encodeURIComponent(item.name)}`,
          })),
        }}
      />

      <div className="min-h-screen bg-gradient-to-br from-[#07020b] via-[#0a0514] to-[#07020b] text-gray-100 flex flex-col relative overflow-hidden">
        {/* Header - Logo, Search, and Navigation */}
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onCraftingGraphClick={handleCraftingGraphClick}
          onOpenCraftingGraph={openCraftingGraph}
          isGraphModalOpen={isGraphModalOpen}
          onLogoClick={handleLogoClick}
        />

        {/* Mobile action bar: filters, settings, tracked items */}
        <div className="lg:hidden fixed bottom-6 left-0 right-0 z-30 flex items-center justify-start gap-4 px-4">
          {/* Mobile Sidebar Toggle Button */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="w-14 h-14 flex items-center justify-center bg-gradient-to-br from-purple-500/30 to-pink-500/20 backdrop-blur-xl rounded-full shadow-2xl hover:from-purple-500/40 hover:to-pink-500/30 transition-all duration-300 border border-white/20 hover:border-white/30 hover:shadow-purple-500/50 hover:scale-105"
            aria-label={t("buttons.openFilters")}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-full pointer-events-none"></div>
            <FontAwesomeIcon
              icon={faBars}
              className="text-white text-xl relative z-10 drop-shadow-lg"
            />
          </button>

          {/* Mobile Settings Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-14 h-14 flex items-center justify-center bg-gradient-to-br from-blue-500/30 to-purple-500/20 backdrop-blur-xl rounded-full shadow-2xl hover:from-blue-500/40 hover:to-purple-500/30 transition-all duration-300 border border-white/20 hover:border-white/30 hover:shadow-blue-500/50 hover:scale-105"
            aria-label={t("buttons.openSettings")}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-full pointer-events-none"></div>
            <FontAwesomeIcon
              icon={faCog}
              className="text-white text-xl relative z-10 drop-shadow-lg"
            />
          </button>

          {/* Mobile Tracked supplies button */}
          <button
            onClick={() => setIsTrackedOpen(true)}
            className="w-14 h-14 flex items-center justify-center bg-gradient-to-br from-blue-500/30 to-purple-500/20 backdrop-blur-xl rounded-full shadow-2xl hover:from-blue-500/40 hover:to-purple-500/30 transition-all duration-300 border border-white/20 hover:border-white/30 hover:shadow-blue-500/50 hover:scale-105"
            aria-label={t("track.openTrackedItems")}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-full pointer-events-none"></div>
            <FontAwesomeIcon
              icon={faEye}
              className="text-white text-xl relative z-10 drop-shadow-lg"
            />
          </button>
        </div>

        {/* Desktop tracked supplies button */}
        <button
          onClick={() => setIsTrackedOpen(true)}
          className="hidden lg:flex fixed bottom-25 right-8 z-30 w-14 h-14 items-center justify-center bg-gradient-to-br from-blue-500/30 to-purple-500/20 backdrop-blur-xl rounded-full shadow-2xl hover:from-blue-500/40 hover:to-purple-500/30 transition-all duration-300 border border-white/20 hover:border-white/30 hover:shadow-blue-500/50 hover:scale-105"
          aria-label={t("track.openTrackedItems")}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-full pointer-events-none"></div>
          <FontAwesomeIcon
            icon={faEye}
            className="text-white text-xl relative z-10 drop-shadow-lg"
          />
        </button>

        {/* Desktop Settings Button */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="hidden lg:flex fixed bottom-8 right-8 z-30 w-14 h-14 items-center justify-center bg-gradient-to-br from-blue-500/30 to-purple-500/20 backdrop-blur-xl rounded-full shadow-2xl hover:from-blue-500/40 hover:to-purple-500/30 transition-all duration-300 border border-white/20 hover:border-white/30 hover:shadow-blue-500/50 hover:scale-105"
          aria-label={t("buttons.openSettings")}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-full pointer-events-none"></div>
          <FontAwesomeIcon
            icon={faCog}
            className="text-white text-xl relative z-10 drop-shadow-lg"
          />
        </button>

        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* Sidebar Backdrop (Mobile Only) */}
          {isSidebarOpen && (
            <div
              className="lg:hidden fixed inset-0 bg-black/70 z-40 backdrop-blur-sm"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* Left Sidebar - Filters and Sort */}
          <ItemFiltersPanel
            sortField={sortField}
            setSortField={setSortField}
            sortAscending={sortAscending}
            setSortAscending={setSortAscending}
            selectedTypes={selectedTypes}
            setSelectedTypes={setSelectedTypes}
            typesByCategory={typesByCategory}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
          />

          {/* Items Grid */}
          <ItemsGrid
            items={filteredAndSortedItems}
            itemSize={itemSize}
            displayPrice={displayPrice}
            displayWeight={displayWeight}
            showTrackIcons={showTrackIcons}
            showSpecialIcons={showSpecialIcons}
            openCraftingGraphOnClick={openCraftingGraphOnClick}
            onOpenCraftingGraph={openCraftingGraph}
            lightweightMode={lightweightMode}
            onItemClick={setSelectedItem}
            onItemTracked={toggleItemTracked}
            isTrackedFunc={isTracked}
          />
        </div>

        {/* Item Detail Panel */}
        {selectedItem && (
          <ItemDetailPanel
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            onItemTracked={toggleItemTracked}
            isTrackedFunc={isTracked}
          />
        )}

        {/* Tracked items panel */}
        <TrackedItemsPanel
          items={itemsData as Item[]}
          trackedItems={trackedItems}
          isOpen={isTrackedOpen}
          itemSize={itemSize}
          displayPrice={displayPrice}
          displayWeight={displayWeight}
          showSpecialIcons={showSpecialIcons}
          openCraftingGraphOnClick={openCraftingGraphOnClick}
          onOpenCraftingGraph={openCraftingGraph}
          lightweightMode={lightweightMode}
          onClose={() => setIsTrackedOpen(false)}
          onItemClick={setSelectedItem}
          onItemTracked={toggleItemTracked}
          isTrackedFunc={isTracked}
        />

        {/* Settings Panel */}
        <SettingsPanel
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          itemSize={itemSize}
          setItemSize={setItemSize}
          displayPrice={displayPrice}
          setDisplayPrice={setDisplayPrice}
          displayWeight={displayWeight}
          setDisplayWeight={setDisplayWeight}
          showTrackIcons={showTrackIcons}
          setShowTrackIcons={setShowTrackIcons}
          openCraftingGraphOnClick={openCraftingGraphOnClick}
          setOpenCraftingGraphOnClick={setOpenCraftingGraphOnClick}
          lightweightMode={lightweightMode}
          setLightweightMode={setLightweightMode}
          showSpecialIcons={showSpecialIcons}
          setShowSpecialIcons={setShowSpecialIcons}
        />

        {/* Crafting Graph Modal */}
        <CraftingGraphModal
          isOpen={isGraphModalOpen}
          onClose={handleGraphModalClose}
          itemName={graphItemName}
          onItemChange={(name) => {
            setGraphItemName(name);
            router.push(`/?graph=${encodeURIComponent(name)}`, { scroll: false });
          }}
        />
      </div>
    </>
  );
}

// Loading fallback for Suspense
function HomeLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#07020b] via-[#0a0514] to-[#07020b] flex items-center justify-center">
      <div className="text-purple-400 text-xl animate-pulse">Loading...</div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<HomeLoading />}>
      <HomeContent />
    </Suspense>
  );
}
