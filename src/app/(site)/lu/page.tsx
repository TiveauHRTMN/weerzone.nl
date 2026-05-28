import type { Metadata } from "next";
import Link from "next/link";
import MarketingPageShell from "@/components/MarketingPageShell";

export const metadata: Metadata = {
  title: "Meteo Luxembourg aujourd'hui | Previsions locales 48h",
  description:
    "Meteo locale pour le Luxembourg. Pluie, vent, temperature et conseils simples pour aujourd'hui et demain.",
  alternates: {
    canonical: "https://weerzone.nl/lu",
    languages: {
      "fr-LU": "https://weerzone.nl/lu",
      "fr-FR": "https://weerzone.nl/fr",
      "de-DE": "https://weerzone.nl/de",
      "x-default": "https://weerzone.nl/lu",
    },
  },
};

const LINKS = [
  { label: "Luxembourg", href: "/fr/meteo/luxembourg/luxembourg" },
  { label: "Esch-sur-Alzette", href: "/fr/meteo/luxembourg/esch-sur-alzette" },
  { label: "Differdange", href: "/fr/meteo/luxembourg/differdange" },
  { label: "Dudelange", href: "/fr/meteo/luxembourg/dudelange" },
];

export default function LuxembourgPage() {
  return (
    <main>
      <MarketingPageShell locale="fr">
          <section className="space-y-5">
            <div className="card p-6 sm:p-8">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-3">
                WEERZONE Luxembourg
              </p>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight mb-3">
                Une meteo locale pour aujourd'hui et demain.
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                WEERZONE se concentre sur les prochaines 48 heures: pluie, vent, temperature et le bon
                moment pour sortir, attendre ou adapter votre plan.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {LINKS.map((item) => (
                <Link key={item.href} href={item.href} className="card p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-sky-600 mb-1">Voir la ville</p>
                  <p className="text-lg font-black text-slate-900">{item.label}</p>
                </Link>
              ))}
            </div>
          </section>
      </MarketingPageShell>
    </main>
  );
}
