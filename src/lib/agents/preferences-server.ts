import "server-only";

import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";
import { getUserWithDeadline } from "@/lib/auth-deadline";
import {
  ALL_AGENT_PREFERENCES,
  preferencesFromProfile,
  type AgentPreferences,
} from "@/lib/agents/preferences";

export const getAgentPreferences = cache(async (): Promise<AgentPreferences> => {
  const supabase = await createSupabaseServerClient();
  // Zonder deadline bepaalt deze call de rendertijd van /vandaag: hij zit in de
  // Promise.all van de pagina, en een onbereikbare auth-backend kost ~8 s.
  const user = await getUserWithDeadline<User>(supabase, "getAgentPreferences");

  if (!user) return ALL_AGENT_PREFERENCES;

  const { data: profile } = await supabase
    .from("user_profile")
    .select("piet_on, reed_on, koos_on")
    .eq("id", user.id)
    .maybeSingle();

  return preferencesFromProfile(profile, user.user_metadata?.agent_preferences);
});
