import { getChaosLabBuildDetails } from "@/server/repositories/chaosLabRepository";
import { chaosApiData, chaosApiError, chaosApiNotFound } from "@/app/api/chaos-lab/_responses";

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
    const details = await getChaosLabBuildDetails(slug);

    if (!details) {
      return chaosApiNotFound("Chaos Lab build not found.");
    }

    return chaosApiData(details);
  } catch (error) {
    return chaosApiError(error, "Chaos Lab build could not be loaded.");
  }
}
