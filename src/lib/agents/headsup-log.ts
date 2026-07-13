import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Dedup + dagbudget voor heads-up-pushes (spec 2026-07-10 §3B).
 * Schema: supabase/migrations/20260711_agent_headsup_push.sql. Fail-soft:
 * zonder tabel geen state → de cron pusht dan niets dubbel omdat
 * selectWithinBudget op een lege set draait maar loggen faalt zacht;
 * in de praktijk is de migratie vóór de deploy live.
 */

export const AGENT_HEADSUP_LOG_TABLE = "agent_headsup_log";

export interface PushState {
  sentKeys: Set<string>;
  countsByAgent: Map<string, number>;
}

/** Middernacht NL (Europe/Amsterdam) van de dag van `now`, als UTC-Date. */
export function nlDayStart(now: Date): Date {
  const dateISO = now.toLocaleDateString("sv-SE", { timeZone: "Europe/Amsterdam" });
  const probe = new Date(`${dateISO}T12:00:00Z`);
  const nlHourAtProbe = parseInt(
    probe.toLocaleTimeString("nl-NL", { hour: "2-digit", timeZone: "Europe/Amsterdam", hour12: false }),
    10,
  );
  const offsetHours = nlHourAtProbe - 12;
  return new Date(Date.parse(`${dateISO}T00:00:00Z`) - offsetHours * 3600_000);
}

export async function loadPushState(
  admin: SupabaseClient,
  userIds: string[],
  dayStart: Date,
): Promise<Map<string, PushState>> {
  const out = new Map<string, PushState>();
  if (!userIds.length) return out;
  const since = new Date(Date.now() - 48 * 3600_000).toISOString();
  const { data, error } = await admin
    .from(AGENT_HEADSUP_LOG_TABLE)
    .select("user_id, agent, headsup_key, sent_at")
    .in("user_id", userIds)
    .gte("sent_at", since);
  if (error) {
    console.error("[headsup-log] niet leesbaar:", error.message);
    return out;
  }
  for (const row of (data ?? []) as { user_id: string; agent: string; headsup_key: string; sent_at: string }[]) {
    if (!out.has(row.user_id)) out.set(row.user_id, { sentKeys: new Set(), countsByAgent: new Map() });
    const state = out.get(row.user_id)!;
    state.sentKeys.add(row.headsup_key);
    if (new Date(row.sent_at) >= dayStart) {
      state.countsByAgent.set(row.agent, (state.countsByAgent.get(row.agent) ?? 0) + 1);
    }
  }
  return out;
}

export async function logPushed(
  admin: SupabaseClient,
  rows: { userId: string; agent: string; province: string; placeSlug: string; key: string; category: string; severity: string }[],
): Promise<void> {
  if (!rows.length) return;
  const { error } = await admin.from(AGENT_HEADSUP_LOG_TABLE).upsert(
    rows.map((r) => ({
      user_id: r.userId,
      agent: r.agent,
      province: r.province,
      place_slug: r.placeSlug,
      headsup_key: r.key,
      category: r.category,
      severity: r.severity,
    })),
    { onConflict: "user_id,headsup_key", ignoreDuplicates: true },
  );
  if (error) console.error("[headsup-log] loggen faalde:", error.message);
}

export type HeadsupBudget = "moments_only" | "standard" | "low";

export interface HeadsupProfile {
  budget: HeadsupBudget;
  routinePaused: boolean;
  /** "YYYY-MM-DD" of null — stil t/m die datum (vakantiestand / vandaag vrij). */
  pausedUntil: string | null;
  freedayHeadsup: boolean;
}

export const DEFAULT_PROFILE: HeadsupProfile = {
  budget: "standard",
  routinePaused: false,
  pausedUntil: null,
  freedayHeadsup: false,
};

/** Heads-up-voorkeuren per gebruiker (user_profile). Fail-soft: lege map ⇒
 *  defaults; pre-migratie (20260713) valt terug op alleen het budget. */
export async function loadHeadsupProfiles(
  admin: SupabaseClient,
  userIds: string[],
): Promise<Map<string, HeadsupProfile>> {
  const out = new Map<string, HeadsupProfile>();
  if (!userIds.length) return out;
  const full = await admin
    .from("user_profile")
    .select("id, headsup_budget, routine_paused, paused_until, freeday_headsup")
    .in("id", userIds);
  const res = full.error
    ? await admin.from("user_profile").select("id, headsup_budget").in("id", userIds)
    : full;
  if (res.error) {
    console.error("[headsup-log] profiel niet leesbaar:", res.error.message);
    return out;
  }
  for (const row of (res.data ?? []) as {
    id: string; headsup_budget: string | null;
    routine_paused?: boolean | null; paused_until?: string | null; freeday_headsup?: boolean | null;
  }[]) {
    out.set(row.id, {
      budget:
        row.headsup_budget === "moments_only" || row.headsup_budget === "low"
          ? row.headsup_budget
          : "standard",
      routinePaused: row.routine_paused ?? false,
      pausedUntil: row.paused_until ?? null,
      freedayHeadsup: row.freeday_headsup ?? false,
    });
  }
  return out;
}
