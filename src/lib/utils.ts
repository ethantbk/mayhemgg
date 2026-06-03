import type { Mode, ModeStatsKey, Tier } from "@/types";

export const modeLabels: Record<Mode, string> = {
  arena: "Arena",
  aramMayhem: "ARAM Mayhem"
};

export const modes: Mode[] = ["arena", "aramMayhem"];

export function modeToStatsKey(mode: Mode): ModeStatsKey {
  return mode === "arena" ? "arenaStats" : "aramMayhemStats";
}

export function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export const tierOrder: Tier[] = ["S+", "S", "A", "B", "C"];

export const tierRank: Record<Tier, number> = {
  "S+": 0,
  S: 1,
  A: 2,
  B: 3,
  C: 4
};
