export type { MayhemDatabase, MayhemTableName } from "@/lib/supabase/database.types";
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
