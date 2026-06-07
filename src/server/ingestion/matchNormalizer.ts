import "server-only";

import { createHash } from "node:crypto";
import type { RiotMatchDto, RiotMatchParticipantDto } from "@/server/riot/matchTypes";
import type { RiotRegionalRouting } from "@/server/riot/types";
import type { IngestionGameMode, MatchNormalizationOptions, NormalizedMatch, NormalizedMatchParticipant } from "@/server/ingestion/matchModels";

function hashPuuid(puuid: string) {
  return createHash("sha256").update(puuid).digest("hex");
}

function getParticipantItems(participant: RiotMatchParticipantDto) {
  return [
    participant.item0,
    participant.item1,
    participant.item2,
    participant.item3,
    participant.item4,
    participant.item5,
    participant.item6
  ].filter((itemId) => itemId > 0);
}

function getParticipantAugments(participant: RiotMatchParticipantDto) {
  const challengeAugments = participant.challenges?.augmentIds ?? [];
  const keyedAugments = [
    participant.challenges?.playerAugment1,
    participant.challenges?.playerAugment2,
    participant.challenges?.playerAugment3,
    participant.challenges?.playerAugment4
  ].filter((augmentId): augmentId is number => typeof augmentId === "number" && augmentId > 0);

  return [...new Set([...challengeAugments, ...keyedAugments])];
}

function getParticipantPlacement(participant: RiotMatchParticipantDto) {
  const placement = participant.challenges?.placement;
  return typeof placement === "number" ? placement : null;
}

function mapQueueToMode(queueId: number, options: MatchNormalizationOptions): IngestionGameMode {
  if (options.arenaQueueIds.includes(queueId)) return "arena";
  if (options.aramMayhemQueueIds.includes(queueId)) return "aram_mayhem";
  return "unknown";
}

function toIsoTimestamp(timestamp: number | undefined) {
  return timestamp ? new Date(timestamp).toISOString() : null;
}

export function normalizeMatchParticipant(matchId: string, participant: RiotMatchParticipantDto): NormalizedMatchParticipant {
  return {
    riotMatchId: matchId,
    puuid: participant.puuid,
    puuidHash: hashPuuid(participant.puuid),
    participantId: participant.participantId,
    teamId: participant.teamId,
    championId: participant.championId,
    championName: participant.championName,
    won: participant.win,
    placement: getParticipantPlacement(participant),
    itemIds: getParticipantItems(participant),
    augmentIds: getParticipantAugments(participant),
    kills: participant.kills,
    deaths: participant.deaths,
    assists: participant.assists,
    championLevel: participant.champLevel,
    goldEarned: participant.goldEarned,
    totalDamageDealtToChampions: participant.totalDamageDealtToChampions,
    totalDamageTaken: participant.totalDamageTaken,
    rawData: participant
  };
}

export function normalizeMatch(
  match: RiotMatchDto,
  regionalRouting: RiotRegionalRouting,
  options: MatchNormalizationOptions
): NormalizedMatch {
  return {
    riotMatchId: match.metadata.matchId,
    regionalRouting,
    platformId: match.info.platformId,
    queueId: match.info.queueId,
    mode: mapQueueToMode(match.info.queueId, options),
    gameVersion: match.info.gameVersion,
    gameStartedAt: toIsoTimestamp(match.info.gameStartTimestamp) ?? new Date(match.info.gameCreation).toISOString(),
    gameEndedAt: toIsoTimestamp(match.info.gameEndTimestamp),
    gameDurationSeconds: match.info.gameDuration,
    participantPuuids: match.metadata.participants,
    participants: match.info.participants.map((participant) => normalizeMatchParticipant(match.metadata.matchId, participant)),
    rawData: match
  };
}
