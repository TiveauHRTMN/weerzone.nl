import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const SUBSCRIBER_PREF_FIELDS = ["reed_on", "koos_on", "koos_pref", "active"] as const;
const KOOS_PREFS = new Set(["rain_avoider", "heat_avoider"]);

export interface PrefPatch {
  reed_on?: boolean;
  koos_on?: boolean;
  koos_pref?: string;
  active?: boolean;
}

export function sanitizePrefPatch(input: Record<string, unknown>): PrefPatch {
  const out: PrefPatch = {};
  if (typeof input.reed_on === "boolean") out.reed_on = input.reed_on;
  if (typeof input.koos_on === "boolean") out.koos_on = input.koos_on;
  if (typeof input.active === "boolean") out.active = input.active;
  if (typeof input.koos_pref === "string" && KOOS_PREFS.has(input.koos_pref)) out.koos_pref = input.koos_pref;
  return out;
}

export interface SubscriberPrefs {
  email: string;
  city: string | null;
  reed_on: boolean;
  koos_on: boolean;
  koos_pref: string;
  active: boolean;
}

export async function getSubscriberByToken(token: string): Promise<SubscriberPrefs | null> {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("subscribers")
    .select("email, city, reed_on, koos_on, koos_pref, active")
    .eq("manage_token", token)
    .maybeSingle();
  return (data as SubscriberPrefs) ?? null;
}

export async function updateSubscriberByToken(token: string, patch: PrefPatch): Promise<boolean> {
  if (Object.keys(patch).length === 0) return true;
  const supabase = createSupabaseAdminClient();
  const { error, count } = await supabase
    .from("subscribers")
    .update(patch, { count: "exact" })
    .eq("manage_token", token);
  return !error && (count ?? 0) > 0;
}
