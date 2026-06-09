import "server-only";

import { getRiotConfig, type RiotConfig } from "@/server/riot/config";
import { createLogger } from "@/server/logging/logger";
import { RiotApiError, RiotRateLimitError } from "@/server/riot/errors";
import {
  getRiotRouteCooldownMs,
  getRetryDelayMs,
  getRiotRateLimitSnapshot,
  recordRiotRateLimit,
  waitForRiotRoute
} from "@/server/riot/rateLimiter";
import type { RiotApiErrorResponse, RiotPlatformRouting, RiotRegionalRouting } from "@/server/riot/types";

type RiotRequestScope = "platform" | "regional";

type RiotRequestOptions = {
  path: string;
  routeKey: string;
  scope?: RiotRequestScope;
  platformRouting?: RiotPlatformRouting;
  regionalRouting?: RiotRegionalRouting;
  query?: Record<string, string | number | boolean | undefined>;
  authenticated?: boolean;
};

const logger = createLogger({ component: "riot-client" });

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function buildBaseUrl(config: RiotConfig, routing: string) {
  return config.apiBaseUrlTemplate.replace("{routing}", routing);
}

function buildRiotUrl(config: RiotConfig, options: RiotRequestOptions) {
  const routing =
    options.scope === "regional"
      ? options.regionalRouting ?? config.defaultRegionalRouting
      : options.platformRouting ?? config.defaultPlatformRouting;
  const url = new URL(`${buildBaseUrl(config, routing)}${options.path}`);

  Object.entries(options.query ?? {}).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  });

  return url;
}

async function readRiotError(response: Response) {
  try {
    return (await response.json()) as RiotApiErrorResponse;
  } catch {
    return null;
  }
}

export class RiotClient {
  private config: RiotConfig;

  constructor(config: RiotConfig = getRiotConfig()) {
    this.config = config;
  }

  async request<T>(options: RiotRequestOptions): Promise<T> {
    const authenticated = options.authenticated ?? true;
    const url = buildRiotUrl(this.config, options);
    const routeKey = options.routeKey;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt += 1) {
      const routeCooldownMs = getRiotRouteCooldownMs(routeKey);

      if (routeCooldownMs > this.config.maxInRequestRetryAfterMs) {
        logger.warn("Riot API route cooldown exceeds safe in-request retry window.", {
          routeKey,
          retryAfterMs: routeCooldownMs,
          maxInRequestRetryAfterMs: this.config.maxInRequestRetryAfterMs
        });

        throw new RiotRateLimitError("Riot API rate limit reached.", routeCooldownMs, {
          routeKey
        });
      }

      await waitForRiotRoute(routeKey);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

      try {
        const response = await fetch(url, {
          headers: authenticated
            ? {
                "X-Riot-Token": this.config.apiKey
              }
            : undefined,
          signal: controller.signal
        });
        const rateLimit = getRiotRateLimitSnapshot(response.headers);
        const retryAfterMs = recordRiotRateLimit(routeKey, response.headers, this.config.rateLimitBufferMs);

        logger.info("Received Riot API response.", {
          routeKey,
          statusCode: response.status,
          attempt,
          retryAfterSeconds: rateLimit.retryAfterSeconds,
          appRateLimit: rateLimit.appLimit,
          appRateLimitCount: rateLimit.appCount,
          methodRateLimit: rateLimit.methodLimit,
          methodRateLimitCount: rateLimit.methodCount
        });

        if (response.status === 429) {
          if ((retryAfterMs ?? 0) > this.config.maxInRequestRetryAfterMs) {
            logger.warn("Riot API retry-after exceeds safe in-request retry window.", {
              routeKey,
              statusCode: response.status,
              attempt,
              retryAfterMs: retryAfterMs ?? null,
              maxInRequestRetryAfterMs: this.config.maxInRequestRetryAfterMs
            });

            throw new RiotRateLimitError("Riot API rate limit reached.", retryAfterMs ?? 0, {
              routeKey,
              rateLimit
            });
          }

          if (attempt < this.config.maxRetries) {
            logger.warn("Riot API rate limited request; retrying after backoff.", {
              routeKey,
              statusCode: response.status,
              attempt,
              retryAfterMs: retryAfterMs ?? null
            });
            await sleep(getRetryDelayMs(attempt, retryAfterMs));
            continue;
          }

          throw new RiotRateLimitError("Riot API rate limit exceeded.", retryAfterMs ?? 0, {
            routeKey,
            rateLimit
          });
        }

        if (response.status >= 500 && attempt < this.config.maxRetries) {
          logger.warn("Riot API server error; retrying request.", {
            routeKey,
            statusCode: response.status,
            attempt,
            retryAfterMs: retryAfterMs ?? null
          });
          await sleep(getRetryDelayMs(attempt, retryAfterMs));
          continue;
        }

        if (!response.ok) {
          const errorBody = await readRiotError(response);
          const message = errorBody?.status?.message ?? `Riot API request failed with status ${response.status}.`;

          logger.error("Riot API request failed with non-success status.", {
            routeKey,
            statusCode: response.status,
            message
          });

          throw new RiotApiError(message, {
            statusCode: response.status,
            routeKey,
            rateLimit
          });
        }

        return (await response.json()) as T;
      } catch (error) {
        if (error instanceof RiotApiError) {
          throw error;
        }

        if (attempt >= this.config.maxRetries) {
          throw new RiotApiError("Riot API request failed before receiving a response.", {
            routeKey,
            cause: error
          });
        }

        await sleep(getRetryDelayMs(attempt, null));
      } finally {
        clearTimeout(timeout);
      }
    }

    throw new RiotApiError("Riot API request failed after retries.", { routeKey });
  }
}

export function createRiotClient(config?: RiotConfig) {
  return new RiotClient(config);
}
