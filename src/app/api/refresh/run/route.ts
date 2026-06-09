import type { NextRequest } from "next/server";
import { createScheduledRefreshService, type ChampionRefreshRunInput, type RefreshRunInput } from "@/server/refresh";
import { isRefreshRequestAuthorized, unauthorizedRefreshResponse } from "@/app/api/refresh/auth";
import { readJsonBody } from "@/app/api/refresh/requestUtils";
import { toDatabaseError } from "@/lib/supabase/errors";
import { createLogger } from "@/server/logging/logger";
import { getDefaultMatchNormalizationOptions } from "@/server/ingestion";
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
    .split(/[\n,;]+/)
    .map((value) => value.trim())
    .filter(Boolean);
}

function readRefreshRiotIds() {
  return (process.env.RIOT_REFRESH_RIOT_IDS ?? process.env.RIOT_REFRESH_SEED_RIOT_IDS ?? "")
    .split(/[\n,;]+/)
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
  const riotRefreshRiotIds = readRefreshRiotIds();
  const queueConfig = getDefaultMatchNormalizationOptions();
  const diagnostics = result.result.matchIngestion.debug.diagnostics;

  return {
    requestedKind: kind,
    note: kind === "manual" && !body.matchIngestion
      ? "Manual refresh runs do not automatically use RIOT_REFRESH_PUUIDS. Send {\"kind\":\"daily\"} or provide matchIngestion.discoverySources/matchIds to discover Riot matches."
      : null,
    environment: {
      riotRefreshPuuidCount: riotRefreshPuuids.length,
      riotRefreshRiotIdCount: riotRefreshRiotIds.length,
      riotRefreshPuuids,
      riotRefreshRiotIds,
      riotRefreshMatchCount: process.env.RIOT_REFRESH_MATCH_COUNT ?? "50",
      riotRefreshMatchPages: process.env.RIOT_REFRESH_MATCH_PAGES ?? "3",
      riotRefreshLookbackHours: process.env.RIOT_REFRESH_LOOKBACK_HOURS ?? "24",
      defaultRegionalRouting: process.env.RIOT_DEFAULT_REGIONAL_ROUTING ?? "americas",
      arenaQueueId: queueConfig.arenaQueueId,
      arenaQueueIds: queueConfig.arenaQueueIds,
      aramMayhemQueueId: queueConfig.aramMayhemQueueId,
      aramMayhemQueueIds: queueConfig.aramMayhemQueueIds
    },
    diagnostics,
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
