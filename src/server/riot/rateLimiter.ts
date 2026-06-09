import "server-only";

import type { RiotRateLimitSnapshot } from "@/server/riot/types";

const routeCooldowns = new Map<string, number>();

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function parseRetryAfterMs(value: string | null, bufferMs: number) {
  if (!value) return null;

  const retryAfterSeconds = Number.parseFloat(value);

  if (!Number.isFinite(retryAfterSeconds) || retryAfterSeconds < 0) {
    return null;
  }

  return Math.ceil(retryAfterSeconds * 1000) + bufferMs;
}

export function getRiotRateLimitSnapshot(headers: Headers): RiotRateLimitSnapshot {
  const retryAfter = headers.get("retry-after");
  const retryAfterSeconds = retryAfter ? Number.parseFloat(retryAfter) : Number.NaN;

  return {
    retryAfterSeconds: Number.isFinite(retryAfterSeconds) ? retryAfterSeconds : null,
    appLimit: headers.get("x-app-rate-limit"),
    appCount: headers.get("x-app-rate-limit-count"),
    methodLimit: headers.get("x-method-rate-limit"),
    methodCount: headers.get("x-method-rate-limit-count")
  };
}

export async function waitForRiotRoute(routeKey: string) {
  const nextAvailableAt = routeCooldowns.get(routeKey) ?? 0;
  const waitMs = nextAvailableAt - Date.now();

  if (waitMs > 0) {
    await sleep(waitMs);
  }
}

export function getRiotRouteCooldownMs(routeKey: string) {
  return Math.max((routeCooldowns.get(routeKey) ?? 0) - Date.now(), 0);
}

export function recordRiotRateLimit(routeKey: string, headers: Headers, bufferMs: number) {
  const retryAfterMs = parseRetryAfterMs(headers.get("retry-after"), bufferMs);

  if (!retryAfterMs) {
    return null;
  }

  routeCooldowns.set(routeKey, Date.now() + retryAfterMs);
  return retryAfterMs;
}

export function getRetryDelayMs(attempt: number, retryAfterMs: number | null) {
  if (retryAfterMs) return retryAfterMs;

  const baseDelayMs = 500 * 2 ** attempt;
  const jitterMs = Math.floor(Math.random() * 250);

  return baseDelayMs + jitterMs;
}
