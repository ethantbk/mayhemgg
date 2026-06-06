import "server-only";

import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { toDatabaseError, unwrapSupabaseResponse } from "@/lib/supabase/errors";
import { createLogger, type Logger } from "@/server/logging/logger";
import { toJsonValue } from "@/server/ingestion/persistence/json";
import { mapRiotMatch, mapRiotMatchParticipant } from "@/server/ingestion/persistence/riotMatchRecordMappers";
import type { AggregatedChampionBuild, BuildAggregationMode } from "@/server/aggregation/buildAggregationModels";
import type { DbBuild, DbChampion, DbItem, DbRiotMatch, DbRiotMatchParticipant, NewDbBuild } from "@/types/database";

export type PersistBuildAggregationResult = {
  buildsPersisted: number;
};

export class BuildAggregationRepository {
  private logger: Logger;

  constructor(logger: Logger = createLogger({ component: "build-aggregation-repository" })) {
    this.logger = logger;
  }

  async getChampions(): Promise<DbChampion[]> {
    const db = createServiceRoleSupabaseClient();
    const { data, error } = await db.from("champions").select("*");

    if (error) {
      throw toDatabaseError(error, "Load champions for build aggregation");
    }

    return data ?? [];
  }

  async getItems(): Promise<DbItem[]> {
    const db = createServiceRoleSupabaseClient();
    const { data, error } = await db.from("items").select("*");

    if (error) {
      throw toDatabaseError(error, "Load items for build aggregation");
    }

    return data ?? [];
  }

  async getMatchesForPatchAndMode(patchId: string, mode: BuildAggregationMode): Promise<DbRiotMatch[]> {
    const db = createServiceRoleSupabaseClient();
    const { data, error } = await db
      .from("riot_matches")
      .select("*")
      .eq("patch_id", patchId)
      .eq("mode", mode);

    if (error) {
      throw toDatabaseError(error, "Load persisted matches for build aggregation");
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
      throw toDatabaseError(error, "Load persisted participants for build aggregation");
    }

    return (data ?? []).map(mapRiotMatchParticipant);
  }

  async persistBuilds(builds: AggregatedChampionBuild[], itemsByRiotId: Map<number, DbItem>): Promise<PersistBuildAggregationResult> {
    let buildsPersisted = 0;

    for (const build of builds) {
      const persistedBuild = await this.upsertBuild(build);
      await this.replaceBuildItems(persistedBuild.id, build.itemRiotIds, itemsByRiotId);
      await this.linkBestBuildToChampionStatistic(build, persistedBuild.id);
      buildsPersisted += 1;
    }

    return { buildsPersisted };
  }

  private async upsertBuild(build: AggregatedChampionBuild): Promise<DbBuild> {
    const db = createServiceRoleSupabaseClient();
    const row: NewDbBuild = {
      patchId: build.patchId,
      championId: build.championId,
      mode: build.mode,
      kind: build.kind,
      name: build.name,
      explanation: build.explanation,
      brokenScore: null,
      winRate: build.winRate,
      pickRate: build.pickRate,
      sampleSize: build.gamesPlayed,
      source: "riot-aggregation",
      rawData: toJsonValue({
        aggregation: {
          riotChampionId: build.riotChampionId,
          itemSetKey: build.itemSetKey,
          itemRiotIds: build.itemRiotIds,
          wins: build.wins,
          averagePlacement: build.averagePlacement,
          modePickRate: build.modePickRate,
          observedOrders: build.observedOrders
        }
      })
    };
    const existing = await db
      .from("builds")
      .select("*")
      .eq("patchId", build.patchId)
      .eq("championId", build.championId)
      .eq("mode", build.mode)
      .eq("kind", build.kind)
      .eq("name", build.name)
      .maybeSingle();

    if (existing.error) {
      throw toDatabaseError(existing.error, "Load existing aggregated build");
    }

    if (existing.data) {
      const response = await db
        .from("builds")
        .update(row)
        .eq("id", existing.data.id)
        .select("*")
        .single();

      return unwrapSupabaseResponse(response, "Update aggregated build");
    }

    const response = await db
      .from("builds")
      .insert(row)
      .select("*")
      .single();

    return unwrapSupabaseResponse(response, "Insert aggregated build");
  }

  private async replaceBuildItems(buildId: string, itemRiotIds: number[], itemsByRiotId: Map<number, DbItem>) {
    const db = createServiceRoleSupabaseClient();
    const deleteResponse = await db.from("build_items").delete().eq("buildId", buildId);

    if (deleteResponse.error) {
      throw toDatabaseError(deleteResponse.error, "Clear aggregated build items");
    }

    const rows = itemRiotIds
      .map((riotItemId, index) => {
        const item = itemsByRiotId.get(riotItemId);

        return item
          ? {
              buildId,
              itemId: item.id,
              position: index + 1,
              isCore: index < 3
            }
          : null;
      })
      .filter((row): row is { buildId: string; itemId: string; position: number; isCore: boolean } => Boolean(row));

    if (!rows.length) {
      this.logger.warn("Aggregated build has no known item rows to persist.", {
        buildId,
        itemCount: itemRiotIds.length
      });
      return;
    }

    const insertResponse = await db.from("build_items").insert(rows);

    if (insertResponse.error) {
      throw toDatabaseError(insertResponse.error, "Persist aggregated build items");
    }
  }

  private async linkBestBuildToChampionStatistic(build: AggregatedChampionBuild, buildId: string) {
    if (build.kind !== "best") return;

    const db = createServiceRoleSupabaseClient();
    const table = build.mode === "arena" ? "arena_champion_statistics" : "aram_mayhem_champion_statistics";
    const { error } = await db
      .from(table)
      .update({ bestBuildId: buildId })
      .eq("patchId", build.patchId)
      .eq("championId", build.championId);

    if (error) {
      throw toDatabaseError(error, "Link aggregated best build to champion statistics");
    }
  }
}

export function createBuildAggregationRepository(logger?: Logger) {
  return new BuildAggregationRepository(logger);
}
