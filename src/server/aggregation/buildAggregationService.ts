import "server-only";

import { toDatabaseError } from "@/lib/supabase/errors";
import { createLogger, type Logger } from "@/server/logging/logger";
import {
  type AggregatedChampionBuild,
  type BuildAggregationJob,
  type BuildAggregationMode,
  type BuildAggregationResult
} from "@/server/aggregation/buildAggregationModels";
import {
  BuildAggregationRepository,
  createBuildAggregationRepository
} from "@/server/aggregation/buildAggregationRepository";
import {
  createIngestionJobsRepository,
  type IngestionJobsRepository
} from "@/server/ingestion/persistence/ingestionJobsRepository";
import {
  createIngestionRunsRepository,
  type IngestionRunsRepository
} from "@/server/ingestion/persistence/ingestionRunsRepository";
import { toJsonValue } from "@/server/ingestion/persistence/json";
import type { DbChampion, DbItem, DbRiotMatchParticipant } from "@/types/database";

type BuildCounter = {
  champion: DbChampion;
  itemSetKey: string;
  gamesPlayed: number;
  wins: number;
  placements: number[];
  orderCounts: Map<string, number>;
};

export type BuildAggregationServiceOptions = {
  buildAggregationRepository?: BuildAggregationRepository;
  ingestionRunsRepository?: IngestionRunsRepository;
  ingestionJobsRepository?: IngestionJobsRepository;
  logger?: Logger;
};

function roundRate(value: number) {
  return Number(value.toFixed(2));
}

function average(values: number[]) {
  if (!values.length) return null;
  return roundRate(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function getStableItemOrder(itemIds: number[], knownItemsByRiotId: Map<number, DbItem>) {
  const deduped = Array.from(new Set(itemIds.filter((itemId) => knownItemsByRiotId.has(itemId))));
  return deduped.slice(0, 6);
}

function getItemSetKey(itemIds: number[]) {
  return [...itemIds].sort((a, b) => a - b).join("-");
}

function parseOrderKey(orderKey: string) {
  return orderKey
    .split(">")
    .map((value) => Number.parseInt(value, 10))
    .filter((value) => Number.isFinite(value) && value > 0);
}

function getMostCommonOrder(orderCounts: Map<string, number>) {
  return [...orderCounts.entries()]
    .sort((a, b) => {
      const countDelta = b[1] - a[1];
      return countDelta !== 0 ? countDelta : a[0].localeCompare(b[0]);
    })
    .map(([orderKey, gamesPlayed]) => ({
      itemRiotIds: parseOrderKey(orderKey),
      gamesPlayed
    }));
}

function createBuildName(itemRiotIds: number[], itemsByRiotId: Map<number, DbItem>) {
  const names = itemRiotIds
    .slice(0, 3)
    .map((itemId) => itemsByRiotId.get(itemId)?.name ?? `Item ${itemId}`);

  return names.length ? `Riot Core: ${names.join(" / ")}` : "Riot Aggregated Core";
}

function createBuildExplanation(build: Pick<AggregatedChampionBuild, "gamesPlayed" | "winRate" | "averagePlacement" | "mode">) {
  const placementText = build.averagePlacement === null ? "placement data unavailable" : `average placement ${build.averagePlacement}`;
  const modeLabel = build.mode === "arena" ? "Arena" : "ARAM Mayhem";

  return `Aggregated from ${build.gamesPlayed} persisted ${modeLabel} participant records with ${build.winRate.toFixed(1)}% win rate and ${placementText}.`;
}

function buildStrengthScore(build: Pick<AggregatedChampionBuild, "winRate" | "gamesPlayed" | "averagePlacement">) {
  const confidence = Math.min(build.gamesPlayed / 50, 1) * 10;
  const placementBoost = build.averagePlacement === null ? 0 : Math.max(0, 5 - build.averagePlacement) * 2;
  return build.winRate + confidence + placementBoost;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function readPositiveNumber(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "number" && value > 0 ? value : null;
}

function getRawParticipantItemIds(participant: DbRiotMatchParticipant) {
  const rawData = isRecord(participant.rawData) ? participant.rawData : {};

  return [
    readPositiveNumber(rawData, "item0"),
    readPositiveNumber(rawData, "item1"),
    readPositiveNumber(rawData, "item2"),
    readPositiveNumber(rawData, "item3"),
    readPositiveNumber(rawData, "item4"),
    readPositiveNumber(rawData, "item5"),
    readPositiveNumber(rawData, "item6")
  ].filter((itemId): itemId is number => typeof itemId === "number");
}

function getParticipantItemIds(participant: DbRiotMatchParticipant) {
  return [...new Set([...participant.itemIds, ...getRawParticipantItemIds(participant)])];
}

export class BuildAggregationService {
  private buildAggregationRepository: BuildAggregationRepository;
  private ingestionRunsRepository: IngestionRunsRepository;
  private ingestionJobsRepository: IngestionJobsRepository;
  private logger: Logger;

  constructor(options: BuildAggregationServiceOptions = {}) {
    this.buildAggregationRepository = options.buildAggregationRepository ?? createBuildAggregationRepository();
    this.ingestionRunsRepository = options.ingestionRunsRepository ?? createIngestionRunsRepository();
    this.ingestionJobsRepository = options.ingestionJobsRepository ?? createIngestionJobsRepository();
    this.logger = options.logger ?? createLogger({ component: "build-aggregation" });
  }

  async aggregateJob(job: BuildAggregationJob): Promise<BuildAggregationResult> {
    await this.ingestionJobsRepository.upsertJob({
      job,
      patchId: job.patchId,
      status: "queued",
      metadata: toJsonValue(job)
    });
    await this.ingestionJobsRepository.markRunning(job.jobId);

    const run = await this.ingestionRunsRepository.startRun({
      patchId: job.patchId,
      source: `build-aggregation:${job.mode}`,
      metadata: toJsonValue({ jobId: job.jobId, mode: job.mode })
    });

    try {
      const result = await this.aggregatePatchMode(job.patchId, job.mode, {
        jobId: job.jobId,
        maxBuildsPerChampion: job.maxBuildsPerChampion,
        championId: job.championId
      });

      await this.ingestionRunsRepository.completeRun({
        runId: run.id,
        recordsProcessed: result.participantsProcessed,
        metadata: toJsonValue({
          jobId: job.jobId,
          mode: job.mode,
          championId: job.championId,
          matchesProcessed: result.matchesProcessed,
          buildsPersisted: result.buildsPersisted
        })
      });
      await this.ingestionJobsRepository.markSucceeded(
        job.jobId,
        toJsonValue({
          matchesProcessed: result.matchesProcessed,
          participantsProcessed: result.participantsProcessed,
          buildsAggregated: result.buildsAggregated,
          buildsPersisted: result.buildsPersisted,
          championId: job.championId
        })
      );

      return result;
    } catch (error) {
      const databaseError = toDatabaseError(error, "Build aggregation failed");

      this.logger.error("Build aggregation job failed.", {
        error: databaseError.message,
        jobId: job.jobId,
        patchId: job.patchId,
        mode: job.mode,
        championId: job.championId
      });

      await this.ingestionRunsRepository.failRun({
        runId: run.id,
        error: databaseError,
        metadata: toJsonValue({ jobId: job.jobId, mode: job.mode, championId: job.championId })
      });
      await this.ingestionJobsRepository.markFailed({
        jobId: job.jobId,
        status: "retryable_failed",
        error: databaseError
      });

      throw databaseError;
    }
  }

  async aggregatePatchMode(
    patchId: string,
    mode: BuildAggregationMode,
    options: { jobId?: string; maxBuildsPerChampion?: number; championId?: string } = {}
  ): Promise<BuildAggregationResult> {
    this.logger.info("Starting build aggregation.", {
      jobId: options.jobId,
      patchId,
      mode,
      championId: options.championId
    });

    const [champions, matches] = await Promise.all([
      this.buildAggregationRepository.getChampions(),
      this.buildAggregationRepository.getMatchesForPatchAndMode(patchId, mode)
    ]);
    const participants = await this.buildAggregationRepository.getParticipantsForMatches(matches.map((match) => match.id));
    const observedItemIds = participants.flatMap(getParticipantItemIds);
    const items = await this.buildAggregationRepository.ensureItemsForRiotIds(observedItemIds);
    const itemsByRiotId = new Map(items.map((item) => [item.riotItemId, item]));

    this.logger.info("Loaded build aggregation inputs.", {
      jobId: options.jobId,
      patchId,
      mode,
      championsLoaded: champions.length,
      championsWithRiotKey: champions.filter((champion) => champion.riotKey !== null).length,
      itemsLoaded: items.length,
      observedItemIdCount: new Set(observedItemIds).size,
      participantsWithMappedItemIds: participants.filter((participant) => participant.itemIds.length > 0).length,
      participantsWithRawItemIds: participants.filter((participant) => getRawParticipantItemIds(participant).length > 0).length,
      matchesProcessed: matches.length,
      participantsProcessed: participants.length
    });

    const builds = this.aggregateBuilds({
      patchId,
      mode,
      champions,
      participants,
      itemsByRiotId,
      maxBuildsPerChampion: options.maxBuildsPerChampion ?? 5,
      championId: options.championId
    });
    const persistence = await this.buildAggregationRepository.persistBuilds(builds, itemsByRiotId);

    const result = {
      jobId: options.jobId,
      patchId,
      mode,
      matchesProcessed: matches.length,
      participantsProcessed: participants.length,
      buildsAggregated: builds.length,
      buildsPersisted: persistence.buildsPersisted,
      builds
    } satisfies BuildAggregationResult;

    this.logger.info("Completed build aggregation.", {
      jobId: options.jobId,
      patchId,
      mode,
      matchesProcessed: result.matchesProcessed,
      participantsProcessed: result.participantsProcessed,
      buildsAggregated: result.buildsAggregated,
      buildsPersisted: result.buildsPersisted,
      championId: options.championId
    });

    return result;
  }

  private aggregateBuilds({
    patchId,
    mode,
    champions,
    participants,
    itemsByRiotId,
    maxBuildsPerChampion,
    championId
  }: {
    patchId: string;
    mode: BuildAggregationMode;
    champions: DbChampion[];
    participants: DbRiotMatchParticipant[];
    itemsByRiotId: Map<number, DbItem>;
    maxBuildsPerChampion: number;
    championId?: string;
  }): AggregatedChampionBuild[] {
    const championsByRiotId = new Map(
      champions
        .filter((champion) => champion.riotKey !== null)
        .filter((champion) => (championId ? champion.id === championId : true))
        .map((champion) => [champion.riotKey as number, champion])
    );
    const championGameTotals = new Map<string, number>();
    const buildCounters = new Map<string, BuildCounter>();
    const skipReasons = {
      missingChampion: 0,
      noItemIdsAvailable: 0,
      missingItemsCatalog: 0,
      insufficientKnownItems: 0
    };

    participants.forEach((participant) => {
      const champion = championsByRiotId.get(participant.riotChampionId);
      const participantItemIds = getParticipantItemIds(participant);
      const itemOrder = getStableItemOrder(participantItemIds, itemsByRiotId);

      if (!champion) {
        skipReasons.missingChampion += 1;
        return;
      }

      if (!participantItemIds.length) {
        skipReasons.noItemIdsAvailable += 1;
        return;
      }

      if (!itemOrder.length) {
        skipReasons.missingItemsCatalog += 1;
        return;
      }

      if (itemOrder.length < 2) {
        skipReasons.insufficientKnownItems += 1;
        return;
      }

      const itemSetKey = getItemSetKey(itemOrder);
      const counterKey = `${champion.id}:${itemSetKey}`;
      const orderKey = itemOrder.join(">");

      championGameTotals.set(champion.id, (championGameTotals.get(champion.id) ?? 0) + 1);

      const counter = buildCounters.get(counterKey) ?? {
        champion,
        itemSetKey,
        gamesPlayed: 0,
        wins: 0,
        placements: [],
        orderCounts: new Map<string, number>()
      };

      counter.gamesPlayed += 1;
      counter.wins += participant.won ? 1 : 0;
      counter.orderCounts.set(orderKey, (counter.orderCounts.get(orderKey) ?? 0) + 1);

      if (participant.placement !== null) {
        counter.placements.push(participant.placement);
      }

      buildCounters.set(counterKey, counter);
    });

    this.logger.info("Build aggregation participant skip summary.", {
      mode,
      participantsProcessed: participants.length,
      participantsWithAnyItemIds: participants.filter((participant) => getParticipantItemIds(participant).length > 0).length,
      knownItemsLoaded: itemsByRiotId.size,
      buildCountersCreated: buildCounters.size,
      skipMissingChampion: skipReasons.missingChampion,
      skipNoItemIdsAvailable: skipReasons.noItemIdsAvailable,
      skipMissingItemsCatalog: skipReasons.missingItemsCatalog,
      skipInsufficientKnownItems: skipReasons.insufficientKnownItems
    });

    const buildsByChampion = new Map<string, AggregatedChampionBuild[]>();

    [...buildCounters.values()].forEach((counter) => {
      const observedOrders = getMostCommonOrder(counter.orderCounts);
      const mostCommonOrder = observedOrders[0]?.itemRiotIds ?? [];
      const winRate = roundRate((counter.wins / counter.gamesPlayed) * 100);
      const championGames = championGameTotals.get(counter.champion.id) ?? counter.gamesPlayed;
      const pickRate = championGames ? roundRate((counter.gamesPlayed / championGames) * 100) : 0;
      const modePickRate = participants.length ? roundRate((counter.gamesPlayed / participants.length) * 100) : 0;
      const averagePlacement = average(counter.placements);
      const baseBuild = {
        patchId,
        championId: counter.champion.id,
        riotChampionId: counter.champion.riotKey ?? 0,
        mode,
        kind: "standard",
        name: createBuildName(mostCommonOrder, itemsByRiotId),
        explanation: "",
        itemRiotIds: mostCommonOrder,
        itemSetKey: counter.itemSetKey,
        gamesPlayed: counter.gamesPlayed,
        wins: counter.wins,
        winRate,
        pickRate,
        modePickRate,
        averagePlacement,
        observedOrders
      } satisfies AggregatedChampionBuild;
      const build = {
        ...baseBuild,
        explanation: createBuildExplanation(baseBuild)
      };
      const championBuilds = buildsByChampion.get(counter.champion.id) ?? [];

      championBuilds.push(build);
      buildsByChampion.set(counter.champion.id, championBuilds);
    });

    return [...buildsByChampion.values()].flatMap((championBuilds) =>
      championBuilds
        .sort((a, b) => {
          const strengthDelta = buildStrengthScore(b) - buildStrengthScore(a);
          return strengthDelta !== 0 ? strengthDelta : b.gamesPlayed - a.gamesPlayed;
        })
        .slice(0, maxBuildsPerChampion)
        .map((build, index) => ({
          ...build,
          kind: index === 0 ? "best" : "standard"
        }))
    );
  }
}

export function createBuildAggregationService(options?: BuildAggregationServiceOptions) {
  return new BuildAggregationService(options);
}
