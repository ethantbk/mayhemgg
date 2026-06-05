import type { DbBuildKind, DbGameMode } from "@/types/database";

export type BuildAggregationMode = Extract<DbGameMode, "arena" | "aram_mayhem">;

export type BuildAggregationJob = {
  type: "build-aggregation";
  jobId: string;
  patchId: string;
  mode: BuildAggregationMode;
  maxBuildsPerChampion?: number;
  championId?: string;
};

export type AggregatedChampionBuild = {
  patchId: string;
  championId: string;
  riotChampionId: number;
  mode: BuildAggregationMode;
  kind: DbBuildKind;
  name: string;
  explanation: string;
  itemRiotIds: number[];
  itemSetKey: string;
  gamesPlayed: number;
  wins: number;
  winRate: number;
  pickRate: number;
  modePickRate: number;
  averagePlacement: number | null;
  observedOrders: Array<{
    itemRiotIds: number[];
    gamesPlayed: number;
  }>;
};

export type BuildAggregationResult = {
  jobId?: string;
  patchId: string;
  mode: BuildAggregationMode;
  matchesProcessed: number;
  participantsProcessed: number;
  buildsAggregated: number;
  buildsPersisted: number;
  builds: AggregatedChampionBuild[];
};
