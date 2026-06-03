import { augments, champions } from "@/data/mockData";
import type { Augment, Champion, Mode, Tier } from "@/types";
import { modeToStatsKey, tierOrder, tierRank } from "@/lib/utils";

export function getAllChampions(): Champion[] {
  return champions;
}

export function getChampionBySlug(slug: string): Champion | undefined {
  return champions.find((champion) => champion.slug === slug);
}

export function getAugments(): Augment[] {
  return augments;
}

export function getAugmentById(id: string): Augment | undefined {
  return augments.find((augment) => augment.id === id);
}

export function getTopChampions(mode: Mode, limit = 4): Champion[] {
  const statsKey = modeToStatsKey(mode);
  return [...champions]
    .sort((a, b) => {
      const tierDelta = tierRank[a.tier] - tierRank[b.tier];
      if (tierDelta !== 0) return tierDelta;
      return b[statsKey].winRate - a[statsKey].winRate;
    })
    .slice(0, limit);
}

export function getBrokenBuilds(mode?: Mode) {
  return champions
    .flatMap((champion) => {
      const entries = (["arena", "aramMayhem"] as Mode[]).map((entryMode) => {
        const stats = champion[modeToStatsKey(entryMode)];
        return {
          champion,
          mode: entryMode,
          build: stats.brokenBuild,
          augments: stats.augments,
          winRate: stats.winRate
        };
      });

      return mode ? entries.filter((entry) => entry.mode === mode) : entries;
    })
    .sort((a, b) => (b.build.brokenScore ?? 0) - (a.build.brokenScore ?? 0));
}

export function getChampionsByTier(mode: Mode): Record<Tier, Champion[]> {
  const statsKey = modeToStatsKey(mode);

  return tierOrder.reduce(
    (acc, tier) => {
      acc[tier] = champions
        .filter((champion) => champion.tier === tier)
        .sort((a, b) => b[statsKey].winRate - a[statsKey].winRate);
      return acc;
    },
    {} as Record<Tier, Champion[]>
  );
}

export function getRelatedChampions(champion: Champion, limit = 3): Champion[] {
  return champions
    .filter((candidate) => candidate.slug !== champion.slug)
    .filter((candidate) => candidate.role === champion.role || candidate.tier === champion.tier)
    .slice(0, limit);
}
