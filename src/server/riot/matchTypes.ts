import type { RiotPlatformRouting, RiotRegionalRouting } from "@/server/riot/types";

export type RiotMatchListQuery = {
  puuid: string;
  queue?: number;
  type?: "ranked" | "normal" | "tourney" | "tutorial";
  startTime?: number;
  endTime?: number;
  start?: number;
  count?: number;
  regionalRouting?: RiotRegionalRouting;
};

export type RiotMatchDto = {
  metadata: {
    dataVersion: string;
    matchId: string;
    participants: string[];
  };
  info: RiotMatchInfoDto;
};

export type RiotMatchInfoDto = {
  endOfGameResult?: string;
  gameCreation: number;
  gameDuration: number;
  gameEndTimestamp?: number;
  gameId: number;
  gameMode: string;
  gameName: string;
  gameStartTimestamp: number;
  gameType: string;
  gameVersion: string;
  mapId: number;
  participants: RiotMatchParticipantDto[];
  platformId: RiotPlatformRouting | string;
  queueId: number;
  teams: RiotMatchTeamDto[];
  tournamentCode?: string;
};

export type RiotMatchParticipantDto = {
  assists: number;
  baronKills?: number;
  bountyLevel?: number;
  champExperience: number;
  champLevel: number;
  championId: number;
  championName: string;
  championTransform?: number;
  consumablesPurchased?: number;
  damageDealtToBuildings?: number;
  damageDealtToObjectives?: number;
  damageDealtToTurrets?: number;
  damageSelfMitigated?: number;
  deaths: number;
  detectorWardsPlaced?: number;
  doubleKills?: number;
  dragonKills?: number;
  firstBloodAssist?: boolean;
  firstBloodKill?: boolean;
  gameEndedInEarlySurrender?: boolean;
  gameEndedInSurrender?: boolean;
  goldEarned: number;
  goldSpent: number;
  individualPosition?: string;
  inhibitorKills?: number;
  inhibitorTakedowns?: number;
  inhibitorsLost?: number;
  item0: number;
  item1: number;
  item2: number;
  item3: number;
  item4: number;
  item5: number;
  item6: number;
  itemsPurchased?: number;
  killingSprees?: number;
  kills: number;
  lane?: string;
  largestCriticalStrike?: number;
  largestKillingSpree?: number;
  largestMultiKill?: number;
  longestTimeSpentLiving?: number;
  magicDamageDealt?: number;
  magicDamageDealtToChampions?: number;
  magicDamageTaken?: number;
  neutralMinionsKilled?: number;
  nexusKills?: number;
  nexusTakedowns?: number;
  nexusLost?: number;
  objectivesStolen?: number;
  objectivesStolenAssists?: number;
  participantId: number;
  playerAugment1?: number;
  playerAugment2?: number;
  playerAugment3?: number;
  playerAugment4?: number;
  playerAugment5?: number;
  playerAugment6?: number;
  pentaKills?: number;
  perks?: {
    statPerks?: Record<string, number>;
    styles?: unknown[];
  };
  physicalDamageDealt?: number;
  physicalDamageDealtToChampions?: number;
  physicalDamageTaken?: number;
  profileIcon?: number;
  puuid: string;
  quadraKills?: number;
  riotIdGameName?: string;
  riotIdTagline?: string;
  role?: string;
  sightWardsBoughtInGame?: number;
  spell1Casts?: number;
  spell2Casts?: number;
  spell3Casts?: number;
  spell4Casts?: number;
  summoner1Casts?: number;
  summoner1Id?: number;
  summoner2Casts?: number;
  summoner2Id?: number;
  summonerId?: string;
  summonerLevel?: number;
  summonerName?: string;
  teamEarlySurrendered?: boolean;
  teamId: number;
  teamPosition?: string;
  timeCCingOthers?: number;
  timePlayed?: number;
  totalAllyJungleMinionsKilled?: number;
  totalDamageDealt: number;
  totalDamageDealtToChampions: number;
  totalDamageShieldedOnTeammates?: number;
  totalDamageTaken: number;
  totalEnemyJungleMinionsKilled?: number;
  totalHeal?: number;
  totalHealsOnTeammates?: number;
  totalMinionsKilled?: number;
  totalTimeCCDealt?: number;
  totalTimeSpentDead?: number;
  totalUnitsHealed?: number;
  tripleKills?: number;
  trueDamageDealt?: number;
  trueDamageDealtToChampions?: number;
  trueDamageTaken?: number;
  turretKills?: number;
  turretTakedowns?: number;
  turretsLost?: number;
  unrealKills?: number;
  visionScore?: number;
  visionWardsBoughtInGame?: number;
  wardsKilled?: number;
  wardsPlaced?: number;
  win: boolean;
  challenges?: {
    augmentIds?: number[];
    playerAugment1?: number;
    playerAugment2?: number;
    playerAugment3?: number;
    playerAugment4?: number;
    placement?: number;
    [key: string]: string | number | boolean | number[] | undefined;
  };
};

export type RiotMatchTeamDto = {
  bans: Array<{
    championId: number;
    pickTurn: number;
  }>;
  objectives: Record<
    string,
    {
      first: boolean;
      kills: number;
    }
  >;
  teamId: number;
  win: boolean;
};
