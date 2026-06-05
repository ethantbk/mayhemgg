import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig, SupabaseConfigError } from "@/lib/supabase/config";
import type { MayhemDatabase } from "@/lib/supabase/database.types";

type ServerClientOptions = {
  useServiceRole?: boolean;
};

function getSupabaseServiceRoleKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key) {
    throw new SupabaseConfigError("Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY");
  }

  return key;
}

export function createServerSupabaseClient(options: ServerClientOptions = {}): SupabaseClient<MayhemDatabase> {
  const config = getSupabasePublicConfig();
  const key = options.useServiceRole ? getSupabaseServiceRoleKey() : config.anonKey;

  return createClient<MayhemDatabase>(config.url, key, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false
    }
  });
}

export function createServiceRoleSupabaseClient() {
  return createServerSupabaseClient({ useServiceRole: true });
}
