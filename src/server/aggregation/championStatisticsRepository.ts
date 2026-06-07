import "server-only";

import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { toDatabaseError } from "@/lib/supabase/errors";
import { createLogger, type Logger } from "@/server/logging/logger";
import { toJsonValue } from "@/server/ingestion/persistence/json";
import { mapRiotMatch, mapRiotMatchParticipant } from "@/server/ingestion/persistence/riotMatchRecordMappers";
import type { AggregatedChampionStatistic, ChampionAggregationMode } from "@/server/aggregation/championAggregationModels";
import type {
  DbChampionDifficulty,
  DbChampionRole,
  DbChampion,
  DbRiotMatch,
  DbRiotMatchParticipant,
  JsonValue
} from "@/types/database";

export type PersistChampionStatisticsResult = {
  mode: ChampionAggregationMode;
  rowsPersisted: number;
};

type DbChampionRow = {
  id: string;
  riot_champion_id: string;
  riot_key: number | null;
  name: string;
  slug: string;
  title: string | null;
  role: DbChampionRole;
  secondary_roles: DbChampionRole[];
  difficulty: DbChampionDifficulty;
  icon_path: string | null;
  splash_path: string | null;
  raw_data: JsonValue;
  created_at: string;
  updated_at: string;
};

type ArenaChampionStatisticRow = {
  patch_id: string;
  champion_id: string;
  tier: AggregatedChampionStatistic["tier"];
  win_rate: number;
  pick_rate: number;
  ban_rate: number | null;
  average_placement: number | null;
  broken_score: number | null;
  games_played: number;
  best_build_id: string | null;
  broken_build_id: string | null;
  raw_data: JsonValue;
};

type AramMayhemChampionStatisticRow = Omit<ArenaChampionStatisticRow, "ban_rate" | "average_placement">;

function mapChampion(row: DbChampionRow): DbChampion {
  return {
    id: row.id,
    riotChampionId: row.riot_champion_id,
    riotKey: row.riot_key,
    name: row.name,
    slug: row.slug,
    title: row.title,
    role: row.role,
    secondaryRoles: row.secondary_roles,
    difficulty: row.difficulty,
    iconPath: row.icon_path,
    splashPath: row.splash_path,
    rawData: row.raw_data,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export class ChampionStatisticsRepository {
  private logger: Logger;

  constructor(logger: Logger = createLogger({ component: "champion-statistics-repository" })) {
    this.logger = logger;
  }

  async getChampions(): Promise<DbChampion[]> {
    const db = createServiceRoleSupabaseClient();
    const { data, error } = await db.from("champions").select("*");

    if (error) {
      throw toDatabaseError(error, "Load champions for aggregation");
    }

    return (data ?? []).map((row) => mapChampion(row as unknown as DbChampionRow));
  }

  async getMatchesForPatchAndMode(patchId: string, mode: ChampionAggregationMode): Promise<DbRiotMatch[]> {
    const db = createServiceRoleSupabaseClient();
    const { data, error } = await db
      .from("riot_matches")
      .select("*")
      .eq("patch_id", patchId)
      .eq("mode", mode);

    if (error) {
      throw toDatabaseError(error, "Load persisted matches for champion aggregation");
    }

    const matches = (data ?? []).map(mapRiotMatch);
    const queueIds = [...new Set(matches.map((match) => match.queueId))];

    this.logger.info("Loaded persisted matches for champion aggregation.", {
      patchId,
      mode,
      matchesProcessed: matches.length,
      queueIds: queueIds.join(",")
    });

    return matches;
  }

  async getParticipantsForMatches(matchIds: string[]): Promise<DbRiotMatchParticipant[]> {
    if (!matchIds.length) return [];

    const db = createServiceRoleSupabaseClient();
    const { data, error } = await db
      .from("riot_match_participants")
      .select("*")
      .in("match_id", matchIds);

    if (error) {
      throw toDatabaseError(error, "Load persisted match participants for champion aggregation");
    }

    const participants = (data ?? []).map(mapRiotMatchParticipant);

    this.logger.info("Loaded persisted participants for champion aggregation.", {
      matchCount: matchIds.length,
      participantsProcessed: participants.length
    });

    return participants;
  }

  async persistChampionStatistics(
    mode: ChampionAggregationMode,
    statistics: AggregatedChampionStatistic[]
  ): Promise<PersistChampionStatisticsResult> {
    if (!statistics.length) {
      this.logger.warn("No champion statistics generated to persist.", {
        mode
      });

      return {
        mode,
        rowsPersisted: 0
      };
    }

    return mode === "arena"
      ? this.persistArenaStatistics(statistics)
      : this.persistAramMayhemStatistics(statistics);
  }

  private async persistArenaStatistics(statistics: AggregatedChampionStatistic[]): Promise<PersistChampionStatisticsResult> {
    const db = createServiceRoleSupabaseClient();
    const rows: ArenaChampionStatisticRow[] = statistics.map((statistic) => ({
      patch_id: statistic.patchId,
      champion_id: statistic.championId,
      tier: statistic.tier,
      win_rate: statistic.winRate,
      pick_rate: statistic.pickRate,
      ban_rate: statistic.banRate,
      average_placement: statistic.averagePlacement,
      broken_score: null,
      games_played: statistic.gamesPlayed,
      best_build_id: null,
      broken_build_id: null,
      raw_data: toJsonValue({
        aggregation: {
          mode: statistic.mode,
          riotChampionId: statistic.riotChampionId,
          wins: statistic.wins,
          tierScoreInputs: statistic.tierScoreInputs
        }
      })
    }));
    const { data, error } = await db
      .from("arena_champion_statistics")
      .upsert(rows as never, { onConflict: "patch_id,champion_id" })
      .select("id");

    if (error) {
      const databaseError = toDatabaseError(error, "Persist Arena champion statistics");
      this.logger.error("Failed to persist Arena champion statistics.", {
        error: databaseError.message,
        rows: rows.length
      });
      throw databaseError;
    }

    this.logger.info("Persisted Arena champion statistics.", {
      statsPersisted: data?.length ?? rows.length,
      rows: rows.length
    });

    return {
      mode: "arena",
      rowsPersisted: data?.length ?? rows.length
    };
  }

  private async persistAramMayhemStatistics(statistics: AggregatedChampionStatistic[]): Promise<PersistChampionStatisticsResult> {
    const db = createServiceRoleSupabaseClient();
    const rows: AramMayhemChampionStatisticRow[] = statistics.map((statistic) => ({
      patch_id: statistic.patchId,
      champion_id: statistic.championId,
      tier: statistic.tier,
      win_rate: statistic.winRate,
      pick_rate: statistic.pickRate,
      broken_score: null,
      games_played: statistic.gamesPlayed,
      best_build_id: null,
      broken_build_id: null,
      raw_data: toJsonValue({
        aggregation: {
          mode: statistic.mode,
          riotChampionId: statistic.riotChampionId,
          wins: statistic.wins,
          tierScoreInputs: statistic.tierScoreInputs
        }
      })
    }));
    const { data, error } = await db
      .from("aram_mayhem_champion_statistics")
      .upsert(rows as never, { onConflict: "patch_id,champion_id" })
      .select("id");

    if (error) {
      const databaseError = toDatabaseError(error, "Persist ARAM Mayhem champion statistics");
      this.logger.error("Failed to persist ARAM Mayhem champion statistics.", {
        error: databaseError.message,
        rows: rows.length
      });
      throw databaseError;
    }

    this.logger.info("Persisted ARAM Mayhem champion statistics.", {
      statsPersisted: data?.length ?? rows.length,
      rows: rows.length
    });

    return {
      mode: "aram_mayhem",
      rowsPersisted: data?.length ?? rows.length
    };
  }
}

export function createChampionStatisticsRepository(logger?: Logger) {
  return new ChampionStatisticsRepository(logger);
}
