"use client";

import Image from "next/image";
import { Item } from "../../types/item";
import { rarityColors, rarityGradients } from "../../config/rarityConfig";
import { useTranslation } from "../../i18n";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faWrench,
  faRocket,
  faScroll,
  faRecycle,
  faCubes,
  faKiwiBird,
  faDiagramProject,
} from "@fortawesome/free-solid-svg-icons";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";

// Map special types to icons and colors
const specialTypeIcons: Record<string, { icon: IconDefinition; color: string; bg: string }> = {
  workshop_upgrade: { icon: faWrench, color: "text-amber-400", bg: "bg-amber-500/30" },
  expedition: { icon: faRocket, color: "text-cyan-400", bg: "bg-cyan-500/30" },
  quest: { icon: faScroll, color: "text-rose-400", bg: "bg-rose-500/30" },
  safe_to_recycle: { icon: faRecycle, color: "text-green-400", bg: "bg-green-500/30" },
  crafting_material: { icon: faCubes, color: "text-purple-400", bg: "bg-purple-500/30" },
  scrappy_items: { icon: faKiwiBird, color: "text-orange-400", bg: "bg-orange-500/30" },
};

interface ItemCardProps {
  item: Item;
  displayPrice: boolean;
  displayWeight: boolean;
  showTrackIcon: boolean;
  showSpecialIcons: boolean;
  onClick: () => void;
  onTracked: () => void;
  isTrackedFunc: (name: string) => boolean;
  lightweightMode?: boolean;
  showCraftGraphIcon?: boolean;
}

export default function ItemCard({
  item,
  displayPrice,
  displayWeight,
  showTrackIcon,
  showSpecialIcons,
  onClick,
  onTracked,
  isTrackedFunc,
  lightweightMode = false,
  showCraftGraphIcon = true,
}: ItemCardProps) {
  const { t, tItem } = useTranslation();
  const rarity = item.infobox?.rarity || "Common";
  const borderColor = rarityColors[rarity] || "#717471";
  const gradient = rarityGradients[rarity] || rarityGradients.Common;

  // Get translated item name
  const translatedName = tItem(item.name);

  return (
    <div
      onClick={onClick}
      className={`group relative rounded-2xl overflow-hidden cursor-pointer ${
        lightweightMode
          ? "bg-black/40 border border-gray-700"
          : "bg-gradient-to-br from-black/60 via-black/40 to-black/60 hover:scale-105 hover:-translate-y-1 transition-all duration-300"
      }`}
      style={
        lightweightMode
          ? undefined
          : {
              borderWidth: "2px",
              borderStyle: "solid",
              borderColor: borderColor,
              boxShadow: `0 4px 20px ${borderColor}30, 0 0 40px ${borderColor}10, inset 0 1px 0 rgba(255,255,255,0.1)`,
              willChange: "transform",
              backfaceVisibility: "hidden",
              WebkitFontSmoothing: "antialiased",
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
          className={`absolute top-2 left-2 z-20 w-8 h-8 rounded-md flex items-center justify-center text-sm backdrop-blur-sm transition-all duration-200 hover:scale-110 ${
            isTrackedFunc(item.name)
              ? "bg-gradient-to-br from-yellow-500/50 to-amber-500/50 hover:from-yellow-500/60 hover:to-amber-500/60 text-white"
              : "bg-gradient-to-br from-gray-500/30 to-slate-500/30 hover:from-gray-500/40 hover:to-slate-500/40 text-white"
          }`}
          style={{ cursor: "pointer" }}
        >
          <FontAwesomeIcon icon={faEye} className="text-sm relative z-10 drop-shadow-lg" />
        </button>
      )}

      {/* Crafting Graph Button - Top left corner */}
      {showCraftGraphIcon && (
        <a
          href={`/?graph=${encodeURIComponent(item.name)}`}
          onClick={(e) => {
            e.stopPropagation();
          }}
          title={t("item.craftingGraph")}
          className={`absolute top-2 z-20 w-8 h-8 rounded-md flex items-center justify-center bg-gradient-to-br from-blue-500/30 to-cyan-500/30 hover:from-blue-500/40 hover:to-cyan-500/40 backdrop-blur-sm text-white transition-all duration-200 hover:scale-110 ${
            showTrackIcon ? "left-11" : "left-2"
          }`}
          style={{ cursor: "pointer" }}
        >
          <FontAwesomeIcon
            icon={faDiagramProject}
            className="text-sm relative z-10 drop-shadow-lg"
          />
        </a>
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
        {/* Special Type Icons - Bottom Left of Image */}
        {showSpecialIcons &&
          item.infobox?.special_types &&
          item.infobox.special_types.length > 0 && (
            <div className="absolute bottom-1 left-1 z-20 flex flex-row gap-0.5">
              {item.infobox.special_types
                .filter((type) => specialTypeIcons[type])
                .slice(0, 4) // Limit to 4 icons max
                .map((type) => {
                  const iconInfo = specialTypeIcons[type];
                  return (
                    <div
                      key={type}
                      className={`w-5 h-5 rounded flex items-center justify-center ${iconInfo.bg} backdrop-blur-sm border border-white/10`}
                    >
                      <FontAwesomeIcon
                        icon={iconInfo.icon}
                        className={`${iconInfo.color} text-[10px]`}
                      />
                    </div>
                  );
                })}
            </div>
          )}

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
            transform: "scale(1)",
            transformOrigin: "center",
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
