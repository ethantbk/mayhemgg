import type { AggregationPipelineMode, AggregationPipelineMatchIngestionOptions, AggregationPipelineResult } from "@/server/pipeline";
import type { DbIngestionJob, DbIngestionRun, DbPatch } from "@/types/database";

export type RefreshRunKind = "daily" | "manual" | "champion";

export type RefreshRunInput = {
  patchId?: string;
  patchVersion?: string;
  modes?: AggregationPipelineMode[];
  matchIngestion?: AggregationPipelineMatchIngestionOptions;
  maxBuildsPerChampion?: number;
  maxChampionPairsPerAugment?: number;
};

export type ChampionRefreshRunInput = RefreshRunInput & {
  championId: string;
};

export type RefreshRunResult = {
  kind: RefreshRunKind;
  patch: DbPatch;
  result: AggregationPipelineResult;
};

export type RefreshStatusReport = {
  patch: DbPatch | null;
  runningJobs: DbIngestionJob[];
  recentJobs: DbIngestionJob[];
  recentRuns: DbIngestionRun[];
};

export type RefreshHealthReport = RefreshStatusReport & {
  ok: boolean;
  checks: {
    supabaseConfigured: boolean;
    riotConfigured: boolean;
    activePatchAvailable: boolean;
    pipelineRunning: boolean;
    lastRunSucceeded: boolean | null;
  };
};
