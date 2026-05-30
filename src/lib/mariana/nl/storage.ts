/**
 * Mariana NL — persistentie (Supabase).
 *
 * Bewaart MarianaRuns (per locatie) in tabel `mariana_nl`. Best-effort: faalt
 * zacht zonder service-role (lokaal/dev). Gedenormaliseerde kolommen voor snelle
 * filtering; het volledige signaal als jsonb.
 *
 * Schema: supabase/migrations/20260530_mariana_nl.sql
 */

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { MarianaRun } from "./types";

const TABLE = "mariana_nl";

function hasServiceRole(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adminDb(): any {
  return createSupabaseAdminClient();
}

interface MarianaRow {
  location_name: string;
  lat: number;
  lon: number;
  run_at: string;
  trigger: string;
  model: string;
  oracle_context_used: boolean;
  tesla_context_used: boolean;
  refer_to_reed: boolean;
  signal: Record<string, unknown>;
}

function rowFromRun(run: MarianaRun): MarianaRow {
  return {
    location_name: run.locationName,
    lat: run.lat,
    lon: run.lon,
    run_at: run.runAt,
    trigger: run.trigger,
    model: run.model,
    oracle_context_used: run.signal.oracle_context_used,
    tesla_context_used: run.signal.tesla_context_used,
    refer_to_reed: run.signal.agent_outputs.piet.refer_to_reed,
    signal: run.signal as unknown as Record<string, unknown>,
  };
}

export async function saveMarianaRun(
  run: MarianaRun
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
