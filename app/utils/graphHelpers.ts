import type { Edge, ItemData } from "../types/graph";

// Edge type priority order (lower number = higher priority)
const EDGE_TYPE_PRIORITY: { [key: string]: number } = {
  craft: 0,
  repair: 1,
  upgrade: 2,
  recycle: 3,
  salvage: 4,
  trade: 5,
};

// Helper function to clean relation names
export const cleanRelationName = (relation: string): string => {
  const name = relation.replace(/_from$|_to$/g, "");
  return name === "trader" || name === "sold_by" ? "trade" : name;
};

// Helper function to get edge type priority
export const getEdgePriority = (edge: Edge): number => {
  const cleanedRelation = cleanRelationName(edge.relation);
  return EDGE_TYPE_PRIORITY[cleanedRelation] ?? 999; // Unknown types go last
};

// Shared by the graph and table so prices, levels and requirements read identically.
export const formatRelationDetail = (
  edge: Edge,
  translateRelation?: (key: string) => string,
  translateItem?: (name: string) => string,
  currentItemName?: string,
): string => {
  const tItem = translateItem ?? ((name: string) => name);
  if (cleanRelationName(edge.relation) === "trade") {
    const price = edge.dependency?.find((d) => d.type === "price");
    return price?.amount != null && typeof price.currency === "string"
      ? `${price.amount} ${tItem(price.currency)}`
      : "";
  }

  const upgrade = edge.dependency?.find((d) => d.type === "upgrade_level");
  const level = String(upgrade?.name ?? edge.input_level ?? edge.output_level ?? "");
  // The item names already appear on the cards; preserve only meaningful variants.
  const levelText = level === edge.name || level === currentItemName ? "" : tItem(level);
  const requirements = (edge.dependency ?? []).flatMap((d) => {
    if ((d.type === "workshop" || d.type === "skill") && typeof d.name === "string")
      return [tItem(d.name)];
    if (d.type === "blueprint")
      return [translateRelation?.("item.blueprintRequired") ?? "Blueprint required"];
    if (d.type === "output_quantity" && d.value != null)
      return [`${translateRelation?.("item.batchOutput") ?? "Batch output"}: ×${d.value}`];
    return [];
  });
  return [...new Set([levelText.replace(/\s*->\s*/g, " → "), ...requirements])]
    .filter(Boolean)
    .join(" · ");
};

export const formatEdgeQuantity = (edge: Edge): string =>
  edge.quantity == null || (cleanRelationName(edge.relation) === "trade" && edge.quantity === 1)
    ? ""
    : `×${edge.quantity}`;

export const formatEdgeLabel = (
  edge: Edge,
  translateRelation?: (key: string) => string,
  translateItem?: (name: string) => string,
  currentItemName?: string,
): string => {
  const relation = cleanRelationName(edge.relation);
  return [
    translateRelation?.(`graph.${relation}`) ?? relation,
    formatEdgeQuantity(edge),
    formatRelationDetail(edge, translateRelation, translateItem, currentItemName),
  ]
    .filter(Boolean)
    .join(" · ");
};

// Print the action once per group, retaining distinct quantities and recipe requirements.
const formatGroupedLabels = (
  edges: Edge[],
  translateRelation?: (key: string) => string,
  translateItem?: (name: string) => string,
  currentItemName?: string,
  isTrader = false,
) => {
  const groups = new Map<string, Set<string>>();
  for (const edge of edges) {
    const relation = cleanRelationName(edge.relation);
    const title =
      isTrader && relation === "trade"
        ? ""
        : (translateRelation?.(`graph.${relation}`) ?? relation);
    const details = [
      formatEdgeQuantity(edge),
      formatRelationDetail(edge, translateRelation, translateItem, currentItemName),
    ]
      .filter(Boolean)
      .join(" · ");
    if (!groups.has(title)) groups.set(title, new Set());
    groups.get(title)!.add(details);
  }
  return Array.from(groups, ([title, details]) =>
    [title, ...Array.from(details)].filter(Boolean).join("\n"),
  ).join("\n\n");
};

// Shape of elements we build for Cytoscape
interface GraphElementData {
  id?: string;
  label?: string;
  type?: "center" | "input" | "output" | "label";
  attachedTo?: string;
  nodeType?: string;
  rarity?: string;
  imageUrl?: string;
  itemName?: string;
  source?: string;
  target?: string;
  relation?: string;
  curvature?: number;
  isMissing?: boolean;
}

interface GraphElement {
  data?: GraphElementData;
}

// Build graph elements from item data
// Now accepts optional translation function for item names
export const buildGraphElements = (
  currentItem: ItemData,
  itemsLookup: Map<string, ItemData>,
  selectedEdgeTypes?: Set<string>,
  translateItem?: (name: string) => string,
  translateRelation?: (key: string) => string,
) => {
  const elements: GraphElement[] = [];
  const CURVATURE = 90;

  // Helper to translate item name
  const tItem = (name: string) => (translateItem ? translateItem(name) : name);

  // Helper to check if an edge should be included
  const shouldIncludeEdge = (relation: string): boolean => {
    if (!selectedEdgeTypes) {
      return true; // If no filter set provided, show all
    }

    if (selectedEdgeTypes.size === 0) {
      return false; // If explicitly no filters selected, show no edges (only center node)
    }

    // Check if the relation matches any selected type
    // Relations can be: craft_from, craft_to, recycle_from, etc.
    const cleanedRelation = cleanRelationName(relation);

    return selectedEdgeTypes.has(cleanedRelation);
  };

  // Center node - Selected item
  const centerId = `center-${currentItem.name}`;
  const centerImageUrl = currentItem.image_urls?.thumb
    ? `/api/proxy-image?url=${encodeURIComponent(currentItem.image_urls.thumb)}`
    : "";
  elements.push({
    data: {
      id: centerId,
      label:
        currentItem.node_type === "trader"
          ? `${tItem(currentItem.name)}\n${translateRelation?.("graph.trade") ?? "Trade"}`
          : tItem(currentItem.name),
      type: "center",
      nodeType: currentItem.node_type || "item",
      rarity: currentItem.infobox?.rarity,
      imageUrl: centerImageUrl,
    },
  });

  // Group edges by item name and direction, filtering by selected edge types
  const leftGrouped = new Map<string, Edge[]>();
  const rightGrouped = new Map<string, Edge[]>();

  currentItem.edges.forEach((edge) => {
    // Skip edges that don't match the filter
    if (!shouldIncludeEdge(edge.relation)) {
      return;
    }

    if (edge.direction === "in") {
      if (!leftGrouped.has(edge.name)) {
        leftGrouped.set(edge.name, []);
      }
      leftGrouped.get(edge.name)!.push(edge);
    } else {
      if (!rightGrouped.has(edge.name)) {
        rightGrouped.set(edge.name, []);
      }
      rightGrouped.get(edge.name)!.push(edge);
    }
  });

  // Sort edges within each group by priority
  leftGrouped.forEach((edges) => {
    edges.sort((a, b) => getEdgePriority(a) - getEdgePriority(b));
  });
  rightGrouped.forEach((edges) => {
    edges.sort((a, b) => getEdgePriority(a) - getEdgePriority(b));
  });

  // Sort groups by the priority of their primary (first) edge type
  const sortedLeftEntries = Array.from(leftGrouped.entries()).sort((a, b) => {
    return getEdgePriority(a[1][0]) - getEdgePriority(b[1][0]);
  });
  const sortedRightEntries = Array.from(rightGrouped.entries()).sort((a, b) => {
    return getEdgePriority(a[1][0]) - getEdgePriority(b[1][0]);
  });

  // Create left nodes (inputs)
  let leftIdx = 0;
  const totalLeftNodes = sortedLeftEntries.length;
  const leftIsEven = totalLeftNodes % 2 === 0;
  const leftMiddle = totalLeftNodes / 2;

  sortedLeftEntries.forEach(([itemName, edges]) => {
    const nodeId = `left-${itemName}`;
    const relatedItem = itemsLookup.get(itemName);
    const imageUrl = relatedItem?.image_urls?.thumb
      ? `/api/proxy-image?url=${encodeURIComponent(relatedItem.image_urls.thumb)}`
      : "";

    // Determine if this is a missing item (not in lookup)
    const isMissing = !relatedItem;

    elements.push({
      data: {
        id: nodeId,
        label: tItem(itemName),
        type: "input",
        nodeType: relatedItem?.node_type || "item",
        rarity: isMissing ? "missing" : relatedItem?.infobox?.rarity || "Common",
        imageUrl: imageUrl,
        itemName: itemName, // Keep original name for navigation
        isMissing: isMissing,
      },
    });

    // Create edge from left to center with combined labels
    const edgeLabels = formatGroupedLabels(
      edges,
      translateRelation,
      translateItem,
      currentItem.name,
      currentItem.node_type === "trader",
    );

    elements.push({
      data: {
        id: `label-${nodeId}`,
        type: "label",
        attachedTo: nodeId,
        label: edgeLabels,
        relation: cleanRelationName(edges[0].relation),
      },
    });

    // Calculate curvature
    const curvature = leftIsEven
      ? leftIdx < leftMiddle
        ? -CURVATURE
        : CURVATURE
      : leftIdx < Math.floor(leftMiddle)
        ? -CURVATURE
        : leftIdx > Math.floor(leftMiddle)
          ? CURVATURE
          : 0;

    elements.push({
      data: {
        source: nodeId,
        target: centerId,
        relation: edges.map((e) => cleanRelationName(e.relation)).join(","),
        curvature: curvature,
      },
    });
    leftIdx++;
  });

  // Create right nodes (outputs)
  let rightIdx = 0;
  const totalRightNodes = sortedRightEntries.length;
  const rightIsEven = totalRightNodes % 2 === 0;
  const rightMiddle = totalRightNodes / 2;

  sortedRightEntries.forEach(([itemName, edges]) => {
    const nodeId = `right-${itemName}`;
    const relatedItem = itemsLookup.get(itemName);
    const imageUrl = relatedItem?.image_urls?.thumb
      ? `/api/proxy-image?url=${encodeURIComponent(relatedItem.image_urls.thumb)}`
      : "";

    // Determine if this is a missing item (not in lookup)
    const isMissing = !relatedItem;

    elements.push({
      data: {
        id: nodeId,
        label: tItem(itemName),
        type: "output",
        nodeType: relatedItem?.node_type || "item",
        rarity: isMissing ? "missing" : relatedItem?.infobox?.rarity || "Common",
        imageUrl: imageUrl,
        itemName: itemName, // Keep original name for navigation
        isMissing: isMissing,
      },
    });

    // Create edge from center to right with combined labels
    const edgeLabels = formatGroupedLabels(
      edges,
      translateRelation,
      translateItem,
      currentItem.name,
      currentItem.node_type === "trader",
    );

    elements.push({
      data: {
        id: `label-${nodeId}`,
        type: "label",
        attachedTo: nodeId,
        label: edgeLabels,
        relation: cleanRelationName(edges[0].relation),
      },
    });

    // Calculate curvature
    const curvature = rightIsEven
      ? rightIdx < rightMiddle
        ? CURVATURE
        : -CURVATURE
      : rightIdx < Math.floor(rightMiddle)
        ? CURVATURE
        : rightIdx > Math.floor(rightMiddle)
          ? -CURVATURE
          : 0;

    elements.push({
      data: {
        source: centerId,
        target: nodeId,
        relation: edges.map((e) => cleanRelationName(e.relation)).join(","),
        curvature: curvature,
      },
    });
    rightIdx++;
  });

  return {
    elements,
    leftGrouped: new Map(sortedLeftEntries),
    rightGrouped: new Map(sortedRightEntries),
  };
};

// Size each row from its rendered label, keeping long recipe groups clear of neighbors.
export const buildLayoutPositions = (
  elements: GraphElement[],
  leftGrouped: Map<string, Edge[]>,
  rightGrouped: Map<string, Edge[]>,
  labelHeights: Map<string, number> = new Map(),
) => {
  const positions = new Map<string, { x: number; y: number }>();
  const centerY = 400;
  for (const [side, groups, x] of [
    ["left", leftGrouped, 100],
    ["right", rightGrouped, 1300],
  ] as const) {
    const rows = Array.from(groups.keys(), (name) => {
      const id = `${side}-${name}`;
      return { id, height: Math.max(180, (labelHeights.get(`label-${id}`) ?? 0) + 48) };
    });
    let y = centerY - rows.reduce((sum, row) => sum + row.height, 0) / 2;
    for (const row of rows) {
      const rowY = y + row.height / 2;
      positions.set(row.id, { x, y: rowY });
      positions.set(`label-${row.id}`, { x: x + (side === "left" ? 210 : -210), y: rowY });
      y += row.height;
    }
  }
  for (const element of elements) {
    if (element.data?.type === "center" && element.data.id)
      positions.set(element.data.id, { x: 700, y: centerY });
  }
  return (node: { id: () => string }) => positions.get(node.id()) ?? { x: 700, y: centerY };
};
