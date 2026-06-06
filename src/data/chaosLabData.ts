import type { Item, Mode } from "@/types";

const item = (name: string, category: Item["category"] = "Core"): Item => ({ name, category });

export type ChaosBuild = {
  id: string;
  championName: string;
  championSlug: string;
  mode: Mode;
  title: string;
  creator: string;
  creatorTag: string;
  category: "Community" | "Experimental" | "Upvoted" | "Newest";
  status: "Verified" | "Testing" | "Unstable" | "Fresh";
  votes: number;
  comments: number;
  winRate: number;
  games: number;
  risk: "Low" | "Medium" | "High" | "Extreme";
  summary: string;
  items: Item[];
  augments: string[];
};

export type ChaosBuildDetails = {
  matchupNotes: string[];
  strengths: string[];
  weaknesses: string[];
  communityRating: {
    score: number;
    totalRatings: number;
    upvoteRate: number;
    difficultyVote: "Easy" | "Moderate" | "Hard" | "Expert";
  };
  commentPreview: Array<{
    author: string;
    badge: string;
    postedAgo: string;
    comment: string;
  }>;
};

export type ChaosCreator = {
  name: string;
  handle: string;
  specialty: string;
  featuredChampion: string;
  buildsPublished: number;
  totalVotes: number;
  spotlight: string;
};

export const chaosBuilds: ChaosBuild[] = [
  {
    id: "brand-critical-wildfire-plus",
    championName: "Brand",
    championSlug: "brand",
    mode: "arena",
    title: "Critical Wildfire Plus",
    creator: "TorchTheory",
    creatorTag: "Burn Lab",
    category: "Community",
    status: "Verified",
    votes: 1842,
    comments: 128,
    winRate: 59.4,
    games: 12400,
    risk: "Medium",
    summary: "A community-refined Brand setup that stacks burn crits, slows, and delayed burst into a two-round pressure check.",
    items: [item("Liandry's Torment"), item("Sorcerer's Shoes", "Boots"), item("Rylai's Crystal Scepter"), item("Blackfire Torch"), item("Shadowflame"), item("Void Staff")],
    augments: ["vulnerability", "phenomenal-evil", "jeweled-gauntlet"]
  },
  {
    id: "jinx-rocket-lottery",
    championName: "Jinx",
    championSlug: "jinx",
    mode: "aramMayhem",
    title: "Rocket Lottery",
    creator: "ResetJunkie",
    creatorTag: "Bridge Tech",
    category: "Community",
    status: "Testing",
    votes: 1396,
    comments: 94,
    winRate: 56.8,
    games: 9100,
    risk: "Low",
    summary: "A safer bridge carry variant built around wave shock, extended range, and one cleanup reset turning into five.",
    items: [item("Statikk Shiv"), item("Berserker's Greaves", "Boots"), item("Runaan's Hurricane"), item("Infinity Edge"), item("Rapid Firecannon"), item("Bloodthirster", "Defense")],
    augments: ["scopier-weapons", "bread-and-butter", "magic-missile"]
  },
  {
    id: "sett-centerline-heist",
    championName: "Sett",
    championSlug: "sett",
    mode: "aramMayhem",
    title: "Centerline Heist",
    creator: "KnuckleStack",
    creatorTag: "Brawler Lab",
    category: "Experimental",
    status: "Unstable",
    votes: 771,
    comments: 63,
    winRate: 51.9,
    games: 2400,
    risk: "Extreme",
    summary: "An absurd health-stacking experiment that turns bridge clustering into one giant Haymaker angle.",
    items: [item("Heartsteel", "Defense"), item("Mercury's Treads", "Boots"), item("Sterak's Gage", "Defense"), item("Overlord's Bloodmail"), item("Spirit Visage", "Defense"), item("Dead Man's Plate", "Defense")],
    augments: ["goliath", "earthwake", "raid-boss"]
  },
  {
    id: "ezreal-q-loop-heist",
    championName: "Ezreal",
    championSlug: "ezreal",
    mode: "arena",
    title: "Q Loop Heist",
    creator: "BlueBuilds",
    creatorTag: "Skillshot Desk",
    category: "Upvoted",
    status: "Verified",
    votes: 2218,
    comments: 201,
    winRate: 55.2,
    games: 15300,
    risk: "Low",
    summary: "A highly upvoted haste loop where Mystic Shot becomes poke, peel, and escape cooldown all at once.",
    items: [item("Manamune"), item("Ionian Boots of Lucidity", "Boots"), item("Trinity Force"), item("Serylda's Grudge", "Utility"), item("Spear of Shojin"), item("Guardian Angel", "Defense")],
    augments: ["bread-and-butter", "scopier-weapons", "magic-missile"]
  },
  {
    id: "samira-style-detonation",
    championName: "Samira",
    championSlug: "samira",
    mode: "arena",
    title: "Style Detonation",
    creator: "SRankOnly",
    creatorTag: "Reset Desk",
    category: "Upvoted",
    status: "Testing",
    votes: 1688,
    comments: 156,
    winRate: 54.1,
    games: 7800,
    risk: "High",
    summary: "A flashy all-in page that pairs movement augments with enough lifesteal to survive the first ultimate window.",
    items: [item("The Collector"), item("Berserker's Greaves", "Boots"), item("Infinity Edge"), item("Immortal Shieldbow", "Defense"), item("Lord Dominik's Regards"), item("Bloodthirster", "Defense")],
    augments: ["earthwake", "dont-blink", "scopier-weapons"]
  },
  {
    id: "vladimir-redline-engine",
    championName: "Vladimir",
    championSlug: "vladimir",
    mode: "aramMayhem",
    title: "Redline Engine",
    creator: "Hemoplanner",
    creatorTag: "Late Fight",
    category: "Experimental",
    status: "Fresh",
    votes: 512,
    comments: 38,
    winRate: 52.7,
    games: 1600,
    risk: "High",
    summary: "A new sustain experiment that plays around health pack timing, delayed pools, and full-team Hemoplague turns.",
    items: [item("Riftmaker"), item("Ionian Boots of Lucidity", "Boots"), item("Cosmic Drive", "Utility"), item("Rabadon's Deathcap"), item("Spirit Visage", "Defense"), item("Void Staff")],
    augments: ["raid-boss", "vulnerability", "jeweled-gauntlet"]
  },
  {
    id: "lux-prism-check",
    championName: "Lux",
    championSlug: "lux",
    mode: "arena",
    title: "Prism Check",
    creator: "LightBinding",
    creatorTag: "Control Mage",
    category: "Newest",
    status: "Fresh",
    votes: 284,
    comments: 21,
    winRate: 53.8,
    games: 900,
    risk: "Medium",
    summary: "A newer Lux variant that trades raw haste for safer pick windows and cleaner shield timing.",
    items: [item("Luden's Companion"), item("Sorcerer's Shoes", "Boots"), item("Horizon Focus"), item("Cryptbloom", "Utility"), item("Rabadon's Deathcap"), item("Zhonya's Hourglass", "Defense")],
    augments: ["jeweled-gauntlet", "bread-and-butter", "magic-missile"]
  },
  {
    id: "nautilus-anchor-tax",
    championName: "Nautilus",
    championSlug: "nautilus",
    mode: "aramMayhem",
    title: "Anchor Tax",
    creator: "HookAccountant",
    creatorTag: "Engage Audit",
    category: "Newest",
    status: "Testing",
    votes: 341,
    comments: 27,
    winRate: 52.4,
    games: 1100,
    risk: "Medium",
    summary: "A fresh tank theorycraft that turns every bridge hook threat into a slow, expensive fight for enemy carries.",
    items: [item("Heartsteel", "Defense"), item("Mercury's Treads", "Boots"), item("Sunfire Aegis", "Defense"), item("Abyssal Mask", "Utility"), item("Frozen Heart", "Defense"), item("Kaenic Rookern", "Defense")],
    augments: ["courage-of-the-colossus", "goliath", "raid-boss"]
  }
];

export const chaosCreators: ChaosCreator[] = [
  {
    name: "TorchTheory",
    handle: "@torchtheory",
    specialty: "Burn builds and delayed damage routing",
    featuredChampion: "Brand",
    buildsPublished: 18,
    totalVotes: 12480,
    spotlight: "Known for turning slow damage profiles into practical round-winning setups with clear item checkpoints."
  },
  {
    name: "ResetJunkie",
    handle: "@resetjunkie",
    specialty: "Marksman reset paths and bridge cleanup builds",
    featuredChampion: "Jinx",
    buildsPublished: 14,
    totalVotes: 9870,
    spotlight: "Focuses on spacing-first carry builds that still hit the broken-score ceiling when fights collapse."
  },
  {
    name: "BlueBuilds",
    handle: "@bluebuilds",
    specialty: "Haste loops, poke engines, and low-risk Arena tech",
    featuredChampion: "Ezreal",
    buildsPublished: 11,
    totalVotes: 8642,
    spotlight: "Creates clean, repeatable setups for players who want high agency without gambling the first engage."
  }
];

export function getChaosBuildsByCategory(category: ChaosBuild["category"]) {
  return chaosBuilds.filter((build) => build.category === category);
}

export function getMostUpvotedChaosBuilds(limit = 3) {
  return [...chaosBuilds].sort((a, b) => b.votes - a.votes).slice(0, limit);
}

export function getNewestChaosBuilds(limit = 3) {
  return chaosBuilds.filter((build) => build.category === "Newest").slice(0, limit);
}

export function getChaosBuildBySlug(slug: string) {
  return chaosBuilds.find((build) => build.id === slug);
}

export function getChaosBuildDetails(build: ChaosBuild): ChaosBuildDetails {
  const modeLabel = build.mode === "arena" ? "Arena" : "ARAM Mayhem";
  const pressureNote = build.risk === "Low"
    ? "Strong into standard front-to-back comps because the setup has reliable damage windows without overcommitting."
    : build.risk === "Medium"
      ? "Best into teams that give you one clean setup window; forced engages can punish missed timing."
      : "Highest value into predictable engage patterns, but it can collapse fast when enemies disengage the first all-in.";

  return {
    matchupNotes: [
      pressureNote,
      `${modeLabel} games with heavy poke require earlier defensive item discipline before chasing the full ceiling.`,
      `Avoid drafting this into repeated silence, suppression, or instant displacement unless your partner can cover ${build.championName}'s first reset window.`
    ],
    strengths: [
      "Clear item checkpoints that explain when the build comes online.",
      "High community interest and enough sample volume to justify testing.",
      `Pairs naturally with ${build.augments[0]} and ${build.augments[1]} for a recognizable power spike.`
    ],
    weaknesses: [
      `${build.risk} risk profile means the build can underperform when the first fight pattern is denied.`,
      "Requires players to respect the setup timing instead of copying the final inventory blindly.",
      "Can be outpaced by safer meta builds when behind after the first major item."
    ],
    communityRating: {
      score: Number(Math.min(9.8, 6.8 + build.votes / 900 + build.winRate / 100).toFixed(1)),
      totalRatings: Math.max(80, Math.round(build.votes * 0.38)),
      upvoteRate: Math.min(98, Math.round(72 + build.votes / 90)),
      difficultyVote: build.risk === "Extreme" ? "Expert" : build.risk === "High" ? "Hard" : build.risk === "Medium" ? "Moderate" : "Easy"
    },
    commentPreview: [
      {
        author: build.creator,
        badge: build.creatorTag,
        postedAgo: "2h ago",
        comment: `The key is not rushing every fight. ${build.title} spikes hardest when the first two items are online and the augment pair is secured.`
      },
      {
        author: "QueueScientist",
        badge: "Lab Reviewer",
        postedAgo: "7h ago",
        comment: `Tested this in ${modeLabel}; the item path feels real, but the matchup spread depends heavily on enemy crowd control.`
      },
      {
        author: "PatchScout",
        badge: "Meta Watch",
        postedAgo: "1d ago",
        comment: `The votes make sense. It is not always optimal, but it creates a fight pattern most opponents do not practice against.`
      }
    ]
  };
}
