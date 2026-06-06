import "server-only";

import { normalizeChaosBuildTags, type ChaosBuildTag } from "@/lib/chaosTags";
import type { Mode } from "@/types";

export type CreateChaosLabBuildInput = {
  championSlug: string;
  mode: Mode;
  title: string;
  description: string;
  itemOrder: string[];
  augments: string[];
  tags: ChaosBuildTag[];
  strengths: string[];
  weaknesses: string[];
  matchupNotes: string[];
};

export class ChaosBuildValidationError extends Error {
  details: string[];

  constructor(details: string[]) {
    super("Chaos Lab build submission is invalid.");
    this.name = "ChaosBuildValidationError";
    this.details = details;
  }
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function cleanLongText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanList(value: unknown, maxItems: number) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(cleanText)
    .filter(Boolean)
    .slice(0, maxItems);
}

function isMode(value: string): value is Mode {
  return value === "arena" || value === "aramMayhem";
}

function validateLength(errors: string[], label: string, value: string, min: number, max: number) {
  if (value.length < min) {
    errors.push(`${label} must be at least ${min} characters.`);
  }

  if (value.length > max) {
    errors.push(`${label} must be ${max} characters or fewer.`);
  }
}

function validateList(errors: string[], label: string, values: string[], min: number, max: number, itemMaxLength: number) {
  if (values.length < min) {
    errors.push(`${label} must include at least ${min} entr${min === 1 ? "y" : "ies"}.`);
  }

  if (values.length > max) {
    errors.push(`${label} can include at most ${max} entries.`);
  }

  values.forEach((value) => {
    if (value.length > itemMaxLength) {
      errors.push(`${label} entries must be ${itemMaxLength} characters or fewer.`);
    }
  });
}

export function parseCreateChaosLabBuildInput(payload: unknown): CreateChaosLabBuildInput {
  const source = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
  const championSlug = cleanText(source.championSlug).toLowerCase();
  const mode = cleanText(source.mode);
  const title = cleanText(source.title);
  const description = cleanLongText(source.description);
  const itemOrder = cleanList(source.itemOrder, 6);
  const augments = cleanList(source.augments, 6).map((augment) => augment.toLowerCase());
  const tags = normalizeChaosBuildTags(source.tags);
  const strengths = cleanList(source.strengths, 8);
  const weaknesses = cleanList(source.weaknesses, 8);
  const matchupNotes = cleanList(source.matchupNotes, 8);
  const errors: string[] = [];

  if (!championSlug) {
    errors.push("Champion is required.");
  }

  if (!isMode(mode)) {
    errors.push("Mode must be Arena or ARAM Mayhem.");
  }

  validateLength(errors, "Build title", title, 4, 80);
  validateLength(errors, "Build description", description, 40, 900);
  validateList(errors, "Item order", itemOrder, 3, 6, 80);
  validateList(errors, "Augments", augments, 1, 6, 80);
  if (Array.isArray(source.tags) && source.tags.length && !tags.length) {
    errors.push("Tags must use supported Chaos Lab tags.");
  }
  validateList(errors, "Strengths", strengths, 1, 8, 180);
  validateList(errors, "Weaknesses", weaknesses, 1, 8, 180);
  validateList(errors, "Matchup notes", matchupNotes, 1, 8, 220);

  if (errors.length || !isMode(mode)) {
    throw new ChaosBuildValidationError(errors);
  }

  return {
    championSlug,
    mode,
    title,
    description,
    itemOrder,
    augments,
    tags,
    strengths,
    weaknesses,
    matchupNotes
  };
}
