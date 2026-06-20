/**
 * Gedeelde sitemap-data en XML-helpers.
 *
 * Nederland-only: runtime sitemap routes en scripts/gen-sitemap.ts gebruiken
 * alleen deze builders. Buitenlandse sitemap builders zijn verwijderd zodat ze
 * geen sitemapdata, cache writes of ISR work meer kunnen veroorzaken.
 */

import {
  NL_PLACES,
  NL_PROVINCE_SLUGS,
  placeRouteSlug,
  type Place,
} from "@/lib/places-data";

export const BASE_URL = "https://weerzone.nl";

/**
 * De informatieve site is publiek; account-, voorkeuren- en beheerroutes
 * blijven achter de login-proxy. Sitemap-builders nemen alleen openbare
 * canonicals op die anoniem een 200-response horen te geven.
 */
export const GATE_MODE = false;

export const THEME_SLUGS = [
  "bbq-weer",
  "strandweer",
  "hardloopweer",
  "hooikoorts",
  "wintersport-nl",
] as const;

export interface SitemapEntry {
  url: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
}

interface SitemapIndexEntry {
  url: string;
  lastmod: string;
}

export const SITEMAP_FILES = [
  "sitemap-static.xml",
  "sitemap-nl.xml",
] as const;

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function isSitemapPlace(p: Place): boolean {
  if (p.name.length > 60) return false;
  const slug = placeRouteSlug(p);
  if (!slug || slug.includes("--")) return false;
  // Start met plaatsen met aantoonbare zoekvraag en alle echte venues. Dit
  // houdt de index beheersbaar voor een jong domein zonder nuttige locaties
  // uit de WaaS-laag te verwijderen.
  return Boolean(p.venueType) || (p.population ?? 0) >= 1_000;
}

function placePriority(pop?: number): number {
  if (!pop) return 0.5;
  if (pop >= 500_000) return 0.9;
  if (pop >= 100_000) return 0.8;
  if (pop >= 10_000) return 0.7;
  if (pop >= 1_000) return 0.6;
  return 0.5;
}

function todayIso(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Amsterdam",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((part) => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function xmlUrlset(entries: SitemapEntry[]): string {
  const items = entries.map((entry) => {
    let line = `  <url><loc>${escapeXml(entry.url)}</loc>`;
    if (entry.lastmod) line += `<lastmod>${entry.lastmod}</lastmod>`;
    line += "</url>";
    return line;
  }).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</urlset>`;
}

function xmlSitemapIndex(entries: SitemapIndexEntry[]): string {
  const items = entries
    .map((entry) => `  <sitemap><loc>${escapeXml(entry.url)}</loc><lastmod>${entry.lastmod}</lastmod></sitemap>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</sitemapindex>`;
}

export function xmlResponse(body: string): Response {
  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=43200, stale-while-revalidate=86400",
    },
  });
}

export function buildSitemapIndex(): string {
  const lastmod = todayIso();
  const files = GATE_MODE ? ["sitemap-static.xml"] : [...SITEMAP_FILES];
  return xmlSitemapIndex(files.map((file) => ({
    url: `${BASE_URL}/${file}`,
    lastmod,
  })));
}

export function buildStaticSitemap(): string {
  const today = todayIso();

  if (GATE_MODE) {
    return xmlUrlset([
      { url: BASE_URL, lastmod: today, changefreq: "daily", priority: 1.0 },
      { url: `${BASE_URL}/voorwaarden`, lastmod: today, changefreq: "monthly", priority: 0.3 },
      { url: `${BASE_URL}/privacy`, lastmod: today, changefreq: "monthly", priority: 0.3 },
    ]);
  }

  const entries: SitemapEntry[] = [
    { url: BASE_URL, lastmod: today, changefreq: "hourly", priority: 1.0 },
    { url: `${BASE_URL}/vandaag`, lastmod: today, changefreq: "hourly", priority: 0.95 },
    { url: `${BASE_URL}/morgen`, lastmod: today, changefreq: "hourly", priority: 0.9 },
    { url: `${BASE_URL}/weer`, lastmod: today, changefreq: "hourly", priority: 0.9 },
    { url: `${BASE_URL}/steve`, lastmod: today, changefreq: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/over`, lastmod: today, changefreq: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/weer/48-uur`, lastmod: today, changefreq: "hourly", priority: 0.7 },
    { url: `${BASE_URL}/weer/onweer`, lastmod: today, changefreq: "hourly", priority: 0.6 },
    { url: `${BASE_URL}/weer/regen`, lastmod: today, changefreq: "hourly", priority: 0.6 },
    { url: `${BASE_URL}/contact`, lastmod: today, changefreq: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/privacy`, lastmod: today, changefreq: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/voorwaarden`, lastmod: today, changefreq: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/steun`, lastmod: today, changefreq: "monthly", priority: 0.4 },
  ];

  for (const slug of THEME_SLUGS) {
    entries.push({ url: `${BASE_URL}/weer/themas/${slug}`, lastmod: today, changefreq: "daily", priority: 0.7 });
  }

  for (const province of NL_PROVINCE_SLUGS) {
    entries.push({
      url: `${BASE_URL}/weer/${province}`,
      lastmod: today,
      changefreq: "hourly",
      priority: 0.9,
    });
  }

  return xmlUrlset(entries);
}

export function buildNLSitemap(): string {
  const today = todayIso();

  // In gate-modus zijn alle plaatspagina's dicht; lever een lege urlset zodat
  // een gecachte verwijzing naar dit bestand geen duizenden redirects aanbiedt.
  if (GATE_MODE) return xmlUrlset([]);
  const seen = new Set<string>();
  const entries: SitemapEntry[] = [];

  for (const place of NL_PLACES) {
    if (!isSitemapPlace(place)) continue;
    const slug = placeRouteSlug(place);
    const url = `${BASE_URL}/weer/${place.province}/${slug}`;
    if (seen.has(url)) continue;
    seen.add(url);
    entries.push({ url, lastmod: today, changefreq: "hourly", priority: place.venueType ? 0.7 : placePriority(place.population) });
  }

  entries.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  return xmlUrlset(entries);
}
