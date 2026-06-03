import type { Champion, Item } from "@/types";

const DATA_DRAGON_BASE_URL = "https://ddragon.leagueoflegends.com";

export const DATA_DRAGON_VERSION =
  process.env.NEXT_PUBLIC_DDRAGON_VERSION ?? "16.11.1";

type ChampionAssetSource = Pick<Champion, "name" | "slug"> | string;
type ItemAssetSource = Pick<Item, "name" | "riotId"> | string;

const championAssetIds: Record<string, string> = {
  aurelionsol: "AurelionSol",
  belveth: "Belveth",
  chogath: "Chogath",
  drmundo: "DrMundo",
  jarvaniv: "JarvanIV",
  kaisa: "Kaisa",
  khazix: "Khazix",
  kogmaw: "KogMaw",
  ksante: "KSante",
  leesin: "LeeSin",
  masteryi: "MasterYi",
  missfortune: "MissFortune",
  monkeyking: "MonkeyKing",
  nunu: "Nunu",
  reksai: "RekSai",
  renataglasc: "Renata",
  tahmkench: "TahmKench",
  twistedfate: "TwistedFate",
  velkoz: "Velkoz",
  xinzhao: "XinZhao"
};

const itemAssetIds: Record<string, number> = {
  "abyssal mask": 3001,
  "ardent censer": 3504,
  "banshee's veil": 3102,
  "berserker's greaves": 3006,
  "blackfire torch": 2503,
  bloodthirster: 3072,
  "cosmic drive": 4629,
  cryptbloom: 3137,
  "dead man's plate": 3742,
  "essence reaver": 3508,
  "frozen heart": 3110,
  "guardian angel": 3026,
  heartsteel: 3084,
  "hextech rocketbelt": 3152,
  "horizon focus": 4628,
  "immortal shieldbow": 6673,
  "infinity edge": 3031,
  "ionian boots of lucidity": 3158,
  "jak'sho, the protean": 6665,
  "kaenic rookern": 2504,
  "knight's vow": 3109,
  "kraken slayer": 6672,
  "liandry's torment": 6653,
  "locket of the iron solari": 3190,
  "lord dominik's regards": 3036,
  "luden's companion": 6655,
  malignance: 3118,
  manamune: 3004,
  "maw of malmortius": 3156,
  "mercurial scimitar": 3139,
  "mercury's treads": 3111,
  "mikael's blessing": 3222,
  "moonstone renewer": 6617,
  "mortal reminder": 3033,
  "nashor's tooth": 3115,
  "overlord's bloodmail": 6667,
  "plated steelcaps": 3047,
  "rabadon's deathcap": 3089,
  "rapid firecannon": 3094,
  redemption: 3107,
  riftmaker: 4633,
  "runaan's hurricane": 3085,
  "rylai's crystal scepter": 3116,
  "serylda's grudge": 6694,
  shadowflame: 4645,
  "shurelya's battlesong": 2065,
  "sorcerer's shoes": 3020,
  "spear of shojin": 3161,
  "spirit visage": 3065,
  "staff of flowing water": 6616,
  "statikk shiv": 3087,
  "sterak's gage": 3053,
  stridebreaker: 6631,
  "sundered sky": 6610,
  "sunfire aegis": 3068,
  "the collector": 6676,
  "trinity force": 3078,
  "unending despair": 2502,
  "void staff": 3135,
  "zeke's convergence": 3050,
  "zhonya's hourglass": 3157
};

function normalizeAssetKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function normalizeItemKey(value: string) {
  return value.toLowerCase().trim();
}

function toChampionSourceName(source: ChampionAssetSource) {
  return typeof source === "string" ? source : source.slug || source.name;
}

function toChampionDisplayName(source: ChampionAssetSource) {
  return typeof source === "string" ? source : source.name;
}

function toPascalCaseAssetId(value: string) {
  return value
    .split(/[^a-z0-9]+/i)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("");
}

export function getChampionAssetId(source: ChampionAssetSource) {
  const sourceName = toChampionSourceName(source);
  const displayName = toChampionDisplayName(source);
  const normalizedSource = normalizeAssetKey(sourceName);
  const normalizedDisplay = normalizeAssetKey(displayName);

  return (
    championAssetIds[normalizedSource] ??
    championAssetIds[normalizedDisplay] ??
    toPascalCaseAssetId(displayName)
  );
}

export function getChampionIconUrl(source: ChampionAssetSource) {
  return `${DATA_DRAGON_BASE_URL}/cdn/${DATA_DRAGON_VERSION}/img/champion/${getChampionAssetId(source)}.png`;
}

export function getChampionSplashUrl(source: ChampionAssetSource, skinNumber = 0) {
  return `${DATA_DRAGON_BASE_URL}/cdn/img/champion/splash/${getChampionAssetId(source)}_${skinNumber}.jpg`;
}

export function getItemAssetId(source: ItemAssetSource) {
  if (typeof source !== "string" && source.riotId) {
    return source.riotId;
  }

  const itemName = typeof source === "string" ? source : source.name;
  return itemAssetIds[normalizeItemKey(itemName)] ?? null;
}

export function getItemIconUrl(source: ItemAssetSource) {
  const itemId = getItemAssetId(source);
  return itemId
    ? `${DATA_DRAGON_BASE_URL}/cdn/${DATA_DRAGON_VERSION}/img/item/${itemId}.png`
    : null;
}
