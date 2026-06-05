import "server-only";

import { getChampionsByTier as getMockChampionsByTier } from "@/lib/data";
import type { Champion, Mode, Tier } from "@/types";
import { modeToDbMode } from "@/server/repositories/mappers";
import { mapDatasetToChampions } from "@/server/repositories/championsRepository";
import { loadPublishedDataset } from "@/server/repositories/publishedDataset";
import { modeToStatsKey, tierOrder } from "@/lib/utils";

function createEmptyTierList(): Record<Tier, Champion[]> {
  return tierOrder.reduce(
    (acc, tier) => {
      acc[tier] = [];
      return acc;
    },
    {} as Record<Tier, Champion[]>
  );
}

function groupChampionsByGeneratedTier(champions: Champion[], mode: Mode): Record<Tier, Champion[]> {
  const grouped = createEmptyTierList();
  const statsKey = modeToStatsKey(mode);

  champions
    .filter((champion) => champion[statsKey].pickRate > 0)
    .sort((a, b) => b[statsKey].winRate - a[statsKey].winRate)
    .forEach((champion) => {
      grouped[champion.tier].push(champion);
    });

  return grouped;
}

function hasTierEntries(grouped: Record<Tier, Champion[]>) {
  return tierOrder.some((tier) => grouped[tier].length > 0);
}

export async function getChampionsByTier(mode: Mode): Promise<Record<Tier, Champion[]>> {
  const dataset = await loadPublishedDataset();

  if (!dataset) {
    return getMockChampionsByTier(mode);
  }

  const champions = mapDatasetToChampions(dataset);
  const tierList = dataset.tierLists.find((entry) => entry.mode === modeToDbMode(mode));

  if (!tierList) {
    const generatedGrouped = groupChampionsByGeneratedTier(champions, mode);
    return hasTierEntries(generatedGrouped) ? generatedGrouped : getMockChampionsByTier(mode);
  }

  const championsByDbId = new Map(
    dataset.champions
      .map((dbChampion) => {
        const champion = champions.find((entry) => entry.slug === dbChampion.slug);
        return champion ? ([dbChampion.id, champion] as const) : null;
      })
      .filter((entry): entry is readonly [string, Champion] => Boolean(entry))
  );
  const entries = dataset.tierListEntries
    .filter((entry) => entry.tierListId === tierList.id)
    .sort((a, b) => a.rank - b.rank);
  const grouped = createEmptyTierList();

  entries.forEach((entry) => {
    const champion = championsByDbId.get(entry.championId);

    if (champion) {
      grouped[entry.tier].push(champion);
    }
  });

  if (entries.length && hasTierEntries(grouped)) {
    return grouped;
  }

  const generatedGrouped = groupChampionsByGeneratedTier(champions, mode);
  return hasTierEntries(generatedGrouped) ? generatedGrouped : getMockChampionsByTier(mode);
}
