import type {
  DbArenaChampionStatistic,
  DbAramMayhemChampionStatistic,
  DbAugment,
  DbAugmentBestChampion,
  DbAugmentStatistic,
  DbBuild,
  DbBuildAugment,
  DbBuildItem,
  DbChaosBuild,
  DbChaosBuildBookmark,
  DbChaosBuildCategory,
  DbChaosBuildComment,
  DbChaosBuildRating,
  DbChaosBuildRisk,
  DbChaosBuildStatus,
  DbChaosCommentStatus,
  DbChaosCreator,
  DbChaosRatingDifficulty,
  DbChampion,
  DbChampionDifficulty,
  DbChampionGuide,
  DbChampionRole,
  DbBuildKind,
  DbGameMode,
  DbIngestionJobStatus,
  DbItem,
  DbItemCategory,
  DbPatch,
  DbPatchStatus,
  DbRiotMatch,
  DbRiotMatchParticipant,
  DbTierList,
  DbTierListEntry,
  DbTierRank,
  JsonValue,
  NewDbArenaChampionStatistic,
  NewDbAramMayhemChampionStatistic,
  NewDbAugment,
  NewDbAugmentStatistic,
  NewDbBuild,
  NewDbBuildAugment,
  NewDbBuildItem,
  NewDbChaosBuild,
  NewDbChaosBuildBookmark,
  NewDbChaosBuildComment,
  NewDbChaosBuildRating,
  NewDbChaosCreator,
  NewDbChampion,
  NewDbChampionGuide,
  NewDbItem,
  NewDbPatch,
  NewDbRiotMatch,
  NewDbRiotMatchParticipant,
  NewDbTierList
} from "@/types/database";

type TableDefinition<Row, Insert = Row, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

type SupabaseIngestionRunRow = {
  id: string;
  patch_id: string | null;
  source: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  records_processed: number;
  error_message: string | null;
  metadata: JsonValue;
};

type SupabaseIngestionRunInsert = Omit<SupabaseIngestionRunRow, "id" | "started_at" | "finished_at" | "records_processed" | "error_message" | "metadata"> & {
  id?: string;
  started_at?: string;
  finished_at?: string | null;
  records_processed?: number;
  error_message?: string | null;
  metadata?: JsonValue;
};

type SupabaseIngestionJobRow = {
  id: string;
  job_id: string;
  job_type: string;
  source: string;
  status: DbIngestionJobStatus;
  patch_id: string | null;
  riot_match_id: string | null;
  queue_id: number | null;
  attempt_count: number;
  locked_at: string | null;
  next_attempt_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  error_message: string | null;
  metadata: JsonValue;
  created_at: string;
  updated_at: string;
};

type SupabaseIngestionJobInsert = Omit<
  SupabaseIngestionJobRow,
  | "id"
  | "source"
  | "status"
  | "patch_id"
  | "riot_match_id"
  | "queue_id"
  | "attempt_count"
  | "locked_at"
  | "next_attempt_at"
  | "started_at"
  | "finished_at"
  | "error_message"
  | "metadata"
  | "created_at"
  | "updated_at"
> & {
  id?: string;
  source?: string;
  status?: DbIngestionJobStatus;
  patch_id?: string | null;
  riot_match_id?: string | null;
  queue_id?: number | null;
  attempt_count?: number;
  locked_at?: string | null;
  next_attempt_at?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
  error_message?: string | null;
  metadata?: JsonValue;
  created_at?: string;
  updated_at?: string;
};

export type MayhemDatabase = {
  public: {
    Tables: {
      patches: TableDefinition<DbPatch, NewDbPatch>;
      champions: TableDefinition<DbChampion, NewDbChampion>;
      items: TableDefinition<DbItem, NewDbItem>;
      augments: TableDefinition<DbAugment, NewDbAugment>;
      builds: TableDefinition<DbBuild, NewDbBuild>;
      build_items: TableDefinition<DbBuildItem, NewDbBuildItem>;
      build_augments: TableDefinition<DbBuildAugment, NewDbBuildAugment>;
      arena_champion_statistics: TableDefinition<DbArenaChampionStatistic, NewDbArenaChampionStatistic>;
      aram_mayhem_champion_statistics: TableDefinition<DbAramMayhemChampionStatistic, NewDbAramMayhemChampionStatistic>;
      augment_statistics: TableDefinition<DbAugmentStatistic, NewDbAugmentStatistic>;
      augment_best_champions: TableDefinition<DbAugmentBestChampion>;
      tier_lists: TableDefinition<DbTierList, NewDbTierList>;
      tier_list_entries: TableDefinition<DbTierListEntry>;
      champion_guides: TableDefinition<DbChampionGuide, NewDbChampionGuide>;
      chaos_creators: TableDefinition<DbChaosCreator, NewDbChaosCreator>;
      chaos_builds: TableDefinition<DbChaosBuild, NewDbChaosBuild>;
      chaos_build_bookmarks: TableDefinition<DbChaosBuildBookmark, NewDbChaosBuildBookmark>;
      chaos_build_ratings: TableDefinition<DbChaosBuildRating, NewDbChaosBuildRating>;
      chaos_build_comments: TableDefinition<DbChaosBuildComment, NewDbChaosBuildComment>;
      ingestion_runs: TableDefinition<SupabaseIngestionRunRow, SupabaseIngestionRunInsert>;
      riot_matches: TableDefinition<DbRiotMatch, NewDbRiotMatch>;
      riot_match_participants: TableDefinition<DbRiotMatchParticipant, NewDbRiotMatchParticipant>;
      ingestion_jobs: TableDefinition<SupabaseIngestionJobRow, SupabaseIngestionJobInsert>;
    };
    Views: Record<string, never>;
    Functions: {
      persist_riot_match: {
        Args: {
          p_match: JsonValue;
          p_participants: JsonValue;
        };
        Returns: string;
      };
    };
    Enums: {
      game_mode: DbGameMode;
      champion_role: DbChampionRole;
      champion_difficulty: DbChampionDifficulty;
      tier_rank: DbTierRank;
      build_kind: DbBuildKind;
      item_category: DbItemCategory;
      patch_status: DbPatchStatus;
      ingestion_job_status: DbIngestionJobStatus;
      chaos_build_category: DbChaosBuildCategory;
      chaos_build_status: DbChaosBuildStatus;
      chaos_build_risk: DbChaosBuildRisk;
      chaos_rating_difficulty: DbChaosRatingDifficulty;
      chaos_comment_status: DbChaosCommentStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};

export type MayhemTableName = keyof MayhemDatabase["public"]["Tables"];
