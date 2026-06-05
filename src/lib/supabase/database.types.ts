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
  DbChampionDifficulty,
  DbChampionGuide,
  DbChampionRole,
  DbBuildKind,
  DbGameMode,
  DbIngestionRun,
  DbItem,
  DbItemCategory,
  DbPatch,
  DbPatchStatus,
  DbTierList,
  DbTierListEntry,
  DbTierRank,
  NewDbArenaChampionStatistic,
  NewDbAramMayhemChampionStatistic,
  NewDbAugment,
  NewDbAugmentStatistic,
  NewDbBuild,
  NewDbChampion,
  NewDbChampionGuide,
  NewDbItem,
  NewDbPatch,
  NewDbTierList
} from "@/types/database";

type TableDefinition<Row, Insert = Row, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type MayhemDatabase = {
  public: {
    Tables: {
      patches: TableDefinition<DbPatch, NewDbPatch>;
      champions: TableDefinition<DbChampion, NewDbChampion>;
      items: TableDefinition<DbItem, NewDbItem>;
      augments: TableDefinition<DbAugment, NewDbAugment>;
      builds: TableDefinition<DbBuild, NewDbBuild>;
      build_items: TableDefinition<DbBuildItem>;
      build_augments: TableDefinition<DbBuildAugment>;
      arena_champion_statistics: TableDefinition<DbArenaChampionStatistic, NewDbArenaChampionStatistic>;
      aram_mayhem_champion_statistics: TableDefinition<DbAramMayhemChampionStatistic, NewDbAramMayhemChampionStatistic>;
      augment_statistics: TableDefinition<DbAugmentStatistic, NewDbAugmentStatistic>;
      augment_best_champions: TableDefinition<DbAugmentBestChampion>;
      tier_lists: TableDefinition<DbTierList, NewDbTierList>;
      tier_list_entries: TableDefinition<DbTierListEntry>;
      champion_guides: TableDefinition<DbChampionGuide, NewDbChampionGuide>;
      ingestion_runs: TableDefinition<DbIngestionRun>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      game_mode: DbGameMode;
      champion_role: DbChampionRole;
      champion_difficulty: DbChampionDifficulty;
      tier_rank: DbTierRank;
      build_kind: DbBuildKind;
      item_category: DbItemCategory;
      patch_status: DbPatchStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};

export type MayhemTableName = keyof MayhemDatabase["public"]["Tables"];
