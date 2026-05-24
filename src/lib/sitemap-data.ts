/**
 * Gedeelde sitemap-data en XML-helpers.
 *
 * Wordt gebruikt door alle Route Handlers in src/app/sitemap*.xml/route.ts.
 * Houd de exports synchroon met scripts/gen-sitemap.ts en src/config/locales.ts.
 */

import { ALL_PLACES, placeRouteSlug, type Place, type Province } from "@/lib/places-data";
import { PROVINCE_TO_DE_BUNDESLAND, PROVINCE_TO_FR_REGION } from "@/config/locales";

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
  "ain", "aisne", "allier", "alpes-de-haute-provence", "hautes-alpes", "alpes-maritimes",
  "ardeche", "ardennes", "ariege", "aube", "aude", "aveyron", "bouches-du-rhone",
  "calvados", "cantal", "charente", "charente-maritime", "cher", "correze", "cote-d-or",
  "cotes-d-armor", "creuse", "dordogne", "doubs", "drome", "eure", "eure-et-loir",
  "finistere", "corse-du-sud", "haute-corse", "gard", "haute-garonne", "gers",
  "gironde", "herault", "ille-et-vilaine", "indre", "indre-et-loire", "isere", "jura",
  "landes", "loir-et-cher", "loire", "haute-loire", "loire-atlantique", "loiret",
  "lot", "lot-et-garonne", "lozere", "maine-et-loire", "manche", "marne", "haute-marne",
  "mayenne", "meurthe-et-moselle", "meuse", "morbihan", "moselle", "nievre", "nord",
  "oise", "orne", "pas-de-calais", "puy-de-dome", "pyrenees-atlantiques",
  "hautes-pyrenees", "pyrenees-orientales", "bas-rhin", "haut-rhin", "rhone",
  "haute-saone", "saone-et-loire", "sarthe", "savoie", "haute-savoie", "paris",
  "seine-maritime", "seine-et-marne", "yvelines", "deux-sevres", "somme", "tarn",
  "tarn-et-garonne", "var", "vaucluse", "vendee", "vienne", "haute-vienne",
  "vosges", "yonne", "territoire-de-belfort", "essonne", "hauts-de-seine",
  "seine-saint-denis", "val-de-marne", "val-d-oise", "wallonie",
]);

// Luxemburg is tweetalig (DE + FR). Eigen sitemap met beide URL-vormen.
export const LU_PROVINCES = new Set(["luxembourg-country"]);
export const ES_PROVINCES = new Set(["spanje"]);

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
  const slug = placeRouteSlug(p);
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
    `${BASE_URL}/sitemap-lu.xml`,
    `${BASE_URL}/sitemap-es.xml`,
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
  entries.push({ url: `${BASE_URL}/weer/regen-op-vakantie`, lastmod: today, changefreq: "weekly",  priority: 0.7 });
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
    const bundesland = PROVINCE_TO_DE_BUNDESLAND[p as Province];
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
  entries.push({ url: `${BASE_URL}/fr`,             lastmod: today, changefreq: "weekly",  priority: 1.0 });
  entries.push({ url: `${BASE_URL}/fr/meteo`,       lastmod: today, changefreq: "hourly",  priority: 0.9 });
  entries.push({ url: `${BASE_URL}/fr/mon-meteo`,   lastmod: today, changefreq: "weekly",  priority: 0.8 });
  entries.push({ url: `${BASE_URL}/fr/alertes`,     lastmod: today, changefreq: "weekly",  priority: 0.7 });
  entries.push({ url: `${BASE_URL}/fr/tarifs`,      lastmod: today, changefreq: "monthly", priority: 0.7 });
  entries.push({ url: `${BASE_URL}/fr/a-propos`,    lastmod: today, changefreq: "monthly", priority: 0.5 });
  entries.push({ url: `${BASE_URL}/fr/contact`,     lastmod: today, changefreq: "monthly", priority: 0.4 });

  // FR Région-overzichten
  for (const p of FR_PROVINCES) {
    const region = PROVINCE_TO_FR_REGION[p as Province];
    if (region) {
      entries.push({
        url: `${BASE_URL}/fr/meteo/${region}`,
        lastmod: today,
        changefreq: "hourly",
        priority: 0.8,
      });
    }
  }
  // ES statisch
  entries.push({ url: `${BASE_URL}/es`,                lastmod: today, changefreq: "weekly",  priority: 1.0 });
  entries.push({ url: `${BASE_URL}/es/tiempo`,         lastmod: today, changefreq: "hourly",  priority: 0.9 });
  entries.push({ url: `${BASE_URL}/es/mi-tiempo`,      lastmod: today, changefreq: "weekly",  priority: 0.8 });
  entries.push({ url: `${BASE_URL}/es/alertas`,        lastmod: today, changefreq: "weekly",  priority: 0.7 });
  entries.push({ url: `${BASE_URL}/es/precios`,        lastmod: today, changefreq: "monthly", priority: 0.7 });
  entries.push({ url: `${BASE_URL}/es/sobre-nosotros`, lastmod: today, changefreq: "monthly", priority: 0.5 });
  entries.push({ url: `${BASE_URL}/es/contacto`,       lastmod: today, changefreq: "monthly", priority: 0.4 });

  // Add Wallonia overview specifically to static sitemap if not already there
  entries.push({ url: `${BASE_URL}/weer/wallonie`, lastmod: today, changefreq: "hourly", priority: 0.8 });
  entries.push({ url: `${BASE_URL}/weer/spanje`, lastmod: today, changefreq: "hourly", priority: 0.8 });

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
    const slug = placeRouteSlug(place);
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
    // Mariana treatment: include Wallonia in Belgian sitemap
    if (!BE_PROVINCES.has(place.province) && place.province !== "wallonie") continue;

    const slug = placeRouteSlug(place);
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
    const bundesland = PROVINCE_TO_DE_BUNDESLAND[place.province as Province];
    if (!bundesland) continue;
    const slug = placeRouteSlug(place);
    const url = `${BASE_URL}/de/wetter/${bundesland}/${slug}`;
    if (seen.has(url)) continue;
    seen.add(url);
    entries.push({ url, lastmod: today, changefreq: "hourly", priority: placePriority(place.population) });
  }

  entries.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  return xmlUrlset(entries);
}

// ─── LU-plaatsen (tweetalig: DE + FR) ────────────────────────────────────────
export function buildLUSitemap(): string {
  const today = todayIso();
  const seen = new Set<string>();
  const entries: SitemapEntry[] = [];

  // Beide overzichten staan in LU-sitemap i.p.v. static (Luxemburg is geen DE/FR provincie)
  entries.push({ url: `${BASE_URL}/de/wetter/luxembourg`, lastmod: today, changefreq: "hourly", priority: 0.9 });
  entries.push({ url: `${BASE_URL}/fr/meteo/luxembourg`,  lastmod: today, changefreq: "hourly", priority: 0.9 });

  for (const place of ALL_PLACES) {
    if (!isSitemapPlace(place)) continue;
    if (!LU_PROVINCES.has(place.province)) continue;
    const slug = placeRouteSlug(place);
    const priority = placePriority(place.population);

    const deUrl = `${BASE_URL}/de/wetter/luxembourg/${slug}`;
    if (!seen.has(deUrl)) {
      seen.add(deUrl);
      entries.push({ url: deUrl, lastmod: today, changefreq: "hourly", priority });
    }
    const frUrl = `${BASE_URL}/fr/meteo/luxembourg/${slug}`;
    if (!seen.has(frUrl)) {
      seen.add(frUrl);
      entries.push({ url: frUrl, lastmod: today, changefreq: "hourly", priority });
    }
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
    
    const region = PROVINCE_TO_FR_REGION[place.province as Province];
    if (!region) continue;

    const slug = placeRouteSlug(place);
    const url = `${BASE_URL}/fr/meteo/${region}/${slug}`;
    if (seen.has(url)) continue;
    seen.add(url);

    // Mariana treatment: dynamic frequency and priority
    const priority = placePriority(place.population);
    const changefreq = (place.population && place.population > 50000) ? "hourly" : "daily";

    entries.push({ url, lastmod: today, changefreq, priority });
  }

  // Sort by priority so Google crawls big cities first
  entries.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  return xmlUrlset(entries);
}

// Spaanse steden en dorpen.
export function buildESSitemap(): string {
  const today = todayIso();
  const seen = new Set<string>();
  const entries: SitemapEntry[] = [
    { url: `${BASE_URL}/es/tiempo/espana`, lastmod: today, changefreq: "hourly", priority: 0.9 },
  ];

  for (const place of ALL_PLACES) {
    if (!isSitemapPlace(place)) continue;
    if (!ES_PROVINCES.has(place.province)) continue;

    const slug = placeRouteSlug(place);
    const url = `${BASE_URL}/es/tiempo/espana/${slug}`;
    if (seen.has(url)) continue;
    seen.add(url);
    entries.push({ url, lastmod: today, changefreq: "daily", priority: placePriority(place.population) });
  }

  entries.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  return xmlUrlset(entries);
}

// Reiszone-sitemaps zijn verwijderd in v2 (agent-first relaunch — Reiszone
// als sub-brand is opgeheven). De buildReiszone*-functies en bijbehorende
// /sitemap-reiszone-*.xml routes zijn verwijderd; oude URLs leveren 308 → /.
