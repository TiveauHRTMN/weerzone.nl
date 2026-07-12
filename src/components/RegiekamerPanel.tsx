"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { updateProfile } from "@/app/actions";
import { trackEvent } from "@/lib/analytics";
import { MOMENT_KIND_LABEL, type AgentMoment, type MomentKind } from "@/lib/agents/moments-shared";
import {
  listMyMoments,
  insertMoment,
  updateMoment,
  deleteMoment,
  type MomentInsert,
} from "@/lib/agents/moments-client";
import PwaInstallCard, { isIOS, isStandalone } from "@/components/PwaInstallCard";

interface SubscriptionRow {
  id: string;
  agent: string;
  province: string;
  place_slug: string;
  channel: string;
  unsubscribed_at: string | null;
}

type Budget = "moments_only" | "standard" | "low";

const AGENT_LABEL: Record<string, string> = { piet: "Piet", reed: "Reed", koos: "Koos" };
const CHANNEL_LABEL: Record<string, string> = { email: "mail", push: "seintjes" };
const BUDGET_OPTIONS: Array<{ k: Budget; t: string }> = [
  { k: "moments_only", t: "Alleen mijn momenten" },
  { k: "standard", t: "Elke omslag (max 3/dag)" },
  { k: "low", t: "Zo min mogelijk (1/dag)" },
];
const DAY_LABELS = ["ma", "di", "wo", "do", "vr", "za", "zo"];
const KIND_OPTIONS: MomentKind[] = ["commute", "dog", "outdoor", "laundry", "sport", "custom"];

function fmtTime(t: string): string {
  return t.slice(0, 5);
}

function fmtPlace(slug: string): string {
  return slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

/**
 * Regiekamer (spec agent-headsup §3F): abonnementen per plaats × kanaal,
 * de eigen momenten, gekoppelde apparaten + test-push, en het persoonlijke
 * budget. Dit paneel is later letterlijk de Pro-bundelpagina.
 */
export default function RegiekamerPanel({ initialBudget }: { initialBudget: Budget }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [subs, setSubs] = useState<SubscriptionRow[]>([]);
  const [moments, setMoments] = useState<AgentMoment[]>([]);
  const [devices, setDevices] = useState<number>(0);
  const [budget, setBudget] = useState<Budget>(initialBudget);
  const [userId, setUserId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [editing, setEditing] = useState<AgentMoment | null>(null);
  const [adding, setAdding] = useState(false);
  const [subError, setSubError] = useState<string | null>(null);
  const [momentError, setMomentError] = useState<string | null>(null);
  const [budgetError, setBudgetError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      setUserId(user.id);
      const [subsRes, momentRows, devicesRes] = await Promise.all([
        supabase
          .from("agent_subscriptions")
          .select("id, agent, province, place_slug, channel, unsubscribed_at")
          .order("province")
          .order("place_slug"),
        listMyMoments(supabase),
        supabase.from("push_devices").select("id").is("disabled_at", null),
      ]);
      if (cancelled) return;
      setSubs((subsRes.data ?? []) as SubscriptionRow[]);
      setMoments(momentRows);
      setDevices(devicesRes.data?.length ?? 0);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  async function enablePush(row: SubscriptionRow) {
    const registration = await navigator.serviceWorker.register("/sw.js");
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      throw new Error(
        permission === "denied" ? "Meldingen zijn geblokkeerd in je browserinstellingen." : "Geen toestemming gegeven.",
      );
    }
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
      body: JSON.stringify({ agent: row.agent, province: row.province, place: row.place_slug, subscription: subscription.toJSON() }),
    });
    if (!res.ok) throw new Error("Dat lukte even niet.");
  }

  async function toggleSub(row: SubscriptionRow) {
    const activate = row.unsubscribed_at !== null;
    if (activate && row.channel === "push" && isIOS() && !isStandalone()) {
      setSubError("Meldingen op iPhone werken pas als Weerzone op je beginscherm staat.");
      return;
    }
    setBusy(row.id);
    setSubError(null);
    try {
      if (activate && row.channel === "push") {
        await enablePush(row);
      } else {
        const res = await fetch("/api/agents/subscriptions/toggle", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ agent: row.agent, province: row.province, place: row.place_slug, channel: row.channel, active: activate }),
        });
        if (!res.ok) throw new Error("Dat lukte even niet.");
      }
      setSubs((s) => s.map((r) => (r.id === row.id ? { ...r, unsubscribed_at: activate ? null : new Date().toISOString() } : r)));
    } catch (err) {
      setSubError(err instanceof Error ? err.message : "Dat lukte even niet — probeer het zo nog eens.");
    } finally {
      setBusy(null);
    }
  }

  async function saveBudget(next: Budget) {
    const previous = budget;
    setBudget(next);
    setBudgetError(null);
    setBusy("budget");
    try {
      const result = await updateProfile({ headsupBudget: next });
      if (!result?.ok) {
        setBudget(previous);
        setBudgetError("Bewaren lukte even niet — probeer het zo nog eens.");
        return;
      }
      trackEvent("regiekamer_budget", { budget: next });
    } catch {
      setBudget(previous);
      setBudgetError("Bewaren lukte even niet — probeer het zo nog eens.");
    } finally {
      setBusy(null);
    }
  }

  async function sendTestPush() {
    setBusy("test");
    setTestResult(null);
    try {
      const res = await fetch("/api/agents/test-push", { method: "POST" });
      const json = (await res.json().catch(() => ({}))) as { sent?: number; devices?: number; reason?: string };
      setTestResult(
        json.sent
          ? `Verstuurd naar ${json.sent} van je ${json.devices} apparaten — kijk op je toestel.`
          : json.reason ?? "Er ging iets mis — probeer het zo nog eens.",
      );
    } catch {
      setTestResult("Er ging iets mis — probeer het zo nog eens.");
    } finally {
      setBusy(null);
    }
  }

  async function saveMoment(values: MomentInsert, id?: string) {
    if (!userId) return;
    setMomentError(null);
    if (id) {
      const { ok } = await updateMoment(supabase, id, values);
      if (!ok) {
        setMomentError("Bewaren lukte even niet — probeer het zo nog eens.");
        return;
      }
      setMoments((m) => m.map((x) => (x.id === id ? { ...x, ...values, transport: values.transport ?? null } : x)));
    } else {
      const { ok } = await insertMoment(supabase, userId, values);
      if (!ok) {
        setMomentError("Bewaren lukte even niet — probeer het zo nog eens.");
        return;
      }
      setMoments(await listMyMoments(supabase));
    }
    setEditing(null);
    setAdding(false);
  }

  async function removeMoment(id: string) {
    setMomentError(null);
    const { ok } = await deleteMoment(supabase, id);
    if (!ok) {
      setMomentError("Verwijderen lukte even niet — probeer het zo nog eens.");
      return;
    }
    setMoments((m) => m.filter((x) => x.id !== id));
    setEditing(null);
  }

  return (
    <div className="grid gap-3">
      {/* Abonnementen per plaats × kanaal */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Waar je agents werken</p>
        {subs.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Nog geen abonnementen — zet een agent aan via Vandaag of een plaatspagina.</p>
        ) : (
          <div className="mt-2 grid gap-2">
            {subs.map((row) => {
              const active = row.unsubscribed_at === null;
              const blocked = row.channel === "push" && !active && isIOS() && !isStandalone();
              return (
                <div key={row.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-slate-900">
                      {AGENT_LABEL[row.agent] ?? row.agent} · {fmtPlace(row.place_slug)}
                    </div>
                    <div className="text-xs text-slate-500">{CHANNEL_LABEL[row.channel] ?? row.channel}</div>
                  </div>
                  {blocked ? (
                    <span className="flex-none text-[11px] font-bold text-slate-400">op beginscherm eerst</span>
                  ) : (
                    <button
                      type="button"
                      role="switch"
                      aria-checked={active}
                      aria-label={`${AGENT_LABEL[row.agent] ?? row.agent} voor ${fmtPlace(row.place_slug)} ${active ? "uitzetten" : "aanzetten"}`}
                      onClick={() => void toggleSub(row)}
                      disabled={busy !== null}
                      className="relative h-7 w-12 flex-none rounded-full transition-colors disabled:opacity-60"
                      style={{ background: active ? "#10b981" : "#e2e8f0" }}
                    >
                      <span className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all" style={{ left: active ? 22 : 2 }} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {subs.some((row) => row.channel === "push" && row.unsubscribed_at !== null) && isIOS() && !isStandalone() && (
          <PwaInstallCard compact />
        )}
        {subError && <p className="mt-2 text-sm font-semibold text-red-600">{subError}</p>}
      </div>

      {/* Momenten */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Jouw momenten</p>
          <button type="button" onClick={() => { setAdding(true); setEditing(null); }} className="text-xs font-black text-slate-900 hover:underline">
            + Toevoegen
          </button>
        </div>
        {moments.length === 0 && !adding ? (
          <p className="mt-2 text-sm text-slate-500">
            Nog geen momenten. Vertel Piet je ritme — dan weet hij wanneer een bui jou raakt.
          </p>
        ) : (
          <div className="mt-2 grid gap-2">
            {moments.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => { setEditing(m); setAdding(false); }}
                className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 text-left hover:border-slate-300"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-slate-900">{m.label}</div>
                  <div className="text-xs text-slate-500">
                    {MOMENT_KIND_LABEL[m.kind]} · {m.days.map((d) => DAY_LABELS[d - 1]).join(" ")} · {fmtTime(m.windowStart)}–{fmtTime(m.windowEnd)}
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-400">Bewerk</span>
              </button>
            ))}
          </div>
        )}
        {momentError && <p className="mt-2 text-sm font-semibold text-red-600">{momentError}</p>}
        {(editing || adding) && (
          <MomentEditor
            initial={editing}
            onSave={(values) => void saveMoment(values, editing?.id)}
            onDelete={editing ? () => void removeMoment(editing.id) : undefined}
            onCancel={() => { setEditing(null); setAdding(false); setMomentError(null); }}
          />
        )}
      </div>

      {/* Budget */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Hoe vaak mag Piet zich melden</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {BUDGET_OPTIONS.map((o) => (
            <button
              key={o.k}
              type="button"
              onClick={() => void saveBudget(o.k)}
              disabled={busy !== null}
              className="rounded-full border px-4 py-2 text-[13px] font-bold transition-colors disabled:opacity-60"
              style={{
                borderColor: budget === o.k ? "#0f172a" : "#e2e8f0",
                background: budget === o.k ? "#0f172a" : "#fff",
                color: budget === o.k ? "#fff" : "#0f172a",
              }}
            >
              {o.t}
            </button>
          ))}
        </div>
        {budgetError && <p className="mt-2 text-sm font-semibold text-red-600">{budgetError}</p>}
      </div>

      {/* Apparaten + test-push */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Apparaten</p>
        <p className="mt-1 text-sm text-slate-700">
          {devices === 0
            ? "Nog geen apparaat met meldingen — zet een agent-seintje aan via Vandaag."
            : `${devices} ${devices === 1 ? "apparaat ontvangt" : "apparaten ontvangen"} meldingen.`}
        </p>
        {devices > 0 && (
          <button
            type="button"
            onClick={() => void sendTestPush()}
            disabled={busy !== null}
            className="mt-3 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white disabled:opacity-60"
          >
            {busy === "test" ? "Versturen…" : "Stuur een testmelding"}
          </button>
        )}
        {testResult && <p className="mt-2 text-sm font-semibold text-slate-600">{testResult}</p>}
      </div>
    </div>
  );
}

function MomentEditor({
  initial,
  onSave,
  onDelete,
  onCancel,
}: {
  initial: AgentMoment | null;
  onSave: (values: MomentInsert) => void;
  onDelete?: () => void;
  onCancel: () => void;
}) {
  const [kind, setKind] = useState<MomentKind>(initial?.kind ?? "custom");
  const [label, setLabel] = useState(initial?.label ?? "");
  const [days, setDays] = useState<number[]>(initial?.days ?? [1, 2, 3, 4, 5]);
  const [start, setStart] = useState(initial ? fmtTime(initial.windowStart) : "17:00");
  const [end, setEnd] = useState(initial ? fmtTime(initial.windowEnd) : "18:00");

  function toggleDay(d: number) {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()));
  }

  const valid = label.trim().length > 0 && days.length > 0 && start < end;

  return (
    <div className="mt-3 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap gap-1.5">
        {KIND_OPTIONS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className="rounded-full border px-3 py-1.5 text-xs font-bold"
            style={{
              borderColor: kind === k ? "#0f172a" : "#e2e8f0",
              background: kind === k ? "#0f172a" : "#fff",
              color: kind === k ? "#fff" : "#0f172a",
            }}
          >
            {MOMENT_KIND_LABEL[k]}
          </button>
        ))}
      </div>
      <input
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Bijvoorbeeld: Avondronde"
        className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-900"
      />
      <div className="flex flex-wrap gap-1.5">
        {DAY_LABELS.map((d, i) => (
          <button
            key={d}
            type="button"
            onClick={() => toggleDay(i + 1)}
            className="rounded-full border px-3 py-1.5 text-xs font-bold"
            style={{
              borderColor: days.includes(i + 1) ? "#0f172a" : "#e2e8f0",
              background: days.includes(i + 1) ? "#0f172a" : "#fff",
              color: days.includes(i + 1) ? "#fff" : "#0f172a",
            }}
          >
            {d}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 text-sm text-slate-700">
        <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2" />
        <span>tot</span>
        <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2" />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!valid}
            onClick={() => onSave({ kind, label: label.trim(), days, windowStart: start, windowEnd: end })}
            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-black uppercase tracking-widest text-white disabled:opacity-40"
          >
            Bewaar
          </button>
          <button type="button" onClick={onCancel} className="rounded-xl px-4 py-2 text-xs font-bold text-slate-500">
            Annuleer
          </button>
        </div>
        {onDelete && (
          <button type="button" onClick={onDelete} className="text-xs font-bold text-red-500 hover:underline">
            Verwijder
          </button>
        )}
      </div>
    </div>
  );
}
