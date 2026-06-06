import "server-only";

import { cookies } from "next/headers";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import type { MayhemDatabase } from "@/lib/supabase/database.types";

type CookieStore = Awaited<ReturnType<typeof cookies>>;

const authCookieMaxAge = 60 * 60 * 24 * 365;

function getSupabaseAuthCookieName(url: string) {
  const hostname = new URL(url).hostname;
  const projectRef = hostname.endsWith(".supabase.co") ? hostname.split(".")[0] : "mayhemgg";

  return `sb-${projectRef}-auth-token`;
}

function createCookieStorage(cookieStore: CookieStore, canSetCookies: boolean, cookieName: string) {
  return {
    getItem(key: string) {
      return cookieStore.get(key)?.value ?? cookieStore.get(cookieName)?.value ?? null;
    },
    setItem(key: string, value: string) {
      if (!canSetCookies) return;

      cookieStore.set({
        name: key,
        value,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: authCookieMaxAge
      });
    },
    removeItem(key: string) {
      if (!canSetCookies) return;

      cookieStore.set({
        name: key,
        value: "",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 0
      });
    }
  };
}

export async function createCookieSupabaseServerClient({
  canSetCookies = false
}: {
  canSetCookies?: boolean;
} = {}): Promise<SupabaseClient<MayhemDatabase>> {
  const config = getSupabasePublicConfig();
  const cookieStore = await cookies();
  const cookieName = getSupabaseAuthCookieName(config.url);

  return createClient<MayhemDatabase>(config.url, config.anonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: true,
      storageKey: cookieName,
      storage: createCookieStorage(cookieStore, canSetCookies, cookieName)
    }
  });
}
