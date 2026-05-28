import type { Metadata } from "next";
import Link from "next/link";
import MarketingPageShell from "@/components/MarketingPageShell";

export const metadata: Metadata = {
  title: "Weer België vandaag | Lokale 48-uurs verwachting",
  description:
    "Lokale weersverwachting voor België. Bekijk regen, wind, temperatuur en waarschuwingen voor vandaag en morgen.",
  alternates: {
    canonical: "https://weerzone.nl/be",
    languages: {
      "nl-BE": "https://weerzone.nl/be",
      "nl-NL": "https://weerzone.nl",
      "fr-FR": "https://weerzone.nl/fr",
      "x-default": "https://weerzone.nl/be",
    },
  },
};

const LINKS = [
  { label: "Brussel", href: "/weer/vlaams-brabant/brussel" },
  { label: "Antwerpen", href: "/weer/antwerpen/antwerpen" },
  { label: "Gent", href: "/weer/oost-vlaanderen/gent" },
  { label: "Luik", href: "/weer/wallonie/liege" },
];

export default function BelgiePage() {
  return (
    <main>
      <MarketingPageShell locale="nl">
          <section className="space-y-5">
            <div className="card p-6 sm:p-8">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-3">
                Weerzone Belgie
              </p>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight mb-3">
                Lokaal weer voor vandaag en morgen.
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                WEERZONE toont het weer per plaats, niet als vaag landelijk gemiddelde. Handig voor regen,
                wind, temperatuur en korte beslissingen in de komende 48 uur.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {LINKS.map((item) => (
                <Link key={item.href} href={item.href} className="card p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-sky-600 mb-1">Bekijk plaats</p>
                  <p className="text-lg font-black text-slate-900">{item.label}</p>
                </Link>
              ))}
            </div>
          </section>
      </MarketingPageShell>
    </main>
  );
}
