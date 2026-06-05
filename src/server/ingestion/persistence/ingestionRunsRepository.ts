import "server-only";

import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { toDatabaseError, unwrapSupabaseResponse } from "@/lib/supabase/errors";
import { createLogger, type Logger } from "@/server/logging/logger";
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
        .insert({
          patchId: input.patchId ?? null,
          source: input.source,
          status: "running",
          metadata: input.metadata ?? {}
        })
        .select("*")
        .single();

      const run = unwrapSupabaseResponse(response, "Start ingestion run");

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
        .update({
          status: "succeeded",
          finishedAt: new Date().toISOString(),
          recordsProcessed: input.recordsProcessed ?? 0,
          metadata: input.metadata ?? {}
        })
        .eq("id", input.runId)
        .select("*")
        .single();

      return unwrapSupabaseResponse(response, "Complete ingestion run");
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
        .update({
          status: "failed",
          finishedAt: new Date().toISOString(),
          recordsProcessed: input.recordsProcessed ?? 0,
          errorMessage: databaseError.message,
          metadata: input.metadata ?? toJsonValue({ error: databaseError.message })
        })
        .eq("id", input.runId)
        .select("*")
        .single();

      return unwrapSupabaseResponse(response, "Fail ingestion run");
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
