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
import {
  type ChampionPublishedDataDebugSnapshot,
  isLiveDataDebugEnabled,
  loadChampionPublishedDataDebugSnapshot,
  loadPublishedDataset,
  type PublishedDataset
} from "@/server/repositories/publishedDataset";

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

function createBuildRelationMaps(dataset?: PublishedDataset): BuildRelationMaps {
  return {
    buildItemsByBuildId: groupBy(dataset?.buildItems ?? [], (buildItem) => buildItem.buildId),
    buildAugmentsByBuildId: groupBy(dataset?.buildAugments ?? [], (buildAugment) => buildAugment.buildId),
    itemsById: new Map((dataset?.items ?? []).map((item) => [item.id, item])),
    augmentsById: new Map((dataset?.augments ?? []).map((augment) => [augment.id, augment]))
  };
}

function createPublishedDatasetIndexes(dataset?: PublishedDataset) {
  return {
    buildsById: new Map((dataset?.builds ?? []).map((build) => [build.id, build])),
    arenaStatsByChampionId: new Map((dataset?.arenaStats ?? []).map((stat) => [stat.championId, stat])),
    aramStatsByChampionId: new Map((dataset?.aramMayhemStats ?? []).map((stat) => [stat.championId, stat])),
    guidesByChampionId: new Map((dataset?.championGuides ?? []).map((guide) => [guide.championId, guide])),
    buildMaps: createBuildRelationMaps(dataset)
  };
}

export function mapDatasetToChampions(dataset: PublishedDataset): Champion[] {
  const {
    buildsById,
    arenaStatsByChampionId,
    aramStatsByChampionId,
    guidesByChampionId,
    buildMaps
  } = createPublishedDatasetIndexes(dataset);

  return dataset.champions
    .map((champion, index) =>
      mapDbChampion({
        champion,
        index,
        arenaStat: arenaStatsByChampionId.get(champion.id),
        aramStat: aramStatsByChampionId.get(champion.id),
        guide: guidesByChampionId.get(champion.id),
        buildsById,
        buildMaps,
        fallbackChampion: getMockChampionBySlug(champion.slug)
      })
    )
    .filter((champion): champion is Champion => Boolean(champion));
}

function mapResolvedChampionByChampionId({
  dataset,
  championId,
  fallbackChampion,
  debugSnapshot
}: {
  dataset: PublishedDataset | null;
  championId: string;
  fallbackChampion?: Champion;
  debugSnapshot: Awaited<ReturnType<typeof loadChampionPublishedDataDebugSnapshot>>;
}) {
  const {
    buildsById,
    arenaStatsByChampionId,
    aramStatsByChampionId,
    guidesByChampionId,
    buildMaps
  } = createPublishedDatasetIndexes(dataset ?? undefined);
  const resolvedChampion = debugSnapshot.champion ?? dataset?.champions.find((champion) => champion.id === championId);

  if (!resolvedChampion) {
    return null;
  }

  return mapDbChampion({
    champion: resolvedChampion,
    index: dataset?.champions.findIndex((champion) => champion.id === resolvedChampion.id) ?? 0,
    arenaStat: debugSnapshot.mappedArenaStatisticRow ?? arenaStatsByChampionId.get(championId),
    aramStat: aramStatsByChampionId.get(championId),
    guide: guidesByChampionId.get(championId),
    buildsById,
    buildMaps,
    fallbackChampion
  });
}

async function loadChampionBySlugFromLiveRows(slug: string): Promise<{
  dataset: PublishedDataset | null;
  debugSnapshot: ChampionPublishedDataDebugSnapshot;
  liveChampion: Champion | null;
  mockChampion: Champion | undefined;
  finalChampion: Champion | undefined;
  fullMockFallbackUsed: boolean;
}> {
  const [dataset, debugSnapshot] = await Promise.all([
    loadPublishedDataset(),
    loadChampionPublishedDataDebugSnapshot(slug)
  ]);
  const mockChampion = getMockChampionBySlug(slug);
  const resolvedChampionId = debugSnapshot.champion?.id ?? dataset?.champions.find((champion) => champion.slug === slug)?.id;
  const liveChampion = resolvedChampionId
    ? mapResolvedChampionByChampionId({
        dataset,
        championId: resolvedChampionId,
        fallbackChampion: mockChampion,
        debugSnapshot
      })
    : null;
  const finalChampion = liveChampion ?? mockChampion;

  return {
    dataset,
    debugSnapshot,
    liveChampion,
    mockChampion,
    finalChampion,
    fullMockFallbackUsed: !liveChampion && Boolean(mockChampion)
  };
}

export async function getChampions(): Promise<Champion[]> {
  const dataset = await loadPublishedDataset();
  const champions = dataset ? mapDatasetToChampions(dataset) : [];

  return champions.length ? champions : getMockChampions();
}

export async function getChampionBySlug(slug: string): Promise<Champion | undefined> {
  const { finalChampion } = await loadChampionBySlugFromLiveRows(slug);
  return finalChampion;
}

export async function getChampionBySlugWithDebug(slug: string): Promise<Champion | undefined> {
  const {
    dataset,
    debugSnapshot,
    liveChampion,
    mockChampion,
    finalChampion,
    fullMockFallbackUsed
  } = await loadChampionBySlugFromLiveRows(slug);

  if (isLiveDataDebugEnabled()) {
    console.info("[MayhemGG /champions/[slug] data-loader debug]", {
      requestedSlug: slug,
      datasetLoaded: Boolean(dataset),
      datasetSummary: dataset
        ? {
            patch: dataset.patch.version,
            champions: dataset.champions.length,
            arenaStats: dataset.arenaStats.length,
            aramMayhemStats: dataset.aramMayhemStats.length,
            builds: dataset.builds.length,
            augments: dataset.augments.length
          }
        : null,
      supabaseDebug: {
        configAvailable: debugSnapshot.supabaseConfigAvailable,
        error: debugSnapshot.error,
        patch: debugSnapshot.patch
          ? {
              id: debugSnapshot.patch.id,
              version: debugSnapshot.patch.version,
              status: debugSnapshot.patch.status
            }
          : null,
        resolvedChampionRow: debugSnapshot.champion
          ? {
              id: debugSnapshot.champion.id,
              slug: debugSnapshot.champion.slug,
              name: debugSnapshot.champion.name,
              riotChampionId: debugSnapshot.champion.riotChampionId,
              riotKey: debugSnapshot.champion.riotKey
            }
          : null,
        rawArenaStatisticRowByChampionId: debugSnapshot.rawArenaStatisticRow,
        mappedArenaStats: debugSnapshot.mappedArenaStatisticRow
      },
      selectedSources: {
        liveChampionFound: Boolean(liveChampion),
        fullMockFallbackUsed,
        mockChampionAvailable: Boolean(mockChampion),
        arenaStatsSource: liveChampion && debugSnapshot.mappedArenaStatisticRow ? "supabase" : "mock-or-missing",
        finalUiModelSource: fullMockFallbackUsed ? "mock" : "repository"
      },
      finalUiModel: finalChampion ?? null
    });
  }

  return finalChampion;
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
