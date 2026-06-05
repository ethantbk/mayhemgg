import "server-only";

import { toDatabaseError } from "@/lib/supabase/errors";
import { createLogger, type Logger } from "@/server/logging/logger";
import {
  calculateBrokenScore,
  generatedTierFromBrokenScore,
  placementComponent,
  sampleConfidence
} from "@/server/aggregation/brokenScoreCalculator";
import {
  BrokenScoreRepository,
  type ChampionStatisticForBrokenScore,
  createBrokenScoreRepository
} from "@/server/aggregation/brokenScoreRepository";
import type {
  BrokenScoreInputs,
  BrokenScoreJob,
  BrokenScoreMode,
  BrokenScoreResult,
  ChampionBrokenScore
} from "@/server/aggregation/brokenScoreModels";
import {
  createIngestionJobsRepository,
  type IngestionJobsRepository
} from "@/server/ingestion/persistence/ingestionJobsRepository";
import {
  createIngestionRunsRepository,
  type IngestionRunsRepository
} from "@/server/ingestion/persistence/ingestionRunsRepository";
import { toJsonValue } from "@/server/ingestion/persistence/json";
import type { DbAugmentBestChampion, DbAugmentStatistic, DbBuild, JsonValue } from "@/types/database";

export type BrokenScoreServiceOptions = {
  brokenScoreRepository?: BrokenScoreRepository;
  ingestionRunsRepository?: IngestionRunsRepository;
  ingestionJobsRepository?: IngestionJobsRepository;
  logger?: Logger;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function round(value: number) {
  return Number(value.toFixed(2));
}

function isJsonObject(value: JsonValue): value is { [key: string]: JsonValue } {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function readRawAveragePlacement(rawData: JsonValue) {
  if (!isJsonObject(rawData)) return null;

  const aggregation = rawData.aggregation;

  if (!isJsonObject(aggregation)) return null;

  const averagePlacement = aggregation.averagePlacement;
  return typeof averagePlacement === "number" ? averagePlacement : null;
}

function buildComponent(builds: DbBuild[]) {
  if (!builds.length) {
    return {
      component: 0,
      brokenBuildId: null
    };
  }

  const rankedBuilds = builds
    .map((build) => {
      const buildPlacement = readRawAveragePlacement(build.rawData);
      const confidence = sampleConfidence(build.sampleSize);
      const component =
        ((build.winRate ?? 50) - 50) * 0.45 +
        (build.pickRate ?? 0) * 0.12 +
        placementComponent(buildPlacement) * 0.35 +
        confidence * 4;

      return {
        build,
        component
      };
    })
    .sort((a, b) => b.component - a.component);

  return {
    component: clamp(rankedBuilds[0]?.component ?? 0, -8, 18),
    brokenBuildId: rankedBuilds[0]?.build.id ?? null
  };
}

function augmentComponent({
  championId,
  augmentStats,
  championPairs
}: {
  championId: string;
  augmentStats: DbAugmentStatistic[];
  championPairs: DbAugmentBestChampion[];
}) {
  const statsById = new Map(augmentStats.map((statistic) => [statistic.id, statistic]));
  const bestPairComponents = championPairs
    .filter((pair) => pair.championId === championId)
    .map((pair) => {
      const stat = statsById.get(pair.augmentStatisticId);
      const globalWinRate = stat?.averageWinRate ?? 50;
      const globalPickRate = stat?.pickRate ?? 0;

      return {
        component:
          ((pair.winRate ?? globalWinRate) - 50) * 0.28 +
          (pair.pickRate ?? 0) * 0.12 +
          (globalWinRate - 50) * 0.12 +
          globalPickRate * 0.04
      };
    })
    .sort((a, b) => b.component - a.component);

  return clamp(bestPairComponents[0]?.component ?? 0, -6, 14);
}

function championComponent(stat: ChampionStatisticForBrokenScore) {
  return clamp(
    (stat.winRate - 50) * 0.9 +
      stat.pickRate * 0.4 +
      (stat.banRate ?? 0) * 0.25,
    -20,
    30
  );
}

export class BrokenScoreService {
  private brokenScoreRepository: BrokenScoreRepository;
  private ingestionRunsRepository: IngestionRunsRepository;
  private ingestionJobsRepository: IngestionJobsRepository;
  private logger: Logger;

  constructor(options: BrokenScoreServiceOptions = {}) {
    this.brokenScoreRepository = options.brokenScoreRepository ?? createBrokenScoreRepository();
    this.ingestionRunsRepository = options.ingestionRunsRepository ?? createIngestionRunsRepository();
    this.ingestionJobsRepository = options.ingestionJobsRepository ?? createIngestionJobsRepository();
    this.logger = options.logger ?? createLogger({ component: "broken-score" });
  }

  async generateJob(job: BrokenScoreJob): Promise<BrokenScoreResult> {
    await this.ingestionJobsRepository.upsertJob({
      job,
      patchId: job.patchId,
      status: "queued",
      metadata: toJsonValue(job)
    });
    await this.ingestionJobsRepository.markRunning(job.jobId);

    const run = await this.ingestionRunsRepository.startRun({
      patchId: job.patchId,
      source: `broken-score:${job.mode}`,
      metadata: toJsonValue({ jobId: job.jobId, mode: job.mode })
    });

    try {
      const result = await this.generatePatchMode(job.patchId, job.mode, {
        jobId: job.jobId,
        championId: job.championId
      });

      await this.ingestionRunsRepository.completeRun({
        runId: run.id,
        recordsProcessed: result.championsScored,
        metadata: toJsonValue({
          jobId: job.jobId,
          mode: job.mode,
          scoresPersisted: result.scoresPersisted,
          championId: job.championId
        })
      });
      await this.ingestionJobsRepository.markSucceeded(
        job.jobId,
        toJsonValue({
          championsScored: result.championsScored,
          scoresPersisted: result.scoresPersisted,
          championId: job.championId
        })
      );

      return result;
    } catch (error) {
      const databaseError = toDatabaseError(error, "Broken score generation failed");

      this.logger.error("Broken score generation job failed.", {
        error: databaseError.message,
        jobId: job.jobId,
        patchId: job.patchId,
        mode: job.mode,
        championId: job.championId
      });

      await this.ingestionRunsRepository.failRun({
        runId: run.id,
        error: databaseError,
        metadata: toJsonValue({ jobId: job.jobId, mode: job.mode, championId: job.championId })
      });
      await this.ingestionJobsRepository.markFailed({
        jobId: job.jobId,
        status: "retryable_failed",
        error: databaseError
      });

      throw databaseError;
    }
  }

  async generatePatchMode(
    patchId: string,
    mode: BrokenScoreMode,
    options: string | { jobId?: string; championId?: string } = {}
  ): Promise<BrokenScoreResult> {
    const jobId = typeof options === "string" ? options : options.jobId;
    const championId = typeof options === "string" ? undefined : options.championId;

    this.logger.info("Starting broken score generation.", {
      jobId,
      patchId,
      mode,
      championId
    });

    const [championStats, builds, augmentStats] = await Promise.all([
      this.brokenScoreRepository.getChampionStatistics(patchId, mode, championId),
      this.brokenScoreRepository.getBuilds(patchId, mode, championId),
      this.brokenScoreRepository.getAugmentStatistics(patchId, mode)
    ]);
    const championPairs = await this.brokenScoreRepository.getAugmentBestChampions(augmentStats.map((stat) => stat.id));
    const buildsByChampionId = new Map<string, DbBuild[]>();

    builds.forEach((build) => {
      const current = buildsByChampionId.get(build.championId) ?? [];
      current.push(build);
      buildsByChampionId.set(build.championId, current);
    });

    const scores = championStats.map((stat) =>
      this.scoreChampion({
        stat,
        mode,
        builds: buildsByChampionId.get(stat.championId) ?? [],
        augmentStats,
        championPairs
      })
    );
    const persistence = await this.brokenScoreRepository.persistBrokenScores(scores, championStats);
    const result = {
      jobId,
      patchId,
      mode,
      championsScored: scores.length,
      scoresPersisted: persistence.scoresPersisted,
      scores
    } satisfies BrokenScoreResult;

    this.logger.info("Completed broken score generation.", {
      jobId,
      patchId,
      mode,
      championsScored: result.championsScored,
      scoresPersisted: result.scoresPersisted,
      championId
    });

    return result;
  }

  private scoreChampion({
    stat,
    mode,
    builds,
    augmentStats,
    championPairs
  }: {
    stat: ChampionStatisticForBrokenScore;
    mode: BrokenScoreMode;
    builds: DbBuild[];
    augmentStats: DbAugmentStatistic[];
    championPairs: DbAugmentBestChampion[];
  }): ChampionBrokenScore {
    const confidence = sampleConfidence(stat.gamesPlayed);
    const champion = championComponent(stat);
    const build = buildComponent(builds);
    const augment = augmentComponent({
      championId: stat.championId,
      augmentStats,
      championPairs
    });
    const placement = placementComponent(stat.averagePlacement);
    const confidenceComponent = confidence * 9;
    const inputs: BrokenScoreInputs = {
      winRate: stat.winRate,
      pickRate: stat.pickRate,
      banRate: stat.banRate,
      averagePlacement: stat.averagePlacement,
      gamesPlayed: stat.gamesPlayed,
      sampleConfidence: round(confidence),
      championComponent: round(champion),
      buildComponent: round(build.component),
      augmentComponent: round(augment),
      placementComponent: round(placement),
      confidenceComponent: round(confidenceComponent)
    };
    const brokenScore = calculateBrokenScore(inputs);

    return {
      patchId: stat.patchId,
      championId: stat.championId,
      mode,
      brokenScore,
      generatedTier: generatedTierFromBrokenScore(brokenScore),
      brokenBuildId: build.brokenBuildId,
      inputs
    };
  }
}

export function createBrokenScoreService(options?: BrokenScoreServiceOptions) {
  return new BrokenScoreService(options);
}
