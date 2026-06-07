import "server-only";

import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { toDatabaseError, unwrapSupabaseResponse } from "@/lib/supabase/errors";
import { createLogger, type Logger } from "@/server/logging/logger";
import { toJsonValue } from "@/server/ingestion/persistence/json";
import { mapRiotMatch, mapRiotMatchParticipant } from "@/server/ingestion/persistence/riotMatchRecordMappers";
import type { AggregatedAugmentStatistic, AugmentAggregationMode } from "@/server/aggregation/augmentAggregationModels";
import type {
  DbAugment,
  DbAugmentBestChampion,
  DbAugmentStatistic,
  DbChampion,
  DbChampionDifficulty,
  DbChampionRole,
  DbGameMode,
  DbRiotMatch,
  DbRiotMatchParticipant,
  JsonValue
} from "@/types/database";

export type PersistAugmentAggregationResult = {
  augmentsPersisted: number;
  championPairsPersisted: number;
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

type DbAugmentRow = {
  id: string;
  riot_augment_id: string | null;
  name: string;
  slug: string;
  description: string;
  icon_path: string | null;
  raw_data: JsonValue;
  created_at: string;
  updated_at: string;
};

type DbAugmentStatisticRow = {
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

type AugmentStatisticWriteRow = {
  patch_id: string;
  augment_id: string;
  mode: DbGameMode;
  average_win_rate: number;
  pick_rate: number;
  games_played: number;
  raw_data: JsonValue;
};

type AugmentBestChampionWriteRow = {
  augment_statistic_id: string;
  champion_id: string;
  rank: number;
  win_rate: number | null;
  pick_rate: number | null;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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

function mapAugment(row: DbAugmentRow): DbAugment {
  return {
    id: row.id,
    riotAugmentId: row.riot_augment_id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    iconPath: row.icon_path,
    rawData: row.raw_data,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapAugmentStatistic(row: DbAugmentStatisticRow): DbAugmentStatistic {
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

export class AugmentAggregationRepository {
  private logger: Logger;

  constructor(logger: Logger = createLogger({ component: "augment-aggregation-repository" })) {
    this.logger = logger;
  }

  async getChampions(): Promise<DbChampion[]> {
    const db = createServiceRoleSupabaseClient();
    const { data, error } = await db.from("champions").select("*");

    if (error) {
      throw toDatabaseError(error, "Load champions for augment aggregation");
    }

    const champions = (data ?? []).map((row) => mapChampion(row as unknown as DbChampionRow));

    this.logger.info("Loaded champions for augment aggregation.", {
      championsLoaded: champions.length,
      championsWithRiotKey: champions.filter((champion) => champion.riotKey !== null).length
    });

    return champions;
  }

  async getAugments(): Promise<DbAugment[]> {
    const db = createServiceRoleSupabaseClient();
    const { data, error } = await db.from("augments").select("*");

    if (error) {
      throw toDatabaseError(error, "Load augments for aggregation");
    }

    const augments = (data ?? []).map((row) => mapAugment(row as unknown as DbAugmentRow));

    this.logger.info("Loaded augments for aggregation.", {
      augmentsLoaded: augments.length,
      augmentsWithRiotId: augments.filter((augment) => augment.riotAugmentId !== null).length
    });

    return augments;
  }

  async ensureAugmentsForRiotIds(riotAugmentIds: number[]): Promise<DbAugment[]> {
    const augmentIds = [...new Set(riotAugmentIds.filter((augmentId) => augmentId > 0))];

    if (!augmentIds.length) return this.getAugments();

    const db = createServiceRoleSupabaseClient();
    const existingResponse = await db
      .from("augments")
      .select("*")
      .in("riot_augment_id" as keyof DbAugment, augmentIds.map(String));

    if (existingResponse.error) {
      throw toDatabaseError(existingResponse.error, "Load augments for observed Riot augment IDs");
    }

    const existingAugments = (existingResponse.data ?? []).map((row) => mapAugment(row as unknown as DbAugmentRow));
    const existingIds = new Set(existingAugments.map((augment) => augment.riotAugmentId));
    const missingIds = augmentIds.filter((augmentId) => !existingIds.has(String(augmentId)));

    if (missingIds.length) {
      const rows = missingIds.map((augmentId) => ({
        riot_augment_id: String(augmentId),
        name: `Riot Augment ${augmentId}`,
        slug: slugify(`riot-augment-${augmentId}`),
        description: "Observed from Riot match ingestion. Display metadata can be enriched later.",
        icon_path: null,
        raw_data: toJsonValue({
          source: "riot participant bootstrap",
          riotAugmentId: augmentId
        })
      }));
      const insertResponse = await db
        .from("augments")
        .upsert(rows as never, { onConflict: "riot_augment_id" })
        .select("*");

      if (insertResponse.error) {
        throw toDatabaseError(insertResponse.error, "Bootstrap observed Riot augments");
      }

      this.logger.info("Bootstrapped observed Riot augments for aggregation.", {
        augmentsBootstrapped: missingIds.length,
        riotAugmentIds: missingIds.join(",")
      });
    }

    return this.getAugments();
  }

  async getMatchesForPatchAndMode(patchId: string, mode: AugmentAggregationMode): Promise<DbRiotMatch[]> {
    const db = createServiceRoleSupabaseClient();
    const { data, error } = await db
      .from("riot_matches")
      .select("*")
      .eq("patch_id", patchId)
      .eq("mode", mode);

    if (error) {
      throw toDatabaseError(error, "Load persisted matches for augment aggregation");
    }

    const matches = (data ?? []).map(mapRiotMatch);

    this.logger.info("Loaded persisted matches for augment aggregation.", {
      patchId,
      mode,
      matchesProcessed: matches.length,
      queueIds: [...new Set(matches.map((match) => match.queueId))].join(",")
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
      throw toDatabaseError(error, "Load persisted participants for augment aggregation");
    }

    const participants = (data ?? []).map(mapRiotMatchParticipant);

    this.logger.info("Loaded persisted participants for augment aggregation.", {
      matchCount: matchIds.length,
      participantsProcessed: participants.length
    });

    return participants;
  }

  async persistAugmentStatistics(statistics: AggregatedAugmentStatistic[]): Promise<PersistAugmentAggregationResult> {
    let augmentsPersisted = 0;
    let championPairsPersisted = 0;

    if (!statistics.length) {
      this.logger.warn("No aggregated augment statistics to persist.", {
        augmentsAggregated: 0
      });
    }

    for (const statistic of statistics) {
      const persistedStatistic = await this.upsertAugmentStatistic(statistic);
      const pairsPersisted = await this.replaceBestChampionPairs(persistedStatistic.id, statistic);

      augmentsPersisted += 1;
      championPairsPersisted += pairsPersisted;
    }

    return {
      augmentsPersisted,
      championPairsPersisted
    };
  }

  private async upsertAugmentStatistic(statistic: AggregatedAugmentStatistic): Promise<DbAugmentStatistic> {
    const db = createServiceRoleSupabaseClient();
    const row: AugmentStatisticWriteRow = {
      patch_id: statistic.patchId,
      augment_id: statistic.augmentId,
      mode: statistic.mode,
      average_win_rate: statistic.winRate,
      pick_rate: statistic.pickRate,
      games_played: statistic.gamesPlayed,
      raw_data: toJsonValue({
        aggregation: {
          riotAugmentId: statistic.riotAugmentId,
          wins: statistic.wins,
          averagePlacement: statistic.averagePlacement,
          championPairs: statistic.championPairs
        }
      })
    };
    const response = await db
      .from("augment_statistics")
      .upsert(row as never, { onConflict: "patch_id,augment_id,mode" })
      .select("*")
      .single();

    return mapAugmentStatistic(unwrapSupabaseResponse(response, "Upsert augment statistic") as unknown as DbAugmentStatisticRow);
  }

  private async replaceBestChampionPairs(augmentStatisticId: string, statistic: AggregatedAugmentStatistic) {
    const db = createServiceRoleSupabaseClient();
    const deleteResponse = await db
      .from("augment_best_champions")
      .delete()
      .eq("augment_statistic_id" as keyof DbAugmentBestChampion, augmentStatisticId);

    if (deleteResponse.error) {
      throw toDatabaseError(deleteResponse.error, "Clear augment champion pairings");
    }

    const rows: AugmentBestChampionWriteRow[] = statistic.championPairs.map((pair, index) => ({
      augment_statistic_id: augmentStatisticId,
      champion_id: pair.championId,
      rank: index + 1,
      win_rate: pair.winRate,
      pick_rate: pair.pickRate
    }));

    if (!rows.length) {
      this.logger.warn("Aggregated augment has no champion pair rows to persist.", {
        augmentStatisticId,
        riotAugmentId: statistic.riotAugmentId
      });
      return 0;
    }

    const insertResponse = await db.from("augment_best_champions").insert(rows as never);

    if (insertResponse.error) {
      throw toDatabaseError(insertResponse.error, "Persist augment champion pairings");
    }

    return rows.length;
  }
}

export function createAugmentAggregationRepository(logger?: Logger) {
  return new AugmentAggregationRepository(logger);
}
