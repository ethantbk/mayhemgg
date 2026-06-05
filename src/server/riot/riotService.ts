import "server-only";

import { getRiotConfig, isRiotConfigAvailable } from "@/server/riot/config";
import { createDataDragonClient } from "@/server/riot/dataDragonClient";
import { createRiotClient } from "@/server/riot/riotClient";
import type { RiotConnectivityResult, RiotPlatformDataResponse } from "@/server/riot/types";

export function isRiotServiceConfigured() {
  return isRiotConfigAvailable();
}

export async function getPlatformStatus() {
  const config = getRiotConfig();
  const riotClient = createRiotClient(config);

  return riotClient.request<RiotPlatformDataResponse>({
    path: "/lol/status/v4/platform-data",
    routeKey: "lol-status-v4-platform-data",
    platformRouting: config.defaultPlatformRouting
  });
}

export async function verifyRiotConnectivity(): Promise<RiotConnectivityResult> {
  const config = getRiotConfig();
  const dataDragonClient = createDataDragonClient(config);
  const [platformData, versions] = await Promise.all([
    getPlatformStatus(),
    dataDragonClient.getVersions()
  ]);

  return {
    ok: true,
    platformRouting: config.defaultPlatformRouting,
    regionalRouting: config.defaultRegionalRouting,
    platformName: platformData.name,
    platformId: platformData.id,
    dataDragonLatestVersion: versions[0] ?? null,
    checkedAt: new Date().toISOString()
  };
}
