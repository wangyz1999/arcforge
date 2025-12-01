import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faExternalLinkAlt, faDiagramProject, faLocationDot, faQuoteLeft, faEye } from '@fortawesome/free-solid-svg-icons';
import { Item } from '../../types/item';
import { rarityColors, rarityGradients } from '../../config/rarityConfig';
import { specialTypeLabels } from '../../config/categoryConfig';

interface ItemDetailPanelProps {
  item: Item;
  onClose: () => void;
  onItemTracked: (name: string) => void;
  isTrackedFunc: (name: string) => boolean;
}

const getSellPrice = (price: number | number[] | null | undefined): string => {
  if (!price) return 'N/A';
  if (Array.isArray(price)) {
    return `${price[0]} - ${price[price.length - 1]}`;
  }
  return price.toString();
};

export default function ItemDetailPanel({ item, onClose, onItemTracked, isTrackedFunc }: ItemDetailPanelProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 z-40 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* Detail Panel */}
      <div className="fixed top-0 right-0 h-full w-full md:w-[500px] bg-gradient-to-br from-black/95 via-purple-950/30 to-black/95 backdrop-blur-2xl border-l border-purple-500/40 z-50 overflow-y-auto animate-slide-in shadow-2xl">
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 pointer-events-none" />
        
        <div className="relative z-10 p-5">
            <div className="absolute top-4 right-4 z-50 flex gap-4">
              {/* Track Item Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onItemTracked(item.name);
                }}
                title={isTrackedFunc(item.name) ? 'Untrack' : 'Track'}
                className={`w-10 h-10 flex items-center justify-center rounded-md text-sm ${
                  isTrackedFunc(item.name) ? 'bg-yellow-400 text-black' : 'bg-black/40 text-purple-200'
                }`}
                style={{cursor: 'pointer'}}
              >
                <FontAwesomeIcon
                  icon={faEye}
                  className="text-white text-xl relative z-10 drop-shadow-lg"
                />
              </button>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center bg-black/60 hover:bg-red-500/30 backdrop-blur-sm rounded-lg transition-all duration-300 text-gray-400 hover:text-red-300 border border-purple-500/20 hover:border-red-500/50 shadow-lg hover:scale-110 group"
              >
                <span className="text-lg group-hover:rotate-90 transition-transform duration-300">✕</span>
              </button>

            </div>

          {/* Item Header */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <div 
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider backdrop-blur-sm border shadow-lg"
                style={{ 
                  backgroundColor: `${rarityColors[item.infobox?.rarity] || '#717471'}30`,
                  borderColor: `${rarityColors[item.infobox?.rarity] || '#717471'}60`,
                  color: rarityColors[item.infobox?.rarity] || '#717471',
                  boxShadow: `0 4px 20px ${rarityColors[item.infobox?.rarity] || '#717471'}30`
                }}
              >
                <FontAwesomeIcon icon={faStar} className="text-xs" />
                {item.infobox?.rarity || 'Common'}
              </div>

              
              {item.infobox?.type && (
                <span className="text-purple-400 text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-2 px-2.5 py-1 bg-purple-500/20 rounded-lg border border-purple-500/30">
                  {item.infobox.type}
                </span>
              )}
            </div>
            
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-100 via-purple-200 to-gray-100 mb-3 drop-shadow-lg">
              {item.name}
            </h2>
            
            {/* Special Type Tags */}
            {item.infobox?.special_types && item.infobox.special_types.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {item.infobox.special_types.map((specialType: string) => (
                  <span
                    key={specialType}
                    className="px-2.5 py-1 bg-emerald-500/30 text-emerald-200 rounded-md text-xs font-semibold border border-emerald-400/50 shadow-sm"
                  >
                    {specialTypeLabels[specialType] || specialType}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Item Image */}
          {item.image_urls?.thumb && (
            <a
              href={`/crafting-graph?item=${encodeURIComponent(item.name)}`}
              className="relative w-full aspect-square rounded-xl mb-4 flex items-center justify-center p-8 border overflow-hidden group shadow-xl cursor-pointer block"
              style={{ 
                background: rarityGradients[item.infobox?.rarity] || rarityGradients.Common,
                borderColor: `${rarityColors[item.infobox?.rarity] || '#717471'}40`,
                boxShadow: `0 8px 32px ${rarityColors[item.infobox?.rarity] || '#717471'}40, inset 0 1px 0 rgba(255,255,255,0.1)`
              }}
            >
              {/* Animated shine effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              
              <img
                src={item.image_urls.thumb}
                alt={item.name}
                className="w-full h-full object-contain relative z-10 drop-shadow-2xl"
              />
            </a>
          )}

          {/* Quote */}
          {item.infobox?.quote && (
            <div className="mb-4 pb-4 border-b border-purple-500/20">
              <p className="text-gray-300 text-sm italic leading-relaxed flex gap-2">
                <FontAwesomeIcon icon={faQuoteLeft} className="text-purple-400/40 text-xs mt-0.5 flex-shrink-0" />
                <span>{item.infobox.quote}</span>
              </p>
            </div>
          )}

          {/* Stats and Info */}
          <div className="mb-4 space-y-2 text-sm">
            {item.infobox?.location && (
              <div className="flex items-start gap-2">
                <FontAwesomeIcon icon={faLocationDot} className="text-blue-400/70 text-xs mt-0.5 w-3.5" />
                <div className="flex-1">
                  <span className="text-gray-400">Location: </span>
                  <span 
                    className="text-gray-200"
                    dangerouslySetInnerHTML={{ __html: item.infobox.location.replace(/<br\s*\/?>/gi, ' • ') }}
                  />
                </div>
              </div>
            )}
            {item.infobox?.weight != null && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400 w-24">Weight:</span>
                <span className="text-gray-100 font-semibold">{item.infobox.weight}</span>
              </div>
            )}
            {item.infobox?.sellprice != null && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400 w-24">Sell Price:</span>
                <span className="text-emerald-400 font-semibold">{getSellPrice(item.infobox.sellprice)}</span>
              </div>
            )}
            {item.infobox?.stacksize != null && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400 w-24">Stack Size:</span>
                <span className="text-gray-100 font-semibold">{item.infobox.stacksize}</span>
              </div>
            )}
            {item.infobox?.damage != null && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400 w-24">Damage:</span>
                <span className="text-red-400 font-semibold">{item.infobox.damage}</span>
              </div>
            )}
          </div>

          {/* Sources */}
          {item.sources && item.sources.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-blue-300 mb-2 uppercase tracking-wider">
                Sources
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {item.sources.map((source: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-gradient-to-br from-blue-500/30 to-cyan-500/30 text-blue-200 rounded-lg text-xs font-semibold border border-blue-400/40 shadow-sm"
                  >
                    {source}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <a
              href={item.wiki_url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex-1 block py-3 bg-gradient-to-br from-purple-500/30 to-purple-600/30 hover:from-purple-500/40 hover:to-purple-600/40 backdrop-blur-sm border border-purple-400/50 hover:border-purple-400/70 rounded-lg text-center text-purple-200 hover:text-purple-100 font-semibold text-sm transition-all duration-300 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:scale-[1.02] overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400/0 via-purple-400/20 to-purple-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              <span className="relative z-10 flex items-center justify-center gap-2">
                <FontAwesomeIcon icon={faExternalLinkAlt} />
                Wiki
              </span>
            </a>
            <a
              href={`/crafting-graph?item=${encodeURIComponent(item.name)}`}
              className="group relative flex-1 block py-3 bg-gradient-to-br from-blue-500/30 to-cyan-500/30 hover:from-blue-500/40 hover:to-cyan-500/40 backdrop-blur-sm border border-blue-400/50 hover:border-blue-400/70 rounded-lg text-center text-blue-200 hover:text-blue-100 font-semibold text-sm transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02] overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-blue-400/20 to-blue-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              <span className="relative z-10 flex items-center justify-center gap-2">
                <FontAwesomeIcon icon={faDiagramProject} />
                Crafting Graph
              </span>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

