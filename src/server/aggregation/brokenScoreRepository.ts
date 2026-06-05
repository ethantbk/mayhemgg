import "server-only";

import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { toDatabaseError } from "@/lib/supabase/errors";
import { createLogger, type Logger } from "@/server/logging/logger";
import { toJsonValue } from "@/server/ingestion/persistence/json";
import type { BrokenScoreMode, ChampionBrokenScore } from "@/server/aggregation/brokenScoreModels";
import type {
  DbArenaChampionStatistic,
  DbAramMayhemChampionStatistic,
  DbAugmentBestChampion,
  DbAugmentStatistic,
  DbBuild,
  JsonValue
} from "@/types/database";

export type ChampionStatisticForBrokenScore =
  | (DbArenaChampionStatistic & { mode: "arena" })
  | (DbAramMayhemChampionStatistic & { mode: "aram_mayhem"; banRate: null; averagePlacement: null });

export type PersistBrokenScoresResult = {
  scoresPersisted: number;
};

function isJsonObject(value: JsonValue): value is { [key: string]: JsonValue } {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function mergeBrokenScoreRawData(rawData: JsonValue, score: ChampionBrokenScore): JsonValue {
  return toJsonValue({
    ...(isJsonObject(rawData) ? rawData : {}),
    brokenScore: {
      score: score.brokenScore,
      generatedTier: score.generatedTier,
      brokenBuildId: score.brokenBuildId,
      inputs: score.inputs,
      generatedAt: new Date().toISOString()
    }
  });
}

export class BrokenScoreRepository {
  private logger: Logger;

  constructor(logger: Logger = createLogger({ component: "broken-score-repository" })) {
    this.logger = logger;
  }

  async getChampionStatistics(patchId: string, mode: BrokenScoreMode, championId?: string): Promise<ChampionStatisticForBrokenScore[]> {
    const db = createServiceRoleSupabaseClient();

    if (mode === "arena") {
      let query = db
        .from("arena_champion_statistics")
        .select("*")
        .eq("patchId", patchId);
      if (championId) {
        query = query.eq("championId", championId);
      }
      const { data, error } = await query;

      if (error) {
        throw toDatabaseError(error, "Load Arena champion stats for broken scoring");
      }

      return (data ?? []).map((statistic) => ({ ...statistic, mode }));
    }

    let query = db
      .from("aram_mayhem_champion_statistics")
      .select("*")
      .eq("patchId", patchId);
    if (championId) {
      query = query.eq("championId", championId);
    }
    const { data, error } = await query;

    if (error) {
      throw toDatabaseError(error, "Load ARAM Mayhem champion stats for broken scoring");
    }

    return (data ?? []).map((statistic) => ({
      ...statistic,
      mode,
      banRate: null,
      averagePlacement: null
    }));
  }

  async getBuilds(patchId: string, mode: BrokenScoreMode, championId?: string): Promise<DbBuild[]> {
    const db = createServiceRoleSupabaseClient();
    let query = db
      .from("builds")
      .select("*")
      .eq("patchId", patchId)
      .eq("mode", mode);
    if (championId) {
      query = query.eq("championId", championId);
    }
    const { data, error } = await query;

    if (error) {
      throw toDatabaseError(error, "Load builds for broken scoring");
    }

    return data ?? [];
  }

  async getAugmentStatistics(patchId: string, mode: BrokenScoreMode): Promise<DbAugmentStatistic[]> {
    const db = createServiceRoleSupabaseClient();
    const { data, error } = await db
      .from("augment_statistics")
      .select("*")
      .eq("patchId", patchId)
      .eq("mode", mode);

    if (error) {
      throw toDatabaseError(error, "Load augment stats for broken scoring");
    }

    return data ?? [];
  }

  async getAugmentBestChampions(augmentStatisticIds: string[]): Promise<DbAugmentBestChampion[]> {
    if (!augmentStatisticIds.length) return [];

    const db = createServiceRoleSupabaseClient();
    const { data, error } = await db
      .from("augment_best_champions")
      .select("*")
      .in("augmentStatisticId", augmentStatisticIds);

    if (error) {
      throw toDatabaseError(error, "Load augment champion pairs for broken scoring");
    }

    return data ?? [];
  }

  async persistBrokenScores(scores: ChampionBrokenScore[], existingStats: ChampionStatisticForBrokenScore[]): Promise<PersistBrokenScoresResult> {
    const existingStatsByChampionId = new Map(existingStats.map((statistic) => [statistic.championId, statistic]));
    let scoresPersisted = 0;

    for (const score of scores) {
      const existing = existingStatsByChampionId.get(score.championId);
      const rawData = mergeBrokenScoreRawData(existing?.rawData ?? {}, score);

      if (score.mode === "arena") {
        await this.updateArenaScore(score, rawData);
      } else {
        await this.updateAramMayhemScore(score, rawData);
      }

      scoresPersisted += 1;
    }

    return { scoresPersisted };
  }

  private async updateArenaScore(score: ChampionBrokenScore, rawData: JsonValue) {
    const db = createServiceRoleSupabaseClient();
    const { error } = await db
      .from("arena_champion_statistics")
      .update({
        tier: score.generatedTier,
        brokenScore: score.brokenScore,
        brokenBuildId: score.brokenBuildId,
        rawData
      })
      .eq("patchId", score.patchId)
      .eq("championId", score.championId);

    if (error) {
      const databaseError = toDatabaseError(error, "Persist Arena broken scores");
      this.logger.error("Failed to persist Arena broken score.", {
        error: databaseError.message,
        championId: score.championId
      });
      throw databaseError;
    }
  }

  private async updateAramMayhemScore(score: ChampionBrokenScore, rawData: JsonValue) {
    const db = createServiceRoleSupabaseClient();
    const { error } = await db
      .from("aram_mayhem_champion_statistics")
      .update({
        tier: score.generatedTier,
        brokenScore: score.brokenScore,
        brokenBuildId: score.brokenBuildId,
        rawData
      })
      .eq("patchId", score.patchId)
      .eq("championId", score.championId);

    if (error) {
      const databaseError = toDatabaseError(error, "Persist ARAM Mayhem broken scores");
      this.logger.error("Failed to persist ARAM Mayhem broken score.", {
        error: databaseError.message,
        championId: score.championId
      });
      throw databaseError;
    }
  }
}

export function createBrokenScoreRepository(logger?: Logger) {
  return new BrokenScoreRepository(logger);
}
