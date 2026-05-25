import type { Metadata } from "next";

// Overschrijft metadata-defaults voor alle /de/* pagina's.
// Layout zelf rendert niets extra — nav en SiteShell komen van de parent (site)/layout.tsx.
export const metadata: Metadata = {
  title: {
    default: "WEERZONE | Lokale Wettervorhersage für Deutschland",
    template: "%s | WEERZONE Deutschland",
  },
  description:
    "Aktuelle Wettervorhersage für Deutschland. Präzise lokale Prognosen für Temperatur, Niederschlag, Wind und Warnungen für die nächsten 48 Stunden.",
  openGraph: {
    locale: "de_DE",
    siteName: "WEERZONE",
  },
  // Geen alternates op layout-niveau: het zou via metadata-merging op alle
  // /de/* pagina's de root-cluster injecteren, terwijl elke pagina zijn eigen
  // path-specifieke hreflang moet declareren. Zie src/lib/hreflang.ts.
};

const deStructuredData = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://weerzone.nl/de#website",
    name: "WEERZONE Deutschland",
    url: "https://weerzone.nl/de",
    inLanguage: "de-DE",
    description:
      "Hyperlokale Wettervorhersage für Deutschland — 48 Stunden voraus, mit 1 km Auflösung.",
    publisher: { "@id": "https://weerzone.nl#organization" },
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://weerzone.nl#organization",
    name: "WEERZONE",
    url: "https://weerzone.nl",
    logo: "https://weerzone.nl/icon.png",
    areaServed: ["NL", "BE", "DE"],
    sameAs: ["https://weerzone.nl"],
  },
];

export default function DeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(deStructuredData) }}
      />
      {children}
    </>
  );
}
