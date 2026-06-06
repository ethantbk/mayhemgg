export type { MayhemDatabase, MayhemTableName } from "@/lib/supabase/database.types";
export { createCookieSupabaseServerClient } from "@/lib/supabase/auth";
export { createBrowserSupabaseClient, getBrowserSupabaseClient } from "@/lib/supabase/client";
export {
  getSupabasePublicConfig,
  isSupabasePublicConfigAvailable,
  SupabaseConfigError,
  type SupabasePublicConfig
} from "@/lib/supabase/config";
export {
  DatabaseError,
  safeSupabaseQuery,
  toDatabaseError,
  unwrapSupabaseResponse,
  type DatabaseResult
} from "@/lib/supabase/errors";
