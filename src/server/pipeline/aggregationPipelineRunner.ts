import "server-only";

import { toDatabaseError } from "@/lib/supabase/errors";
import {
  BrokenScoreService,
  BuildAggregationService,
  ChampionAggregationService,
  AugmentAggregationService,
  createBrokenScoreService,
  createBuildAggregationService,
  createChampionAggregationService,
  createAugmentAggregationService
} from "@/server/aggregation";
import { createLogger, type Logger } from "@/server/logging/logger";
import { createMatchIngestionService, type MatchIngestionService } from "@/server/ingestion";
import type { MatchDiscoveryJob, MatchFetchJob } from "@/server/ingestion/matchIngestionJobs";
import {
  createIngestionJobsRepository,
  createIngestionRunsRepository,
  createMatchPersistenceRepository,
  type IngestionJobsRepository,
  type IngestionRunsRepository,
  type MatchPersistenceRepository,
  type PipelineIngestionJob
} from "@/server/ingestion/persistence";
import { toJsonValue } from "@/server/ingestion/persistence/json";
import { RiotRateLimitError } from "@/server/riot/errors";
import type {
  AggregationPipelineMatchDiscoverySource,
  AggregationPipelineMode,
  AggregationPipelineResult,
  MatchIngestionPipelineResult,
  RunAggregationPipelineInput
} from "@/server/pipeline/aggregationPipelineModels";
import type { DbIngestionJobStatus, JsonValue } from "@/types/database";

const DEFAULT_PIPELINE_MODES: AggregationPipelineMode[] = ["arena", "aram_mayhem"];

export class AggregationPipelineAlreadyRunningError extends Error {
  constructor(jobId: string) {
    super(`Aggregation pipeline is already running for job ${jobId}.`);
    this.name = "AggregationPipelineAlreadyRunningError";
  }
}

export type AggregationPipelineRunnerOptions = {
  matchIngestionService?: MatchIngestionService;
  matchPersistenceRepository?: MatchPersistenceRepository;
  championAggregationService?: ChampionAggregationService;
  buildAggregationService?: BuildAggregationService;
  augmentAggregationService?: AugmentAggregationService;
  brokenScoreService?: BrokenScoreService;
  ingestionJobsRepository?: IngestionJobsRepository;
  ingestionRunsRepository?: IngestionRunsRepository;
  logger?: Logger;
};

function uniqueValues(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function uniqueDiscoveryPuuids(sources: AggregationPipelineMatchDiscoverySource[] = []) {
  return uniqueValues(sources.map((source) => source.puuid));
}

function pipelineJobId(patchId: string) {
  return `aggregation-pipeline:${patchId}`;
}

function childJobId(parentJobId: string, phase: string, key: string | number) {
  return `${parentJobId}:${phase}:${key}`;
}

function failureStatus(error: unknown): {
  status: Extract<DbIngestionJobStatus, "retryable_failed" | "rate_limited" | "permanently_failed">;
  nextAttemptAt?: string | null;
} {
  if (error instanceof RiotRateLimitError) {
    return {
      status: "rate_limited",
      nextAttemptAt: new Date(Date.now() + error.retryAfterMs).toISOString()
    };
  }

  return {
    status: "retryable_failed"
  };
}

function errorMessage(error: unknown) {
  return toDatabaseError(error, "Pipeline execution failed").message;
}

function resultMetadata(result: AggregationPipelineResult): JsonValue {
  return toJsonValue({
    jobId: result.jobId,
    patchId: result.patchId,
    modes: result.modes,
    matchIngestion: {
      matchIdsDiscovered: result.matchIngestion.matchIdsDiscovered,
      matchIdsRequested: result.matchIngestion.matchIdsRequested,
      matchesAttempted: result.matchIngestion.matchesAttempted,
      matchesPersisted: result.matchIngestion.matchesPersisted,
      participantsPersisted: result.matchIngestion.participantsPersisted,
      failedMatches: result.matchIngestion.failedMatches.length,
      debug: result.matchIngestion.debug
    },
    championId: result.championId ?? null,
    championAggregation: result.phases.championAggregation.map((entry) => ({
      mode: entry.mode,
      matchesProcessed: entry.matchesProcessed,
      participantsProcessed: entry.participantsProcessed,
      championsAggregated: entry.championsAggregated
    })),
    buildAggregation: result.phases.buildAggregation.map((entry) => ({
      mode: entry.mode,
      matchesProcessed: entry.matchesProcessed,
      buildsPersisted: entry.buildsPersisted
    })),
    augmentAggregation: result.phases.augmentAggregation.map((entry) => ({
      mode: entry.mode,
      matchesProcessed: entry.matchesProcessed,
      augmentsAggregated: entry.augmentsAggregated,
      championPairsPersisted: entry.championPairsPersisted
    })),
    brokenScoreGeneration: result.phases.brokenScoreGeneration.map((entry) => ({
      mode: entry.mode,
      championsScored: entry.championsScored,
      scoresPersisted: entry.scoresPersisted
    }))
  });
}

export class AggregationPipelineRunner {
  private matchIngestionService: MatchIngestionService;
  private matchPersistenceRepository: MatchPersistenceRepository;
  private championAggregationService: ChampionAggregationService;
  private buildAggregationService: BuildAggregationService;
  private augmentAggregationService: AugmentAggregationService;
  private brokenScoreService: BrokenScoreService;
  private ingestionJobsRepository: IngestionJobsRepository;
  private ingestionRunsRepository: IngestionRunsRepository;
  private logger: Logger;

  constructor(options: AggregationPipelineRunnerOptions = {}) {
    this.matchIngestionService = options.matchIngestionService ?? createMatchIngestionService();
    this.matchPersistenceRepository = options.matchPersistenceRepository ?? createMatchPersistenceRepository();
    this.championAggregationService = options.championAggregationService ?? createChampionAggregationService();
    this.buildAggregationService = options.buildAggregationService ?? createBuildAggregationService();
    this.augmentAggregationService = options.augmentAggregationService ?? createAugmentAggregationService();
    this.brokenScoreService = options.brokenScoreService ?? createBrokenScoreService();
    this.ingestionJobsRepository = options.ingestionJobsRepository ?? createIngestionJobsRepository();
    this.ingestionRunsRepository = options.ingestionRunsRepository ?? createIngestionRunsRepository();
    this.logger = options.logger ?? createLogger({ component: "aggregation-pipeline" });
  }

  async runPipeline(input: RunAggregationPipelineInput): Promise<AggregationPipelineResult> {
    const modes = input.modes?.length ? input.modes : DEFAULT_PIPELINE_MODES;
    const job: PipelineIngestionJob = {
      type: "aggregation-pipeline",
      jobId: input.jobId ?? pipelineJobId(input.patchId),
      patchId: input.patchId
    };
    const acquiredJob = await this.ingestionJobsRepository.acquireExclusiveJob({
      job,
      patchId: input.patchId,
      lockTtlMs: input.lockTtlMs,
      metadata: toJsonValue({
        patchId: input.patchId,
        modes,
        championId: input.championId,
        matchIngestion: input.matchIngestion ?? {}
      })
    });

    if (!acquiredJob) {
      throw new AggregationPipelineAlreadyRunningError(job.jobId);
    }

    const run = await this.ingestionRunsRepository.startRun({
      patchId: input.patchId,
      source: "aggregation-pipeline",
      metadata: toJsonValue({
        jobId: job.jobId,
        modes,
        championId: input.championId,
        matchIngestion: input.matchIngestion ?? {}
      })
    });

    this.logger.info("Started aggregation pipeline.", {
      jobId: job.jobId,
      runId: run.id,
      patchId: input.patchId,
      modeCount: modes.length
    });

    try {
      const matchIngestion = await this.runMatchIngestionPhase({
        parentJobId: job.jobId,
        parentRunId: run.id,
        patchId: input.patchId,
        input
      });
      const championAggregation = [];
      const buildAggregation = [];
      const augmentAggregation = [];
      const brokenScoreGeneration = [];

      for (const mode of modes) {
        championAggregation.push(await this.championAggregationService.aggregateJob({
          type: "champion-statistics-aggregation",
          jobId: childJobId(job.jobId, "champion-aggregation", mode),
          patchId: input.patchId,
          mode,
          championId: input.championId
        }));
      }

      for (const mode of modes) {
        buildAggregation.push(await this.buildAggregationService.aggregateJob({
          type: "build-aggregation",
          jobId: childJobId(job.jobId, "build-aggregation", mode),
          patchId: input.patchId,
          mode,
          maxBuildsPerChampion: input.maxBuildsPerChampion,
          championId: input.championId
        }));
      }

      for (const mode of modes) {
        augmentAggregation.push(await this.augmentAggregationService.aggregateJob({
          type: "augment-aggregation",
          jobId: childJobId(job.jobId, "augment-aggregation", mode),
          patchId: input.patchId,
          mode,
          maxChampionPairsPerAugment: input.maxChampionPairsPerAugment
        }));
      }

      for (const mode of modes) {
        brokenScoreGeneration.push(await this.brokenScoreService.generateJob({
          type: "broken-score-generation",
          jobId: childJobId(job.jobId, "broken-score", mode),
          patchId: input.patchId,
          mode,
          championId: input.championId
        }));
      }

      const recordsProcessed =
        matchIngestion.matchesPersisted +
        matchIngestion.participantsPersisted +
        championAggregation.reduce((sum, entry) => sum + entry.championsAggregated, 0) +
        buildAggregation.reduce((sum, entry) => sum + entry.buildsPersisted, 0) +
        augmentAggregation.reduce((sum, entry) => sum + entry.augmentsAggregated + entry.championPairsPersisted, 0) +
        brokenScoreGeneration.reduce((sum, entry) => sum + entry.scoresPersisted, 0);
      const result = {
        jobId: job.jobId,
        runId: run.id,
        patchId: input.patchId,
        modes,
        championId: input.championId,
        matchIngestion,
        phases: {
          championAggregation,
          buildAggregation,
          augmentAggregation,
          brokenScoreGeneration
        },
        recordsProcessed
      } satisfies AggregationPipelineResult;

      await this.ingestionRunsRepository.completeRun({
        runId: run.id,
        recordsProcessed,
        metadata: resultMetadata(result)
      });
      await this.ingestionJobsRepository.markSucceeded(job.jobId, resultMetadata(result));

      this.logger.info("Completed aggregation pipeline.", {
        jobId: job.jobId,
        runId: run.id,
        patchId: input.patchId,
        recordsProcessed
      });

      return result;
    } catch (error) {
      const databaseError = toDatabaseError(error, "Aggregation pipeline failed");

      this.logger.error("Aggregation pipeline failed.", {
        error: databaseError.message,
        jobId: job.jobId,
        runId: run.id,
        patchId: input.patchId
      });

      await this.ingestionRunsRepository.failRun({
        runId: run.id,
        error: databaseError,
        metadata: toJsonValue({ jobId: job.jobId, patchId: input.patchId, modes, championId: input.championId })
      });
      await this.ingestionJobsRepository.markFailed({
        jobId: job.jobId,
        status: "retryable_failed",
        error: databaseError
      });

      throw databaseError;
    }
  }

  private async runMatchIngestionPhase({
    parentJobId,
    parentRunId,
    patchId,
    input
  }: {
    parentJobId: string;
    parentRunId: string;
    patchId: string;
    input: RunAggregationPipelineInput;
  }): Promise<MatchIngestionPipelineResult> {
    const run = await this.ingestionRunsRepository.startRun({
      patchId,
      source: "match-ingestion:pipeline",
      metadata: toJsonValue({
        parentJobId,
        parentRunId,
        input: input.matchIngestion ?? {}
      })
    });

    try {
      const discoverySources = input.matchIngestion?.discoverySources ?? [];
      const seedPuuids = uniqueDiscoveryPuuids(discoverySources);
      const discoveryResults = [];
      const discoveredMatchIds: string[] = [];

      this.logger.info("Prepared match ingestion discovery sources.", {
        parentJobId,
        patchId,
        seedPuuidCount: seedPuuids.length,
        seedPuuids: seedPuuids.join(","),
        discoverySourceCount: discoverySources.length,
        regionalRouting: input.matchIngestion?.regionalRouting
      });

      for (const [index, source] of discoverySources.entries()) {
        const result = await this.runDiscoveryJob({
          parentJobId,
          patchId,
          source,
          index
        });

        discoveryResults.push(result);
        discoveredMatchIds.push(...result.matchIds);
      }

      const requestedMatchIds = uniqueValues([
        ...(input.matchIngestion?.matchIds ?? []),
        ...discoveredMatchIds
      ]);
      const limitedMatchIds = typeof input.matchIngestion?.maxMatches === "number"
        ? requestedMatchIds.slice(0, input.matchIngestion.maxMatches)
        : requestedMatchIds;
      const persistedMatches = [];
      const failedMatches: MatchIngestionPipelineResult["failedMatches"] = [];
      const skippedMatches: MatchIngestionPipelineResult["debug"]["skippedMatches"] = [];
      let participantsPersisted = 0;

      if (!limitedMatchIds.length) {
        const reason = discoverySources.length
          ? "Riot Match-V5 returned zero match IDs for the configured PUUID, queue, and time-window filters."
          : "No match ingestion discovery sources or explicit match IDs were provided. Use kind=daily or provide matchIngestion.matchIds.";

        skippedMatches.push({ reason });
        this.logger.warn("Match ingestion phase has no match IDs to process.", {
          parentJobId,
          patchId,
          seedPuuidCount: seedPuuids.length,
          discoverySourceCount: discoverySources.length,
          reason
        });
      }

      for (const riotMatchId of limitedMatchIds) {
        try {
          const persisted = await this.runFetchAndPersistJob({
            parentJobId,
            patchId,
            ingestionRunId: run.id,
            riotMatchId,
            regionalRouting: input.matchIngestion?.regionalRouting
          });

          persistedMatches.push(persisted);
          participantsPersisted += persisted.participantsPersisted;
        } catch (error) {
          failedMatches.push({
            riotMatchId,
            error: errorMessage(error)
          });
          skippedMatches.push({
            riotMatchId,
            reason: "Match fetch or persistence failed.",
            error: errorMessage(error)
          });

          if (!input.matchIngestion?.continueOnMatchError) {
            throw error;
          }
        }
      }

      const result = {
        discoveryResults,
        debug: {
          seedPuuidCount: seedPuuids.length,
          seedPuuids,
          discoveryQueries: discoveryResults.map((entry) => ({
            puuid: entry.puuid,
            queueId: entry.queueId,
            regionalRouting: entry.regionalRouting,
            startTime: entry.startTime,
            endTime: entry.endTime,
            start: entry.start,
            count: entry.count,
            matchIdsReturned: entry.matchIds,
            matchCount: entry.matchIds.length
          })),
          fetchedMatches: persistedMatches.map((entry) => ({
            riotMatchId: entry.riotMatchId,
            queueId: entry.queueId,
            mode: entry.mode,
            participantsPersisted: entry.participantsPersisted
          })),
          skippedMatches
        },
        matchIdsDiscovered: discoveredMatchIds.length,
        matchIdsRequested: requestedMatchIds.length,
        matchesAttempted: limitedMatchIds.length,
        matchesPersisted: persistedMatches.length,
        participantsPersisted,
        failedMatches,
        persistedMatches
      } satisfies MatchIngestionPipelineResult;

      await this.ingestionRunsRepository.completeRun({
        runId: run.id,
        recordsProcessed: result.matchesPersisted + result.participantsPersisted,
        metadata: toJsonValue({
          parentJobId,
          parentRunId,
          matchIdsDiscovered: result.matchIdsDiscovered,
          matchIdsRequested: result.matchIdsRequested,
          matchesAttempted: result.matchesAttempted,
          matchesPersisted: result.matchesPersisted,
          participantsPersisted: result.participantsPersisted,
          failedMatches: result.failedMatches.length,
          debug: result.debug
        })
      });

      return result;
    } catch (error) {
      await this.ingestionRunsRepository.failRun({
        runId: run.id,
        error,
        metadata: toJsonValue({ parentJobId, parentRunId })
      });

      throw error;
    }
  }

  private async runDiscoveryJob({
    parentJobId,
    patchId,
    source,
    index
  }: {
    parentJobId: string;
    patchId: string;
    source: AggregationPipelineMatchDiscoverySource;
    index: number;
  }) {
    const job: MatchDiscoveryJob = {
      type: "match-discovery",
      jobId: childJobId(parentJobId, "match-discovery", index),
      puuid: source.puuid,
      queueId: source.queueId,
      regionalRouting: source.regionalRouting,
      startTime: source.startTime,
      endTime: source.endTime,
      start: source.start,
      count: source.count
    };

    await this.ingestionJobsRepository.upsertJob({
      job,
      patchId,
      status: "queued",
      metadata: toJsonValue({ parentJobId, ...job })
    });
    await this.ingestionJobsRepository.markRunning(job.jobId);

    try {
      const result = await this.matchIngestionService.fetchMatchIdsByQueue(job);

      this.logger.info("Riot Match-V5 discovery returned match IDs.", {
        jobId: job.jobId,
        puuid: job.puuid,
        queueId: job.queueId,
        regionalRouting: result.regionalRouting,
        matchCount: result.matchIds.length,
        matchIds: result.matchIds.join(",")
      });

      await this.ingestionJobsRepository.markSucceeded(
        job.jobId,
        toJsonValue({
          parentJobId,
          puuid: result.puuid,
          queueId: result.queueId,
          regionalRouting: result.regionalRouting,
          startTime: result.startTime,
          endTime: result.endTime,
          start: result.start,
          count: result.count,
          matchesDiscovered: result.matchIds.length,
          matchIds: result.matchIds
        })
      );

      return result;
    } catch (error) {
      const failure = failureStatus(error);

      await this.ingestionJobsRepository.markFailed({
        jobId: job.jobId,
        status: failure.status,
        error,
        nextAttemptAt: failure.nextAttemptAt
      });

      throw error;
    }
  }

  private async runFetchAndPersistJob({
    parentJobId,
    patchId,
    ingestionRunId,
    riotMatchId,
    regionalRouting
  }: {
    parentJobId: string;
    patchId: string;
    ingestionRunId: string;
    riotMatchId: string;
    regionalRouting?: MatchFetchJob["regionalRouting"];
  }) {
    const job: MatchFetchJob = {
      type: "match-fetch",
      jobId: childJobId(parentJobId, "match-fetch", riotMatchId),
      riotMatchId,
      regionalRouting
    };

    await this.ingestionJobsRepository.upsertJob({
      job,
      patchId,
      status: "queued",
      metadata: toJsonValue({ parentJobId, ...job })
    });
    await this.ingestionJobsRepository.markRunning(job.jobId);

    try {
      const result = await this.matchIngestionService.fetchAndNormalizeMatch(job);

      this.logger.info("Riot Match-V5 detail fetched for ingestion.", {
        jobId: job.jobId,
        riotMatchId,
        queueId: result.match.queueId,
        mode: result.match.mode,
        regionalRouting: result.match.regionalRouting,
        participantCount: result.match.participants.length
      });

      const persisted = await this.matchPersistenceRepository.persistNormalizedMatch({
        match: result.match,
        patchId,
        ingestionRunId,
        jobId: job.jobId
      });

      await this.ingestionJobsRepository.markSucceeded(
        job.jobId,
        toJsonValue({
          parentJobId,
          riotMatchId,
          queueId: result.match.queueId,
          mode: result.match.mode,
          participantsPersisted: persisted.participantsPersisted
        })
      );

      return persisted;
    } catch (error) {
      const failure = failureStatus(error);

      await this.ingestionJobsRepository.markFailed({
        jobId: job.jobId,
        status: failure.status,
        error,
        nextAttemptAt: failure.nextAttemptAt
      });

      throw error;
    }
  }
}

export function createAggregationPipelineRunner(options?: AggregationPipelineRunnerOptions) {
  return new AggregationPipelineRunner(options);
}
