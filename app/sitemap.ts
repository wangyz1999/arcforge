import { MetadataRoute } from "next";
import itemsRelationData from "../data/items_relation.json";
import type { ItemData } from "./types/graph";
import dataStatus from "../data/data_status.json";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://arcforge.org";
  const currentDate = new Date(dataStatus.checked_at);

  // Base routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 1.0,
    },
  ];

  // Add crafting graph routes for items with relationships
  const craftingGraphRoutes = (itemsRelationData as ItemData[])
    .filter((item) => item.edges && item.edges.length > 0)
    .map((item) => ({
      url: `${baseUrl}/?graph=${encodeURIComponent(item.name)}`,
      lastModified: currentDate,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

  routes.push(...craftingGraphRoutes);

  return routes;
}
