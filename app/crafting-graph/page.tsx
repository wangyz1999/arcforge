"use client";

import { useEffect, useRef, useState, useMemo, Suspense, useCallback } from "react";
import cytoscape from "cytoscape";
import { useSearchParams, useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCog, faQuestionCircle } from "@fortawesome/free-solid-svg-icons";
import itemsRelationData from "../../data/items_relation.json";
import Header from "../components/Header";
import LoadingState from "../components/graph/LoadingState";
import ErrorState from "../components/graph/ErrorState";
import GraphSettingsPanel from "../components/graph/GraphSettingsPanel";
import HelpPanel from "../components/graph/HelpPanel";
import QuickSearchBar from "../components/graph/QuickSearchBar";
import { ItemData } from "../types/graph";
import { cytoscapeStyles } from "../config/cytoscapeStyles";
import { buildGraphElements, buildLayoutPositions } from "../utils/graphHelpers";
import { useTranslation } from "../i18n";

function CraftingTreeContent() {
  const { t, tItem } = useTranslation();
  const cyRef = useRef<cytoscape.Core | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef<string | null>(null); // Track which item has been animated
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Track resize timeout
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const itemName = searchParams.get("item") || "Power Rod";

  // Compute edge types from URL or default to all types
  const selectedEdgeTypes = useMemo(() => {
    const filterParam = searchParams.get("filters");
    if (filterParam !== null) {
      // If filters param exists (even if empty), use it
      return filterParam === ""
        ? new Set<string>()
        : new Set(filterParam.split(",").filter((f) => f));
    }
    // Default to all types if no filters param
    return new Set<string>(["craft", "repair", "recycle", "salvage", "upgrade", "trade"]);
  }, [searchParams]);

  // Custom setter that also updates the URL
  const updateSelectedEdgeTypes = (newTypes: Set<string>) => {
    // Update URL with new filters
    const filterParam = Array.from(newTypes).join(",");
    router.push(`/crafting-graph?item=${encodeURIComponent(itemName)}&filters=${filterParam}`, {
      scroll: false,
    });
  };

  // Find the selected item and build item lookup
  const { selectedItem, itemsLookup } = useMemo(() => {
    const lookup = new Map<string, ItemData>();
    (itemsRelationData as ItemData[]).forEach((item) => {
      lookup.set(item.name, item);
    });
    const selected = lookup.get(itemName);
    return { selectedItem: selected, itemsLookup: lookup };
  }, [itemName]);

  // Memoize translation functions to prevent unnecessary re-renders
  const translateItem = useCallback((name: string) => tItem(name), [tItem]);
  const translateRelation = useCallback((key: string) => t(key), [t]);

  useEffect(() => {
    if (!containerRef.current) {
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
        // Enable interactivity
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

    // Add resize listener
    window.addEventListener("resize", handleResize);

    // Force a resize and fit after a short delay to ensure container is sized
    setTimeout(() => {
      if (cyRef.current) {
        cyRef.current.resize();
        cyRef.current.fit(undefined, 150);

        // Only animate if this item hasn't been animated yet
        const shouldAnimate = hasAnimated.current !== itemName;

        if (shouldAnimate) {
          hasAnimated.current = itemName;

          const centerNode = cyRef.current.$('[type="center"]');
          const currentZoom = cyRef.current.zoom();

          // Calculate zoom needed to make center node properly visible
          const containerHeight = cyRef.current.height();
          const centerNodeHeight = 250;
          const targetNodeScreenHeight = containerHeight * 0.22;
          const targetZoom = targetNodeScreenHeight / centerNodeHeight;

          // Zoom in if current zoom is significantly smaller than target (many nodes)
          if (currentZoom < targetZoom * 0.8) {
            const finalZoom = Math.max(currentZoom * 1.5, targetZoom);

            cyRef.current.animate(
              {
                zoom: finalZoom,
                center: {
                  eles: centerNode,
                },
              },
              {
                duration: 1300,
                easing: "ease-out-cubic",
              },
            );
          } else {
            // Graph is already big (few nodes), do a slight zoom out for dynamic feel
            const finalZoom = currentZoom * 0.85;

            cyRef.current.animate(
              {
                zoom: finalZoom,
                center: {
                  eles: centerNode,
                },
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

    // Handle node clicks - navigate to item if not center node
    cy.on("tap", "node", (event) => {
      const node = event.target;
      const nodeData = node.data();

      if (nodeData.type !== "center" && nodeData.itemName) {
        // Navigate to the clicked item with current filters (use original itemName for navigation)
        const filterParam = Array.from(selectedEdgeTypes).join(",");
        router.push(
          `/crafting-graph?item=${encodeURIComponent(nodeData.itemName)}&filters=${filterParam}`,
          { scroll: false },
        );
      }
    });

    return () => {
      // Remove resize listener and clear timeout
      window.removeEventListener("resize", handleResize);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }

      if (cyRef.current) {
        cyRef.current.destroy();
      }
    };
  }, [itemName, itemsLookup, selectedEdgeTypes, router, translateItem, translateRelation]);

  if (!selectedItem) {
    return <ErrorState itemName={itemName} />;
  }

  return (
    <div className="h-screen bg-[#07020b] text-gray-100 flex flex-col overflow-hidden">
      {/* Header */}
      <Header activePage="database" />

      {/* Help Button */}
      <button
        onClick={() => setIsHelpOpen(true)}
        className="fixed bottom-28 right-8 z-30 w-14 h-14 flex items-center justify-center bg-gradient-to-br from-blue-500/30 to-cyan-500/20 backdrop-blur-xl rounded-full shadow-2xl hover:from-blue-500/40 hover:to-cyan-500/30 transition-all duration-300 border border-white/20 hover:border-white/30 hover:shadow-blue-500/50 hover:scale-105"
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
        className="fixed bottom-8 right-8 z-30 w-14 h-14 flex items-center justify-center bg-gradient-to-br from-purple-500/30 to-pink-500/20 backdrop-blur-xl rounded-full shadow-2xl hover:from-purple-500/40 hover:to-pink-500/30 transition-all duration-300 border border-white/20 hover:border-white/30 hover:shadow-purple-500/50 hover:scale-105"
        aria-label={t("buttons.openRelationFilters")}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-full pointer-events-none"></div>
        <FontAwesomeIcon icon={faCog} className="text-white text-xl relative z-10 drop-shadow-lg" />
      </button>

      {/* Graph Canvas */}
      <div className="flex-1 relative bg-[#07020b] overflow-hidden">
        {/* Quick Search Bar */}
        <QuickSearchBar selectedEdgeTypes={selectedEdgeTypes} />

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
        setSelectedEdgeTypes={updateSelectedEdgeTypes}
      />
    </div>
  );
}

export default function CraftingTree() {
  return (
    <Suspense fallback={<LoadingState />}>
      <CraftingTreeContent />
    </Suspense>
  );
}
