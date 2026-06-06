import "server-only";

import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { toDatabaseError, unwrapSupabaseResponse } from "@/lib/supabase/errors";
import { createLogger, type Logger } from "@/server/logging/logger";
import {
  mapIngestionRun,
  toIngestionRunWrite
} from "@/server/ingestion/persistence/ingestionRecordMappers";
import { toJsonValue } from "@/server/ingestion/persistence/json";
import type { DbIngestionRun, JsonValue } from "@/types/database";

type StartIngestionRunInput = {
  patchId?: string | null;
  source: string;
  metadata?: JsonValue;
};

type CompleteIngestionRunInput = {
  runId: string;
  recordsProcessed?: number;
  metadata?: JsonValue;
};

type FailIngestionRunInput = {
  runId: string;
  error: unknown;
  recordsProcessed?: number;
  metadata?: JsonValue;
};

export class IngestionRunsRepository {
  private logger: Logger;

  constructor(logger: Logger = createLogger({ component: "ingestion-runs-repository" })) {
    this.logger = logger;
  }

  async startRun(input: StartIngestionRunInput): Promise<DbIngestionRun> {
    try {
      const db = createServiceRoleSupabaseClient();
      const response = await db
        .from("ingestion_runs")
        .insert(toIngestionRunWrite({
          patch_id: input.patchId ?? null,
          source: input.source,
          status: "running",
          metadata: input.metadata ?? {}
        }) as never)
        .select("*")
        .single();

      const run = mapIngestionRun(unwrapSupabaseResponse(response, "Start ingestion run"));

      this.logger.info("Started ingestion run.", {
        ingestionRunId: run.id,
        source: run.source
      });

      return run;
    } catch (error) {
      const databaseError = toDatabaseError(error, "Start ingestion run");
      this.logger.error("Failed to start ingestion run.", {
        error: databaseError.message,
        source: input.source
      });
      throw databaseError;
    }
  }

  async completeRun(input: CompleteIngestionRunInput): Promise<DbIngestionRun> {
    try {
      const db = createServiceRoleSupabaseClient();
      const response = await db
        .from("ingestion_runs")
        .update(toIngestionRunWrite({
          status: "succeeded",
          finished_at: new Date().toISOString(),
          records_processed: input.recordsProcessed ?? 0,
          metadata: input.metadata ?? {}
        }) as never)
        .eq("id", input.runId)
        .select("*")
        .single();

      return mapIngestionRun(unwrapSupabaseResponse(response, "Complete ingestion run"));
    } catch (error) {
      const databaseError = toDatabaseError(error, "Complete ingestion run");
      this.logger.error("Failed to complete ingestion run.", {
        error: databaseError.message,
        ingestionRunId: input.runId
      });
      throw databaseError;
    }
  }

  async failRun(input: FailIngestionRunInput): Promise<DbIngestionRun> {
    const databaseError = toDatabaseError(input.error, "Ingestion run failed");

    try {
      const db = createServiceRoleSupabaseClient();
      const response = await db
        .from("ingestion_runs")
        .update(toIngestionRunWrite({
          status: "failed",
          finished_at: new Date().toISOString(),
          records_processed: input.recordsProcessed ?? 0,
          error_message: databaseError.message,
          metadata: input.metadata ?? toJsonValue({ error: databaseError.message })
        }) as never)
        .eq("id", input.runId)
        .select("*")
        .single();

      return mapIngestionRun(unwrapSupabaseResponse(response, "Fail ingestion run"));
    } catch (error) {
      const persistenceError = toDatabaseError(error, "Persist ingestion run failure");
      this.logger.error("Failed to persist ingestion run failure.", {
        error: persistenceError.message,
        originalError: databaseError.message,
        ingestionRunId: input.runId
      });
      throw persistenceError;
    }
  }
}

export function createIngestionRunsRepository(logger?: Logger) {
  return new IngestionRunsRepository(logger);
}
