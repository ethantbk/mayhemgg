import "server-only";

import {
  getAugmentById as getMockAugmentById,
  getAugments as getMockAugments
} from "@/lib/data";
import type { Augment } from "@/types";
import { mapDbAugments } from "@/server/repositories/mappers";
import { loadPublishedDataset } from "@/server/repositories/publishedDataset";

export async function getAugments(): Promise<Augment[]> {
  const dataset = await loadPublishedDataset();

  if (!dataset?.augments.length) {
    return getMockAugments();
  }

  const augments = mapDbAugments({
    augments: dataset.augments,
    statistics: dataset.augmentStats,
    bestChampions: dataset.augmentBestChampions,
    championsById: new Map(dataset.champions.map((champion) => [champion.id, champion]))
  });

  return augments.length ? augments : getMockAugments();
}

export async function getAugmentById(id: string): Promise<Augment | undefined> {
  const augments = await getAugments();
  return augments.find((augment) => augment.id === id) ?? getMockAugmentById(id);
}
