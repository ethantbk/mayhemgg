import type { NextRequest } from "next/server";
import { createScheduledRefreshService } from "@/server/refresh";
import { isRefreshRequestAuthorized, unauthorizedRefreshResponse } from "@/app/api/refresh/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function parseLimit(value: string | null) {
  if (!value) return 20;

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 100) : 20;
}

export async function GET(request: NextRequest) {
  if (!isRefreshRequestAuthorized(request)) {
    return unauthorizedRefreshResponse();
  }

  try {
    const report = await createScheduledRefreshService().getStatusReport(parseLimit(request.nextUrl.searchParams.get("limit")));

    return Response.json({
      ok: true,
      ...report
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Refresh status check failed."
      },
      { status: 500 }
    );
  }
}
