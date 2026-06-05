export type RiotPlatformRouting =
  | "br1"
  | "eun1"
  | "euw1"
  | "jp1"
  | "kr"
  | "la1"
  | "la2"
  | "na1"
  | "oc1"
  | "tr1"
  | "ru";

export type RiotRegionalRouting = "americas" | "asia" | "europe" | "sea";

export type RiotApiErrorResponse = {
  status?: {
    message?: string;
    status_code?: number;
  };
};

export type RiotServiceStatus = {
  id: number;
  maintenance_status: string;
  incident_severity: string;
  titles: Array<{
    locale: string;
    content: string;
  }>;
  updates: Array<{
    id: number;
    author: string;
    publish: boolean;
    publish_locations: string[];
    translations: Array<{
      locale: string;
      content: string;
    }>;
    created_at: string;
    updated_at: string;
  }>;
  created_at: string;
  archive_at: string;
  updated_at: string;
  platforms: string[];
};

export type RiotPlatformDataResponse = {
  id: string;
  name: string;
  locales: string[];
  maintenances: RiotServiceStatus[];
  incidents: RiotServiceStatus[];
};

export type DataDragonChampionSummaryResponse = {
  type: string;
  format: string;
  version: string;
  data: Record<
    string,
    {
      version: string;
      id: string;
      key: string;
      name: string;
      title: string;
      blurb: string;
      tags: string[];
      partype: string;
      info: Record<string, number>;
      image: {
        full: string;
        sprite: string;
        group: string;
        x: number;
        y: number;
        w: number;
        h: number;
      };
    }
  >;
};

export type RiotRateLimitSnapshot = {
  retryAfterSeconds: number | null;
  appLimit: string | null;
  appCount: string | null;
  methodLimit: string | null;
  methodCount: string | null;
};

export type RiotConnectivityResult = {
  ok: true;
  platformRouting: RiotPlatformRouting;
  regionalRouting: RiotRegionalRouting;
  platformName: string;
  platformId: string;
  dataDragonLatestVersion: string | null;
  checkedAt: string;
};
