import type { Build, Champion, Mode } from "@/types";

export type BrokenBuildEntry = {
  champion: Champion;
  mode: Mode;
  build: Build;
  augments: string[];
  winRate: number;
};
