import "server-only";

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

async function loadRows<T>(query: PromiseLike<{ data: T[] | null; error: unknown }>, context: string) {
  const result = await safeSupabaseQuery(query, context);
  return result.error ? null : result.data;
}

async function loadActivePatch() {
  const db = createServerSupabaseClient();
  const activePatch = await loadRows(db.from("patches").select("*").eq("status", "active").limit(1), "Load active patch");

  if (activePatch?.[0]) {
    return activePatch[0];
  }

  const latestPatch = await loadRows(db.from("patches").select("*").limit(1), "Load latest patch");
  return latestPatch?.[0] ?? null;
}

export async function loadPublishedDataset(): Promise<PublishedDataset | null> {
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
      loadRows(db.from("builds").select("*").eq("patchId", patch.id), "Load builds"),
      loadRows(db.from("arena_champion_statistics").select("*").eq("patchId", patch.id), "Load Arena champion statistics"),
      loadRows(db.from("aram_mayhem_champion_statistics").select("*").eq("patchId", patch.id), "Load ARAM Mayhem champion statistics"),
      loadRows(db.from("augment_statistics").select("*").eq("patchId", patch.id), "Load augment statistics"),
      loadRows(db.from("tier_lists").select("*").eq("patchId", patch.id), "Load tier lists"),
      loadRows(db.from("champion_guides").select("*").eq("patchId", patch.id), "Load champion guides")
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

    const buildIds = builds.map((build) => build.id);
    const augmentStatisticIds = augmentStats.map((statistic) => statistic.id);
    const tierListIds = tierLists.map((tierList) => tierList.id);

    const [buildItems, buildAugments, augmentBestChampions, tierListEntries] = await Promise.all([
      buildIds.length
        ? loadRows(db.from("build_items").select("*").in("buildId", buildIds), "Load build items")
        : Promise.resolve([]),
      buildIds.length
        ? loadRows(db.from("build_augments").select("*").in("buildId", buildIds), "Load build augments")
        : Promise.resolve([]),
      augmentStatisticIds.length
        ? loadRows(db.from("augment_best_champions").select("*").in("augmentStatisticId", augmentStatisticIds), "Load augment best champions")
        : Promise.resolve([]),
      tierListIds.length
        ? loadRows(db.from("tier_list_entries").select("*").in("tierListId", tierListIds), "Load tier list entries")
        : Promise.resolve([])
    ]);

    if (!buildItems || !buildAugments || !augmentBestChampions || !tierListEntries) {
      return null;
    }

    return {
      patch,
      champions,
      items,
      augments,
      builds,
      buildItems,
      buildAugments,
      arenaStats,
      aramMayhemStats,
      augmentStats,
      augmentBestChampions,
      tierLists,
      tierListEntries,
      championGuides
    };
  } catch {
    return null;
  }
}
