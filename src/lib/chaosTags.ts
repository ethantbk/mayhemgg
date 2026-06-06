import type { ChaosLabBuildCategory, ChaosLabBuildRisk } from "@/types/chaosLab";

export const chaosBuildTags = ["Fun", "Off Meta", "Beginner Friendly", "Experimental"] as const;

export type ChaosBuildTag = (typeof chaosBuildTags)[number];

const chaosBuildTagSlugs: Record<ChaosBuildTag, string> = {
  Fun: "fun",
  "Off Meta": "off-meta",
  "Beginner Friendly": "beginner-friendly",
  Experimental: "experimental"
};

const chaosBuildTagsBySlug = new Map(
  chaosBuildTags.map((tag) => [chaosBuildTagSlugs[tag], tag])
);

export function getChaosBuildTagSlug(tag: ChaosBuildTag) {
  return chaosBuildTagSlugs[tag];
}

export function getChaosBuildTagBySlug(slug?: string | null): ChaosBuildTag | null {
  if (!slug) {
    return null;
  }

  return chaosBuildTagsBySlug.get(slug.toLowerCase()) ?? null;
}

export function normalizeChaosBuildTags(value: unknown): ChaosBuildTag[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const normalized = new Set<ChaosBuildTag>();

  value.forEach((tag) => {
    if (typeof tag !== "string") {
      return;
    }

    const byExactName = chaosBuildTags.find((candidate) => candidate.toLowerCase() === tag.trim().toLowerCase());
    const bySlug = getChaosBuildTagBySlug(tag.trim());
    const supportedTag = byExactName ?? bySlug;

    if (supportedTag) {
      normalized.add(supportedTag);
    }
  });

  return chaosBuildTags.filter((tag) => normalized.has(tag));
}

export function getDefaultChaosBuildTags({
  category,
  risk
}: {
  category: ChaosLabBuildCategory;
  risk: ChaosLabBuildRisk;
}): ChaosBuildTag[] {
  const tags = new Set<ChaosBuildTag>();

  if (category === "Experimental") {
    tags.add("Experimental");
  }

  if (risk === "High" || risk === "Extreme" || category === "Experimental") {
    tags.add("Off Meta");
  }

  if (risk === "Low") {
    tags.add("Beginner Friendly");
  }

  if (!tags.size || category === "Community" || category === "Newest") {
    tags.add("Fun");
  }

  return chaosBuildTags.filter((tag) => tags.has(tag));
}
