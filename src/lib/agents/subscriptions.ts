import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AgentPreferenceKey } from "@/lib/agents/preferences";

/**
 * Abonnement-per-plaats (handoff 2026-07-10, blok a): een abonnement is
 * agent + plaats + kanaal op een auth.users-account. Schema:
 * supabase/migrations/20260709_agent_subscriptions.sql. Alle writes lopen via
 * de service role; de browser leest alleen eigen rijen (RLS owner-only).
 */

export const AGENT_SUBSCRIPTIONS_TABLE = "agent_subscriptions";

export type SubscriptionChannel = "email" | "push";

export interface AgentSubscriptionInput {
  userId: string;
  agent: AgentPreferenceKey;
  province: string;
  placeSlug: string;
  channel?: SubscriptionChannel;
}

export function isAgentKey(value: unknown): value is AgentPreferenceKey {
  return value === "piet" || value === "reed" || value === "koos";
}

/**
 * Maak of heractiveer een abonnement. Idempotent: bestaat de rij al, dan wordt
 * alleen unsubscribed_at gewist (opnieuw aanmelden = weer actief).
 */
export async function upsertAgentSubscription(
  admin: SupabaseClient,
  input: AgentSubscriptionInput,
): Promise<{ ok: boolean; reason?: string }> {
  const { error } = await admin.from(AGENT_SUBSCRIPTIONS_TABLE).upsert(
    {
      user_id: input.userId,
      agent: input.agent,
      province: input.province,
      place_slug: input.placeSlug,
      channel: input.channel ?? "email",
      unsubscribed_at: null,
    },
    { onConflict: "user_id,agent,province,place_slug,channel" },
  );
  if (error) return { ok: false, reason: error.message };
  return { ok: true };
}
