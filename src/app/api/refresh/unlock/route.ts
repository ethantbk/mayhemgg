import type { NextRequest } from "next/server";
import { toDatabaseError } from "@/lib/supabase/errors";
import { createIngestionJobsRepository } from "@/server/ingestion/persistence";
import { createLogger } from "@/server/logging/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const logger = createLogger({ component: "refresh-unlock-api" });
const STALE_LOCK_MS = 10 * 60 * 1000;

function isUnlockRequestAuthorized(request: NextRequest) {
  const secret = process.env.INGESTION_CRON_SECRET;

  if (!secret && process.env.NODE_ENV !== "production") {
    return true;
  }

  return Boolean(secret && request.nextUrl.searchParams.get("secret") === secret);
}

export async function POST(request: NextRequest) {
  if (!isUnlockRequestAuthorized(request)) {
    return Response.json(
      {
        ok: false,
        error: "Unauthorized refresh unlock request."
      },
      { status: 401 }
    );
  }

  try {
    const repository = createIngestionJobsRepository();
    const result = await repository.clearStaleLocks({
      staleAfterMs: STALE_LOCK_MS
    });

    return Response.json({
      ok: true,
      cutoff: result.cutoff,
      staleAfterMinutes: STALE_LOCK_MS / 60000,
      clearedJobIds: result.clearedJobIds,
      clearedJobs: result.clearedJobs.map((job) => ({
        jobId: job.jobId,
        jobType: job.jobType,
        status: job.status,
        lockedAt: job.lockedAt,
        startedAt: job.startedAt,
        finishedAt: job.finishedAt,
        errorMessage: job.errorMessage
      }))
    });
  } catch (error) {
    const databaseError = toDatabaseError(error, "Refresh unlock failed");

    logger.error("Refresh unlock API request failed.", {
      error: databaseError.message,
      code: databaseError.code,
      details: databaseError.details,
      hint: databaseError.hint
    });

    return Response.json(
      {
        ok: false,
        error: databaseError.message,
        code: databaseError.code,
        details: databaseError.details,
        hint: databaseError.hint
      },
      { status: 500 }
    );
  }
}
