import "server-only";

import { isSupabasePublicConfigAvailable } from "@/lib/supabase/config";
import { toDatabaseError } from "@/lib/supabase/errors";
import { createLogger, type Logger } from "@/server/logging/logger";
import {
  createAggregationPipelineRunner,
  type AggregationPipelineMatchIngestionOptions,
  type AggregationPipelineMode,
  type AggregationPipelineRunner,
  type RunAggregationPipelineInput
} from "@/server/pipeline";
import { isRiotServiceConfigured } from "@/server/riot";
import { getDefaultMatchNormalizationOptions } from "@/server/ingestion";
import {
  createRefreshStatusRepository,
  type RefreshStatusRepository
} from "@/server/refresh/refreshStatusRepository";
import type {
  ChampionRefreshRunInput,
  RefreshHealthReport,
  RefreshRunInput,
  RefreshRunResult,
  RefreshStatusReport
} from "@/server/refresh/refreshModels";
import type { DbPatch } from "@/types/database";

export type ScheduledRefreshServiceOptions = {
  pipelineRunner?: AggregationPipelineRunner;
  refreshStatusRepository?: RefreshStatusRepository;
  logger?: Logger;
};

function parsePositiveInteger(name: string, value: string | undefined, fallback: number) {
  if (!value) return fallback;

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }

  return parsed;
}

function parseSeedPuuids() {
  return (process.env.RIOT_REFRESH_PUUIDS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function uniqueNumbers(values: number[]) {
  return [...new Set(values.filter((value) => Number.isFinite(value) && value > 0))];
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function dailyMatchIngestionOptions(modes: AggregationPipelineMode[]): AggregationPipelineMatchIngestionOptions {
  const puuids = parseSeedPuuids();
  const count = Math.min(parsePositiveInteger("RIOT_REFRESH_MATCH_COUNT", process.env.RIOT_REFRESH_MATCH_COUNT, 50), 100);
  const pageCount = parsePositiveInteger("RIOT_REFRESH_MATCH_PAGES", process.env.RIOT_REFRESH_MATCH_PAGES, 3);
  const lookbackHours = parsePositiveInteger("RIOT_REFRESH_LOOKBACK_HOURS", process.env.RIOT_REFRESH_LOOKBACK_HOURS, 24);
  const endTime = Math.floor(Date.now() / 1000);
  const startTime = endTime - lookbackHours * 60 * 60;
  const queueIds = getDefaultMatchNormalizationOptions();
  const modeQueueIds: Record<AggregationPipelineMode, number[]> = {
    arena: queueIds.arenaQueueIds,
    aram_mayhem: queueIds.aramMayhemQueueIds
  };
  const targetQueueIds = uniqueNumbers(modes.flatMap((mode) => modeQueueIds[mode]));

  if (!targetQueueIds.length) {
    throw new Error("Daily refresh requires at least one target Riot queue ID.");
  }

  return {
    discoverySources: puuids.flatMap((puuid) =>
      Array.from({ length: pageCount }, (_, pageIndex) => ({
        puuid,
        queueId: targetQueueIds[0],
        queueIds: targetQueueIds,
        startTime,
        endTime,
        start: pageIndex * count,
        count
      }))
    ),
    continueOnMatchError: true
  };
}

export class ScheduledRefreshService {
  private pipelineRunner: AggregationPipelineRunner;
  private refreshStatusRepository: RefreshStatusRepository;
  private logger: Logger;

  constructor(options: ScheduledRefreshServiceOptions = {}) {
    this.pipelineRunner = options.pipelineRunner ?? createAggregationPipelineRunner();
    this.refreshStatusRepository = options.refreshStatusRepository ?? createRefreshStatusRepository();
    this.logger = options.logger ?? createLogger({ component: "scheduled-refresh" });
  }

  async runDailyRefresh(input: RefreshRunInput = {}): Promise<RefreshRunResult> {
    const patch = await this.resolvePatch(input);
    const modes = input.modes?.length ? input.modes : undefined;
    const resolvedModes = modes ?? ["arena", "aram_mayhem"];
    const seedPuuids = parseSeedPuuids();

    this.logger.info("Loaded RIOT_REFRESH_PUUIDS for daily refresh.", {
      seedPuuidCount: seedPuuids.length,
      seedPuuids: seedPuuids.join(","),
      modes: resolvedModes.join(","),
      matchCountPerPage: Math.min(parsePositiveInteger("RIOT_REFRESH_MATCH_COUNT", process.env.RIOT_REFRESH_MATCH_COUNT, 50), 100),
      matchPageCount: parsePositiveInteger("RIOT_REFRESH_MATCH_PAGES", process.env.RIOT_REFRESH_MATCH_PAGES, 3),
      lookbackHours: parsePositiveInteger("RIOT_REFRESH_LOOKBACK_HOURS", process.env.RIOT_REFRESH_LOOKBACK_HOURS, 24)
    });

    return this.runPipeline("daily", patch, {
      ...input,
      patchId: patch.id,
      modes,
      jobId: `daily-refresh:${patch.id}:${todayKey()}`,
      matchIngestion: input.matchIngestion ?? dailyMatchIngestionOptions(resolvedModes)
    });
  }

  async runManualRefresh(input: RefreshRunInput = {}): Promise<RefreshRunResult> {
    const patch = await this.resolvePatch(input);

    return this.runPipeline("manual", patch, {
      ...input,
      patchId: patch.id,
      jobId: `manual-refresh:${patch.id}`
    });
  }

  async runChampionRefresh(input: ChampionRefreshRunInput): Promise<RefreshRunResult> {
    const patch = await this.resolvePatch(input);

    return this.runPipeline("champion", patch, {
      ...input,
      patchId: patch.id,
      championId: input.championId,
      jobId: `champion-refresh:${patch.id}:${input.championId}`
    });
  }

  async getStatusReport(limit = 20): Promise<RefreshStatusReport> {
    const [patch, runningJobs, recentJobs, recentRuns] = await Promise.all([
      this.refreshStatusRepository.getActivePatch(),
      this.refreshStatusRepository.getRunningJobs(limit),
      this.refreshStatusRepository.getRecentJobs(limit),
      this.refreshStatusRepository.getRecentRuns(limit)
    ]);

    return {
      patch,
      runningJobs,
      recentJobs,
      recentRuns
    };
  }

  async getHealthReport(): Promise<RefreshHealthReport> {
    const supabaseConfigured = isSupabasePublicConfigAvailable() && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
    const riotConfigured = isRiotServiceConfigured();

    if (!supabaseConfigured) {
      return {
        ok: false,
        patch: null,
        runningJobs: [],
        recentJobs: [],
        recentRuns: [],
        checks: {
          supabaseConfigured,
          riotConfigured,
          activePatchAvailable: false,
          pipelineRunning: false,
          lastRunSucceeded: null
        }
      };
    }

    const status = await this.getStatusReport(10);
    const latestRun = status.recentRuns[0];
    const pipelineRunning = status.runningJobs.some((job) => job.jobType === "aggregation-pipeline");
    const health = {
      ...status,
      ok: supabaseConfigured && riotConfigured && Boolean(status.patch) && !pipelineRunning,
      checks: {
        supabaseConfigured,
        riotConfigured,
        activePatchAvailable: Boolean(status.patch),
        pipelineRunning,
        lastRunSucceeded: latestRun ? latestRun.status === "succeeded" : null
      }
    } satisfies RefreshHealthReport;

    return health;
  }

  private async resolvePatch(input: Pick<RefreshRunInput, "patchId" | "patchVersion">): Promise<DbPatch> {
    const patch = input.patchId
      ? await this.refreshStatusRepository.getPatchById(input.patchId)
      : input.patchVersion
        ? await this.refreshStatusRepository.getPatchByVersion(input.patchVersion)
        : await this.refreshStatusRepository.getActivePatch();

    if (!patch) {
      throw new Error(input.patchId || input.patchVersion ? "Requested patch was not found." : "No active patch is available for refresh.");
    }

    return patch;
  }

  private async runPipeline(
    kind: RefreshRunResult["kind"],
    patch: DbPatch,
    input: RunAggregationPipelineInput
  ): Promise<RefreshRunResult> {
    this.logger.info("Starting scheduled refresh run.", {
      kind,
      patchId: patch.id,
      patchVersion: patch.version,
      championId: input.championId
    });

    try {
      const result = await this.pipelineRunner.runPipeline(input);

      this.logger.info("Completed scheduled refresh run.", {
        kind,
        patchId: patch.id,
        recordsProcessed: result.recordsProcessed
      });

      return {
        kind,
        patch,
        result
      };
    } catch (error) {
      const databaseError = toDatabaseError(error, "Scheduled refresh failed");

      this.logger.error("Scheduled refresh run failed.", {
        kind,
        patchId: patch.id,
        error: databaseError.message
      });

      throw databaseError;
    }
  }
}

export function createScheduledRefreshService(options?: ScheduledRefreshServiceOptions) {
  return new ScheduledRefreshService(options);
}
