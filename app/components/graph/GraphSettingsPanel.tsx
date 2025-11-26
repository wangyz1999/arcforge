import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog } from '@fortawesome/free-solid-svg-icons';

interface GraphSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedEdgeTypes: Set<string>;
  setSelectedEdgeTypes: (types: Set<string>) => void;
}

const EDGE_TYPES = [
  { id: 'craft', label: 'Craft', color: '#60a5fa', bgColor: 'rgba(96, 165, 250, 0.15)' },
  { id: 'repair', label: 'Repair', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.15)' },
  { id: 'recycle', label: 'Recycle', color: '#34d399', bgColor: 'rgba(52, 211, 153, 0.15)' },
  { id: 'salvage', label: 'Salvage', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.15)' },
  { id: 'upgrade', label: 'Upgrade', color: '#ec4899', bgColor: 'rgba(236, 72, 153, 0.15)' },
  { id: 'sold_by', label: 'Trader', color: '#fbbf24', bgColor: 'rgba(251, 191, 36, 0.15)' },
];

export default function GraphSettingsPanel({
  isOpen,
  onClose,
  selectedEdgeTypes,
  setSelectedEdgeTypes,
}: GraphSettingsPanelProps) {
  if (!isOpen) return null;

  const toggleEdgeType = (typeId: string) => {
    const newTypes = new Set(selectedEdgeTypes);
    if (newTypes.has(typeId)) {
      newTypes.delete(typeId);
    } else {
      newTypes.add(typeId);
    }
    setSelectedEdgeTypes(newTypes);
  };

  const selectAll = () => {
    setSelectedEdgeTypes(new Set(EDGE_TYPES.map(t => t.id)));
  };

  const clearAll = () => {
    setSelectedEdgeTypes(new Set());
  };

  return (
    <>      
      {/* Settings Panel - Compact Grid Design - Non-blocking floating panel */}
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:w-[420px] bg-gradient-to-br from-black/95 via-purple-950/30 to-black/95 backdrop-blur-2xl border border-purple-500/40 z-50 rounded-2xl shadow-2xl animate-slide-up pointer-events-auto">
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 pointer-events-none rounded-2xl" />
        
        <div className="relative z-10 p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300 flex items-center gap-2">
              <FontAwesomeIcon icon={faCog} className="text-purple-400 text-sm" />
              Edge Filters
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center bg-black/60 hover:bg-red-500/30 backdrop-blur-sm rounded-lg transition-all duration-300 text-gray-400 hover:text-red-300 border border-purple-500/20 hover:border-red-500/50"
            >
              <span className="text-sm">✕</span>
            </button>
          </div>

          {/* Edge Type Tags - Grid Layout */}
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {EDGE_TYPES.map((edgeType) => (
                <button
                  key={edgeType.id}
                  onClick={() => toggleEdgeType(edgeType.id)}
                  className="px-3 py-2 rounded-lg text-xs font-bold transition-all border-2 flex items-center justify-center gap-2 hover:scale-105"
                  style={{
                    backgroundColor: selectedEdgeTypes.has(edgeType.id) ? edgeType.bgColor : 'rgba(0,0,0,0.4)',
                    borderColor: selectedEdgeTypes.has(edgeType.id) ? edgeType.color : 'rgba(139, 92, 246, 0.2)',
                    color: selectedEdgeTypes.has(edgeType.id) ? edgeType.color : '#9ca3af',
                  }}
                >
                  <div 
                    className="w-2.5 h-2.5 rounded-full transition-all"
                    style={{
                      backgroundColor: selectedEdgeTypes.has(edgeType.id) ? edgeType.color : '#4b5563',
                    }}
                  />
                  <span>{edgeType.label}</span>
                </button>
              ))}
            </div>
            
            {/* Quick Actions */}
            <div className="flex gap-2 pt-1 border-t border-purple-500/20">
              <button
                onClick={selectAll}
                className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all bg-black/40 text-gray-400 border border-purple-500/20 hover:bg-purple-500/20 hover:text-purple-300 hover:border-purple-400/40"
              >
                Select All
              </button>
              <button
                onClick={clearAll}
                className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all bg-black/40 text-gray-400 border border-purple-500/20 hover:bg-purple-500/20 hover:text-purple-300 hover:border-purple-400/40"
              >
                Clear All
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

