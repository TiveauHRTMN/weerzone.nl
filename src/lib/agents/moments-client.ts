"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  AGENT_MOMENTS_TABLE,
  type AgentMoment,
  type MomentKind,
  type MomentTransport,
} from "@/lib/agents/moments-shared";

/**
 * Browser-CRUD op agent_moments (RLS owner-only, migratie 20260711).
 * Onboarding schrijft hier de antwoorden als momenten-rijen; de regiekamer
 * bewerkt dezelfde rijen. De cron leest ze server-side via de service role.
 */

export interface MomentInsert {
  kind: MomentKind;
  label: string;
  days: number[];
  windowStart: string;
  windowEnd: string;
  transport?: MomentTransport | null;
}

interface MomentRow {
  id: string;
  kind: MomentKind;
  label: string;
  days: number[];
  window_start: string;
  window_end: string;
  transport: MomentTransport | null;
}

function fromRow(row: MomentRow): AgentMoment {
  return {
    id: row.id,
    kind: row.kind,
    label: row.label,
    days: row.days ?? [],
    windowStart: row.window_start,
    windowEnd: row.window_end,
    transport: row.transport,
  };
}

function toRow(userId: string, m: MomentInsert) {
  return {
    user_id: userId,
    kind: m.kind,
    label: m.label,
    days: m.days,
    window_start: m.windowStart,
    window_end: m.windowEnd,
    transport: m.transport ?? null,
  };
}

export async function listMyMoments(supabase: SupabaseClient): Promise<AgentMoment[]> {
  const { data, error } = await supabase
    .from(AGENT_MOMENTS_TABLE)
    .select("id, kind, label, days, window_start, window_end, transport")
    .order("created_at", { ascending: true });
  if (error) return [];
  return ((data ?? []) as MomentRow[]).map(fromRow);
}

export async function insertMoment(
  supabase: SupabaseClient,
  userId: string,
  m: MomentInsert,
): Promise<{ ok: boolean }> {
  const { error } = await supabase.from(AGENT_MOMENTS_TABLE).insert(toRow(userId, m));
  return { ok: !error };
}

export async function updateMoment(
  supabase: SupabaseClient,
  id: string,
  patch: Partial<MomentInsert>,
): Promise<{ ok: boolean }> {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.kind !== undefined) row.kind = patch.kind;
  if (patch.label !== undefined) row.label = patch.label;
  if (patch.days !== undefined) row.days = patch.days;
  if (patch.windowStart !== undefined) row.window_start = patch.windowStart;
  if (patch.windowEnd !== undefined) row.window_end = patch.windowEnd;
  if (patch.transport !== undefined) row.transport = patch.transport;
  const { error } = await supabase.from(AGENT_MOMENTS_TABLE).update(row).eq("id", id);
  return { ok: !error };
}

export async function deleteMoment(supabase: SupabaseClient, id: string): Promise<{ ok: boolean }> {
  const { error } = await supabase.from(AGENT_MOMENTS_TABLE).delete().eq("id", id);
  return { ok: !error };
}

/** Onboarding is de bron: nieuwe set erin, daarná de oude rijen weg —
 *  zo blijft bij een mislukte insert de bestaande set staan. */
export async function replaceOnboardingMoments(
  supabase: SupabaseClient,
  userId: string,
  moments: MomentInsert[],
): Promise<{ ok: boolean }> {
  const { data: existing, error: listError } = await supabase
    .from(AGENT_MOMENTS_TABLE)
    .select("id")
    .eq("user_id", userId);
  if (listError) return { ok: false };
  if (moments.length) {
    const { error } = await supabase.from(AGENT_MOMENTS_TABLE).insert(moments.map((m) => toRow(userId, m)));
    if (error) return { ok: false };
  }
  const oldIds = ((existing ?? []) as { id: string }[]).map((r) => r.id);
  if (oldIds.length) {
    // Mislukt dit, dan staan er tijdelijk dubbelen — een volgende run ruimt op.
    const { error: delError } = await supabase.from(AGENT_MOMENTS_TABLE).delete().in("id", oldIds);
    if (delError) return { ok: false };
  }
  return { ok: true };
}

/** Onboarding-antwoorden (spec §3C) → momenten-rijen. Puur; smoketestbaar. */
export type OnboardingTransport = "bike" | "ov" | "car" | "home";
export type OnboardingDepart = "voor8" | "8tot9" | "na9";
export type OnboardingHome = "rond17" | "rond18" | "later";
export type OnboardingOutdoor = "dog" | "sport" | "laundry" | "garden";

const DEPART_WINDOW: Record<OnboardingDepart, [string, string]> = {
  voor8: ["07:00", "08:00"],
  "8tot9": ["08:00", "09:00"],
  na9: ["09:00", "10:00"],
};
const HOME_WINDOW: Record<OnboardingHome, [string, string]> = {
  rond17: ["16:30", "17:30"],
  rond18: ["17:30", "18:30"],
  later: ["18:30", "20:00"],
};

export function buildOnboardingMoments(
  transport: OnboardingTransport | null,
  depart: OnboardingDepart,
  home: OnboardingHome,
  outdoor: OnboardingOutdoor[],
): MomentInsert[] {
  const out: MomentInsert[] = [];
  if (transport && transport !== "home") {
    const t = transport === "bike" ? "bike" : transport === "ov" ? "ov" : "car";
    const [ds, de] = DEPART_WINDOW[depart];
    const [hs, he] = HOME_WINDOW[home];
    out.push(
      { kind: "commute", label: "Ochtendrit", days: [1, 2, 3, 4, 5], windowStart: ds, windowEnd: de, transport: t },
      { kind: "commute", label: "Avondrit", days: [1, 2, 3, 4, 5], windowStart: hs, windowEnd: he, transport: t },
    );
  }
  if (outdoor.includes("dog")) {
    out.push(
      { kind: "dog", label: "Ochtendronde", days: [1, 2, 3, 4, 5, 6, 7], windowStart: "07:00", windowEnd: "08:00" },
      { kind: "dog", label: "Avondronde", days: [1, 2, 3, 4, 5, 6, 7], windowStart: "21:00", windowEnd: "22:00" },
    );
  }
  if (outdoor.includes("sport")) {
    out.push({ kind: "sport", label: "Sport of hardlopen", days: [1, 2, 3, 4, 5, 6, 7], windowStart: "17:00", windowEnd: "20:30" });
  }
  if (outdoor.includes("laundry")) {
    out.push({ kind: "laundry", label: "Was buiten", days: [6, 7], windowStart: "10:00", windowEnd: "16:00" });
  }
  if (outdoor.includes("garden")) {
    out.push({ kind: "outdoor", label: "Tuin", days: [6, 7], windowStart: "10:00", windowEnd: "17:00" });
  }
  return out;
}
