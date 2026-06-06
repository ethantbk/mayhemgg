import "server-only";

import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { toDatabaseError } from "@/lib/supabase/errors";
import { createLogger, type Logger } from "@/server/logging/logger";
import { toJsonValue } from "@/server/ingestion/persistence/json";
import { mapRiotMatch, mapRiotMatchParticipant } from "@/server/ingestion/persistence/riotMatchRecordMappers";
import type { AggregatedChampionStatistic, ChampionAggregationMode } from "@/server/aggregation/championAggregationModels";
import type {
  DbChampion,
  DbRiotMatch,
  DbRiotMatchParticipant,
  NewDbArenaChampionStatistic,
  NewDbAramMayhemChampionStatistic
} from "@/types/database";

export type PersistChampionStatisticsResult = {
  mode: ChampionAggregationMode;
  rowsPersisted: number;
};

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

    return data ?? [];
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

    return (data ?? []).map(mapRiotMatch);
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

    return (data ?? []).map(mapRiotMatchParticipant);
  }

  async persistChampionStatistics(
    mode: ChampionAggregationMode,
    statistics: AggregatedChampionStatistic[]
  ): Promise<PersistChampionStatisticsResult> {
    if (!statistics.length) {
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
    const rows: NewDbArenaChampionStatistic[] = statistics.map((statistic) => ({
      patchId: statistic.patchId,
      championId: statistic.championId,
      tier: statistic.tier,
      winRate: statistic.winRate,
      pickRate: statistic.pickRate,
      banRate: statistic.banRate,
      averagePlacement: statistic.averagePlacement,
      brokenScore: null,
      gamesPlayed: statistic.gamesPlayed,
      bestBuildId: null,
      brokenBuildId: null,
      rawData: toJsonValue({
        aggregation: {
          mode: statistic.mode,
          riotChampionId: statistic.riotChampionId,
          wins: statistic.wins,
          tierScoreInputs: statistic.tierScoreInputs
        }
      })
    }));
    const { error } = await db
      .from("arena_champion_statistics")
      .upsert(rows, { onConflict: "patchId,championId" });

    if (error) {
      const databaseError = toDatabaseError(error, "Persist Arena champion statistics");
      this.logger.error("Failed to persist Arena champion statistics.", {
        error: databaseError.message,
        rows: rows.length
      });
      throw databaseError;
    }

    return {
      mode: "arena",
      rowsPersisted: rows.length
    };
  }

  private async persistAramMayhemStatistics(statistics: AggregatedChampionStatistic[]): Promise<PersistChampionStatisticsResult> {
    const db = createServiceRoleSupabaseClient();
    const rows: NewDbAramMayhemChampionStatistic[] = statistics.map((statistic) => ({
      patchId: statistic.patchId,
      championId: statistic.championId,
      tier: statistic.tier,
      winRate: statistic.winRate,
      pickRate: statistic.pickRate,
      brokenScore: null,
      gamesPlayed: statistic.gamesPlayed,
      bestBuildId: null,
      brokenBuildId: null,
      rawData: toJsonValue({
        aggregation: {
          mode: statistic.mode,
          riotChampionId: statistic.riotChampionId,
          wins: statistic.wins,
          tierScoreInputs: statistic.tierScoreInputs
        }
      })
    }));
    const { error } = await db
      .from("aram_mayhem_champion_statistics")
      .upsert(rows, { onConflict: "patchId,championId" });

    if (error) {
      const databaseError = toDatabaseError(error, "Persist ARAM Mayhem champion statistics");
      this.logger.error("Failed to persist ARAM Mayhem champion statistics.", {
        error: databaseError.message,
        rows: rows.length
      });
      throw databaseError;
    }

    return {
      mode: "aram_mayhem",
      rowsPersisted: rows.length
    };
  }
}

export function createChampionStatisticsRepository(logger?: Logger) {
  return new ChampionStatisticsRepository(logger);
}
