import "server-only";

import type { DbTierRank } from "@/types/database";
import type { ChampionTierScoreInputs } from "@/server/aggregation/championAggregationModels";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function calculateSampleConfidence(gamesPlayed: number) {
  return clamp(gamesPlayed / 100, 0, 1);
}

export function calculateTierScoreInputs({
  winRate,
  pickRate,
  banRate,
  gamesPlayed,
  wins,
  totalModeParticipants,
  totalModeMatches
}: Omit<ChampionTierScoreInputs, "sampleConfidence" | "score">): ChampionTierScoreInputs {
  const sampleConfidence = calculateSampleConfidence(gamesPlayed);
  const winRateComponent = (winRate - 50) * 1.9;
  const pickRateComponent = pickRate * 0.45;
  const banRateComponent = (banRate ?? 0) * 0.3;
  const confidenceComponent = sampleConfidence * 12;
  const score = clamp(50 + winRateComponent + pickRateComponent + banRateComponent + confidenceComponent, 0, 100);

  return {
    winRate,
    pickRate,
    banRate,
    gamesPlayed,
    wins,
    totalModeParticipants,
    totalModeMatches,
    sampleConfidence,
    score
  };
}

export function tierFromScore(score: number): DbTierRank {
  if (score >= 84) return "S+";
  if (score >= 72) return "S";
  if (score >= 58) return "A";
  if (score >= 44) return "B";
  return "C";
}
