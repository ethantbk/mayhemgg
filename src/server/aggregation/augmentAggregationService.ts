import "server-only";

import { toDatabaseError } from "@/lib/supabase/errors";
import { createLogger, type Logger } from "@/server/logging/logger";
import {
  type AggregatedAugmentStatistic,
  type AggregatedChampionAugmentPair,
  type AugmentAggregationJob,
  type AugmentAggregationMode,
  type AugmentAggregationResult
} from "@/server/aggregation/augmentAggregationModels";
import {
  AugmentAggregationRepository,
  createAugmentAggregationRepository
} from "@/server/aggregation/augmentAggregationRepository";
import {
  createIngestionJobsRepository,
  type IngestionJobsRepository
} from "@/server/ingestion/persistence/ingestionJobsRepository";
import {
  createIngestionRunsRepository,
  type IngestionRunsRepository
} from "@/server/ingestion/persistence/ingestionRunsRepository";
import { toJsonValue } from "@/server/ingestion/persistence/json";
import type { DbAugment, DbChampion, DbRiotMatchParticipant } from "@/types/database";

type AugmentCounter = {
  augment: DbAugment;
  riotAugmentId: number;
  gamesPlayed: number;
  wins: number;
  placements: number[];
  championCounters: Map<string, ChampionAugmentCounter>;
};

type ChampionAugmentCounter = {
  champion: DbChampion;
  riotChampionId: number;
  gamesPlayed: number;
  wins: number;
  placements: number[];
};

export type AugmentAggregationServiceOptions = {
  augmentAggregationRepository?: AugmentAggregationRepository;
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

function parseRiotAugmentId(value: string | null) {
  if (!value) return null;

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function sortChampionPairs(pairA: AggregatedChampionAugmentPair, pairB: AggregatedChampionAugmentPair) {
  const winRateDelta = pairB.winRate - pairA.winRate;
  if (winRateDelta !== 0) return winRateDelta;

  const gamesDelta = pairB.gamesPlayed - pairA.gamesPlayed;
  if (gamesDelta !== 0) return gamesDelta;

  return pairB.pickRate - pairA.pickRate;
}

export class AugmentAggregationService {
  private augmentAggregationRepository: AugmentAggregationRepository;
  private ingestionRunsRepository: IngestionRunsRepository;
  private ingestionJobsRepository: IngestionJobsRepository;
  private logger: Logger;

  constructor(options: AugmentAggregationServiceOptions = {}) {
    this.augmentAggregationRepository = options.augmentAggregationRepository ?? createAugmentAggregationRepository();
    this.ingestionRunsRepository = options.ingestionRunsRepository ?? createIngestionRunsRepository();
    this.ingestionJobsRepository = options.ingestionJobsRepository ?? createIngestionJobsRepository();
    this.logger = options.logger ?? createLogger({ component: "augment-aggregation" });
  }

  async aggregateJob(job: AugmentAggregationJob): Promise<AugmentAggregationResult> {
    await this.ingestionJobsRepository.upsertJob({
      job,
      patchId: job.patchId,
      status: "queued",
      metadata: toJsonValue(job)
    });
    await this.ingestionJobsRepository.markRunning(job.jobId);

    const run = await this.ingestionRunsRepository.startRun({
      patchId: job.patchId,
      source: `augment-aggregation:${job.mode}`,
      metadata: toJsonValue({ jobId: job.jobId, mode: job.mode })
    });

    try {
      const result = await this.aggregatePatchMode(job.patchId, job.mode, {
        jobId: job.jobId,
        maxChampionPairsPerAugment: job.maxChampionPairsPerAugment
      });

      await this.ingestionRunsRepository.completeRun({
        runId: run.id,
        recordsProcessed: result.participantsProcessed,
        metadata: toJsonValue({
          jobId: job.jobId,
          mode: job.mode,
          matchesProcessed: result.matchesProcessed,
          augmentsAggregated: result.augmentsAggregated,
          championPairsPersisted: result.championPairsPersisted
        })
      });
      await this.ingestionJobsRepository.markSucceeded(
        job.jobId,
        toJsonValue({
          matchesProcessed: result.matchesProcessed,
          participantsProcessed: result.participantsProcessed,
          augmentsAggregated: result.augmentsAggregated,
          championPairsPersisted: result.championPairsPersisted
        })
      );

      return result;
    } catch (error) {
      const databaseError = toDatabaseError(error, "Augment aggregation failed");

      this.logger.error("Augment aggregation job failed.", {
        error: databaseError.message,
        jobId: job.jobId,
        patchId: job.patchId,
        mode: job.mode
      });

      await this.ingestionRunsRepository.failRun({
        runId: run.id,
        error: databaseError,
        metadata: toJsonValue({ jobId: job.jobId, mode: job.mode })
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
    mode: AugmentAggregationMode,
    options: { jobId?: string; maxChampionPairsPerAugment?: number } = {}
  ): Promise<AugmentAggregationResult> {
    this.logger.info("Starting augment aggregation.", {
      jobId: options.jobId,
      patchId,
      mode
    });

    const [champions, augments, matches] = await Promise.all([
      this.augmentAggregationRepository.getChampions(),
      this.augmentAggregationRepository.getAugments(),
      this.augmentAggregationRepository.getMatchesForPatchAndMode(patchId, mode)
    ]);
    const participants = await this.augmentAggregationRepository.getParticipantsForMatches(matches.map((match) => match.id));
    const statistics = this.aggregateAugments({
      patchId,
      mode,
      champions,
      augments,
      participants,
      maxChampionPairsPerAugment: options.maxChampionPairsPerAugment ?? 10
    });
    const persistence = await this.augmentAggregationRepository.persistAugmentStatistics(statistics);

    const result = {
      jobId: options.jobId,
      patchId,
      mode,
      matchesProcessed: matches.length,
      participantsProcessed: participants.length,
      augmentsAggregated: statistics.length,
      championPairsPersisted: persistence.championPairsPersisted,
      statistics
    } satisfies AugmentAggregationResult;

    this.logger.info("Completed augment aggregation.", {
      jobId: options.jobId,
      patchId,
      mode,
      matchesProcessed: result.matchesProcessed,
      participantsProcessed: result.participantsProcessed,
      augmentsAggregated: result.augmentsAggregated,
      championPairsPersisted: result.championPairsPersisted
    });

    return result;
  }

  private aggregateAugments({
    patchId,
    mode,
    champions,
    augments,
    participants,
    maxChampionPairsPerAugment
  }: {
    patchId: string;
    mode: AugmentAggregationMode;
    champions: DbChampion[];
    augments: DbAugment[];
    participants: DbRiotMatchParticipant[];
    maxChampionPairsPerAugment: number;
  }): AggregatedAugmentStatistic[] {
    const championsByRiotId = new Map(
      champions
        .filter((champion) => champion.riotKey !== null)
        .map((champion) => [champion.riotKey as number, champion])
    );
    const augmentsByRiotId = new Map(
      augments
        .map((augment) => {
          const riotAugmentId = parseRiotAugmentId(augment.riotAugmentId);
          return riotAugmentId ? ([riotAugmentId, augment] as const) : null;
        })
        .filter((entry): entry is readonly [number, DbAugment] => Boolean(entry))
    );
    const championGameTotals = new Map<string, number>();
    const augmentCounters = new Map<number, AugmentCounter>();

    participants.forEach((participant) => {
      const champion = championsByRiotId.get(participant.riotChampionId);

      if (champion) {
        championGameTotals.set(champion.id, (championGameTotals.get(champion.id) ?? 0) + 1);
      }

      Array.from(new Set(participant.augmentIds)).forEach((riotAugmentId) => {
        const augment = augmentsByRiotId.get(riotAugmentId);

        if (!augment) return;

        const counter = augmentCounters.get(riotAugmentId) ?? {
          augment,
          riotAugmentId,
          gamesPlayed: 0,
          wins: 0,
          placements: [],
          championCounters: new Map<string, ChampionAugmentCounter>()
        };

        counter.gamesPlayed += 1;
        counter.wins += participant.won ? 1 : 0;

        if (participant.placement !== null) {
          counter.placements.push(participant.placement);
        }

        if (champion) {
          const championCounter = counter.championCounters.get(champion.id) ?? {
            champion,
            riotChampionId: participant.riotChampionId,
            gamesPlayed: 0,
            wins: 0,
            placements: []
          };

          championCounter.gamesPlayed += 1;
          championCounter.wins += participant.won ? 1 : 0;

          if (participant.placement !== null) {
            championCounter.placements.push(participant.placement);
          }

          counter.championCounters.set(champion.id, championCounter);
        }

        augmentCounters.set(riotAugmentId, counter);
      });
    });

    return [...augmentCounters.values()]
      .filter((counter) => counter.gamesPlayed > 0)
      .map((counter) => {
        const championPairs = [...counter.championCounters.values()]
          .map((championCounter) => {
            const championGames = championGameTotals.get(championCounter.champion.id) ?? championCounter.gamesPlayed;

            return {
              championId: championCounter.champion.id,
              riotChampionId: championCounter.riotChampionId,
              gamesPlayed: championCounter.gamesPlayed,
              wins: championCounter.wins,
              winRate: roundRate((championCounter.wins / championCounter.gamesPlayed) * 100),
              pickRate: championGames ? roundRate((championCounter.gamesPlayed / championGames) * 100) : 0,
              averagePlacement: average(championCounter.placements)
            } satisfies AggregatedChampionAugmentPair;
          })
          .sort(sortChampionPairs)
          .slice(0, maxChampionPairsPerAugment);

        return {
          patchId,
          augmentId: counter.augment.id,
          riotAugmentId: counter.riotAugmentId,
          mode,
          gamesPlayed: counter.gamesPlayed,
          wins: counter.wins,
          winRate: roundRate((counter.wins / counter.gamesPlayed) * 100),
          pickRate: participants.length ? roundRate((counter.gamesPlayed / participants.length) * 100) : 0,
          averagePlacement: average(counter.placements),
          championPairs
        } satisfies AggregatedAugmentStatistic;
      });
  }
}

export function createAugmentAggregationService(options?: AugmentAggregationServiceOptions) {
  return new AugmentAggregationService(options);
}
