import type { DbIngestionJob, DbIngestionJobStatus, DbIngestionRun, JsonValue, NewDbIngestionJob } from "@/types/database";

type DbIngestionJobRow = {
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

type DbIngestionRunRow = {
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

export type DbIngestionJobWrite = {
  job_id?: string;
  job_type?: string;
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
};

export type DbIngestionRunWrite = {
  patch_id?: string | null;
  source?: string;
  status?: string;
  finished_at?: string | null;
  records_processed?: number;
  error_message?: string | null;
  metadata?: JsonValue;
};

export function toIngestionJobWrite(values: Partial<NewDbIngestionJob> & {
  jobId?: string;
  jobType?: string;
}): DbIngestionJobWrite {
  return {
    job_id: values.jobId,
    job_type: values.jobType,
    source: values.source,
    status: values.status,
    patch_id: values.patchId,
    riot_match_id: values.riotMatchId,
    queue_id: values.queueId,
    attempt_count: values.attemptCount,
    locked_at: values.lockedAt,
    next_attempt_at: values.nextAttemptAt,
    started_at: values.startedAt,
    finished_at: values.finishedAt,
    error_message: values.errorMessage,
    metadata: values.metadata
  };
}

export function toIngestionRunWrite(values: DbIngestionRunWrite): DbIngestionRunWrite {
  return values;
}

export function mapIngestionJob(row: DbIngestionJobRow): DbIngestionJob {
  return {
    id: row.id,
    jobId: row.job_id,
    jobType: row.job_type,
    source: row.source,
    status: row.status,
    patchId: row.patch_id,
    riotMatchId: row.riot_match_id,
    queueId: row.queue_id,
    attemptCount: row.attempt_count,
    lockedAt: row.locked_at,
    nextAttemptAt: row.next_attempt_at,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    errorMessage: row.error_message,
    metadata: row.metadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapIngestionRun(row: DbIngestionRunRow): DbIngestionRun {
  return {
    id: row.id,
    patchId: row.patch_id,
    source: row.source,
    status: row.status,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    recordsProcessed: row.records_processed,
    errorMessage: row.error_message,
    metadata: row.metadata
  };
}
