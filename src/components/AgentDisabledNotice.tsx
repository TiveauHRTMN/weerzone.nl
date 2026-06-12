import Link from "next/link";
import type { AgentPreferenceKey } from "@/lib/agents/preferences";

const AGENT_COPY: Record<AgentPreferenceKey, { label: string; description: string }> = {
  piet: { label: "Piet", description: "je dagelijkse weerbeeld en praktische planning" },
  reed: { label: "Reed", description: "waarschuwingen voor onweer, storm en zware regen" },
  koos: { label: "Koos", description: "slimme tips voor beter weer en eropuit gaan" },
};

export default function AgentDisabledNotice({ agent }: { agent: AgentPreferenceKey }) {
  const copy = AGENT_COPY[agent];

  return (
    <main className="min-h-[70vh] px-4 py-16 flex items-center justify-center">
      <section className="w-full max-w-lg rounded-3xl bg-white p-7 sm:p-9 text-center shadow-xl border border-white/70">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Onderdeel uitgeschakeld</p>
        <h1 className="mt-3 text-3xl font-black text-slate-900">{copy.label} staat uit</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Je hebt {copy.label} uitgezet. Daardoor verbergen we {copy.description} op jouw Weerzone.
        </p>
        <Link
          href="/mijn-weerzone"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-xs font-black uppercase tracking-widest text-white"
        >
          Instellingen beheren
        </Link>
      </section>
    </main>
  );
}
