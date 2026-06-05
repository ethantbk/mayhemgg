import type { NextRequest } from "next/server";
import { createScheduledRefreshService } from "@/server/refresh";
import { isRefreshRequestAuthorized, unauthorizedRefreshResponse } from "@/app/api/refresh/auth";
import { readPatchScope } from "@/app/api/refresh/requestUtils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  if (!isRefreshRequestAuthorized(request)) {
    return unauthorizedRefreshResponse();
  }

  try {
    const result = await createScheduledRefreshService().runDailyRefresh(readPatchScope(request));

    return Response.json({
      ok: true,
      ...result
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Daily refresh failed."
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
