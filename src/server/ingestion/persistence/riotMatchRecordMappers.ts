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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function readPositiveNumber(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "number" && value > 0 ? value : null;
}

function readRawItemIds(rawData: JsonValue) {
  if (!isRecord(rawData)) return [];

  return [
    readPositiveNumber(rawData, "item0"),
    readPositiveNumber(rawData, "item1"),
    readPositiveNumber(rawData, "item2"),
    readPositiveNumber(rawData, "item3"),
    readPositiveNumber(rawData, "item4"),
    readPositiveNumber(rawData, "item5"),
    readPositiveNumber(rawData, "item6")
  ].filter((itemId): itemId is number => typeof itemId === "number");
}

function readRawAugmentIds(rawData: JsonValue) {
  if (!isRecord(rawData)) return [];

  const challenges = isRecord(rawData.challenges) ? rawData.challenges : {};
  const challengeAugments = Array.isArray(challenges.augmentIds)
    ? challenges.augmentIds.filter((augmentId): augmentId is number => typeof augmentId === "number" && augmentId > 0)
    : [];
  const keyedAugments = [
    readPositiveNumber(rawData, "playerAugment1"),
    readPositiveNumber(rawData, "playerAugment2"),
    readPositiveNumber(rawData, "playerAugment3"),
    readPositiveNumber(rawData, "playerAugment4"),
    readPositiveNumber(rawData, "playerAugment5"),
    readPositiveNumber(rawData, "playerAugment6"),
    readPositiveNumber(challenges, "playerAugment1"),
    readPositiveNumber(challenges, "playerAugment2"),
    readPositiveNumber(challenges, "playerAugment3"),
    readPositiveNumber(challenges, "playerAugment4")
  ].filter((augmentId): augmentId is number => typeof augmentId === "number");

  return [...new Set([...challengeAugments, ...keyedAugments])];
}

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
  const rawItemIds = readRawItemIds(row.raw_data);
  const rawAugmentIds = readRawAugmentIds(row.raw_data);

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
    itemIds: row.item_ids.length ? row.item_ids : rawItemIds,
    augmentIds: row.augment_ids.length ? row.augment_ids : rawAugmentIds,
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
