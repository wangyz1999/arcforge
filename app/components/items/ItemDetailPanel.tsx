"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStar,
  faExternalLinkAlt,
  faDiagramProject,
  faLocationDot,
  faQuoteLeft,
  faEye,
  faBoxArchive,
  faCoins,
  faRecycle,
  faLightbulb,
  faCircleInfo,
} from "@fortawesome/free-solid-svg-icons";
import { Item } from "../../types/item";
import { rarityColors, rarityGradients } from "../../config/rarityConfig";
import { specialTypeLabels } from "../../config/categoryConfig";
import { useTranslation } from "../../i18n";
import itemRecommendations from "../../../data/item_recommendations.json";
import CraftingGraphModal from "../graph/CraftingGraphModal";

interface ItemRecommendation {
  recommendation: string;
  recycleFor: string | null;
  keepFor: string | null;
  sellPrice: number | null;
}

const recommendations = itemRecommendations as Record<string, ItemRecommendation>;

interface ItemDetailPanelProps {
  item: Item;
  onClose: () => void;
  onItemTracked: (name: string) => void;
  isTrackedFunc: (name: string) => boolean;
}

const getSellPrice = (
  price: number | number[] | null | undefined,
  notAvailable: string,
): string => {
  if (!price) return notAvailable;
  if (Array.isArray(price)) {
    return `${price[0]} - ${price[price.length - 1]}`;
  }
  return price.toString();
};

// Get recommendation color and icon based on recommendation type
const getRecommendationStyle = (recommendation: string) => {
  const lowerRec = recommendation.toLowerCase();
  if (lowerRec.startsWith("keep")) {
    return {
      bgColor: "from-emerald-500/20 to-green-500/20",
      borderColor: "border-emerald-400/50",
      textColor: "text-emerald-300",
      icon: faBoxArchive,
      label: "Keep",
    };
  } else if (lowerRec.startsWith("sell")) {
    return {
      bgColor: "from-yellow-500/20 to-amber-500/20",
      borderColor: "border-yellow-400/50",
      textColor: "text-yellow-300",
      icon: faCoins,
      label: "Sell",
    };
  } else if (lowerRec.startsWith("recycle")) {
    return {
      bgColor: "from-blue-500/20 to-cyan-500/20",
      borderColor: "border-blue-400/50",
      textColor: "text-blue-300",
      icon: faRecycle,
      label: "Recycle",
    };
  }
  return {
    bgColor: "from-purple-500/20 to-pink-500/20",
    borderColor: "border-purple-400/50",
    textColor: "text-purple-300",
    icon: faLightbulb,
    label: "Tip",
  };
};

export default function ItemDetailPanel({
  item,
  onClose,
  onItemTracked,
  isTrackedFunc,
}: ItemDetailPanelProps) {
  const { t, tItem } = useTranslation();
  const [isGraphModalOpen, setIsGraphModalOpen] = useState(false);

  // Handle Escape key to close panel (only if graph modal is not open)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isGraphModalOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, isGraphModalOpen]);

  // Get translated item name
  const translatedName = tItem(item.name);

  // Get recommendation for this item
  const itemRecommendation = recommendations[item.name];

  // Get translated special type label
  const getSpecialTypeLabel = (type: string): string => {
    const key = `specialType.${type}`;
    const translated = t(key);
    return translated !== key ? translated : specialTypeLabels[type] || type;
  };
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 z-40 backdrop-blur-md" onClick={onClose} />

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
              title={isTrackedFunc(item.name) ? t("track.untrack") : t("track.track")}
              className={`w-10 h-10 flex items-center justify-center rounded-md text-sm ${
                isTrackedFunc(item.name)
                  ? "bg-yellow-400 text-black"
                  : "bg-black/40 text-purple-200"
              }`}
              style={{ cursor: "pointer" }}
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
              aria-label={t("buttons.close")}
            >
              <span className="text-lg group-hover:rotate-90 transition-transform duration-300">
                ✕
              </span>
            </button>
          </div>

          {/* Item Header */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider backdrop-blur-sm border shadow-lg"
                style={{
                  backgroundColor: `${rarityColors[item.infobox?.rarity] || "#717471"}30`,
                  borderColor: `${rarityColors[item.infobox?.rarity] || "#717471"}60`,
                  color: rarityColors[item.infobox?.rarity] || "#717471",
                  boxShadow: `0 4px 20px ${rarityColors[item.infobox?.rarity] || "#717471"}30`,
                }}
              >
                <FontAwesomeIcon icon={faStar} className="text-xs" />
                {item.infobox?.rarity || "Common"}
              </div>

              {item.infobox?.type && (
                <span className="text-purple-400 text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-2 px-2.5 py-1 bg-purple-500/20 rounded-lg border border-purple-500/30">
                  {item.infobox.type}
                </span>
              )}
            </div>

            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-100 via-purple-200 to-gray-100 mb-3 drop-shadow-lg">
              {translatedName}
            </h2>

            {/* Special Type Tags */}
            {item.infobox?.special_types && item.infobox.special_types.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {item.infobox.special_types.map((specialType: string) => (
                  <span
                    key={specialType}
                    className="px-2.5 py-1 bg-emerald-500/30 text-emerald-200 rounded-md text-xs font-semibold border border-emerald-400/50 shadow-sm"
                  >
                    {getSpecialTypeLabel(specialType)}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Keep/Sell/Recycle Recommendation */}
          {itemRecommendation && (
            <div className="mb-4">
              <h3 className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-blue-300 mb-2 uppercase tracking-wider">
                {t("recommendation.title")}
              </h3>
              <div
                className={`p-3 rounded-xl bg-gradient-to-br ${getRecommendationStyle(itemRecommendation.recommendation).bgColor} border ${getRecommendationStyle(itemRecommendation.recommendation).borderColor} shadow-lg relative`}
              >
                {/* Info Icon with Tooltip */}
                <div className="absolute top-1.5 right-1.5 group/info">
                  <FontAwesomeIcon
                    icon={faCircleInfo}
                    className="text-gray-400/60 hover:text-gray-300 text-xs cursor-help transition-colors"
                  />
                  <div className="absolute right-0 top-full mt-1 w-56 p-2 bg-gray-900/95 border border-gray-700 rounded-lg text-xs text-gray-300 opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all duration-200 z-50 shadow-xl">
                    Recommendations are based on community-created data in{" "}
                    <a
                      href="https://docs.google.com/spreadsheets/d/1zGlYsm7zNQQszuOBFwB_bXqr-lo8WO4jGPrNeQo8jvI"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 underline"
                    >
                      ARC Raiders - Safe to Sell or Recycle GUIDE Dec. 2025
                    </a>
                  </div>
                </div>

                {/* Main Recommendation */}
                <div className="flex items-center gap-2 mb-2">
                  <FontAwesomeIcon
                    icon={getRecommendationStyle(itemRecommendation.recommendation).icon}
                    className={`${getRecommendationStyle(itemRecommendation.recommendation).textColor} text-sm`}
                  />
                  <span
                    className={`font-semibold text-sm ${getRecommendationStyle(itemRecommendation.recommendation).textColor}`}
                  >
                    {itemRecommendation.recommendation}
                  </span>
                </div>

                {/* Additional Details */}
                <div className="space-y-1.5 text-xs">
                  {itemRecommendation.keepFor && (
                    <div className="flex items-start gap-2">
                      <span className="text-gray-400 flex-shrink-0">
                        {t("recommendation.keepFor")}:
                      </span>
                      <span className="text-emerald-300">{itemRecommendation.keepFor}</span>
                    </div>
                  )}
                  {itemRecommendation.recycleFor && (
                    <div className="flex items-start gap-2">
                      <span className="text-gray-400 flex-shrink-0">
                        {t("recommendation.recycleFor")}:
                      </span>
                      <span className="text-blue-300">{itemRecommendation.recycleFor}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Item Image */}
          {item.image_urls?.thumb && (
            <button
              onClick={() => setIsGraphModalOpen(true)}
              className="relative w-full aspect-square rounded-xl mb-4 flex items-center justify-center p-8 border overflow-hidden group shadow-xl cursor-pointer"
              style={{
                background: rarityGradients[item.infobox?.rarity] || rarityGradients.Common,
                borderColor: `${rarityColors[item.infobox?.rarity] || "#717471"}40`,
                boxShadow: `0 8px 32px ${rarityColors[item.infobox?.rarity] || "#717471"}40, inset 0 1px 0 rgba(255,255,255,0.1)`,
              }}
            >
              {/* Animated shine effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

              {/* External item images intentionally use <img> for flexible loading/error handling */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.image_urls.thumb}
                alt={translatedName}
                className="w-full h-full object-contain relative z-10 drop-shadow-2xl"
              />
            </button>
          )}

          {/* Quote */}
          {item.infobox?.quote && (
            <div className="mb-4 pb-4 border-b border-purple-500/20">
              <p className="text-gray-300 text-sm italic leading-relaxed flex gap-2">
                <FontAwesomeIcon
                  icon={faQuoteLeft}
                  className="text-purple-400/40 text-xs mt-0.5 flex-shrink-0"
                />
                <span>{item.infobox.quote}</span>
              </p>
            </div>
          )}

          {/* Stats and Info */}
          <div className="mb-4 space-y-2 text-sm">
            {item.infobox?.location && (
              <div className="flex items-start gap-2">
                <FontAwesomeIcon
                  icon={faLocationDot}
                  className="text-blue-400/70 text-xs mt-0.5 w-3.5"
                />
                <div className="flex-1">
                  <span className="text-gray-400">{t("item.location")}: </span>
                  <span
                    className="text-gray-200"
                    dangerouslySetInnerHTML={{
                      __html: item.infobox.location.replace(/<br\s*\/?>/gi, " • "),
                    }}
                  />
                </div>
              </div>
            )}
            {item.infobox?.weight != null && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400 w-24">{t("item.weight")}:</span>
                <span className="text-gray-100 font-semibold">{item.infobox.weight}</span>
              </div>
            )}
            {item.infobox?.sellprice != null && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400 w-24">{t("item.sellPrice")}:</span>
                <span className="text-emerald-400 font-semibold">
                  {getSellPrice(item.infobox.sellprice, t("item.notAvailable"))}
                </span>
              </div>
            )}
            {item.infobox?.stacksize != null && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400 w-24">{t("item.stackSize")}:</span>
                <span className="text-gray-100 font-semibold">{item.infobox.stacksize}</span>
              </div>
            )}
            {item.infobox?.damage != null && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400 w-24">{t("item.damage")}:</span>
                <span className="text-red-400 font-semibold">{item.infobox.damage}</span>
              </div>
            )}
          </div>

          {/* Sources */}
          {item.sources && item.sources.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-blue-300 mb-2 uppercase tracking-wider">
                {t("item.sources")}
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
                {t("item.wiki")}
              </span>
            </a>
            <button
              onClick={() => setIsGraphModalOpen(true)}
              className="group relative flex-1 py-3 bg-gradient-to-br from-blue-500/30 to-cyan-500/30 hover:from-blue-500/40 hover:to-cyan-500/40 backdrop-blur-sm border border-blue-400/50 hover:border-blue-400/70 rounded-lg text-center text-blue-200 hover:text-blue-100 font-semibold text-sm transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02] overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-blue-400/20 to-blue-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              <span className="relative z-10 flex items-center justify-center gap-2">
                <FontAwesomeIcon icon={faDiagramProject} />
                {t("item.craftingGraph")}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Crafting Graph Modal */}
      <CraftingGraphModal
        itemName={item.name}
        isOpen={isGraphModalOpen}
        onClose={() => setIsGraphModalOpen(false)}
      />
    </>
  );
}
