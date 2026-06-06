import type { DbGameMode, DbRiotMatch, DbRiotMatchParticipant, JsonValue } from "@/types/database";

export type DbRiotMatchRow = {
  id: string;
  riot_match_id: string;
  patch_id: string | null;
  regional_routing: string;
  platform_id: string;
  queue_id: number;
  mode: DbGameMode | null;
  game_version: string;
  game_started_at: string;
  game_ended_at: string | null;
  game_duration_seconds: number;
  participant_puuid_hashes: string[];
  raw_data: JsonValue;
  ingested_at: string;
  created_at: string;
  updated_at: string;
};

export type DbRiotMatchParticipantRow = {
  id: string;
  match_id: string;
  riot_match_id: string;
  puuid_hash: string;
  participant_id: number;
  team_id: number;
  riot_champion_id: number;
  champion_name: string;
  won: boolean;
  placement: number | null;
  item_ids: number[];
  augment_ids: number[];
  kills: number;
  deaths: number;
  assists: number;
  champion_level: number;
  gold_earned: number;
  total_damage_dealt_to_champions: number;
  total_damage_taken: number;
  raw_data: JsonValue;
  created_at: string;
  updated_at: string;
};

export function mapRiotMatch(row: DbRiotMatchRow): DbRiotMatch {
  return {
    id: row.id,
    riotMatchId: row.riot_match_id,
    patchId: row.patch_id,
    regionalRouting: row.regional_routing,
    platformId: row.platform_id,
    queueId: row.queue_id,
    mode: row.mode,
    gameVersion: row.game_version,
    gameStartedAt: row.game_started_at,
    gameEndedAt: row.game_ended_at,
    gameDurationSeconds: row.game_duration_seconds,
    participantPuuidHashes: row.participant_puuid_hashes,
    rawData: row.raw_data,
    ingestedAt: row.ingested_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapRiotMatchParticipant(row: DbRiotMatchParticipantRow): DbRiotMatchParticipant {
  return {
    id: row.id,
    matchId: row.match_id,
    riotMatchId: row.riot_match_id,
    puuidHash: row.puuid_hash,
    participantId: row.participant_id,
    teamId: row.team_id,
    riotChampionId: row.riot_champion_id,
    championName: row.champion_name,
    won: row.won,
    placement: row.placement,
    itemIds: row.item_ids,
    augmentIds: row.augment_ids,
    kills: row.kills,
    deaths: row.deaths,
    assists: row.assists,
    championLevel: row.champion_level,
    goldEarned: row.gold_earned,
    totalDamageDealtToChampions: row.total_damage_dealt_to_champions,
    totalDamageTaken: row.total_damage_taken,
    rawData: row.raw_data,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
