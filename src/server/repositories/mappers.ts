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
    gamesPlayed: stat.gamesPlayed,
    banRate: banRate ?? undefined,
    bestBuild,
    brokenBuild,
    augments,
    itemSynergies
  };
}

function createFallbackGuide(champion: DbChampion): ChampionGuide {
  return {
    strengths: [
      "Current patch statistics are available from aggregated Riot match data.",
      "Build and augment recommendations update as ingestion coverage improves."
    ],
    weaknesses: [
      "Detailed matchup notes are pending editorial review.",
      "Low sample sizes can make early-patch performance more volatile."
    ],
    tips: [
      "Prioritize the highest-performing core build until more matchups are available.",
      "Compare Arena and ARAM Mayhem stats before locking a mode-specific setup."
    ],
    playstyle: `${champion.name} recommendations are generated from current patch MayhemGG performance data.`
  };
}

function findBuildForStat({
  championId,
  mode,
  preferredBuildId,
  preferredKind,
  buildsById
}: {
  championId: string;
  mode: DbGameMode;
  preferredBuildId?: string | null;
  preferredKind: DbBuild["kind"];
  buildsById: Map<string, DbBuild>;
}) {
  const preferredBuild = preferredBuildId ? buildsById.get(preferredBuildId) : undefined;

  if (preferredBuild) {
    return preferredBuild;
  }

  const championBuilds = Array.from(buildsById.values())
    .filter((build) => build.championId === championId && build.mode === mode)
    .sort((a, b) => {
      const kindDelta = Number(b.kind === preferredKind) - Number(a.kind === preferredKind);
      if (kindDelta !== 0) return kindDelta;
      return (b.winRate ?? 0) - (a.winRate ?? 0);
    });

  return championBuilds[0];
}

function withBrokenScore(build: Build, brokenScore?: number | null): Build {
  if (brokenScore == null || build.brokenScore != null) {
    return build;
  }

  return {
    ...build,
    brokenScore
  };
}

export function mapDbChampion({
  champion,
  index,
  arenaStat,
  aramStat,
  guide,
  buildsById,
  buildMaps,
  fallbackChampion
}: {
  champion: DbChampion;
  index: number;
  arenaStat?: DbArenaChampionStatistic;
  aramStat?: DbAramMayhemChampionStatistic;
  guide?: DbChampionGuide;
  buildsById: Map<string, DbBuild>;
  buildMaps: BuildRelationMaps;
  fallbackChampion?: Champion;
}): Champion | null {
  if (!arenaStat && !aramStat) return null;

  const arenaBestDbBuild = findBuildForStat({
    championId: champion.id,
    mode: "arena",
    preferredBuildId: arenaStat?.bestBuildId,
    preferredKind: "best",
    buildsById
  });
  const arenaBrokenDbBuild = findBuildForStat({
    championId: champion.id,
    mode: "arena",
    preferredBuildId: arenaStat?.brokenBuildId ?? arenaStat?.bestBuildId,
    preferredKind: "broken",
    buildsById
  });
  const aramBestDbBuild = findBuildForStat({
    championId: champion.id,
    mode: "aram_mayhem",
    preferredBuildId: aramStat?.bestBuildId,
    preferredKind: "best",
    buildsById
  });
  const aramBrokenDbBuild = findBuildForStat({
    championId: champion.id,
    mode: "aram_mayhem",
    preferredBuildId: aramStat?.brokenBuildId ?? aramStat?.bestBuildId,
    preferredKind: "broken",
    buildsById
  });
  const arenaBestBuild = mapDbBuild(arenaBestDbBuild, buildMaps) ?? fallbackChampion?.arenaStats.bestBuild;
  const arenaBrokenBuild = mapDbBuild(arenaBrokenDbBuild, buildMaps) ?? fallbackChampion?.arenaStats.brokenBuild;
  const aramBestBuild = mapDbBuild(aramBestDbBuild, buildMaps) ?? fallbackChampion?.aramMayhemStats.bestBuild;
  const aramBrokenBuild = mapDbBuild(aramBrokenDbBuild, buildMaps) ?? fallbackChampion?.aramMayhemStats.brokenBuild;

  if (!arenaBestBuild || !arenaBrokenBuild || !aramBestBuild || !aramBrokenBuild) {
    return null;
  }

  const guideData = guide
    ? {
        strengths: guide.strengths,
        weaknesses: guide.weaknesses,
        tips: guide.tips,
        playstyle: guide.playstyle
      }
    : createFallbackGuide(champion);
  const arenaAugments = getAugmentSlugsForBuild(arenaBrokenDbBuild?.id, buildMaps);
  const aramAugments = getAugmentSlugsForBuild(aramBrokenDbBuild?.id, buildMaps);
  const arenaStats = arenaStat
    ? createStats({
        stat: arenaStat,
        bestBuild: arenaBestBuild,
        brokenBuild: withBrokenScore(arenaBrokenBuild, arenaStat.brokenScore),
        augments: arenaAugments.length ? arenaAugments : fallbackChampion?.arenaStats.augments ?? [],
        banRate: arenaStat.banRate
      })
    : fallbackChampion?.arenaStats;
  const aramMayhemStats = aramStat
    ? createStats({
        stat: aramStat,
        bestBuild: aramBestBuild,
        brokenBuild: withBrokenScore(aramBrokenBuild, aramStat.brokenScore),
        augments: aramAugments.length ? aramAugments : fallbackChampion?.aramMayhemStats.augments ?? []
      })
    : fallbackChampion?.aramMayhemStats;

  if (!arenaStats || !aramMayhemStats) {
    return null;
  }

  return {
    id: champion.riotKey ?? index + 1,
    name: champion.name,
    slug: champion.slug,
    role: roleMap[champion.role],
    tier: (arenaStat?.tier ?? aramStat?.tier ?? fallbackChampion?.tier ?? "C") as Tier,
    difficulty: difficultyMap[champion.difficulty],
    arenaStats,
    aramMayhemStats,
    guide: guideData satisfies ChampionGuide
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
