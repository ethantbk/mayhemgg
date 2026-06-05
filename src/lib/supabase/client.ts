"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import type { MayhemDatabase } from "@/lib/supabase/database.types";

let browserClient: SupabaseClient<MayhemDatabase> | null = null;

export function createBrowserSupabaseClient() {
  const config = getSupabasePublicConfig();

  return createClient<MayhemDatabase>(config.url, config.anonKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true
    }
  });
}

export function getBrowserSupabaseClient() {
  browserClient ??= createBrowserSupabaseClient();
  return browserClient;
}
