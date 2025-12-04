"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import cytoscape from "cytoscape";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCog, faQuestionCircle, faTimes } from "@fortawesome/free-solid-svg-icons";
import itemsRelationData from "../../../data/items_relation.json";
import GraphSettingsPanel from "./GraphSettingsPanel";
import HelpPanel from "./HelpPanel";
import QuickSearchBar from "./QuickSearchBar";
import { ItemData } from "../../types/graph";
import { cytoscapeStyles } from "../../config/cytoscapeStyles";
import { buildGraphElements, buildLayoutPositions } from "../../utils/graphHelpers";
import { useTranslation } from "../../i18n";

interface CraftingGraphModalProps {
  itemName: string;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToItem?: (itemName: string) => void;
}

export default function CraftingGraphModal({
  itemName,
  isOpen,
  onClose,
  onNavigateToItem,
}: CraftingGraphModalProps) {
  const { t, tItem } = useTranslation();
  const cyRef = useRef<cytoscape.Core | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef<string | null>(null);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [currentItemName, setCurrentItemName] = useState(itemName);

  // Default to all edge types selected
  const [selectedEdgeTypes, setSelectedEdgeTypes] = useState<Set<string>>(
    new Set(["craft", "repair", "recycle", "salvage", "upgrade", "trade"]),
  );

  // Update current item when prop changes
  useEffect(() => {
    setCurrentItemName(itemName);
  }, [itemName]);

  // Find the selected item and build item lookup
  const { selectedItem, itemsLookup } = useMemo(() => {
    const lookup = new Map<string, ItemData>();
    (itemsRelationData as ItemData[]).forEach((item) => {
      lookup.set(item.name, item);
    });
    const selected = lookup.get(currentItemName);
    return { selectedItem: selected, itemsLookup: lookup };
  }, [currentItemName]);

  // Memoize translation functions
  const translateItem = useCallback((name: string) => tItem(name), [tItem]);
  const translateRelation = useCallback((key: string) => t(key), [t]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Initialize cytoscape when modal opens
  useEffect(() => {
    if (!isOpen || !containerRef.current || !selectedItem) {
      return;
    }

    // Build graph elements
    const { elements, leftGrouped, rightGrouped } = buildGraphElements(
      selectedItem,
      itemsLookup,
      selectedEdgeTypes,
      translateItem,
      translateRelation,
    );

    let cy: cytoscape.Core;
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

    // Window resize handler
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

    // Initial fit and animation
    setTimeout(() => {
      if (cyRef.current) {
        cyRef.current.resize();
        cyRef.current.fit(undefined, 150);

        const shouldAnimate = hasAnimated.current !== currentItemName;

        if (shouldAnimate) {
          hasAnimated.current = currentItemName;

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
              {
                duration: 1300,
                easing: "ease-out-cubic",
              },
            );
          } else {
            const finalZoom = currentZoom * 0.85;
            cyRef.current.animate(
              {
                zoom: finalZoom,
                center: { eles: centerNode },
              },
              {
                duration: 1300,
                easing: "ease-out-cubic",
              },
            );
          }
        }
      }
    }, 100);

    // Handle node clicks - navigate within modal
    cy.on("tap", "node", (event) => {
      const node = event.target;
      const nodeData = node.data();

      if (nodeData.type !== "center" && nodeData.itemName) {
        // Navigate to the clicked item within the modal
        hasAnimated.current = null; // Reset animation for new item
        setCurrentItemName(nodeData.itemName);

        // Also notify parent if callback provided
        if (onNavigateToItem) {
          onNavigateToItem(nodeData.itemName);
        }
      }
    });

    return () => {
      window.removeEventListener("resize", handleResize);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [
    isOpen,
    currentItemName,
    selectedItem,
    itemsLookup,
    selectedEdgeTypes,
    translateItem,
    translateRelation,
    onNavigateToItem,
  ]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 z-[60] backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-4 md:inset-8 lg:inset-12 bg-[#07020b] z-[70] rounded-2xl border border-purple-500/40 shadow-2xl shadow-purple-500/20 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-black/40 border-b border-purple-500/30">
          <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-blue-300">
            {t("item.craftingGraph")}: {tItem(currentItemName)}
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-black/60 hover:bg-red-500/30 backdrop-blur-sm rounded-lg transition-all duration-300 text-gray-400 hover:text-red-300 border border-purple-500/20 hover:border-red-500/50"
            aria-label={t("buttons.close")}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Graph Canvas */}
        <div className="flex-1 relative overflow-hidden">
          {/* Quick Search Bar */}
          <div className="absolute top-4 right-4 z-20 w-64 md:w-80">
            <QuickSearchBarModal
              selectedEdgeTypes={selectedEdgeTypes}
              onItemSelect={(name) => {
                hasAnimated.current = null;
                setCurrentItemName(name);
              }}
            />
          </div>

          {/* Help Button */}
          <button
            onClick={() => setIsHelpOpen(true)}
            className="absolute bottom-20 right-4 z-20 w-12 h-12 flex items-center justify-center bg-gradient-to-br from-blue-500/30 to-cyan-500/20 backdrop-blur-xl rounded-full shadow-xl hover:from-blue-500/40 hover:to-cyan-500/30 transition-all duration-300 border border-white/20 hover:border-white/30"
            aria-label={t("buttons.openHelp")}
          >
            <FontAwesomeIcon icon={faQuestionCircle} className="text-white text-lg" />
          </button>

          {/* Settings Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="absolute bottom-4 right-4 z-20 w-12 h-12 flex items-center justify-center bg-gradient-to-br from-purple-500/30 to-pink-500/20 backdrop-blur-xl rounded-full shadow-xl hover:from-purple-500/40 hover:to-pink-500/30 transition-all duration-300 border border-white/20 hover:border-white/30"
            aria-label={t("buttons.openRelationFilters")}
          >
            <FontAwesomeIcon icon={faCog} className="text-white text-lg" />
          </button>

          <div
            ref={containerRef}
            className="w-full h-full"
            style={{
              background:
                "radial-gradient(circle at center, rgba(139, 92, 246, 0.05) 0%, rgba(7, 2, 11, 1) 100%)",
            }}
          />

          {/* Error state if item not found */}
          {!selectedItem && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-400 text-lg mb-2">{t("error.itemNotFound")}</p>
                <p className="text-gray-500">
                  {currentItemName} {t("error.couldNotBeFound")}
                </p>
              </div>
            </div>
          )}
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
    </>
  );
}

// Simplified QuickSearchBar for modal use (no router navigation)
function QuickSearchBarModal({
  selectedEdgeTypes,
  onItemSelect,
}: {
  selectedEdgeTypes: Set<string>;
  onItemSelect: (name: string) => void;
}) {
  const { t, tItem, language } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Get all item names for search
  const allItemNames = useMemo(() => {
    return (itemsRelationData as ItemData[]).map((item) => item.name);
  }, []);

  // Filter items based on search query
  const filteredSearchItems = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return allItemNames
      .filter((name) => {
        const translatedName = tItem(name);
        return name.toLowerCase().includes(query) || translatedName.toLowerCase().includes(query);
      })
      .slice(0, 10);
  }, [searchQuery, allItemNames, tItem]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchItemSelect = (name: string) => {
    onItemSelect(name);
    setSearchQuery("");
    setIsSearchFocused(false);
  };

  return (
    <div ref={searchContainerRef} className="relative">
      <div className="relative flex items-center">
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsSearchFocused(true)}
          placeholder={t("search.placeholder")}
          className="w-full pl-4 pr-4 py-2 bg-black/60 backdrop-blur-xl border border-white/20 rounded-lg text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all"
        />
      </div>

      {/* Search Dropdown */}
      {isSearchFocused && filteredSearchItems.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-black/90 backdrop-blur-xl border border-white/20 rounded-lg overflow-hidden shadow-xl max-h-64 overflow-y-auto z-30">
          {filteredSearchItems.map((name) => (
            <button
              key={name}
              onClick={() => handleSearchItemSelect(name)}
              className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-purple-500/30 transition-colors"
            >
              {tItem(name)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
