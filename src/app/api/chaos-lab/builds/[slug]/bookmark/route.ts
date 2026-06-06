import { NextResponse } from "next/server";
import {
  getChaosLabBookmarkStatus,
  setChaosLabBuildBookmark
} from "@/server/repositories/chaosLabRepository";
import { chaosApiData, chaosApiError } from "@/app/api/chaos-lab/_responses";
import { getCurrentSupabaseUser } from "@/server/auth/chaosCreatorAuth";

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
    const bookmark = await getChaosLabBookmarkStatus(slug, user?.id);

    return chaosApiData({ bookmark });
  } catch (error) {
    return chaosApiError(error, "Chaos Lab bookmark could not be loaded.");
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  const user = await getCurrentSupabaseUser();

  if (!user) {
    return NextResponse.json(
      {
        ok: false,
        error: "You must sign in before saving Chaos Lab builds."
      },
      { status: 401 }
    );
  }

  try {
    const { slug } = await params;
    const payload = await request.json();

    if (typeof payload?.saved !== "boolean") {
      return NextResponse.json(
        {
          ok: false,
          error: "Bookmark request must include a boolean saved value."
        },
        { status: 400 }
      );
    }

    const bookmark = await setChaosLabBuildBookmark({
      slug,
      userId: user.id,
      saved: payload.saved
    });

    return chaosApiData({ bookmark });
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

    return chaosApiError(error, "Chaos Lab bookmark could not be updated.");
  }
}
