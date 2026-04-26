"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { PERSONA_ORDER, type PersonaTier } from "@/lib/personas";
import { isFounderEmail, FOUNDER_TIER } from "@/lib/founders";

interface SessionState {
  user: User | null;
  tier: PersonaTier | null;
  isFounder: boolean;
  primaryLocation: { name: string; lat: number; lon: number } | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionState>({
  user: null,
  tier: null,
  isFounder: false,
  primaryLocation: null,
  loading: true,
  refresh: async () => {},
});

export function useSession() {
  return useContext(SessionContext);
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [tier, setTier] = useState<PersonaTier | null>(null);
  const [isFounder, setIsFounder] = useState(false);
  const [primaryLocation, setPrimaryLocation] = useState<{ name: string; lat: number; lon: number } | null>(null);
  const [loading, setLoading] = useState(true);

  async function hydrate() {
    const { data: userData } = await supabase.auth.getUser();
    const u = userData.user ?? null;
    setUser(u);
    if (!u) {
      setTier(null);
      setIsFounder(false);
      setPrimaryLocation(null);
      setLoading(false);
      return;
    }

    // Parallel fetch: subs and primary location
    const [subsRes, locRes] = await Promise.all([
      supabase
        .from("subscriptions")
        .select("tier, status")
        .eq("user_id", u.id)
        .in("status", ["trialing", "active"]),
      supabase
        .from("user_locations")
        .select("label, lat, lon")
        .eq("user_id", u.id)
        .eq("is_primary", true)
        .maybeSingle()
    ]);

    const activeSubs = subsRes.data || [];
    const tierRanking: Record<string, number> = { steve: 3, reed: 2, piet: 1, free: 0 };
    const sortedSubs = activeSubs.sort((a, b) => 
      (tierRanking[b.tier] ?? 0) - (tierRanking[a.tier] ?? 0)
    );
    
    const founderCheck = isFounderEmail(u.email);
    setIsFounder(founderCheck);
    let t = (sortedSubs[0]?.tier ?? null) as PersonaTier | null;
    if (!t && founderCheck) t = FOUNDER_TIER;
    setTier(t && PERSONA_ORDER.includes(t) ? t : null);

    if (locRes.data) {
      setPrimaryLocation({
        name: locRes.data.label,
        lat: locRes.data.lat,
        lon: locRes.data.lon
      });
    } else {
      setPrimaryLocation(null);
    }

    setLoading(false);
  }

  useEffect(() => {
    hydrate();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      hydrate();
    });
    return () => listener.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SessionContext.Provider value={{ user, tier, isFounder, primaryLocation, loading, refresh: hydrate }}>
      {children}
    </SessionContext.Provider>
  );
}
