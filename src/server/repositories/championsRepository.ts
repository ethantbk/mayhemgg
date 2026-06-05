import "server-only";

import {
  getAllChampions as getMockChampions,
  getChampionBySlug as getMockChampionBySlug,
  getRelatedChampions as getMockRelatedChampions,
  getTopChampions as getMockTopChampions
} from "@/lib/data";
import type { Champion, Mode } from "@/types";
import { modeToStatsKey, tierRank } from "@/lib/utils";
import { mapDbChampion, type BuildRelationMaps } from "@/server/repositories/mappers";
import { loadPublishedDataset, type PublishedDataset } from "@/server/repositories/publishedDataset";

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

export function mapDatasetToChampions(dataset: PublishedDataset): Champion[] {
  const buildsById = new Map(dataset.builds.map((build) => [build.id, build]));
  const arenaStatsByChampionId = new Map(dataset.arenaStats.map((stat) => [stat.championId, stat]));
  const aramStatsByChampionId = new Map(dataset.aramMayhemStats.map((stat) => [stat.championId, stat]));
  const guidesByChampionId = new Map(dataset.championGuides.map((guide) => [guide.championId, guide]));

  const buildMaps: BuildRelationMaps = {
    buildItemsByBuildId: groupBy(dataset.buildItems, (buildItem) => buildItem.buildId),
    buildAugmentsByBuildId: groupBy(dataset.buildAugments, (buildAugment) => buildAugment.buildId),
    itemsById: new Map(dataset.items.map((item) => [item.id, item])),
    augmentsById: new Map(dataset.augments.map((augment) => [augment.id, augment]))
  };

  return dataset.champions
    .map((champion, index) =>
      mapDbChampion({
        champion,
        index,
        arenaStat: arenaStatsByChampionId.get(champion.id),
        aramStat: aramStatsByChampionId.get(champion.id),
        guide: guidesByChampionId.get(champion.id),
        buildsById,
        buildMaps
      })
    )
    .filter((champion): champion is Champion => Boolean(champion));
}

export async function getChampions(): Promise<Champion[]> {
  const dataset = await loadPublishedDataset();
  const champions = dataset ? mapDatasetToChampions(dataset) : [];

  return champions.length ? champions : getMockChampions();
}

export async function getChampionBySlug(slug: string): Promise<Champion | undefined> {
  const champions = await getChampions();
  return champions.find((champion) => champion.slug === slug) ?? getMockChampionBySlug(slug);
}

export async function getTopChampions(mode: Mode, limit = 4): Promise<Champion[]> {
  const dataset = await loadPublishedDataset();
  const champions = dataset ? mapDatasetToChampions(dataset) : [];

  if (!champions.length) {
    return getMockTopChampions(mode, limit);
  }

  const statsKey = modeToStatsKey(mode);

  return [...champions]
    .sort((a, b) => {
      const tierDelta = tierRank[a.tier] - tierRank[b.tier];
      if (tierDelta !== 0) return tierDelta;
      return b[statsKey].winRate - a[statsKey].winRate;
    })
    .slice(0, limit);
}

export async function getRelatedChampions(champion: Champion, limit = 3): Promise<Champion[]> {
  const champions = await getChampions();
  const relatedChampions = champions
    .filter((candidate) => candidate.slug !== champion.slug)
    .filter((candidate) => candidate.role === champion.role || candidate.tier === champion.tier)
    .slice(0, limit);

  return relatedChampions.length ? relatedChampions : getMockRelatedChampions(champion, limit);
}
