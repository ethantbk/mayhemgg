import "server-only";

import { toDatabaseError } from "@/lib/supabase/errors";
import { createLogger, type Logger } from "@/server/logging/logger";
import {
  type AggregatedChampionStatistic,
  type ChampionAggregationJob,
  type ChampionAggregationMode,
  type ChampionAggregationResult
} from "@/server/aggregation/championAggregationModels";
import {
  calculateTierScoreInputs,
  tierFromScore
} from "@/server/aggregation/championTierScoring";
import {
  ChampionStatisticsRepository,
  createChampionStatisticsRepository
} from "@/server/aggregation/championStatisticsRepository";
import {
  createIngestionJobsRepository,
  type IngestionJobsRepository
} from "@/server/ingestion/persistence/ingestionJobsRepository";
import {
  createIngestionRunsRepository,
  type IngestionRunsRepository
} from "@/server/ingestion/persistence/ingestionRunsRepository";
import { toJsonValue } from "@/server/ingestion/persistence/json";
import type { DbChampion, DbRiotMatch, DbRiotMatchParticipant } from "@/types/database";

type ChampionCounter = {
  champion: DbChampion;
  gamesPlayed: number;
  wins: number;
  bans: number;
  placements: number[];
};

export type ChampionAggregationServiceOptions = {
  statisticsRepository?: ChampionStatisticsRepository;
  ingestionRunsRepository?: IngestionRunsRepository;
  ingestionJobsRepository?: IngestionJobsRepository;
  logger?: Logger;
};

function roundRate(value: number) {
  return Number(value.toFixed(2));
}

function average(values: number[]) {
  if (!values.length) return null;
  return roundRate(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function extractBannedChampionIds(match: DbRiotMatch) {
  if (!isRecord(match.rawData)) return [];

  const info = match.rawData.info;

  if (!isRecord(info)) return [];

  const teams = info.teams;

  if (!Array.isArray(teams)) return [];

  return teams.flatMap((team) => {
    if (!isRecord(team)) return [];

    const bans = team.bans;

    if (!Array.isArray(bans)) return [];

    return bans.flatMap((ban) => {
      if (!isRecord(ban)) return [];

      const championId = ban.championId;
      return typeof championId === "number" && championId > 0 ? [championId] : [];
    });
  });
}

function createCounters(champions: DbChampion[]) {
  const counters = new Map<number, ChampionCounter>();

  champions
    .filter((champion) => champion.riotKey !== null)
    .forEach((champion) => {
      counters.set(champion.riotKey as number, {
        champion,
        gamesPlayed: 0,
        wins: 0,
        bans: 0,
        placements: []
      });
    });

  return counters;
}

export class ChampionAggregationService {
  private statisticsRepository: ChampionStatisticsRepository;
  private ingestionRunsRepository: IngestionRunsRepository;
  private ingestionJobsRepository: IngestionJobsRepository;
  private logger: Logger;

  constructor(options: ChampionAggregationServiceOptions = {}) {
    this.statisticsRepository = options.statisticsRepository ?? createChampionStatisticsRepository();
    this.ingestionRunsRepository = options.ingestionRunsRepository ?? createIngestionRunsRepository();
    this.ingestionJobsRepository = options.ingestionJobsRepository ?? createIngestionJobsRepository();
    this.logger = options.logger ?? createLogger({ component: "champion-aggregation" });
  }

  async aggregateJob(job: ChampionAggregationJob): Promise<ChampionAggregationResult> {
    await this.ingestionJobsRepository.upsertJob({
      job,
      patchId: job.patchId,
      status: "queued",
      metadata: toJsonValue(job)
    });
    await this.ingestionJobsRepository.markRunning(job.jobId);

    const run = await this.ingestionRunsRepository.startRun({
      patchId: job.patchId,
      source: `champion-statistics:${job.mode}`,
      metadata: toJsonValue({ jobId: job.jobId, mode: job.mode })
    });

    try {
      const result = await this.aggregatePatchMode(job.patchId, job.mode, {
        jobId: job.jobId,
        championId: job.championId
      });

      await this.ingestionRunsRepository.completeRun({
        runId: run.id,
        recordsProcessed: result.participantsProcessed,
        metadata: toJsonValue({
          jobId: job.jobId,
          mode: job.mode,
          championId: job.championId,
          matchesProcessed: result.matchesProcessed,
          participantsProcessed: result.participantsProcessed,
          championsAggregated: result.championsAggregated,
          statsPersisted: result.statsPersisted
        })
      });
      await this.ingestionJobsRepository.markSucceeded(
        job.jobId,
        toJsonValue({
          matchesProcessed: result.matchesProcessed,
          participantsProcessed: result.participantsProcessed,
          championsAggregated: result.championsAggregated,
          statsPersisted: result.statsPersisted
        })
      );

      return result;
    } catch (error) {
      const databaseError = toDatabaseError(error, "Champion statistics aggregation failed");

      this.logger.error("Champion statistics aggregation job failed.", {
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

  async aggregatePatchMode(
    patchId: string,
    mode: ChampionAggregationMode,
    options: string | { jobId?: string; championId?: string } = {}
  ): Promise<ChampionAggregationResult> {
    const jobId = typeof options === "string" ? options : options.jobId;
    const championId = typeof options === "string" ? undefined : options.championId;

    this.logger.info("Starting champion statistics aggregation.", {
      jobId,
      patchId,
      mode,
      championId
    });

    const [champions, matches] = await Promise.all([
      this.statisticsRepository.getChampions(),
      this.statisticsRepository.getMatchesForPatchAndMode(patchId, mode)
    ]);
    const participants = await this.statisticsRepository.getParticipantsForMatches(matches.map((match) => match.id));

    this.logger.info("Loaded champion aggregation inputs.", {
      jobId,
      patchId,
      mode,
      championsLoaded: champions.length,
      championsWithRiotKey: champions.filter((champion) => champion.riotKey !== null).length,
      matchesProcessed: matches.length,
      queueIds: [...new Set(matches.map((match) => match.queueId))].join(","),
      participantsProcessed: participants.length
    });

    const statistics = this.aggregateStatistics({
      patchId,
      mode,
      champions,
      matches,
      participants,
      championId
    });
    const persistResult = await this.statisticsRepository.persistChampionStatistics(mode, statistics);

    this.logger.info("Persisted champion aggregation output.", {
      jobId,
      patchId,
      mode,
      matchesProcessed: matches.length,
      participantsProcessed: participants.length,
      championsAggregated: statistics.length,
      statsPersisted: persistResult.rowsPersisted
    });

    const result = {
      jobId,
      patchId,
      mode,
      matchesProcessed: matches.length,
      participantsProcessed: participants.length,
      championsAggregated: statistics.length,
      statsPersisted: persistResult.rowsPersisted,
      statistics
    } satisfies ChampionAggregationResult;

    this.logger.info("Completed champion statistics aggregation.", {
      jobId,
      patchId,
      mode,
      matchesProcessed: result.matchesProcessed,
      participantsProcessed: result.participantsProcessed,
      championsAggregated: result.championsAggregated,
      statsPersisted: result.statsPersisted,
      championId
    });

    return result;
  }

  private aggregateStatistics({
    patchId,
    mode,
    champions,
    matches,
    participants,
    championId
  }: {
    patchId: string;
    mode: ChampionAggregationMode;
    champions: DbChampion[];
    matches: DbRiotMatch[];
    participants: DbRiotMatchParticipant[];
    championId?: string;
  }): AggregatedChampionStatistic[] {
    const counters = createCounters(championId ? champions.filter((champion) => champion.id === championId) : champions);
    const totalModeParticipants = participants.length;
    const totalModeMatches = matches.length;

    participants.forEach((participant) => {
      const counter = counters.get(participant.riotChampionId);

      if (!counter) return;

      counter.gamesPlayed += 1;
      counter.wins += participant.won ? 1 : 0;

      if (participant.placement !== null) {
        counter.placements.push(participant.placement);
      }
    });

    if (mode === "arena") {
      matches
        .flatMap(extractBannedChampionIds)
        .forEach((championId) => {
          const counter = counters.get(championId);

          if (counter) {
            counter.bans += 1;
          }
        });
    }

    return [...counters.values()]
      .filter((counter) => counter.gamesPlayed > 0)
      .map((counter) => {
        const winRate = roundRate((counter.wins / counter.gamesPlayed) * 100);
        const pickRate = totalModeParticipants
          ? roundRate((counter.gamesPlayed / totalModeParticipants) * 100)
          : 0;
        const banRate = mode === "arena" && totalModeMatches
          ? roundRate((counter.bans / totalModeMatches) * 100)
          : null;
        const tierScoreInputs = calculateTierScoreInputs({
          winRate,
          pickRate,
          banRate,
          gamesPlayed: counter.gamesPlayed,
          wins: counter.wins,
          totalModeParticipants,
          totalModeMatches
        });

        return {
          patchId,
          championId: counter.champion.id,
          riotChampionId: counter.champion.riotKey ?? 0,
          mode,
          tier: tierFromScore(tierScoreInputs.score),
          winRate,
          pickRate,
          banRate,
          gamesPlayed: counter.gamesPlayed,
          wins: counter.wins,
          averagePlacement: average(counter.placements),
          tierScoreInputs
        } satisfies AggregatedChampionStatistic;
      });
  }
}

export function createChampionAggregationService(options?: ChampionAggregationServiceOptions) {
  return new ChampionAggregationService(options);
}
