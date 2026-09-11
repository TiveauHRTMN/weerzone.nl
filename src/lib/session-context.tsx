"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getUserWithDeadline } from "@/lib/auth-deadline";
import { PERSONA_ORDER, type PersonaTier } from "@/lib/personas";
import { isFounderEmail, FOUNDER_TIER } from "@/lib/founders";
import {
  ALL_AGENT_PREFERENCES,
  preferencesFromProfile,
  type AgentPreferences,
} from "@/lib/agents/preferences";

interface SessionState {
  user: User | null;
  tier: PersonaTier | null;
  isFounder: boolean;
  agentPreferences: AgentPreferences;
  primaryLocation: { name: string; lat: number; lon: number } | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionState>({
  user: null,
  tier: null,
  isFounder: false,
  agentPreferences: ALL_AGENT_PREFERENCES,
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
  const [agentPreferences, setAgentPreferences] = useState<AgentPreferences>(ALL_AGENT_PREFERENCES);
  const [primaryLocation, setPrimaryLocation] = useState<{ name: string; lat: number; lon: number } | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Belangrijk: `loading` moet ALTIJD op false eindigen, ook als de
   * auth-backend onbereikbaar is. Stond dit er niet, dan gooide hydrate() bij
   * een netwerkfout en werd `setLoading(false)` nooit bereikt — `loading` bleef
   * dan eeuwig true en elk onderdeel dat daarop wacht (de navigatie, de
   * homepage-onboarding, de weerkaarten) bleef in zijn lege staat hangen.
   * Op 10 september 2026 was het Supabase-project weg en toonde weerzone.nl
   * daardoor alleen nog een navbar met logo: verder een blanco pagina.
   *
   * Niet ingelogd kunnen vaststellen is een prima uitkomst; niets kunnen
   * vaststellen mag nooit de hele UI gijzelen.
   *
   * De try/catch alleen was niet genoeg: een `catch` vangt de fout, maar niet
   * de tijd. supabase-js doet eigen retries, dus bij een onbereikbare backend
   * bleef `loading` niet eeuwig true maar wel ~8 seconden true -- de site was
   * daardoor niet blanco meer, maar wel tergend traag (melding 11 september).
   * De deadline hieronder maakt van die 8 seconden 2,5.
   */
  async function hydrate() {
    try {
      await hydrateInner();
    } catch (err) {
      console.error("session hydrate mislukt, verder als uitgelogd:", err);
      setUser(null);
      setTier(null);
      setIsFounder(false);
      setAgentPreferences(ALL_AGENT_PREFERENCES);
      setPrimaryLocation(null);
    } finally {
      setLoading(false);
    }
  }

  async function hydrateInner() {
    const u = await getUserWithDeadline<User>(supabase, "session-context hydrate");
    setUser(u);
    if (!u) {
      setTier(null);
      setIsFounder(false);
      setAgentPreferences(ALL_AGENT_PREFERENCES);
      setPrimaryLocation(null);
      setLoading(false);
      return;
    }

    // Parallel fetch: subscription, primary location and legacy profile fallback.
    const [subsRes, locRes, profileRes] = await Promise.all([
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
        .maybeSingle(),
      supabase
        .from("user_profile")
        .select("piet_on, reed_on, koos_on")
        .eq("id", u.id)
        .maybeSingle(),
    ]);

    const activeSubs = subsRes.data || [];
    const tierRanking: Record<string, number> = { steve: 3, reed: 2, piet: 1, free: 0 };
    const sortedSubs = activeSubs.sort((a, b) => 
      (tierRanking[b.tier] ?? 0) - (tierRanking[a.tier] ?? 0)
    );
    
    const founderCheck = isFounderEmail(u.email);
    setIsFounder(founderCheck);
    let t = (sortedSubs[0]?.tier ?? null) as PersonaTier | null;
    if (founderCheck) t = FOUNDER_TIER;
    setTier(t && (PERSONA_ORDER.includes(t as any) || t === 'steve') ? t : null);
    setAgentPreferences(preferencesFromProfile(profileRes.data, u.user_metadata?.agent_preferences));

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
    <SessionContext.Provider value={{ user, tier, isFounder, agentPreferences, primaryLocation, loading, refresh: hydrate }}>
      {children}
    </SessionContext.Provider>
  );
}
