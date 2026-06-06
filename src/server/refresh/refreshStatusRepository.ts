import "server-only";

import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { toDatabaseError } from "@/lib/supabase/errors";
import {
  mapIngestionJob,
  mapIngestionRun
} from "@/server/ingestion/persistence/ingestionRecordMappers";
import { createLogger, type Logger } from "@/server/logging/logger";
import type { DbIngestionJob, DbIngestionRun, DbPatch } from "@/types/database";

const PATCH_SELECT: string = `
  id,
  version,
  dataDragonVersion:data_dragon_version,
  status,
  releasedAt:released_at,
  ingestedAt:ingested_at,
  notes,
  createdAt:created_at,
  updatedAt:updated_at
`;

function mapPatch(row: unknown): DbPatch {
  return row as DbPatch;
}

export class RefreshStatusRepository {
  private logger: Logger;

  constructor(logger: Logger = createLogger({ component: "refresh-status-repository" })) {
    this.logger = logger;
  }

  async getActivePatch(): Promise<DbPatch | null> {
    const db = createServiceRoleSupabaseClient();
    const { data, error } = await db
      .from("patches")
      .select(PATCH_SELECT)
      .eq("status", "active")
      .order("released_at", { ascending: false, nullsFirst: false })
      .limit(1);

    if (error) {
      throw toDatabaseError(error, "Load active patch for refresh");
    }

    return data?.[0] ? mapPatch(data[0]) : null;
  }

  async getPatchById(patchId: string): Promise<DbPatch | null> {
    const db = createServiceRoleSupabaseClient();
    const { data, error } = await db
      .from("patches")
      .select(PATCH_SELECT)
      .eq("id", patchId)
      .maybeSingle();

    if (error) {
      throw toDatabaseError(error, "Load patch by id for refresh");
    }

    return data ? mapPatch(data) : null;
  }

  async getPatchByVersion(version: string): Promise<DbPatch | null> {
    const db = createServiceRoleSupabaseClient();
    const { data, error } = await db
      .from("patches")
      .select(PATCH_SELECT)
      .eq("version", version)
      .maybeSingle();

    if (error) {
      throw toDatabaseError(error, "Load patch by version for refresh");
    }

    return data ? mapPatch(data) : null;
  }

  async getRecentJobs(limit = 20): Promise<DbIngestionJob[]> {
    const db = createServiceRoleSupabaseClient();
    const { data, error } = await db
      .from("ingestion_jobs")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw toDatabaseError(error, "Load recent ingestion jobs");
    }

    return (data ?? []).map(mapIngestionJob);
  }

  async getRunningJobs(limit = 20): Promise<DbIngestionJob[]> {
    const db = createServiceRoleSupabaseClient();
    const { data, error } = await db
      .from("ingestion_jobs")
      .select("*")
      .eq("status", "running")
      .order("started_at", { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error) {
      throw toDatabaseError(error, "Load running ingestion jobs");
    }

    return (data ?? []).map(mapIngestionJob);
  }

  async getRecentRuns(limit = 20): Promise<DbIngestionRun[]> {
    const db = createServiceRoleSupabaseClient();
    const { data, error } = await db
      .from("ingestion_runs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(limit);

    if (error) {
      const databaseError = toDatabaseError(error, "Load recent ingestion runs");
      this.logger.error("Failed to load recent ingestion runs.", {
        error: databaseError.message
      });
      throw databaseError;
    }

    return (data ?? []).map(mapIngestionRun);
  }
}

export function createRefreshStatusRepository(logger?: Logger) {
  return new RefreshStatusRepository(logger);
}
