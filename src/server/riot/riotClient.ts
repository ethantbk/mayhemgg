import "server-only";

import { getRiotConfig, type RiotConfig } from "@/server/riot/config";
import { RiotApiError, RiotRateLimitError } from "@/server/riot/errors";
import {
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

        if (response.status === 429) {
          if (attempt < this.config.maxRetries) {
            await sleep(getRetryDelayMs(attempt, retryAfterMs));
            continue;
          }

          throw new RiotRateLimitError("Riot API rate limit exceeded.", retryAfterMs ?? 0, {
            routeKey,
            rateLimit
          });
        }

        if (response.status >= 500 && attempt < this.config.maxRetries) {
          await sleep(getRetryDelayMs(attempt, retryAfterMs));
          continue;
        }

        if (!response.ok) {
          const errorBody = await readRiotError(response);
          const message = errorBody?.status?.message ?? `Riot API request failed with status ${response.status}.`;

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
