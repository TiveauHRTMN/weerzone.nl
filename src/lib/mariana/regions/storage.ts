/**
 * Mariana Regions — persistentie (Supabase).
 *
 * Bewaart MarianaRuns (per REGIO) in tabel `mariana_regions`. Best-effort: faalt
 * zacht zonder service-role (lokaal/dev). Gedenormaliseerde kolommen + het
 * volledige signaal + het voederkanaal (local_feed) als jsonb.
 *
 * Mariana Local leest hieruit: loadRegionFeed(slug) / nearestRegionFeed(lat,lon)
 * geeft de MarianaLocalFeed van de meest recente run terug.
 *
 * Schema: supabase/migrations/20260530_mariana_regions.sql
 */

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { nearestTeslaRegion } from "./nearest-region";
import type { MarianaRun, MarianaLocalFeed, MarianaSignal } from "./types";

const TABLE = "mariana_regions";

function hasServiceRole(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adminDb(): any {
  return createSupabaseAdminClient();
}

interface MarianaRow {
  region_slug: string;
  region_name: string;
  lat: number;
  lon: number;
  run_at: string;
  trigger: string;
  model: string;
  oracle_context_used: boolean;
  tesla_context_used: boolean;
  refer_to_reed: boolean;
  signal: Record<string, unknown>;
  local_feed: Record<string, unknown>;
}

function rowFromRun(run: MarianaRun): MarianaRow {
  return {
    region_slug: run.regionSlug,
    region_name: run.regionName,
    lat: run.lat,
    lon: run.lon,
    run_at: run.runAt,
    trigger: run.trigger,
    model: run.model,
    oracle_context_used: run.signal.oracle_context_used,
    tesla_context_used: run.signal.tesla_context_used,
    refer_to_reed: run.signal.agent_outputs.piet.refer_to_reed,
    signal: run.signal as unknown as Record<string, unknown>,
    local_feed: run.local_feed as unknown as Record<string, unknown>,
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

/** Laatste MarianaLocalFeed voor een regio-slug (meest recente run). */
export async function loadRegionFeed(regionSlug: string): Promise<MarianaLocalFeed | null> {
  if (!hasServiceRole()) return null;
  try {
    const { data, error } = await adminDb()
      .from(TABLE)
      .select("local_feed, run_at")
      .eq("region_slug", regionSlug)
      .order("run_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    const feed = (data as { local_feed?: unknown }).local_feed;
    return feed ? (feed as MarianaLocalFeed) : null;
  } catch {
    return null;
  }
}

/**
 * MarianaLocalFeed voor een locatie: mapt naar de dichtstbijzijnde mesoschaal-
 * regio en geeft die feed terug. Dit is het leespunt voor Mariana Local — de
 * 10.000 paginas raken hiermee nooit een LLM, alleen de opgeslagen dag-duiding.
 */
export async function nearestRegionFeed(lat: number, lon: number): Promise<MarianaLocalFeed | null> {
  const region = nearestTeslaRegion(lat, lon);
  return loadRegionFeed(region.slug);
}

/**
 * Laatste volledige MarianaSignal voor een regio-slug (meest recente run).
 * Leest de rijke `signal`-kolom — de duiding die Piet/Koos/Reed nodig hebben,
 * naast de compacte local_feed. Best-effort: faalt zacht zonder service-role.
 */
export async function loadRegionSignal(regionSlug: string): Promise<MarianaSignal | null> {
  if (!hasServiceRole()) return null;
  try {
    const { data, error } = await adminDb()
      .from(TABLE)
      .select("signal, run_at")
      .eq("region_slug", regionSlug)
      .order("run_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    const signal = (data as { signal?: unknown }).signal;
    return signal ? (signal as MarianaSignal) : null;
  } catch {
    return null;
  }
}

/**
 * Volledig MarianaSignal voor een locatie: mapt naar de dichtstbijzijnde
 * mesoschaal-regio en geeft die rijke duiding terug. Leespunt voor de
 * persoonlijke surfaces (Piet/Koos) — niet voor de 10K-pagina's in het hete pad.
 */
export async function nearestRegionSignal(
  lat: number,
  lon: number,
): Promise<MarianaSignal | null> {
  const region = nearestTeslaRegion(lat, lon);
  return loadRegionSignal(region.slug);
}
