import { NextResponse } from "next/server";
import { getChaosLabCommunityRating } from "@/server/repositories/chaosLabRepository";
import { chaosApiData, chaosApiError, chaosApiNotFound } from "@/app/api/chaos-lab/_responses";
import { getCurrentSupabaseUser } from "@/server/auth/chaosCreatorAuth";
import { voteOnChaosLabBuild, type ChaosLabVoteValue } from "@/server/repositories/chaosLabRepository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { slug } = await params;
    const user = await getCurrentSupabaseUser();
    const rating = await getChaosLabCommunityRating(slug, user?.id);

    if (!rating) {
      return chaosApiNotFound("Chaos Lab rating not found.");
    }

    return chaosApiData({ rating });
  } catch (error) {
    return chaosApiError(error, "Chaos Lab rating could not be loaded.");
  }
}

function parseVote(value: unknown): ChaosLabVoteValue | null {
  if (value === "up" || value === "down") {
    return value;
  }

  return null;
}

export async function POST(request: Request, { params }: RouteContext) {
  const user = await getCurrentSupabaseUser();

  if (!user) {
    return NextResponse.json(
      {
        ok: false,
        error: "You must sign in before voting on Chaos Lab builds."
      },
      { status: 401 }
    );
  }

  try {
    const { slug } = await params;
    const body = await request.json();
    const vote = parseVote(body?.vote);

    if (!vote) {
      return NextResponse.json(
        {
          ok: false,
          error: "Vote must be either up or down."
        },
        { status: 400 }
      );
    }

    const rating = await voteOnChaosLabBuild({
      slug,
      userId: user.id,
      vote
    });

    return chaosApiData({ rating });
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

    return chaosApiError(error, "Chaos Lab vote could not be recorded.");
  }
}
