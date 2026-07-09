"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { trackEvent } from "@/lib/analytics";

interface ReedPushCardProps {
  placeName: string;
  province: string;
  placeSlug: string;
}

type CardState = "unsupported" | "loading" | "anon" | "off" | "on" | "denied";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

/**
 * Reed → web push (blok b): meldingen op dit apparaat zodra het KNMI
 * waarschuwt voor de provincie van de plaats. Vereist een ingelogd account —
 * uitgelogde bezoekers zetten eerst Piet aan (magic link logt ze in).
 */
export default function ReedPushCard({ placeName, province, placeSlug }: ReedPushCardProps) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [state, setState] = useState<CardState>("loading");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const shownTracked = useRef(false);

  useEffect(() => {
    if (
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window)
    ) {
      setState("unsupported");
      return;
    }
    if (!shownTracked.current) {
      shownTracked.current = true;
      trackEvent("subscribe_shown", { agent: "reed", channel: "push", place: placeSlug, province });
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
      if (Notification.permission === "denied") {
        setState("denied");
        return;
      }
      const { data } = await supabase
        .from("agent_subscriptions")
        .select("id")
        .eq("agent", "reed")
        .eq("province", province)
        .eq("place_slug", placeSlug)
        .eq("channel", "push")
        .is("unsubscribed_at", null)
        .maybeSingle();
      if (cancelled) return;
      setState(data && Notification.permission === "granted" ? "on" : "off");
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, province, placeSlug]);

  async function enable() {
    setBusy(true);
    setError(null);
    trackEvent("subscribe_started", { agent: "reed", channel: "push", place: placeSlug, province });
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "off");
        return;
      }
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        setError("Meldingen zijn even niet beschikbaar.");
        return;
      }
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
        }));
      const res = await fetch("/api/agents/push/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          agent: "reed",
          province,
          place: placeSlug,
          subscription: subscription.toJSON(),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof json.error === "string" ? json.error : "Dat lukte even niet.");
        return;
      }
      setState("on");
      trackEvent("subscribe_confirmed", { agent: "reed", channel: "push", place: placeSlug, province });
    } catch {
      setError("Meldingen aanzetten lukte even niet — probeer het zo nog eens.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/agents/push/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ agent: "reed", province, place: placeSlug, disable: true }),
      });
      if (res.ok) setState("off");
      else setError("Uitzetten lukte even niet.");
    } catch {
      setError("Uitzetten lukte even niet.");
    } finally {
      setBusy(false);
    }
  }

  if (state === "unsupported") return null;

  return (
    <section
      className="rounded-3xl bg-slate-900 p-6 text-white shadow-[0_18px_42px_-22px_rgba(15,23,42,0.9)] sm:p-7"
      aria-label={`Weeralarm van Reed voor ${placeName}`}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-400/80">
        Weeralarm · gratis
      </p>
      <h2 className="mt-1 text-xl font-black leading-tight tracking-tight sm:text-2xl">
        Reed waarschuwt {placeName}
      </h2>

      {state === "on" ? (
        <>
          <p className="mt-3 text-[15px] leading-relaxed text-white/85">
            Meldingen staan aan op dit apparaat. Geeft het KNMI een waarschuwing voor{" "}
            {placeName}, dan hoor je het van Reed — vaak uren voordat het losbarst.
          </p>
          <button
            type="button"
            onClick={() => void disable()}
            disabled={busy}
            className="mt-4 text-xs font-bold text-white/50 underline underline-offset-2 hover:text-white/80 disabled:opacity-60"
          >
            Meldingen uitzetten
          </button>
        </>
      ) : (
        <>
          <p className="mt-3 text-[15px] leading-relaxed text-white/85">
            Onweer, storm of hagel op komst? Reed stuurt een melding naar dit apparaat zodra het
            KNMI waarschuwt voor jouw provincie. Geen waarschuwing, geen gepiep.
          </p>

          {state === "off" && (
            <button
              type="button"
              onClick={() => void enable()}
              disabled={busy}
              className="mt-5 inline-block rounded-2xl bg-amber-400 px-7 py-3.5 text-sm font-black text-slate-950 shadow-[0_4px_24px_rgba(251,191,36,0.35)] transition-transform hover:scale-[1.02] disabled:opacity-60"
            >
              {busy ? "Even geduld…" : "Zet meldingen aan"}
            </button>
          )}

          {state === "anon" && (
            <p className="mt-4 rounded-2xl border border-white/15 bg-white/5 p-3.5 text-[13px] font-semibold text-white/70">
              Zet eerst Piet aan hierboven met je e-mailadres — na één klik in die mail ben je
              ingelogd en kun je Reeds meldingen aanzetten.
            </p>
          )}

          {state === "denied" && (
            <p className="mt-4 rounded-2xl border border-white/15 bg-white/5 p-3.5 text-[13px] font-semibold text-white/70">
              Meldingen zijn voor weerzone.nl geblokkeerd in je browserinstellingen. Zet ze daar
              weer aan om Reed te kunnen ontvangen.
            </p>
          )}

          {state === "loading" && <div className="mt-5 h-12 animate-pulse rounded-2xl bg-white/10" />}
        </>
      )}

      {error && <p className="mt-3 text-sm font-semibold text-amber-300">{error}</p>}
    </section>
  );
}
