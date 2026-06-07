import "server-only";

import { cache } from "react";
import { isSupabasePublicConfigAvailable } from "@/lib/supabase/config";
import { safeSupabaseQuery } from "@/lib/supabase/errors";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  DbArenaChampionStatistic,
  DbAramMayhemChampionStatistic,
  DbAugment,
  DbAugmentBestChampion,
  DbAugmentStatistic,
  DbBuild,
  DbBuildAugment,
  DbBuildItem,
  DbChampion,
  DbChampionGuide,
  DbItem,
  DbPatch,
  DbTierList,
  DbTierListEntry
} from "@/types/database";

type AnyRecord = Record<string, unknown>;
type SupabaseRowsQuery<T> = PromiseLike<{ data: T[] | null; error: unknown }>;
type SupabaseFilterQuery<T> = SupabaseRowsQuery<T> & {
  eq(column: string, value: string): SupabaseFilterQuery<T>;
  in(column: string, values: string[]): SupabaseFilterQuery<T>;
};
type SupabaseRawTable<T> = {
  select(columns: string): SupabaseFilterQuery<T>;
};
type SupabaseRawClient = {
  from<T extends AnyRecord>(table: string): SupabaseRawTable<T>;
};

export type PublishedDataset = {
  patch: DbPatch;
  champions: DbChampion[];
  items: DbItem[];
  augments: DbAugment[];
  builds: DbBuild[];
  buildItems: DbBuildItem[];
  buildAugments: DbBuildAugment[];
  arenaStats: DbArenaChampionStatistic[];
  aramMayhemStats: DbAramMayhemChampionStatistic[];
  augmentStats: DbAugmentStatistic[];
  augmentBestChampions: DbAugmentBestChampion[];
  tierLists: DbTierList[];
  tierListEntries: DbTierListEntry[];
  championGuides: DbChampionGuide[];
};

export type ChampionPublishedDataDebugSnapshot = {
  supabaseConfigAvailable: boolean;
  patch: DbPatch | null;
  champion: DbChampion | null;
  rawArenaStatisticRow: AnyRecord | null;
  mappedArenaStatisticRow: DbArenaChampionStatistic | null;
  error: string | null;
};

async function loadRows<T>(query: PromiseLike<{ data: T[] | null; error: unknown }>, context: string) {
  const result = await safeSupabaseQuery(query, context);
  return result.error ? null : result.data;
}

function rawTable<T extends AnyRecord>(db: ReturnType<typeof createServerSupabaseClient>, table: string) {
  return (db as unknown as SupabaseRawClient).from<T>(table);
}

function field<T>(row: AnyRecord, snake: string, camel: string): T {
  return (row[snake] ?? row[camel]) as T;
}

function directField<T>(row: AnyRecord, key: string): T {
  return row[key] as T;
}

function numberField(row: AnyRecord, snake: string, camel: string): number {
  return Number(field<number | string>(row, snake, camel) ?? 0);
}

function nullableNumberField(row: AnyRecord, snake: string, camel: string): number | null {
  const value = field<number | string | null>(row, snake, camel);
  return value == null ? null : Number(value);
}

function mapPatch(row: AnyRecord): DbPatch {
  return {
    id: directField<string>(row, "id"),
    version: directField<string>(row, "version"),
    dataDragonVersion: field<string | null>(row, "data_dragon_version", "dataDragonVersion"),
    status: directField<DbPatch["status"]>(row, "status"),
    releasedAt: field<string | null>(row, "released_at", "releasedAt"),
    ingestedAt: field<string | null>(row, "ingested_at", "ingestedAt"),
    notes: directField<string | null>(row, "notes"),
    createdAt: field<string>(row, "created_at", "createdAt"),
    updatedAt: field<string>(row, "updated_at", "updatedAt")
  };
}

function mapChampion(row: AnyRecord): DbChampion {
  return {
    id: directField<string>(row, "id"),
    riotChampionId: field<string>(row, "riot_champion_id", "riotChampionId"),
    riotKey: nullableNumberField(row, "riot_key", "riotKey"),
    name: directField<string>(row, "name"),
    slug: directField<string>(row, "slug"),
    title: directField<string | null>(row, "title"),
    role: directField<DbChampion["role"]>(row, "role"),
    secondaryRoles: field(row, "secondary_roles", "secondaryRoles") ?? [],
    difficulty: directField<DbChampion["difficulty"]>(row, "difficulty"),
    iconPath: field<string | null>(row, "icon_path", "iconPath"),
    splashPath: field<string | null>(row, "splash_path", "splashPath"),
    rawData: field(row, "raw_data", "rawData") ?? {},
    createdAt: field<string>(row, "created_at", "createdAt"),
    updatedAt: field<string>(row, "updated_at", "updatedAt")
  };
}

function mapItem(row: AnyRecord): DbItem {
  return {
    id: directField<string>(row, "id"),
    riotItemId: field<number>(row, "riot_item_id", "riotItemId"),
    name: directField<string>(row, "name"),
    slug: directField<string>(row, "slug"),
    category: directField<DbItem["category"]>(row, "category"),
    iconPath: field<string | null>(row, "icon_path", "iconPath"),
    rawData: field(row, "raw_data", "rawData") ?? {},
    createdAt: field<string>(row, "created_at", "createdAt"),
    updatedAt: field<string>(row, "updated_at", "updatedAt")
  };
}

function mapAugment(row: AnyRecord): DbAugment {
  return {
    id: directField<string>(row, "id"),
    riotAugmentId: field<string | null>(row, "riot_augment_id", "riotAugmentId"),
    name: directField<string>(row, "name"),
    slug: directField<string>(row, "slug"),
    description: directField<string>(row, "description"),
    iconPath: field<string | null>(row, "icon_path", "iconPath"),
    rawData: field(row, "raw_data", "rawData") ?? {},
    createdAt: field<string>(row, "created_at", "createdAt"),
    updatedAt: field<string>(row, "updated_at", "updatedAt")
  };
}

function mapBuild(row: AnyRecord): DbBuild {
  return {
    id: directField<string>(row, "id"),
    patchId: field<string>(row, "patch_id", "patchId"),
    championId: field<string>(row, "champion_id", "championId"),
    mode: directField<DbBuild["mode"]>(row, "mode"),
    kind: directField<DbBuild["kind"]>(row, "kind"),
    name: directField<string>(row, "name"),
    explanation: directField<string>(row, "explanation"),
    brokenScore: nullableNumberField(row, "broken_score", "brokenScore"),
    winRate: nullableNumberField(row, "win_rate", "winRate"),
    pickRate: nullableNumberField(row, "pick_rate", "pickRate"),
    sampleSize: numberField(row, "sample_size", "sampleSize"),
    source: directField<string>(row, "source"),
    rawData: field(row, "raw_data", "rawData") ?? {},
    createdAt: field<string>(row, "created_at", "createdAt"),
    updatedAt: field<string>(row, "updated_at", "updatedAt")
  };
}

function mapBuildItem(row: AnyRecord): DbBuildItem {
  return {
    buildId: field<string>(row, "build_id", "buildId"),
    itemId: field<string>(row, "item_id", "itemId"),
    position: directField<number>(row, "position"),
    isCore: field<boolean>(row, "is_core", "isCore"),
    createdAt: field<string>(row, "created_at", "createdAt")
  };
}

function mapBuildAugment(row: AnyRecord): DbBuildAugment {
  return {
    buildId: field<string>(row, "build_id", "buildId"),
    augmentId: field<string>(row, "augment_id", "augmentId"),
    position: directField<number>(row, "position"),
    createdAt: field<string>(row, "created_at", "createdAt")
  };
}

function mapArenaStat(row: AnyRecord): DbArenaChampionStatistic {
  return {
    id: directField<string>(row, "id"),
    patchId: field<string>(row, "patch_id", "patchId"),
    championId: field<string>(row, "champion_id", "championId"),
    tier: directField<DbArenaChampionStatistic["tier"]>(row, "tier"),
    winRate: numberField(row, "win_rate", "winRate"),
    pickRate: numberField(row, "pick_rate", "pickRate"),
    banRate: nullableNumberField(row, "ban_rate", "banRate"),
    averagePlacement: nullableNumberField(row, "average_placement", "averagePlacement"),
    brokenScore: nullableNumberField(row, "broken_score", "brokenScore"),
    gamesPlayed: numberField(row, "games_played", "gamesPlayed"),
    bestBuildId: field<string | null>(row, "best_build_id", "bestBuildId"),
    brokenBuildId: field<string | null>(row, "broken_build_id", "brokenBuildId"),
    rawData: field(row, "raw_data", "rawData") ?? {},
    createdAt: field<string>(row, "created_at", "createdAt"),
    updatedAt: field<string>(row, "updated_at", "updatedAt")
  };
}

function mapAramStat(row: AnyRecord): DbAramMayhemChampionStatistic {
  return {
    id: directField<string>(row, "id"),
    patchId: field<string>(row, "patch_id", "patchId"),
    championId: field<string>(row, "champion_id", "championId"),
    tier: directField<DbAramMayhemChampionStatistic["tier"]>(row, "tier"),
    winRate: numberField(row, "win_rate", "winRate"),
    pickRate: numberField(row, "pick_rate", "pickRate"),
    brokenScore: nullableNumberField(row, "broken_score", "brokenScore"),
    gamesPlayed: numberField(row, "games_played", "gamesPlayed"),
    bestBuildId: field<string | null>(row, "best_build_id", "bestBuildId"),
    brokenBuildId: field<string | null>(row, "broken_build_id", "brokenBuildId"),
    rawData: field(row, "raw_data", "rawData") ?? {},
    createdAt: field<string>(row, "created_at", "createdAt"),
    updatedAt: field<string>(row, "updated_at", "updatedAt")
  };
}

function mapAugmentStat(row: AnyRecord): DbAugmentStatistic {
  return {
    id: directField<string>(row, "id"),
    patchId: field<string>(row, "patch_id", "patchId"),
    augmentId: field<string>(row, "augment_id", "augmentId"),
    mode: directField<DbAugmentStatistic["mode"]>(row, "mode"),
    averageWinRate: numberField(row, "average_win_rate", "averageWinRate"),
    pickRate: numberField(row, "pick_rate", "pickRate"),
    gamesPlayed: numberField(row, "games_played", "gamesPlayed"),
    rawData: field(row, "raw_data", "rawData") ?? {},
    createdAt: field<string>(row, "created_at", "createdAt"),
    updatedAt: field<string>(row, "updated_at", "updatedAt")
  };
}

function mapAugmentBestChampion(row: AnyRecord): DbAugmentBestChampion {
  return {
    augmentStatisticId: field<string>(row, "augment_statistic_id", "augmentStatisticId"),
    championId: field<string>(row, "champion_id", "championId"),
    rank: directField<number>(row, "rank"),
    winRate: nullableNumberField(row, "win_rate", "winRate"),
    pickRate: nullableNumberField(row, "pick_rate", "pickRate")
  };
}

function mapTierList(row: AnyRecord): DbTierList {
  return {
    id: directField<string>(row, "id"),
    patchId: field<string>(row, "patch_id", "patchId"),
    mode: directField<DbTierList["mode"]>(row, "mode"),
    name: directField<string>(row, "name"),
    description: directField<string | null>(row, "description"),
    source: directField<string>(row, "source"),
    createdAt: field<string>(row, "created_at", "createdAt"),
    updatedAt: field<string>(row, "updated_at", "updatedAt")
  };
}

function mapTierListEntry(row: AnyRecord): DbTierListEntry {
  return {
    tierListId: field<string>(row, "tier_list_id", "tierListId"),
    championId: field<string>(row, "champion_id", "championId"),
    tier: directField<DbTierListEntry["tier"]>(row, "tier"),
    rank: directField<number>(row, "rank"),
    winRate: nullableNumberField(row, "win_rate", "winRate"),
    pickRate: nullableNumberField(row, "pick_rate", "pickRate"),
    notes: directField<string | null>(row, "notes"),
    createdAt: field<string>(row, "created_at", "createdAt")
  };
}

function mapChampionGuide(row: AnyRecord): DbChampionGuide {
  return {
    id: directField<string>(row, "id"),
    patchId: field<string>(row, "patch_id", "patchId"),
    championId: field<string>(row, "champion_id", "championId"),
    mode: directField<DbChampionGuide["mode"]>(row, "mode"),
    playstyle: directField<string>(row, "playstyle"),
    strengths: directField<string[] | undefined>(row, "strengths") ?? [],
    weaknesses: directField<string[] | undefined>(row, "weaknesses") ?? [],
    tips: directField<string[] | undefined>(row, "tips") ?? [],
    rawData: field(row, "raw_data", "rawData") ?? {},
    createdAt: field<string>(row, "created_at", "createdAt"),
    updatedAt: field<string>(row, "updated_at", "updatedAt")
  };
}

async function loadActivePatch() {
  const db = createServerSupabaseClient();
  const activePatch = await loadRows(db.from("patches").select("*").eq("status", "active").limit(1), "Load active patch");

  if (activePatch?.[0]) {
    return mapPatch(activePatch[0] as AnyRecord);
  }

  const latestPatch = await loadRows(db.from("patches").select("*").limit(1), "Load latest patch");
  return latestPatch?.[0] ? mapPatch(latestPatch[0] as AnyRecord) : null;
}

export async function loadChampionPublishedDataDebugSnapshot(slug: string): Promise<ChampionPublishedDataDebugSnapshot> {
  if (!isSupabasePublicConfigAvailable()) {
    return {
      supabaseConfigAvailable: false,
      patch: null,
      champion: null,
      rawArenaStatisticRow: null,
      mappedArenaStatisticRow: null,
      error: "Supabase public config is unavailable."
    };
  }

  try {
    const db = createServerSupabaseClient();
    const patch = await loadActivePatch();

    if (!patch) {
      return {
        supabaseConfigAvailable: true,
        patch: null,
        champion: null,
        rawArenaStatisticRow: null,
        mappedArenaStatisticRow: null,
        error: "No active or latest patch row was returned."
      };
    }

    const championRows = await loadRows(rawTable(db, "champions").select("*").eq("slug", slug), "Debug load champion by slug");
    const rawChampion = championRows?.[0] ?? null;
    const champion = rawChampion ? mapChampion(rawChampion) : null;

    if (!champion) {
      return {
        supabaseConfigAvailable: true,
        patch,
        champion: null,
        rawArenaStatisticRow: null,
        mappedArenaStatisticRow: null,
        error: "No champion row was returned for the requested slug."
      };
    }

    const arenaRows = await loadRows(
      rawTable(db, "arena_champion_statistics")
        .select("*")
        .eq("patch_id", patch.id)
        .eq("champion_id", champion.id),
      "Debug load Arena champion statistic"
    );
    const rawArenaStatisticRow = arenaRows?.[0] ?? null;

    return {
      supabaseConfigAvailable: true,
      patch,
      champion,
      rawArenaStatisticRow,
      mappedArenaStatisticRow: rawArenaStatisticRow ? mapArenaStat(rawArenaStatisticRow) : null,
      error: null
    };
  } catch (error) {
    return {
      supabaseConfigAvailable: true,
      patch: null,
      champion: null,
      rawArenaStatisticRow: null,
      mappedArenaStatisticRow: null,
      error: error instanceof Error ? error.message : "Unknown champion published data debug error."
    };
  }
}

export const loadPublishedDataset = cache(async (): Promise<PublishedDataset | null> => {
  if (!isSupabasePublicConfigAvailable()) {
    return null;
  }

  try {
    const db = createServerSupabaseClient();
    const patch = await loadActivePatch();

    if (!patch) {
      return null;
    }

    const [
      champions,
      items,
      augments,
      builds,
      arenaStats,
      aramMayhemStats,
      augmentStats,
      tierLists,
      championGuides
    ] = await Promise.all([
      loadRows(db.from("champions").select("*"), "Load champions"),
      loadRows(db.from("items").select("*"), "Load items"),
      loadRows(db.from("augments").select("*"), "Load augments"),
      loadRows(rawTable(db, "builds").select("*").eq("patch_id", patch.id), "Load builds"),
      loadRows(rawTable(db, "arena_champion_statistics").select("*").eq("patch_id", patch.id), "Load Arena champion statistics"),
      loadRows(rawTable(db, "aram_mayhem_champion_statistics").select("*").eq("patch_id", patch.id), "Load ARAM Mayhem champion statistics"),
      loadRows(rawTable(db, "augment_statistics").select("*").eq("patch_id", patch.id), "Load augment statistics"),
      loadRows(rawTable(db, "tier_lists").select("*").eq("patch_id", patch.id), "Load tier lists"),
      loadRows(rawTable(db, "champion_guides").select("*").eq("patch_id", patch.id), "Load champion guides")
    ]);

    if (
      !champions ||
      !items ||
      !augments ||
      !builds ||
      !arenaStats ||
      !aramMayhemStats ||
      !augmentStats ||
      !tierLists ||
      !championGuides
    ) {
      return null;
    }

    const buildIds = builds.map((build) => directField<string>(build as AnyRecord, "id"));
    const augmentStatisticIds = augmentStats.map((statistic) => directField<string>(statistic as AnyRecord, "id"));
    const tierListIds = tierLists.map((tierList) => directField<string>(tierList as AnyRecord, "id"));

    const [buildItems, buildAugments, augmentBestChampions, tierListEntries] = await Promise.all([
      buildIds.length
        ? loadRows(rawTable(db, "build_items").select("*").in("build_id", buildIds), "Load build items")
        : Promise.resolve([]),
      buildIds.length
        ? loadRows(rawTable(db, "build_augments").select("*").in("build_id", buildIds), "Load build augments")
        : Promise.resolve([]),
      augmentStatisticIds.length
        ? loadRows(rawTable(db, "augment_best_champions").select("*").in("augment_statistic_id", augmentStatisticIds), "Load augment best champions")
        : Promise.resolve([]),
      tierListIds.length
        ? loadRows(rawTable(db, "tier_list_entries").select("*").in("tier_list_id", tierListIds), "Load tier list entries")
        : Promise.resolve([])
    ]);

    if (!buildItems || !buildAugments || !augmentBestChampions || !tierListEntries) {
      return null;
    }

    return {
      patch,
      champions: champions.map((row) => mapChampion(row as AnyRecord)),
      items: items.map((row) => mapItem(row as AnyRecord)),
      augments: augments.map((row) => mapAugment(row as AnyRecord)),
      builds: builds.map((row) => mapBuild(row as AnyRecord)),
      buildItems: buildItems.map((row) => mapBuildItem(row as AnyRecord)),
      buildAugments: buildAugments.map((row) => mapBuildAugment(row as AnyRecord)),
      arenaStats: arenaStats.map((row) => mapArenaStat(row as AnyRecord)),
      aramMayhemStats: aramMayhemStats.map((row) => mapAramStat(row as AnyRecord)),
      augmentStats: augmentStats.map((row) => mapAugmentStat(row as AnyRecord)),
      augmentBestChampions: augmentBestChampions.map((row) => mapAugmentBestChampion(row as AnyRecord)),
      tierLists: tierLists.map((row) => mapTierList(row as AnyRecord)),
      tierListEntries: tierListEntries.map((row) => mapTierListEntry(row as AnyRecord)),
      championGuides: championGuides.map((row) => mapChampionGuide(row as AnyRecord))
    };
  } catch {
    return null;
  }
});
