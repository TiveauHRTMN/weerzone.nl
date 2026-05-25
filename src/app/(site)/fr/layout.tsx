import type { Metadata } from "next";

// Remplace les métadonnées par défaut pour toutes les pages /fr/*
// Le layout lui-même ne rend rien de plus — la navigation et SiteShell viennent du parent (site)/layout.tsx.
export const metadata: Metadata = {
  title: {
    default: "WEERZONE | Prévisions météo locales pour la France",
    template: "%s | WEERZONE France",
  },
  description:
    "Prévisions météo actuelles pour la France. Prévisions locales précises pour la température, les précipitations, le vent et les alertes pour les 48 prochaines heures.",
  openGraph: {
    locale: "fr_FR",
    siteName: "WEERZONE",
  },
  // Geen alternates op layout-niveau: het zou via metadata-merging op alle
  // /fr/* pagina's de root-cluster injecteren, terwijl elke pagina zijn eigen
  // path-specifieke hreflang moet declareren. Zie src/lib/hreflang.ts.
};

const frStructuredData = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://weerzone.nl/fr#website",
    name: "WEERZONE France",
    url: "https://weerzone.nl/fr",
    inLanguage: "fr-FR",
    description:
      "Prévisions météo hyperlocales pour la France — 48 heures à l'avance, avec une résolution de 1 km.",
    publisher: { "@id": "https://weerzone.nl#organization" },
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://weerzone.nl#organization",
    name: "WEERZONE",
    url: "https://weerzone.nl",
    logo: "https://weerzone.nl/icon.png",
    areaServed: ["NL", "BE", "DE", "FR"],
    sameAs: ["https://weerzone.nl"],
  },
];

export default function FrLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(frStructuredData) }}
      />
      {children}
    </>
  );
}
