import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  createChaosLabComment,
  getChaosLabBuildBySlug,
  getChaosLabCommentsPage
} from "@/server/repositories/chaosLabRepository";
import { chaosApiData, chaosApiError, chaosApiNotFound, parsePositiveLimit } from "@/app/api/chaos-lab/_responses";
import { getCurrentSupabaseUser } from "@/server/auth/chaosCreatorAuth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { slug } = await params;
    const build = await getChaosLabBuildBySlug(slug);

    if (!build) {
      return chaosApiNotFound("Chaos Lab build not found.");
    }

    const limit = parsePositiveLimit(request.nextUrl.searchParams.get("limit"), 10, 50);
    const page = parsePositiveLimit(request.nextUrl.searchParams.get("page"), 1, 10000);
    const commentsPage = await getChaosLabCommentsPage({
      slug,
      page,
      pageSize: limit
    });

    if (!commentsPage) {
      return chaosApiNotFound("Chaos Lab comments not found.");
    }

    return chaosApiData({
      commentsPage
    });
  } catch (error) {
    return chaosApiError(error, "Chaos Lab comments could not be loaded.");
  }
}

function getUserMetadataName(metadata: unknown) {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const source = metadata as Record<string, unknown>;
  const value = source.name ?? source.full_name ?? source.user_name;

  return typeof value === "string" ? value : null;
}

function parseCommentBody(value: unknown) {
  const body = typeof value === "string" ? value.trim() : "";
  const errors: string[] = [];

  if (body.length < 3) {
    errors.push("Comment must be at least 3 characters.");
  }

  if (body.length > 1000) {
    errors.push("Comment must be 1000 characters or fewer.");
  }

  return {
    body,
    errors
  };
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const user = await getCurrentSupabaseUser();

  if (!user) {
    return NextResponse.json(
      {
        ok: false,
        error: "You must sign in before commenting on Chaos Lab builds."
      },
      { status: 401 }
    );
  }

  try {
    const { slug } = await params;
    const payload = await request.json();
    const parsed = parseCommentBody(payload?.body ?? payload?.comment);

    if (parsed.errors.length) {
      return NextResponse.json(
        {
          ok: false,
          error: "Chaos Lab comment is invalid.",
          details: parsed.errors
        },
        { status: 400 }
      );
    }

    const result = await createChaosLabComment({
      slug,
      userId: user.id,
      userEmail: user.email,
      userName: getUserMetadataName(user.user_metadata),
      body: parsed.body
    });

    return chaosApiData(
      {
        comment: result.comment,
        commentsCount: result.commentsCount
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          ok: false,
          error: "Request body must be valid JSON."
        },
        { status: 400 }
      );
    }

    return chaosApiError(error, "Chaos Lab comment could not be created.");
  }
}
