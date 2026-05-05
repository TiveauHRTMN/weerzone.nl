/**
 * Centrale schema.org JSON-LD builders voor WEERZONE.
 *
 * Gebruik:
 *   import { schemaBreadcrumb, schemaService, schemaLd } from "@/lib/schema";
 *   <script type="application/ld+json" {...schemaLd(schemaService(...))} />
 */

const ORG = {
  "@type": "Organization",
  name: "WEERZONE",
  url: "https://weerzone.nl",
  logo: "https://weerzone.nl/weerzone-icon.png",
  description: "Nederlandse hyperlocale weerdienst voor 48-uur weersverwachtingen per stad en provincie.",
  areaServed: { "@type": "Country", name: "Nederland" },
  inLanguage: "nl-NL",
} as const;

/** Props voor <script type="application/ld+json" {...schemaLd(schema)} /> */
export function schemaLd(schema: object | object[]) {
  return {
    type: "application/ld+json" as const,
    dangerouslySetInnerHTML: { __html: JSON.stringify(schema) },
  };
}

export function schemaBreadcrumb(
  items: Array<{ name: string; item?: string }>
) {
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
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: opts.name,
    url: opts.url,
    ...(opts.description ? { description: opts.description } : {}),
    ...(opts.dateModified ? { dateModified: opts.dateModified } : {}),
    ...(opts.about ? { about: opts.about } : {}),
    inLanguage: "nl-NL",
    publisher: ORG,
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
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: opts.name,
    ...(opts.alternateName ? { alternateName: opts.alternateName } : {}),
    description: opts.description,
    url: opts.url,
    serviceType: opts.serviceType,
    areaServed: { "@type": "Country", name: "Nederland" },
    provider: ORG,
    inLanguage: "nl-NL",
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

export function schemaCityWeatherPage(opts: {
  placeName: string;
  lat: number;
  lon: number;
  province: string;
  slug: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `Weersverwachting ${opts.placeName} — 48 uur`,
    url: `https://weerzone.nl/weer/${opts.province}/${opts.slug}`,
    dateModified: new Date().toISOString(),
    inLanguage: "nl-NL",
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
  };
}
