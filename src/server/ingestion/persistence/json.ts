import "server-only";

import { createHash } from "node:crypto";
import type { JsonValue } from "@/types/database";

const sensitiveKeys = new Set(["puuid", "summonerId", "summonerName", "riotIdGameName", "riotIdTagline"]);

function hashIdentifier(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function scrubSensitiveFields(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(scrubSensitiveFields);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !sensitiveKeys.has(key))
        .map(([key, entryValue]) => {
          if (key === "participants" && Array.isArray(entryValue) && entryValue.every((entry) => typeof entry === "string")) {
            return [key, entryValue.map(hashIdentifier)];
          }

          return [key, scrubSensitiveFields(entryValue)];
        })
    );
  }

  return value;
}

export function toJsonValue(value: unknown): JsonValue {
  return JSON.parse(JSON.stringify(scrubSensitiveFields(value))) as JsonValue;
}
