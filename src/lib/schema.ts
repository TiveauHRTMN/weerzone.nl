/**
 * Centrale schema.org JSON-LD builders voor WEERZONE.
 */

const ORG = {
  "@type": "Organization",
  name: "WEERZONE",
  url: "https://weerzone.nl",
  logo: "https://weerzone.nl/weerzone-icon.png",
  description: "Nederlandse hyperlocale weerdienst voor 48-uur weersverwachtingen per stad en provincie.",
  areaServed: { "@type": "Country", name: "Nederland" },
  inLanguage: "nl-NL",
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    email: "info@weerzone.nl",
    url: "https://weerzone.nl/contact",
  },
} as const;

/** Props voor <script type="application/ld+json" {...schemaLd(schema)} /> */
export function schemaLd(schema: object | readonly object[]) {
  return {
    type: "application/ld+json" as const,
    dangerouslySetInnerHTML: { __html: JSON.stringify(schema) },
  };
}

export function schemaSearchAction() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    url: "https://weerzone.nl",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://weerzone.nl/weer?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function schemaBreadcrumb(items: Array<{ name: string; item?: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      ...(crumb.item ? { item: crumb.item } : {}),
    })),
  };
}

export function schemaWebPage(opts: {
  name: string;
  url: string;
  description?: string;
  dateModified?: string;
  about?: object;
  speakableSelectors?: string[];
  inLanguage?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: opts.name,
    url: opts.url,
    ...(opts.description ? { description: opts.description } : {}),
    ...(opts.dateModified ? { dateModified: opts.dateModified } : {}),
    ...(opts.about ? { about: opts.about } : {}),
    inLanguage: opts.inLanguage ?? "nl-NL",
    publisher: ORG,
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: opts.speakableSelectors ?? ["h1", "h2", "[data-speakable]"],
    },
  };
}

/**
 * FAQPage JSON-LD voor citatie door AI Overviews / ChatGPT / Perplexity.
 * Houd antwoorden 40-80 woorden, vragen letterlijke query-formaten.
 */
export function schemaFAQ(items: Array<{ q: string; a: string }>, inLanguage = "nl-NL") {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage,
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export function schemaAboutPage() {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "Over WEERZONE",
    url: "https://weerzone.nl/over",
    description:
      "WEERZONE is een Nederlandse hyperlocale weerdienst die 48-uur weersverwachtingen geeft voor alle steden en provincies in Nederland.",
    inLanguage: "nl-NL",
    publisher: ORG,
    about: {
      "@context": "https://schema.org",
      ...ORG,
    },
  };
}

export function schemaContactPage() {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact — WEERZONE",
    url: "https://weerzone.nl/contact",
    description:
      "Contact opnemen met WEERZONE. Mail naar info@weerzone.nl of gebruik het contactformulier.",
    inLanguage: "nl-NL",
    publisher: ORG,
    contactOption: "https://schema.org/TollFree",
  };
}

export function schemaService(opts: {
  name: string;
  alternateName?: string;
  description: string;
  url: string;
  serviceType: string;
  audience?: string;
  offers?: { price: string; priceCurrency: string };
  inLanguage?: string;
  areaServed?: object;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: opts.name,
    ...(opts.alternateName ? { alternateName: opts.alternateName } : {}),
    description: opts.description,
    url: opts.url,
    serviceType: opts.serviceType,
    areaServed: opts.areaServed ?? { "@type": "Country", name: "Nederland" },
    provider: ORG,
    inLanguage: opts.inLanguage ?? "nl-NL",
    ...(opts.audience
      ? { audience: { "@type": "Audience", audienceType: opts.audience } }
      : {}),
    ...(opts.offers
      ? {
          offers: {
            "@type": "Offer",
            price: opts.offers.price,
            priceCurrency: opts.offers.priceCurrency,
            availability: "https://schema.org/InStock",
          },
        }
      : {}),
  };
}

export function schemaWeatherWarnings(
  warnings: Array<{
    name: string;
    description: string;
    url: string;
    validFrom?: string | null;
    validUntil?: string | null;
    issuedAt?: string | null;
    areaServed?: string;
  }>,
  inLanguage = "nl-NL",
) {
  return warnings.map((warning) => ({
    "@context": "https://schema.org",
    "@type": "SpecialAnnouncement",
    name: warning.name,
    text: warning.description,
    url: warning.url,
    category: "https://www.wikidata.org/wiki/Q81054",
    inLanguage,
    publisher: ORG,
    ...(warning.areaServed ? { spatialCoverage: { "@type": "AdministrativeArea", name: warning.areaServed } } : {}),
    ...(warning.validFrom ? { datePosted: warning.validFrom } : {}),
    ...(warning.issuedAt ? { datePublished: warning.issuedAt } : {}),
    ...(warning.validUntil ? { expires: warning.validUntil } : {}),
  }));
}

export function schemaCityWeatherPage(opts: {
  placeName: string;
  lat: number;
  lon: number;
  province: string;
  slug: string;
  inLanguage?: string;
  name?: string;
  description?: string;
  speakableSelectors?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: opts.name ?? `Weersverwachting ${opts.placeName} — 48 uur`,
    url: `https://weerzone.nl/weer/${opts.province}/${opts.slug}`,
    dateModified: new Date().toISOString(),
    ...(opts.description ? { description: opts.description } : {}),
    inLanguage: opts.inLanguage ?? "nl-NL",
    about: {
      "@type": "City",
      name: opts.placeName,
      geo: {
        "@type": "GeoCoordinates",
        latitude: opts.lat,
        longitude: opts.lon,
      },
    },
    publisher: ORG,
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: opts.speakableSelectors ?? ["h1", "[data-speakable]", ".wz-essentials", ".wz-geo-summary"],
    },
  };
}

export function schemaCityDataset(opts: {
  placeName: string;
  url: string;
  description?: string;
  inLanguage?: string;
  name?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: opts.name ?? `Hyperlokale Weerdata ${opts.placeName} (1x1 km resolutie)`,
    description: opts.description ?? `Actuele weersverwachting, temperatuur, neerslag en wind op straatniveau voor ${opts.placeName}. Helder weergegeven voor vandaag en morgen.`,
    url: opts.url,
    license: "https://creativecommons.org/licenses/by/4.0/",
    creator: ORG,
    inLanguage: opts.inLanguage ?? "nl-NL",
    temporalCoverage: `${new Date().toISOString().split("T")[0]}/${new Date(Date.now() + 48 * 3600 * 1000).toISOString().split("T")[0]}`,
    spatialCoverage: {
      "@type": "Place",
      name: opts.placeName,
    },
  };
}

export function schemaAggregateRating(opts: {
  itemName: string;
  ratingValue: number;
  ratingCount: number;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: opts.itemName,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: opts.ratingValue.toFixed(1),
      reviewCount: opts.ratingCount,
      bestRating: "5",
      worstRating: "1",
    },
  };
}
