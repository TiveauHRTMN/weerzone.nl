"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { updateProfile } from "@/app/actions";
import { trackEvent } from "@/lib/analytics";
import { insertMoment } from "@/lib/agents/moments-client";
import { nlDateISO } from "@/lib/agents/moments-shared";

interface PlaceHit {
  name: string;
  province: string;
  slug: string;
}

const DAGDEEL: Array<{ k: string; t: string; start: string; end: string }> = [
  { k: "ochtend", t: "Ochtend", start: "09:00", end: "13:00" },
  { k: "middag", t: "Middag", start: "12:00", end: "17:00" },
  { k: "dag", t: "Hele dag", start: "09:00", end: "18:00" },
];

/**
 * Dagplan-invuller (spec 2026-07-13 §3C): "Vandaag anders?" — vandaag vrij
 * (eendags-pauze) of een dagje weg (eendags-moment, optioneel met bestemming
 * die Piet dan ook bewaakt). Alleen zichtbaar voor ingelogde gebruikers;
 * de vrije-dag-push opent dit via /vandaag?dagplan=1.
 */
export default function DagplanSheet() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const searchParams = useSearchParams();
  const [userId, setUserId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"idle" | "trip">("idle");
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<PlaceHit[]>([]);
  const [place, setPlace] = useState<PlaceHit | null>(null);
  const [dagdeel, setDagdeel] = useState(DAGDEEL[2]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const searchSeq = useRef(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, [supabase]);

  useEffect(() => {
    if (searchParams?.get("dagplan") === "1") setOpen(true);
  }, [searchParams]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setHits([]);
      return;
    }
    const seq = ++searchSeq.current;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/agents/place-search?q=${encodeURIComponent(q)}`);
        const json = (await res.json()) as { results?: PlaceHit[] };
        if (seq === searchSeq.current) setHits(json.results ?? []);
      } catch {
        /* zoeken is best-effort */
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  if (!userId) return null;

  async function vandaagVrij() {
    setBusy(true);
    setError(null);
    try {
      const result = await updateProfile({ pausedUntil: nlDateISO(new Date()) });
      if (!result?.ok) throw new Error();
      trackEvent("dagplan_saved", { mode: "vrij" });
      setDone("Genoteerd — vandaag geen seintjes over je vaste ritme. Morgen sta ik weer voor je klaar.");
    } catch {
      setError("Dat lukte even niet — probeer het zo nog eens.");
    } finally {
      setBusy(false);
    }
  }

  async function bewaarDagjeWeg() {
    if (!userId) return;
    setBusy(true);
    setError(null);
    try {
      const { ok } = await insertMoment(supabase, userId, {
        kind: "outdoor",
        label: place ? `Dagje weg — ${place.name}` : "Dagje weg",
        days: [],
        date: nlDateISO(new Date()),
        windowStart: dagdeel.start,
        windowEnd: dagdeel.end,
        province: place?.province ?? null,
        placeSlug: place?.slug ?? null,
      });
      if (!ok) throw new Error();
      trackEvent("dagplan_saved", { mode: "trip", met_plaats: !!place, dagdeel: dagdeel.k });
      setDone(
        place
          ? `Genoteerd — ik hou ${place.name} voor je in de gaten. Slaat het weer om, dan hoor je het van mij.`
          : "Genoteerd — ik hou het weer voor je in de gaten. Slaat het om, dan hoor je het van mij.",
      );
    } catch {
      setError("Dat lukte even niet — probeer het zo nog eens.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="va-card p-6">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Vandaag anders dan anders?</p>
      {done ? (
        <div className="mt-2">
          <p className="text-sm font-semibold text-slate-700">{done}</p>
          <button
            type="button"
            onClick={() => {
              setDone(null);
              setOpen(false);
              setMode("idle");
              setPlace(null);
              setQuery("");
            }}
            className="mt-3 rounded-xl px-4 py-2 text-xs font-bold text-slate-500 border border-slate-200"
          >
            Sluit
          </button>
        </div>
      ) : !open ? (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">Vrije dag of een dagje weg? Vertel het Piet.</p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white"
          >
            Vertel het Piet
          </button>
        </div>
      ) : mode === "idle" ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => void vandaagVrij()}
            disabled={busy}
            className="rounded-xl border border-slate-200 p-4 text-left hover:border-slate-400 disabled:opacity-60"
          >
            <div className="text-sm font-bold text-slate-900">Vandaag vrij</div>
            <div className="mt-1 text-xs text-slate-500">Geen seintjes over je vaste ritme — alleen vandaag.</div>
          </button>
          <button
            type="button"
            onClick={() => setMode("trip")}
            disabled={busy}
            className="rounded-xl border border-slate-200 p-4 text-left hover:border-slate-400 disabled:opacity-60"
          >
            <div className="text-sm font-bold text-slate-900">Dagje weg</div>
            <div className="mt-1 text-xs text-slate-500">Piet houdt het weer op je bestemming in de gaten.</div>
          </button>
        </div>
      ) : (
        <div className="mt-3 grid gap-3">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPlace(null);
              }}
              placeholder="Waarheen? (mag leeg)"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-900"
            />
            {hits.length > 0 && !place && (
              <div className="absolute z-10 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg">
                {hits.map((hit) => (
                  <button
                    key={`${hit.province}/${hit.slug}`}
                    type="button"
                    onClick={() => {
                      setPlace(hit);
                      setQuery(hit.name);
                      setHits([]);
                    }}
                    className="block w-full px-3 py-2 text-left text-sm text-slate-800 hover:bg-slate-50"
                  >
                    {hit.name} <span className="text-xs text-slate-400">({hit.province})</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {DAGDEEL.map((d) => (
              <button
                key={d.k}
                type="button"
                onClick={() => setDagdeel(d)}
                className="rounded-full border px-4 py-2 text-[13px] font-bold transition-colors"
                style={{
                  borderColor: dagdeel.k === d.k ? "#0f172a" : "#e2e8f0",
                  background: dagdeel.k === d.k ? "#0f172a" : "#fff",
                  color: dagdeel.k === d.k ? "#fff" : "#0f172a",
                }}
              >
                {d.t}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void bewaarDagjeWeg()}
              disabled={busy}
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white disabled:opacity-60"
            >
              {busy ? "Bewaren…" : "Bewaar"}
            </button>
            <button
              type="button"
              onClick={() => setMode("idle")}
              disabled={busy}
              className="rounded-xl px-4 py-2 text-xs font-bold text-slate-500"
            >
              Terug
            </button>
          </div>
        </div>
      )}
      {error && <p className="mt-2 text-sm font-semibold text-red-600">{error}</p>}
    </div>
  );
}
