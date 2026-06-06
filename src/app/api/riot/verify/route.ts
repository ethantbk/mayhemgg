import { NextResponse, type NextRequest } from "next/server";
import { RiotApiError } from "@/server/riot/errors";
import { isRiotServiceConfigured, verifyRiotConnectivity } from "@/server/riot/riotService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isAuthorized(request: NextRequest) {
  const verifySecret = process.env.RIOT_VERIFY_SECRET ?? process.env.INGESTION_CRON_SECRET;

  if (!verifySecret && process.env.NODE_ENV !== "production") {
    return true;
  }

  const headerSecret = request.headers.get("x-riot-verify-secret");
  const querySecret = request.nextUrl.searchParams.get("secret");

  return Boolean(verifySecret && (headerSecret === verifySecret || querySecret === verifySecret));
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized Riot connectivity check."
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

  try {
    return NextResponse.json(await verifyRiotConnectivity());
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
        error: "Riot connectivity check failed."
      },
      { status: 500 }
    );
  }
}
