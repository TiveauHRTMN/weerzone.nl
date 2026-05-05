import { ALL_PLACES, PROVINCE_LABELS, placeSlug, type Province } from "@/lib/places-data";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "48 uur weer voor keuzes vandaag en morgen | WEERZONE",
  description:
    "Waarom WEERZONE focust op de komende 48 uur: de periode waarin weerdata het meest bruikbaar is voor planning per uur.",
  keywords: [
    "48 uur weer",
    "48 uur weerbericht",
    "waarom geen 14 daagse",
    "weermodel harmonie",
    "weer 2 dagen vooruit",
  ],
  alternates: { canonical: "https://weerzone.nl/weer/48-uur" },
};

export default function FortyEightPage() {
  // Pak de 12 grootste steden voor de hub
  const topCities = [
    "Amsterdam", "Rotterdam", "Utrecht", "Den Haag", "Eindhoven", 
    "Groningen", "Tilburg", "Almere", "Breda", "Nijmegen", 
    "Apeldoorn", "Enschede"
  ].map(name => ALL_PLACES.find(p => p.name === name)).filter(Boolean);

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Waarom toont WEERZONE maximaal 48 uur?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Voorbij 48 uur neemt de onzekerheid toe. WEERZONE focust daarom op de periode waarin weerdata het meest bruikbaar is voor concrete keuzes vandaag en morgen.",
        },
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <nav className="text-xs text-white/50 mb-6 font-bold uppercase">
            <Link href="/weer" className="hover:text-white">Weer</Link>
            <span className="mx-2">/</span>
            <span className="text-white/80">48 uur</span>
          </nav>

          <header className="mb-10">
            <div className="text-5xl mb-4">⏱️</div>
            <h1 className="text-4xl sm:text-6xl font-black leading-tight mb-4 tracking-tighter">
              48 uur weer. <span className="text-accent-cyan">Voor keuzes vandaag en morgen.</span>
            </h1>
            <p className="text-white/70 text-lg leading-relaxed">
              WEERZONE richt zich op de periode waarin weerdata het meest bruikbaar is: vandaag, vannacht en morgen. Per uur, hyperlokaal en direct toepasbaar.
            </p>
          </header>

          <section className="mb-10 space-y-6 text-white/75 leading-relaxed bg-white/5 p-8 rounded-3xl border border-white/10">
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Waarom die 48-uurs focus?</h2>
            <p>
               Na ongeveer 48 uur neemt de onzekerheid toe en kunnen kleine afwijkingen groter worden. Daarom concentreren wij ons op de periode waarin je het weer nog praktisch kunt gebruiken voor planning per uur.
            </p>
            <div className="grid sm:grid-cols-2 gap-4 mt-6">
               <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="font-bold text-white mb-1 uppercase text-xs tracking-widest text-accent-cyan">Data focus</div>
                  <p className="text-xs text-white/50 italic">Per uur: regen, windstoten, UV en onweersenergie.</p>
               </div>
               <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="font-bold text-white mb-1 uppercase text-xs tracking-widest text-accent-cyan">Duidelijkheid</div>
                  <p className="text-xs text-white/50 italic">Je ziet direct of twee modellen het met elkaar eens zijn.</p>
               </div>
            </div>
          </section>

          <section>
            <h2 className="text-xs font-black uppercase tracking-widest text-white/40 mb-6">48-uurs verwachting per stad</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {topCities.map((c) => (
                <Link
                  key={c!.name}
                  href={`/weer/${c!.province}/${placeSlug(c!.name)}`}
                  className="block px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-accent-cyan/60 text-sm font-bold text-center transition-all"
                >
                  48u {c!.name}
                </Link>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link href="/weer" className="text-xs font-black uppercase tracking-widest text-accent-cyan hover:gap-2 transition-all">
                Bekijk meer dan 9.000 locaties →
              </Link>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
