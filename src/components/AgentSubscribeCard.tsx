"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { trackEvent } from "@/lib/analytics";

interface AgentSubscribeCardProps {
  placeName: string;
  province: string;
  placeSlug: string;
}

type CardState = "loading" | "anon" | "auth" | "sent" | "done";

/**
 * Inschrijfblok voor Piets ochtendbericht per plaats (handoff 2026-07-10,
 * blok a). Ingelogd = one-tap; uitgelogd = e-mailveld → magic link. De
 * plaatspagina's zijn ISR-gecachet, dus alle per-gebruiker-status wordt hier
 * client-side bepaald (browser-client + RLS owner-only op agent_subscriptions).
 */
export default function AgentSubscribeCard({ placeName, province, placeSlug }: AgentSubscribeCardProps) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [state, setState] = useState<CardState>("loading");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const shownTracked = useRef(false);

  useEffect(() => {
    if (!shownTracked.current) {
      shownTracked.current = true;
      trackEvent("subscribe_shown", { agent: "piet", place: placeSlug, province });
    }

    // Terugkeer uit de magic-link mail: /api/agents/subscribe/confirm stuurt
    // hierheen met ?abonnement=piet (of =mislukt als de rij niet lukte).
    const returned = new URLSearchParams(window.location.search).get("abonnement");
    if (returned === "piet") {
      setState("done");
      trackEvent("subscribe_confirmed", { agent: "piet", place: placeSlug, province, via: "magic_link" });
      return;
    }
    if (returned === "mislukt") {
      setError("Het bevestigen lukte net niet — probeer de knop hieronder.");
    }

    let cancelled = false;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user) {
        setState("anon");
        return;
      }
      // Al geabonneerd? RLS laat alleen eigen rijen zien.
      const { data } = await supabase
        .from("agent_subscriptions")
        .select("id")
        .eq("agent", "piet")
        .eq("province", province)
        .eq("place_slug", placeSlug)
        .is("unsubscribed_at", null)
        .maybeSingle();
      if (cancelled) return;
      setState(data ? "done" : "auth");
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, province, placeSlug]);

  async function subscribe(withEmail?: string) {
    setBusy(true);
    setError(null);
    trackEvent("subscribe_started", {
      agent: "piet",
      place: placeSlug,
      province,
      via: withEmail ? "magic_link" : "one_tap",
    });
    try {
      const res = await fetch("/api/agents/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ agent: "piet", province, place: placeSlug, email: withEmail }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof json.error === "string" ? json.error : "Dat lukte even niet — probeer het zo nog eens.");
        return;
      }
      if (json.status === "subscribed") {
        setState("done");
        trackEvent("subscribe_confirmed", { agent: "piet", place: placeSlug, province, via: "one_tap" });
      } else {
        setState("sent");
      }
    } catch {
      setError("Dat lukte even niet — probeer het zo nog eens.");
    } finally {
      setBusy(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Vul een geldig e-mailadres in.");
      return;
    }
    void subscribe(email.trim());
  }

  return (
    <section
      className="rounded-3xl bg-[#3b7ff0] p-6 text-white shadow-[0_18px_42px_-22px_rgba(37,84,180,0.8)] sm:p-7"
      aria-label={`Piets ochtendbericht voor ${placeName}`}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/60">
        Gratis · elke ochtend in je mail
      </p>
      <h2 className="mt-1 text-xl font-black leading-tight tracking-tight sm:text-2xl">
        Piet kent {placeName}
      </h2>

      {state === "done" ? (
        <p className="mt-3 text-[15px] leading-relaxed text-white/90">
          Piet staat aan voor {placeName}. Morgenochtend ligt het eerste bericht in je mail — van uur
          tot uur, 48 uur vooruit.
        </p>
      ) : state === "sent" ? (
        <p className="mt-3 text-[15px] leading-relaxed text-white/90">
          De mail is onderweg naar {email.trim() || "je inbox"}. Eén klik daarin en Piet staat elke
          ochtend voor je klaar.
        </p>
      ) : (
        <>
          <p className="mt-3 text-[15px] leading-relaxed text-white/90">
            Elke ochtend het weer voor {placeName} in je mail: van uur tot uur, 48 uur vooruit.
            Gratis, en net zo makkelijk weer uit te zetten.
          </p>

          {state === "auth" && (
            <button
              type="button"
              onClick={() => void subscribe()}
              disabled={busy}
              className="mt-5 inline-block rounded-2xl bg-white px-7 py-3.5 text-sm font-black text-[#2563c9] shadow-[0_4px_24px_rgba(0,0,0,0.15)] transition-transform hover:scale-[1.02] disabled:opacity-60"
            >
              {busy ? "Even geduld…" : `Zet Piet aan voor ${placeName}`}
            </button>
          )}

          {state === "anon" && (
            <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-2.5 sm:flex-row">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="je@voorbeeld.nl"
                autoComplete="email"
                required
                className="w-full flex-1 rounded-2xl border border-white/30 bg-white/15 px-4 py-3.5 text-[15px] font-semibold text-white placeholder:text-white/50 focus:border-white focus:outline-none"
              />
              <button
                type="submit"
                disabled={busy}
                className="rounded-2xl bg-white px-6 py-3.5 text-sm font-black text-[#2563c9] shadow-[0_4px_24px_rgba(0,0,0,0.15)] transition-transform hover:scale-[1.02] disabled:opacity-60"
              >
                {busy ? "Even geduld…" : "Zet Piet aan"}
              </button>
            </form>
          )}

          {state === "loading" && (
            <div className="mt-5 h-12 animate-pulse rounded-2xl bg-white/20" />
          )}
        </>
      )}

      {error && <p className="mt-3 text-sm font-semibold text-amber-200">{error}</p>}
    </section>
  );
}
