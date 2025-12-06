"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import cytoscape from "cytoscape";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCog, faQuestionCircle, faTimes } from "@fortawesome/free-solid-svg-icons";
import itemsRelationData from "../../../data/items_relation.json";
import GraphSettingsPanel from "./GraphSettingsPanel";
import HelpPanel from "./HelpPanel";
import { ItemData } from "../../types/graph";
import { cytoscapeStyles } from "../../config/cytoscapeStyles";
import { buildGraphElements, buildLayoutPositions } from "../../utils/graphHelpers";
import { useTranslation } from "../../i18n";
import ErrorState from "./ErrorState";

interface CraftingGraphModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemName: string;
  onItemChange: (itemName: string) => void;
}

export default function CraftingGraphModal({
  isOpen,
  onClose,
  itemName,
  onItemChange,
}: CraftingGraphModalProps) {
  const { t, tItem } = useTranslation();
  const cyRef = useRef<cytoscape.Core | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef<string | null>(null);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

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

  useEffect(() => {
    if (!isOpen || !containerRef.current) {
      return;
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

    let cy;
    try {
      cy = cytoscape({
        container: containerRef.current,
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
      });
    } catch (error) {
      console.error("Error initializing Cytoscape:", error);
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
          cyRef.current.fit(undefined, 120);
        }
      }, 150);
    };

    window.addEventListener("resize", handleResize);

    // Force a resize and fit after a short delay
    setTimeout(() => {
      if (cyRef.current) {
        cyRef.current.resize();
        cyRef.current.fit(undefined, 150);

        const shouldAnimate = hasAnimated.current !== itemName;

        if (shouldAnimate) {
          hasAnimated.current = itemName;

          const centerNode = cyRef.current.$('[type="center"]');
          const currentZoom = cyRef.current.zoom();

          const containerHeight = cyRef.current.height();
          const centerNodeHeight = 250;
          const targetNodeScreenHeight = containerHeight * 0.22;
          const targetZoom = targetNodeScreenHeight / centerNodeHeight;

          if (currentZoom < targetZoom * 0.8) {
            const finalZoom = Math.max(currentZoom * 1.5, targetZoom);

            cyRef.current.animate(
              {
                zoom: finalZoom,
                center: { eles: centerNode },
              },
              { duration: 1300, easing: "ease-out-cubic" },
            );
          } else {
            const finalZoom = currentZoom * 0.85;

            cyRef.current.animate(
              {
                zoom: finalZoom,
                center: { eles: centerNode },
              },
              { duration: 1300, easing: "ease-out-cubic" },
            );
          }
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

      if (cyRef.current) {
        cyRef.current.destroy();
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

  // Reset animation tracking when item changes
  useEffect(() => {
    if (isOpen) {
      hasAnimated.current = null;
    }
  }, [itemName, isOpen]);

  if (!isOpen) return null;

  if (!selectedItem) {
    return (
      /* Modal Container - positioned below header using margin-top */
      <div className="fixed inset-0 z-30 mt-16 sm:mt-20 md:mt-24 flex flex-col bg-[#07020b]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 w-12 h-12 flex items-center justify-center bg-gradient-to-br from-red-500/30 to-pink-500/20 backdrop-blur-xl rounded-full shadow-2xl hover:from-red-500/40 hover:to-pink-500/30 transition-all duration-300 border border-white/20 hover:border-white/30 hover:scale-105"
          aria-label={t("buttons.close")}
        >
          <FontAwesomeIcon icon={faTimes} className="text-white text-xl" />
        </button>
        <ErrorState itemName={itemName} />
      </div>
    );
  }

  return (
    /* Modal Container - positioned below header using margin-top matching header heights */
    <div className="fixed inset-0 z-30 mt-16 sm:mt-20 md:mt-24 flex flex-col bg-[#07020b] text-gray-100 overflow-hidden">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-30 w-12 h-12 flex items-center justify-center bg-gradient-to-br from-red-500/30 to-pink-500/20 backdrop-blur-xl rounded-full shadow-2xl hover:from-red-500/40 hover:to-pink-500/30 transition-all duration-300 border border-white/20 hover:border-white/30 hover:scale-105"
        aria-label={t("buttons.close")}
      >
        <FontAwesomeIcon icon={faTimes} className="text-white text-xl" />
      </button>

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
