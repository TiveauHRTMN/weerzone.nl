/**
 * Mariana Oracle — persistentie (Supabase).
 *
 * Bewaart elke OracleRun in tabel `mariana_oracle` zodat Mariana de laatste
 * regimecontext + gate kan lezen. Defensief: faalt zacht als de service-role
 * env ontbreekt (lokaal/dev) — Oracle blijft dan werken, alleen zonder opslag.
 *
 * Schema: supabase/migrations/20260530_mariana_oracle.sql
 */

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { OracleRun } from "./types";

const TABLE = "mariana_oracle";

function hasServiceRole(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL);
}

/**
 * Losjes getypte admin-client. Bewust `any` op de query-builder: het volledige
 * OracleSignal-object als jsonb-waarde door Supabase's insert-generics laten
 * relateren laat de TS-checker exploderen (V8 Map-limiet). jsonb-kolommen hebben
 * toch alleen `unknown` nodig — type-veiligheid zit in OracleRun/rowFromRun.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adminDb(): any {
  return createSupabaseAdminClient();
}

interface OracleRow {
  run_at: string;
  valid_from: string;
  valid_until: string;
  trigger: string;
  model: string;
  dominant_regime: string;
  convective_gate: string;
  run_tesla: boolean;
  confidence: Record<string, unknown>;
  signal: Record<string, unknown>;
}

function rowFromRun(run: OracleRun): OracleRow {
  return {
    run_at: run.runAt,
    valid_from: run.validFrom,
    valid_until: run.validUntil,
    trigger: run.trigger,
    model: run.model,
    dominant_regime: run.signal.dominant_regime,
    convective_gate: run.signal.convective_gate,
    run_tesla: run.signal.run_tesla,
    confidence: { ...run.signal.confidence },
    signal: run.signal as unknown as Record<string, unknown>,
  };
}

export async function saveOracleRun(
  run: OracleRun
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

/** Laatste OracleRun-signaal (meest recente run_at). */
export async function loadLatestOracleRun(): Promise<OracleRun | null> {
  if (!hasServiceRole()) return null;
  try {
    const { data, error } = await adminDb()
      .from(TABLE)
      .select("run_at, valid_from, valid_until, trigger, model, signal")
      .order("run_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    const row = data as Record<string, unknown>;
    return {
      runAt: String(row.run_at),
      validFrom: String(row.valid_from),
      validUntil: String(row.valid_until),
      trigger: row.trigger as OracleRun["trigger"],
      model: String(row.model),
      signal: row.signal as OracleRun["signal"],
    };
  } catch {
    return null;
  }
}
