export type DbGameMode = "arena" | "aram_mayhem";
export type DbChampionRole = "marksman" | "mage" | "bruiser" | "tank" | "enchanter" | "assassin";
export type DbChampionDifficulty = "easy" | "medium" | "hard" | "expert";
export type DbTierRank = "S+" | "S" | "A" | "B" | "C";
export type DbBuildKind = "best" | "broken" | "standard" | "experimental";
export type DbItemCategory = "starter" | "core" | "damage" | "defense" | "utility" | "boots";
export type DbPatchStatus = "pending" | "active" | "archived";
export type DbIngestionJobStatus = "queued" | "running" | "succeeded" | "retryable_failed" | "rate_limited" | "permanently_failed";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type DbPatch = {
  id: string;
  version: string;
  dataDragonVersion: string | null;
  status: DbPatchStatus;
  releasedAt: string | null;
  ingestedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DbChampion = {
  id: string;
  riotChampionId: string;
  riotKey: number | null;
  name: string;
  slug: string;
  title: string | null;
  role: DbChampionRole;
  secondaryRoles: DbChampionRole[];
  difficulty: DbChampionDifficulty;
  iconPath: string | null;
  splashPath: string | null;
  rawData: JsonValue;
  createdAt: string;
  updatedAt: string;
};

export type DbItem = {
  id: string;
  riotItemId: number;
  name: string;
  slug: string;
  category: DbItemCategory;
  iconPath: string | null;
  rawData: JsonValue;
  createdAt: string;
  updatedAt: string;
};

export type DbAugment = {
  id: string;
  riotAugmentId: string | null;
  name: string;
  slug: string;
  description: string;
  iconPath: string | null;
  rawData: JsonValue;
  createdAt: string;
  updatedAt: string;
};

export type DbBuild = {
  id: string;
  patchId: string;
  championId: string;
  mode: DbGameMode;
  kind: DbBuildKind;
  name: string;
  explanation: string;
  brokenScore: number | null;
  winRate: number | null;
  pickRate: number | null;
  sampleSize: number;
  source: string;
  rawData: JsonValue;
  createdAt: string;
  updatedAt: string;
};

export type DbBuildItem = {
  buildId: string;
  itemId: string;
  position: number;
  isCore: boolean;
  createdAt: string;
};

export type DbBuildAugment = {
  buildId: string;
  augmentId: string;
  position: number;
  createdAt: string;
};

export type DbArenaChampionStatistic = {
  id: string;
  patchId: string;
  championId: string;
  tier: DbTierRank;
  winRate: number;
  pickRate: number;
  banRate: number | null;
  averagePlacement: number | null;
  brokenScore: number | null;
  gamesPlayed: number;
  bestBuildId: string | null;
  brokenBuildId: string | null;
  rawData: JsonValue;
  createdAt: string;
  updatedAt: string;
};

export type DbAramMayhemChampionStatistic = {
  id: string;
  patchId: string;
  championId: string;
  tier: DbTierRank;
  winRate: number;
  pickRate: number;
  brokenScore: number | null;
  gamesPlayed: number;
  bestBuildId: string | null;
  brokenBuildId: string | null;
  rawData: JsonValue;
  createdAt: string;
  updatedAt: string;
};

export type DbAugmentStatistic = {
  id: string;
  patchId: string;
  augmentId: string;
  mode: DbGameMode;
  averageWinRate: number;
  pickRate: number;
  gamesPlayed: number;
  rawData: JsonValue;
  createdAt: string;
  updatedAt: string;
};

export type DbAugmentBestChampion = {
  augmentStatisticId: string;
  championId: string;
  rank: number;
  winRate: number | null;
  pickRate: number | null;
};

export type DbTierList = {
  id: string;
  patchId: string;
  mode: DbGameMode;
  name: string;
  description: string | null;
  source: string;
  createdAt: string;
  updatedAt: string;
};

export type DbTierListEntry = {
  tierListId: string;
  championId: string;
  tier: DbTierRank;
  rank: number;
  winRate: number | null;
  pickRate: number | null;
  notes: string | null;
  createdAt: string;
};

export type DbChampionGuide = {
  id: string;
  patchId: string;
  championId: string;
  mode: DbGameMode | null;
  playstyle: string;
  strengths: string[];
  weaknesses: string[];
  tips: string[];
  rawData: JsonValue;
  createdAt: string;
  updatedAt: string;
};

export type DbIngestionRun = {
  id: string;
  patchId: string | null;
  source: string;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  recordsProcessed: number;
  errorMessage: string | null;
  metadata: JsonValue;
};

export type DbRiotMatch = {
  id: string;
  riotMatchId: string;
  patchId: string | null;
  regionalRouting: string;
  platformId: string;
  queueId: number;
  mode: DbGameMode | null;
  gameVersion: string;
  gameStartedAt: string;
  gameEndedAt: string | null;
  gameDurationSeconds: number;
  participantPuuidHashes: string[];
  rawData: JsonValue;
  ingestedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type DbRiotMatchParticipant = {
  id: string;
  matchId: string;
  riotMatchId: string;
  puuidHash: string;
  participantId: number;
  teamId: number;
  riotChampionId: number;
  championName: string;
  won: boolean;
  placement: number | null;
  itemIds: number[];
  augmentIds: number[];
  kills: number;
  deaths: number;
  assists: number;
  championLevel: number;
  goldEarned: number;
  totalDamageDealtToChampions: number;
  totalDamageTaken: number;
  rawData: JsonValue;
  createdAt: string;
  updatedAt: string;
};

export type DbIngestionJob = {
  id: string;
  jobId: string;
  jobType: string;
  source: string;
  status: DbIngestionJobStatus;
  patchId: string | null;
  riotMatchId: string | null;
  queueId: number | null;
  attemptCount: number;
  lockedAt: string | null;
  nextAttemptAt: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  errorMessage: string | null;
  metadata: JsonValue;
  createdAt: string;
  updatedAt: string;
};

export type DbChampionWithModeStats = DbChampion & {
  arenaStats?: DbArenaChampionStatistic;
  aramMayhemStats?: DbAramMayhemChampionStatistic;
};

export type DbBuildWithRelations = DbBuild & {
  champion: DbChampion;
  patch: DbPatch;
  items: Array<DbBuildItem & { item: DbItem }>;
  augments: Array<DbBuildAugment & { augment: DbAugment }>;
};

export type NewDbPatch = Omit<DbPatch, "id" | "createdAt" | "updatedAt">;
export type NewDbChampion = Omit<DbChampion, "id" | "createdAt" | "updatedAt">;
export type NewDbItem = Omit<DbItem, "id" | "createdAt" | "updatedAt">;
export type NewDbAugment = Omit<DbAugment, "id" | "createdAt" | "updatedAt">;
export type NewDbBuild = Omit<DbBuild, "id" | "createdAt" | "updatedAt">;
export type NewDbBuildItem = Omit<DbBuildItem, "createdAt"> & {
  createdAt?: string;
};
export type NewDbBuildAugment = Omit<DbBuildAugment, "createdAt"> & {
  createdAt?: string;
};
export type NewDbArenaChampionStatistic = Omit<DbArenaChampionStatistic, "id" | "createdAt" | "updatedAt">;
export type NewDbAramMayhemChampionStatistic = Omit<DbAramMayhemChampionStatistic, "id" | "createdAt" | "updatedAt">;
export type NewDbAugmentStatistic = Omit<DbAugmentStatistic, "id" | "createdAt" | "updatedAt">;
export type NewDbTierList = Omit<DbTierList, "id" | "createdAt" | "updatedAt">;
export type NewDbChampionGuide = Omit<DbChampionGuide, "id" | "createdAt" | "updatedAt">;
export type NewDbIngestionRun = Omit<DbIngestionRun, "id" | "startedAt" | "finishedAt" | "recordsProcessed" | "errorMessage" | "metadata"> & {
  id?: string;
  startedAt?: string;
  finishedAt?: string | null;
  recordsProcessed?: number;
  errorMessage?: string | null;
  metadata?: JsonValue;
};
export type NewDbRiotMatch = Omit<DbRiotMatch, "id" | "createdAt" | "updatedAt" | "ingestedAt">;
export type NewDbRiotMatchParticipant = Omit<DbRiotMatchParticipant, "id" | "createdAt" | "updatedAt">;
export type NewDbIngestionJob = Omit<
  DbIngestionJob,
  | "id"
  | "createdAt"
  | "updatedAt"
  | "patchId"
  | "riotMatchId"
  | "queueId"
  | "attemptCount"
  | "lockedAt"
  | "nextAttemptAt"
  | "startedAt"
  | "finishedAt"
  | "errorMessage"
  | "metadata"
> & {
  patchId?: string | null;
  riotMatchId?: string | null;
  queueId?: number | null;
  attemptCount?: number;
  lockedAt?: string | null;
  nextAttemptAt?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  errorMessage?: string | null;
  metadata?: JsonValue;
};
