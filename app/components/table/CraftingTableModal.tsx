"use client";

import { useMemo, useState, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCog,
  faQuestionCircle,
  faShareNodes,
  faTimes,
  faCheck,
  faDiagramProject,
  faArrowDown,
  faArrowUp,
  faHammer,
  faWrench,
  faRecycle,
  faGem,
  faArrowTrendUp,
  faCoins,
} from "@fortawesome/free-solid-svg-icons";
import itemsRelationData from "../../../data/items_relation.json";
import TableSettingsPanel from "./TableSettingsPanel";
import HelpPanel from "./HelpPanel";
import { ItemData } from "../../types/graph";
import {
  cleanRelationName,
  getEdgePriority,
  formatRelationDetail,
  formatEdgeQuantity,
} from "../../utils/graphHelpers";
import { useTranslation } from "../../i18n";
import ErrorState from "./ErrorState";
import type { CraftingLayout } from "../graph/CraftingGraphModal";

interface CraftingTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemName: string;
  onItemChange: (itemName: string) => void;
  layout?: CraftingLayout;
  onLayoutChange?: (layout: CraftingLayout) => void;
}

// Relation type configuration
const RELATION_CONFIG: Record<
  string,
  {
    icon: typeof faHammer;
    color: string;
    bgColor: string;
    borderColor: string;
    glowColor: string;
  }
> = {
  craft: {
    icon: faHammer,
    color: "#60a5fa",
    bgColor: "rgba(96, 165, 250, 0.08)",
    borderColor: "rgba(96, 165, 250, 0.3)",
    glowColor: "rgba(96, 165, 250, 0.15)",
  },
  repair: {
    icon: faWrench,
    color: "#f87171",
    bgColor: "rgba(248, 113, 113, 0.08)",
    borderColor: "rgba(248, 113, 113, 0.3)",
    glowColor: "rgba(248, 113, 113, 0.15)",
  },
  recycle: {
    icon: faRecycle,
    color: "#34d399",
    bgColor: "rgba(52, 211, 153, 0.08)",
    borderColor: "rgba(52, 211, 153, 0.3)",
    glowColor: "rgba(52, 211, 153, 0.15)",
  },
  salvage: {
    icon: faGem,
    color: "#4ade80",
    bgColor: "rgba(74, 222, 128, 0.08)",
    borderColor: "rgba(74, 222, 128, 0.3)",
    glowColor: "rgba(74, 222, 128, 0.15)",
  },
  upgrade: {
    icon: faArrowTrendUp,
    color: "#f472b6",
    bgColor: "rgba(244, 114, 182, 0.08)",
    borderColor: "rgba(244, 114, 182, 0.3)",
    glowColor: "rgba(244, 114, 182, 0.15)",
  },
  trade: {
    icon: faCoins,
    color: "#fbbf24",
    bgColor: "rgba(251, 191, 36, 0.08)",
    borderColor: "rgba(251, 191, 36, 0.3)",
    glowColor: "rgba(251, 191, 36, 0.15)",
  },
};

export default function CraftingTableModal({
  isOpen,
  onClose,
  itemName,
  onItemChange,
  layout = "table",
  onLayoutChange,
}: CraftingTableModalProps) {
  const { t, tItem } = useTranslation();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [showCopied, setShowCopied] = useState(false);

  // Edge type filters - default to all types
  const [selectedEdgeTypes, setSelectedEdgeTypes] = useState<Set<string>>(
    () => new Set(["craft", "repair", "recycle", "salvage", "upgrade", "trade"]),
  );

  // Find the selected item and build item lookup
  const { selectedItem, itemsLookup } = useMemo(() => {
    const lookup = new Map<string, ItemData>();
    (itemsRelationData as ItemData[]).forEach((item) => {
      lookup.set(item.name, item);
    });
    const selected = lookup.get(itemName);
    return { selectedItem: selected, itemsLookup: lookup };
  }, [itemName]);

  // Memoize translation functions
  const translateItem = useCallback((name: string) => tItem(name), [tItem]);

  // Handle item navigation within the modal
  const handleItemSelect = useCallback(
    (name: string) => {
      setIsHelpOpen(false);
      setIsSettingsOpen(false);
      onItemChange(name);
    },
    [onItemChange],
  );

  // Handle share button click
  const handleShare = useCallback(async () => {
    const shareUrl =
      layout === "table"
        ? `${window.location.origin}/?graph=${encodeURIComponent(itemName)}&layout=table`
        : `${window.location.origin}/?graph=${encodeURIComponent(itemName)}`;
    const shareData = {
      title: `${tItem(itemName)} - ARC Forge Crafting Table`,
      text: t("graph.shareText") || `Check out the crafting table for ${tItem(itemName)}`,
      url: shareUrl,
    };

    // Try Web Share API first (mobile)
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        // User cancelled or share failed, fall back to clipboard
        if ((err as Error).name === "AbortError") return;
      }
    }

    // Fall back to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    }
  }, [itemName, t, tItem, layout]);

  const currentItem = useMemo(() => itemsLookup.get(itemName), [itemsLookup, itemName]);

  // Group relations by type and direction
  const groupedRelations = useMemo(() => {
    if (!currentItem)
      return {
        inputs: {} as Record<
          string,
          Array<{
            key: string;
            name: string;
            thumb: string;
            detail: string;
            edge: ItemData["edges"][0];
          }>
        >,
        outputs: {} as Record<
          string,
          Array<{
            key: string;
            name: string;
            thumb: string;
            detail: string;
            edge: ItemData["edges"][0];
          }>
        >,
        currentThumb: "",
      };

    const currentThumb = currentItem.image_urls?.thumb
      ? `/api/proxy-image?url=${encodeURIComponent(currentItem.image_urls.thumb)}`
      : "";

    const shouldIncludeEdge = (relation: string): boolean => {
      if (!selectedEdgeTypes) return true;
      if (selectedEdgeTypes.size === 0) return false;

      const cleaned = cleanRelationName(relation);
      return selectedEdgeTypes.has(cleaned);
    };

    const inputs: Record<
      string,
      Array<{
        key: string;
        name: string;
        thumb: string;
        detail: string;
        edge: ItemData["edges"][0];
      }>
    > = {};

    const outputs: Record<
      string,
      Array<{
        key: string;
        name: string;
        thumb: string;
        detail: string;
        edge: ItemData["edges"][0];
      }>
    > = {};

    currentItem.edges
      .filter((edge) => shouldIncludeEdge(edge.relation))
      .forEach((edge, idx) => {
        const relationKey = cleanRelationName(edge.relation);

        const detail = formatRelationDetail(edge, t, translateItem, currentItem.name);

        const otherName = edge.name;
        const otherItem = itemsLookup.get(otherName);
        const otherThumb = otherItem?.image_urls?.thumb
          ? `/api/proxy-image?url=${encodeURIComponent(otherItem.image_urls.thumb)}`
          : "";

        const entry = {
          key: `${edge.direction}:${edge.name}:${edge.relation}:${idx}`,
          name: otherName,
          thumb: otherThumb,
          detail,
          edge,
        };

        if (edge.direction === "in") {
          // Input: other item → current item
          if (!inputs[relationKey]) inputs[relationKey] = [];
          inputs[relationKey].push(entry);
        } else {
          // Output: current item → other item
          if (!outputs[relationKey]) outputs[relationKey] = [];
          outputs[relationKey].push(entry);
        }
      });

    // Sort each group by edge priority then name
    const sortEntries = (entries: (typeof inputs)[string]) => {
      return entries.sort((a, b) => {
        const prio = getEdgePriority(a.edge) - getEdgePriority(b.edge);
        if (prio !== 0) return prio;
        return a.name.localeCompare(b.name);
      });
    };

    Object.keys(inputs).forEach((key) => sortEntries(inputs[key]));
    Object.keys(outputs).forEach((key) => sortEntries(outputs[key]));

    return { inputs, outputs, currentThumb };
  }, [currentItem, itemsLookup, selectedEdgeTypes, translateItem, t]);

  // Get all active relation types
  const activeRelationTypes = useMemo(() => {
    const types = new Set<string>();
    Object.keys(groupedRelations.inputs).forEach((key) => types.add(key));
    Object.keys(groupedRelations.outputs).forEach((key) => types.add(key));
    return Array.from(types).sort((a, b) => {
      const order = ["craft", "repair", "recycle", "salvage", "upgrade", "trade"];
      return order.indexOf(a) - order.indexOf(b);
    });
  }, [groupedRelations]);

  if (!isOpen) return null;

  if (!selectedItem) {
    return (
      /* Modal Container - positioned below header using margin-top */
      <div className="fixed inset-0 z-30 mt-16 sm:mt-20 md:mt-24 flex flex-col bg-[#07020b]">
        {/* Top Right Buttons */}
        <div className="absolute top-4 right-4 z-30 flex items-center gap-3">
          {/* Layout Toggle */}
          {onLayoutChange && (
            <button
              onClick={() => onLayoutChange("graph")}
              className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-indigo-500/30 to-purple-500/20 backdrop-blur-xl rounded-full shadow-2xl hover:from-indigo-500/40 hover:to-purple-500/30 transition-all duration-300 border border-white/20 hover:border-white/30 hover:scale-105"
              aria-label={t("item.craftingGraph")}
              title={t("item.craftingGraph")}
            >
              <FontAwesomeIcon icon={faDiagramProject} className="text-white text-xl" />
            </button>
          )}
          {/* Share Button */}
          <button
            onClick={handleShare}
            className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-emerald-500/30 to-teal-500/20 backdrop-blur-xl rounded-full shadow-2xl hover:from-emerald-500/40 hover:to-teal-500/30 transition-all duration-300 border border-white/20 hover:border-white/30 hover:scale-105"
            aria-label={t("buttons.share")}
          >
            <FontAwesomeIcon
              icon={showCopied ? faCheck : faShareNodes}
              className={`text-xl transition-colors duration-200 ${showCopied ? "text-emerald-400" : "text-white"}`}
            />
          </button>
          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-red-500/30 to-pink-500/20 backdrop-blur-xl rounded-full shadow-2xl hover:from-red-500/40 hover:to-pink-500/30 transition-all duration-300 border border-white/20 hover:border-white/30 hover:scale-105"
            aria-label={t("buttons.close")}
          >
            <FontAwesomeIcon icon={faTimes} className="text-white text-xl" />
          </button>
        </div>
        <ErrorState itemName={itemName} />
      </div>
    );
  }

  const currentThumb = currentItem?.image_urls?.thumb
    ? `/api/proxy-image?url=${encodeURIComponent(currentItem.image_urls.thumb)}`
    : "";

  return (
    /* Modal Container - positioned below header using margin-top matching header heights */
    <div className="fixed inset-0 z-30 mt-16 sm:mt-20 md:mt-24 flex flex-col bg-[#07020b] text-gray-100 overflow-hidden overscroll-contain">
      {/* Top Right Buttons */}
      <div className="absolute top-4 right-4 z-30 flex items-center gap-2 sm:gap-3">
        {/* Layout Toggle */}
        {onLayoutChange && (
          <button
            onClick={() => onLayoutChange("graph")}
            className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-gradient-to-br from-indigo-500/30 to-purple-500/20 backdrop-blur-xl rounded-full shadow-2xl hover:from-indigo-500/40 hover:to-purple-500/30 transition-all duration-300 border border-white/20 hover:border-white/30 hover:scale-105"
            aria-label={t("item.craftingGraph")}
            title={t("item.craftingGraph")}
          >
            <FontAwesomeIcon icon={faDiagramProject} className="text-white text-lg sm:text-xl" />
          </button>
        )}
        {/* Share Button */}
        <button
          onClick={handleShare}
          className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-gradient-to-br from-emerald-500/30 to-teal-500/20 backdrop-blur-xl rounded-full shadow-2xl hover:from-emerald-500/40 hover:to-teal-500/30 transition-all duration-300 border border-white/20 hover:border-white/30 hover:scale-105"
          aria-label={t("buttons.share")}
        >
          <FontAwesomeIcon
            icon={showCopied ? faCheck : faShareNodes}
            className={`text-lg sm:text-xl transition-colors duration-200 ${showCopied ? "text-emerald-400" : "text-white"}`}
          />
        </button>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-gradient-to-br from-red-500/30 to-pink-500/20 backdrop-blur-xl rounded-full shadow-2xl hover:from-red-500/40 hover:to-pink-500/30 transition-all duration-300 border border-white/20 hover:border-white/30 hover:scale-105"
          aria-label={t("buttons.close")}
        >
          <FontAwesomeIcon icon={faTimes} className="text-white text-lg sm:text-xl" />
        </button>
      </div>

      {/* Help Button */}
      <button
        onClick={() => setIsHelpOpen(true)}
        className="absolute bottom-24 sm:bottom-28 right-4 sm:right-8 z-30 w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center bg-gradient-to-br from-blue-500/30 to-cyan-500/20 backdrop-blur-xl rounded-full shadow-2xl hover:from-blue-500/40 hover:to-cyan-500/30 transition-all duration-300 border border-white/20 hover:border-white/30 hover:shadow-blue-500/50 hover:scale-105"
        aria-label={t("buttons.openHelp")}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-full pointer-events-none"></div>
        <FontAwesomeIcon
          icon={faQuestionCircle}
          className="text-white text-lg sm:text-xl relative z-10 drop-shadow-lg"
        />
      </button>

      {/* Settings Button */}
      <button
        onClick={() => setIsSettingsOpen(true)}
        className="absolute bottom-4 sm:bottom-8 right-4 sm:right-8 z-30 w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center bg-gradient-to-br from-purple-500/30 to-pink-500/20 backdrop-blur-xl rounded-full shadow-2xl hover:from-purple-500/40 hover:to-pink-500/30 transition-all duration-300 border border-white/20 hover:border-white/30 hover:shadow-purple-500/50 hover:scale-105"
        aria-label={t("buttons.openRelationFilters")}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-full pointer-events-none"></div>
        <FontAwesomeIcon
          icon={faCog}
          className="text-white text-lg sm:text-xl relative z-10 drop-shadow-lg"
        />
      </button>

      {/* Main Content */}
      <div className="flex-1 relative bg-[#07020b] overflow-hidden overscroll-contain">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at center, rgba(139, 92, 246, 0.06) 0%, rgba(7, 2, 11, 1) 100%)",
          }}
        />

        <div className="relative z-10 h-full overflow-y-auto overscroll-contain px-3 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8 pb-24 sm:pb-32">
          {/* Header with Item Info */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center gap-4 sm:gap-6">
              {/* Item Image */}
              <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-purple-900/40 to-black/60 border border-purple-500/30 flex items-center justify-center overflow-hidden shrink-0 shadow-xl shadow-purple-500/10">
                {currentThumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentThumb}
                    alt={tItem(itemName)}
                    className="w-full h-full object-contain p-2"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="text-gray-600 text-2xl">?</div>
                )}
              </div>
              {/* Item Name & Label */}
              <div className="flex flex-col gap-1">
                <div className="text-[10px] sm:text-xs uppercase tracking-widest text-purple-400/80 font-semibold">
                  {t("item.craftingTable")}
                </div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-100 via-purple-200 to-gray-100 leading-tight">
                  {tItem(itemName)}
                </h1>
              </div>
            </div>
          </div>

          {/* Relation Cards Grid */}
          {activeRelationTypes.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="text-gray-500 text-lg mb-2">
                  {t("graph.noRelations") || "No relations found"}
                </div>
                <div className="text-gray-600 text-sm">
                  {t("graph.checkFilters") || "Try adjusting the filters"}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {activeRelationTypes.map((relationType) => {
                const config = RELATION_CONFIG[relationType] || RELATION_CONFIG.craft;
                const inputItems = groupedRelations.inputs[relationType] || [];
                const outputItems = groupedRelations.outputs[relationType] || [];
                const hasItems = inputItems.length > 0 || outputItems.length > 0;

                if (!hasItems) return null;

                return (
                  <div
                    key={relationType}
                    className="rounded-2xl overflow-hidden"
                    style={{
                      backgroundColor: config.bgColor,
                      border: `1px solid ${config.borderColor}`,
                      boxShadow: `0 4px 24px ${config.glowColor}`,
                    }}
                  >
                    {/* Card Header */}
                    <div
                      className="px-4 py-3 flex items-center gap-3 border-b"
                      style={{ borderColor: config.borderColor }}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${config.color}20` }}
                      >
                        <FontAwesomeIcon
                          icon={config.icon}
                          className="text-sm"
                          style={{ color: config.color }}
                        />
                      </div>
                      <span
                        className="font-bold text-sm uppercase tracking-wide"
                        style={{ color: config.color }}
                      >
                        {t(`graph.${relationType}`)}
                      </span>
                      <span
                        className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${config.color}15`,
                          color: config.color,
                        }}
                      >
                        {inputItems.length + outputItems.length}
                      </span>
                    </div>

                    {/* Card Content */}
                    <div className="p-3 space-y-3">
                      {/* Inputs Section */}
                      {inputItems.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2 px-1">
                            <FontAwesomeIcon
                              icon={faArrowDown}
                              className="text-xs"
                              style={{ color: config.color }}
                            />
                            <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">
                              {t("graph.inputs") || "Inputs"}
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            {inputItems.map((item) => (
                              <button
                                key={item.key}
                                onClick={() => handleItemSelect(item.name)}
                                className="w-full flex items-center gap-3 px-2 py-2 rounded-xl bg-black/30 hover:bg-black/50 border border-transparent hover:border-white/10 transition-all group"
                              >
                                <div className="w-10 h-10 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center overflow-hidden shrink-0">
                                  {item.thumb ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={item.thumb}
                                      alt={tItem(item.name)}
                                      className="w-full h-full object-contain"
                                      onError={(e) => {
                                        e.currentTarget.style.display = "none";
                                      }}
                                    />
                                  ) : (
                                    <span className="text-gray-600 text-xs">?</span>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                  <div className="text-sm font-medium text-gray-200 break-words group-hover:text-white transition-colors">
                                    {tItem(item.name)}
                                    {formatEdgeQuantity(item.edge) && (
                                      <span className="ml-2 font-mono text-cyan-300">
                                        {formatEdgeQuantity(item.edge)}
                                      </span>
                                    )}
                                  </div>
                                  {item.detail && (
                                    <div className="mt-1 text-xs leading-relaxed text-slate-400 break-words">
                                      {item.detail}
                                    </div>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Outputs Section */}
                      {outputItems.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2 px-1">
                            <FontAwesomeIcon
                              icon={faArrowUp}
                              className="text-xs"
                              style={{ color: config.color }}
                            />
                            <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">
                              {t("graph.outputs") || "Outputs"}
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            {outputItems.map((item) => (
                              <button
                                key={item.key}
                                onClick={() => handleItemSelect(item.name)}
                                className="w-full flex items-center gap-3 px-2 py-2 rounded-xl bg-black/30 hover:bg-black/50 border border-transparent hover:border-white/10 transition-all group"
                              >
                                <div className="w-10 h-10 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center overflow-hidden shrink-0">
                                  {item.thumb ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={item.thumb}
                                      alt={tItem(item.name)}
                                      className="w-full h-full object-contain"
                                      onError={(e) => {
                                        e.currentTarget.style.display = "none";
                                      }}
                                    />
                                  ) : (
                                    <span className="text-gray-600 text-xs">?</span>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                  <div className="text-sm font-medium text-gray-200 break-words group-hover:text-white transition-colors">
                                    {tItem(item.name)}
                                    {formatEdgeQuantity(item.edge) && (
                                      <span className="ml-2 font-mono text-cyan-300">
                                        {formatEdgeQuantity(item.edge)}
                                      </span>
                                    )}
                                  </div>
                                  {item.detail && (
                                    <div className="mt-1 text-xs leading-relaxed text-slate-400 break-words">
                                      {item.detail}
                                    </div>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Help Panel */}
      <HelpPanel isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* Settings Panel */}
      <TableSettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        selectedEdgeTypes={selectedEdgeTypes}
        setSelectedEdgeTypes={setSelectedEdgeTypes}
      />
    </div>
  );
}
