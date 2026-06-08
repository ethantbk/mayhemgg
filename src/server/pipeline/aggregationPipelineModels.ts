import type { AugmentAggregationResult } from "@/server/aggregation/augmentAggregationModels";
import type { BrokenScoreResult } from "@/server/aggregation/brokenScoreModels";
import type { BuildAggregationResult } from "@/server/aggregation/buildAggregationModels";
import type { ChampionAggregationResult } from "@/server/aggregation/championAggregationModels";
import type { MatchDiscoveryJobResult } from "@/server/ingestion/matchIngestionJobs";
import type { PersistNormalizedMatchResult } from "@/server/ingestion/persistence";
import type { RiotRegionalRouting } from "@/server/riot/types";
import type { DbGameMode } from "@/types/database";

export type AggregationPipelineMode = Extract<DbGameMode, "arena" | "aram_mayhem">;

export type AggregationPipelineMatchDiscoverySource = {
  puuid: string;
  queueId: number;
  queueIds?: number[];
  regionalRouting?: RiotRegionalRouting;
  startTime?: number;
  endTime?: number;
  start?: number;
  count?: number;
};

export type AggregationPipelineMatchIngestionOptions = {
  matchIds?: string[];
  discoverySources?: AggregationPipelineMatchDiscoverySource[];
  regionalRouting?: RiotRegionalRouting;
  maxMatches?: number;
  continueOnMatchError?: boolean;
};

export type RunAggregationPipelineInput = {
  patchId: string;
  jobId?: string;
  modes?: AggregationPipelineMode[];
  championId?: string;
  lockTtlMs?: number;
  matchIngestion?: AggregationPipelineMatchIngestionOptions;
  maxBuildsPerChampion?: number;
  maxChampionPairsPerAugment?: number;
};

export type MatchIngestionPipelineResult = {
  discoveryResults: MatchDiscoveryJobResult[];
  debug: {
    seedPuuidCount: number;
    seedPuuids: string[];
    discoveryQueries: Array<{
      puuid: string;
      queueId: number;
      targetQueueIds?: number[];
      regionalRouting?: RiotRegionalRouting;
      startTime?: number;
      endTime?: number;
      start?: number;
      count?: number;
      discoveryStrategy: string;
      unfilteredMatchIds: string[];
      queueIdsFound: number[];
      eligibleQueueIds: number[];
      matchIdsReturned: string[];
      matchCount: number;
      skippedMatches: Array<{
        riotMatchId: string;
        queueId: number;
        gameMode: string;
        reason: string;
      }>;
    }>;
    fetchedMatches: Array<{
      riotMatchId: string;
      queueId: number;
      mode: string;
      participantsPersisted: number;
    }>;
    skippedMatches: Array<{
      riotMatchId?: string;
      reason: string;
      error?: string;
    }>;
    duplicateMatchesSkipped: string[];
  };
  matchIdsDiscovered: number;
  matchIdsRequested: number;
  matchesAttempted: number;
  matchesPersisted: number;
  participantsPersisted: number;
  failedMatches: Array<{
    riotMatchId: string;
    error: string;
  }>;
  persistedMatches: PersistNormalizedMatchResult[];
};

export type AggregationPipelinePhaseSummary = {
  championAggregation: ChampionAggregationResult[];
  buildAggregation: BuildAggregationResult[];
  augmentAggregation: AugmentAggregationResult[];
  brokenScoreGeneration: BrokenScoreResult[];
};

export type AggregationPipelineResult = {
  jobId: string;
  runId: string;
  patchId: string;
  modes: AggregationPipelineMode[];
  championId?: string;
  matchIngestion: MatchIngestionPipelineResult;
  phases: AggregationPipelinePhaseSummary;
  recordsProcessed: number;
};
