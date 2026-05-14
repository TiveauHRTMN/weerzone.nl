import { ALL_PLACES, placeSlug } from "@/lib/places-data";
import Link from "next/link";
import type { Metadata } from "next";
import { schemaWebPage, schemaBreadcrumb, schemaLd } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Onweer vandaag in Nederland — live kans op bliksem per uur",
  description:
    "Onweer vandaag in Nederland? Bekijk live de kans op bliksem per uur per stad. De enige site die je echt vertelt óf en wanneer het gaat onweren.",
  keywords: [
    "onweer vandaag",
    "onweer nederland",
    "onweer morgen",
    "onweers-energie",
    "onweersradar",
    "bliksem vandaag",
  ],
  alternates: { canonical: "https://weerzone.nl/weer/onweer" },
};

export default function OnweerPage() {
  // Pak de 12 grootste steden voor de hub
  const topCities = [
    "Amsterdam", "Rotterdam", "Utrecht", "Den Haag", "Eindhoven", 
    "Groningen", "Tilburg", "Almere", "Breda", "Nijmegen", 
    "Apeldoorn", "Enschede"
  ].map(name => ALL_PLACES.find(p => p.name === name)).filter(Boolean);

  return (
    <>
      <script {...schemaLd([
        schemaWebPage({ name: "Onweer vandaag in Nederland", url: "https://weerzone.nl/weer/onweer", description: "Onweer vandaag in Nederland? Bekijk live de kans op bliksem per uur per stad." }),
        schemaBreadcrumb([{ name: "WEERZONE", item: "https://weerzone.nl" }, { name: "Weer", item: "https://weerzone.nl/weer" }, { name: "Onweer" }]),
      ])} />
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <nav className="text-xs text-white/50 mb-6 font-bold uppercase">
            <Link href="/weer" className="hover:text-white">Weer</Link>
            <span className="mx-2">/</span>
            <span className="text-white/80">Onweer</span>
          </nav>

          <header className="mb-10">
            <div className="text-5xl mb-4">⛈️</div>
            <h1 className="text-4xl sm:text-6xl font-black leading-tight mb-4 tracking-tighter">
              Onweer vandaag in Nederland.
            </h1>
            <p className="text-white/70 text-lg leading-relaxed">
              Geen gokwerk. WeerZone toont de live <strong className="text-white">onweers-energie per uur</strong> voor elke stad. 
            </p>
          </header>

          <section className="mb-10 space-y-6 text-white/75 leading-relaxed bg-white/5 p-8 rounded-3xl border border-white/10">
             <h2 className="text-2xl font-black text-white uppercase tracking-tight">Onweerskansen bekijken</h2>
             <p>
                We meten de onstabiliteit in de lucht. Als de energie hoog is én er valt regen, dan is de kans op bliksem en donder zeer groot. Zo weet je precies of je binnen moet blijven of nog even de hond kunt uitlaten.
             </p>
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
                <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
                    <div className="text-[10px] uppercase font-black text-green-400 mb-1">Rustig</div>
                    <div className="text-lg font-black">Laag</div>
                </div>
                <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-center">
                    <div className="text-[10px] uppercase font-black text-orange-400 mb-1">Onrustig</div>
                    <div className="text-lg font-black">Matig</div>
                </div>
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
                    <div className="text-[10px] uppercase font-black text-red-400 mb-1">Onweer</div>
                    <div className="text-lg font-black">Hoog</div>
                </div>
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
                    <div className="text-[10px] uppercase font-black text-purple-400 mb-1">Zwaar onweer</div>
                    <div className="text-lg font-black">Extreem</div>
                </div>
             </div>
          </section>

          <section>
            <h2 className="text-xs font-black uppercase tracking-widest text-white/40 mb-6">Live Onweer per stad</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {topCities.map((c) => (
                <Link
                  key={c!.name}
                  href={`/weer/${c!.province}/${placeSlug(c!.name)}`}
                  className="block px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-accent-orange/60 text-sm font-bold text-center transition-all"
                >
                  Onweer {c!.name}
                </Link>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link href="/weer" className="text-xs font-black uppercase tracking-widest text-accent-orange hover:gap-2 transition-all">
                Check alle 9.000+ locaties →
              </Link>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
