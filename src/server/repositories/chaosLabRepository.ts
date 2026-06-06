import "server-only";

import {
  chaosBuilds as mockChaosBuilds,
  chaosCreators as mockChaosCreators,
  getChaosBuildBySlug as getMockChaosBuildBySlug,
  getChaosBuildDetails as getMockChaosBuildDetails
} from "@/data/chaosLabData";
import { isSupabasePublicConfigAvailable } from "@/lib/supabase/config";
import { DatabaseError, safeSupabaseQuery, unwrapSupabaseResponse } from "@/lib/supabase/errors";
import { createServerSupabaseClient, createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import type {
  DbChampion,
  DbChaosBuild,
  DbChaosBuildBookmark,
  DbChaosBuildComment,
  DbChaosBuildRating,
  DbChaosCreator
} from "@/types/database";
import type {
  ChaosLabBuild,
  ChaosLabBuildDetails,
  ChaosLabCommentPreview,
  ChaosLabCommentsPage,
  ChaosLabCommunityRating,
  ChaosLabCreator,
  ChaosLabCreatorProfile
} from "@/types/chaosLab";
import type { CreateChaosLabBuildInput } from "@/server/chaos-lab/buildValidation";
import {
  mapDbChaosBuild,
  mapDbChaosBuildDetails,
  mapDbChaosComments,
  mapDbChaosCommunityRating,
  mapDbChaosCreator,
  mapMockChaosBuild,
  mapMockChaosBuildDetails,
  mapMockChaosCreator
} from "@/server/repositories/chaosLabMappers";
import { modeToDbMode } from "@/server/repositories/mappers";
import { slugify } from "@/lib/utils";

type ChaosLabDataset = {
  champions: DbChampion[];
  creators: DbChaosCreator[];
  builds: DbChaosBuild[];
  ratings: DbChaosBuildRating[];
  comments: DbChaosBuildComment[];
};

export type CreateChaosLabBuildRepositoryInput = CreateChaosLabBuildInput & {
  creatorId: string;
};

export type ChaosLabVoteValue = "up" | "down";

export type CreateChaosLabCommentInput = {
  slug: string;
  userId: string;
  userEmail?: string | null;
  userName?: string | null;
  body: string;
};

export type ChaosLabBookmarkStatus = {
  isSaved: boolean;
  savedCount: number;
};

async function loadRows<T>(query: PromiseLike<{ data: T[] | null; error: unknown }>, context: string) {
  const result = await safeSupabaseQuery(query, context);
  return result.error ? null : result.data;
}

function mapDatasetBuilds(dataset: ChaosLabDataset): ChaosLabBuild[] {
  const creatorsById = new Map(dataset.creators.map((creator) => [creator.id, creator]));
  const championsById = new Map(dataset.champions.map((champion) => [champion.id, champion]));
  const ratingsByBuildId = new Map<string, DbChaosBuildRating[]>();

  dataset.ratings.forEach((rating) => {
    const ratings = ratingsByBuildId.get(rating.chaosBuildId) ?? [];
    ratings.push(rating);
    ratingsByBuildId.set(rating.chaosBuildId, ratings);
  });

  return dataset.builds
    .map((build) => {
      const creator = creatorsById.get(build.creatorId);
      const champion = championsById.get(build.championId);

      if (!creator || !champion) {
        return null;
      }

      return mapDbChaosBuild({
        build,
        creator,
        champion,
        ratings: ratingsByBuildId.get(build.id) ?? []
      });
    })
    .filter((build): build is ChaosLabBuild => Boolean(build));
}

async function loadChaosLabDataset(): Promise<ChaosLabDataset | null> {
  if (!isSupabasePublicConfigAvailable()) {
    return null;
  }

  try {
    const db = createServerSupabaseClient();
    const [champions, creators, builds] = await Promise.all([
      loadRows(db.from("champions").select("*"), "Load Chaos Lab champions"),
      loadRows(db.from("chaos_creators").select("*").order("totalVotes", { ascending: false }), "Load Chaos Lab creators"),
      loadRows(db.from("chaos_builds").select("*").order("votes", { ascending: false }), "Load Chaos Lab builds")
    ]);

    if (!champions || !creators || !builds) {
      return null;
    }

    const buildIds = builds.map((build) => build.id);
    const [ratings, comments] = buildIds.length
      ? await Promise.all([
          loadRows(db.from("chaos_build_ratings").select("*").in("chaosBuildId", buildIds), "Load Chaos Lab ratings"),
          loadRows(db.from("chaos_build_comments").select("*").in("chaosBuildId", buildIds), "Load Chaos Lab comments")
        ])
      : [[], []];

    if (!ratings || !comments) {
      return null;
    }

    return {
      champions,
      creators,
      builds,
      ratings,
      comments
    };
  } catch {
    return null;
  }
}

export async function getChaosLabBuilds(): Promise<ChaosLabBuild[]> {
  const dataset = await loadChaosLabDataset();
  const builds = dataset ? mapDatasetBuilds(dataset) : [];

  return builds.length ? builds : mockChaosBuilds.map(mapMockChaosBuild);
}

export async function getChaosLabBuildBySlug(slug: string): Promise<ChaosLabBuild | undefined> {
  const builds = await getChaosLabBuilds();
  return builds.find((build) => build.slug === slug || build.id === slug);
}

export async function getChaosLabBuildDetails(slug: string): Promise<ChaosLabBuildDetails | undefined> {
  const dataset = await loadChaosLabDataset();

  if (dataset) {
    const build = dataset.builds.find((candidate) => candidate.slug === slug);
    const creator = build ? dataset.creators.find((candidate) => candidate.id === build.creatorId) : undefined;
    const champion = build ? dataset.champions.find((candidate) => candidate.id === build.championId) : undefined;

    if (build && creator && champion) {
      const ratings = dataset.ratings.filter((rating) => rating.chaosBuildId === build.id);
      const mappedBuild = mapDbChaosBuild({ build, creator, champion, ratings });
      return mapDbChaosBuildDetails({
        build,
        mappedBuild,
        ratings,
        comments: dataset.comments.filter((comment) => comment.chaosBuildId === build.id)
      });
    }
  }

  const mockBuild = getMockChaosBuildBySlug(slug);
  return mockBuild ? mapMockChaosBuildDetails(mockBuild, getMockChaosBuildDetails(mockBuild)) : undefined;
}

export async function getChaosLabCreators(): Promise<ChaosLabCreator[]> {
  const dataset = await loadChaosLabDataset();

  if (!dataset?.creators.length) {
    return mockChaosCreators.map(mapMockChaosCreator);
  }

  const championsById = new Map(dataset.champions.map((champion) => [champion.id, champion]));
  const creators = dataset.creators.map((creator) =>
    mapDbChaosCreator({
      creator,
      featuredChampion: creator.featuredChampionId ? championsById.get(creator.featuredChampionId) : undefined
    })
  );

  return creators.length ? creators : mockChaosCreators.map(mapMockChaosCreator);
}

function sortNewestBuilds(builds: ChaosLabBuild[]) {
  return [...builds].sort((a, b) => {
    if (!a.publishedAt && !b.publishedAt) return 0;
    if (!a.publishedAt) return 1;
    if (!b.publishedAt) return -1;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });
}

export async function getChaosLabCreatorProfile(slug: string): Promise<ChaosLabCreatorProfile | null> {
  const [creators, builds] = await Promise.all([
    getChaosLabCreators(),
    getChaosLabBuilds()
  ]);
  const creator = creators.find((candidate) => candidate.slug === slug);

  if (!creator) {
    return null;
  }

  const creatorBuilds = builds.filter((build) => build.creatorSlug === creator.slug || build.creator === creator.name);
  const totalVotes = creatorBuilds.reduce((sum, build) => sum + build.votes, 0);
  const profileCreator: ChaosLabCreator = {
    ...creator,
    buildsPublished: creatorBuilds.length || creator.buildsPublished,
    totalVotes: creatorBuilds.length ? totalVotes : creator.totalVotes
  };

  return {
    creator: profileCreator,
    builds: creatorBuilds,
    topBuilds: [...creatorBuilds].sort((a, b) => b.votes - a.votes).slice(0, 4),
    newestBuilds: sortNewestBuilds(creatorBuilds).slice(0, 4)
  };
}

export async function getChaosLabCreatorByAuthUserId(authUserId: string): Promise<ChaosLabCreator | null> {
  if (!isSupabasePublicConfigAvailable()) {
    return null;
  }

  try {
    const db = createServerSupabaseClient();
    const creatorResult = await safeSupabaseQuery(
      db.from("chaos_creators").select("*").eq("authUserId", authUserId).limit(1),
      "Load authenticated Chaos Lab creator"
    );

    if (creatorResult.error || !creatorResult.data[0]) {
      return null;
    }

    const creator = creatorResult.data[0];
    const championResult = creator.featuredChampionId
      ? await safeSupabaseQuery(
          db.from("champions").select("*").eq("id", creator.featuredChampionId).limit(1),
          "Load authenticated Chaos Lab creator champion"
        )
      : null;

    return mapDbChaosCreator({
      creator,
      featuredChampion: championResult?.error ? undefined : championResult?.data[0]
    });
  } catch {
    return null;
  }
}

export async function getChaosLabBookmarkStatus(slug: string, userId?: string | null): Promise<ChaosLabBookmarkStatus> {
  const fallbackBuild = await getChaosLabBuildBySlug(slug);

  if (!isSupabasePublicConfigAvailable()) {
    return {
      isSaved: false,
      savedCount: fallbackBuild?.savedCount ?? 0
    };
  }

  try {
    const db = createServiceRoleSupabaseClient();
    const build = unwrapSupabaseResponse(
      await db.from("chaos_builds").select("*").eq("slug", slug).limit(1),
      "Load Chaos Lab build for bookmark status"
    )[0];

    if (!build) {
      return {
        isSaved: false,
        savedCount: fallbackBuild?.savedCount ?? 0
      };
    }

    if (!userId) {
      return {
        isSaved: false,
        savedCount: build.savedCount
      };
    }

    const bookmark = await safeSupabaseQuery(
      db
        .from("chaos_build_bookmarks")
        .select("*")
        .eq("chaosBuildId", build.id)
        .eq("authUserId", userId)
        .limit(1),
      "Load Chaos Lab bookmark"
    );

    return {
      isSaved: Boolean(!bookmark.error && bookmark.data[0]),
      savedCount: build.savedCount
    };
  } catch {
    return {
      isSaved: false,
      savedCount: fallbackBuild?.savedCount ?? 0
    };
  }
}

export async function getChaosLabCommunityRating(slug: string, userId?: string | null): Promise<ChaosLabCommunityRating | undefined> {
  const dataset = await loadChaosLabDataset();
  const build = dataset?.builds.find((candidate) => candidate.slug === slug);

  if (dataset && build) {
    return mapDbChaosCommunityRating({
      build,
      ratings: dataset.ratings.filter((rating) => rating.chaosBuildId === build.id),
      userId
    });
  }

  const details = await getChaosLabBuildDetails(slug);
  return details?.communityRating;
}

export async function setChaosLabBuildBookmark({
  slug,
  userId,
  saved
}: {
  slug: string;
  userId: string;
  saved: boolean;
}): Promise<ChaosLabBookmarkStatus> {
  if (!isSupabasePublicConfigAvailable()) {
    throw new DatabaseError("Supabase is not configured for Chaos Lab bookmarks.");
  }

  const db = createServiceRoleSupabaseClient();
  const build = unwrapSupabaseResponse(
    await db.from("chaos_builds").select("*").eq("slug", slug).limit(1),
    "Load Chaos Lab build for bookmarking"
  )[0];

  if (!build) {
    throw new DatabaseError("Chaos Lab build not found.");
  }

  if (saved) {
    const upsertedBookmark = unwrapSupabaseResponse(
      await db
        .from("chaos_build_bookmarks")
        .upsert(
          {
            chaosBuildId: build.id,
            authUserId: userId
          },
          {
            onConflict: "chaosBuildId,authUserId"
          }
        )
        .select("*")
        .limit(1),
      "Save Chaos Lab build"
    )[0];
    void upsertedBookmark;
  } else {
    const deleteResponse = await db
      .from("chaos_build_bookmarks")
      .delete()
      .eq("chaosBuildId", build.id)
      .eq("authUserId", userId);

    if (deleteResponse.error) {
      throw deleteResponse.error;
    }
  }

  const countResponse = await db
    .from("chaos_build_bookmarks")
    .select("id", { count: "exact", head: true })
    .eq("chaosBuildId", build.id);
  const savedCount = countResponse.count ?? build.savedCount;

  await db.from("chaos_builds").update({ savedCount }).eq("id", build.id);

  return {
    isSaved: saved,
    savedCount
  };
}

export async function getSavedChaosLabBuilds(userId: string): Promise<ChaosLabBuild[]> {
  if (!isSupabasePublicConfigAvailable()) {
    return [];
  }

  try {
    const db = createServiceRoleSupabaseClient();
    const bookmarks = unwrapSupabaseResponse(
      await db
        .from("chaos_build_bookmarks")
        .select("*")
        .eq("authUserId", userId)
        .order("createdAt", { ascending: false }),
      "Load saved Chaos Lab builds"
    ) as DbChaosBuildBookmark[];

    if (!bookmarks.length) {
      return [];
    }

    const builds = await getChaosLabBuilds();
    const buildsByDatabaseId = new Map(builds.map((build) => [build.databaseId, build]));

    return bookmarks
      .map((bookmark) => buildsByDatabaseId.get(bookmark.chaosBuildId))
      .filter((build): build is ChaosLabBuild => Boolean(build));
  } catch {
    return [];
  }
}

export async function getChaosLabCommentPreview(slug: string, limit = 3): Promise<ChaosLabCommentPreview[]> {
  const dataset = await loadChaosLabDataset();
  const build = dataset?.builds.find((candidate) => candidate.slug === slug);

  if (dataset && build) {
    return mapDbChaosComments(
      dataset.comments.filter((comment) => comment.chaosBuildId === build.id),
      limit
    );
  }

  const details = await getChaosLabBuildDetails(slug);
  return details?.commentPreview.slice(0, limit) ?? [];
}

function createCommentsPage({
  comments,
  page,
  pageSize,
  total
}: {
  comments: ChaosLabCommentPreview[];
  page: number;
  pageSize: number;
  total: number;
}): ChaosLabCommentsPage {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    comments,
    page,
    pageSize,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1
  };
}

export async function getChaosLabCommentsPage({
  slug,
  page = 1,
  pageSize = 10
}: {
  slug: string;
  page?: number;
  pageSize?: number;
}): Promise<ChaosLabCommentsPage | undefined> {
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(50, Math.max(1, pageSize));

  if (isSupabasePublicConfigAvailable()) {
    try {
      const db = createServerSupabaseClient();
      const build = unwrapSupabaseResponse(
        await db.from("chaos_builds").select("*").eq("slug", slug).limit(1),
        "Load Chaos Lab build for comments"
      )[0];

      if (!build) {
        return undefined;
      }

      const from = (safePage - 1) * safePageSize;
      const to = from + safePageSize - 1;
      const response = await db
        .from("chaos_build_comments")
        .select("*", { count: "exact" })
        .eq("chaosBuildId", build.id)
        .eq("status", "visible")
        .order("postedAt", { ascending: false })
        .range(from, to);

      if (response.error) {
        throw response.error;
      }

      return createCommentsPage({
        comments: mapDbChaosComments(response.data ?? [], safePageSize),
        page: safePage,
        pageSize: safePageSize,
        total: response.count ?? 0
      });
    } catch {
      // Fall through to mock-backed comments when database reads are unavailable.
    }
  }

  const details = await getChaosLabBuildDetails(slug);

  if (!details) {
    return undefined;
  }

  const from = (safePage - 1) * safePageSize;
  const comments = details.commentPreview.slice(from, from + safePageSize);

  return createCommentsPage({
    comments,
    page: safePage,
    pageSize: safePageSize,
    total: details.commentPreview.length
  });
}

async function createUniqueChaosBuildSlug(title: string, championSlug: string) {
  const db = createServiceRoleSupabaseClient();
  const baseSlug = slugify(`${championSlug}-${title}`) || slugify(`${championSlug}-chaos-build`);
  let candidate = baseSlug;

  for (let attempt = 2; attempt <= 20; attempt += 1) {
    const existing = await safeSupabaseQuery(
      db.from("chaos_builds").select("id").eq("slug", candidate).limit(1),
      "Check Chaos Lab build slug"
    );

    if (existing.error || !existing.data[0]) {
      return candidate;
    }

    candidate = `${baseSlug}-${attempt}`;
  }

  return `${baseSlug}-${Date.now()}`;
}

export async function createChaosLabBuild(input: CreateChaosLabBuildRepositoryInput): Promise<ChaosLabBuild> {
  if (!isSupabasePublicConfigAvailable()) {
    throw new DatabaseError("Supabase is not configured for Chaos Lab build creation.");
  }

  const db = createServiceRoleSupabaseClient();
  const champion = unwrapSupabaseResponse(
    await db.from("champions").select("*").eq("slug", input.championSlug).limit(1),
    "Load champion for Chaos Lab build creation"
  )[0];

  if (!champion) {
    throw new DatabaseError("Selected champion is not available in the database yet.");
  }

  const creator = unwrapSupabaseResponse(
    await db.from("chaos_creators").select("*").eq("id", input.creatorId).limit(1),
    "Load creator for Chaos Lab build creation"
  )[0];

  if (!creator) {
    throw new DatabaseError("Authenticated creator profile could not be found.");
  }

  const slug = await createUniqueChaosBuildSlug(input.title, champion.slug);
  const insertedBuild = unwrapSupabaseResponse(
    await db
      .from("chaos_builds")
      .insert({
        slug,
        creatorId: creator.id,
        championId: champion.id,
        mode: modeToDbMode(input.mode),
        title: input.title,
        category: "newest",
        status: "fresh",
        risk: "medium",
        description: input.description,
        coreItemPath: input.itemOrder.map((name, index) => ({
          name,
          category: index === 1 ? "boots" : "core"
        })),
        recommendedAugments: input.augments,
        tags: input.tags,
        matchupNotes: input.matchupNotes,
        strengths: input.strengths,
        weaknesses: input.weaknesses,
        source: "creator",
        publishedAt: new Date().toISOString(),
        rawData: {
          submittedByCreatorId: creator.id
        }
      })
      .select("*")
      .limit(1),
    "Create Chaos Lab build"
  )[0];

  if (!insertedBuild) {
    throw new DatabaseError("Chaos Lab build creation returned no row.");
  }

  return mapDbChaosBuild({
    build: insertedBuild,
    creator,
    champion
  });
}

function getNetVotes(ratings: DbChaosBuildRating[]) {
  return ratings.reduce((score, rating) => score + (rating.isUpvote ? 1 : -1), 0);
}

export async function voteOnChaosLabBuild({
  slug,
  userId,
  vote
}: {
  slug: string;
  userId: string;
  vote: ChaosLabVoteValue;
}): Promise<ChaosLabCommunityRating> {
  if (!isSupabasePublicConfigAvailable()) {
    throw new DatabaseError("Supabase is not configured for Chaos Lab voting.");
  }

  const db = createServiceRoleSupabaseClient();
  const build = unwrapSupabaseResponse(
    await db.from("chaos_builds").select("*").eq("slug", slug).limit(1),
    "Load Chaos Lab build for voting"
  )[0];

  if (!build) {
    throw new DatabaseError("Chaos Lab build not found.");
  }

  const isUpvote = vote === "up";

  const upsertedVote = unwrapSupabaseResponse(
    await db
      .from("chaos_build_ratings")
      .upsert(
        {
          chaosBuildId: build.id,
          authUserId: userId,
          ratingScore: isUpvote ? 10 : 0,
          isUpvote,
          metadata: {
            source: "community_vote"
          }
        },
        {
          onConflict: "chaosBuildId,authUserId"
        }
      )
      .select("*")
      .limit(1),
    "Upsert Chaos Lab vote"
  )[0];
  void upsertedVote;

  const ratings = unwrapSupabaseResponse(
    await db.from("chaos_build_ratings").select("*").eq("chaosBuildId", build.id),
    "Load Chaos Lab ratings after vote"
  );
  const netVotes = getNetVotes(ratings);
  const updatedBuild = unwrapSupabaseResponse(
    await db.from("chaos_builds").update({ votes: netVotes }).eq("id", build.id).select("*").limit(1),
    "Update Chaos Lab build vote total"
  )[0] ?? {
    ...build,
    votes: netVotes
  };

  return mapDbChaosCommunityRating({
    build: updatedBuild,
    ratings,
    userId
  });
}

function getUserDisplayName({ userName, userEmail }: { userName?: string | null; userEmail?: string | null }) {
  if (userName?.trim()) {
    return userName.trim();
  }

  if (userEmail?.includes("@")) {
    return userEmail.split("@")[0] || "MayhemGG User";
  }

  return "MayhemGG User";
}

export async function createChaosLabComment(input: CreateChaosLabCommentInput): Promise<{
  comment: ChaosLabCommentPreview;
  commentsCount: number;
}> {
  const body = input.body.trim();

  if (!isSupabasePublicConfigAvailable()) {
    throw new DatabaseError("Supabase is not configured for Chaos Lab comments.");
  }

  if (body.length < 3) {
    throw new DatabaseError("Comment must be at least 3 characters.");
  }

  if (body.length > 1000) {
    throw new DatabaseError("Comment must be 1000 characters or fewer.");
  }

  const db = createServiceRoleSupabaseClient();
  const build = unwrapSupabaseResponse(
    await db.from("chaos_builds").select("*").eq("slug", input.slug).limit(1),
    "Load Chaos Lab build for comment creation"
  )[0];

  if (!build) {
    throw new DatabaseError("Chaos Lab build not found.");
  }

  const creatorResult = await safeSupabaseQuery(
    db.from("chaos_creators").select("*").eq("authUserId", input.userId).limit(1),
    "Load Chaos Lab comment creator profile"
  );
  const creator = creatorResult.error ? null : creatorResult.data[0] ?? null;
  const insertedComment = unwrapSupabaseResponse(
    await db
      .from("chaos_build_comments")
      .insert({
        chaosBuildId: build.id,
        authUserId: input.userId,
        creatorId: creator?.id ?? null,
        authorName: creator?.displayName ?? getUserDisplayName(input),
        authorBadge: creator?.specialty ?? "Community",
        body,
        status: "visible",
        metadata: {
          source: "community_comment"
        },
        postedAt: new Date().toISOString()
      })
      .select("*")
      .limit(1),
    "Create Chaos Lab comment"
  )[0];

  if (!insertedComment) {
    throw new DatabaseError("Chaos Lab comment creation returned no row.");
  }

  const countResponse = await db
    .from("chaos_build_comments")
    .select("id", { count: "exact", head: true })
    .eq("chaosBuildId", build.id)
    .eq("status", "visible");
  const commentsCount = countResponse.count ?? build.commentsCount + 1;

  await db.from("chaos_builds").update({ commentsCount }).eq("id", build.id);

  return {
    comment: mapDbChaosComments([insertedComment], 1)[0],
    commentsCount
  };
}
