import { getChaosLabCreators } from "@/server/repositories/chaosLabRepository";
import { chaosApiData, chaosApiError, parsePositiveLimit } from "@/app/api/chaos-lab/_responses";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limit = parsePositiveLimit(url.searchParams.get("limit"), 50, 100);
    const creators = (await getChaosLabCreators()).slice(0, limit);

    return chaosApiData({
      creators,
      count: creators.length
    });
  } catch (error) {
    return chaosApiError(error, "Chaos Lab creators could not be loaded.");
  }
}
