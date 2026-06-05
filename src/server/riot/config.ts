import "server-only";

import type { RiotPlatformRouting, RiotRegionalRouting } from "@/server/riot/types";

const platformRoutings = new Set<RiotPlatformRouting>([
  "br1",
  "eun1",
  "euw1",
  "jp1",
  "kr",
  "la1",
  "la2",
  "na1",
  "oc1",
  "tr1",
  "ru"
]);

const regionalRoutings = new Set<RiotRegionalRouting>(["americas", "asia", "europe", "sea"]);

export type RiotConfig = {
  apiKey: string;
  defaultPlatformRouting: RiotPlatformRouting;
  defaultRegionalRouting: RiotRegionalRouting;
  apiBaseUrlTemplate: string;
  dataDragonBaseUrl: string;
  timeoutMs: number;
  maxRetries: number;
  rateLimitBufferMs: number;
};

export class RiotConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RiotConfigError";
  }
}

function requireEnv(name: string, value: string | undefined) {
  if (!value) {
    throw new RiotConfigError(`Missing required environment variable: ${name}`);
  }

  return value;
}

function parsePositiveInteger(name: string, value: string | undefined, fallback: number) {
  if (!value) return fallback;

  const parsedValue = Number.parseInt(value, 10);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    throw new RiotConfigError(`${name} must be a positive integer.`);
  }

  return parsedValue;
}

function parsePlatformRouting(value: string): RiotPlatformRouting {
  const normalizedValue = value.toLowerCase() as RiotPlatformRouting;

  if (!platformRoutings.has(normalizedValue)) {
    throw new RiotConfigError(`Unsupported RIOT_DEFAULT_PLATFORM_ROUTING: ${value}`);
  }

  return normalizedValue;
}

function parseRegionalRouting(value: string): RiotRegionalRouting {
  const normalizedValue = value.toLowerCase() as RiotRegionalRouting;

  if (!regionalRoutings.has(normalizedValue)) {
    throw new RiotConfigError(`Unsupported RIOT_DEFAULT_REGIONAL_ROUTING: ${value}`);
  }

  return normalizedValue;
}

function normalizeBaseUrl(value: string) {
  return value.replace(/\/$/, "");
}

export function isRiotConfigAvailable() {
  return Boolean(process.env.RIOT_API_KEY);
}

export function getRiotConfig(): RiotConfig {
  return {
    apiKey: requireEnv("RIOT_API_KEY", process.env.RIOT_API_KEY),
    defaultPlatformRouting: parsePlatformRouting(process.env.RIOT_DEFAULT_PLATFORM_ROUTING ?? "na1"),
    defaultRegionalRouting: parseRegionalRouting(process.env.RIOT_DEFAULT_REGIONAL_ROUTING ?? "americas"),
    apiBaseUrlTemplate: normalizeBaseUrl(process.env.RIOT_API_BASE_URL_TEMPLATE ?? "https://{routing}.api.riotgames.com"),
    dataDragonBaseUrl: normalizeBaseUrl(process.env.DATA_DRAGON_BASE_URL ?? "https://ddragon.leagueoflegends.com"),
    timeoutMs: parsePositiveInteger("RIOT_API_TIMEOUT_MS", process.env.RIOT_API_TIMEOUT_MS, 10000),
    maxRetries: parsePositiveInteger("RIOT_API_MAX_RETRIES", process.env.RIOT_API_MAX_RETRIES, 2),
    rateLimitBufferMs: parsePositiveInteger("RIOT_API_RATE_LIMIT_BUFFER_MS", process.env.RIOT_API_RATE_LIMIT_BUFFER_MS, 250)
  };
}
