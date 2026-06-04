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
  return true;
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
  return xmlSitemapIndex(SITEMAP_FILES.map((file) => ({
    url: `${BASE_URL}/${file}`,
    lastmod,
  })));
}

export function buildStaticSitemap(): string {
  const today = todayIso();
  const entries: SitemapEntry[] = [
    { url: BASE_URL, lastmod: today, changefreq: "hourly", priority: 1.0 },
    { url: `${BASE_URL}/weer`, lastmod: today, changefreq: "hourly", priority: 0.9 },
    { url: `${BASE_URL}/piet`, lastmod: today, changefreq: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/reed`, lastmod: today, changefreq: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/koos`, lastmod: today, changefreq: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/steve`, lastmod: today, changefreq: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/over`, lastmod: today, changefreq: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/weer/48-uur`, lastmod: today, changefreq: "hourly", priority: 0.7 },
    { url: `${BASE_URL}/weer/onweer`, lastmod: today, changefreq: "hourly", priority: 0.6 },
    { url: `${BASE_URL}/weer/regen`, lastmod: today, changefreq: "hourly", priority: 0.6 },
    { url: `${BASE_URL}/contact`, lastmod: today, changefreq: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/privacy`, lastmod: today, changefreq: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/zakelijk`, lastmod: today, changefreq: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/vergelijken`, lastmod: today, changefreq: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/vergelijken/weerzone-vs-buienradar`, lastmod: today, changefreq: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/vergelijken/buienradar-alternatieven`, lastmod: today, changefreq: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/vergelijken/beste-weerwebsites`, lastmod: today, changefreq: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/vergelijken/vergelijkingstabel`, lastmod: today, changefreq: "monthly", priority: 0.5 },
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
  const seen = new Set<string>();
  const entries: SitemapEntry[] = [];

  for (const place of NL_PLACES) {
    if (!isSitemapPlace(place)) continue;
    const slug = placeRouteSlug(place);
    const url = `${BASE_URL}/weer/${place.province}/${slug}`;
    if (seen.has(url)) continue;
    seen.add(url);
    entries.push({ url, lastmod: today, changefreq: "hourly", priority: placePriority(place.population) });
  }

  entries.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  return xmlUrlset(entries);
}
