import type { Augment, Champion, Item } from "@/types";

const item = (name: string, category: Item["category"] = "Core"): Item => ({ name, category });

export const augments: Augment[] = [
  {
    id: "jeweled-gauntlet",
    name: "Jeweled Gauntlet",
    description: "Ability damage can critically strike, turning poke rotations and burst combos into fight-ending pressure.",
    averageWinRate: 57.8,
    pickRate: 18.4,
    bestChampionSlugs: ["lux", "brand", "veigar", "vladimir"]
  },
  {
    id: "earthwake",
    name: "Earthwake",
    description: "Dashes leave a delayed eruption, rewarding champions who repeatedly cross through targets.",
    averageWinRate: 56.2,
    pickRate: 12.6,
    bestChampionSlugs: ["katarina", "samira", "sett"]
  },
  {
    id: "scopier-weapons",
    name: "Scopier Weapons",
    description: "Adds attack range and makes marksmen far harder to punish in chaotic extended fights.",
    averageWinRate: 55.7,
    pickRate: 16.9,
    bestChampionSlugs: ["jinx", "caitlyn", "ezreal"]
  },
  {
    id: "goliath",
    name: "Goliath",
    description: "Gain size, health, and adaptive pressure for brawlers who want to sit inside the enemy team.",
    averageWinRate: 55.1,
    pickRate: 15.2,
    bestChampionSlugs: ["mordekaiser", "sett", "nautilus", "leona"]
  },
  {
    id: "phenomenal-evil",
    name: "Phenomenal Evil",
    description: "Repeated spell hits stack ability power, making poke mages scale sharply over a match.",
    averageWinRate: 54.9,
    pickRate: 14.8,
    bestChampionSlugs: ["brand", "lux", "swain", "veigar"]
  },
  {
    id: "bread-and-butter",
    name: "Bread and Butter",
    description: "Your primary basic spell gains massive haste, enabling constant trading and wave control.",
    averageWinRate: 53.6,
    pickRate: 19.1,
    bestChampionSlugs: ["ezreal", "caitlyn", "milio", "lux"]
  },
  {
    id: "raid-boss",
    name: "Raid Boss",
    description: "Channel into a delayed transformation that rewards teams able to buy time for a huge re-entry.",
    averageWinRate: 56.8,
    pickRate: 8.2,
    bestChampionSlugs: ["mordekaiser", "swain", "vladimir", "sett"]
  },
  {
    id: "magic-missile",
    name: "Magic Missile",
    description: "Ability hits fire bonus missiles, adding reliable chip damage to repeat-cast champions.",
    averageWinRate: 54.3,
    pickRate: 13.7,
    bestChampionSlugs: ["brand", "ezreal", "milio", "lux"]
  },
  {
    id: "vulnerability",
    name: "Vulnerability",
    description: "Damage over time and item effects can critically strike, amplifying burn builds and resets.",
    averageWinRate: 57.1,
    pickRate: 11.4,
    bestChampionSlugs: ["brand", "swain", "veigar", "vladimir"]
  },
  {
    id: "marksmage",
    name: "Marksmage",
    description: "Attacks scale with ability power, creating hybrid threat profiles for ranged spellcasters.",
    averageWinRate: 52.9,
    pickRate: 9.8,
    bestChampionSlugs: ["milio", "lux", "ezreal"]
  },
  {
    id: "dont-blink",
    name: "Don't Blink",
    description: "Burst of speed and threat after movement abilities, ideal for reset-heavy divers.",
    averageWinRate: 54.7,
    pickRate: 10.1,
    bestChampionSlugs: ["katarina", "samira", "vladimir"]
  },
  {
    id: "courage-of-the-colossus",
    name: "Courage of the Colossus",
    description: "Crowd control grants a shield, letting engage tanks start fights without instantly folding.",
    averageWinRate: 53.8,
    pickRate: 12.2,
    bestChampionSlugs: ["leona", "nautilus", "sett"]
  }
];

export const champions: Champion[] = [
  {
    id: 1,
    name: "Jinx",
    slug: "jinx",
    role: "Marksman",
    tier: "S+",
    difficulty: "Medium",
    arenaStats: {
      winRate: 56.9,
      pickRate: 14.4,
      banRate: 12.1,
      bestBuild: {
        name: "Reset Artillery",
        itemOrder: [item("Berserker's Greaves", "Boots"), item("Kraken Slayer"), item("Infinity Edge"), item("Runaan's Hurricane")],
        fullBuild: [item("Kraken Slayer"), item("Berserker's Greaves", "Boots"), item("Infinity Edge"), item("Runaan's Hurricane"), item("Lord Dominik's Regards"), item("Bloodthirster", "Defense")],
        explanation: "Jinx wins Arena by surviving the first dive, triggering Get Excited, then cleaning the map with rockets and splash damage."
      },
      brokenBuild: {
        name: "Scopier Rocket Casino",
        itemOrder: [item("Berserker's Greaves", "Boots"), item("Statikk Shiv"), item("Infinity Edge")],
        fullBuild: [item("Statikk Shiv"), item("Berserker's Greaves", "Boots"), item("Infinity Edge"), item("Runaan's Hurricane"), item("Rapid Firecannon"), item("Guardian Angel", "Defense")],
        explanation: "Extra range plus chain lightning lets Jinx start fights from outside retaliation range and snowball every takedown.",
        brokenScore: 96
      },
      augments: ["scopier-weapons", "bread-and-butter", "magic-missile"],
      itemSynergies: ["Runaan's Hurricane multiplies rocket splash in clustered fights.", "Rapid Firecannon creates safe first-hit windows."]
    },
    aramMayhemStats: {
      winRate: 55.8,
      pickRate: 18.7,
      bestBuild: {
        name: "Bridge Sweep",
        itemOrder: [item("Kraken Slayer"), item("Berserker's Greaves", "Boots"), item("Runaan's Hurricane")],
        fullBuild: [item("Kraken Slayer"), item("Berserker's Greaves", "Boots"), item("Runaan's Hurricane"), item("Infinity Edge"), item("Lord Dominik's Regards"), item("Bloodthirster", "Defense")],
        explanation: "ARAM Mayhem gives Jinx constant skirmish resets; prioritize wave access, range discipline, and cleanup angles."
      },
      brokenBuild: {
        name: "Minigun to Moonbase",
        itemOrder: [item("Statikk Shiv"), item("Runaan's Hurricane"), item("Infinity Edge")],
        fullBuild: [item("Statikk Shiv"), item("Runaan's Hurricane"), item("Berserker's Greaves", "Boots"), item("Infinity Edge"), item("Mortal Reminder"), item("Mercurial Scimitar", "Defense")],
        explanation: "Fast wave shocks force enemies to fight under low-health conditions where Jinx rockets take over.",
        brokenScore: 93
      },
      augments: ["scopier-weapons", "bread-and-butter", "goliath"],
      itemSynergies: ["Statikk Shiv accelerates shove before objectives.", "Bloodthirster gives reset fights a second health bar."]
    },
    guide: {
      strengths: ["Explosive cleanup after one takedown", "Excellent front-to-back damage", "Punishes teams grouped on narrow terrain"],
      weaknesses: ["Needs peel against hard dive", "Weak before first major item", "Can be zoned by long-range crowd control"],
      tips: ["Hold Flame Chompers for incoming divers instead of fishing with them.", "Swap to rockets before takedowns so Get Excited converts instantly into splash damage.", "Use Zap to check brush and slow retreat paths rather than starting every fight with it."],
      playstyle: "Play patiently until the first health bar breaks. Jinx is strongest when the enemy team is already committed and cannot reset their spacing."
    }
  },
  {
    id: 2,
    name: "Lux",
    slug: "lux",
    role: "Mage",
    tier: "S",
    difficulty: "Easy",
    arenaStats: {
      winRate: 54.6,
      pickRate: 13.8,
      banRate: 8.5,
      bestBuild: {
        name: "Prism Snare",
        itemOrder: [item("Sorcerer's Shoes", "Boots"), item("Luden's Companion"), item("Horizon Focus")],
        fullBuild: [item("Luden's Companion"), item("Sorcerer's Shoes", "Boots"), item("Horizon Focus"), item("Rabadon's Deathcap"), item("Void Staff"), item("Zhonya's Hourglass", "Defense")],
        explanation: "Lux turns one binding into a full burst cycle while still shielding her partner through counter-engage."
      },
      brokenBuild: {
        name: "Jeweled Laser Check",
        itemOrder: [item("Luden's Companion"), item("Horizon Focus"), item("Rabadon's Deathcap")],
        fullBuild: [item("Luden's Companion"), item("Sorcerer's Shoes", "Boots"), item("Horizon Focus"), item("Rabadon's Deathcap"), item("Shadowflame"), item("Void Staff")],
        explanation: "Jeweled Gauntlet makes Final Spark a lethal check from ranges most Arena comps cannot contest.",
        brokenScore: 90
      },
      augments: ["jeweled-gauntlet", "phenomenal-evil", "bread-and-butter"],
      itemSynergies: ["Horizon Focus rewards long-range bindings.", "Zhonya's Hourglass buys time after missed root windows."]
    },
    aramMayhemStats: {
      winRate: 53.9,
      pickRate: 20.2,
      bestBuild: {
        name: "Bridge Control",
        itemOrder: [item("Luden's Companion"), item("Sorcerer's Shoes", "Boots"), item("Horizon Focus")],
        fullBuild: [item("Luden's Companion"), item("Sorcerer's Shoes", "Boots"), item("Horizon Focus"), item("Cryptbloom", "Utility"), item("Rabadon's Deathcap"), item("Zhonya's Hourglass", "Defense")],
        explanation: "Lux controls the bridge with E zones, shielding waves, and low-commitment picks before objectives."
      },
      brokenBuild: {
        name: "Final Spark Battery",
        itemOrder: [item("Malignance"), item("Horizon Focus"), item("Rabadon's Deathcap")],
        fullBuild: [item("Malignance"), item("Sorcerer's Shoes", "Boots"), item("Horizon Focus"), item("Rabadon's Deathcap"), item("Void Staff"), item("Banshee's Veil", "Defense")],
        explanation: "Ultimate haste and long-range burst let Lux erase low-health targets before they can use Mayhem tempo.",
        brokenScore: 88
      },
      augments: ["jeweled-gauntlet", "magic-missile", "phenomenal-evil"],
      itemSynergies: ["Cryptbloom turns poke kills into team sustain.", "Malignance keeps Final Spark available for every wave fight."]
    },
    guide: {
      strengths: ["Long-range pick threat", "Team shielding scales well in grouped fights", "Excellent objective-zone control"],
      weaknesses: ["Fragile when flankers close distance", "Predictable if Q is used on cooldown", "Struggles into spell shields and high tenacity"],
      tips: ["Cast E slightly behind targets to punish retreats.", "Use shield on the way in and out to double dip its value.", "Wait for allied slows before committing Q in Arena."],
      playstyle: "Lux should play like a control mage first and a burst mage second. Keep space clean, then punish enemies forced through your light zones."
    }
  },
  {
    id: 3,
    name: "Brand",
    slug: "brand",
    role: "Mage",
    tier: "S+",
    difficulty: "Medium",
    arenaStats: {
      winRate: 58.1,
      pickRate: 15.9,
      banRate: 18.6,
      bestBuild: {
        name: "Burn Loop",
        itemOrder: [item("Sorcerer's Shoes", "Boots"), item("Liandry's Torment"), item("Rylai's Crystal Scepter")],
        fullBuild: [item("Liandry's Torment"), item("Sorcerer's Shoes", "Boots"), item("Rylai's Crystal Scepter"), item("Blackfire Torch"), item("Cryptbloom", "Utility"), item("Zhonya's Hourglass", "Defense")],
        explanation: "Brand wants every fight to last one spell rotation longer than opponents can survive."
      },
      brokenBuild: {
        name: "Critical Wildfire",
        itemOrder: [item("Liandry's Torment"), item("Rylai's Crystal Scepter"), item("Blackfire Torch")],
        fullBuild: [item("Liandry's Torment"), item("Sorcerer's Shoes", "Boots"), item("Rylai's Crystal Scepter"), item("Blackfire Torch"), item("Rabadon's Deathcap"), item("Void Staff")],
        explanation: "Burn crits and stacking AP turn passive spread into unavoidable teamfight collapse.",
        brokenScore: 99
      },
      augments: ["vulnerability", "phenomenal-evil", "jeweled-gauntlet"],
      itemSynergies: ["Rylai's makes passive spread easier to chain.", "Blackfire Torch stacks quickly into two-target Arena fights."]
    },
    aramMayhemStats: {
      winRate: 57.4,
      pickRate: 17.1,
      bestBuild: {
        name: "Five-Man Fever",
        itemOrder: [item("Liandry's Torment"), item("Sorcerer's Shoes", "Boots"), item("Rylai's Crystal Scepter")],
        fullBuild: [item("Liandry's Torment"), item("Sorcerer's Shoes", "Boots"), item("Rylai's Crystal Scepter"), item("Blackfire Torch"), item("Cryptbloom", "Utility"), item("Rabadon's Deathcap")],
        explanation: "ARAM Mayhem's constant clustering lets Brand spread passive and force losing trades from neutral range."
      },
      brokenBuild: {
        name: "Bridge Inferno",
        itemOrder: [item("Blackfire Torch"), item("Liandry's Torment"), item("Rylai's Crystal Scepter")],
        fullBuild: [item("Blackfire Torch"), item("Sorcerer's Shoes", "Boots"), item("Liandry's Torment"), item("Rylai's Crystal Scepter"), item("Shadowflame"), item("Void Staff")],
        explanation: "Double burn plus slow turns every minion wave and choke point into a damage amplifier.",
        brokenScore: 98
      },
      augments: ["vulnerability", "magic-missile", "phenomenal-evil"],
      itemSynergies: ["Liandry's punishes tanks forced to front-line.", "Shadowflame spikes hard when Brand's passive leaves teams low."]
    },
    guide: {
      strengths: ["Unmatched area burn damage", "Punishes grouped teams", "Strong into tanks and sustain comps"],
      weaknesses: ["Immobile and easy to collapse on", "Requires spell sequencing for stun", "Can overpush fights without cooldowns"],
      tips: ["Use E on burning targets to spread passive before casting R.", "Hold Q until enemies commit movement skills.", "Angle W across minion waves to tag backline champions."],
      playstyle: "Brand thrives when fights are messy. Start controlled burns from max range, then let passive explosions create the all-in window."
    }
  },
  {
    id: 4,
    name: "Mordekaiser",
    slug: "mordekaiser",
    role: "Bruiser",
    tier: "S",
    difficulty: "Medium",
    arenaStats: {
      winRate: 55.7,
      pickRate: 12.9,
      banRate: 16.4,
      bestBuild: {
        name: "Realm Warden",
        itemOrder: [item("Plated Steelcaps", "Boots"), item("Riftmaker"), item("Rylai's Crystal Scepter")],
        fullBuild: [item("Riftmaker"), item("Plated Steelcaps", "Boots"), item("Rylai's Crystal Scepter"), item("Liandry's Torment"), item("Jak'Sho, The Protean", "Defense"), item("Spirit Visage", "Defense")],
        explanation: "Mordekaiser isolates priority targets and wins slow fights with passive uptime and shield timing."
      },
      brokenBuild: {
        name: "Raid Boss Realm",
        itemOrder: [item("Riftmaker"), item("Rylai's Crystal Scepter"), item("Jak'Sho, The Protean", "Defense")],
        fullBuild: [item("Riftmaker"), item("Mercury's Treads", "Boots"), item("Rylai's Crystal Scepter"), item("Jak'Sho, The Protean", "Defense"), item("Spirit Visage", "Defense"), item("Liandry's Torment")],
        explanation: "Raid Boss and Death Realm force enemies to choose between abandoning their partner or fighting an unkillable stat wall.",
        brokenScore: 94
      },
      augments: ["raid-boss", "goliath", "courage-of-the-colossus"],
      itemSynergies: ["Rylai's locks targets inside passive range.", "Spirit Visage boosts both W and omnivamp value."]
    },
    aramMayhemStats: {
      winRate: 52.6,
      pickRate: 9.6,
      bestBuild: {
        name: "Iron Front",
        itemOrder: [item("Riftmaker"), item("Mercury's Treads", "Boots"), item("Rylai's Crystal Scepter")],
        fullBuild: [item("Riftmaker"), item("Mercury's Treads", "Boots"), item("Rylai's Crystal Scepter"), item("Liandry's Torment"), item("Unending Despair", "Defense"), item("Spirit Visage", "Defense")],
        explanation: "On the bridge, Mordekaiser plays as a zone breaker who punishes carries stepping past minions."
      },
      brokenBuild: {
        name: "No Exit Circle",
        itemOrder: [item("Rylai's Crystal Scepter"), item("Riftmaker"), item("Unending Despair", "Defense")],
        fullBuild: [item("Rylai's Crystal Scepter"), item("Mercury's Treads", "Boots"), item("Riftmaker"), item("Unending Despair", "Defense"), item("Spirit Visage", "Defense"), item("Jak'Sho, The Protean", "Defense")],
        explanation: "Constant slows and sustain let Mordekaiser walk down cramped fights after one enemy missteps.",
        brokenScore: 84
      },
      augments: ["goliath", "raid-boss", "courage-of-the-colossus"],
      itemSynergies: ["Unending Despair is reliable in bridge brawls.", "Riftmaker rewards drawn-out fights after poke has landed."]
    },
    guide: {
      strengths: ["Excellent isolated dueling", "Strong anti-carry ultimate", "Durable into mixed damage"],
      weaknesses: ["Can be kited before Rylai's", "Low engage range", "Ultimate loses value into cleanse effects"],
      tips: ["Ult the champion with the least escape support, not always the highest damage target.", "Use W after taking damage rather than as an opener.", "Cast E behind enemies to pull them back into passive range."],
      playstyle: "Mordekaiser wants to make fights smaller. Split the enemy formation, remove the best target, and return with passive already running."
    }
  },
  {
    id: 5,
    name: "Sett",
    slug: "sett",
    role: "Bruiser",
    tier: "A",
    difficulty: "Medium",
    arenaStats: {
      winRate: 53.3,
      pickRate: 11.7,
      banRate: 9.2,
      bestBuild: {
        name: "Pit Boss",
        itemOrder: [item("Plated Steelcaps", "Boots"), item("Stridebreaker"), item("Sterak's Gage", "Defense")],
        fullBuild: [item("Stridebreaker"), item("Plated Steelcaps", "Boots"), item("Sterak's Gage", "Defense"), item("Sundered Sky"), item("Dead Man's Plate", "Defense"), item("Spirit Visage", "Defense")],
        explanation: "Sett converts enemy engage into Haymaker damage and uses Stridebreaker to keep carries inside punch range."
      },
      brokenBuild: {
        name: "Earthwake Suplex",
        itemOrder: [item("Stridebreaker"), item("Sundered Sky"), item("Sterak's Gage", "Defense")],
        fullBuild: [item("Stridebreaker"), item("Mercury's Treads", "Boots"), item("Sundered Sky"), item("Sterak's Gage", "Defense"), item("Overlord's Bloodmail"), item("Spirit Visage", "Defense")],
        explanation: "Earthwake adds huge delayed damage to Facebreaker and Show Stopper paths while Sett soaks the counter-hit.",
        brokenScore: 89
      },
      augments: ["earthwake", "goliath", "courage-of-the-colossus"],
      itemSynergies: ["Sterak's makes full-grit Haymakers safer.", "Sundered Sky gives reliable healing in short trades."]
    },
    aramMayhemStats: {
      winRate: 51.7,
      pickRate: 10.1,
      bestBuild: {
        name: "Bridge Bouncer",
        itemOrder: [item("Stridebreaker"), item("Plated Steelcaps", "Boots"), item("Sterak's Gage", "Defense")],
        fullBuild: [item("Stridebreaker"), item("Plated Steelcaps", "Boots"), item("Sterak's Gage", "Defense"), item("Dead Man's Plate", "Defense"), item("Spirit Visage", "Defense"), item("Sundered Sky")],
        explanation: "Sett works best as counter-engage, punishing tanks who step too far forward."
      },
      brokenBuild: {
        name: "Centerline Haymaker",
        itemOrder: [item("Heartsteel", "Defense"), item("Sterak's Gage", "Defense"), item("Overlord's Bloodmail")],
        fullBuild: [item("Heartsteel", "Defense"), item("Mercury's Treads", "Boots"), item("Sterak's Gage", "Defense"), item("Overlord's Bloodmail"), item("Spirit Visage", "Defense"), item("Dead Man's Plate", "Defense")],
        explanation: "Health stacking makes Haymaker threaten entire teams on the narrow bridge.",
        brokenScore: 82
      },
      augments: ["goliath", "earthwake", "raid-boss"],
      itemSynergies: ["Heartsteel is easier to stack in constant ARAM contact.", "Overlord's Bloodmail converts bulk into real threat."]
    },
    guide: {
      strengths: ["Punishes engage-heavy teams", "Huge burst shield window", "Strong into melee stacks"],
      weaknesses: ["Can be ignored or kited", "Telegraphed damage pattern", "Needs flanking or enemy commitment"],
      tips: ["Aim Show Stopper through the enemy backline, not just at the nearest target.", "Facebreaker is strongest when it stuns from both sides.", "Do not spend Haymaker before grit peaks unless it secures a kill."],
      playstyle: "Sett is a counterpunch champion. Let enemies start the collision, then turn their positioning into one decisive Haymaker."
    }
  },
  {
    id: 6,
    name: "Swain",
    slug: "swain",
    role: "Mage",
    tier: "S",
    difficulty: "Medium",
    arenaStats: {
      winRate: 55.2,
      pickRate: 10.8,
      banRate: 10.9,
      bestBuild: {
        name: "Demon Court",
        itemOrder: [item("Mercury's Treads", "Boots"), item("Blackfire Torch"), item("Rylai's Crystal Scepter")],
        fullBuild: [item("Blackfire Torch"), item("Mercury's Treads", "Boots"), item("Rylai's Crystal Scepter"), item("Liandry's Torment"), item("Spirit Visage", "Defense"), item("Zhonya's Hourglass", "Defense")],
        explanation: "Swain wins by keeping enemies in ultimate range and turning every root into extra soul sustain."
      },
      brokenBuild: {
        name: "Neverending Ascension",
        itemOrder: [item("Rylai's Crystal Scepter"), item("Blackfire Torch"), item("Liandry's Torment")],
        fullBuild: [item("Rylai's Crystal Scepter"), item("Mercury's Treads", "Boots"), item("Blackfire Torch"), item("Liandry's Torment"), item("Spirit Visage", "Defense"), item("Riftmaker")],
        explanation: "Rylai's plus burn damage makes Swain almost impossible to disengage once his ultimate starts.",
        brokenScore: 91
      },
      augments: ["raid-boss", "phenomenal-evil", "vulnerability"],
      itemSynergies: ["Spirit Visage pushes drain thresholds higher.", "Rylai's keeps Demonflare pressure connected."]
    },
    aramMayhemStats: {
      winRate: 54.8,
      pickRate: 11.9,
      bestBuild: {
        name: "Bridge Tyrant",
        itemOrder: [item("Blackfire Torch"), item("Mercury's Treads", "Boots"), item("Rylai's Crystal Scepter")],
        fullBuild: [item("Blackfire Torch"), item("Mercury's Treads", "Boots"), item("Rylai's Crystal Scepter"), item("Liandry's Torment"), item("Spirit Visage", "Defense"), item("Zhonya's Hourglass", "Defense")],
        explanation: "Constant bridge fighting gives Swain frequent soul fragments and excellent ultimate uptime value."
      },
      brokenBuild: {
        name: "Imperial Drain Tank",
        itemOrder: [item("Blackfire Torch"), item("Rylai's Crystal Scepter"), item("Spirit Visage", "Defense")],
        fullBuild: [item("Blackfire Torch"), item("Mercury's Treads", "Boots"), item("Rylai's Crystal Scepter"), item("Spirit Visage", "Defense"), item("Liandry's Torment"), item("Jak'Sho, The Protean", "Defense")],
        explanation: "The build trades burst for suffocating area control and enough durability to keep draining through resets.",
        brokenScore: 87
      },
      augments: ["raid-boss", "goliath", "phenomenal-evil"],
      itemSynergies: ["Zhonya's can extend ultimate during focus fire.", "Jak'Sho spikes when Swain is already surrounded."]
    },
    guide: {
      strengths: ["Excellent sustained teamfight presence", "Strong into short-range comps", "Scales with repeated skirmishes"],
      weaknesses: ["Skillshot root can be sidestepped", "Needs ultimate to survive focus", "Struggles into poke disengage"],
      tips: ["Use W to cut off retreats, not only for damage.", "Pull immediately after E connects to guarantee Q follow-up.", "Enter fights after key displacement spells are down."],
      playstyle: "Swain wants enemies to fight inside his circle. Move forward when cooldowns are spent and make retreating cost more than continuing."
    }
  },
  {
    id: 7,
    name: "Vladimir",
    slug: "vladimir",
    role: "Mage",
    tier: "S",
    difficulty: "Hard",
    arenaStats: {
      winRate: 54.1,
      pickRate: 8.6,
      banRate: 11.7,
      bestBuild: {
        name: "Hemoplague Tempo",
        itemOrder: [item("Ionian Boots of Lucidity", "Boots"), item("Riftmaker"), item("Cosmic Drive")],
        fullBuild: [item("Riftmaker"), item("Ionian Boots of Lucidity", "Boots"), item("Cosmic Drive"), item("Rabadon's Deathcap"), item("Spirit Visage", "Defense"), item("Void Staff")],
        explanation: "Vladimir scales into oppressive late-round fights by combining haste, sustain, and delayed burst."
      },
      brokenBuild: {
        name: "Untargetable Nuke",
        itemOrder: [item("Cosmic Drive"), item("Riftmaker"), item("Rabadon's Deathcap")],
        fullBuild: [item("Cosmic Drive"), item("Ionian Boots of Lucidity", "Boots"), item("Riftmaker"), item("Rabadon's Deathcap"), item("Spirit Visage", "Defense"), item("Void Staff")],
        explanation: "Movement speed, pool safety, and Jeweled burst let Vladimir delete carries without offering a clean punish window.",
        brokenScore: 92
      },
      augments: ["jeweled-gauntlet", "raid-boss", "dont-blink"],
      itemSynergies: ["Cosmic Drive makes empowered Q spacing much easier.", "Spirit Visage turns close rounds into sustain wins."]
    },
    aramMayhemStats: {
      winRate: 52.9,
      pickRate: 9.4,
      bestBuild: {
        name: "Crimson Bridge",
        itemOrder: [item("Riftmaker"), item("Ionian Boots of Lucidity", "Boots"), item("Cosmic Drive")],
        fullBuild: [item("Riftmaker"), item("Ionian Boots of Lucidity", "Boots"), item("Cosmic Drive"), item("Rabadon's Deathcap"), item("Void Staff"), item("Spirit Visage", "Defense")],
        explanation: "Vladimir plays around health pack timing, empowered Q trades, and flank ultimates in ARAM Mayhem."
      },
      brokenBuild: {
        name: "Pool Party Disaster",
        itemOrder: [item("Cosmic Drive"), item("Rabadon's Deathcap"), item("Void Staff")],
        fullBuild: [item("Cosmic Drive"), item("Sorcerer's Shoes", "Boots"), item("Rabadon's Deathcap"), item("Void Staff"), item("Riftmaker"), item("Zhonya's Hourglass", "Defense")],
        explanation: "High haste and burst AP make Vladimir a backline threat that is hard to pin down in bridge chaos.",
        brokenScore: 85
      },
      augments: ["jeweled-gauntlet", "phenomenal-evil", "raid-boss"],
      itemSynergies: ["Zhonya's doubles down on delayed Hemoplague timing.", "Void Staff keeps combo damage relevant into tanks."]
    },
    guide: {
      strengths: ["Massive late-fight healing", "Untargetability denies burst windows", "High area burst with ultimate"],
      weaknesses: ["Short range before items", "Weak if forced to pool early", "Requires careful empowered Q timing"],
      tips: ["Start charging E before pooling for safer burst entries.", "Do not ult only one target unless it guarantees the round.", "Use empowered Q threat to walk enemies off space."],
      playstyle: "Vladimir is a patience test. Absorb poke carefully, preserve pool, then enter after enemies have spent their first crowd control layer."
    }
  },
  {
    id: 8,
    name: "Veigar",
    slug: "veigar",
    role: "Mage",
    tier: "A",
    difficulty: "Medium",
    arenaStats: {
      winRate: 53.8,
      pickRate: 9.2,
      banRate: 13.3,
      bestBuild: {
        name: "Event Horizon Control",
        itemOrder: [item("Sorcerer's Shoes", "Boots"), item("Luden's Companion"), item("Rabadon's Deathcap")],
        fullBuild: [item("Luden's Companion"), item("Sorcerer's Shoes", "Boots"), item("Rabadon's Deathcap"), item("Void Staff"), item("Zhonya's Hourglass", "Defense"), item("Banshee's Veil", "Defense")],
        explanation: "Veigar uses cage to create guaranteed burst windows and force awkward Arena pathing."
      },
      brokenBuild: {
        name: "One Button Courtroom",
        itemOrder: [item("Luden's Companion"), item("Rabadon's Deathcap"), item("Void Staff")],
        fullBuild: [item("Luden's Companion"), item("Sorcerer's Shoes", "Boots"), item("Rabadon's Deathcap"), item("Void Staff"), item("Shadowflame"), item("Zhonya's Hourglass", "Defense")],
        explanation: "Jeweled burst plus infinite AP scaling turns every cage touch into a near-certain execution.",
        brokenScore: 88
      },
      augments: ["jeweled-gauntlet", "phenomenal-evil", "bread-and-butter"],
      itemSynergies: ["Rabadon's multiplies passive stacks dramatically.", "Banshee's Veil protects cage setup against poke picks."]
    },
    aramMayhemStats: {
      winRate: 54.3,
      pickRate: 10.8,
      bestBuild: {
        name: "Cage the Bridge",
        itemOrder: [item("Luden's Companion"), item("Sorcerer's Shoes", "Boots"), item("Rabadon's Deathcap")],
        fullBuild: [item("Luden's Companion"), item("Sorcerer's Shoes", "Boots"), item("Rabadon's Deathcap"), item("Void Staff"), item("Cryptbloom", "Utility"), item("Zhonya's Hourglass", "Defense")],
        explanation: "ARAM Mayhem funnels targets through Event Horizon and gives Veigar steady stack access."
      },
      brokenBuild: {
        name: "Tiny Master, Large Problem",
        itemOrder: [item("Malignance"), item("Rabadon's Deathcap"), item("Void Staff")],
        fullBuild: [item("Malignance"), item("Sorcerer's Shoes", "Boots"), item("Rabadon's Deathcap"), item("Void Staff"), item("Shadowflame"), item("Banshee's Veil", "Defense")],
        explanation: "Ultimate haste makes Primordial Burst a recurring threat against every low-health reset attempt.",
        brokenScore: 86
      },
      augments: ["phenomenal-evil", "jeweled-gauntlet", "magic-missile"],
      itemSynergies: ["Cryptbloom adds team value after burst picks.", "Shadowflame pairs well with execution windows."]
    },
    guide: {
      strengths: ["Game-changing cage control", "Infinite AP scaling", "Excellent execute threat"],
      weaknesses: ["Vulnerable before cage is available", "Skillshots are slow", "Can be outranged by artillery mages"],
      tips: ["Place cage where enemies must walk, not where they are standing.", "Use W on stunned targets or predictable choke exits.", "Hold ultimate until shield and heal effects are committed."],
      playstyle: "Veigar wins by making zones illegal. Your damage matters, but the cage is what lets your team choose the fight."
    }
  },
  {
    id: 9,
    name: "Caitlyn",
    slug: "caitlyn",
    role: "Marksman",
    tier: "A",
    difficulty: "Medium",
    arenaStats: {
      winRate: 52.8,
      pickRate: 10.6,
      banRate: 6.4,
      bestBuild: {
        name: "Trapline Marksman",
        itemOrder: [item("Berserker's Greaves", "Boots"), item("Infinity Edge"), item("Rapid Firecannon")],
        fullBuild: [item("Infinity Edge"), item("Berserker's Greaves", "Boots"), item("Rapid Firecannon"), item("Lord Dominik's Regards"), item("Bloodthirster", "Defense"), item("Guardian Angel", "Defense")],
        explanation: "Caitlyn stretches Arena fights with traps and range, forcing enemies to pay for every approach."
      },
      brokenBuild: {
        name: "Headshot From Offscreen",
        itemOrder: [item("Rapid Firecannon"), item("Infinity Edge"), item("Lord Dominik's Regards")],
        fullBuild: [item("Rapid Firecannon"), item("Berserker's Greaves", "Boots"), item("Infinity Edge"), item("Lord Dominik's Regards"), item("The Collector"), item("Bloodthirster", "Defense")],
        explanation: "Stacked range creates oppressive headshot trades before melee champions can threaten her.",
        brokenScore: 86
      },
      augments: ["scopier-weapons", "bread-and-butter", "goliath"],
      itemSynergies: ["Rapid Firecannon lines up safer headshots.", "Guardian Angel discourages all-in dive plans."]
    },
    aramMayhemStats: {
      winRate: 51.9,
      pickRate: 13.4,
      bestBuild: {
        name: "Siege Sheriff",
        itemOrder: [item("Infinity Edge"), item("Berserker's Greaves", "Boots"), item("Rapid Firecannon")],
        fullBuild: [item("Infinity Edge"), item("Berserker's Greaves", "Boots"), item("Rapid Firecannon"), item("Lord Dominik's Regards"), item("Bloodthirster", "Defense"), item("Mercurial Scimitar", "Defense")],
        explanation: "Caitlyn uses traps around minion waves and health packs to control bridge tempo."
      },
      brokenBuild: {
        name: "Trap Grid Protocol",
        itemOrder: [item("Statikk Shiv"), item("Rapid Firecannon"), item("Infinity Edge")],
        fullBuild: [item("Statikk Shiv"), item("Berserker's Greaves", "Boots"), item("Rapid Firecannon"), item("Infinity Edge"), item("Lord Dominik's Regards"), item("Bloodthirster", "Defense")],
        explanation: "Wave control and range pressure let Caitlyn chip enemies until Ace in the Hole becomes unavoidable.",
        brokenScore: 81
      },
      augments: ["scopier-weapons", "bread-and-butter", "magic-missile"],
      itemSynergies: ["Statikk Shiv helps clear before trap setups.", "Mercurial Scimitar keeps her alive against pick comps."]
    },
    guide: {
      strengths: ["Excellent range control", "Trap follow-up on allied CC", "Strong objective and choke setup"],
      weaknesses: ["Lower sustained DPS than hypercarries", "Punished when Net is forced early", "Needs setup time for traps"],
      tips: ["Place traps behind enemies hit by allied crowd control.", "Save Net for displacement, then fire Q during the slow.", "Use ultimate after shields are down, not as poke into full resources."],
      playstyle: "Caitlyn should make the enemy walk through a shooting gallery. Control space first, then convert traps into headshots."
    }
  },
  {
    id: 10,
    name: "Ezreal",
    slug: "ezreal",
    role: "Marksman",
    tier: "A",
    difficulty: "Hard",
    arenaStats: {
      winRate: 52.4,
      pickRate: 16.2,
      banRate: 5.7,
      bestBuild: {
        name: "Arcane Kiter",
        itemOrder: [item("Ionian Boots of Lucidity", "Boots"), item("Trinity Force"), item("Manamune")],
        fullBuild: [item("Trinity Force"), item("Ionian Boots of Lucidity", "Boots"), item("Manamune"), item("Serylda's Grudge", "Utility"), item("Spear of Shojin"), item("Maw of Malmortius", "Defense")],
        explanation: "Ezreal thrives when he can keep distance, land Q repeatedly, and avoid the first engage."
      },
      brokenBuild: {
        name: "Mystic Shot Machine",
        itemOrder: [item("Manamune"), item("Trinity Force"), item("Serylda's Grudge", "Utility")],
        fullBuild: [item("Manamune"), item("Ionian Boots of Lucidity", "Boots"), item("Trinity Force"), item("Serylda's Grudge", "Utility"), item("Spear of Shojin"), item("Guardian Angel", "Defense")],
        explanation: "Bread and Butter turns Q into a relentless poke engine that also refreshes Ezreal's escape tools.",
        brokenScore: 87
      },
      augments: ["bread-and-butter", "scopier-weapons", "magic-missile"],
      itemSynergies: ["Serylda's makes every Q help kite.", "Spear of Shojin keeps Arcane Shift available more often."]
    },
    aramMayhemStats: {
      winRate: 53.6,
      pickRate: 19.5,
      bestBuild: {
        name: "Blue Bridge",
        itemOrder: [item("Manamune"), item("Ionian Boots of Lucidity", "Boots"), item("Trinity Force")],
        fullBuild: [item("Manamune"), item("Ionian Boots of Lucidity", "Boots"), item("Trinity Force"), item("Serylda's Grudge", "Utility"), item("Spear of Shojin"), item("Maw of Malmortius", "Defense")],
        explanation: "ARAM Mayhem rewards Ezreal's safe poke and repeated Q uptime before full commits."
      },
      brokenBuild: {
        name: "Q Cooldown Heist",
        itemOrder: [item("Essence Reaver"), item("Manamune"), item("Serylda's Grudge", "Utility")],
        fullBuild: [item("Essence Reaver"), item("Ionian Boots of Lucidity", "Boots"), item("Manamune"), item("Serylda's Grudge", "Utility"), item("Spear of Shojin"), item("Guardian Angel", "Defense")],
        explanation: "Extreme haste lets Ezreal control the bridge while staying almost impossible to catch.",
        brokenScore: 84
      },
      augments: ["bread-and-butter", "magic-missile", "scopier-weapons"],
      itemSynergies: ["Essence Reaver keeps poke mana-neutral.", "Maw protects against mage-heavy bridge comps."]
    },
    guide: {
      strengths: ["Safe poke from long range", "Excellent mobility", "Flexible damage pattern"],
      weaknesses: ["Skillshot reliant", "Lower burst without setup", "Can struggle into hard tanks"],
      tips: ["Use Arcane Shift after seeing engage tools, not for minor poke.", "Fire Trueshot Barrage through waves before objective fights.", "Keep passive stacked before committing to extended trades."],
      playstyle: "Ezreal is a tempo marksman. Keep enemies low, deny clean engages, and turn missed enemy cooldowns into free Q chains."
    }
  },
  {
    id: 11,
    name: "Leona",
    slug: "leona",
    role: "Tank",
    tier: "A",
    difficulty: "Easy",
    arenaStats: {
      winRate: 52.6,
      pickRate: 9.8,
      banRate: 7.1,
      bestBuild: {
        name: "Solar Lockdown",
        itemOrder: [item("Mercury's Treads", "Boots"), item("Locket of the Iron Solari", "Utility"), item("Zeke's Convergence", "Utility")],
        fullBuild: [item("Locket of the Iron Solari", "Utility"), item("Mercury's Treads", "Boots"), item("Zeke's Convergence", "Utility"), item("Knight's Vow", "Utility"), item("Frozen Heart", "Defense"), item("Kaenic Rookern", "Defense")],
        explanation: "Leona wins by guaranteeing the first target stays still long enough for her partner to finish the job."
      },
      brokenBuild: {
        name: "Perma-Stun Sunspot",
        itemOrder: [item("Zeke's Convergence", "Utility"), item("Locket of the Iron Solari", "Utility"), item("Frozen Heart", "Defense")],
        fullBuild: [item("Zeke's Convergence", "Utility"), item("Mercury's Treads", "Boots"), item("Locket of the Iron Solari", "Utility"), item("Frozen Heart", "Defense"), item("Kaenic Rookern", "Defense"), item("Knight's Vow", "Utility")],
        explanation: "Courage shields stack with Leona's natural resists, letting her chain crowd control without instantly being punished.",
        brokenScore: 83
      },
      augments: ["courage-of-the-colossus", "goliath", "raid-boss"],
      itemSynergies: ["Zeke's amplifies all-in partners.", "Locket keeps both players alive through counter-burst."]
    },
    aramMayhemStats: {
      winRate: 51.4,
      pickRate: 8.7,
      bestBuild: {
        name: "Sun Gate",
        itemOrder: [item("Locket of the Iron Solari", "Utility"), item("Mercury's Treads", "Boots"), item("Frozen Heart", "Defense")],
        fullBuild: [item("Locket of the Iron Solari", "Utility"), item("Mercury's Treads", "Boots"), item("Frozen Heart", "Defense"), item("Kaenic Rookern", "Defense"), item("Knight's Vow", "Utility"), item("Zeke's Convergence", "Utility")],
        explanation: "Leona starts bridge fights decisively and protects carries with layered lockdown."
      },
      brokenBuild: {
        name: "Solar Eclipse Wall",
        itemOrder: [item("Heartsteel", "Defense"), item("Sunfire Aegis", "Defense"), item("Kaenic Rookern", "Defense")],
        fullBuild: [item("Heartsteel", "Defense"), item("Plated Steelcaps", "Boots"), item("Sunfire Aegis", "Defense"), item("Kaenic Rookern", "Defense"), item("Frozen Heart", "Defense"), item("Locket of the Iron Solari", "Utility")],
        explanation: "Health stacking and repeated stuns create a front line that is hard to walk through on the bridge.",
        brokenScore: 79
      },
      augments: ["courage-of-the-colossus", "goliath", "raid-boss"],
      itemSynergies: ["Frozen Heart weakens clustered marksmen.", "Heartsteel stacks are easier to trigger in ARAM Mayhem."]
    },
    guide: {
      strengths: ["Reliable engage", "Layered crowd control", "Great with burst partners"],
      weaknesses: ["Commits her whole body to fights", "Weak when allies cannot follow", "Can be poked before engage"],
      tips: ["Use Solar Flare to force movement before landing Zenith Blade.", "Stagger Q and R instead of overlapping stuns.", "Track your ally's damage cooldowns before going in."],
      playstyle: "Leona is the fight starter. Her best rounds happen when she waits for one overstep and turns it into an unavoidable chain."
    }
  },
  {
    id: 12,
    name: "Milio",
    slug: "milio",
    role: "Enchanter",
    tier: "B",
    difficulty: "Medium",
    arenaStats: {
      winRate: 50.8,
      pickRate: 7.4,
      banRate: 3.1,
      bestBuild: {
        name: "Warm Hands Hypercarry",
        itemOrder: [item("Ionian Boots of Lucidity", "Boots"), item("Moonstone Renewer", "Utility"), item("Ardent Censer", "Utility")],
        fullBuild: [item("Moonstone Renewer", "Utility"), item("Ionian Boots of Lucidity", "Boots"), item("Ardent Censer", "Utility"), item("Staff of Flowing Water", "Utility"), item("Redemption", "Utility"), item("Mikael's Blessing", "Utility")],
        explanation: "Milio turns already-strong carries into range monsters while denying key crowd control."
      },
      brokenBuild: {
        name: "Scopier Campfire",
        itemOrder: [item("Moonstone Renewer", "Utility"), item("Ardent Censer", "Utility"), item("Staff of Flowing Water", "Utility")],
        fullBuild: [item("Moonstone Renewer", "Utility"), item("Ionian Boots of Lucidity", "Boots"), item("Ardent Censer", "Utility"), item("Staff of Flowing Water", "Utility"), item("Redemption", "Utility"), item("Mikael's Blessing", "Utility")],
        explanation: "Range stacking with a marksman partner creates absurd spacing, especially when Milio cleanses the first engage.",
        brokenScore: 78
      },
      augments: ["scopier-weapons", "marksmage", "magic-missile"],
      itemSynergies: ["Ardent Censer spikes ranged partners.", "Mikael's Blessing denies one-shot engage comps."]
    },
    aramMayhemStats: {
      winRate: 49.9,
      pickRate: 6.6,
      bestBuild: {
        name: "Bridge Bonfire",
        itemOrder: [item("Moonstone Renewer", "Utility"), item("Ionian Boots of Lucidity", "Boots"), item("Redemption", "Utility")],
        fullBuild: [item("Moonstone Renewer", "Utility"), item("Ionian Boots of Lucidity", "Boots"), item("Redemption", "Utility"), item("Ardent Censer", "Utility"), item("Staff of Flowing Water", "Utility"), item("Mikael's Blessing", "Utility")],
        explanation: "Milio sustains poke wars and lets carries attack from safer bridge positions."
      },
      brokenBuild: {
        name: "No Touching Zone",
        itemOrder: [item("Shurelya's Battlesong", "Utility"), item("Ardent Censer", "Utility"), item("Mikael's Blessing", "Utility")],
        fullBuild: [item("Shurelya's Battlesong", "Utility"), item("Ionian Boots of Lucidity", "Boots"), item("Ardent Censer", "Utility"), item("Mikael's Blessing", "Utility"), item("Redemption", "Utility"), item("Moonstone Renewer", "Utility")],
        explanation: "Speed, cleanse, and range make it miserable for melee teams to ever start a clean fight.",
        brokenScore: 76
      },
      augments: ["bread-and-butter", "scopier-weapons", "marksmage"],
      itemSynergies: ["Shurelya's helps dodge snowball engages.", "Redemption is reliable during clustered bridge standoffs."]
    },
    guide: {
      strengths: ["Range amplification", "Powerful cleanse ultimate", "Strong poke-war sustain"],
      weaknesses: ["Low direct damage", "Needs a carry partner", "Poor when caught before ultimate"],
      tips: ["Use Cozy Campfire before your carry starts trading, not after.", "Save Breath of Life for real crowd control chains.", "Kick divers sideways to break follow-up paths."],
      playstyle: "Milio wins by making his carry untouchable. Your job is to preserve spacing and deny the one engage that would break it."
    }
  },
  {
    id: 13,
    name: "Nautilus",
    slug: "nautilus",
    role: "Tank",
    tier: "A",
    difficulty: "Easy",
    arenaStats: {
      winRate: 52.1,
      pickRate: 10.2,
      banRate: 6.9,
      bestBuild: {
        name: "Anchor Point",
        itemOrder: [item("Mercury's Treads", "Boots"), item("Locket of the Iron Solari", "Utility"), item("Frozen Heart", "Defense")],
        fullBuild: [item("Locket of the Iron Solari", "Utility"), item("Mercury's Treads", "Boots"), item("Frozen Heart", "Defense"), item("Abyssal Mask", "Utility"), item("Kaenic Rookern", "Defense"), item("Knight's Vow", "Utility")],
        explanation: "Nautilus provides point-and-click lockdown and buys enough time for any damage partner to finish."
      },
      brokenBuild: {
        name: "Depth Charge Delivery",
        itemOrder: [item("Abyssal Mask", "Utility"), item("Locket of the Iron Solari", "Utility"), item("Frozen Heart", "Defense")],
        fullBuild: [item("Abyssal Mask", "Utility"), item("Mercury's Treads", "Boots"), item("Locket of the Iron Solari", "Utility"), item("Frozen Heart", "Defense"), item("Kaenic Rookern", "Defense"), item("Knight's Vow", "Utility")],
        explanation: "Abyssal Mask and layered CC let magic-damage partners delete anyone hit by the first anchor.",
        brokenScore: 82
      },
      augments: ["courage-of-the-colossus", "goliath", "raid-boss"],
      itemSynergies: ["Abyssal Mask is excellent with mage partners.", "Frozen Heart cripples double marksman drafts."]
    },
    aramMayhemStats: {
      winRate: 51.2,
      pickRate: 11.1,
      bestBuild: {
        name: "Bridge Anchor",
        itemOrder: [item("Locket of the Iron Solari", "Utility"), item("Mercury's Treads", "Boots"), item("Abyssal Mask", "Utility")],
        fullBuild: [item("Locket of the Iron Solari", "Utility"), item("Mercury's Treads", "Boots"), item("Abyssal Mask", "Utility"), item("Frozen Heart", "Defense"), item("Kaenic Rookern", "Defense"), item("Knight's Vow", "Utility")],
        explanation: "Nautilus threatens hooks through minion gaps and locks down divers before they reach carries."
      },
      brokenBuild: {
        name: "Anchor Chain Tax",
        itemOrder: [item("Heartsteel", "Defense"), item("Sunfire Aegis", "Defense"), item("Abyssal Mask", "Utility")],
        fullBuild: [item("Heartsteel", "Defense"), item("Mercury's Treads", "Boots"), item("Sunfire Aegis", "Defense"), item("Abyssal Mask", "Utility"), item("Frozen Heart", "Defense"), item("Kaenic Rookern", "Defense")],
        explanation: "The narrow lane makes every hook threat valuable while tank items turn Nautilus into a durable engage wall.",
        brokenScore: 80
      },
      augments: ["courage-of-the-colossus", "goliath", "raid-boss"],
      itemSynergies: ["Sunfire Aegis ticks during repeated root chains.", "Knight's Vow protects the carry Nautilus creates picks for."]
    },
    guide: {
      strengths: ["Reliable target access", "Excellent lockdown chain", "Strong with many damage profiles"],
      weaknesses: ["Hook misses can lose tempo", "Limited damage alone", "Can drag himself into bad fights"],
      tips: ["Use passive root on a second target after hooking the first.", "R the carry behind the frontliner to disrupt the whole formation.", "Threaten hook angles from brush and wall corners."],
      playstyle: "Nautilus turns positioning errors into forced fights. Keep hook pressure high, then layer passive, ultimate, and slows so allies can unload."
    }
  },
  {
    id: 14,
    name: "Katarina",
    slug: "katarina",
    role: "Assassin",
    tier: "B",
    difficulty: "Expert",
    arenaStats: {
      winRate: 50.6,
      pickRate: 8.9,
      banRate: 7.8,
      bestBuild: {
        name: "Dagger Reset",
        itemOrder: [item("Sorcerer's Shoes", "Boots"), item("Nashor's Tooth"), item("Riftmaker")],
        fullBuild: [item("Nashor's Tooth"), item("Sorcerer's Shoes", "Boots"), item("Riftmaker"), item("Rabadon's Deathcap"), item("Zhonya's Hourglass", "Defense"), item("Void Staff")],
        explanation: "Katarina needs patient dagger setup and resets; she is deadly once crowd control is spent."
      },
      brokenBuild: {
        name: "Earthwake Blender",
        itemOrder: [item("Nashor's Tooth"), item("Riftmaker"), item("Zhonya's Hourglass", "Defense")],
        fullBuild: [item("Nashor's Tooth"), item("Sorcerer's Shoes", "Boots"), item("Riftmaker"), item("Zhonya's Hourglass", "Defense"), item("Rabadon's Deathcap"), item("Void Staff")],
        explanation: "Earthwake adds delayed explosions to Shunpo chains, making dagger resets punish stacked teams brutally.",
        brokenScore: 85
      },
      augments: ["earthwake", "dont-blink", "jeweled-gauntlet"],
      itemSynergies: ["Zhonya's protects after a reset entry.", "Nashor's Tooth improves dagger and passive threat."]
    },
    aramMayhemStats: {
      winRate: 49.7,
      pickRate: 10.3,
      bestBuild: {
        name: "Reset Sweep",
        itemOrder: [item("Nashor's Tooth"), item("Sorcerer's Shoes", "Boots"), item("Riftmaker")],
        fullBuild: [item("Nashor's Tooth"), item("Sorcerer's Shoes", "Boots"), item("Riftmaker"), item("Zhonya's Hourglass", "Defense"), item("Rabadon's Deathcap"), item("Void Staff")],
        explanation: "Katarina waits for bridge fights to fragment, then enters after major stuns are unavailable."
      },
      brokenBuild: {
        name: "Cleanup Protocol",
        itemOrder: [item("Nashor's Tooth"), item("Hextech Rocketbelt"), item("Zhonya's Hourglass", "Defense")],
        fullBuild: [item("Nashor's Tooth"), item("Sorcerer's Shoes", "Boots"), item("Hextech Rocketbelt"), item("Zhonya's Hourglass", "Defense"), item("Rabadon's Deathcap"), item("Void Staff")],
        explanation: "Extra dash access helps Katarina reach low-health targets and start reset chains from wider angles.",
        brokenScore: 78
      },
      augments: ["earthwake", "dont-blink", "jeweled-gauntlet"],
      itemSynergies: ["Rocketbelt opens dagger access through minion clutter.", "Rabadon's rewards successful reset chains."]
    },
    guide: {
      strengths: ["Explosive reset potential", "High mobility", "Punishes low-health clustered teams"],
      weaknesses: ["Very crowd-control sensitive", "Weak from behind", "Requires dagger setup discipline"],
      tips: ["Enter after stuns and knockups are used.", "Use daggers as threat zones before committing Shunpo.", "Cancel losing ultimates quickly and reposition for resets."],
      playstyle: "Katarina should hover outside the first collision. Once health bars drop and control spells are gone, she turns the fight into a reset cascade."
    }
  },
  {
    id: 15,
    name: "Samira",
    slug: "samira",
    role: "Marksman",
    tier: "A",
    difficulty: "Hard",
    arenaStats: {
      winRate: 53.1,
      pickRate: 12.5,
      banRate: 10.2,
      bestBuild: {
        name: "Inferno Trigger",
        itemOrder: [item("Berserker's Greaves", "Boots"), item("The Collector"), item("Infinity Edge")],
        fullBuild: [item("The Collector"), item("Berserker's Greaves", "Boots"), item("Infinity Edge"), item("Immortal Shieldbow", "Defense"), item("Lord Dominik's Regards"), item("Bloodthirster", "Defense")],
        explanation: "Samira needs a support or engage partner to start the chain, then uses style stacks to end rounds quickly."
      },
      brokenBuild: {
        name: "Style Rank Detonation",
        itemOrder: [item("The Collector"), item("Infinity Edge"), item("Immortal Shieldbow", "Defense")],
        fullBuild: [item("The Collector"), item("Berserker's Greaves", "Boots"), item("Infinity Edge"), item("Immortal Shieldbow", "Defense"), item("Lord Dominik's Regards"), item("Bloodthirster", "Defense")],
        explanation: "Earthwake and Don't Blink create high-speed all-ins where Samira can reach S rank before opponents stabilize.",
        brokenScore: 88
      },
      augments: ["earthwake", "dont-blink", "scopier-weapons"],
      itemSynergies: ["Immortal Shieldbow protects the first ultimate.", "The Collector converts low targets into reset momentum."]
    },
    aramMayhemStats: {
      winRate: 51.5,
      pickRate: 14.6,
      bestBuild: {
        name: "Bridge Flair",
        itemOrder: [item("The Collector"), item("Berserker's Greaves", "Boots"), item("Infinity Edge")],
        fullBuild: [item("The Collector"), item("Berserker's Greaves", "Boots"), item("Infinity Edge"), item("Immortal Shieldbow", "Defense"), item("Lord Dominik's Regards"), item("Bloodthirster", "Defense")],
        explanation: "Samira follows hard engage and uses Blade Whirl to survive the first projectile burst."
      },
      brokenBuild: {
        name: "Pentakill Window",
        itemOrder: [item("The Collector"), item("Immortal Shieldbow", "Defense"), item("Infinity Edge")],
        fullBuild: [item("The Collector"), item("Berserker's Greaves", "Boots"), item("Immortal Shieldbow", "Defense"), item("Infinity Edge"), item("Lord Dominik's Regards"), item("Bloodthirster", "Defense")],
        explanation: "Once one target drops, Samira's reset dash and ultimate can sweep a full bridge fight.",
        brokenScore: 83
      },
      augments: ["earthwake", "dont-blink", "courage-of-the-colossus"],
      itemSynergies: ["Bloodthirster sustains through extended Inferno Trigger casts.", "Lord Dominik's keeps her relevant against tank fronts."]
    },
    guide: {
      strengths: ["Huge cleanup damage", "Projectile denial", "Thrives with engage supports"],
      weaknesses: ["Short range for a marksman", "Needs style setup", "Ultimate can be interrupted"],
      tips: ["Use Blade Whirl to block the spell that stops your ultimate, not random poke.", "Stack style with Q and autos before dashing in.", "Follow allied CC rather than opening fights yourself."],
      playstyle: "Samira is a finisher. Let someone else crack the fight open, then dash through the gap and turn style stacks into a wipe."
    }
  }
];
