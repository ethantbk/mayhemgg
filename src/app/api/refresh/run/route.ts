import type { NextRequest } from "next/server";
import { createScheduledRefreshService, type ChampionRefreshRunInput, type RefreshRunInput } from "@/server/refresh";
import { isRefreshRequestAuthorized, unauthorizedRefreshResponse } from "@/app/api/refresh/auth";
import { readJsonBody } from "@/app/api/refresh/requestUtils";
import { toDatabaseError } from "@/lib/supabase/errors";
import { createLogger } from "@/server/logging/logger";
import type { RefreshRunResult } from "@/server/refresh";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

const logger = createLogger({ component: "refresh-run-api" });

type RefreshRunRequestBody = RefreshRunInput & {
  kind?: "daily" | "manual" | "champion";
  championId?: string;
};

function readRefreshPuuids() {
  return (process.env.RIOT_REFRESH_PUUIDS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function requestedKind(body: Partial<RefreshRunRequestBody>) {
  if (body.kind) return body.kind;
  if (body.championId) return "champion";
  return "manual";
}

function createRunDebug(body: Partial<RefreshRunRequestBody>, result: RefreshRunResult) {
  const kind = requestedKind(body);
  const riotRefreshPuuids = readRefreshPuuids();

  return {
    requestedKind: kind,
    note: kind === "manual" && !body.matchIngestion
      ? "Manual refresh runs do not automatically use RIOT_REFRESH_PUUIDS. Send {\"kind\":\"daily\"} or provide matchIngestion.discoverySources/matchIds to discover Riot matches."
      : null,
    environment: {
      riotRefreshPuuidCount: riotRefreshPuuids.length,
      riotRefreshPuuids,
      riotRefreshMatchCount: process.env.RIOT_REFRESH_MATCH_COUNT ?? "20",
      riotRefreshLookbackHours: process.env.RIOT_REFRESH_LOOKBACK_HOURS ?? "24",
      defaultRegionalRouting: process.env.RIOT_DEFAULT_REGIONAL_ROUTING ?? "americas",
      arenaQueueId: process.env.RIOT_ARENA_QUEUE_ID ?? "1700",
      aramMayhemQueueId: process.env.RIOT_ARAM_MAYHEM_QUEUE_ID ?? "450"
    },
    matchIngestion: result.result.matchIngestion.debug
  };
}

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
      debug: createRunDebug(body, result),
      ...result
    });
  } catch (error) {
    const databaseError = toDatabaseError(error, "Refresh run failed");

    logger.error("Refresh run API request failed.", {
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
