import { NextResponse, type NextRequest } from "next/server";
import { createCookieSupabaseServerClient } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const supabase = await createCookieSupabaseServerClient({ canSetCookies: true });

  await supabase.auth.signOut();

  return NextResponse.redirect(new URL("/chaos-lab/creator/sign-in", requestUrl.origin));
}
