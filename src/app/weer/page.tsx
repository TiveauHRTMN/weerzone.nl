import { ALL_PLACES, PROVINCE_LABELS, placeSlug, type Province } from "@/lib/places-data";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Weer in Nederland - 48 uur vooruit per provincie en stad",
  description:
    "Bekijk het actuele weer per provincie en plaats in Nederland. Hyperlokale voorspellingen voor de komende 48 uur, met regen, wind en temperatuur per locatie.",
  keywords: [
    "weer nederland",
    "weer per provincie",
    "weer per stad",
    "weerbericht",
    "weerzone locaties",
  ],
  alternates: { canonical: "https://weerzone.nl/weer" },
};

export default function WeerIndexPage() {
  const provinces = Object.entries(PROVINCE_LABELS).map(([id, label]) => ({
    id: id as Province,
    label,
  }));

  const quickLinks = [
    { name: "Amsterdam", prov: "noord-holland" },
    { name: "Rotterdam", prov: "zuid-holland" },
    { name: "Utrecht", prov: "utrecht" },
    { name: "Den Haag", prov: "zuid-holland" },
    { name: "Eindhoven", prov: "noord-brabant" },
    { name: "Groningen", prov: "groningen" },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <nav className="text-xs text-white/50 mb-6 font-bold uppercase tracking-widest">
          <span className="text-white/80">Weer Nederland</span>
        </nav>

        <header className="mb-12">
          <h1 className="text-4xl sm:text-6xl font-black leading-tight mb-4 tracking-tighter">
            Het weer in Nederland. <span className="text-accent-orange">Stad voor stad.</span>
          </h1>
          <p className="text-white/70 text-lg leading-relaxed max-w-2xl">
            Selecteer je provincie of een plaats om de lokale weersverwachting voor de komende 48 uur te bekijken.
          </p>
        </header>

        <section className="mb-12">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white/40 mb-4">Populaire locaties</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {quickLinks.map((link) => (
              <Link
                key={link.name}
                href={`/weer/${link.prov}/${placeSlug(link.name)}`}
                className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-accent-orange/50 transition-all font-bold text-sm text-center"
              >
                Weer {link.name}
              </Link>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white/40 mb-4">Provincies</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {provinces.map((p) => (
              <Link
                key={p.id}
                href={`/weer/${p.id}`}
                className="group flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
              >
                <span className="font-black uppercase tracking-tight">{p.label}</span>
                <span className="text-accent-orange opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-20 pt-10 border-t border-white/10 grid sm:grid-cols-3 gap-6">
          <div>
            <h3 className="font-black uppercase text-xs tracking-widest text-accent-cyan mb-3">Korte termijn</h3>
            <p className="text-xs text-white/50 leading-relaxed">
              WEERZONE richt zich op de komende 48 uur, zodat je snel ziet wat het weer betekent voor vandaag en morgen.
            </p>
          </div>
          <div>
            <h3 className="font-black uppercase text-xs tracking-widest text-accent-orange mb-3">Persona's</h3>
            <p className="text-xs text-white/50 leading-relaxed">
              Piet, Reed en Steve vertalen de voorspelling naar concreet advies voor thuis, waarschuwingen en zakelijk gebruik.
            </p>
          </div>
          <div>
            <h3 className="font-black uppercase text-xs tracking-widest text-white mb-3">Locaties</h3>
            <p className="text-xs text-white/50 leading-relaxed">
              Van grote steden tot kleine plaatsen. Weerzone bundelt lokale pagina's op een manier die goed vindbaar is.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
