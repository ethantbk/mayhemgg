import "server-only";

import { getRiotConfig, type RiotConfig } from "@/server/riot/config";
import { createRiotClient, type RiotClient } from "@/server/riot/riotClient";
import type { RiotMatchDto, RiotMatchListQuery } from "@/server/riot/matchTypes";

export class RiotMatchClient {
  private client: RiotClient;
  private config: RiotConfig;

  constructor(client: RiotClient = createRiotClient(), config: RiotConfig = getRiotConfig()) {
    this.client = client;
    this.config = config;
  }

  async getMatchIdsByPuuidAndQueue(query: RiotMatchListQuery): Promise<string[]> {
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
    return this.client.request<RiotMatchDto>({
      path: `/lol/match/v5/matches/${encodeURIComponent(matchId)}`,
      routeKey: "lol-match-v5-match-detail",
      scope: "regional",
      regionalRouting
    });
  }
}

export function createRiotMatchClient(client?: RiotClient, config?: RiotConfig) {
  return new RiotMatchClient(client, config);
}
