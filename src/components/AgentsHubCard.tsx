"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getUserWithDeadline } from "@/lib/auth-deadline";
import { trackEvent } from "@/lib/analytics";
import PwaInstallCard, { isIOS, isStandalone } from "@/components/PwaInstallCard";

interface AgentsHubCardProps {
  placeName: string;
  province: string;
  placeSlug: string;
}

type RowKey = "piet_email" | "piet_push" | "reed_push" | "koos_push";
type SessionState = "loading" | "anon" | "auth";

const ROWS: Array<{
  key: RowKey;
  agent: "piet" | "reed" | "koos";
  channel: "email" | "push";
  dot: string;
  title: string;
  desc: string;
}> = [
  { key: "piet_email", agent: "piet", channel: "email", dot: "#0284C7", title: "Piet — ochtendbericht", desc: "Elke ochtend het weer in je mail, 48 uur vooruit" },
  { key: "piet_push", agent: "piet", channel: "push", dot: "#0284C7", title: "Piet — seintjes op dit toestel", desc: "Alleen bij een omslag die jouw dag raakt, max 3 per dag" },
  { key: "reed_push", agent: "reed", channel: "push", dot: "#EA580C", title: "Reed — weeralarm", desc: "Melding zodra er een waarschuwing geldt voor de provincie" },
  { key: "koos_push", agent: "koos", channel: "push", dot: "#059669", title: "Koos — weekendtip", desc: "Hooguit één seintje, alleen do t/m za" },
];

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

/**
 * "Jouw agents" (spec agent-headsup §3E): één blok met alle agent-schakelaars
 * voor de getoonde plaats. Vervangt AgentSubscribeCard + ReedPushCard.
 * Per-gebruiker-status client-side (pagina's zijn gecachet; RLS owner-only).
 */
export default function AgentsHubCard({ placeName, province, placeSlug }: AgentsHubCardProps) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [session, setSession] = useState<SessionState>("loading");
  const [on, setOn] = useState<Record<RowKey, boolean>>({ piet_email: false, piet_push: false, reed_push: false, koos_push: false });
  const [busy, setBusy] = useState<RowKey | null>(null);
  const [email, setEmail] = useState("");
  const [mailSent, setMailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const shownTracked = useRef(false);

  const pushSupported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;
  const needsInstall = isIOS() && !isStandalone();

  useEffect(() => {
    if (!shownTracked.current) {
      shownTracked.current = true;
      trackEvent("subscribe_shown", { surface: "agents_hub", place: placeSlug, province });
    }
    // Terugkeer uit de magic-link mail (zelfde contract als voorheen).
    const returned = new URLSearchParams(window.location.search).get("abonnement");
    if (returned === "piet") {
      setOn((s) => ({ ...s, piet_email: true }));
      trackEvent("subscribe_confirmed", { agent: "piet", channel: "email", place: placeSlug, province, via: "magic_link" });
    }
    if (returned === "mislukt") setError("Het bevestigen lukte net niet — probeer de schakelaar hieronder.");

    let cancelled = false;
    (async () => {
      const user = await getUserWithDeadline<{ id: string }>(supabase, "AgentsHubCard");
      if (cancelled) return;
      if (!user) {
        setSession("anon");
        return;
      }
      const { data } = await supabase
        .from("agent_subscriptions")
        .select("agent, channel")
        .eq("province", province)
        .eq("place_slug", placeSlug)
        .is("unsubscribed_at", null);
      if (cancelled) return;
      const next: Record<RowKey, boolean> = { piet_email: false, piet_push: false, reed_push: false, koos_push: false };
      const pushGranted = typeof Notification !== "undefined" && Notification.permission === "granted";
      for (const row of (data ?? []) as { agent: string; channel: string }[]) {
        const key = `${row.agent}_${row.channel}` as RowKey;
        if (key in next) next[key] = row.channel !== "push" || pushGranted;
      }
      setOn(next);
      setSession("auth");
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, province, placeSlug]);

  async function enablePush(row: (typeof ROWS)[number]) {
    const registration = await navigator.serviceWorker.register("/sw.js");
    const permission = await Notification.requestPermission();
    if (permission !== "granted") throw new Error(permission === "denied" ? "Meldingen zijn geblokkeerd in je browserinstellingen." : "Geen toestemming gegeven.");
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) throw new Error("Meldingen zijn even niet beschikbaar.");
    const subscription =
      (await registration.pushManager.getSubscription()) ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      }));
    const res = await fetch("/api/agents/push/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ agent: row.agent, province, place: placeSlug, subscription: subscription.toJSON() }),
    });
    if (!res.ok) throw new Error("Dat lukte even niet.");
  }

  async function toggle(row: (typeof ROWS)[number]) {
    if (busy) return;
    setBusy(row.key);
    setError(null);
    const turningOn = !on[row.key];
    trackEvent(turningOn ? "subscribe_started" : "subscribe_disabled", { agent: row.agent, channel: row.channel, place: placeSlug, province });
    try {
      if (turningOn && row.channel === "push") {
        await enablePush(row);
      } else {
        const res = await fetch("/api/agents/subscriptions/toggle", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ agent: row.agent, province, place: placeSlug, channel: row.channel, active: turningOn }),
        });
        if (!res.ok) throw new Error("Dat lukte even niet.");
      }
      setOn((s) => ({ ...s, [row.key]: turningOn }));
      if (turningOn) trackEvent("subscribe_confirmed", { agent: row.agent, channel: row.channel, place: placeSlug, province, via: "one_tap" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Dat lukte even niet — probeer het zo nog eens.");
    } finally {
      setBusy(null);
    }
  }

  async function subscribeAnonymous(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Vul een geldig e-mailadres in.");
      return;
    }
    setBusy("piet_email");
    setError(null);
    trackEvent("subscribe_started", { agent: "piet", channel: "email", place: placeSlug, province, via: "magic_link" });
    try {
      const res = await fetch("/api/agents/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ agent: "piet", province, place: placeSlug, email: email.trim() }),
      });
      if (!res.ok) throw new Error("Dat lukte even niet — probeer het zo nog eens.");
      setMailSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Dat lukte even niet.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section
      className="rounded-3xl bg-slate-900 p-6 text-white shadow-[0_18px_42px_-22px_rgba(15,23,42,0.9)] sm:p-7"
      aria-label={`Jouw agents voor ${placeName}`}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/50">Jouw agents · gratis</p>
      <h2 className="mt-1 text-xl font-black leading-tight tracking-tight sm:text-2xl">
        Piet, Reed en Koos kennen {placeName}
      </h2>
      <p className="mt-2 text-[14px] leading-relaxed text-white/70">
        Jouw eigen meteo-team: ze melden zich alleen als het ertoe doet — stilte hoort erbij.
      </p>

      {session === "loading" && <div className="mt-5 h-32 animate-pulse rounded-2xl bg-white/10" />}

      {session === "anon" && (
        mailSent ? (
          <p className="mt-5 rounded-2xl border border-white/15 bg-white/5 p-4 text-[14px] leading-relaxed text-white/85">
            De mail is onderweg naar {email.trim() || "je inbox"}. Eén klik daarin en Piet staat elke ochtend voor je klaar — daarna kun je hier ook de seintjes aanzetten.
          </p>
        ) : (
          <form onSubmit={subscribeAnonymous} className="mt-5 flex flex-col gap-2.5 sm:flex-row">
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
              disabled={busy !== null}
              className="rounded-2xl bg-white px-6 py-3.5 text-sm font-black text-slate-900 shadow-[0_4px_24px_rgba(0,0,0,0.15)] transition-transform hover:scale-[1.02] disabled:opacity-60"
            >
              {busy ? "Even geduld…" : "Zet Piet aan"}
            </button>
          </form>
        )
      )}

      {session === "auth" && (
        <div className="mt-5 grid gap-2.5">
          {ROWS.map((row) => {
            const pushRow = row.channel === "push";
            if (pushRow && !pushSupported && !needsInstall) return null;
            const active = on[row.key];
            const blocked = pushRow && needsInstall && !active;
            return (
              <div key={row.key} className="flex items-center gap-3 rounded-2xl border border-white/12 bg-white/5 p-3.5">
                <span className="inline-block h-2 w-2 flex-none rounded-full" style={{ background: row.dot }} aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-bold">{row.title}</div>
                  <div className="truncate text-[12px] text-white/60">{row.desc}</div>
                </div>
                {blocked ? (
                  <span className="flex-none text-[11px] font-bold text-white/50">op beginscherm eerst</span>
                ) : (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={active}
                    aria-label={`${row.title} ${active ? "uitzetten" : "aanzetten"}`}
                    onClick={() => void toggle(row)}
                    disabled={busy !== null}
                    className="relative h-7 w-12 flex-none rounded-full transition-colors disabled:opacity-60"
                    style={{ background: active ? "#34d399" : "rgba(255,255,255,0.18)" }}
                  >
                    <span
                      className="absolute top-0.5 h-6 w-6 rounded-full bg-white transition-all"
                      style={{ left: active ? 22 : 2 }}
                    />
                  </button>
                )}
              </div>
            );
          })}
          {needsInstall && <PwaInstallCard compact />}
        </div>
      )}

      {error && <p className="mt-3 text-sm font-semibold text-amber-300">{error}</p>}
    </section>
  );
}
