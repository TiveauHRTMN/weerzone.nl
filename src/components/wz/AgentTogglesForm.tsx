"use client";

/**
 * AgentTogglesForm — beheer welke agents je per e-mail een seintje mogen geven.
 * Account-gebonden: slaat op via de updateProfile server-action (user_profile-
 * kolommen piet_on/reed_on/koos_on). Toggles sturen alleen de proactieve e-mail;
 * on-site (/vandaag, /piet, /reed, /koos) zie je altijd alles.
 */

import { useState } from "react";
import { updateProfile } from "@/app/actions";

type AgentKey = "piet" | "reed" | "koos";

const AGENTS: Array<{ key: AgentKey; label: string; sub: string; dot: string }> = [
  { key: "piet", label: "Piet", sub: "Elke ochtend je weerbericht", dot: "#0284C7" },
  { key: "reed", label: "Reed", sub: "Alleen bij onweer, storm of zware regen", dot: "#EA580C" },
  { key: "koos", label: "Koos", sub: "Tips voor een dagje weg", dot: "#059669" },
];

export default function AgentTogglesForm({
  initial,
}: {
  initial: { piet: boolean; reed: boolean; koos: boolean };
}) {
  const [on, setOn] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  async function toggle(key: AgentKey) {
    const next = { ...on, [key]: !on[key] };
    setOn(next);
    setSaved(false);
    setBusy(true);
    try {
      await updateProfile({ pietOn: next.piet, reedOn: next.reed, koosOn: next.koos });
      setSaved(true);
    } catch {
      // Bij een fout: zet de toggle visueel terug.
      setOn((s) => ({ ...s, [key]: !s[key] }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm divide-y divide-slate-100">
      {AGENTS.map((a) => {
        const active = on[a.key];
        return (
          <button
            key={a.key}
            type="button"
            onClick={() => !busy && toggle(a.key)}
            aria-pressed={active}
            className="w-full flex items-center justify-between gap-3 px-3 py-3 text-left disabled:opacity-60"
            disabled={busy}
          >
            <span className="flex items-start gap-3 min-w-0">
              <span className="mt-1.5 inline-block w-2 h-2 rounded-full flex-none" style={{ background: a.dot }} aria-hidden />
              <span className="min-w-0">
                <span className="block text-[15px] font-extrabold text-slate-900">{a.label}</span>
                <span className="block text-[13px] text-slate-500">{a.sub}</span>
              </span>
            </span>
            <span
              className="relative inline-flex h-[26px] w-[44px] flex-none rounded-full transition-colors"
              style={{ background: active ? a.dot : "#cbd5e1" }}
              aria-hidden
            >
              <span
                className="absolute top-[3px] h-[20px] w-[20px] rounded-full bg-white shadow transition-all"
                style={{ left: active ? 21 : 3 }}
              />
            </span>
          </button>
        );
      })}
      <p className="px-3 py-2 text-[12px] text-slate-400">
        {saved ? "Opgeslagen." : "Bepaalt alleen je e-mail. Op de site zie je altijd alle drie."}
      </p>
    </div>
  );
}
