export type Mode = "arena" | "aramMayhem";

export type Tier = "S+" | "S" | "A" | "B" | "C";

export type Role =
  | "Marksman"
  | "Mage"
  | "Bruiser"
  | "Tank"
  | "Enchanter"
  | "Assassin";

export type Difficulty = "Easy" | "Medium" | "Hard" | "Expert";

export type Item = {
  name: string;
  category: "Starter" | "Core" | "Damage" | "Defense" | "Utility" | "Boots";
};

export type Build = {
  name: string;
  itemOrder: Item[];
  fullBuild: Item[];
  explanation: string;
  brokenScore?: number;
};

export type Augment = {
  id: string;
  name: string;
  description: string;
  averageWinRate: number;
  pickRate: number;
  bestChampionSlugs: string[];
};

export type ChampionModeStats = {
  winRate: number;
  pickRate: number;
  banRate?: number;
  bestBuild: Build;
  brokenBuild: Build;
  augments: string[];
  itemSynergies: string[];
};

export type ChampionGuide = {
  strengths: string[];
  weaknesses: string[];
  tips: string[];
  playstyle: string;
};

export type Champion = {
  id: number;
  name: string;
  slug: string;
  role: Role;
  tier: Tier;
  difficulty: Difficulty;
  arenaStats: ChampionModeStats;
  aramMayhemStats: ChampionModeStats;
  guide: ChampionGuide;
};

export type ModeStatsKey = "arenaStats" | "aramMayhemStats";
