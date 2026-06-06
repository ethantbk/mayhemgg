import type { ChaosBuild as MockChaosBuild, ChaosBuildDetails as MockChaosBuildDetails, ChaosCreator as MockChaosCreator } from "@/data/chaosLabData";
import type { Item } from "@/types";
import type {
  DbChampion,
  DbChaosBuild,
  DbChaosBuildCategory,
  DbChaosBuildComment,
  DbChaosBuildRating,
  DbChaosBuildRisk,
  DbChaosBuildStatus,
  DbChaosCreator,
  DbChaosRatingDifficulty,
  DbItemCategory,
  JsonValue
} from "@/types/database";
import type {
  ChaosLabBuild,
  ChaosLabBuildCategory,
  ChaosLabBuildDetails,
  ChaosLabBuildRisk,
  ChaosLabBuildStatus,
  ChaosLabCommentPreview,
  ChaosLabCommunityRating,
  ChaosLabCreator,
  ChaosLabDifficultyVote
} from "@/types/chaosLab";
import { dbModeToMode } from "@/server/repositories/mappers";
import { getDefaultChaosBuildTags, normalizeChaosBuildTags } from "@/lib/chaosTags";
import { slugify } from "@/lib/utils";

type ChaosBuildItemPathEntry = {
  name: string;
  category: Item["category"];
  riotId?: number;
};

const categoryMap: Record<DbChaosBuildCategory, ChaosLabBuildCategory> = {
  community: "Community",
  experimental: "Experimental",
  upvoted: "Upvoted",
  newest: "Newest"
};

const statusMap: Record<DbChaosBuildStatus, ChaosLabBuildStatus> = {
  verified: "Verified",
  testing: "Testing",
  unstable: "Unstable",
  fresh: "Fresh",
  archived: "Archived"
};

const riskMap: Record<DbChaosBuildRisk, ChaosLabBuildRisk> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  extreme: "Extreme"
};

const difficultyMap: Record<DbChaosRatingDifficulty, ChaosLabDifficultyVote> = {
  easy: "Easy",
  moderate: "Moderate",
  hard: "Hard",
  expert: "Expert"
};

const itemCategoryMap: Record<DbItemCategory, Item["category"]> = {
  starter: "Starter",
  core: "Core",
  damage: "Damage",
  defense: "Defense",
  utility: "Utility",
  boots: "Boots"
};

const mockCreatorJoinDates: Record<string, string> = {
  torchtheory: "2026-01-12T00:00:00.000Z",
  resetjunkie: "2026-01-28T00:00:00.000Z",
  bluebuilds: "2026-02-09T00:00:00.000Z"
};

function isRecord(value: JsonValue): value is Record<string, JsonValue> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toStringValue(value: JsonValue | undefined) {
  return typeof value === "string" ? value : undefined;
}

function toNumberValue(value: JsonValue | undefined) {
  return typeof value === "number" ? value : undefined;
}

function toItemCategory(value: JsonValue | undefined): Item["category"] {
  const normalized = toStringValue(value)?.toLowerCase();
  return normalized && normalized in itemCategoryMap
    ? itemCategoryMap[normalized as DbItemCategory]
    : "Core";
}

function mapCoreItemPath(coreItemPath: JsonValue): Item[] {
  if (!Array.isArray(coreItemPath)) {
    return [];
  }

  return coreItemPath
    .map((entry): ChaosBuildItemPathEntry | null => {
      if (!isRecord(entry)) {
        return null;
      }

      const name = toStringValue(entry.name);

      if (!name) {
        return null;
      }

      return {
        name,
        category: toItemCategory(entry.category),
        riotId: toNumberValue(entry.riotItemId)
      };
    })
    .filter((entry): entry is ChaosBuildItemPathEntry => Boolean(entry));
}

function postedAgo(postedAt: string) {
  const postedTime = new Date(postedAt).getTime();

  if (Number.isNaN(postedTime)) {
    return "recently";
  }

  const diffHours = Math.max(1, Math.round((Date.now() - postedTime) / 36e5));

  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getVoteCounts(ratings: DbChaosBuildRating[]) {
  const upvotes = ratings.filter((rating) => rating.isUpvote).length;
  const downvotes = ratings.filter((rating) => !rating.isUpvote).length;

  return {
    upvotes,
    downvotes,
    netVotes: upvotes - downvotes
  };
}

function mostCommonDifficulty(ratings: DbChaosBuildRating[]): ChaosLabDifficultyVote {
  const counts = new Map<ChaosLabDifficultyVote, number>();

  ratings.forEach((rating) => {
    if (!rating.difficultyVote) return;
    const difficulty = difficultyMap[rating.difficultyVote];
    counts.set(difficulty, (counts.get(difficulty) ?? 0) + 1);
  });

  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Moderate";
}

export function mapDbChaosCreator({
  creator,
  featuredChampion
}: {
  creator: DbChaosCreator;
  featuredChampion?: DbChampion;
}): ChaosLabCreator {
  return {
    databaseId: creator.id,
    name: creator.displayName,
    handle: creator.handle,
    slug: creator.slug,
    specialty: creator.specialty,
    bio: creator.spotlight,
    featuredChampion: featuredChampion?.name ?? "Multiple Champions",
    featuredChampionSlug: featuredChampion?.slug,
    avatarPath: creator.avatarPath ?? undefined,
    buildsPublished: creator.buildsPublished,
    totalVotes: creator.totalVotes,
    reputationScore: creator.reputationScore,
    spotlight: creator.spotlight,
    joinedAt: creator.createdAt
  };
}

export function mapMockChaosCreator(creator: MockChaosCreator): ChaosLabCreator {
  const slug = creator.handle.replace(/^@/, "").toLowerCase();

  return {
    name: creator.name,
    handle: creator.handle,
    slug,
    specialty: creator.specialty,
    bio: creator.spotlight,
    featuredChampion: creator.featuredChampion,
    buildsPublished: creator.buildsPublished,
    totalVotes: creator.totalVotes,
    spotlight: creator.spotlight,
    joinedAt: mockCreatorJoinDates[slug]
  };
}

export function mapDbChaosBuild({
  build,
  creator,
  champion,
  ratings = []
}: {
  build: DbChaosBuild;
  creator: DbChaosCreator;
  champion: DbChampion;
  ratings?: DbChaosBuildRating[];
}): ChaosLabBuild {
  const voteCounts = getVoteCounts(ratings);
  const tags = normalizeChaosBuildTags(build.tags);

  return {
    databaseId: build.id,
    id: build.slug,
    slug: build.slug,
    championName: champion.name,
    championSlug: champion.slug,
    mode: dbModeToMode(build.mode),
    title: build.title,
    creator: creator.displayName,
    creatorTag: creator.specialty,
    creatorSlug: creator.slug,
    category: categoryMap[build.category],
    status: statusMap[build.status],
    votes: ratings.length ? voteCounts.netVotes : build.votes,
    savedCount: build.savedCount,
    comments: build.commentsCount,
    winRate: build.winRate ?? 0,
    games: build.gamesPlayed,
    risk: riskMap[build.risk],
    tags: tags.length
      ? tags
      : getDefaultChaosBuildTags({
          category: categoryMap[build.category],
          risk: riskMap[build.risk]
        }),
    summary: build.description,
    items: mapCoreItemPath(build.coreItemPath),
    augments: build.recommendedAugments,
    isFeatured: build.isFeatured,
    publishedAt: build.publishedAt ?? undefined
  };
}

export function mapMockChaosBuild(build: MockChaosBuild): ChaosLabBuild {
  return {
    ...build,
    slug: build.id,
    creatorSlug: slugify(build.creator),
    tags: getDefaultChaosBuildTags({
      category: build.category,
      risk: build.risk
    }),
    savedCount: Math.max(0, Math.round(build.votes * 0.18))
  };
}

export function mapDbChaosCommunityRating({
  build,
  ratings,
  userId
}: {
  build: DbChaosBuild;
  ratings: DbChaosBuildRating[];
  userId?: string | null;
}): ChaosLabCommunityRating {
  if (!ratings.length) {
    return {
      score: Number(Math.min(9.8, 6.8 + build.votes / 900 + (build.winRate ?? 0) / 100).toFixed(1)),
      totalRatings: Math.max(0, Math.round(build.votes * 0.38)),
      upvoteRate: Math.min(98, Math.round(72 + build.votes / 90)),
      upvotes: Math.max(0, build.votes),
      downvotes: 0,
      netVotes: build.votes,
      userVote: null,
      difficultyVote: riskMap[build.risk] === "Extreme" ? "Expert" : riskMap[build.risk] === "High" ? "Hard" : riskMap[build.risk] === "Low" ? "Easy" : "Moderate"
    };
  }

  const voteCounts = getVoteCounts(ratings);
  const userRating = userId ? ratings.find((rating) => rating.authUserId === userId) : undefined;

  return {
    score: Number(average(ratings.map((rating) => rating.ratingScore)).toFixed(1)),
    totalRatings: ratings.length,
    upvoteRate: Math.round((ratings.filter((rating) => rating.isUpvote).length / ratings.length) * 100),
    upvotes: voteCounts.upvotes,
    downvotes: voteCounts.downvotes,
    netVotes: voteCounts.netVotes,
    userVote: userRating ? (userRating.isUpvote ? "up" : "down") : null,
    difficultyVote: mostCommonDifficulty(ratings)
  };
}

export function mapDbChaosComments(comments: DbChaosBuildComment[], limit = 3): ChaosLabCommentPreview[] {
  return comments
    .filter((comment) => comment.status === "visible")
    .sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime())
    .slice(0, limit)
    .map((comment) => ({
      id: comment.id,
      author: comment.authorName,
      badge: comment.authorBadge ?? "Community",
      postedAgo: postedAgo(comment.postedAt),
      comment: comment.body,
      postedAt: comment.postedAt
    }));
}

export function mapDbChaosBuildDetails({
  build,
  mappedBuild,
  ratings,
  comments
}: {
  build: DbChaosBuild;
  mappedBuild: ChaosLabBuild;
  ratings: DbChaosBuildRating[];
  comments: DbChaosBuildComment[];
}): ChaosLabBuildDetails {
  return {
    build: mappedBuild,
    matchupNotes: build.matchupNotes,
    strengths: build.strengths,
    weaknesses: build.weaknesses,
    communityRating: mapDbChaosCommunityRating({ build, ratings }),
    commentPreview: mapDbChaosComments(comments)
  };
}

export function mapMockChaosBuildDetails(build: MockChaosBuild, details: MockChaosBuildDetails): ChaosLabBuildDetails {
  return {
    build: mapMockChaosBuild(build),
    matchupNotes: details.matchupNotes,
    strengths: details.strengths,
    weaknesses: details.weaknesses,
    communityRating: {
      ...details.communityRating,
      upvotes: build.votes,
      downvotes: 0,
      netVotes: build.votes,
      userVote: null
    },
    commentPreview: details.commentPreview
  };
}
