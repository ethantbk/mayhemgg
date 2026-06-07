import "server-only";

import { getBrokenBuilds as getMockBrokenBuilds } from "@/lib/data";
import type { Champion, Mode } from "@/types";
import { dbModeToMode, getAugmentSlugsForBuild, mapDbBuild, withBuildContentFallback, type BuildRelationMaps } from "@/server/repositories/mappers";
import { mapDatasetToChampions } from "@/server/repositories/championsRepository";
import { loadPublishedDataset, type PublishedDataset } from "@/server/repositories/publishedDataset";
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

function getStatBrokenBuilds({
  dataset,
  buildMaps,
  championsBySlug,
  dbChampionsById
}: {
  dataset: PublishedDataset;
  buildMaps: BuildRelationMaps;
  championsBySlug: Map<string, Champion>;
  dbChampionsById: Map<string, PublishedDataset["champions"][number]>;
}): BrokenBuildEntry[] {
  const buildsById = new Map(dataset.builds.map((build) => [build.id, build]));
  const statRows = [
    ...dataset.arenaStats.map((stat) => ({ mode: "arena" as const, stat })),
    ...dataset.aramMayhemStats.map((stat) => ({ mode: "aramMayhem" as const, stat }))
  ];
  const entries: BrokenBuildEntry[] = [];

  statRows.forEach(({ mode: entryMode, stat }) => {
    const dbChampion = dbChampionsById.get(stat.championId);
    const champion = dbChampion ? championsBySlug.get(dbChampion.slug) : undefined;
    const dbBuild = buildsById.get(stat.brokenBuildId ?? stat.bestBuildId ?? "");
    const fallbackStats = champion ? (entryMode === "arena" ? champion.arenaStats : champion.aramMayhemStats) : undefined;
    const mappedBuild = withBuildContentFallback(mapDbBuild(dbBuild, buildMaps), fallbackStats?.brokenBuild);

    if (!champion || !mappedBuild) {
      return;
    }

    entries.push({
      champion,
      mode: entryMode,
      build: stat.brokenScore == null ? mappedBuild : { ...mappedBuild, brokenScore: stat.brokenScore },
      augments: dbBuild ? getAugmentSlugsForBuild(dbBuild.id, buildMaps) : fallbackStats?.augments ?? [],
      winRate: dbBuild?.winRate ?? stat.winRate
    });
  });

  return entries;
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

  const explicitBrokenBuilds = dataset.builds
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
        build: withBuildContentFallback(mappedBuild, entryMode === "arena" ? champion.arenaStats.brokenBuild : champion.aramMayhemStats.brokenBuild) ?? mappedBuild,
        augments: getAugmentSlugsForBuild(build.id, buildMaps),
        winRate: build.winRate ?? stats.winRate
      } satisfies BrokenBuildEntry;
    })
    .filter((entry): entry is BrokenBuildEntry => Boolean(entry));

  const statBrokenBuilds = getStatBrokenBuilds({
    dataset,
    buildMaps,
    championsBySlug,
    dbChampionsById
  });
  const dedupedBrokenBuilds = new Map<string, BrokenBuildEntry>();

  [...explicitBrokenBuilds, ...statBrokenBuilds].forEach((entry) => {
    const key = `${entry.champion.slug}-${entry.mode}-${entry.build.name}`;
    const existing = dedupedBrokenBuilds.get(key);

    if (!existing || (entry.build.brokenScore ?? 0) > (existing.build.brokenScore ?? 0)) {
      dedupedBrokenBuilds.set(key, entry);
    }
  });

  const brokenBuilds = Array.from(dedupedBrokenBuilds.values())
    .filter((entry) => (mode ? entry.mode === mode : true))
    .sort((a, b) => (b.build.brokenScore ?? 0) - (a.build.brokenScore ?? 0));

  return brokenBuilds.length ? brokenBuilds : getMockBrokenBuilds(mode);
}

export async function getBuildsByChampion(championSlug: string, mode?: Mode): Promise<BrokenBuildEntry[]> {
  const builds = await getBrokenBuilds(mode);
  return builds.filter((entry) => entry.champion.slug === championSlug);
}
