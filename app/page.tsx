'use client';

import { useState, useMemo, useEffect } from 'react';
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faCog, faEye } from '@fortawesome/free-solid-svg-icons';
import itemsData from '../data/items_database.json';
import StructuredData from './components/StructuredData';
import Header from './components/Header';
import ItemFiltersPanel, { SortField } from './components/items/ItemFiltersPanel';
import ItemsGrid from './components/items/ItemsGrid';
import ItemDetailPanel from './components/items/ItemDetailPanel';
import SettingsPanel from './components/items/SettingsPanel';
import { Item } from './types/item';
import { typeToCategory } from './config/categoryConfig';
import { rarityOrder } from './config/rarityConfig';
import TrackedItemsPanel from './components/items/TrackedItemsPanel';

// Prevent FontAwesome from adding its CSS automatically since we're importing it manually
config.autoAddCss = false;

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortAscending, setSortAscending] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isTrackedOpen, setIsTrackedOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [itemSize, setItemSize] = useState<'tiny' | 'small' | 'medium' | 'large'>('small');
  const [displayPrice, setDisplayPrice] = useState(false);
  const [displayWeight, setDisplayWeight] = useState(false);
  const [showTrackIcons, setShowTrackIcons] = useState(false);

  // Fix hydration bug: Initialize trackedItems as empty Set on both server and client
  const [trackedItems, setTrackedItems] = useState<Set<string>>(new Set());

  // Load tracked items from localStorage after component mounts (client-side only)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("tracked_items");
      if (raw) {
        const arr = JSON.parse(raw);
        setTrackedItems(new Set(Array.isArray(arr) ? arr : []));
      }
    } catch (error) {
      console.error("Failed to load tracked items from localStorage:", error);
    }
  }, []);

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
  
  // Get all unique types grouped by category
  const typesByCategory = useMemo(() => {
    const grouped: { [category: string]: string[] } = {
      Special: [],
      Weapon: [],
      Modification: [],
      'Quick Use': [],
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
    grouped['Special'] = Array.from(specialTypesSet).sort();
    
    // Sort types within each category
    Object.keys(grouped).forEach((category) => {
      if (category !== 'Special') {
        grouped[category].sort();
      }
    });
    
    return grouped;
  }, []);

  // Initialize with no types selected
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(() => new Set());

  const filteredAndSortedItems = useMemo(() => {
    let items = itemsData as Item[];
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter((item) => {
        return (
          item.name.toLowerCase().includes(query) ||
          item.infobox?.rarity?.toLowerCase().includes(query) ||
          item.infobox?.type?.toLowerCase().includes(query)
        );
      });
    }

    // Filter by selected types (includes both regular types and special types)
    if (selectedTypes.size > 0) {
      // Separate regular types from special types
      const specialTypes = typesByCategory['Special'] || [];
      const regularTypes = new Set<string>();
      const selectedSpecialTypes = new Set<string>();
      
      selectedTypes.forEach(type => {
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
          matchesSpecialType = !!(item.infobox?.special_types?.some(st => selectedSpecialTypes.has(st)));
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
        case 'name':
          compareResult = a.name.localeCompare(b.name);
          break;
        case 'rarity':
          const rarityA = rarityOrder[a.infobox?.rarity || 'Common'] || 0;
          const rarityB = rarityOrder[b.infobox?.rarity || 'Common'] || 0;
          compareResult = rarityA - rarityB;
          // Secondary sort by name when rarity is the same
          if (compareResult === 0) {
            compareResult = a.name.localeCompare(b.name);
          }
          break;
        case 'sellprice':
          const priceA = Array.isArray(a.infobox?.sellprice) 
            ? Number(a.infobox.sellprice[0]) 
            : Number(a.infobox?.sellprice || 0);
          const priceB = Array.isArray(b.infobox?.sellprice) 
            ? Number(b.infobox.sellprice[0]) 
            : Number(b.infobox?.sellprice || 0);
          compareResult = priceA - priceB;
          // Secondary sort by name when price is the same
          if (compareResult === 0) {
            compareResult = a.name.localeCompare(b.name);
          }
          break;
        case 'weight':
          const weightA = Number(a.infobox?.weight || 0);
          const weightB = Number(b.infobox?.weight || 0);
          compareResult = weightA - weightB;
          // Secondary sort by name when weight is the same
          if (compareResult === 0) {
            compareResult = a.name.localeCompare(b.name);
          }
          break;
      }

      return sortAscending ? compareResult : -compareResult;
    });

    return items;
  }, [searchQuery, sortField, sortAscending, selectedTypes, typesByCategory]);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  return (
    <>
      {/* Structured Data for SEO */}
      <StructuredData
        type="WebSite"
        data={{
          name: 'ARC Forge',
          description: 'Complete ARC Raiders item database with crafting graphs, recipes, and item information',
          url: baseUrl,
        }}
      />
      <StructuredData
        type="ItemList"
        data={{
          name: 'ARC Raiders Items',
          description: 'Complete list of items in ARC Raiders',
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
        {/* Header - Logo and Navigation */}
        <Header activePage="database" />

        {/* Mobile Sidebar Toggle Button */}
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="lg:hidden fixed bottom-6 left-6 z-30 w-14 h-14 flex items-center justify-center bg-gradient-to-br from-purple-500/30 to-pink-500/20 backdrop-blur-xl rounded-full shadow-2xl hover:from-purple-500/40 hover:to-pink-500/30 transition-all duration-300 border border-white/20 hover:border-white/30 hover:shadow-purple-500/50 hover:scale-105"
          aria-label="Open filters"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-full pointer-events-none"></div>
          <FontAwesomeIcon icon={faBars} className="text-white text-xl relative z-10 drop-shadow-lg" />
        </button>

        {/* Tracked supplies button */}
        <button
          onClick={() => setIsTrackedOpen(true)}
          className="fixed bottom-25 left-25 lg:bottom-25 lg:right-8 lg:left-auto z-30 w-14 h-14 flex items-center justify-center bg-gradient-to-br from-blue-500/30 to-purple-500/20 backdrop-blur-xl rounded-full shadow-2xl hover:from-blue-500/40 hover:to-purple-500/30 transition-all duration-300 border border-white/20 hover:border-white/30 hover:shadow-blue-500/50 hover:scale-105"
          aria-label="Open tracked items"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-full pointer-events-none"></div>
          <FontAwesomeIcon icon={faEye} className="text-white text-xl relative z-10 drop-shadow-lg"/>
        </button>

        {/* Settings Button */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="fixed bottom-6 left-24 lg:bottom-8 lg:right-8 lg:left-auto z-30 w-14 h-14 flex items-center justify-center bg-gradient-to-br from-blue-500/30 to-purple-500/20 backdrop-blur-xl rounded-full shadow-2xl hover:from-blue-500/40 hover:to-purple-500/30 transition-all duration-300 border border-white/20 hover:border-white/30 hover:shadow-blue-500/50 hover:scale-105"
          aria-label="Open settings"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-full pointer-events-none"></div>
          <FontAwesomeIcon icon={faCog} className="text-white text-xl relative z-10 drop-shadow-lg" />
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

          {/* Left Sidebar - Search, Filters and Sort */}
          <ItemFiltersPanel
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
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
        />
      </div>
    </>
  );
}
