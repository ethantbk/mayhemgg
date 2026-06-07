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

function readQueueIds(name: string, value: string | undefined, fallback: number[]) {
  if (!value) return fallback;

  const queueIds = value
    .split(",")
    .map((entry) => Number.parseInt(entry.trim(), 10))
    .filter((queueId) => Number.isFinite(queueId) && queueId > 0);

  if (!queueIds.length) {
    throw new Error(`${name} must contain at least one positive integer queue ID.`);
  }

  return [...new Set(queueIds)];
}

export function getDefaultMatchNormalizationOptions(): MatchNormalizationOptions {
  const arenaQueueId = readQueueId("RIOT_ARENA_QUEUE_ID", process.env.RIOT_ARENA_QUEUE_ID, 1700);
  const aramMayhemQueueId = readQueueId("RIOT_ARAM_MAYHEM_QUEUE_ID", process.env.RIOT_ARAM_MAYHEM_QUEUE_ID, 2400);

  return {
    arenaQueueId,
    aramMayhemQueueId,
    arenaQueueIds: readQueueIds("RIOT_ARENA_QUEUE_IDS", process.env.RIOT_ARENA_QUEUE_IDS, [...new Set([arenaQueueId, 1710])]),
    aramMayhemQueueIds: readQueueIds("RIOT_ARAM_MAYHEM_QUEUE_IDS", process.env.RIOT_ARAM_MAYHEM_QUEUE_IDS, [aramMayhemQueueId])
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

    const unfilteredMatchIds = await this.matchClient.getMatchIdsByPuuidAndQueue({
      puuid: job.puuid,
      regionalRouting,
      startTime: job.startTime,
      endTime: job.endTime,
      start: job.start,
      count: job.count
    });
    const matchIds: string[] = [];
    const queueIdsFound: number[] = [];
    const skippedMatches: MatchDiscoveryJobResult["skippedMatches"] = [];

    this.logger.info("Fetched recent Match-V5 IDs without queue filter for local queue filtering.", {
      jobId: job.jobId,
      queueId: job.queueId,
      regionalRouting,
      unfilteredMatchCount: unfilteredMatchIds.length,
      unfilteredMatchIds: unfilteredMatchIds.join(",")
    });

    for (const riotMatchId of unfilteredMatchIds) {
      const match = await this.matchClient.getMatchDetails(riotMatchId, regionalRouting);
      const foundQueueId = match.info.queueId;

      queueIdsFound.push(foundQueueId);

      if (foundQueueId === job.queueId) {
        matchIds.push(riotMatchId);
      } else {
        skippedMatches.push({
          riotMatchId,
          queueId: foundQueueId,
          gameMode: match.info.gameMode,
          reason: `Match queueId ${foundQueueId} did not match requested queueId ${job.queueId}.`
        });
      }
    }

    this.logger.info("Completed match ID discovery job.", {
      jobId: job.jobId,
      queueId: job.queueId,
      regionalRouting,
      matchesDiscovered: matchIds.length,
      queueIdsFound: queueIdsFound.join(","),
      skippedMatchCount: skippedMatches.length
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
      discoveryStrategy: "unfiltered-matchlist-local-queue-filter",
      unfilteredMatchIds,
      queueIdsFound,
      skippedMatches,
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
