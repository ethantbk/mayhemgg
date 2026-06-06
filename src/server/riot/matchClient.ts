import "server-only";

import { getRiotConfig, type RiotConfig } from "@/server/riot/config";
import { createLogger } from "@/server/logging/logger";
import { createRiotClient, type RiotClient } from "@/server/riot/riotClient";
import type { RiotMatchDto, RiotMatchListQuery } from "@/server/riot/matchTypes";

const logger = createLogger({ component: "riot-match-client" });

function buildRiotUrl(config: RiotConfig, routing: string, path: string, query?: Record<string, string | number | boolean | undefined>) {
  const url = new URL(`${config.apiBaseUrlTemplate.replace("{routing}", routing)}${path}`);

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  });

  return url;
}

export class RiotMatchClient {
  private client: RiotClient;
  private config: RiotConfig;

  constructor(client: RiotClient = createRiotClient(), config: RiotConfig = getRiotConfig()) {
    this.client = client;
    this.config = config;
  }

  async getMatchIdsByPuuidAndQueue(query: RiotMatchListQuery): Promise<string[]> {
    const debugRequest = this.getMatchListDebugRequest(query);

    logger.info("Sending Riot Match-V5 matchlist request.", {
      url: debugRequest.url,
      regionalRouting: debugRequest.regionalRouting,
      puuid: query.puuid,
      queue: query.queue,
      startTime: query.startTime,
      endTime: query.endTime,
      start: query.start,
      count: query.count
    });

    return this.client.request<string[]>({
      path: `/lol/match/v5/matches/by-puuid/${encodeURIComponent(query.puuid)}/ids`,
      routeKey: "lol-match-v5-match-ids-by-puuid",
      scope: "regional",
      regionalRouting: query.regionalRouting ?? this.config.defaultRegionalRouting,
      query: {
        queue: query.queue,
        type: query.type,
        startTime: query.startTime,
        endTime: query.endTime,
        start: query.start,
        count: query.count
      }
    });
  }

  async getMatchDetails(matchId: string, regionalRouting = this.config.defaultRegionalRouting): Promise<RiotMatchDto> {
    const url = buildRiotUrl(
      this.config,
      regionalRouting,
      `/lol/match/v5/matches/${encodeURIComponent(matchId)}`
    ).toString();

    logger.info("Sending Riot Match-V5 detail request.", {
      url,
      regionalRouting,
      matchId
    });

    return this.client.request<RiotMatchDto>({
      path: `/lol/match/v5/matches/${encodeURIComponent(matchId)}`,
      routeKey: "lol-match-v5-match-detail",
      scope: "regional",
      regionalRouting
    });
  }

  getMatchListDebugRequest(query: RiotMatchListQuery) {
    const regionalRouting = query.regionalRouting ?? this.config.defaultRegionalRouting;
    const path = `/lol/match/v5/matches/by-puuid/${encodeURIComponent(query.puuid)}/ids`;
    const queryParameters = {
      queue: query.queue,
      type: query.type,
      startTime: query.startTime,
      endTime: query.endTime,
      start: query.start,
      count: query.count
    };
    const url = buildRiotUrl(this.config, regionalRouting, path, queryParameters);

    return {
      url: url.toString(),
      regionalRouting,
      path,
      query: Object.fromEntries(url.searchParams.entries())
    };
  }
}

export function createRiotMatchClient(client?: RiotClient, config?: RiotConfig) {
  return new RiotMatchClient(client, config);
}
