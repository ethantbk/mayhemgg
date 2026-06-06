import { NextResponse, type NextRequest } from "next/server";
import { RiotApiError } from "@/server/riot/errors";
import { getRiotAccountByRiotId, isRiotServiceConfigured } from "@/server/riot/riotService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isAuthorized(request: NextRequest) {
  const verifySecret = process.env.RIOT_VERIFY_SECRET ?? process.env.INGESTION_CRON_SECRET;

  if (!verifySecret && process.env.NODE_ENV !== "production") {
    return true;
  }

  return Boolean(verifySecret && request.nextUrl.searchParams.get("secret") === verifySecret);
}

function readRequiredParam(request: NextRequest, name: string) {
  const value = request.nextUrl.searchParams.get(name)?.trim();
  return value || null;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized Riot account lookup."
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

  const gameName = readRequiredParam(request, "gameName");
  const tagLine = readRequiredParam(request, "tagLine");

  if (!gameName || !tagLine) {
    return NextResponse.json(
      {
        ok: false,
        error: "gameName and tagLine query parameters are required."
      },
      { status: 400 }
    );
  }

  try {
    const account = await getRiotAccountByRiotId({ gameName, tagLine });

    return NextResponse.json({
      ok: true,
      puuid: account.puuid,
      gameName: account.gameName,
      tagLine: account.tagLine
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
        error: "Riot account lookup failed."
      },
      { status: 500 }
    );
  }
}
