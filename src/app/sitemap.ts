import type { MetadataRoute } from "next";
import { getAllChampions } from "@/lib/data";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://mayhemgg.com").replace(/\/$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/champions", "/tier-list", "/broken-builds", "/augments"];
  const now = new Date();

  const staticEntries = staticRoutes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.8
  })) satisfies MetadataRoute.Sitemap;

  const championEntries = getAllChampions().map((champion) => ({
    url: `${siteUrl}/champions/${champion.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7
  })) satisfies MetadataRoute.Sitemap;

  return [...staticEntries, ...championEntries];
}
