import "server-only";

import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { toDatabaseError } from "@/lib/supabase/errors";
import { createLogger, type Logger } from "@/server/logging/logger";
import type { DbIngestionJob, DbIngestionRun, DbPatch } from "@/types/database";

export class RefreshStatusRepository {
  private logger: Logger;

  constructor(logger: Logger = createLogger({ component: "refresh-status-repository" })) {
    this.logger = logger;
  }

  async getActivePatch(): Promise<DbPatch | null> {
    const db = createServiceRoleSupabaseClient();
    const { data, error } = await db
      .from("patches")
      .select("*")
      .eq("status", "active")
      .order("releasedAt", { ascending: false, nullsFirst: false })
      .limit(1);

    if (error) {
      throw toDatabaseError(error, "Load active patch for refresh");
    }

    return data?.[0] ?? null;
  }

  async getPatchById(patchId: string): Promise<DbPatch | null> {
    const db = createServiceRoleSupabaseClient();
    const { data, error } = await db
      .from("patches")
      .select("*")
      .eq("id", patchId)
      .maybeSingle();

    if (error) {
      throw toDatabaseError(error, "Load patch by id for refresh");
    }

    return data ?? null;
  }

  async getPatchByVersion(version: string): Promise<DbPatch | null> {
    const db = createServiceRoleSupabaseClient();
    const { data, error } = await db
      .from("patches")
      .select("*")
      .eq("version", version)
      .maybeSingle();

    if (error) {
      throw toDatabaseError(error, "Load patch by version for refresh");
    }

    return data ?? null;
  }

  async getRecentJobs(limit = 20): Promise<DbIngestionJob[]> {
    const db = createServiceRoleSupabaseClient();
    const { data, error } = await db
      .from("ingestion_jobs")
      .select("*")
      .order("updatedAt", { ascending: false })
      .limit(limit);

    if (error) {
      throw toDatabaseError(error, "Load recent ingestion jobs");
    }

    return data ?? [];
  }

  async getRunningJobs(limit = 20): Promise<DbIngestionJob[]> {
    const db = createServiceRoleSupabaseClient();
    const { data, error } = await db
      .from("ingestion_jobs")
      .select("*")
      .eq("status", "running")
      .order("startedAt", { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error) {
      throw toDatabaseError(error, "Load running ingestion jobs");
    }

    return data ?? [];
  }

  async getRecentRuns(limit = 20): Promise<DbIngestionRun[]> {
    const db = createServiceRoleSupabaseClient();
    const { data, error } = await db
      .from("ingestion_runs")
      .select("*")
      .order("startedAt", { ascending: false })
      .limit(limit);

    if (error) {
      const databaseError = toDatabaseError(error, "Load recent ingestion runs");
      this.logger.error("Failed to load recent ingestion runs.", {
        error: databaseError.message
      });
      throw databaseError;
    }

    return data ?? [];
  }
}

export function createRefreshStatusRepository(logger?: Logger) {
  return new RefreshStatusRepository(logger);
}
