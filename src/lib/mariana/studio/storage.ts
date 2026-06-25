/**
 * Mariana Studio — persistentie (Supabase).
 * Soft-fail als service-role ontbreekt (lokaal/dev): generatie blijft werken.
 * Schema: supabase/migrations/20260625_mariana_studio.sql
 */

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { StudioDay } from "./types";

const TABLE = "mariana_studio";

function hasServiceRole(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adminDb(): any {
  return createSupabaseAdminClient();
}

export async function saveStudioDay(day: StudioDay): Promise<{ ok: boolean }> {
  if (!hasServiceRole()) return { ok: false };
  try {
    const { error } = await adminDb().from(TABLE).insert({
      run_at: day.runAt,
      forecast_date: day.forecastDate,
      slide1: day.slide1,
      slide2: day.slide2,
      slide3: day.slide3,
      slide4: day.slide4,
    });
    return { ok: !error };
  } catch {
    return { ok: false };
  }
}

export async function loadLatestStudioDay(): Promise<StudioDay | null> {
  if (!hasServiceRole()) return null;
  try {
    const { data } = await adminDb()
      .from(TABLE).select("*").order("run_at", { ascending: false }).limit(1).maybeSingle();
    if (!data) return null;
    return {
      forecastDate: data.forecast_date,
      runAt: data.run_at,
      slide1: data.slide1,
      slide2: data.slide2,
      slide3: data.slide3,
      slide4: data.slide4 ?? null,
    };
  } catch {
    return null;
  }
}
