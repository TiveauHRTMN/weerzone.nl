import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Koos — als je eropuit wilt | Weerzone",
  description:
    "Koos helpt je kiezen waar je heen kunt als je eropuit wilt. Hij vergelijkt jouw plekken met andere locaties en zoekt waar het de komende 48 uur het prettigst is.",
  alternates: { canonical: "https://weerzone.nl/koos" },
};

export default function KoosPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-16 sm:py-24">
      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-700/80">
        Agent
      </p>
      <h1 className="mt-2 text-4xl sm:text-5xl font-black tracking-tight text-slate-900">
        Koos
      </h1>
      <p className="mt-3 text-lg text-slate-700">Als je eropuit wilt.</p>

      <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <p className="text-base text-slate-800 leading-relaxed">
          Koos vergelijkt jouw plekken met andere locaties en zoekt waar het de
          komende 48 uur het prettigst is. Voor een vrije dag, weekend, een
          uitje of gewoon even een betere richting.
        </p>
        <p className="mt-4 text-sm text-slate-500">Binnenkort beschikbaar.</p>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/mijnweer"
          className="inline-flex items-center justify-center rounded-xl bg-[#0f1a2c] px-5 py-3 text-[11px] font-black uppercase tracking-widest text-white shadow-sm transition-transform active:scale-95"
        >
          Naar Piet
        </Link>
        <Link
          href="/waarschuwingen"
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-[11px] font-black uppercase tracking-widest text-slate-800 transition-colors hover:bg-slate-50"
        >
          Naar Reed
        </Link>
      </div>
    </main>
  );
}
