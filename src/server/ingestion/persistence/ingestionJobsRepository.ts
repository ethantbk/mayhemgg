import "server-only";

import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { toDatabaseError, unwrapSupabaseResponse } from "@/lib/supabase/errors";
import { createLogger, type Logger } from "@/server/logging/logger";
import type { AugmentAggregationJob } from "@/server/aggregation/augmentAggregationModels";
import type { BrokenScoreJob } from "@/server/aggregation/brokenScoreModels";
import type { BuildAggregationJob } from "@/server/aggregation/buildAggregationModels";
import type { ChampionAggregationJob } from "@/server/aggregation/championAggregationModels";
import type { MatchIngestionJob } from "@/server/ingestion/matchIngestionJobs";
import { toJsonValue } from "@/server/ingestion/persistence/json";
import type { DbIngestionJob, DbIngestionJobStatus, JsonValue, NewDbIngestionJob } from "@/types/database";

export type PipelineIngestionJob = {
  type: "aggregation-pipeline";
  jobId: string;
  patchId: string;
};

export type TrackableIngestionJob =
  | MatchIngestionJob
  | ChampionAggregationJob
  | BuildAggregationJob
  | AugmentAggregationJob
  | BrokenScoreJob
  | PipelineIngestionJob;

type UpsertJobInput = {
  job: TrackableIngestionJob;
  patchId?: string | null;
  status?: DbIngestionJobStatus;
  metadata?: JsonValue;
};

type MarkJobFailedInput = {
  jobId: string;
  status: Extract<DbIngestionJobStatus, "retryable_failed" | "rate_limited" | "permanently_failed">;
  error: unknown;
  nextAttemptAt?: string | null;
};

type AcquireExclusiveJobInput = UpsertJobInput & {
  lockTtlMs?: number;
};

function getRiotMatchId(job: TrackableIngestionJob) {
  return job.type === "match-fetch" ? job.riotMatchId : null;
}

function getQueueId(job: TrackableIngestionJob) {
  return job.type === "match-discovery" ? job.queueId : null;
}

function isFreshRunningJob(job: DbIngestionJob | undefined, lockTtlMs: number) {
  if (!job || job.status !== "running") return false;
  if (!job.lockedAt) return true;

  return Date.now() - new Date(job.lockedAt).getTime() < lockTtlMs;
}

export class IngestionJobsRepository {
  private logger: Logger;

  constructor(logger: Logger = createLogger({ component: "ingestion-jobs-repository" })) {
    this.logger = logger;
  }

  async acquireExclusiveJob(input: AcquireExclusiveJobInput): Promise<DbIngestionJob | null> {
    const lockTtlMs = input.lockTtlMs ?? 60 * 60 * 1000;

    try {
      const db = createServiceRoleSupabaseClient();
      const existingResponse = await db
        .from("ingestion_jobs")
        .select("*")
        .eq("jobId", input.job.jobId)
        .limit(1);
      const existingRows = unwrapSupabaseResponse(existingResponse, "Load ingestion job lock");
      const existingJob = existingRows[0];

      if (isFreshRunningJob(existingJob, lockTtlMs)) {
        this.logger.warn("Duplicate ingestion job prevented by active lock.", {
          jobId: input.job.jobId,
          jobType: input.job.type,
          lockedAt: existingJob.lockedAt
        });

        return null;
      }

      if (!existingJob) {
        const insertResponse = await db
          .from("ingestion_jobs")
          .insert({
            jobId: input.job.jobId,
            jobType: input.job.type,
            source: "riot",
            status: "queued",
            patchId: input.patchId ?? null,
            riotMatchId: getRiotMatchId(input.job),
            queueId: getQueueId(input.job),
            metadata: input.metadata ?? toJsonValue(input.job)
          });

        if (insertResponse.error) {
          const insertError = toDatabaseError(insertResponse.error, "Create ingestion job lock");

          if (insertError.code !== "23505") {
            throw insertError;
          }
        }
      }

      const now = new Date().toISOString();
      let updateQuery = db
        .from("ingestion_jobs")
        .update({
          status: "running",
          lockedAt: now,
          startedAt: now,
          finishedAt: null,
          errorMessage: null,
          patchId: input.patchId ?? null,
          metadata: input.metadata ?? toJsonValue(input.job)
        })
        .eq("jobId", input.job.jobId);

      if (existingJob?.status === "running" && existingJob.lockedAt) {
        updateQuery = updateQuery.eq("lockedAt", existingJob.lockedAt);
      } else {
        updateQuery = updateQuery.neq("status", "running");
      }

      const response = await updateQuery.select("*");
      const lockedRows = unwrapSupabaseResponse(response, "Acquire ingestion job lock");

      return lockedRows[0] ?? null;
    } catch (error) {
      const databaseError = toDatabaseError(error, "Acquire ingestion job lock");
      this.logger.error("Failed to acquire ingestion job lock.", {
        error: databaseError.message,
        jobId: input.job.jobId,
        jobType: input.job.type
      });
      throw databaseError;
    }
  }

  async upsertJob(input: UpsertJobInput): Promise<DbIngestionJob> {
    try {
      const db = createServiceRoleSupabaseClient();
      const response = await db
        .from("ingestion_jobs")
        .upsert(
          {
            jobId: input.job.jobId,
            jobType: input.job.type,
            source: "riot",
            status: input.status ?? "queued",
            patchId: input.patchId ?? null,
            riotMatchId: getRiotMatchId(input.job),
            queueId: getQueueId(input.job),
            metadata: input.metadata ?? toJsonValue(input.job)
          },
          { onConflict: "jobId" }
        )
        .select("*")
        .single();

      return unwrapSupabaseResponse(response, "Upsert ingestion job");
    } catch (error) {
      const databaseError = toDatabaseError(error, "Upsert ingestion job");
      this.logger.error("Failed to upsert ingestion job.", {
        error: databaseError.message,
        jobId: input.job.jobId,
        jobType: input.job.type
      });
      throw databaseError;
    }
  }

  async markRunning(jobId: string): Promise<DbIngestionJob> {
    return this.updateStatus(jobId, {
      status: "running",
      lockedAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
      finishedAt: null,
      errorMessage: null
    });
  }

  async markSucceeded(jobId: string, metadata?: JsonValue): Promise<DbIngestionJob> {
    return this.updateStatus(jobId, {
      status: "succeeded",
      finishedAt: new Date().toISOString(),
      lockedAt: null,
      metadata: metadata ?? {}
    });
  }

  async markFailed(input: MarkJobFailedInput): Promise<DbIngestionJob> {
    const databaseError = toDatabaseError(input.error, "Ingestion job failed");

    return this.updateStatus(input.jobId, {
      status: input.status,
      finishedAt: new Date().toISOString(),
      lockedAt: null,
      nextAttemptAt: input.nextAttemptAt ?? null,
      errorMessage: databaseError.message,
      metadata: toJsonValue({ error: databaseError.message })
    });
  }

  private async updateStatus(jobId: string, values: Partial<NewDbIngestionJob>): Promise<DbIngestionJob> {
    try {
      const db = createServiceRoleSupabaseClient();
      const response = await db
        .from("ingestion_jobs")
        .update(values)
        .eq("jobId", jobId)
        .select("*")
        .single();

      return unwrapSupabaseResponse(response, "Update ingestion job status");
    } catch (error) {
      const databaseError = toDatabaseError(error, "Update ingestion job status");
      this.logger.error("Failed to update ingestion job status.", {
        error: databaseError.message,
        jobId
      });
      throw databaseError;
    }
  }
}

export function createIngestionJobsRepository(logger?: Logger) {
  return new IngestionJobsRepository(logger);
}
