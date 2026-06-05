import type { DbGameMode } from "@/types/database";

export type AugmentAggregationMode = Extract<DbGameMode, "arena" | "aram_mayhem">;

export type AugmentAggregationJob = {
  type: "augment-aggregation";
  jobId: string;
  patchId: string;
  mode: AugmentAggregationMode;
  maxChampionPairsPerAugment?: number;
};

export type AggregatedChampionAugmentPair = {
  championId: string;
  riotChampionId: number;
  gamesPlayed: number;
  wins: number;
  winRate: number;
  pickRate: number;
  averagePlacement: number | null;
};

export type AggregatedAugmentStatistic = {
  patchId: string;
  augmentId: string;
  riotAugmentId: number;
  mode: AugmentAggregationMode;
  gamesPlayed: number;
  wins: number;
  winRate: number;
  pickRate: number;
  averagePlacement: number | null;
  championPairs: AggregatedChampionAugmentPair[];
};

export type AugmentAggregationResult = {
  jobId?: string;
  patchId: string;
  mode: AugmentAggregationMode;
  matchesProcessed: number;
  participantsProcessed: number;
  augmentsAggregated: number;
  championPairsPersisted: number;
  statistics: AggregatedAugmentStatistic[];
};
