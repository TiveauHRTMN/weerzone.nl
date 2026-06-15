import type { Metadata } from "next";
import { hreflangSelf } from "@/lib/hreflang";

export const metadata: Metadata = {
  title: "Steve — je zakelijke heads-up",
  description:
    "Steve vertaalt weer, timing en locatie naar zakelijke kansen. Binnenkort beschikbaar.",
  alternates: {
    canonical: "https://weerzone.nl/steve",
    languages: hreflangSelf("nl", "/steve"),
  },
  // Coming-soon: niet indexeren tot Steve live is.
  robots: { index: false, follow: true },
};

export default function StevePage() {
  return (
    <>
      <main className="relative z-10 mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-5 py-16 text-center text-white">
        <h1 className="text-5xl sm:text-6xl font-black tracking-tight drop-shadow-sm">
          Steve
        </h1>
        <p className="mt-3 text-lg text-white/85">Je zakelijke heads-up.</p>
        <p className="mt-10 text-[11px] font-black uppercase tracking-[0.28em] text-white/60">
          Binnenkort
        </p>
      </main>
    </>
  );
}
