import type { MetadataRoute } from "next";
import { getChampions } from "@/server/repositories/championsRepository";
import { getChaosLabCreators } from "@/server/repositories/chaosLabRepository";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://mayhemgg.com").replace(/\/$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = ["", "/champions", "/tier-list", "/broken-builds", "/augments", "/chaos-lab"];
  const now = new Date();
  const [champions, chaosCreators] = await Promise.all([
    getChampions(),
    getChaosLabCreators()
  ]);

  const staticEntries = staticRoutes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.8
  })) satisfies MetadataRoute.Sitemap;

  const championEntries = champions.map((champion) => ({
    url: `${siteUrl}/champions/${champion.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7
  })) satisfies MetadataRoute.Sitemap;

  const chaosCreatorEntries = chaosCreators.map((creator) => ({
    url: `${siteUrl}/chaos-lab/creator/${creator.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6
  })) satisfies MetadataRoute.Sitemap;

  return [...staticEntries, ...championEntries, ...chaosCreatorEntries];
}
