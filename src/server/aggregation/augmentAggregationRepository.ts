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
  DbRiotMatch,
  DbRiotMatchParticipant,
  NewDbAugmentStatistic
} from "@/types/database";

export type PersistAugmentAggregationResult = {
  augmentsPersisted: number;
  championPairsPersisted: number;
};

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

    return data ?? [];
  }

  async getAugments(): Promise<DbAugment[]> {
    const db = createServiceRoleSupabaseClient();
    const { data, error } = await db.from("augments").select("*");

    if (error) {
      throw toDatabaseError(error, "Load augments for aggregation");
    }

    return data ?? [];
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
      throw toDatabaseError(error, "Load persisted participants for augment aggregation");
    }

    return (data ?? []).map(mapRiotMatchParticipant);
  }

  async persistAugmentStatistics(statistics: AggregatedAugmentStatistic[]): Promise<PersistAugmentAggregationResult> {
    let augmentsPersisted = 0;
    let championPairsPersisted = 0;

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
    const row: NewDbAugmentStatistic = {
      patchId: statistic.patchId,
      augmentId: statistic.augmentId,
      mode: statistic.mode,
      averageWinRate: statistic.winRate,
      pickRate: statistic.pickRate,
      gamesPlayed: statistic.gamesPlayed,
      rawData: toJsonValue({
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
      .upsert(row, { onConflict: "patchId,augmentId,mode" })
      .select("*")
      .single();

    return unwrapSupabaseResponse(response, "Upsert augment statistic");
  }

  private async replaceBestChampionPairs(augmentStatisticId: string, statistic: AggregatedAugmentStatistic) {
    const db = createServiceRoleSupabaseClient();
    const deleteResponse = await db
      .from("augment_best_champions")
      .delete()
      .eq("augmentStatisticId", augmentStatisticId);

    if (deleteResponse.error) {
      throw toDatabaseError(deleteResponse.error, "Clear augment champion pairings");
    }

    const rows: DbAugmentBestChampion[] = statistic.championPairs.map((pair, index) => ({
      augmentStatisticId,
      championId: pair.championId,
      rank: index + 1,
      winRate: pair.winRate,
      pickRate: pair.pickRate
    }));

    if (!rows.length) {
      this.logger.warn("Aggregated augment has no champion pair rows to persist.", {
        augmentStatisticId,
        riotAugmentId: statistic.riotAugmentId
      });
      return 0;
    }

    const insertResponse = await db.from("augment_best_champions").insert(rows);

    if (insertResponse.error) {
      throw toDatabaseError(insertResponse.error, "Persist augment champion pairings");
    }

    return rows.length;
  }
}

export function createAugmentAggregationRepository(logger?: Logger) {
  return new AugmentAggregationRepository(logger);
}
