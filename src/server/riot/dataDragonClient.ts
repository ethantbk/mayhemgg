import "server-only";

import { getRiotConfig, type RiotConfig } from "@/server/riot/config";
import type { DataDragonChampionSummaryResponse } from "@/server/riot/types";

export class DataDragonClient {
  private config: RiotConfig;

  constructor(config: RiotConfig = getRiotConfig()) {
    this.config = config;
  }

  async getVersions(): Promise<string[]> {
    const response = await fetch(`${this.config.dataDragonBaseUrl}/api/versions.json`, {
      next: {
        revalidate: 60 * 60
      }
    });

    if (!response.ok) {
      throw new Error(`Data Dragon versions request failed with status ${response.status}.`);
    }

    return (await response.json()) as string[];
  }

  async getChampionSummary(version: string): Promise<DataDragonChampionSummaryResponse> {
    const response = await fetch(`${this.config.dataDragonBaseUrl}/cdn/${version}/data/en_US/champion.json`, {
      next: {
        revalidate: 60 * 60
      }
    });

    if (!response.ok) {
      throw new Error(`Data Dragon champion request failed with status ${response.status}.`);
    }

    return (await response.json()) as DataDragonChampionSummaryResponse;
  }
}

export function createDataDragonClient(config?: RiotConfig) {
  return new DataDragonClient(config);
}
