import { NextResponse, type NextRequest } from "next/server";
import { getDefaultMatchNormalizationOptions } from "@/server/ingestion";
import { createRiotMatchClient } from "@/server/riot/matchClient";
import { RiotApiError } from "@/server/riot/errors";
import { isRiotServiceConfigured } from "@/server/riot/riotService";
import type { RiotMatchListQuery } from "@/server/riot/matchTypes";
import type { RiotRegionalRouting } from "@/server/riot/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const regionalRoutings = new Set<RiotRegionalRouting>(["americas", "asia", "europe", "sea"]);

function isAuthorized(request: NextRequest) {
  const verifySecret = process.env.RIOT_VERIFY_SECRET ?? process.env.INGESTION_CRON_SECRET;

  if (!verifySecret && process.env.NODE_ENV !== "production") {
    return true;
  }

  const headerSecret = request.headers.get("x-riot-verify-secret");
  const querySecret = request.nextUrl.searchParams.get("secret");

  return Boolean(verifySecret && (headerSecret === verifySecret || querySecret === verifySecret));
}

function parsePositiveInteger(value: string | null, fallback: number) {
  if (!value) return fallback;

  const parsed = Number.parseInt(value, 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseRegionalRouting(value: string | null): RiotRegionalRouting | undefined {
  if (!value) return undefined;

  const normalizedValue = value.toLowerCase() as RiotRegionalRouting;

  return regionalRoutings.has(normalizedValue) ? normalizedValue : undefined;
}

function readRefreshPuuids() {
  return (process.env.RIOT_REFRESH_PUUIDS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function toIso(seconds: number) {
  return new Date(seconds * 1000).toISOString();
}

async function runMatchListDebug(query: RiotMatchListQuery) {
  const matchClient = createRiotMatchClient();
  const request = matchClient.getMatchListDebugRequest(query);
  const matchIds = await matchClient.getMatchIdsByPuuidAndQueue(query);

  return {
    request,
    matchIds: matchIds.slice(0, 10),
    matchCount: matchIds.length
  };
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized Riot match debug request."
      },
      { status: 401 }
    );
  }

  if (!isRiotServiceConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error: "Riot API environment variables are not configured."
      },
      { status: 503 }
    );
  }

  const envPuuids = readRefreshPuuids();
  const puuid = request.nextUrl.searchParams.get("puuid")?.trim() || envPuuids[0];

  if (!puuid) {
    return NextResponse.json(
      {
        ok: false,
        error: "Provide a puuid query parameter or configure RIOT_REFRESH_PUUIDS."
      },
      { status: 400 }
    );
  }

  const nowMs = Date.now();
  const currentTimestamp = Math.floor(nowMs / 1000);
  const lookbackHours = parsePositiveInteger(
    request.nextUrl.searchParams.get("lookbackHours"),
    parsePositiveInteger(process.env.RIOT_REFRESH_LOOKBACK_HOURS ?? null, 168)
  );
  const count = Math.min(parsePositiveInteger(request.nextUrl.searchParams.get("count"), 10), 10);
  const start = parsePositiveInteger(request.nextUrl.searchParams.get("start"), 0);
  const endTime = currentTimestamp;
  const startTime = endTime - lookbackHours * 60 * 60;
  const regionalRouting = parseRegionalRouting(request.nextUrl.searchParams.get("regionalRouting"));
  const queueIds = getDefaultMatchNormalizationOptions();
  const baseQuery = {
    puuid,
    regionalRouting,
    startTime,
    endTime,
    start,
    count
  } satisfies RiotMatchListQuery;

  try {
    const [withoutQueue, arenaQueue, aramQueue] = await Promise.all([
      runMatchListDebug(baseQuery),
      runMatchListDebug({
        ...baseQuery,
        queue: queueIds.arenaQueueId
      }),
      runMatchListDebug({
        ...baseQuery,
        queue: queueIds.aramMayhemQueueId
      })
    ]);

    return NextResponse.json({
      ok: true,
      note: "Riot Match-V5 matchlist startTime and endTime are sent as Unix epoch timestamps in seconds.",
      puuidSource: request.nextUrl.searchParams.get("puuid") ? "query" : "RIOT_REFRESH_PUUIDS[0]",
      configuredPuuidCount: envPuuids.length,
      puuid,
      currentTimestamp,
      currentTimestampMs: nowMs,
      currentIso: new Date(nowMs).toISOString(),
      lookbackHours,
      calculatedWindow: {
        startTime,
        endTime,
        startIso: toIso(startTime),
        endIso: toIso(endTime),
        durationSeconds: endTime - startTime
      },
      queueFilters: {
        arena: queueIds.arenaQueueId,
        aramMayhem: queueIds.aramMayhemQueueId
      },
      requests: {
        withoutQueue,
        withQueueFilters: {
          arena: arenaQueue,
          aramMayhem: aramQueue
        }
      }
    });
  } catch (error) {
    if (error instanceof RiotApiError) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
          statusCode: error.statusCode,
          routeKey: error.routeKey,
          rateLimit: error.rateLimit
        },
        { status: error.statusCode === 429 ? 429 : 502 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: "Riot match debug request failed."
      },
      { status: 500 }
    );
  }
}
