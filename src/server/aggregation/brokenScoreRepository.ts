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
  DbBuildKind,
  DbGameMode,
  DbTierRank,
  JsonValue
} from "@/types/database";

export type ChampionStatisticForBrokenScore =
  | (DbArenaChampionStatistic & { mode: "arena" })
  | (DbAramMayhemChampionStatistic & { mode: "aram_mayhem"; banRate: null; averagePlacement: null });

export type PersistBrokenScoresResult = {
  scoresPersisted: number;
};

type SnakeCaseQueryResult = {
  data: unknown[] | null;
  error: unknown;
};

type SnakeCaseTableQuery = PromiseLike<SnakeCaseQueryResult> & {
  select: (columns?: string) => SnakeCaseTableQuery;
  eq: (column: string, value: unknown) => SnakeCaseTableQuery;
  in: (column: string, values: unknown[]) => SnakeCaseTableQuery;
  update: (values: Record<string, unknown>) => SnakeCaseTableQuery;
};

type SnakeCaseQueryClient = {
  from: (table: string) => SnakeCaseTableQuery;
};

type ArenaChampionStatisticRow = {
  id: string;
  patch_id: string;
  champion_id: string;
  tier: DbTierRank;
  win_rate: number;
  pick_rate: number;
  ban_rate: number | null;
  average_placement: number | null;
  broken_score: number | null;
  games_played: number;
  best_build_id: string | null;
  broken_build_id: string | null;
  raw_data: JsonValue;
  created_at: string;
  updated_at: string;
};

type AramMayhemChampionStatisticRow = Omit<ArenaChampionStatisticRow, "ban_rate" | "average_placement">;

type BuildRow = {
  id: string;
  patch_id: string;
  champion_id: string;
  mode: DbGameMode;
  kind: DbBuildKind;
  name: string;
  explanation: string;
  broken_score: number | null;
  win_rate: number | null;
  pick_rate: number | null;
  sample_size: number;
  source: string;
  raw_data: JsonValue;
  created_at: string;
  updated_at: string;
};

type AugmentStatisticRow = {
  id: string;
  patch_id: string;
  augment_id: string;
  mode: DbGameMode;
  average_win_rate: number;
  pick_rate: number;
  games_played: number;
  raw_data: JsonValue;
  created_at: string;
  updated_at: string;
};

type AugmentBestChampionRow = {
  augment_statistic_id: string;
  champion_id: string;
  rank: number;
  win_rate: number | null;
  pick_rate: number | null;
};

function createSnakeCaseDb(): SnakeCaseQueryClient {
  return createServiceRoleSupabaseClient() as unknown as SnakeCaseQueryClient;
}

function mapArenaChampionStatistic(row: ArenaChampionStatisticRow): DbArenaChampionStatistic {
  return {
    id: row.id,
    patchId: row.patch_id,
    championId: row.champion_id,
    tier: row.tier,
    winRate: row.win_rate,
    pickRate: row.pick_rate,
    banRate: row.ban_rate,
    averagePlacement: row.average_placement,
    brokenScore: row.broken_score,
    gamesPlayed: row.games_played,
    bestBuildId: row.best_build_id,
    brokenBuildId: row.broken_build_id,
    rawData: row.raw_data,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapAramMayhemChampionStatistic(row: AramMayhemChampionStatisticRow): DbAramMayhemChampionStatistic {
  return {
    id: row.id,
    patchId: row.patch_id,
    championId: row.champion_id,
    tier: row.tier,
    winRate: row.win_rate,
    pickRate: row.pick_rate,
    brokenScore: row.broken_score,
    gamesPlayed: row.games_played,
    bestBuildId: row.best_build_id,
    brokenBuildId: row.broken_build_id,
    rawData: row.raw_data,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapBuild(row: BuildRow): DbBuild {
  return {
    id: row.id,
    patchId: row.patch_id,
    championId: row.champion_id,
    mode: row.mode,
    kind: row.kind,
    name: row.name,
    explanation: row.explanation,
    brokenScore: row.broken_score,
    winRate: row.win_rate,
    pickRate: row.pick_rate,
    sampleSize: row.sample_size,
    source: row.source,
    rawData: row.raw_data,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapAugmentStatistic(row: AugmentStatisticRow): DbAugmentStatistic {
  return {
    id: row.id,
    patchId: row.patch_id,
    augmentId: row.augment_id,
    mode: row.mode,
    averageWinRate: row.average_win_rate,
    pickRate: row.pick_rate,
    gamesPlayed: row.games_played,
    rawData: row.raw_data,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapAugmentBestChampion(row: AugmentBestChampionRow): DbAugmentBestChampion {
  return {
    augmentStatisticId: row.augment_statistic_id,
    championId: row.champion_id,
    rank: row.rank,
    winRate: row.win_rate,
    pickRate: row.pick_rate
  };
}

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
    const db = createSnakeCaseDb();

    if (mode === "arena") {
      let query = db
        .from("arena_champion_statistics")
        .select("*")
        .eq("patch_id", patchId);
      if (championId) {
        query = query.eq("champion_id", championId);
      }
      const { data, error } = await query;

      if (error) {
        throw toDatabaseError(error, "Load Arena champion stats for broken scoring");
      }

      return ((data ?? []) as ArenaChampionStatisticRow[]).map((statistic) => ({ ...mapArenaChampionStatistic(statistic), mode }));
    }

    let query = db
      .from("aram_mayhem_champion_statistics")
      .select("*")
      .eq("patch_id", patchId);
    if (championId) {
      query = query.eq("champion_id", championId);
    }
    const { data, error } = await query;

    if (error) {
      throw toDatabaseError(error, "Load ARAM Mayhem champion stats for broken scoring");
    }

    return ((data ?? []) as AramMayhemChampionStatisticRow[]).map((statistic) => ({
      ...mapAramMayhemChampionStatistic(statistic),
      mode,
      banRate: null,
      averagePlacement: null
    }));
  }

  async getBuilds(patchId: string, mode: BrokenScoreMode, championId?: string): Promise<DbBuild[]> {
    const db = createSnakeCaseDb();
    let query = db
      .from("builds")
      .select("*")
      .eq("patch_id", patchId)
      .eq("mode", mode);
    if (championId) {
      query = query.eq("champion_id", championId);
    }
    const { data, error } = await query;

    if (error) {
      throw toDatabaseError(error, "Load builds for broken scoring");
    }

    return ((data ?? []) as BuildRow[]).map(mapBuild);
  }

  async getAugmentStatistics(patchId: string, mode: BrokenScoreMode): Promise<DbAugmentStatistic[]> {
    const db = createSnakeCaseDb();
    const { data, error } = await db
      .from("augment_statistics")
      .select("*")
      .eq("patch_id", patchId)
      .eq("mode", mode);

    if (error) {
      throw toDatabaseError(error, "Load augment stats for broken scoring");
    }

    return ((data ?? []) as AugmentStatisticRow[]).map(mapAugmentStatistic);
  }

  async getAugmentBestChampions(augmentStatisticIds: string[]): Promise<DbAugmentBestChampion[]> {
    if (!augmentStatisticIds.length) return [];

    const db = createSnakeCaseDb();
    const { data, error } = await db
      .from("augment_best_champions")
      .select("*")
      .in("augment_statistic_id", augmentStatisticIds);

    if (error) {
      throw toDatabaseError(error, "Load augment champion pairs for broken scoring");
    }

    return ((data ?? []) as AugmentBestChampionRow[]).map(mapAugmentBestChampion);
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
    const db = createSnakeCaseDb();
    const { error } = await db
      .from("arena_champion_statistics")
      .update({
        tier: score.generatedTier,
        broken_score: score.brokenScore,
        broken_build_id: score.brokenBuildId,
        raw_data: rawData
      })
      .eq("patch_id", score.patchId)
      .eq("champion_id", score.championId);

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
    const db = createSnakeCaseDb();
    const { error } = await db
      .from("aram_mayhem_champion_statistics")
      .update({
        tier: score.generatedTier,
        broken_score: score.brokenScore,
        broken_build_id: score.brokenBuildId,
        raw_data: rawData
      })
      .eq("patch_id", score.patchId)
      .eq("champion_id", score.championId);

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
