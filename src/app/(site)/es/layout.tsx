import type { Metadata } from "next";

// Sobrescribe los metadatos por defecto para todas las paginas /es/*
// El layout en si no renderiza nada extra — la navegacion y el SiteShell vienen del parent (site)/layout.tsx.
export const metadata: Metadata = {
  title: {
    default: "WEERZONE | Tiempo local en Espana, 48 horas por delante",
    template: "%s | WEERZONE Espana",
  },
  description:
    "Tiempo hiperlocal para Espana. Prevision precisa de 48 horas con temperatura, lluvia, viento y alertas para ciudades, pueblos, costas e islas.",
  openGraph: {
    locale: "es_ES",
    siteName: "WEERZONE",
  },
  // Geen alternates op layout-niveau: het zou via metadata-merging op alle
  // /es/* pagina's de root-cluster injecteren, terwijl elke pagina zijn eigen
  // path-specifieke hreflang moet declareren. Zie src/lib/hreflang.ts.
};

const esStructuredData = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://weerzone.nl/es#website",
    name: "WEERZONE Espana",
    url: "https://weerzone.nl/es",
    inLanguage: "es-ES",
    description:
      "Tiempo hiperlocal para Espana — 48 horas por delante, con resolucion de 1 km y contexto local de costa, isla, meseta o montana.",
    publisher: { "@id": "https://weerzone.nl#organization" },
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://weerzone.nl#organization",
    name: "WEERZONE",
    url: "https://weerzone.nl",
    logo: "https://weerzone.nl/icon.png",
    areaServed: ["NL", "BE", "DE", "FR", "ES"],
    sameAs: ["https://weerzone.nl"],
  },
];

export default function EsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(esStructuredData) }}
      />
      {children}
    </>
  );
}
