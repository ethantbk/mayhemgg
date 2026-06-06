import "server-only";

import type { User } from "@supabase/supabase-js";
import { isSupabasePublicConfigAvailable } from "@/lib/supabase/config";
import { createCookieSupabaseServerClient } from "@/lib/supabase/auth";
import { getChaosLabCreatorByAuthUserId } from "@/server/repositories/chaosLabRepository";
import type { ChaosLabCreator } from "@/types/chaosLab";

export type ChaosCreatorSession = {
  user: User;
  creator: ChaosLabCreator | null;
};

export async function getCurrentSupabaseUser(): Promise<User | null> {
  if (!isSupabasePublicConfigAvailable()) {
    return null;
  }

  try {
    const supabase = await createCookieSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      return null;
    }

    return data.user ?? null;
  } catch {
    return null;
  }
}

export async function getCurrentChaosCreatorSession(): Promise<ChaosCreatorSession | null> {
  const user = await getCurrentSupabaseUser();

  if (!user) {
    return null;
  }

  return {
    user,
    creator: await getChaosLabCreatorByAuthUserId(user.id)
  };
}
