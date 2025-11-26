import { Edge, ItemData } from '../types/graph';

// Edge type priority order (lower number = higher priority)
const EDGE_TYPE_PRIORITY: { [key: string]: number } = {
  'craft': 0,
  'repair': 1,
  'upgrade': 2,
  'recycle': 3,
  'salvage': 4,
  'sold_by': 5,
  'trader': 5, // Same as sold_by
};

// Helper function to clean relation names
export const cleanRelationName = (relation: string): string => {
  return relation.replace(/_from$|_to$/g, '');
};

// Helper function to get edge type priority
export const getEdgePriority = (edge: Edge): number => {
  const cleanedRelation = cleanRelationName(edge.relation);
  return EDGE_TYPE_PRIORITY[cleanedRelation] ?? 999; // Unknown types go last
};

// Helper function to format edge label with level, quantity, and price
export const formatEdgeLabel = (edge: Edge): string => {
  const relation = cleanRelationName(edge.relation);
  const quantity = edge.quantity && edge.quantity > 1 ? `${edge.quantity}x` : '';
  const levelInfo = edge.input_level || edge.output_level || '';
  
  // Extract price info from dependency for trader edges
  let priceInfo = '';
  if (edge.relation === 'trader' || edge.relation === 'sold_by') {
    const priceDep = edge.dependency?.find(d => d.type === 'price');
    if (priceDep) {
      const amount = priceDep.amount;
      const currency = priceDep.currency;
      priceInfo = `${amount} ${currency}`;
    }
  }
  
  // Build label
  const parts = [relation];
  if (quantity) parts.push(`(${quantity})`);
  if (priceInfo) parts.push(`[${priceInfo}]`);
  else if (levelInfo) parts.push(`[${levelInfo}]`);
  
  return parts.join(' ');
};

// Build graph elements from item data
export const buildGraphElements = (
  currentItem: ItemData,
  itemsLookup: Map<string, ItemData>,
  selectedEdgeTypes?: Set<string>
) => {
  const elements: any[] = [];
  const CURVATURE = 90;
  
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
    
    // Map both 'trader' and 'sold_by' to the 'sold_by' filter
    if (cleanedRelation === 'trader' || cleanedRelation === 'sold_by') {
      return selectedEdgeTypes.has('sold_by');
    }
    
    return selectedEdgeTypes.has(cleanedRelation);
  };
  
  // Center node - Selected item
  const centerId = `center-${currentItem.name}`;
  const centerImageUrl = currentItem.image_urls?.thumb 
    ? `/api/proxy-image?url=${encodeURIComponent(currentItem.image_urls.thumb)}`
    : '';
  elements.push({
    data: {
      id: centerId,
      label: currentItem.name,
      type: 'center',
      nodeType: currentItem.node_type || 'item',
      rarity: currentItem.infobox?.rarity,
      imageUrl: centerImageUrl,
    }
  });

  // Group edges by item name and direction, filtering by selected edge types
  const leftGrouped = new Map<string, Edge[]>();
  const rightGrouped = new Map<string, Edge[]>();
  
  currentItem.edges.forEach(edge => {
    // Skip edges that don't match the filter
    if (!shouldIncludeEdge(edge.relation)) {
      return;
    }
    
    if (edge.direction === 'in') {
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
      : '';
    
    elements.push({
      data: {
        id: nodeId,
        label: itemName,
        type: 'input',
        nodeType: relatedItem?.node_type || 'item',
        rarity: relatedItem?.infobox?.rarity,
        imageUrl: imageUrl,
        itemName: itemName,
      }
    });

    // Create edge from left to center with combined labels
    const edgeLabels = edges.map(formatEdgeLabel).join('\n');
    
    // Calculate curvature
    const curvature = leftIsEven 
      ? (leftIdx < leftMiddle ? -CURVATURE : CURVATURE)
      : (leftIdx < Math.floor(leftMiddle) ? -CURVATURE : leftIdx > Math.floor(leftMiddle) ? CURVATURE : 0);
    
    elements.push({
      data: {
        source: nodeId,
        target: centerId,
        label: edgeLabels,
        relation: edges.map(e => cleanRelationName(e.relation)).join(','),
        curvature: curvature,
      }
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
      : '';
    
    elements.push({
      data: {
        id: nodeId,
        label: itemName,
        type: 'output',
        nodeType: relatedItem?.node_type || 'item',
        rarity: relatedItem?.infobox?.rarity,
        imageUrl: imageUrl,
        itemName: itemName,
      }
    });

    // Create edge from center to right with combined labels
    const edgeLabels = edges.map(formatEdgeLabel).join('\n');
    
    // Calculate curvature
    const curvature = rightIsEven 
      ? (rightIdx < rightMiddle ? CURVATURE : -CURVATURE)
      : (rightIdx < Math.floor(rightMiddle) ? CURVATURE : rightIdx > Math.floor(rightMiddle) ? -CURVATURE : 0);
    
    elements.push({
      data: {
        source: centerId,
        target: nodeId,
        label: edgeLabels,
        relation: edges.map(e => cleanRelationName(e.relation)).join(','),
        curvature: curvature,
      }
    });
    rightIdx++;
  });

  return { elements, leftGrouped: new Map(sortedLeftEntries), rightGrouped: new Map(sortedRightEntries) };
};

// Build layout positions function
export const buildLayoutPositions = (
  elements: any[],
  leftGrouped: Map<string, Edge[]>,
  rightGrouped: Map<string, Edge[]>
) => {
  return (node: any) => {
    const nodeId = node.id();
    const nodeType = node.data('type');
    
    const leftX = 250;
    const centerX = 700;
    const rightX = 1150;
    const centerY = 400;
    const spacing = 180;
    
    // Center node
    if (nodeType === 'center') {
      return { x: centerX, y: centerY };
    }
    
    // Left nodes (inputs)
    if (nodeType === 'input') {
      const leftNodeIndex = elements.filter(el => el.data?.type === 'input').findIndex(el => el.data.id === nodeId);
      const totalLeftNodes = leftGrouped.size;
      const startY = centerY - ((totalLeftNodes - 1) * spacing) / 2;
      return { x: leftX, y: startY + leftNodeIndex * spacing };
    }
    
    // Right nodes (outputs)
    if (nodeType === 'output') {
      const rightNodeIndex = elements.filter(el => el.data?.type === 'output').findIndex(el => el.data.id === nodeId);
      const totalRightNodes = rightGrouped.size;
      const startY = centerY - ((totalRightNodes - 1) * spacing) / 2;
      return { x: rightX, y: startY + rightNodeIndex * spacing };
    }
    
    return { x: 0, y: 0 };
  };
};

