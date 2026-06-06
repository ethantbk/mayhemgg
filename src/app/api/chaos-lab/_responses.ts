import { NextResponse } from "next/server";

const readCacheHeaders = {
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300"
};

export function chaosApiData<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(
    {
      ok: true,
      data
    },
    {
      ...init,
      headers: {
        ...readCacheHeaders,
        ...init?.headers
      }
    }
  );
}

export function chaosApiNotFound(message: string) {
  return NextResponse.json(
    {
      ok: false,
      error: message
    },
    { status: 404 }
  );
}

export function chaosApiError(error: unknown, fallbackMessage: string) {
  return NextResponse.json(
    {
      ok: false,
      error: error instanceof Error ? error.message : fallbackMessage
    },
    { status: 500 }
  );
}

export function parsePositiveLimit(value: string | null, fallback = 20, max = 100) {
  if (!value) return fallback;

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, max) : fallback;
}
