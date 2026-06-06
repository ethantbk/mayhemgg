import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createChaosLabBuild, getChaosLabBuilds } from "@/server/repositories/chaosLabRepository";
import { chaosApiData, chaosApiError, parsePositiveLimit } from "@/app/api/chaos-lab/_responses";
import { getCurrentChaosCreatorSession } from "@/server/auth/chaosCreatorAuth";
import { ChaosBuildValidationError, parseCreateChaosLabBuildInput } from "@/server/chaos-lab/buildValidation";
import { getChaosBuildTagBySlug } from "@/lib/chaosTags";
import type { ChaosLabBuildCategory } from "@/types/chaosLab";
import type { Mode } from "@/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isMode(value: string | null): value is Mode {
  return value === "arena" || value === "aramMayhem";
}

function isCategory(value: string | null): value is ChaosLabBuildCategory {
  return value === "Community" || value === "Experimental" || value === "Upvoted" || value === "Newest";
}

export async function GET(request: NextRequest) {
  try {
    const mode = request.nextUrl.searchParams.get("mode");
    const category = request.nextUrl.searchParams.get("category");
    const tag = getChaosBuildTagBySlug(request.nextUrl.searchParams.get("tag"));
    const limit = parsePositiveLimit(request.nextUrl.searchParams.get("limit"), 50, 100);
    const builds = await getChaosLabBuilds();
    const filteredBuilds = builds
      .filter((build) => (isMode(mode) ? build.mode === mode : true))
      .filter((build) => (isCategory(category) ? build.category === category : true))
      .filter((build) => (tag ? build.tags.includes(tag) : true))
      .slice(0, limit);

    return chaosApiData({
      builds: filteredBuilds,
      count: filteredBuilds.length
    });
  } catch (error) {
    return chaosApiError(error, "Chaos Lab builds could not be loaded.");
  }
}

export async function POST(request: NextRequest) {
  const session = await getCurrentChaosCreatorSession();

  if (!session) {
    return NextResponse.json(
      {
        ok: false,
        error: "Chaos Lab build creation requires creator sign-in."
      },
      { status: 401 }
    );
  }

  if (!session.creator?.databaseId) {
    return NextResponse.json(
      {
        ok: false,
        error: "Your signed-in account is not linked to a Chaos Lab creator profile."
      },
      { status: 403 }
    );
  }

  try {
    const input = parseCreateChaosLabBuildInput(await request.json());
    const build = await createChaosLabBuild({
      ...input,
      creatorId: session.creator.databaseId
    });

    return chaosApiData(
      {
        build
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

    if (error instanceof ChaosBuildValidationError) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
          details: error.details
        },
        { status: 400 }
      );
    }

    return chaosApiError(error, "Chaos Lab build could not be created.");
  }
}
