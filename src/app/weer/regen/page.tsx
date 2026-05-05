import { ALL_PLACES, PROVINCE_LABELS, placeSlug, type Province } from "@/lib/places-data";
import Link from "next/link";
import type { Metadata } from "next";
import { schemaWebPage, schemaBreadcrumb, schemaLd } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Regen vandaag in Nederland — wanneer wordt het droog? | WEERZONE",
  description:
    "Regen vandaag in Nederland? Bekijk per uur, per stad, wanneer de bui stopt en wanneer het weer droog is. Messcherpe 48-uurs voorspelling met KNMI data.",
  keywords: [
    "regen vandaag",
    "regen nederland",
    "wanneer stopt de regen",
    "regenverwachting",
    "buienradar alternatief",
    "neerslag per uur",
  ],
  alternates: { canonical: "https://weerzone.nl/weer/regen" },
};

export default function RegenPage() {
  // Pak de 12 grootste steden voor de hub
  const topCities = [
    "Amsterdam", "Rotterdam", "Utrecht", "Den Haag", "Eindhoven", 
    "Groningen", "Tilburg", "Almere", "Breda", "Nijmegen", 
    "Apeldoorn", "Enschede"
  ].map(name => ALL_PLACES.find(p => p.name === name)).filter(Boolean);

  return (
    <>
      <script {...schemaLd([
        schemaWebPage({ name: "Regen vandaag in Nederland", url: "https://weerzone.nl/weer/regen", description: "Regen vandaag in Nederland? Bekijk per uur, per stad, wanneer de bui stopt en wanneer het weer droog is." }),
        schemaBreadcrumb([{ name: "WEERZONE", item: "https://weerzone.nl" }, { name: "Weer", item: "https://weerzone.nl/weer" }, { name: "Regen" }]),
      ])} />
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <nav className="text-xs text-white/50 mb-6 font-bold uppercase">
            <Link href="/weer" className="hover:text-white">Weer</Link>
            <span className="mx-2">/</span>
            <span className="text-white/80">Regen</span>
          </nav>

          <header className="mb-10">
            <div className="text-5xl mb-4">🌧️</div>
            <h1 className="text-4xl sm:text-6xl font-black leading-tight mb-4 tracking-tighter">
              Regen vandaag — wanneer wordt het droog?
            </h1>
            <p className="text-white/70 text-lg leading-relaxed">
               Je staat op het punt om te gaan fietsen of de was buiten te hangen. <strong className="text-white">Hoe lang duurt deze bui?</strong> WeerZone laat het je per uur zien voor jouw specifieke postcode.
            </p>
          </header>

          <section className="mb-10 space-y-6 text-white/75 leading-relaxed bg-white/5 p-8 rounded-3xl border border-white/10">
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Hoeveel regen is 'veel'?</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
              <div className="p-3 rounded-xl bg-white/10 border border-white/20 text-center">
                <div className="text-[10px] uppercase font-black text-white/60 mb-1">Motregen</div>
                <div className="text-lg font-black">&lt;1mm</div>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                <div className="text-[10px] uppercase font-black text-blue-400 mb-1">Normaal</div>
                <div className="text-lg font-black">1-5mm</div>
              </div>
              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-center">
                <div className="text-[10px] uppercase font-black text-cyan-400 mb-1">Flink</div>
                <div className="text-lg font-black">5-15mm</div>
              </div>
              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-center">
                <div className="text-[10px] uppercase font-black text-indigo-400 mb-1">Hoosbui</div>
                <div className="text-lg font-black">15mm+</div>
              </div>
            </div>
            <p className="text-sm italic">
               WeerZone toont neerslag per uur voor exact jouw locatie. Geen regio-gemiddelde, maar data op de vierkante meter.
            </p>
          </section>

          <section>
            <h2 className="text-xs font-black uppercase tracking-widest text-white/40 mb-6">Neerslag per stad</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {topCities.map((c) => (
                <Link
                  key={c!.name}
                  href={`/weer/${c!.province}/${placeSlug(c!.name)}`}
                  className="block px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-accent-orange/60 text-sm font-bold text-center transition-all"
                >
                  Regen {c!.name}
                </Link>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link href="/weer" className="text-xs font-black uppercase tracking-widest text-accent-orange hover:gap-2 transition-all">
                Bekijk je eigen locatie →
              </Link>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
