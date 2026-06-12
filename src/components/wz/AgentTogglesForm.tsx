"use client";

import { useState } from "react";
import { updateProfile } from "@/app/actions";
import type { AgentPreferenceKey, AgentPreferences } from "@/lib/agents/preferences";
import { useSession } from "@/lib/session-context";

const AGENTS: Array<{ key: AgentPreferenceKey; label: string; role: string; mail: string; color: string }> = [
  { key: "piet", label: "Piet", role: "Dagelijkse uitleg bij vandaag en morgen", mail: "Ochtendbriefing", color: "#0284C7" },
  { key: "reed", label: "Reed", role: "Waarschuwingen bij onweer, storm en zware regen", mail: "Waarschuwingen", color: "#EA580C" },
  { key: "koos", label: "Koos", role: "Tips voor buiten, hitte, regen en eropuit", mail: "Weekendtips", color: "#059669" },
];

export default function AgentTogglesForm({ initial }: { initial: AgentPreferences }) {
  const { refresh } = useSession();
  const [enabled, setEnabled] = useState(initial);
  const [busy, setBusy] = useState<AgentPreferenceKey | null>(null);
  const [error, setError] = useState<AgentPreferenceKey | null>(null);

  async function toggle(key: AgentPreferenceKey) {
    if (busy) return;
    const previous = enabled[key];
    const next = !previous;
    setEnabled((current) => ({ ...current, [key]: next }));
    setBusy(key);
    setError(null);

    try {
      const payload = key === "piet" ? { pietOn: next } : key === "reed" ? { reedOn: next } : { koosOn: next };
      const result = await updateProfile(payload);
      if (!result.ok) throw new Error(result.error ?? "Opslaan mislukt");
      await refresh();
    } catch {
      setEnabled((current) => ({ ...current, [key]: previous }));
      setError(key);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/95 shadow-xl shadow-slate-950/10">
      {AGENTS.map((agent, index) => {
        const active = enabled[agent.key];
        return (
          <button
            key={agent.key}
            type="button"
            onClick={() => toggle(agent.key)}
            disabled={busy !== null}
            aria-pressed={active}
            className={`flex w-full items-center gap-4 p-5 text-left transition hover:bg-slate-50 disabled:opacity-60 sm:p-6 ${index ? "border-t border-slate-100" : ""}`}
          >
            <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: agent.color }} />
            <span className="min-w-0 flex-1">
              <span className="block text-base font-black text-slate-950">{agent.label}</span>
              <span className="mt-0.5 block text-sm leading-relaxed text-slate-600">{agent.role}</span>
              <span className={`mt-1 block text-xs ${error === agent.key ? "font-bold text-red-600" : "text-slate-400"}`}>
                {error === agent.key ? "Opslaan mislukt. Probeer opnieuw." : agent.mail}
              </span>
            </span>
            <span className="flex flex-none items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: active ? agent.color : "#94a3b8" }}>{active ? "Aan" : "Uit"}</span>
              <span className="relative h-7 w-12 rounded-full transition-colors" style={{ background: active ? agent.color : "#cbd5e1" }} aria-hidden>
                <span className="absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all" style={{ left: active ? 24 : 4 }} />
              </span>
            </span>
          </button>
        );
      })}
      <p className="border-t border-slate-100 px-5 py-4 text-xs leading-relaxed text-slate-500 sm:px-6">Wat uitstaat, verdwijnt direct uit Vandaag en Morgen. De bijbehorende e-mails worden dan ook niet verstuurd.</p>
    </div>
  );
}
