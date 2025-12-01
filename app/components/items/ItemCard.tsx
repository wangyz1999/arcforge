import Image from 'next/image';
import { Item } from '../../types/item';
import { rarityColors, rarityGradients } from '../../config/rarityConfig';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye } from '@fortawesome/free-solid-svg-icons';

interface ItemCardProps {
  item: Item;
  displayPrice: boolean;
  displayWeight: boolean;
  showTrackIcon: boolean;
  onClick: () => void;
  onTracked: () => void;
  isTrackedFunc: (name: string) => boolean;
}

export default function ItemCard({ item, displayPrice, displayWeight, showTrackIcon, onClick, onTracked, isTrackedFunc }: ItemCardProps) {
  const rarity = item.infobox?.rarity || 'Common';
  const borderColor = rarityColors[rarity] || '#717471';
  const gradient = rarityGradients[rarity] || rarityGradients.Common;

  return (
    <div
      onClick={onClick}
      className="group relative bg-gradient-to-br from-black/60 via-black/40 to-black/60 backdrop-blur-sm rounded-2xl overflow-hidden hover:scale-105 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
      style={{
        borderWidth: '2px',
        borderStyle: 'solid',
        borderColor: borderColor,
        boxShadow: `0 4px 20px ${borderColor}30, 0 0 40px ${borderColor}10, inset 0 1px 0 rgba(255,255,255,0.1)`
      }}
    >

      {/* Item Tracking Button - Only show if showTrackIcon is enabled */}
      {showTrackIcon && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTracked();
          }}
          title={isTrackedFunc(item.name) ? 'Untrack' : 'Track'}
          className={`absolute top-2 left-2 z-20 w-8 h-8 rounded-md flex items-center justify-center text-sm ${
            isTrackedFunc(item.name) ? 'bg-yellow-400 text-black' : 'bg-black/40 text-gray-300'
          }`}
          style={{cursor: 'pointer'}}
        >
          <FontAwesomeIcon
            icon={faEye}
            className="text-white text-xl relative z-10 drop-shadow-lg"
          />
        </button>
      )}
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
}

