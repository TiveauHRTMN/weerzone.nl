import type { Metadata } from "next";
import { hreflangCluster } from "@/lib/hreflang";

export const metadata: Metadata = {
  title: "À propos",
  description: "En savoir plus sur WEERZONE et notre mission de fournir la meilleure météo locale.",
  alternates: {
    canonical: "https://weerzone.nl/fr/a-propos",
    languages: hreflangCluster({
      nl: "/over",
      de: "/de/uber-uns",
      fr: "/fr/a-propos",
      es: "/es/sobre-nosotros",
    }),
  },
};

export default function AProposPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-12 space-y-12">
      <div>
        <h1 className="text-3xl font-black tracking-tighter text-text-primary mb-2">À propos</h1>
        <p className="text-text-secondary">Nous construisons l'application météo de demain.</p>
      </div>
    </main>
  );
}