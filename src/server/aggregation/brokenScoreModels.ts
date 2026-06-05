import type { DbGameMode, DbTierRank } from "@/types/database";

export type BrokenScoreMode = Extract<DbGameMode, "arena" | "aram_mayhem">;

export type BrokenScoreJob = {
  type: "broken-score-generation";
  jobId: string;
  patchId: string;
  mode: BrokenScoreMode;
  championId?: string;
};

export type BrokenScoreInputs = {
  winRate: number;
  pickRate: number;
  banRate: number | null;
  averagePlacement: number | null;
  gamesPlayed: number;
  sampleConfidence: number;
  championComponent: number;
  buildComponent: number;
  augmentComponent: number;
  placementComponent: number;
  confidenceComponent: number;
};

export type ChampionBrokenScore = {
  patchId: string;
  championId: string;
  mode: BrokenScoreMode;
  brokenScore: number;
  generatedTier: DbTierRank;
  brokenBuildId: string | null;
  inputs: BrokenScoreInputs;
};

export type BrokenScoreResult = {
  jobId?: string;
  patchId: string;
  mode: BrokenScoreMode;
  championsScored: number;
  scoresPersisted: number;
  scores: ChampionBrokenScore[];
};
