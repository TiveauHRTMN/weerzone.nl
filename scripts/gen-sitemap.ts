import fs from 'fs';
import path from 'path';

/**
 * Sitemap-index generator (handmatig: npx tsx scripts/gen-sitemap.ts).
 *
 * LET OP: schrijft naar public/ — aanwezige bestanden overriden de dynamische
 * src/app/sitemap.ts route. De build (`next build`) draait dit script NIET
 * automatisch; gebruik dit alleen voor offline testen of een statische fallback.
 *
 * Indeling:
 *   sitemap-static.xml      — statische pagina's + alle provincie-overzichten
 *   sitemap-nl.xml          — Nederlandse plaatsen (~10.400)
 *   sitemap-be.xml          — Vlaamse + Waalse plaatsen (~1.700)
 *   sitemap-de.xml          — Duitse plaatsen (~150)
 *   sitemap-fr.xml          — Franse plaatsen (~35.000)
 */

const placesPath = path.join(process.cwd(), 'src/lib/places.json');
const publicDir  = path.join(process.cwd(), 'public');
const BASE_URL   = 'https://weerzone.nl';

const NL_PROVINCES = new Set([
  'groningen', 'friesland', 'drenthe', 'overijssel', 'flevoland',
  'gelderland', 'utrecht', 'noord-holland', 'zuid-holland', 'zeeland',
  'noord-brabant', 'limburg',
]);

const BE_PROVINCES = new Set([
  'antwerpen', 'limburg-be', 'oost-vlaanderen', 'vlaams-brabant', 'west-vlaanderen',
]);

const DE_PROVINCES = new Set([
  'beieren', 'berlijn', 'brandenburg', 'bremen', 'hamburg', 'hessen',
  'mecklenburg-voorpommeren', 'nedersaksen', 'noordrijn-westfalen', 'rijnland-palts',
  'saarland', 'saksen', 'saksen-anhalt', 'sleeswijk-holstein', 'thuringen', 'baden-wurttemberg',
]);

const FR_PROVINCES = new Set([
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
  "seine-saint-denis", "val-de-marne", "val-d-oise", "guadeloupe", "martinique",
  "guyane", "la-reunion", "mayotte",
]);

// Interne province-key → publieke Duitse URL-slug.
const PROVINCE_TO_DE_BUNDESLAND: Record<string, string> = {
  berlijn: 'berlin',
  beieren: 'bayern',
  'noordrijn-westfalen': 'nordrhein-westfalen',
  nedersaksen: 'niedersachsen',
  saksen: 'sachsen',
  'saksen-anhalt': 'sachsen-anhalt',
  thuringen: 'thueringen',
  'mecklenburg-voorpommeren': 'mecklenburg-vorpommern',
  'sleeswijk-holstein': 'schleswig-holstein',
  'rijnland-palts': 'rheinland-pfalz',
  'baden-wurttemberg': 'baden-wuerttemberg',
  hessen: 'hessen',
  hamburg: 'hamburg',
  bremen: 'bremen',
  saarland: 'saarland',
  brandenburg: 'brandenburg',
};

const NL_THEMES = ['bbq-weer', 'strandweer', 'hardloopweer', 'hooikoorts', 'wintersport-nl'];

function placeSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/&/g, 'en')
    .replace(/[^a-z0-9\-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function url(loc: string, lastmod: string, changefreq: string, priority: string): string {
  return `  <url><loc>${loc}</loc><lastmod>${lastmod}</lastmod><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>\n`;
}

function wrapUrlset(inner: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${inner}</urlset>`;
}

function wrapIndex(children: string[]): string {
  const entries = children.map(c => `  <sitemap><loc>${c}</loc></sitemap>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</sitemapindex>`;
}

function placePriority(pop?: number): string {
  if (!pop) return '0.5';
  if (pop >= 500_000) return '0.9';
  if (pop >= 100_000) return '0.8';
  if (pop >= 10_000)  return '0.7';
  if (pop >= 1_000)   return '0.6';
  return '0.5';
}

interface RawPlace {
  name: string;
  province: string;
  lat: number;
  lon: number;
  population?: number;
}

async function run() {
  console.log('🚀 Generating sitemap index...');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  const places: RawPlace[] = JSON.parse(fs.readFileSync(placesPath, 'utf8'));
  const placesLastMod = new Date(fs.statSync(placesPath).mtime).toISOString();
  const staticLastMod = new Date().toISOString();

  // ── sitemap-static.xml ──
  let staticXml = '';

  // NL statisch
  staticXml += url(`${BASE_URL}`,                staticLastMod, 'hourly',  '1.0');
  staticXml += url(`${BASE_URL}/weer`,           staticLastMod, 'hourly',  '0.9');
  staticXml += url(`${BASE_URL}/mijnweer`,       staticLastMod, 'weekly',  '0.8');
  staticXml += url(`${BASE_URL}/waarschuwingen`, staticLastMod, 'weekly',  '0.8');
  staticXml += url(`${BASE_URL}/zakelijk`,       staticLastMod, 'weekly',  '0.8');
  staticXml += url(`${BASE_URL}/prijzen`,        staticLastMod, 'monthly', '0.7');
  staticXml += url(`${BASE_URL}/over`,           staticLastMod, 'monthly', '0.6');
  staticXml += url(`${BASE_URL}/weer/48-uur`,    staticLastMod, 'hourly',  '0.7');
  staticXml += url(`${BASE_URL}/weer/onweer`,    staticLastMod, 'hourly',  '0.6');
  staticXml += url(`${BASE_URL}/weer/regen`,     staticLastMod, 'hourly',  '0.6');
  staticXml += url(`${BASE_URL}/contact`,        staticLastMod, 'monthly', '0.4');
  staticXml += url(`${BASE_URL}/privacy`,        staticLastMod, 'monthly', '0.3');
  NL_THEMES.forEach(t => {
    staticXml += url(`${BASE_URL}/weer/themas/${t}`, staticLastMod, 'daily', '0.7');
  });
  // NL+BE provincies
  [...NL_PROVINCES, ...BE_PROVINCES, 'wallonie'].forEach(p => {
    const prio = NL_PROVINCES.has(p) ? '0.9' : '0.8';
    staticXml += url(`${BASE_URL}/weer/${p}`, placesLastMod, 'hourly', prio);
  });

  // DE statisch
  staticXml += url(`${BASE_URL}/de`,             staticLastMod, 'weekly',  '0.9');
  staticXml += url(`${BASE_URL}/de/wetter`,      staticLastMod, 'hourly',  '0.8');
  staticXml += url(`${BASE_URL}/de/mein-wetter`, staticLastMod, 'weekly',  '0.8');
  staticXml += url(`${BASE_URL}/de/warnungen`,   staticLastMod, 'weekly',  '0.7');
  staticXml += url(`${BASE_URL}/de/preise`,      staticLastMod, 'monthly', '0.7');
  staticXml += url(`${BASE_URL}/de/uber-uns`,    staticLastMod, 'monthly', '0.5');
  staticXml += url(`${BASE_URL}/de/kontakt`,     staticLastMod, 'monthly', '0.4');
  for (const p of DE_PROVINCES) {
    const bundesland = PROVINCE_TO_DE_BUNDESLAND[p];
    if (bundesland) {
      staticXml += url(`${BASE_URL}/de/wetter/${bundesland}`, placesLastMod, 'hourly', '0.8');
    }
  }

  // FR statisch
  staticXml += url(`${BASE_URL}/fr`,             staticLastMod, 'weekly',  '0.9');
  staticXml += url(`${BASE_URL}/fr/meteo`,       staticLastMod, 'hourly',  '0.8');
  staticXml += url(`${BASE_URL}/fr/mon-meteo`,   staticLastMod, 'weekly',  '0.8');
  staticXml += url(`${BASE_URL}/fr/alertes`,     staticLastMod, 'weekly',  '0.7');
  staticXml += url(`${BASE_URL}/fr/tarifs`,      staticLastMod, 'monthly', '0.7');
  staticXml += url(`${BASE_URL}/fr/a-propos`,    staticLastMod, 'monthly', '0.5');
  staticXml += url(`${BASE_URL}/fr/contact`,     staticLastMod, 'monthly', '0.4');
  for (const p of FR_PROVINCES) {
    staticXml += url(`${BASE_URL}/fr/meteo/${p}`, placesLastMod, 'hourly', '0.8');
  }

  fs.writeFileSync(path.join(publicDir, 'sitemap-static.xml'), wrapUrlset(staticXml));

  // ── per-land plaatsen sitemaps ──
  const buckets: Record<'nl' | 'be' | 'de' | 'fr', RawPlace[]> = { nl: [], be: [], de: [], fr: [] };
  const seen = new Set<string>();

  for (const place of places) {
    if (place.province === 'unknown-be') continue;
    const slug = placeSlug(place.name);
    if (!slug || slug.includes('--') || place.name.length > 60) continue;
    const key = `${place.province}/${slug}`;
    if (seen.has(key)) continue;
    seen.add(key);

    if (NL_PROVINCES.has(place.province)) buckets.nl.push(place);
    else if (BE_PROVINCES.has(place.province) || place.province === 'wallonie') buckets.be.push(place);
    else if (DE_PROVINCES.has(place.province)) buckets.de.push(place);
    else if (FR_PROVINCES.has(place.province)) buckets.fr.push(place);
  }

  // NL: /weer/${province}/${slug}
  {
    let xml = '';
    buckets.nl.sort((a, b) => (b.population ?? 0) - (a.population ?? 0)).forEach(place => {
      xml += url(`${BASE_URL}/weer/${place.province}/${placeSlug(place.name)}`, placesLastMod, 'hourly', placePriority(place.population));
    });
    fs.writeFileSync(path.join(publicDir, 'sitemap-nl.xml'), wrapUrlset(xml));
  }

  // BE: /weer/${province}/${slug} (Includes Wallonie now)
  {
    let xml = '';
    buckets.be.sort((a, b) => (b.population ?? 0) - (a.population ?? 0)).forEach(place => {
      xml += url(`${BASE_URL}/weer/${place.province}/${placeSlug(place.name)}`, placesLastMod, 'hourly', placePriority(place.population));
    });
    fs.writeFileSync(path.join(publicDir, 'sitemap-be.xml'), wrapUrlset(xml));
  }

  // DE: /de/wetter/${bundesland}/${slug}
  {
    let xml = '';
    buckets.de.sort((a, b) => (b.population ?? 0) - (a.population ?? 0)).forEach(place => {
      const bundesland = PROVINCE_TO_DE_BUNDESLAND[place.province];
      if (!bundesland) return;
      xml += url(`${BASE_URL}/de/wetter/${bundesland}/${placeSlug(place.name)}`, placesLastMod, 'hourly', placePriority(place.population));
    });
    fs.writeFileSync(path.join(publicDir, 'sitemap-de.xml'), wrapUrlset(xml));
  }

  // FR: /fr/meteo/${region}/${slug}
  {
    let xml = '';
    buckets.fr.sort((a, b) => (b.population ?? 0) - (a.population ?? 0)).forEach(place => {
      const priority = placePriority(place.population);
      const freq = (place.population && place.population > 50000) ? 'hourly' : 'daily';
      xml += url(`${BASE_URL}/fr/meteo/${place.province}/${placeSlug(place.name)}`, placesLastMod, freq, priority);
    });
    fs.writeFileSync(path.join(publicDir, 'sitemap-fr.xml'), wrapUrlset(xml));
  }

  // ── sitemap.xml ──
  const childUrls = [
    `${BASE_URL}/sitemap-static.xml`,
    `${BASE_URL}/sitemap-nl.xml`,
    `${BASE_URL}/sitemap-be.xml`,
    `${BASE_URL}/sitemap-de.xml`,
    `${BASE_URL}/sitemap-fr.xml`,
  ];
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), wrapIndex(childUrls));
  console.log(`✅ Sitemap index klaar — ${buckets.nl.length + buckets.be.length + buckets.de.length + buckets.fr.length} locaties over 5 sitemaps`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
