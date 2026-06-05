import type {
  Augment,
  Build,
  Champion,
  ChampionGuide,
  ChampionModeStats,
  Difficulty,
  Item,
  Mode,
  Role,
  Tier
} from "@/types";
import type {
  DbArenaChampionStatistic,
  DbAramMayhemChampionStatistic,
  DbAugment,
  DbAugmentBestChampion,
  DbAugmentStatistic,
  DbBuild,
  DbBuildAugment,
  DbBuildItem,
  DbChampion,
  DbChampionDifficulty,
  DbChampionGuide,
  DbChampionRole,
  DbGameMode,
  DbItem,
  DbItemCategory
} from "@/types/database";

export type BuildRelationMaps = {
  buildItemsByBuildId: Map<string, DbBuildItem[]>;
  buildAugmentsByBuildId: Map<string, DbBuildAugment[]>;
  itemsById: Map<string, DbItem>;
  augmentsById: Map<string, DbAugment>;
};

const roleMap: Record<DbChampionRole, Role> = {
  marksman: "Marksman",
  mage: "Mage",
  bruiser: "Bruiser",
  tank: "Tank",
  enchanter: "Enchanter",
  assassin: "Assassin"
};

const difficultyMap: Record<DbChampionDifficulty, Difficulty> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  expert: "Expert"
};

const itemCategoryMap: Record<DbItemCategory, Item["category"]> = {
  starter: "Starter",
  core: "Core",
  damage: "Damage",
  defense: "Defense",
  utility: "Utility",
  boots: "Boots"
};

export function dbModeToMode(mode: DbGameMode): Mode {
  return mode === "aram_mayhem" ? "aramMayhem" : "arena";
}

export function modeToDbMode(mode: Mode): DbGameMode {
  return mode === "aramMayhem" ? "aram_mayhem" : "arena";
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function toItem(row: DbItem): Item {
  return {
    name: row.name,
    category: itemCategoryMap[row.category],
    riotId: row.riotItemId
  };
}

export function mapDbBuild(row: DbBuild | undefined, maps: BuildRelationMaps): Build | null {
  if (!row) return null;

  const itemOrder = (maps.buildItemsByBuildId.get(row.id) ?? [])
    .sort((a, b) => a.position - b.position)
    .map((buildItem) => maps.itemsById.get(buildItem.itemId))
    .filter((item): item is DbItem => Boolean(item))
    .map(toItem);

  return {
    name: row.name,
    itemOrder,
    fullBuild: itemOrder,
    explanation: row.explanation,
    brokenScore: row.brokenScore ?? undefined
  };
}

export function getAugmentSlugsForBuild(buildId: string | null | undefined, maps: BuildRelationMaps) {
  if (!buildId) return [];

  return (maps.buildAugmentsByBuildId.get(buildId) ?? [])
    .sort((a, b) => a.position - b.position)
    .map((buildAugment) => maps.augmentsById.get(buildAugment.augmentId)?.slug)
    .filter((slug): slug is string => Boolean(slug));
}

function createStats({
  stat,
  bestBuild,
  brokenBuild,
  augments,
  itemSynergies = [],
  banRate
}: {
  stat: DbArenaChampionStatistic | DbAramMayhemChampionStatistic;
  bestBuild: Build;
  brokenBuild: Build;
  augments: string[];
  itemSynergies?: string[];
  banRate?: number | null;
}): ChampionModeStats {
  return {
    winRate: stat.winRate,
    pickRate: stat.pickRate,
    banRate: banRate ?? undefined,
    bestBuild,
    brokenBuild,
    augments,
    itemSynergies
  };
}

export function mapDbChampion({
  champion,
  index,
  arenaStat,
  aramStat,
  guide,
  buildsById,
  buildMaps
}: {
  champion: DbChampion;
  index: number;
  arenaStat?: DbArenaChampionStatistic;
  aramStat?: DbAramMayhemChampionStatistic;
  guide?: DbChampionGuide;
  buildsById: Map<string, DbBuild>;
  buildMaps: BuildRelationMaps;
}): Champion | null {
  if (!arenaStat || !aramStat || !guide) return null;

  const arenaBestBuild = mapDbBuild(buildsById.get(arenaStat.bestBuildId ?? ""), buildMaps);
  const arenaBrokenBuild = mapDbBuild(buildsById.get(arenaStat.brokenBuildId ?? ""), buildMaps);
  const aramBestBuild = mapDbBuild(buildsById.get(aramStat.bestBuildId ?? ""), buildMaps);
  const aramBrokenBuild = mapDbBuild(buildsById.get(aramStat.brokenBuildId ?? ""), buildMaps);

  if (!arenaBestBuild || !arenaBrokenBuild || !aramBestBuild || !aramBrokenBuild) {
    return null;
  }

  return {
    id: champion.riotKey ?? index + 1,
    name: champion.name,
    slug: champion.slug,
    role: roleMap[champion.role],
    tier: arenaStat.tier as Tier,
    difficulty: difficultyMap[champion.difficulty],
    arenaStats: createStats({
      stat: arenaStat,
      bestBuild: arenaBestBuild,
      brokenBuild: arenaBrokenBuild,
      augments: getAugmentSlugsForBuild(arenaStat.brokenBuildId, buildMaps),
      banRate: arenaStat.banRate
    }),
    aramMayhemStats: createStats({
      stat: aramStat,
      bestBuild: aramBestBuild,
      brokenBuild: aramBrokenBuild,
      augments: getAugmentSlugsForBuild(aramStat.brokenBuildId, buildMaps)
    }),
    guide: {
      strengths: guide.strengths,
      weaknesses: guide.weaknesses,
      tips: guide.tips,
      playstyle: guide.playstyle
    } satisfies ChampionGuide
  };
}

export function mapDbAugments({
  augments,
  statistics,
  bestChampions,
  championsById
}: {
  augments: DbAugment[];
  statistics: DbAugmentStatistic[];
  bestChampions: DbAugmentBestChampion[];
  championsById: Map<string, DbChampion>;
}): Augment[] {
  const statsByAugmentId = new Map<string, DbAugmentStatistic[]>();
  const bestByStatisticId = new Map<string, DbAugmentBestChampion[]>();

  statistics.forEach((statistic) => {
    const current = statsByAugmentId.get(statistic.augmentId) ?? [];
    current.push(statistic);
    statsByAugmentId.set(statistic.augmentId, current);
  });

  bestChampions.forEach((entry) => {
    const current = bestByStatisticId.get(entry.augmentStatisticId) ?? [];
    current.push(entry);
    bestByStatisticId.set(entry.augmentStatisticId, current);
  });

  return augments.map((augment) => {
    const augmentStats = statsByAugmentId.get(augment.id) ?? [];
    const championSlugs = augmentStats
      .flatMap((statistic) => bestByStatisticId.get(statistic.id) ?? [])
      .sort((a, b) => a.rank - b.rank)
      .map((entry) => championsById.get(entry.championId)?.slug)
      .filter((slug): slug is string => Boolean(slug));

    return {
      id: augment.slug,
      name: augment.name,
      description: augment.description,
      averageWinRate: average(augmentStats.map((statistic) => statistic.averageWinRate)),
      pickRate: average(augmentStats.map((statistic) => statistic.pickRate)),
      bestChampionSlugs: [...new Set(championSlugs)]
    };
  });
}
