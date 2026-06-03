import type { Augment } from "@/types";

type AugmentAssetSource = Pick<Augment, "id" | "name"> | string;

const LOCAL_AUGMENT_ICON_BASE_PATH = "/images/augments";

const augmentIconFiles: Record<string, string> = {
  "bread-and-butter": "bread-and-butter.png",
  "courage-of-the-colossus": "courage-of-the-colossus.png",
  "dont-blink": "dont-blink.png",
  earthwake: "earthwake.png",
  goliath: "goliath.png",
  "jeweled-gauntlet": "jeweled-gauntlet.png",
  "magic-missile": "magic-missile.png",
  marksmage: "marksmage.png",
  "phenomenal-evil": "phenomenal-evil.png",
  "raid-boss": "raid-boss.png",
  "scopier-weapons": "scopier-weapons.png",
  vulnerability: "vulnerability.png"
};

export function getAugmentAssetKey(source: AugmentAssetSource) {
  const value = typeof source === "string" ? source : source.id || source.name;

  return value
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function getAugmentIconPath(source: AugmentAssetSource) {
  const key = getAugmentAssetKey(source);
  const fileName = augmentIconFiles[key] ?? `${key}.png`;

  return `${LOCAL_AUGMENT_ICON_BASE_PATH}/${fileName}`;
}
