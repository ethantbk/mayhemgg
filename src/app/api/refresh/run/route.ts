import type { NextRequest } from "next/server";
import { createScheduledRefreshService, type ChampionRefreshRunInput, type RefreshRunInput } from "@/server/refresh";
import { isRefreshRequestAuthorized, unauthorizedRefreshResponse } from "@/app/api/refresh/auth";
import { readJsonBody } from "@/app/api/refresh/requestUtils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

type RefreshRunRequestBody = RefreshRunInput & {
  kind?: "daily" | "manual" | "champion";
  championId?: string;
};

export async function POST(request: NextRequest) {
  if (!isRefreshRequestAuthorized(request)) {
    return unauthorizedRefreshResponse();
  }

  const body = await readJsonBody<RefreshRunRequestBody>(request);
  const service = createScheduledRefreshService();

  try {
    if (body.kind === "champion" && !body.championId) {
      return Response.json(
        {
          ok: false,
          error: "championId is required for champion refresh runs."
        },
        { status: 400 }
      );
    }

    const result = body.kind === "daily"
      ? await service.runDailyRefresh(body)
      : body.kind === "champion" || body.championId
        ? await service.runChampionRefresh(body as ChampionRefreshRunInput)
        : await service.runManualRefresh(body);

    return Response.json({
      ok: true,
      ...result
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Refresh run failed."
      },
      { status: 500 }
    );
  }
}
