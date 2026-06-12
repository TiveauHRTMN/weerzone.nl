import "server-only";

import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  ALL_AGENT_PREFERENCES,
  preferencesFromProfile,
  type AgentPreferences,
} from "@/lib/agents/preferences";

export const getAgentPreferences = cache(async (): Promise<AgentPreferences> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return ALL_AGENT_PREFERENCES;

  const { data: profile } = await supabase
    .from("user_profile")
    .select("piet_on, reed_on, koos_on")
    .eq("id", user.id)
    .maybeSingle();

  return preferencesFromProfile(profile, user.user_metadata?.agent_preferences);
});
