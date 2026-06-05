import type { RiotRateLimitSnapshot } from "@/server/riot/types";

export class RiotApiError extends Error {
  statusCode?: number;
  routeKey?: string;
  rateLimit?: RiotRateLimitSnapshot;

  constructor(
    message: string,
    options?: {
      statusCode?: number;
      routeKey?: string;
      rateLimit?: RiotRateLimitSnapshot;
      cause?: unknown;
    }
  ) {
    super(message, { cause: options?.cause });
    this.name = "RiotApiError";
    this.statusCode = options?.statusCode;
    this.routeKey = options?.routeKey;
    this.rateLimit = options?.rateLimit;
  }
}

export class RiotRateLimitError extends RiotApiError {
  retryAfterMs: number;

  constructor(message: string, retryAfterMs: number, options?: { routeKey?: string; rateLimit?: RiotRateLimitSnapshot }) {
    super(message, {
      statusCode: 429,
      routeKey: options?.routeKey,
      rateLimit: options?.rateLimit
    });
    this.name = "RiotRateLimitError";
    this.retryAfterMs = retryAfterMs;
  }
}
