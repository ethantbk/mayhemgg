import type { NextRequest } from "next/server";

function getRefreshSecret() {
  return process.env.INGESTION_CRON_SECRET ?? process.env.CRON_SECRET ?? process.env.RIOT_VERIFY_SECRET;
}

export function isRefreshRequestAuthorized(request: NextRequest) {
  const secret = getRefreshSecret();

  if (!secret && process.env.NODE_ENV !== "production") {
    return true;
  }

  const authorization = request.headers.get("authorization");
  const bearerToken = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : null;
  const headerToken = request.headers.get("x-ingestion-cron-secret") ?? request.headers.get("x-cron-secret");
  const queryToken = request.nextUrl.searchParams.get("secret");
  const providedSecret = bearerToken ?? headerToken ?? queryToken;

  return Boolean(secret && providedSecret === secret);
}

export function unauthorizedRefreshResponse() {
  return Response.json(
    {
      ok: false,
      error: "Unauthorized refresh request."
    },
    { status: 401 }
  );
}
