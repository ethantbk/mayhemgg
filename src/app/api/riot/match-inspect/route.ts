import { NextResponse, type NextRequest } from "next/server";
import { createRiotMatchClient } from "@/server/riot/matchClient";
import { RiotApiError } from "@/server/riot/errors";
import { isRiotServiceConfigured } from "@/server/riot/riotService";
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

function parseRegionalRouting(value: string | null): RiotRegionalRouting | undefined {
  if (!value) return undefined;

  const normalizedValue = value.toLowerCase() as RiotRegionalRouting;

  return regionalRoutings.has(normalizedValue) ? normalizedValue : undefined;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized Riot match inspect request."
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

  const matchId = request.nextUrl.searchParams.get("matchId")?.trim();
  const regionalRouting = parseRegionalRouting(request.nextUrl.searchParams.get("regionalRouting"));

  if (!matchId) {
    return NextResponse.json(
      {
        ok: false,
        error: "matchId query parameter is required."
      },
      { status: 400 }
    );
  }

  try {
    const matchClient = createRiotMatchClient();
    const match = await matchClient.getMatchDetails(matchId, regionalRouting);

    return NextResponse.json({
      ok: true,
      matchId: match.metadata.matchId,
      regionalRouting: regionalRouting ?? "default",
      queueId: match.info.queueId,
      gameMode: match.info.gameMode,
      gameType: match.info.gameType,
      gameCreation: match.info.gameCreation,
      gameCreationIso: new Date(match.info.gameCreation).toISOString(),
      gameDuration: match.info.gameDuration,
      mapId: match.info.mapId
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
        error: "Riot match inspect request failed."
      },
      { status: 500 }
    );
  }
}
