import type { RiotRegionalRouting } from "@/server/riot/types";

export type IngestionGameMode = "arena" | "aram_mayhem" | "unknown";

export type NormalizedMatchParticipant = {
  riotMatchId: string;
  puuid: string;
  puuidHash: string;
  participantId: number;
  teamId: number;
  championId: number;
  championName: string;
  won: boolean;
  placement: number | null;
  itemIds: number[];
  augmentIds: number[];
  kills: number;
  deaths: number;
  assists: number;
  championLevel: number;
  goldEarned: number;
  totalDamageDealtToChampions: number;
  totalDamageTaken: number;
  rawData: unknown;
};

export type NormalizedMatch = {
  riotMatchId: string;
  regionalRouting: RiotRegionalRouting;
  platformId: string;
  queueId: number;
  mode: IngestionGameMode;
  gameVersion: string;
  gameStartedAt: string;
  gameEndedAt: string | null;
  gameDurationSeconds: number;
  participantPuuids: string[];
  participants: NormalizedMatchParticipant[];
  rawData: unknown;
};

export type MatchNormalizationOptions = {
  arenaQueueId: number;
  aramMayhemQueueId: number;
  arenaQueueIds: number[];
  aramMayhemQueueIds: number[];
};
