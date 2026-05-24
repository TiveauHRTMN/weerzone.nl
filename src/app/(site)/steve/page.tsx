import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Steve — je zakelijke heads-up | Weerzone",
  description:
    "Steve vertaalt weer, timing en locatie naar zakelijke kansen. Voor events, partners, media en weergevoelige beslissingen.",
  alternates: { canonical: "https://weerzone.nl/steve" },
};

export default function StevePage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-16 sm:py-24">
      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-sky-700/80">
        Agent
      </p>
      <h1 className="mt-2 text-4xl sm:text-5xl font-black tracking-tight text-slate-900">
        Steve
      </h1>
      <p className="mt-3 text-lg text-slate-700">Je zakelijke heads-up.</p>

      <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
          Coming soon
        </p>
        <p className="mt-3 text-base text-slate-800 leading-relaxed">
          Steve vertaalt weer, timing en locatie naar zakelijke kansen.
          <br />
          Voor events, partners, media en weergevoelige beslissingen.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/mijnweer"
          className="inline-flex items-center justify-center rounded-xl bg-[#0f1a2c] px-5 py-3 text-[11px] font-black uppercase tracking-widest text-white shadow-sm transition-transform active:scale-95"
        >
          Naar Piet
        </Link>
        <Link
          href="/contact"
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-[11px] font-black uppercase tracking-widest text-slate-800 transition-colors hover:bg-slate-50"
        >
          Contact
        </Link>
      </div>
    </main>
  );
}
