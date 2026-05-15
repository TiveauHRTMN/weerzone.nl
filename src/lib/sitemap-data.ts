/**
 * Gedeelde sitemap-data en XML-helpers.
 *
 * Wordt gebruikt door alle Route Handlers in src/app/sitemap*.xml/route.ts.
 * Houd de exports synchroon met scripts/gen-sitemap.ts en src/config/locales.ts.
 */

import { ALL_PLACES, placeSlug as canonicalPlaceSlug, type Place } from "@/lib/places-data";
import { PROVINCE_TO_DE_BUNDESLAND } from "@/config/locales";

export const BASE_URL = "https://weerzone.nl";

export const NL_PROVINCES = new Set([
  "groningen", "friesland", "drenthe", "overijssel", "flevoland",
  "gelderland", "utrecht", "noord-holland", "zuid-holland", "zeeland",
  "noord-brabant", "limburg",
]);

export const BE_PROVINCES = new Set([
  "antwerpen", "limburg-be", "oost-vlaanderen", "vlaams-brabant", "west-vlaanderen",
]);

export const DE_PROVINCES = new Set([
  "beieren", "berlijn", "brandenburg", "bremen", "hamburg", "hessen",
  "mecklenburg-voorpommeren", "nedersaksen", "noordrijn-westfalen", "rijnland-palts",
  "saarland", "saksen", "saksen-anhalt", "sleeswijk-holstein", "thuringen", "baden-wurttemberg",
]);

export const FR_PROVINCES = new Set([
  "ile-de-france", "wallonie",
]);

export const THEME_SLUGS = [
  "bbq-weer", "strandweer", "hardloopweer", "hooikoorts", "wintersport-nl",
] as const;

export interface SitemapEntry {
  url: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function isSitemapPlace(p: Place): boolean {
  if (p.province === "unknown-be") return false;
  if (p.name.length > 60) return false;
  const slug = canonicalPlaceSlug(p.name);
  if (!slug || slug.includes("--")) return false;
  return true;
}

function placePriority(pop?: number): number {
  if (!pop) return 0.5;
  if (pop >= 500_000) return 0.9;
  if (pop >= 100_000) return 0.8;
  if (pop >= 10_000)  return 0.7;
  if (pop >= 1_000)   return 0.6;
  return 0.5;
}

function todayIso(): string {
  return new Date(new Date().toDateString()).toISOString();
}

function xmlUrlset(entries: SitemapEntry[]): string {
  const items = entries.map((e) => {
    let line = `  <url><loc>${escapeXml(e.url)}</loc>`;
    if (e.lastmod)     line += `<lastmod>${e.lastmod}</lastmod>`;
    if (e.changefreq)  line += `<changefreq>${e.changefreq}</changefreq>`;
    if (e.priority !== undefined) line += `<priority>${e.priority.toFixed(1)}</priority>`;
    line += `</url>`;
    return line;
  }).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</urlset>`;
}

function xmlSitemapIndex(urls: string[]): string {
  const items = urls
    .map((u) => `  <sitemap><loc>${escapeXml(u)}</loc></sitemap>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</sitemapindex>`;
}

export function xmlResponse(body: string): Response {
  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

// ─── Sitemap index ────────────────────────────────────────────────────────────
export function buildSitemapIndex(): string {
  return xmlSitemapIndex([
    `${BASE_URL}/sitemap-static.xml`,
    `${BASE_URL}/sitemap-nl.xml`,
    `${BASE_URL}/sitemap-be.xml`,
    `${BASE_URL}/sitemap-de.xml`,
    `${BASE_URL}/sitemap-fr.xml`,
  ]);
}

// ─── Statische sitemap (NL + BE + DE + FR static pages + provincie/Bundesland overzichten) ──
export function buildStaticSitemap(): string {
  const today = todayIso();
  const entries: SitemapEntry[] = [];

  // NL statisch
  entries.push({ url: BASE_URL,                        lastmod: today, changefreq: "hourly",  priority: 1.0 });
  entries.push({ url: `${BASE_URL}/weer`,              lastmod: today, changefreq: "hourly",  priority: 0.9 });
  entries.push({ url: `${BASE_URL}/mijnweer`,          lastmod: today, changefreq: "weekly",  priority: 0.8 });
  entries.push({ url: `${BASE_URL}/waarschuwingen`,    lastmod: today, changefreq: "weekly",  priority: 0.8 });
  entries.push({ url: `${BASE_URL}/zakelijk`,          lastmod: today, changefreq: "weekly",  priority: 0.8 });
  entries.push({ url: `${BASE_URL}/prijzen`,           lastmod: today, changefreq: "monthly", priority: 0.7 });
  entries.push({ url: `${BASE_URL}/over`,              lastmod: today, changefreq: "monthly", priority: 0.6 });
  entries.push({ url: `${BASE_URL}/weer/48-uur`,       lastmod: today, changefreq: "hourly",  priority: 0.7 });
  entries.push({ url: `${BASE_URL}/weer/onweer`,       lastmod: today, changefreq: "hourly",  priority: 0.6 });
  entries.push({ url: `${BASE_URL}/weer/regen`,        lastmod: today, changefreq: "hourly",  priority: 0.6 });
  entries.push({ url: `${BASE_URL}/contact`,           lastmod: today, changefreq: "monthly", priority: 0.4 });
  entries.push({ url: `${BASE_URL}/privacy`,           lastmod: today, changefreq: "monthly", priority: 0.3 });

  // NL thema's
  for (const slug of THEME_SLUGS) {
    entries.push({ url: `${BASE_URL}/weer/themas/${slug}`, lastmod: today, changefreq: "daily", priority: 0.7 });
  }

  // NL + BE provincie-overzichten
  for (const p of [...NL_PROVINCES, ...BE_PROVINCES]) {
    entries.push({
      url: `${BASE_URL}/weer/${p}`,
      lastmod: today,
      changefreq: "hourly",
      priority: NL_PROVINCES.has(p) ? 0.9 : 0.8,
    });
  }

  // DE statisch
  entries.push({ url: `${BASE_URL}/de`,             lastmod: today, changefreq: "weekly",  priority: 0.9 });
  entries.push({ url: `${BASE_URL}/de/wetter`,      lastmod: today, changefreq: "hourly",  priority: 0.8 });
  entries.push({ url: `${BASE_URL}/de/mein-wetter`, lastmod: today, changefreq: "weekly",  priority: 0.8 });
  entries.push({ url: `${BASE_URL}/de/warnungen`,   lastmod: today, changefreq: "weekly",  priority: 0.7 });
  entries.push({ url: `${BASE_URL}/de/preise`,      lastmod: today, changefreq: "monthly", priority: 0.7 });
  entries.push({ url: `${BASE_URL}/de/uber-uns`,    lastmod: today, changefreq: "monthly", priority: 0.5 });
  entries.push({ url: `${BASE_URL}/de/kontakt`,     lastmod: today, changefreq: "monthly", priority: 0.4 });

  // DE Bundesland-overzichten
  for (const p of DE_PROVINCES) {
    const bundesland = PROVINCE_TO_DE_BUNDESLAND[p as keyof typeof PROVINCE_TO_DE_BUNDESLAND];
    if (bundesland) {
      entries.push({
        url: `${BASE_URL}/de/wetter/${bundesland}`,
        lastmod: today,
        changefreq: "hourly",
        priority: 0.8,
      });
    }
  }

  // FR statisch
  entries.push({ url: `${BASE_URL}/fr`,             lastmod: today, changefreq: "weekly",  priority: 0.9 });
  entries.push({ url: `${BASE_URL}/fr/meteo`,       lastmod: today, changefreq: "hourly",  priority: 0.8 });
  entries.push({ url: `${BASE_URL}/fr/mon-meteo`,   lastmod: today, changefreq: "weekly",  priority: 0.8 });
  entries.push({ url: `${BASE_URL}/fr/alertes`,     lastmod: today, changefreq: "weekly",  priority: 0.7 });
  entries.push({ url: `${BASE_URL}/fr/tarifs`,      lastmod: today, changefreq: "monthly", priority: 0.7 });
  entries.push({ url: `${BASE_URL}/fr/a-propos`,    lastmod: today, changefreq: "monthly", priority: 0.5 });
  entries.push({ url: `${BASE_URL}/fr/contact`,     lastmod: today, changefreq: "monthly", priority: 0.4 });

  // FR Région-overzichten
  for (const p of FR_PROVINCES) {
    entries.push({
      url: `${BASE_URL}/fr/meteo/${p}`,
      lastmod: today,
      changefreq: "hourly",
      priority: 0.8,
    });
  }

  return xmlUrlset(entries);
}

// ─── NL-plaatsen ─────────────────────────────────────────────────────────────
export function buildNLSitemap(): string {
  const today = todayIso();
  const seen = new Set<string>();
  const entries: SitemapEntry[] = [];

  for (const place of ALL_PLACES) {
    if (!isSitemapPlace(place)) continue;
    if (!NL_PROVINCES.has(place.province)) continue;
    const slug = canonicalPlaceSlug(place.name);
    const url = `${BASE_URL}/weer/${place.province}/${slug}`;
    if (seen.has(url)) continue;
    seen.add(url);
    entries.push({ url, lastmod: today, changefreq: "hourly", priority: placePriority(place.population) });
  }

  entries.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  return xmlUrlset(entries);
}

// ─── BE-plaatsen ─────────────────────────────────────────────────────────────
export function buildBESitemap(): string {
  const today = todayIso();
  const seen = new Set<string>();
  const entries: SitemapEntry[] = [];

  for (const place of ALL_PLACES) {
    if (!isSitemapPlace(place)) continue;
    if (!BE_PROVINCES.has(place.province)) continue;
    const slug = canonicalPlaceSlug(place.name);
    const url = `${BASE_URL}/weer/${place.province}/${slug}`;
    if (seen.has(url)) continue;
    seen.add(url);
    entries.push({ url, lastmod: today, changefreq: "hourly", priority: placePriority(place.population) });
  }

  entries.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  return xmlUrlset(entries);
}

// ─── DE-plaatsen ─────────────────────────────────────────────────────────────
export function buildDESitemap(): string {
  const today = todayIso();
  const seen = new Set<string>();
  const entries: SitemapEntry[] = [];

  for (const place of ALL_PLACES) {
    if (!isSitemapPlace(place)) continue;
    if (!DE_PROVINCES.has(place.province)) continue;
    const bundesland = PROVINCE_TO_DE_BUNDESLAND[place.province as keyof typeof PROVINCE_TO_DE_BUNDESLAND];
    if (!bundesland) continue;
    const slug = canonicalPlaceSlug(place.name);
    const url = `${BASE_URL}/de/wetter/${bundesland}/${slug}`;
    if (seen.has(url)) continue;
    seen.add(url);
    entries.push({ url, lastmod: today, changefreq: "hourly", priority: placePriority(place.population) });
  }

  entries.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  return xmlUrlset(entries);
}

// ─── FR-plaatsen ─────────────────────────────────────────────────────────────
export function buildFRSitemap(): string {
  const today = todayIso();
  const seen = new Set<string>();
  const entries: SitemapEntry[] = [];

  for (const place of ALL_PLACES) {
    if (!isSitemapPlace(place)) continue;
    if (!FR_PROVINCES.has(place.province)) continue;
    const region = place.province;
    const slug = canonicalPlaceSlug(place.name);
    const url = `${BASE_URL}/fr/meteo/${region}/${slug}`;
    if (seen.has(url)) continue;
    seen.add(url);
    entries.push({ url, lastmod: today, changefreq: "hourly", priority: placePriority(place.population) });
  }

  entries.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  return xmlUrlset(entries);
}
