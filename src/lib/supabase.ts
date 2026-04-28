import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Supabase configuratie
// Maak een project aan op https://supabase.com en vul deze waarden in

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (_supabase) return _supabase;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key || !url.startsWith("http")) {
    console.warn("[Supabase] Missing config:", { url: !!url, key: !!key });
    return null;
  }
  try {
    _supabase = createClient(url, key);
    return _supabase;
  } catch {
    return null;
  }
}

export function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || !url.startsWith("http")) {
    return null;
  }
  try {
    return createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  } catch {
    return null;
  }
}

// Backwards compat — lazy proxy that won't crash at build time
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabase();
    if (!client) throw new Error("Supabase niet geconfigureerd");
    return (client as unknown as Record<string, unknown>)[prop as string];
  },
});

// Database types
export interface UserProfile {
  id: string;
  email: string;
  postcode: string;
  city?: string;
  created_at: string;
  alerts_enabled: boolean;
  alert_types: string[]; // ["onweer", "storm", "hitte", "vorst"]
}

// Check of Supabase geconfigureerd is
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  return Boolean(url && key && url.startsWith("http") && key !== "jouw-supabase-anon-key");
}
