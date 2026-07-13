import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AgentMoment, MomentKind, MomentTransport } from "@/lib/agents/moments-shared";
import { AGENT_MOMENTS_TABLE } from "@/lib/agents/moments-shared";

export {
  AGENT_MOMENTS_TABLE,
  type MomentKind,
  type MomentTransport,
  type AgentMoment,
} from "@/lib/agents/moments-shared";

/**
 * Persoonlijke momenten (spec 2026-07-10 §3C): het ritme van de gebruiker —
 * woon-werk, hond, was, sport — waarop de heads-up-pushes gefilterd worden.
 * Schema: supabase/migrations/20260711_agent_headsup_push.sql. Onboarding
 * (plan 2) schrijft deze rijen; de cron leest ze via de service role.
 */

export interface MomentWindow {
  moment: AgentMoment;
  start: Date;
  end: Date;
}

/** ISO-weekdag (1=ma..7=zo) van een datum in NL-tijd. */
function nlIsoWeekday(day: Date): number {
  const short = day.toLocaleDateString("en-US", { weekday: "short", timeZone: "Europe/Amsterdam" });
  return { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }[short] ?? 1;
}

/** Date voor "HH:MM(:SS)" op de NL-kalenderdag van `day`. */
function nlTimeOnDay(day: Date, hhmm: string): Date {
  const dateISO = day.toLocaleDateString("sv-SE", { timeZone: "Europe/Amsterdam" });
  const [h, m] = hhmm.split(":").map((v) => parseInt(v, 10));
  // NL-offset op die dag bepalen: neem 12:00Z en kijk hoe laat het dan in NL is.
  const probe = new Date(`${dateISO}T12:00:00Z`);
  const nlHourAtProbe = parseInt(
    probe.toLocaleTimeString("nl-NL", { hour: "2-digit", timeZone: "Europe/Amsterdam", hour12: false }),
    10,
  );
  const offsetHours = nlHourAtProbe - 12; // 1 (CET) of 2 (CEST)
  return new Date(Date.parse(`${dateISO}T00:00:00Z`) + ((h - offsetHours) * 60 + (m || 0)) * 60_000);
}

/** Vensters van deze momenten op de NL-dag van `day` (leeg = geen momenten die dag). */
export function momentWindowsForDay(moments: AgentMoment[], day: Date): MomentWindow[] {
  const weekday = nlIsoWeekday(day);
  return moments
    .filter((moment) => moment.days.includes(weekday))
    .map((moment) => ({
      moment,
      start: nlTimeOnDay(day, moment.windowStart),
      end: nlTimeOnDay(day, moment.windowEnd),
    }))
    .filter((w) => w.end > w.start);
}

/** Momenten per gebruiker, één query. Fail-soft: lege map. */
export async function loadMomentsForUsers(
  admin: SupabaseClient,
  userIds: string[],
): Promise<Map<string, AgentMoment[]>> {
  const out = new Map<string, AgentMoment[]>();
  if (!userIds.length) return out;
  const full = await admin
    .from(AGENT_MOMENTS_TABLE)
    .select("id, user_id, kind, label, days, window_start, window_end, transport, date, province, place_slug")
    .in("user_id", userIds);
  // Pre-migratie-fallback (20260713): oude kolommenset, dagplan-velden null.
  const res = full.error
    ? await admin
        .from(AGENT_MOMENTS_TABLE)
        .select("id, user_id, kind, label, days, window_start, window_end, transport")
        .in("user_id", userIds)
    : full;
  if (res.error) {
    console.error("[moments] agent_moments niet leesbaar:", res.error.message);
    return out;
  }
  for (const raw of (res.data ?? []) as {
    id: string; user_id: string; kind: MomentKind; label: string;
    days: number[]; window_start: string; window_end: string; transport: MomentTransport | null;
    date?: string | null; province?: string | null; place_slug?: string | null;
  }[]) {
    if (!out.has(raw.user_id)) out.set(raw.user_id, []);
    out.get(raw.user_id)!.push({
      id: raw.id,
      kind: raw.kind,
      label: raw.label,
      days: raw.days ?? [],
      windowStart: raw.window_start,
      windowEnd: raw.window_end,
      transport: raw.transport,
      date: raw.date ?? null,
      province: raw.province ?? null,
      placeSlug: raw.place_slug ?? null,
    });
  }
  return out;
}
