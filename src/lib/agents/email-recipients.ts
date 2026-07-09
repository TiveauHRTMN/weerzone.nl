import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { preferencesFromProfile, type AgentPreferenceKey } from "@/lib/agents/preferences";
import { AGENT_SUBSCRIPTIONS_TABLE } from "@/lib/agents/subscriptions";

export interface AgentPlaceSubscription {
  subscriptionId: string;
  userId: string;
  email: string | null;
  province: string;
  placeSlug: string;
}

/**
 * Actieve abonnementen-per-plaats voor één agent (subscription-first, blijft
 * O(abonnees) — géén scan over alle users zoals enabledAgentAccounts).
 * Best-effort: zolang de agent_subscriptions-migratie nog niet live is, geeft
 * dit [] terug zodat de crons op de account-toggles-fallback blijven draaien.
 *
 * channel 'push' slaat het e-mail-opzoeken over (push gaat via push_devices).
 */
export async function activeAgentPlaceSubscriptions(
  admin: SupabaseClient,
  agent: AgentPreferenceKey,
  channel: "email" | "push" = "email",
): Promise<AgentPlaceSubscription[]> {
  const perPage = 1000;
  const rows: { id: string; user_id: string; province: string; place_slug: string }[] = [];

  for (let from = 0; ; from += perPage) {
    const { data, error } = await admin
      .from(AGENT_SUBSCRIPTIONS_TABLE)
      .select("id, user_id, province, place_slug")
      .eq("agent", agent)
      .eq("channel", channel)
      .is("unsubscribed_at", null)
      .range(from, from + perPage - 1);
    if (error) {
      console.error("[email-recipients] agent_subscriptions niet leesbaar:", error.message);
      return [];
    }
    rows.push(...((data ?? []) as typeof rows));
    if ((data?.length ?? 0) < perPage) break;
  }
  if (!rows.length) return [];

  if (channel === "push") {
    return rows.map((row) => ({
      subscriptionId: row.id,
      userId: row.user_id,
      email: null,
      province: row.province,
      placeSlug: row.place_slug,
    }));
  }

  // E-mail hoort bij het account (auth.users is source-of-truth, niet de
  // user_profile-spiegel) — per unieke abonnee ophalen, in kleine parallelle
  // batches. O(abonnees), geen volledige listUsers-scan.
  const uniqueUserIds = [...new Set(rows.map((row) => row.user_id))];
  const emails = new Map<string, string | null>();
  const batchSize = 20;
  for (let i = 0; i < uniqueUserIds.length; i += batchSize) {
    await Promise.all(
      uniqueUserIds.slice(i, i + batchSize).map(async (userId) => {
        try {
          const { data } = await admin.auth.admin.getUserById(userId);
          emails.set(userId, data?.user?.email ?? null);
        } catch {
          emails.set(userId, null);
        }
      }),
    );
  }

  return rows.map((row) => ({
    subscriptionId: row.id,
    userId: row.user_id,
    email: emails.get(row.user_id) ?? null,
    province: row.province,
    placeSlug: row.place_slug,
  }));
}

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
