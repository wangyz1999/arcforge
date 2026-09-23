"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import cytoscape from "cytoscape";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCog,
  faQuestionCircle,
  faShareNodes,
  faTimes,
  faCheck,
  faTableCellsLarge,
} from "@fortawesome/free-solid-svg-icons";
import itemsRelationData from "../../../data/items_relation.json";
import GraphSettingsPanel from "./GraphSettingsPanel";
import HelpPanel from "./HelpPanel";
import { ItemData } from "../../types/graph";
import { cytoscapeStyles } from "../../config/cytoscapeStyles";
import { buildGraphElements, buildLayoutPositions } from "../../utils/graphHelpers";
import { useTranslation } from "../../i18n";
import ErrorState from "./ErrorState";

export type CraftingLayout = "graph" | "table";

interface CraftingGraphModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemName: string;
  onItemChange: (itemName: string) => void;
  layout?: CraftingLayout;
  onLayoutChange?: (layout: CraftingLayout) => void;
}

export default function CraftingGraphModal({
  isOpen,
  onClose,
  itemName,
  onItemChange,
  layout = "graph",
  onLayoutChange,
}: CraftingGraphModalProps) {
  const { t, tItem } = useTranslation();
  const cyRef = useRef<cytoscape.Core | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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
  const translateRelation = useCallback((key: string) => t(key), [t]);

  // Handle item navigation within the modal
  const handleItemSelect = useCallback(
    (name: string) => {
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
      title: `${tItem(itemName)} - ARC Forge Crafting Graph`,
      text: t("graph.shareText") || `Check out the crafting graph for ${tItem(itemName)}`,
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

  useEffect(() => {
    if (!isOpen || !containerRef.current) {
      return;
    }

    // Destroy any existing Cytoscape instance first
    if (cyRef.current) {
      try {
        cyRef.current.destroy();
      } catch {
        // Ignore errors during cleanup
      }
      cyRef.current = null;
    }

    // Get current item data
    const currentItem = itemsLookup.get(itemName);
    if (!currentItem) {
      return;
    }

    // Build graph elements from actual data with edge type filtering and translations
    const { elements, leftGrouped, rightGrouped } = buildGraphElements(
      currentItem,
      itemsLookup,
      selectedEdgeTypes,
      translateItem,
      translateRelation,
    );

    // Validate elements before initializing Cytoscape
    if (!elements || elements.length === 0) {
      console.warn("No elements to display in graph");
      return;
    }

    // Ensure container is still available after async operations
    const container = containerRef.current;
    if (!container) {
      return;
    }

    let cy;
    try {
      cy = cytoscape({
        container: container,
        elements: elements as cytoscape.ElementDefinition[],
        style: cytoscapeStyles as unknown as cytoscape.StylesheetCSS[],
        layout: {
          name: "preset",
          positions: buildLayoutPositions(
            elements,
            leftGrouped,
            rightGrouped,
          ) as unknown as cytoscape.NodePositionFunction,
          fit: true,
          padding: 120,
        },
        userZoomingEnabled: true,
        userPanningEnabled: true,
        boxSelectionEnabled: false,
        autoungrabify: true,
      });
      const labelHeights = new Map<string, number>();
      cy.nodes('[type="label"]').forEach((node) => {
        labelHeights.set(node.id(), node.boundingBox().h);
      });
      cy.layout({
        name: "preset",
        positions: buildLayoutPositions(
          elements,
          leftGrouped,
          rightGrouped,
          labelHeights,
        ) as unknown as cytoscape.NodePositionFunction,
        fit: true,
        padding: 120,
      }).run();
    } catch (error) {
      console.error("Error initializing Cytoscape:", error);
      // Clean up container to prevent stale state
      if (container) {
        container.innerHTML = "";
      }
      return;
    }

    cyRef.current = cy;

    // Window resize handler with debouncing
    const handleResize = () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = setTimeout(() => {
        if (cyRef.current) {
          cyRef.current.resize();
        }
      }, 150);
    };

    window.addEventListener("resize", handleResize);

    // Clear any previous animation timeout
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }

    // Force a resize and fit after a short delay
    animationTimeoutRef.current = setTimeout(() => {
      if (cyRef.current) {
        try {
          cyRef.current.resize();
          const graph = cyRef.current;
          const bounds = graph.elements().boundingBox();
          // A full vertical fit makes large trader inventories unreadably small.
          // Frame the columns at a useful scale; the inventory can be panned vertically.
          const zoom = Math.min(1, Math.max(0.2, (graph.width() - 64) / bounds.w));
          graph.zoom(zoom);
          graph.pan({
            x: graph.width() / 2 - ((bounds.x1 + bounds.x2) / 2) * zoom,
            y: graph.height() / 2 - 400 * zoom,
          });
        } catch {
          // Ignore errors if cytoscape instance was destroyed
        }
      }
    }, 100);

    // Handle node clicks - navigate to item if not center node
    cy.on("tap", "node", (event) => {
      const node = event.target;
      const nodeData = node.data();

      if (nodeData.type !== "center" && nodeData.itemName) {
        handleItemSelect(nodeData.itemName);
      }
    });

    return () => {
      window.removeEventListener("resize", handleResize);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }

      if (cyRef.current) {
        try {
          cyRef.current.destroy();
        } catch {
          // Ignore errors during cleanup
        }
        cyRef.current = null;
      }
    };
  }, [
    isOpen,
    itemName,
    itemsLookup,
    selectedEdgeTypes,
    translateItem,
    translateRelation,
    handleItemSelect,
  ]);

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
              onClick={() => onLayoutChange("table")}
              className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-blue-500/30 to-cyan-500/20 backdrop-blur-xl rounded-full shadow-2xl hover:from-blue-500/40 hover:to-cyan-500/30 transition-all duration-300 border border-white/20 hover:border-white/30 hover:scale-105"
              aria-label={t("item.craftingTable")}
              title={t("item.craftingTable")}
            >
              <FontAwesomeIcon icon={faTableCellsLarge} className="text-white text-xl" />
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

  return (
    /* Modal Container - positioned below header using margin-top matching header heights */
    <div className="fixed inset-0 z-30 mt-16 sm:mt-20 md:mt-24 flex flex-col bg-[#07020b] text-gray-100 overflow-hidden overscroll-contain">
      {/* Top Right Buttons */}
      <div className="absolute top-4 right-4 z-30 flex items-center gap-3">
        {/* Layout Toggle */}
        {onLayoutChange && (
          <button
            onClick={() => onLayoutChange("table")}
            className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-blue-500/30 to-cyan-500/20 backdrop-blur-xl rounded-full shadow-2xl hover:from-blue-500/40 hover:to-cyan-500/30 transition-all duration-300 border border-white/20 hover:border-white/30 hover:scale-105"
            aria-label={t("item.craftingTable")}
            title={t("item.craftingTable")}
          >
            <FontAwesomeIcon icon={faTableCellsLarge} className="text-white text-xl" />
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

      {/* Help Button */}
      <button
        onClick={() => setIsHelpOpen(true)}
        className="absolute bottom-28 right-8 z-30 w-14 h-14 flex items-center justify-center bg-gradient-to-br from-blue-500/30 to-cyan-500/20 backdrop-blur-xl rounded-full shadow-2xl hover:from-blue-500/40 hover:to-cyan-500/30 transition-all duration-300 border border-white/20 hover:border-white/30 hover:shadow-blue-500/50 hover:scale-105"
        aria-label={t("buttons.openHelp")}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-full pointer-events-none"></div>
        <FontAwesomeIcon
          icon={faQuestionCircle}
          className="text-white text-xl relative z-10 drop-shadow-lg"
        />
      </button>

      {/* Settings Button */}
      <button
        onClick={() => setIsSettingsOpen(true)}
        className="absolute bottom-8 right-8 z-30 w-14 h-14 flex items-center justify-center bg-gradient-to-br from-purple-500/30 to-pink-500/20 backdrop-blur-xl rounded-full shadow-2xl hover:from-purple-500/40 hover:to-pink-500/30 transition-all duration-300 border border-white/20 hover:border-white/30 hover:shadow-purple-500/50 hover:scale-105"
        aria-label={t("buttons.openRelationFilters")}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-full pointer-events-none"></div>
        <FontAwesomeIcon icon={faCog} className="text-white text-xl relative z-10 drop-shadow-lg" />
      </button>

      {/* Graph Canvas */}
      <div className="flex-1 relative bg-[#07020b] overflow-hidden">
        <div
          ref={containerRef}
          className="w-full h-full"
          style={{
            background:
              "radial-gradient(circle at center, rgba(139, 92, 246, 0.05) 0%, rgba(7, 2, 11, 1) 100%)",
          }}
        />
      </div>

      {/* Help Panel */}
      <HelpPanel isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* Settings Panel */}
      <GraphSettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        selectedEdgeTypes={selectedEdgeTypes}
        setSelectedEdgeTypes={setSelectedEdgeTypes}
      />
    </div>
  );
}
