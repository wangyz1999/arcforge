'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faStar, faArrowUpAZ, faArrowDownAZ, faFilter, faExternalLinkAlt, faDiagramProject, faBars, faCog } from '@fortawesome/free-solid-svg-icons';
import itemsData from '../data/items_database.json';
import StructuredData from './components/StructuredData';

// Prevent FontAwesome from adding its CSS automatically since we're importing it manually
config.autoAddCss = false;

interface Item {
  name: string;
  wiki_url: string;
  infobox: {
    image: string;
    rarity: string;
    quote?: string;
    type?: string;
    weight?: number;
    sellprice?: number | number[];
    [key: string]: any;
  };
  image_urls: {
    thumb?: string;
    original?: string;
    file_page?: string;
  };
  [key: string]: any;
}

const rarityColors: { [key: string]: string } = {
  Common: '#717471',
  Uncommon: '#41EB6A',
  Rare: '#1ECBFC',
  Epic: '#d8299b',
  Legendary: '#fbc700',
};

const rarityGradients: { [key: string]: string } = {
  Common: 'linear-gradient(to right, rgb(153 159 165 / 25%) 0%, rgb(5 13 36) 100%)',
  Uncommon: 'linear-gradient(to right, rgb(86 203 134 / 25%) 0%, rgb(5 13 36) 100%)',
  Rare: 'linear-gradient(to right, rgb(30 150 252 / 30%) 0%, rgb(5 13 36) 100%)',
  Epic: 'linear-gradient(to right, rgb(216 41 155 / 25%) 0%, rgb(5 13 36) 100%)',
  Legendary: 'linear-gradient(to right, rgb(251 199 0 / 25%) 0%, rgb(5 13 36) 100%)',
};

type SortField = 'name' | 'rarity' | 'sellprice' | 'weight';

const rarityOrder: { [key: string]: number } = {
  Common: 1,
  Uncommon: 2,
  Rare: 3,
  Epic: 4,
  Legendary: 5,
};

// Type to category mapping
const typeToCategory: { [key: string]: string } = {
  'Assault Rifle': 'Weapon',
  'Battle Rifle': 'Weapon',
  'Hand Cannon': 'Weapon',
  'LMG': 'Weapon',
  'Pistol': 'Weapon',
  'SMG': 'Weapon',
  'Shotgun': 'Weapon',
  'Sniper Rifle': 'Weapon',
  'Modification-Grip': 'Modification',
  'Modification-Light-Mag': 'Modification',
  'Modification-Medium-Mag': 'Modification',
  'Modification-Muzzle': 'Modification',
  'Modification-Shotgun-Mag': 'Modification',
  'Modification-Shotgun-Muzzle': 'Modification',
  'Modification-Stock': 'Modification',
  'Modification-Tech-Mod': 'Modification',
  'Quick Use-Gadget': 'Quick Use',
  'Quick Use-Grenade': 'Quick Use',
  'Quick Use-Regen': 'Quick Use',
  'Quick Use-Trap': 'Quick Use',
  'Quick Use-Utility': 'Quick Use',
  'Advanced Material': 'Loots',
  'Basic Material': 'Loots',
  'Key': 'Loots',
  'Misc': 'Loots',
  'Nature': 'Loots',
  'Recyclable': 'Loots',
  'Refined Material': 'Loots',
  'Special': 'Loots',
  'Topside Material': 'Loots',
  'Trinket': 'Loots',
  'Augment': 'Equipment',
  'Shield': 'Equipment',
};

const allCategories = ['Weapon', 'Modification', 'Quick Use', 'Equipment', 'Loots'];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortAscending, setSortAscending] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [itemSize, setItemSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [displayPrice, setDisplayPrice] = useState(false);
  const [displayWeight, setDisplayWeight] = useState(false);

  // Get all unique types grouped by category
  const typesByCategory = useMemo(() => {
    const grouped: { [category: string]: string[] } = {
      Weapon: [],
      Modification: [],
      'Quick Use': [],
      Equipment: [],
      Loots: [],
    };
    
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
    
    // Sort types within each category
    Object.keys(grouped).forEach((category) => {
      grouped[category].sort();
    });
    
    return grouped;
  }, []);

  // Initialize with no types selected
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(() => new Set());

  const toggleType = (type: string) => {
    const newSelected = new Set(selectedTypes);
    if (newSelected.has(type)) {
      newSelected.delete(type);
    } else {
      newSelected.add(type);
    }
    setSelectedTypes(newSelected);
  };

  const toggleCategory = (category: string) => {
    const types = typesByCategory[category] || [];
    const allSelected = types.every(type => selectedTypes.has(type));
    const newSelected = new Set(selectedTypes);
    
    if (allSelected) {
      // Deselect all types in this category
      types.forEach(type => newSelected.delete(type));
    } else {
      // Select all types in this category
      types.forEach(type => newSelected.add(type));
    }
    
    setSelectedTypes(newSelected);
  };

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

    // Filter by selected types
    if (selectedTypes.size > 0) {
      items = items.filter((item) => {
        return item.infobox?.type && selectedTypes.has(item.infobox.type);
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
          break;
        case 'sellprice':
          const priceA = Array.isArray(a.infobox?.sellprice) 
            ? a.infobox.sellprice[0] 
            : (a.infobox?.sellprice || 0);
          const priceB = Array.isArray(b.infobox?.sellprice) 
            ? b.infobox.sellprice[0] 
            : (b.infobox?.sellprice || 0);
          compareResult = priceA - priceB;
          break;
        case 'weight':
          compareResult = (a.infobox?.weight || 0) - (b.infobox?.weight || 0);
          break;
      }

      return sortAscending ? compareResult : -compareResult;
    });

    return items;
  }, [searchQuery, sortField, sortAscending, selectedTypes]);

  const getSellPrice = (price: number | number[] | null | undefined): string => {
    if (!price) return 'N/A';
    if (Array.isArray(price)) {
      return `${price[0]} - ${price[price.length - 1]}`;
    }
    return price.toString();
  };

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  return (
    <>
      {/* Structured Data for SEO */}
      <StructuredData
        type="WebSite"
        data={{
          name: 'ARC Forge',
          description: 'Complete ARC Raiders item database with crafting trees, recipes, and item information',
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
      <header className="bg-black/20 backdrop-blur-xl border-b border-purple-500/30 sticky top-0 z-40 shadow-lg shadow-purple-500/5">
        <div className="flex items-center justify-between pr-8 relative">
          {/* Logo */}
          <a href="/" className="flex-shrink-0 h-24 flex items-center cursor-pointer">
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
            <nav className="flex gap-3">
              <a
                href="/"
                className="group relative px-6 py-3 bg-gradient-to-br from-purple-500/30 to-purple-600/30 border border-purple-400/50 rounded-xl text-purple-200 font-semibold hover:from-purple-500/40 hover:to-purple-600/40 hover:border-purple-400/70 transition-all duration-300 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 hover:scale-105"
              >
                <span className="relative z-10">Item Database</span>
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400/0 to-purple-600/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
              <a
                href="/crafting-tree?item=Power%20Rod"
                className="group relative px-6 py-3 bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-xl text-gray-300 font-semibold hover:bg-purple-500/20 hover:text-purple-200 hover:border-purple-400/50 transition-all duration-300 hover:scale-105"
              >
                <span className="relative z-10">Crafting Tree</span>
              </a>
            </nav>
        </div>
      </header>

      {/* Mobile Sidebar Toggle Button */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="lg:hidden fixed bottom-6 left-6 z-30 w-14 h-14 flex items-center justify-center bg-purple-500/90 backdrop-blur-sm rounded-full shadow-xl hover:bg-purple-600/90 transition-colors border-2 border-purple-400/50"
        aria-label="Open filters"
      >
        <FontAwesomeIcon icon={faBars} className="text-white text-xl" />
      </button>

      {/* Settings Button */}
      <button
        onClick={() => setIsSettingsOpen(true)}
        className="fixed bottom-6 left-24 lg:bottom-8 lg:right-8 lg:left-auto z-30 w-14 h-14 flex items-center justify-center bg-blue-500/90 backdrop-blur-sm rounded-full shadow-xl hover:bg-blue-600/90 transition-colors border-2 border-blue-400/50"
        aria-label="Open settings"
      >
        <FontAwesomeIcon icon={faCog} className="text-white text-xl" />
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
        <aside className={`
          w-80 bg-black/30 backdrop-blur-xl border-r border-purple-500/30 overflow-y-auto shadow-2xl z-30
          fixed lg:relative inset-y-0 left-0 transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="p-6 space-y-6">
            {/* Close Button (Mobile Only) */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-black/60 hover:bg-red-500/30 backdrop-blur-sm rounded-lg transition-colors text-gray-400 hover:text-red-300 border border-purple-500/20 hover:border-red-500/50 z-10"
            >
              <span className="text-lg">✕</span>
            </button>
            {/* Search Bar */}
            <div>
              <h3 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-blue-300 mb-3 uppercase tracking-wider">
                Search
              </h3>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FontAwesomeIcon icon={faSearch} className="text-purple-400/70 text-sm group-focus-within:text-purple-400 transition-colors" />
                </div>
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-black/50 backdrop-blur-sm border border-purple-500/30 rounded-xl text-gray-100 text-sm placeholder-gray-500 focus:outline-none focus:border-purple-400/60 focus:ring-2 focus:ring-purple-500/30 focus:bg-black/60 transition-all duration-300 shadow-lg shadow-purple-500/10 focus:shadow-purple-500/20"
                />
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-purple-500/20 shadow-sm shadow-purple-500/10"></div>
            {/* Sort Section */}
            <div>
              <h3 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-blue-300 mb-4 flex items-center gap-2 uppercase tracking-wider">
                <FontAwesomeIcon icon={faArrowUpAZ} className="text-purple-400" />
                Sort By
              </h3>
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => setSortField('name')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    sortField === 'name'
                      ? 'bg-purple-500/40 text-purple-100 border border-purple-400/60'
                      : 'bg-black/40 text-gray-400 border border-purple-500/20 hover:bg-purple-500/20 hover:text-purple-300'
                  }`}
                >
                  Name
                </button>
                <button
                  onClick={() => setSortField('rarity')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    sortField === 'rarity'
                      ? 'bg-purple-500/40 text-purple-100 border border-purple-400/60'
                      : 'bg-black/40 text-gray-400 border border-purple-500/20 hover:bg-purple-500/20 hover:text-purple-300'
                  }`}
                >
                  Rarity
                </button>
                <button
                  onClick={() => setSortField('sellprice')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    sortField === 'sellprice'
                      ? 'bg-purple-500/40 text-purple-100 border border-purple-400/60'
                      : 'bg-black/40 text-gray-400 border border-purple-500/20 hover:bg-purple-500/20 hover:text-purple-300'
                  }`}
                >
                  Sell Price
                </button>
                <button
                  onClick={() => setSortField('weight')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    sortField === 'weight'
                      ? 'bg-purple-500/40 text-purple-100 border border-purple-400/60'
                      : 'bg-black/40 text-gray-400 border border-purple-500/20 hover:bg-purple-500/20 hover:text-purple-300'
                  }`}
                >
                  Weight
                </button>
              </div>
              
              <button
                onClick={() => setSortAscending(!sortAscending)}
                className="w-full px-3 py-1.5 rounded-lg text-xs font-semibold bg-black/40 text-gray-300 border border-purple-500/30 hover:bg-purple-500/20 hover:text-purple-200 transition-colors flex items-center justify-center gap-2"
              >
                <FontAwesomeIcon icon={sortAscending ? faArrowUpAZ : faArrowDownAZ} className="text-purple-400 text-xs" />
                <span>{sortAscending ? 'Ascending' : 'Descending'}</span>
              </button>
            </div>

            {/* Divider */}
            <div className="border-t border-purple-500/20 shadow-sm shadow-purple-500/10"></div>

            {/* Category Filters */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-blue-300 flex items-center gap-2 uppercase tracking-wider">
                  <FontAwesomeIcon icon={faFilter} className="text-purple-400" />
                  Filter by Type
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const allTypes = new Set<string>();
                      Object.values(typesByCategory).forEach(types => {
                        types.forEach(type => allTypes.add(type));
                      });
                      setSelectedTypes(allTypes);
                    }}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
                  >
                    All
                  </button>
                  <span className="text-purple-500/50">|</span>
                  <button
                    onClick={() => setSelectedTypes(new Set())}
                    className="text-xs text-gray-400 hover:text-gray-300 font-semibold transition-colors"
                  >
                    None
                  </button>
                </div>
              </div>
              
              {/* Hierarchical Category Display */}
              <div className="space-y-3">
                {allCategories.map((category) => {
                  const types = typesByCategory[category] || [];
                  const allSelected = types.every(type => selectedTypes.has(type));
                  const someSelected = types.some(type => selectedTypes.has(type));
                  
                  return (
                    <div key={category}>
                      {/* Category Header */}
                      <div className="mb-2">
                        <button
                          onClick={() => toggleCategory(category)}
                          className={`text-sm font-bold transition-colors hover:text-purple-300 cursor-pointer ${
                            allSelected 
                              ? 'text-blue-300' 
                              : someSelected 
                              ? 'text-blue-400/70' 
                              : 'text-gray-400'
                          }`}
                        >
                          {category}
                        </button>
                      </div>
                      
                      {/* Types List */}
                      <div className="flex flex-wrap gap-1.5 mb-1">
                        {types.map((type) => (
                          <button
                            key={type}
                            onClick={() => toggleType(type)}
                            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                              selectedTypes.has(type)
                                ? 'bg-blue-500/40 text-blue-100 border border-blue-400/60'
                                : 'bg-black/40 text-gray-400 border border-purple-500/20 hover:bg-blue-500/20 hover:text-blue-300'
                            }`}
                          >
                            {type.replace('Modification-', '').replace('Quick Use-', '')}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>

        {/* Items Grid */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative z-10">
          <div className="max-w-[1600px] mx-auto">
            <div className={`grid gap-3 sm:gap-4 lg:gap-6 ${
              itemSize === 'small' 
                ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-10' 
                : itemSize === 'medium'
                ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'
                : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4'
            }`}>
              {filteredAndSortedItems.map((item, index) => {
                const rarity = item.infobox?.rarity || 'Common';
                const borderColor = rarityColors[rarity] || '#717471';
                const gradient = rarityGradients[rarity] || rarityGradients.Common;
                
                return (
                  <div
                    key={`${item.name}-${index}`}
                    onClick={() => setSelectedItem(item)}
                    className="group relative bg-gradient-to-br from-black/60 via-black/40 to-black/60 backdrop-blur-sm rounded-2xl overflow-hidden hover:scale-105 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                    style={{
                      borderWidth: '2px',
                      borderStyle: 'solid',
                      borderColor: borderColor,
                      boxShadow: `0 4px 20px ${borderColor}30, 0 0 40px ${borderColor}10, inset 0 1px 0 rgba(255,255,255,0.1)`
                    }}
                  >
                    {/* Animated border glow on hover */}
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
                      style={{
                        boxShadow: `0 0 30px ${borderColor}60, inset 0 0 20px ${borderColor}20`
                      }}
                    />

                    {/* Price/Weight Display */}
                    <div className="absolute top-2 right-2 z-20 flex flex-col gap-1">
                      {displayPrice && item.infobox?.sellprice != null && (
                        <div className="flex items-center gap-1 bg-black/80 backdrop-blur-sm px-2 py-1 rounded-lg border border-yellow-500/30">
                          <Image src="/coin.webp" alt="Coin" width={16} height={16} className="w-4 h-4" />
                          <span className="text-yellow-400 text-xs font-bold">
                            {Array.isArray(item.infobox.sellprice) 
                              ? item.infobox.sellprice[0]
                              : item.infobox.sellprice}
                          </span>
                        </div>
                      )}
                      {displayWeight && item.infobox?.weight != null && (
                        <div className="flex items-center gap-1 bg-black/80 backdrop-blur-sm px-2 py-1 rounded-lg border border-gray-500/30">
                          <Image src="/weight.webp" alt="Weight" width={16} height={16} className="w-4 h-4" />
                          <span className="text-gray-300 text-xs font-bold">{item.infobox.weight}</span>
                        </div>
                      )}
                    </div>

                    {/* Image Section */}
                    <div 
                      className="aspect-square flex items-center justify-center p-4 relative overflow-hidden"
                      style={{ background: gradient }}
                    >
                      {/* Subtle shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {item.image_urls?.thumb ? (
                        <img
                          src={item.image_urls.thumb}
                          alt={item.name}
                          className="w-full h-full object-contain relative z-10 group-hover:scale-110 group-hover:rotate-2 transition-all duration-300 drop-shadow-2xl"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="text-2xl text-gray-700/50">?</div>
                      )}
                    </div>

                    {/* Name Section */}
                    <div className="p-2.5 bg-gradient-to-br from-black/80 to-black/60 backdrop-blur-sm border-t" style={{ borderColor: `${borderColor}20` }}>
                      <h3 
                        className="font-semibold text-xs group-hover:brightness-125 transition-all line-clamp-2 text-center leading-tight drop-shadow-lg"
                        style={{ 
                          color: borderColor,
                          textShadow: `0 2px 8px ${borderColor}40`
                        }}
                      >
                        {item.name}
                      </h3>
                    </div>

                    {/* Hover Effect Overlay */}
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl"
                      style={{ 
                        background: `radial-gradient(circle at center, ${borderColor}20 0%, transparent 70%)`
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* No Results */}
            {filteredAndSortedItems.length === 0 && (
              <div className="relative text-center py-32">
                <div className="absolute inset-0 flex items-center justify-center opacity-5">
                  <FontAwesomeIcon icon={faSearch} className="text-[20rem] text-purple-500" />
                </div>
                <div className="relative z-10">
                  <div className="text-8xl mb-6 animate-pulse">🔍</div>
                  <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-300 via-purple-300 to-gray-300 mb-3">
                    No items found
                  </h3>
                  <p className="text-gray-400 text-lg">Try adjusting your search or filters</p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Right Slide-in Detail Panel */}
      {selectedItem && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 z-40 backdrop-blur-md"
            onClick={() => setSelectedItem(null)}
          />
          
          {/* Detail Panel */}
          <div className="fixed top-0 right-0 h-full w-full md:w-[600px] bg-gradient-to-br from-black/95 via-purple-950/30 to-black/95 backdrop-blur-2xl border-l border-purple-500/40 z-50 overflow-y-auto animate-slide-in shadow-2xl">
            {/* Decorative gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 pointer-events-none" />
            
            <div className="relative z-10 p-8">
              {/* Close Button */}
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center bg-black/60 hover:bg-red-500/30 backdrop-blur-sm rounded-xl transition-all duration-300 text-gray-400 hover:text-red-300 border border-purple-500/20 hover:border-red-500/50 shadow-lg hover:scale-110 group"
              >
                <span className="text-xl group-hover:rotate-90 transition-transform duration-300">✕</span>
              </button>

              {/* Item Header */}
              <div className="mb-8">
                <div 
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold mb-5 uppercase tracking-widest backdrop-blur-sm border shadow-lg"
                  style={{ 
                    backgroundColor: `${rarityColors[selectedItem.infobox?.rarity] || '#717471'}30`,
                    borderColor: `${rarityColors[selectedItem.infobox?.rarity] || '#717471'}60`,
                    color: rarityColors[selectedItem.infobox?.rarity] || '#717471',
                    boxShadow: `0 4px 20px ${rarityColors[selectedItem.infobox?.rarity] || '#717471'}30`
                  }}
                >
                  <FontAwesomeIcon icon={faStar} className="text-xs" />
                  {selectedItem.infobox?.rarity || 'Common'}
                </div>
                <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-100 via-purple-200 to-gray-100 mb-3 drop-shadow-lg">
                  {selectedItem.name}
                </h2>
                {selectedItem.infobox?.type && (
                  <p className="text-purple-400 text-sm font-semibold uppercase tracking-wider inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 rounded-lg border border-purple-500/30">
                    {selectedItem.infobox.type}
                  </p>
                )}
              </div>

              {/* Item Image */}
              {selectedItem.image_urls?.thumb && (
                <div 
                  className="relative w-full aspect-square rounded-2xl mb-8 flex items-center justify-center p-12 border-2 overflow-hidden group shadow-2xl"
                  style={{ 
                    background: rarityGradients[selectedItem.infobox?.rarity] || rarityGradients.Common,
                    borderColor: `${rarityColors[selectedItem.infobox?.rarity] || '#717471'}40`,
                    boxShadow: `0 8px 32px ${rarityColors[selectedItem.infobox?.rarity] || '#717471'}40, inset 0 1px 0 rgba(255,255,255,0.1)`
                  }}
                >
                  {/* Animated shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  
                  <img
                    src={selectedItem.image_urls.thumb}
                    alt={selectedItem.name}
                    className="w-full h-full object-contain relative z-10 drop-shadow-2xl"
                  />
                </div>
              )}

              {/* Stats */}
              <div className="space-y-3 mb-8">
                {selectedItem.infobox?.weight != null && (
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm text-gray-400 font-medium">Weight:</span>
                    <span className="text-lg text-gray-100 font-semibold">{selectedItem.infobox.weight}</span>
                  </div>
                )}
                {selectedItem.infobox?.sellprice != null && (
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm text-gray-400 font-medium">Sell Price:</span>
                    <span className="text-lg text-emerald-400 font-semibold">{getSellPrice(selectedItem.infobox.sellprice)}</span>
                  </div>
                )}
                {selectedItem.infobox?.stacksize != null && (
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm text-gray-400 font-medium">Stack Size:</span>
                    <span className="text-lg text-gray-100 font-semibold">{selectedItem.infobox.stacksize}</span>
                  </div>
                )}
                {selectedItem.infobox?.damage != null && (
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm text-gray-400 font-medium">Damage:</span>
                    <span className="text-lg text-red-400 font-semibold">{selectedItem.infobox.damage}</span>
                  </div>
                )}
              </div>

              {/* Sources */}
              {selectedItem.sources && selectedItem.sources.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-blue-300 mb-4 uppercase tracking-wider">
                    Sources
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedItem.sources.map((source: string, idx: number) => (
                      <span
                        key={idx}
                        className="group relative px-4 py-2 bg-gradient-to-br from-blue-500/30 to-cyan-500/30 backdrop-blur-sm text-blue-200 rounded-xl text-xs font-semibold border border-blue-400/40 hover:border-blue-400/60 transition-all duration-300 hover:scale-105 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
                      >
                        <span className="relative z-10">{source}</span>
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <a
                  href={selectedItem.wiki_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative block py-4 bg-gradient-to-br from-purple-500/30 to-purple-600/30 hover:from-purple-500/40 hover:to-purple-600/40 backdrop-blur-sm border border-purple-400/50 hover:border-purple-400/70 rounded-xl text-center text-purple-200 hover:text-purple-100 font-semibold transition-all duration-300 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:scale-105 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400/0 via-purple-400/20 to-purple-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    <FontAwesomeIcon icon={faExternalLinkAlt} />
                    View on Wiki
                  </span>
                </a>
                <a
                  href={`/crafting-tree?item=${encodeURIComponent(selectedItem.name)}`}
                  className="group relative block py-4 bg-gradient-to-br from-blue-500/30 to-cyan-500/30 hover:from-blue-500/40 hover:to-cyan-500/40 backdrop-blur-sm border border-blue-400/50 hover:border-blue-400/70 rounded-xl text-center text-blue-200 hover:text-blue-100 font-semibold transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-105 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-blue-400/20 to-blue-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    <FontAwesomeIcon icon={faDiagramProject} />
                    View Crafting Tree
                  </span>
                </a>
              </div>
        </div>
          </div>
        </>
      )}

      {/* Settings Panel */}
      {isSettingsOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 z-40 backdrop-blur-md"
            onClick={() => setIsSettingsOpen(false)}
          />
          
          {/* Settings Panel */}
          <div className="fixed bottom-0 left-0 w-full md:w-[400px] md:bottom-8 md:right-8 md:left-auto bg-gradient-to-br from-black/95 via-blue-950/30 to-black/95 backdrop-blur-2xl border border-blue-500/40 z-50 rounded-t-3xl md:rounded-2xl shadow-2xl animate-slide-up">
            {/* Decorative gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none rounded-t-3xl md:rounded-2xl" />
            
            <div className="relative z-10 p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300 flex items-center gap-3">
                  <FontAwesomeIcon icon={faCog} className="text-blue-400" />
                  Settings
                </h2>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="w-10 h-10 flex items-center justify-center bg-black/60 hover:bg-red-500/30 backdrop-blur-sm rounded-xl transition-all duration-300 text-gray-400 hover:text-red-300 border border-blue-500/20 hover:border-red-500/50"
                >
                  <span className="text-lg">✕</span>
                </button>
              </div>

              {/* Settings Options */}
              <div className="space-y-6">
                {/* Item Size */}
                <div>
                  <label className="text-sm font-bold text-blue-300 mb-3 block uppercase tracking-wider">
                    Item Size
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setItemSize('small')}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                        itemSize === 'small'
                          ? 'bg-blue-500/40 text-blue-100 border-2 border-blue-400/60 shadow-lg shadow-blue-500/30'
                          : 'bg-black/40 text-gray-400 border border-blue-500/20 hover:bg-blue-500/20 hover:text-blue-300'
                      }`}
                    >
                      Small
                    </button>
                    <button
                      onClick={() => setItemSize('medium')}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                        itemSize === 'medium'
                          ? 'bg-blue-500/40 text-blue-100 border-2 border-blue-400/60 shadow-lg shadow-blue-500/30'
                          : 'bg-black/40 text-gray-400 border border-blue-500/20 hover:bg-blue-500/20 hover:text-blue-300'
                      }`}
                    >
                      Medium
                    </button>
                    <button
                      onClick={() => setItemSize('large')}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                        itemSize === 'large'
                          ? 'bg-blue-500/40 text-blue-100 border-2 border-blue-400/60 shadow-lg shadow-blue-500/30'
                          : 'bg-black/40 text-gray-400 border border-blue-500/20 hover:bg-blue-500/20 hover:text-blue-300'
                      }`}
                    >
                      Large
                    </button>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-blue-500/20"></div>

                {/* Display Price */}
                <div>
                  <label className="flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 flex items-center justify-center bg-black/60 rounded-lg border border-blue-500/30 group-hover:border-blue-400/50 transition-colors">
                        <Image src="/coin.webp" alt="Coin" width={24} height={24} />
                      </div>
                      <span className="text-sm font-bold text-blue-300 uppercase tracking-wider">
                        Display Price
                      </span>
                    </div>
                    <div
                      className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
                        displayPrice ? 'bg-blue-500/60' : 'bg-black/60'
                      } border ${
                        displayPrice ? 'border-blue-400/60' : 'border-blue-500/20'
                      }`}
                      onClick={() => setDisplayPrice(!displayPrice)}
                    >
                      <div
                        className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 shadow-lg ${
                          displayPrice ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </label>
                </div>

                {/* Display Weight */}
                <div>
                  <label className="flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 flex items-center justify-center bg-black/60 rounded-lg border border-blue-500/30 group-hover:border-blue-400/50 transition-colors">
                        <Image src="/weight.webp" alt="Weight" width={24} height={24} />
                      </div>
                      <span className="text-sm font-bold text-blue-300 uppercase tracking-wider">
                        Display Weight
                      </span>
                    </div>
                    <div
                      className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
                        displayWeight ? 'bg-blue-500/60' : 'bg-black/60'
                      } border ${
                        displayWeight ? 'border-blue-400/60' : 'border-blue-500/20'
                      }`}
                      onClick={() => setDisplayWeight(!displayWeight)}
                    >
                      <div
                        className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 shadow-lg ${
                          displayWeight ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
    </>
  );
}
