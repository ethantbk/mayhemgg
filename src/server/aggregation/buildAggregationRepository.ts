import "server-only";

import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { toDatabaseError, unwrapSupabaseResponse } from "@/lib/supabase/errors";
import { createLogger, type Logger } from "@/server/logging/logger";
import { toJsonValue } from "@/server/ingestion/persistence/json";
import { mapRiotMatch, mapRiotMatchParticipant } from "@/server/ingestion/persistence/riotMatchRecordMappers";
import type { AggregatedChampionBuild, BuildAggregationMode } from "@/server/aggregation/buildAggregationModels";
import type {
  DbBuild,
  DbBuildItem,
  DbBuildKind,
  DbChampion,
  DbChampionDifficulty,
  DbChampionRole,
  DbGameMode,
  DbItem,
  DbItemCategory,
  DbRiotMatch,
  DbRiotMatchParticipant,
  JsonValue
} from "@/types/database";

export type PersistBuildAggregationResult = {
  buildsPersisted: number;
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

type DbItemRow = {
  id: string;
  riot_item_id: number;
  name: string;
  slug: string;
  category: DbItemCategory;
  icon_path: string | null;
  raw_data: JsonValue;
  created_at: string;
  updated_at: string;
};

type DbBuildRow = {
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

type BuildWriteRow = {
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
};

type BuildItemWriteRow = {
  build_id: string;
  item_id: string;
  position: number;
  is_core: boolean;
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

function mapItem(row: DbItemRow): DbItem {
  return {
    id: row.id,
    riotItemId: row.riot_item_id,
    name: row.name,
    slug: row.slug,
    category: row.category,
    iconPath: row.icon_path,
    rawData: row.raw_data,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapBuild(row: DbBuildRow): DbBuild {
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

    const champions = (data ?? []).map((row) => mapChampion(row as unknown as DbChampionRow));

    this.logger.info("Loaded champions for build aggregation.", {
      championsLoaded: champions.length,
      championsWithRiotKey: champions.filter((champion) => champion.riotKey !== null).length
    });

    return champions;
  }

  async getItems(): Promise<DbItem[]> {
    const db = createServiceRoleSupabaseClient();
    const { data, error } = await db.from("items").select("*");

    if (error) {
      throw toDatabaseError(error, "Load items for build aggregation");
    }

    const items = (data ?? []).map((row) => mapItem(row as unknown as DbItemRow));

    this.logger.info("Loaded items for build aggregation.", {
      itemsLoaded: items.length,
      itemsWithRiotId: items.filter((item) => item.riotItemId > 0).length
    });

    return items;
  }

  async ensureItemsForRiotIds(riotItemIds: number[]): Promise<DbItem[]> {
    const itemIds = [...new Set(riotItemIds.filter((itemId) => itemId > 0))];

    if (!itemIds.length) return this.getItems();

    const db = createServiceRoleSupabaseClient();
    const existingResponse = await db
      .from("items")
      .select("*")
      .in("riot_item_id" as keyof DbItem, itemIds);

    if (existingResponse.error) {
      throw toDatabaseError(existingResponse.error, "Load items for observed Riot item IDs");
    }

    const existingItems = (existingResponse.data ?? []).map((row) => mapItem(row as unknown as DbItemRow));
    const existingIds = new Set(existingItems.map((item) => item.riotItemId));
    const missingIds = itemIds.filter((itemId) => !existingIds.has(itemId));

    if (missingIds.length) {
      const rows = missingIds.map((itemId) => ({
        riot_item_id: itemId,
        name: `Riot Item ${itemId}`,
        slug: slugify(`riot-item-${itemId}`),
        category: "core" as DbItemCategory,
        icon_path: null,
        raw_data: toJsonValue({
          source: "riot participant bootstrap",
          riotItemId: itemId
        })
      }));
      const insertResponse = await db
        .from("items")
        .upsert(rows as never, { onConflict: "riot_item_id" })
        .select("*");

      if (insertResponse.error) {
        throw toDatabaseError(insertResponse.error, "Bootstrap observed Riot items");
      }

      this.logger.info("Bootstrapped observed Riot items for build aggregation.", {
        itemsBootstrapped: missingIds.length,
        riotItemIds: missingIds.join(",")
      });
    }

    return this.getItems();
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

    const matches = (data ?? []).map(mapRiotMatch);

    this.logger.info("Loaded persisted matches for build aggregation.", {
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
      throw toDatabaseError(error, "Load persisted participants for build aggregation");
    }

    const participants = (data ?? []).map(mapRiotMatchParticipant);

    this.logger.info("Loaded persisted participants for build aggregation.", {
      matchCount: matchIds.length,
      participantsProcessed: participants.length
    });

    return participants;
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
    const row: BuildWriteRow = {
      patch_id: build.patchId,
      champion_id: build.championId,
      mode: build.mode,
      kind: build.kind,
      name: build.name,
      explanation: build.explanation,
      broken_score: null,
      win_rate: build.winRate,
      pick_rate: build.pickRate,
      sample_size: build.gamesPlayed,
      source: "riot-aggregation",
      raw_data: toJsonValue({
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
      .eq("patch_id" as keyof DbBuild, build.patchId)
      .eq("champion_id" as keyof DbBuild, build.championId)
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
        .update(row as never)
        .eq("id", existing.data.id)
        .select("*")
        .single();

      return mapBuild(unwrapSupabaseResponse(response, "Update aggregated build") as unknown as DbBuildRow);
    }

    const response = await db
      .from("builds")
      .insert(row as never)
      .select("*")
      .single();

    return mapBuild(unwrapSupabaseResponse(response, "Insert aggregated build") as unknown as DbBuildRow);
  }

  private async replaceBuildItems(buildId: string, itemRiotIds: number[], itemsByRiotId: Map<number, DbItem>) {
    const db = createServiceRoleSupabaseClient();
    const deleteResponse = await db.from("build_items").delete().eq("build_id" as keyof DbBuildItem, buildId);

    if (deleteResponse.error) {
      throw toDatabaseError(deleteResponse.error, "Clear aggregated build items");
    }

    const rows = itemRiotIds
      .map((riotItemId, index) => {
        const item = itemsByRiotId.get(riotItemId);

        return item
          ? {
              build_id: buildId,
              item_id: item.id,
              position: index + 1,
              is_core: index < 3
            }
          : null;
      })
      .filter((row): row is BuildItemWriteRow => Boolean(row));

    if (!rows.length) {
      this.logger.warn("Aggregated build has no known item rows to persist.", {
        buildId,
        itemCount: itemRiotIds.length
      });
      return;
    }

    const insertResponse = await db.from("build_items").insert(rows as never);

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
      .update({ best_build_id: buildId } as never)
      .eq("patch_id" as "patchId", build.patchId)
      .eq("champion_id" as "championId", build.championId);

    if (error) {
      throw toDatabaseError(error, "Link aggregated best build to champion statistics");
    }
  }
}

export function createBuildAggregationRepository(logger?: Logger) {
  return new BuildAggregationRepository(logger);
}
