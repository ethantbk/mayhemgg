import "server-only";

import { createLogger, type Logger } from "@/server/logging/logger";
import { getRiotConfig } from "@/server/riot/config";
import { createRiotMatchClient, type RiotMatchClient } from "@/server/riot/matchClient";
import type { RiotRegionalRouting } from "@/server/riot/types";
import { normalizeMatch } from "@/server/ingestion/matchNormalizer";
import type { MatchNormalizationOptions, NormalizedMatch, NormalizedMatchParticipant } from "@/server/ingestion/matchModels";
import type {
  MatchDiscoveryJob,
  MatchDiscoveryJobResult,
  MatchFetchJob,
  MatchFetchJobResult
} from "@/server/ingestion/matchIngestionJobs";

export type MatchIngestionServiceOptions = {
  matchClient?: RiotMatchClient;
  logger?: Logger;
  normalization?: Partial<MatchNormalizationOptions>;
};

function readQueueId(name: string, value: string | undefined, fallback: number) {
  if (!value) return fallback;

  const queueId = Number.parseInt(value, 10);

  if (!Number.isFinite(queueId) || queueId <= 0) {
    throw new Error(`${name} must be a positive integer queue ID.`);
  }

  return queueId;
}

export function getDefaultMatchNormalizationOptions(): MatchNormalizationOptions {
  return {
    arenaQueueId: readQueueId("RIOT_ARENA_QUEUE_ID", process.env.RIOT_ARENA_QUEUE_ID, 1700),
    aramMayhemQueueId: readQueueId("RIOT_ARAM_MAYHEM_QUEUE_ID", process.env.RIOT_ARAM_MAYHEM_QUEUE_ID, 450)
  };
}

export class MatchIngestionService {
  private matchClient: RiotMatchClient;
  private logger: Logger;
  private normalization: MatchNormalizationOptions;

  constructor(options: MatchIngestionServiceOptions = {}) {
    this.matchClient = options.matchClient ?? createRiotMatchClient();
    this.logger = options.logger ?? createLogger({ component: "match-ingestion" });
    this.normalization = {
      ...getDefaultMatchNormalizationOptions(),
      ...options.normalization
    };
  }

  async fetchMatchIdsByQueue(job: MatchDiscoveryJob): Promise<MatchDiscoveryJobResult> {
    const regionalRouting = job.regionalRouting ?? getRiotConfig().defaultRegionalRouting;

    this.logger.info("Starting match ID discovery job.", {
      jobId: job.jobId,
      puuid: job.puuid,
      queueId: job.queueId,
      regionalRouting,
      startTime: job.startTime,
      endTime: job.endTime,
      start: job.start,
      count: job.count ?? 20
    });

    const matchIds = await this.matchClient.getMatchIdsByPuuidAndQueue({
      puuid: job.puuid,
      queue: job.queueId,
      regionalRouting,
      startTime: job.startTime,
      endTime: job.endTime,
      start: job.start,
      count: job.count
    });

    this.logger.info("Completed match ID discovery job.", {
      jobId: job.jobId,
      queueId: job.queueId,
      regionalRouting,
      matchesDiscovered: matchIds.length
    });

    return {
      jobId: job.jobId,
      puuid: job.puuid,
      queueId: job.queueId,
      regionalRouting,
      startTime: job.startTime,
      endTime: job.endTime,
      start: job.start,
      count: job.count,
      matchIds
    };
  }

  async fetchAndNormalizeMatch(job: MatchFetchJob): Promise<MatchFetchJobResult> {
    const regionalRouting = job.regionalRouting ?? getRiotConfig().defaultRegionalRouting;

    this.logger.info("Starting match fetch job.", {
      jobId: job.jobId,
      riotMatchId: job.riotMatchId,
      regionalRouting
    });

    const match = await this.fetchMatchDetails(job.riotMatchId, regionalRouting);

    this.logger.info("Completed match fetch job.", {
      jobId: job.jobId,
      riotMatchId: match.riotMatchId,
      queueId: match.queueId,
      mode: match.mode,
      participantCount: match.participants.length
    });

    return {
      jobId: job.jobId,
      match
    };
  }

  async fetchMatchDetails(matchId: string, regionalRouting?: RiotRegionalRouting): Promise<NormalizedMatch> {
    const routing = regionalRouting ?? getRiotConfig().defaultRegionalRouting;
    const match = await this.matchClient.getMatchDetails(matchId, routing);
    return normalizeMatch(match, routing, this.normalization);
  }

  async fetchParticipantData(matchId: string, regionalRouting?: RiotRegionalRouting): Promise<NormalizedMatchParticipant[]> {
    const match = await this.fetchMatchDetails(matchId, regionalRouting);
    return match.participants;
  }
}

export function createMatchIngestionService(options?: MatchIngestionServiceOptions) {
  return new MatchIngestionService(options);
}
