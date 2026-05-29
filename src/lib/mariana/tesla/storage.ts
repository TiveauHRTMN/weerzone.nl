/**
 * Mariana Tesla — persistentie (Supabase).
 *
 * Bewaart elke TeslaRun in tabel `mariana_tesla` zodat Mariana/Reed de laatste
 * convectieve diagnose per regio kunnen lezen. Defensief: faalt zacht als de
 * service-role env ontbreekt (lokaal/dev) — Tesla blijft dan werken, alleen
 * zonder opslag.
 *
 * Schema: supabase/migrations/20260530_mariana_tesla.sql
 */

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { TeslaRun } from "./types";

const TABLE = "mariana_tesla";

function hasServiceRole(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL);
}

/**
 * Losjes getypte admin-client. Bewust `any` op de query-builder: het volledige
 * TeslaSignal-object als jsonb-waarde door Supabase's insert-generics laten
 * relateren laat de TS-checker exploderen (V8 Map-limiet). jsonb-kolommen hebben
 * toch alleen `unknown` nodig — type-veiligheid zit in TeslaRun/rowFromRun.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adminDb(): any {
  return createSupabaseAdminClient();
}

interface TeslaRow {
  region_slug: string;
  region_name: string;
  lat: number;
  lon: number;
  run_at: string;
  valid_from: string;
  valid_until: string;
  trigger: string;
  model: string;
  tesla_signal: string;
  reed_action: string;
  confidence: Record<string, unknown>;
  signal: Record<string, unknown>;
}

function rowFromRun(run: TeslaRun): TeslaRow {
  return {
    region_slug: run.regionSlug,
    region_name: run.regionName,
    lat: run.lat,
    lon: run.lon,
    run_at: run.runAt,
    valid_from: run.validFrom,
    valid_until: run.validUntil,
    trigger: run.trigger,
    model: run.model,
    tesla_signal: run.signal.tesla_signal,
    reed_action: run.signal.reed_action,
    confidence: { ...run.signal.confidence },
    signal: run.signal as unknown as Record<string, unknown>,
  };
}

export async function saveTeslaRun(
  run: TeslaRun
): Promise<{ ok: boolean; id?: string; reason?: string }> {
  if (!hasServiceRole()) {
    return { ok: false, reason: "supabase service-role ontbreekt — run niet opgeslagen" };
  }
  try {
    const { data, error } = await adminDb()
      .from(TABLE)
      .insert(rowFromRun(run))
      .select("id")
      .single();
    if (error) return { ok: false, reason: error.message };
    return { ok: true, id: (data as { id?: string } | null)?.id };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : String(err) };
  }
}

/** Slaat meerdere runs best-effort op; geeft tellingen terug, gooit nooit. */
export async function saveTeslaRuns(
  runs: TeslaRun[]
): Promise<{ saved: number; failed: number; reasons: string[] }> {
  let saved = 0;
  let failed = 0;
  const reasons: string[] = [];
  for (const run of runs) {
    const res = await saveTeslaRun(run);
    if (res.ok) saved++;
    else {
      failed++;
      if (res.reason && !reasons.includes(res.reason)) reasons.push(res.reason);
    }
  }
  return { saved, failed, reasons };
}

/** Laatste TeslaRun-signaal per regio (meest recente run_at). */
export async function loadLatestTeslaRun(regionSlug: string): Promise<TeslaRun | null> {
  if (!hasServiceRole()) return null;
  try {
    const { data, error } = await adminDb()
      .from(TABLE)
      .select("region_slug, region_name, lat, lon, run_at, valid_from, valid_until, trigger, model, signal")
      .eq("region_slug", regionSlug)
      .order("run_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    const row = data as Record<string, unknown>;
    return {
      regionSlug: String(row.region_slug),
      regionName: String(row.region_name),
      lat: Number(row.lat),
      lon: Number(row.lon),
      runAt: String(row.run_at),
      validFrom: String(row.valid_from),
      validUntil: String(row.valid_until),
      trigger: row.trigger as TeslaRun["trigger"],
      model: String(row.model),
      signal: row.signal as TeslaRun["signal"],
    };
  } catch {
    return null;
  }
}
