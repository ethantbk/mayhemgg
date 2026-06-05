import type { NextRequest } from "next/server";
import { createScheduledRefreshService } from "@/server/refresh";
import { isRefreshRequestAuthorized, unauthorizedRefreshResponse } from "@/app/api/refresh/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!isRefreshRequestAuthorized(request)) {
    return unauthorizedRefreshResponse();
  }

  try {
    const report = await createScheduledRefreshService().getHealthReport();

    return Response.json(report, { status: report.ok ? 200 : 503 });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Refresh health check failed."
      },
      { status: 500 }
    );
  }
}
