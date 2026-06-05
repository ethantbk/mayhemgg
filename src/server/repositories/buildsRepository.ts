import "server-only";

import { getBrokenBuilds as getMockBrokenBuilds } from "@/lib/data";
import type { Mode } from "@/types";
import { dbModeToMode, getAugmentSlugsForBuild, mapDbBuild, type BuildRelationMaps } from "@/server/repositories/mappers";
import { mapDatasetToChampions } from "@/server/repositories/championsRepository";
import { loadPublishedDataset } from "@/server/repositories/publishedDataset";
import type { BrokenBuildEntry } from "@/server/repositories/types";

function groupBy<T>(rows: T[], getKey: (row: T) => string) {
  const grouped = new Map<string, T[]>();

  rows.forEach((row) => {
    const key = getKey(row);
    const current = grouped.get(key) ?? [];
    current.push(row);
    grouped.set(key, current);
  });

  return grouped;
}

export async function getBrokenBuilds(mode?: Mode): Promise<BrokenBuildEntry[]> {
  const dataset = await loadPublishedDataset();

  if (!dataset) {
    return getMockBrokenBuilds(mode);
  }

  const champions = mapDatasetToChampions(dataset);
  const championsBySlug = new Map(champions.map((champion) => [champion.slug, champion]));
  const dbChampionsById = new Map(dataset.champions.map((champion) => [champion.id, champion]));
  const arenaStatsByChampionId = new Map(dataset.arenaStats.map((stat) => [stat.championId, stat]));
  const aramStatsByChampionId = new Map(dataset.aramMayhemStats.map((stat) => [stat.championId, stat]));
  const buildMaps: BuildRelationMaps = {
    buildItemsByBuildId: groupBy(dataset.buildItems, (buildItem) => buildItem.buildId),
    buildAugmentsByBuildId: groupBy(dataset.buildAugments, (buildAugment) => buildAugment.buildId),
    itemsById: new Map(dataset.items.map((item) => [item.id, item])),
    augmentsById: new Map(dataset.augments.map((augment) => [augment.id, augment]))
  };

  const brokenBuilds = dataset.builds
    .filter((build) => build.kind === "broken")
    .map((build) => {
      const dbChampion = dbChampionsById.get(build.championId);
      const champion = dbChampion ? championsBySlug.get(dbChampion.slug) : undefined;
      const mappedBuild = mapDbBuild(build, buildMaps);
      const entryMode = dbModeToMode(build.mode);
      const stats = entryMode === "arena"
        ? arenaStatsByChampionId.get(build.championId)
        : aramStatsByChampionId.get(build.championId);

      if (!champion || !mappedBuild || !stats) {
        return null;
      }

      return {
        champion,
        mode: entryMode,
        build: mappedBuild,
        augments: getAugmentSlugsForBuild(build.id, buildMaps),
        winRate: build.winRate ?? stats.winRate
      } satisfies BrokenBuildEntry;
    })
    .filter((entry): entry is BrokenBuildEntry => Boolean(entry))
    .filter((entry) => (mode ? entry.mode === mode : true))
    .sort((a, b) => (b.build.brokenScore ?? 0) - (a.build.brokenScore ?? 0));

  return brokenBuilds.length ? brokenBuilds : getMockBrokenBuilds(mode);
}

export async function getBuildsByChampion(championSlug: string, mode?: Mode): Promise<BrokenBuildEntry[]> {
  const builds = await getBrokenBuilds(mode);
  return builds.filter((entry) => entry.champion.slug === championSlug);
}
