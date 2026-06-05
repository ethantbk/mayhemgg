import type { NextRequest } from "next/server";
import type { AggregationPipelineMode } from "@/server/pipeline";

const modeValues = new Set(["arena", "aram_mayhem"]);

export function parseModes(value: string | null): AggregationPipelineMode[] | undefined {
  if (!value) return undefined;

  const modes = value
    .split(",")
    .map((mode) => mode.trim())
    .filter((mode): mode is AggregationPipelineMode => modeValues.has(mode));

  return modes.length ? modes : undefined;
}

export function readPatchScope(request: NextRequest) {
  return {
    patchId: request.nextUrl.searchParams.get("patchId") ?? undefined,
    patchVersion: request.nextUrl.searchParams.get("patchVersion") ?? undefined,
    modes: parseModes(request.nextUrl.searchParams.get("modes"))
  };
}

export async function readJsonBody<T>(request: NextRequest): Promise<Partial<T>> {
  try {
    return await request.json();
  } catch {
    return {};
  }
}
