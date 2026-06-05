import type { RiotRegionalRouting } from "@/server/riot/types";
import type { NormalizedMatch } from "@/server/ingestion/matchModels";

export type MatchDiscoveryJob = {
  type: "match-discovery";
  jobId: string;
  puuid: string;
  queueId: number;
  regionalRouting?: RiotRegionalRouting;
  startTime?: number;
  endTime?: number;
  start?: number;
  count?: number;
};

export type MatchFetchJob = {
  type: "match-fetch";
  jobId: string;
  riotMatchId: string;
  regionalRouting?: RiotRegionalRouting;
};

export type MatchIngestionJob = MatchDiscoveryJob | MatchFetchJob;

export type MatchDiscoveryJobResult = {
  jobId: string;
  queueId: number;
  matchIds: string[];
};

export type MatchFetchJobResult = {
  jobId: string;
  match: NormalizedMatch;
};

export type MatchIngestionJobResult = MatchDiscoveryJobResult | MatchFetchJobResult;
