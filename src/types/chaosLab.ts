import type { Item, Mode } from "@/types";
import type { ChaosBuildTag } from "@/lib/chaosTags";

export type ChaosLabBuildCategory = "Community" | "Experimental" | "Upvoted" | "Newest";
export type ChaosLabBuildStatus = "Verified" | "Testing" | "Unstable" | "Fresh" | "Archived";
export type ChaosLabBuildRisk = "Low" | "Medium" | "High" | "Extreme";
export type ChaosLabDifficultyVote = "Easy" | "Moderate" | "Hard" | "Expert";

export type ChaosLabCreator = {
  databaseId?: string;
  name: string;
  handle: string;
  slug: string;
  specialty: string;
  bio: string;
  featuredChampion: string;
  featuredChampionSlug?: string;
  avatarPath?: string;
  buildsPublished: number;
  totalVotes: number;
  reputationScore?: number;
  spotlight: string;
  joinedAt?: string;
};

export type ChaosLabCommunityRating = {
  score: number;
  totalRatings: number;
  upvoteRate: number;
  upvotes: number;
  downvotes: number;
  netVotes: number;
  userVote?: "up" | "down" | null;
  difficultyVote: ChaosLabDifficultyVote;
};

export type ChaosLabCommentPreview = {
  id?: string;
  author: string;
  badge: string;
  postedAgo: string;
  comment: string;
  postedAt?: string;
};

export type ChaosLabCommentsPage = {
  comments: ChaosLabCommentPreview[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type ChaosLabBuild = {
  databaseId?: string;
  id: string;
  slug: string;
  championName: string;
  championSlug: string;
  mode: Mode;
  title: string;
  creator: string;
  creatorTag: string;
  creatorSlug?: string;
  category: ChaosLabBuildCategory;
  status: ChaosLabBuildStatus;
  votes: number;
  savedCount: number;
  comments: number;
  winRate: number;
  games: number;
  risk: ChaosLabBuildRisk;
  tags: ChaosBuildTag[];
  summary: string;
  items: Item[];
  augments: string[];
  isFeatured?: boolean;
  publishedAt?: string;
};

export type ChaosLabBuildDetails = {
  build: ChaosLabBuild;
  matchupNotes: string[];
  strengths: string[];
  weaknesses: string[];
  communityRating: ChaosLabCommunityRating;
  commentPreview: ChaosLabCommentPreview[];
};

export type ChaosLabCreatorProfile = {
  creator: ChaosLabCreator;
  builds: ChaosLabBuild[];
  topBuilds: ChaosLabBuild[];
  newestBuilds: ChaosLabBuild[];
};
