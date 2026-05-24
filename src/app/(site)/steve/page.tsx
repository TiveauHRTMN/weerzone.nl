import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Steve — je zakelijke heads-up | Weerzone",
  description:
    "Steve vertaalt weer, timing en locatie naar zakelijke kansen. Binnenkort beschikbaar.",
  alternates: { canonical: "https://weerzone.nl/steve" },
};

export default function StevePage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-5 py-16 text-center">
      <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-slate-900">
        Steve
      </h1>
      <p className="mt-3 text-lg text-slate-700">Je zakelijke heads-up.</p>
      <p className="mt-10 text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">
        Coming soon
      </p>
    </main>
  );
}
