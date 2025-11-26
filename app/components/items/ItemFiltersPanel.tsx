import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faArrowUpAZ, faArrowDownAZ, faFilter } from '@fortawesome/free-solid-svg-icons';
import { allCategories, specialTypeLabels } from '../../config/categoryConfig';

export type SortField = 'name' | 'rarity' | 'sellprice' | 'weight';

interface ItemFiltersPanelProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortField: SortField;
  setSortField: (field: SortField) => void;
  sortAscending: boolean;
  setSortAscending: (ascending: boolean) => void;
  selectedTypes: Set<string>;
  setSelectedTypes: (types: Set<string>) => void;
  typesByCategory: { [category: string]: string[] };
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}

export default function ItemFiltersPanel({
  searchQuery,
  setSearchQuery,
  sortField,
  setSortField,
  sortAscending,
  setSortAscending,
  selectedTypes,
  setSelectedTypes,
  typesByCategory,
  isSidebarOpen,
  setIsSidebarOpen,
}: ItemFiltersPanelProps) {
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

  return (
    <aside className={`
      w-83 bg-black/30 backdrop-blur-xl border-r border-purple-500/30 overflow-y-auto shadow-2xl z-50 lg:z-10
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
                        category === 'Special'
                          ? allSelected 
                            ? 'text-emerald-300' 
                            : someSelected 
                            ? 'text-emerald-400/70' 
                            : 'text-gray-400'
                          : allSelected 
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
                    {types.map((type) => {
                      const displayName = category === 'Special' 
                        ? (specialTypeLabels[type] || type)
                        : type.replace('Modification-', '').replace('Quick Use-', '');
                      
                      const isSpecial = category === 'Special';
                      
                      return (
                        <button
                          key={type}
                          onClick={() => toggleType(type)}
                          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                            selectedTypes.has(type)
                              ? isSpecial
                                ? 'bg-emerald-500/40 text-emerald-100 border border-emerald-400/60'
                                : 'bg-blue-500/40 text-blue-100 border border-blue-400/60'
                              : isSpecial
                                ? 'bg-emerald-950/20 text-gray-400 border border-emerald-500/15 hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-400/30'
                                : 'bg-black/40 text-gray-400 border border-purple-500/20 hover:bg-blue-500/20 hover:text-blue-300'
                          }`}
                        >
                          {displayName}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}

