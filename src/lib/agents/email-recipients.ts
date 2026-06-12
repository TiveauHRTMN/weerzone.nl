import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { preferencesFromProfile, type AgentPreferenceKey } from "@/lib/agents/preferences";

export async function enabledAgentAccounts(
  admin: SupabaseClient,
  agent: AgentPreferenceKey,
): Promise<Map<string, string | null>> {
  const enabled = new Map<string, string | null>();
  const perPage = 1000;
  const profiles = new Map<string, { piet_on?: boolean | null; reed_on?: boolean | null; koos_on?: boolean | null }>();

  for (let from = 0; ; from += perPage) {
    const { data, error } = await admin
      .from("user_profile")
      .select("id, piet_on, reed_on, koos_on")
      .range(from, from + perPage - 1);
    if (error) throw error;
    for (const profile of data ?? []) profiles.set(profile.id, profile);
    if ((data?.length ?? 0) < perPage) break;
  }

  for (let page = 1; ; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    for (const user of data.users) {
      const preferences = preferencesFromProfile(profiles.get(user.id), user.user_metadata?.agent_preferences);
      if (preferences[agent]) enabled.set(user.id, user.email ?? null);
    }
    if (data.users.length < perPage) break;
  }

  return enabled;
}
