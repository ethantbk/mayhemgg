import "server-only";

import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { toDatabaseError, unwrapSupabaseResponse } from "@/lib/supabase/errors";
import { createLogger, type Logger } from "@/server/logging/logger";
import type { NormalizedMatch, NormalizedMatchParticipant } from "@/server/ingestion/matchModels";
import { toJsonValue } from "@/server/ingestion/persistence/json";
import type { DbGameMode, JsonValue } from "@/types/database";

type PersistNormalizedMatchInput = {
  match: NormalizedMatch;
  patchId?: string | null;
  ingestionRunId?: string;
  jobId?: string;
};

export type PersistNormalizedMatchResult = {
  matchId: string;
  riotMatchId: string;
  queueId: number;
  mode: NormalizedMatch["mode"];
  participantsPersisted: number;
};

function toPersistedMode(mode: NormalizedMatch["mode"]): DbGameMode | null {
  return mode === "unknown" ? null : mode;
}

function toMatchPayload(match: NormalizedMatch, patchId?: string | null): JsonValue {
  return toJsonValue({
    riotMatchId: match.riotMatchId,
    patchId: patchId ?? null,
    regionalRouting: match.regionalRouting,
    platformId: match.platformId,
    queueId: match.queueId,
    mode: toPersistedMode(match.mode),
    gameVersion: match.gameVersion,
    gameStartedAt: match.gameStartedAt,
    gameEndedAt: match.gameEndedAt,
    gameDurationSeconds: match.gameDurationSeconds,
    participantPuuidHashes: match.participants.map((participant) => participant.puuidHash),
    rawData: match.rawData
  });
}

function toParticipantPayload(participant: NormalizedMatchParticipant): JsonValue {
  return toJsonValue({
    riotMatchId: participant.riotMatchId,
    puuidHash: participant.puuidHash,
    participantId: participant.participantId,
    teamId: participant.teamId,
    riotChampionId: participant.championId,
    championName: participant.championName,
    won: participant.won,
    placement: participant.placement,
    itemIds: participant.itemIds,
    augmentIds: participant.augmentIds,
    kills: participant.kills,
    deaths: participant.deaths,
    assists: participant.assists,
    championLevel: participant.championLevel,
    goldEarned: participant.goldEarned,
    totalDamageDealtToChampions: participant.totalDamageDealtToChampions,
    totalDamageTaken: participant.totalDamageTaken,
    rawData: participant.rawData
  });
}

export class MatchPersistenceRepository {
  private logger: Logger;

  constructor(logger: Logger = createLogger({ component: "match-persistence-repository" })) {
    this.logger = logger;
  }

  async findExistingRiotMatchIds(riotMatchIds: string[]): Promise<string[]> {
    const uniqueRiotMatchIds = [...new Set(riotMatchIds.filter(Boolean))];

    if (!uniqueRiotMatchIds.length) {
      return [];
    }

    try {
      const db = createServiceRoleSupabaseClient();
      const response = await db
        .from("riot_matches")
        .select("riot_match_id")
        .in("riot_match_id", uniqueRiotMatchIds);
      const rows = unwrapSupabaseResponse(response, "Load existing Riot match IDs");

      return rows.map((row) => row.riot_match_id).filter(Boolean);
    } catch (error) {
      const databaseError = toDatabaseError(error, "Load existing Riot match IDs");

      this.logger.error("Failed to load existing Riot match IDs.", {
        error: databaseError.message,
        requestedMatchCount: uniqueRiotMatchIds.length
      });

      throw databaseError;
    }
  }

  async persistNormalizedMatch(input: PersistNormalizedMatchInput): Promise<PersistNormalizedMatchResult> {
    const matchPayload = toMatchPayload(input.match, input.patchId);
    const participantPayloads = toJsonValue(input.match.participants.map(toParticipantPayload));

    this.logger.info("Persisting normalized Riot match.", {
      riotMatchId: input.match.riotMatchId,
      queueId: input.match.queueId,
      mode: input.match.mode,
      participantCount: input.match.participants.length,
      ingestionRunId: input.ingestionRunId,
      jobId: input.jobId
    });

    try {
      const db = createServiceRoleSupabaseClient();
      const response = await db.rpc("persist_riot_match", {
        p_match: matchPayload,
        p_participants: participantPayloads
      });
      const matchId = unwrapSupabaseResponse(response, "Persist normalized Riot match");

      this.logger.info("Persisted normalized Riot match.", {
        matchId,
        riotMatchId: input.match.riotMatchId,
        participantsPersisted: input.match.participants.length,
        ingestionRunId: input.ingestionRunId,
        jobId: input.jobId
      });

      return {
        matchId,
        riotMatchId: input.match.riotMatchId,
        queueId: input.match.queueId,
        mode: input.match.mode,
        participantsPersisted: input.match.participants.length
      };
    } catch (error) {
      const databaseError = toDatabaseError(error, "Persist normalized Riot match");

      this.logger.error("Failed to persist normalized Riot match.", {
        error: databaseError.message,
        riotMatchId: input.match.riotMatchId,
        ingestionRunId: input.ingestionRunId,
        jobId: input.jobId
      });

      throw databaseError;
    }
  }
}

export function createMatchPersistenceRepository(logger?: Logger) {
  return new MatchPersistenceRepository(logger);
}
