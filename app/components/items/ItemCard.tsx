"use client";

import Image from "next/image";
import { Item } from "../../types/item";
import { rarityColors, rarityGradients } from "../../config/rarityConfig";
import { useTranslation } from "../../i18n";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faBoxArchive, faCoins, faRecycle } from "@fortawesome/free-solid-svg-icons";
import itemRecommendations from "../../../data/item_recommendations.json";

interface ItemRecommendation {
  recommendation: string;
  recycleFor: string | null;
  keepFor: string | null;
  sellPrice: number | null;
}

interface ItemCardProps {
  item: Item;
  displayPrice: boolean;
  displayWeight: boolean;
  showTrackIcon: boolean;
  onClick: () => void;
  onTracked: () => void;
  isTrackedFunc: (name: string) => boolean;
  lightweightMode?: boolean;
  showRecommendation?: boolean;
}

// Get recommendation styling based on recommendation type
const getRecommendationBadge = (recommendation: string) => {
  const lowerRec = recommendation.toLowerCase();
  if (lowerRec.includes("keep")) {
    return {
      bgColor: "bg-emerald-500/90",
      borderColor: "border-emerald-400",
      textColor: "text-white",
      icon: faBoxArchive,
      label: "K",
    };
  } else if (lowerRec.includes("sell")) {
    return {
      bgColor: "bg-amber-500/90",
      borderColor: "border-amber-400",
      textColor: "text-white",
      icon: faCoins,
      label: "S",
    };
  } else if (lowerRec.includes("recycle")) {
    return {
      bgColor: "bg-blue-500/90",
      borderColor: "border-blue-400",
      textColor: "text-white",
      icon: faRecycle,
      label: "R",
    };
  }
  return null;
};

export default function ItemCard({
  item,
  displayPrice,
  displayWeight,
  showTrackIcon,
  onClick,
  onTracked,
  isTrackedFunc,
  lightweightMode = false,
  showRecommendation = false,
}: ItemCardProps) {
  const { t, tItem } = useTranslation();
  const rarity = item.infobox?.rarity || "Common";
  const borderColor = rarityColors[rarity] || "#717471";
  const gradient = rarityGradients[rarity] || rarityGradients.Common;

  // Get translated item name
  const translatedName = tItem(item.name);

  // Get item recommendation
  const itemRecommendation = (itemRecommendations as Record<string, ItemRecommendation>)[item.name];
  const badge = itemRecommendation
    ? getRecommendationBadge(itemRecommendation.recommendation)
    : null;

  return (
    <div
      onClick={onClick}
      className={`group relative rounded-2xl overflow-hidden cursor-pointer ${
        lightweightMode
          ? "bg-black/40 border border-gray-700"
          : "bg-gradient-to-br from-black/60 via-black/40 to-black/60 backdrop-blur-sm hover:scale-105 hover:-translate-y-1 transition-all duration-300"
      }`}
      style={
        lightweightMode
          ? undefined
          : {
              borderWidth: "2px",
              borderStyle: "solid",
              borderColor: borderColor,
              boxShadow: `0 4px 20px ${borderColor}30, 0 0 40px ${borderColor}10, inset 0 1px 0 rgba(255,255,255,0.1)`,
            }
      }
    >
      {/* Item Tracking Button - Only show if showTrackIcon is enabled */}
      {showTrackIcon && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTracked();
          }}
          title={isTrackedFunc(item.name) ? t("track.untrack") : t("track.track")}
          className={`absolute top-2 left-2 z-20 w-8 h-8 rounded-md flex items-center justify-center text-sm ${
            isTrackedFunc(item.name) ? "bg-yellow-400 text-black" : "bg-black/40 text-gray-300"
          }`}
          style={{ cursor: "pointer" }}
        >
          <FontAwesomeIcon
            icon={faEye}
            className="text-white text-xl relative z-10 drop-shadow-lg"
          />
        </button>
      )}

      {/* Recommendation Badge - Only show if showRecommendation is enabled and badge exists */}
      {showRecommendation && badge && (
        <div
          className={`absolute bottom-12 left-2 z-20 w-7 h-7 rounded-md flex items-center justify-center ${badge.bgColor} border ${badge.borderColor} shadow-lg`}
          title={itemRecommendation?.recommendation}
        >
          <FontAwesomeIcon
            icon={badge.icon}
            className={`${badge.textColor} text-sm drop-shadow-md`}
          />
        </div>
      )}
      {/* Animated border glow on hover (disabled in lightweight mode) */}
      {!lightweightMode && (
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
          style={{
            boxShadow: `0 0 30px ${borderColor}60, inset 0 0 20px ${borderColor}20`,
          }}
        />
      )}

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
        className={`aspect-square flex items-center justify-center p-4 relative overflow-hidden ${
          lightweightMode ? "bg-black/60" : ""
        }`}
        style={lightweightMode ? undefined : { background: gradient }}
      >
        {/* Subtle shine effect (disabled in lightweight mode) */}
        {!lightweightMode && (
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        )}

        {item.image_urls?.thumb ? (
          // External item images intentionally use <img> for flexible loading/error handling
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image_urls.thumb}
            alt={translatedName}
            className={`w-full h-full object-contain relative z-10 ${
              lightweightMode
                ? ""
                : "group-hover:scale-110 group-hover:rotate-2 transition-all duration-300 drop-shadow-2xl"
            }`}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="text-2xl text-gray-700/50">?</div>
        )}
      </div>

      {/* Name Section */}
      <div
        className={`p-2.5 border-t ${
          lightweightMode
            ? "bg-black/80"
            : "bg-gradient-to-br from-black/80 to-black/60 backdrop-blur-sm"
        }`}
        style={{ borderColor: `${borderColor}20` }}
      >
        <h3
          className="font-semibold text-xs group-hover:brightness-125 transition-all line-clamp-2 text-center leading-tight drop-shadow-lg"
          style={{
            color: borderColor,
            textShadow: `0 2px 8px ${borderColor}40`,
          }}
        >
          {translatedName}
        </h3>
      </div>

      {/* Hover Effect Overlay (disabled in lightweight mode) */}
      {!lightweightMode && (
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl"
          style={{
            background: `radial-gradient(circle at center, ${borderColor}20 0%, transparent 70%)`,
          }}
        />
      )}
    </div>
  );
}
