import type { DbGameMode, DbTierRank } from "@/types/database";

export type ChampionAggregationMode = Extract<DbGameMode, "arena" | "aram_mayhem">;

export type ChampionAggregationJob = {
  type: "champion-statistics-aggregation";
  jobId: string;
  patchId: string;
  mode: ChampionAggregationMode;
  championId?: string;
};

export type ChampionTierScoreInputs = {
  winRate: number;
  pickRate: number;
  banRate: number | null;
  gamesPlayed: number;
  wins: number;
  totalModeParticipants: number;
  totalModeMatches: number;
  sampleConfidence: number;
  score: number;
};

export type AggregatedChampionStatistic = {
  patchId: string;
  championId: string;
  riotChampionId: number;
  mode: ChampionAggregationMode;
  tier: DbTierRank;
  winRate: number;
  pickRate: number;
  banRate: number | null;
  gamesPlayed: number;
  wins: number;
  averagePlacement: number | null;
  tierScoreInputs: ChampionTierScoreInputs;
};

export type ChampionAggregationResult = {
  jobId?: string;
  patchId: string;
  mode: ChampionAggregationMode;
  matchesProcessed: number;
  participantsProcessed: number;
  championsAggregated: number;
  statistics: AggregatedChampionStatistic[];
};
