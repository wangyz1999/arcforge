import { rarityColors } from "./rarityConfig";

interface DataElement {
  data: (key: string) => string | number | undefined;
}

export const cytoscapeStyles = [
  {
    selector: "node",
    style: {
      shape: "roundrectangle",
      "z-index-compare": "manual",
      "z-index": 10,
      "background-color": (ele: DataElement) => {
        const rarity = ele.data("rarity") as string | undefined;
        const bgColors: Record<string, string> = {
          Common: "#202229",
          Uncommon: "#142b25",
          Rare: "#14283d",
          Epic: "#30182e",
          Legendary: "#322b18",
          missing: "#202027",
        };
        if (!rarity) {
          return bgColors.Common;
        }
        return bgColors[rarity] ?? bgColors.Common;
      },
      "background-image": (ele: DataElement) => {
        const imageUrl = ele.data("imageUrl") as string | undefined;
        // Return "none" for empty/missing images to avoid Cytoscape warnings
        return imageUrl && imageUrl.length > 0 ? imageUrl : "none";
      },
      "background-fit": "contain",
      "background-clip": "node",
      "background-position-x": "50%",
      "background-position-y": "50%",
      padding: "12px",
      label: "data(label)",
      color: "#e2e8f0",
      "text-valign": "bottom",
      "text-halign": "center",
      "text-margin-y": 8,
      "font-size": "14px",
      "font-family": "system-ui, sans-serif",
      "font-weight": "bold",
      width: 100,
      height: 100,
      "border-width": 3,
      "border-color": (ele: DataElement) => {
        const rarity = ele.data("rarity") as string | undefined;
        if (!rarity) {
          return "#717471";
        }
        // Handle missing items with a distinct gray border
        if (rarity === "missing") {
          return "#555555";
        }
        const key = rarity as keyof typeof rarityColors;
        return rarityColors[key] ?? "#717471";
      },
      "text-wrap": "wrap",
      "text-max-width": 150,
      "text-background-color": "#07020b",
      "text-background-opacity": 1,
      "text-background-padding": 5,
    },
  },
  {
    selector: 'node[type="center"]',
    style: {
      "border-width": 5,
      width: 140,
      height: 140,
      "font-size": "17px",
      "font-weight": "bold",
      "text-margin-y": 10,
    },
  },
  {
    selector: 'node[type="input"]',
    style: {
      "border-width": 3,
    },
  },
  {
    selector: 'node[type="output"]',
    style: {
      "border-width": 3,
    },
  },
  {
    selector: 'node[nodeType="trader"]',
    style: {
      shape: "ellipse",
      "border-color": "#fbbf24",
      width: 120,
      height: 120,
      "background-color": "#322b18",
    },
  },
  {
    selector: 'node[nodeType="trader"][type="center"]',
    style: {
      width: 160,
      height: 160,
    },
  },
  // Style for missing items (not in database)
  {
    selector: 'node[isMissing="true"], node[rarity="missing"]',
    style: {
      "border-style": "dashed",
      "border-color": "#555555",
      opacity: 0.7,
    },
  },
  {
    selector: "edge",
    style: {
      width: 1.5,
      "z-index-compare": "manual",
      "z-index": 0,
      "line-opacity": 0.55,
      "line-color": "#6366f1",
      "target-arrow-shape": "none",
      "curve-style": "unbundled-bezier",
      "control-point-distances": (ele: DataElement) => {
        const curvatureRaw = ele.data("curvature");
        const curvature = typeof curvatureRaw === "number" ? curvatureRaw : 0;
        const dist = Math.abs(curvature) * 0.35;
        return curvature >= 0 ? `${dist} -${dist}` : `-${dist} ${dist}`;
      },
      "control-point-weights": "0.33 0.67",
      "edge-distances": "node-position",
      "source-endpoint": "90deg",
      "target-endpoint": "270deg",
      label: "",
    },
  },
  // Independent label nodes render after every connection, including crossing lines.
  {
    selector: 'node[type="label"]',
    style: {
      width: 1,
      height: 1,
      padding: 0,
      "background-opacity": 0,
      "background-image": "none",
      "border-width": 0,
      "z-index": 20,
      "text-valign": "center",
      "text-halign": "center",
      "text-margin-y": 0,
      "font-size": 13,
      "font-weight": "normal",
      "line-height": 1.5,
      "text-max-width": 220,
      "text-background-color": "#14121e",
      "text-background-opacity": 1,
      "text-background-padding": 12,
      "text-background-shape": "roundrectangle",
      "text-border-color": "#393345",
      "text-border-width": 1,
      "text-border-opacity": 1,
      events: "no",
    },
  },
  // Edge coloring by relation type
  {
    selector: 'edge[relation*="repair"]',
    style: {
      "line-color": "#ef4444",
    },
  },
  {
    selector: 'edge[relation*="upgrade"]',
    style: {
      "line-color": "#ec4899",
    },
  },
  {
    selector: 'edge[relation*="salvage"]',
    style: {
      "line-color": "#10b981",
    },
  },
  {
    selector: 'edge[relation*="recycle"]',
    style: {
      "line-color": "#34d399",
    },
  },
  {
    selector: 'edge[relation*="craft"]',
    style: {
      "line-color": "#60a5fa",
    },
  },
  {
    selector: 'edge[relation*="trader"], edge[relation*="sold_by"], edge[relation*="trade"]',
    style: {
      "line-color": "#fbbf24",
    },
  },
  {
    selector: ":selected",
    style: {
      "border-width": 6,
      "border-color": "#e879f9",
      "overlay-opacity": 0.3,
      "overlay-color": "#c084fc",
    },
  },
];
