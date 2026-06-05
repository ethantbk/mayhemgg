import "server-only";

import type { DbTierRank } from "@/types/database";
import type { BrokenScoreInputs } from "@/server/aggregation/brokenScoreModels";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function roundScore(value: number) {
  return Number(value.toFixed(2));
}

export function sampleConfidence(gamesPlayed: number) {
  return clamp(gamesPlayed / 100, 0, 1);
}

export function placementComponent(averagePlacement: number | null) {
  if (averagePlacement === null) return 0;
  return clamp((5 - averagePlacement) * 4, -8, 14);
}

export function generatedTierFromBrokenScore(score: number): DbTierRank {
  if (score >= 85) return "S+";
  if (score >= 72) return "S";
  if (score >= 58) return "A";
  if (score >= 44) return "B";
  return "C";
}

export function calculateBrokenScore(inputs: BrokenScoreInputs) {
  const score =
    45 +
    inputs.championComponent +
    inputs.buildComponent +
    inputs.augmentComponent +
    inputs.placementComponent +
    inputs.confidenceComponent;

  return roundScore(clamp(score, 0, 100));
}
