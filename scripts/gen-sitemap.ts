import fs from 'fs';
import path from 'path';

/**
 * Modern sitemap generator that writes to public/sitemap.xml.
 * Uses consistent slug logic from src/lib/places-data.ts.
 */

const placesPath = path.join(process.cwd(), 'src/lib/places.json');
const sitemapPath = path.join(process.cwd(), 'public/sitemap.xml');
const BASE_URL = 'https://weerzone.nl';

function placeSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "en")
    .replace(/[^a-z0-9\-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function run() {
  console.log("🚀 Generating static sitemap...");
  const places = JSON.parse(fs.readFileSync(placesPath, 'utf8'));
  const now = new Date().toISOString();

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  // Home
  xml += `  <url><loc>${BASE_URL}</loc><lastmod>${now}</lastmod><priority>1.0</priority></url>\n`;

  // Static Pages
  xml += `  <url><loc>${BASE_URL}/piet</loc><lastmod>${now}</lastmod><priority>0.8</priority></url>\n`;
  xml += `  <url><loc>${BASE_URL}/reed</loc><lastmod>${now}</lastmod><priority>0.8</priority></url>\n`;
  xml += `  <url><loc>${BASE_URL}/zakelijk</loc><lastmod>${now}</lastmod><priority>0.8</priority></url>\n`;
  xml += `  <url><loc>${BASE_URL}/prijzen</loc><lastmod>${now}</lastmod><priority>0.7</priority></url>\n`;
  xml += `  <url><loc>${BASE_URL}/contact</loc><lastmod>${now}</lastmod><priority>0.5</priority></url>\n`;
  xml += `  <url><loc>${BASE_URL}/privacy</loc><lastmod>${now}</lastmod><priority>0.3</priority></url>\n`;

  // Thema pages
  const themes = ["bbq-weer", "strandweer", "hardloopweer", "hooikoorts", "wintersport-nl"];
  themes.forEach(slug => {
    xml += `  <url><loc>${BASE_URL}/weer/themas/${slug}</loc><lastmod>${now}</lastmod><priority>0.7</priority></url>\n`;
  });

  // Weer subpages
  xml += `  <url><loc>${BASE_URL}/weer/48-uur</loc><lastmod>${now}</lastmod><priority>0.6</priority></url>\n`;
  xml += `  <url><loc>${BASE_URL}/weer/onweer</loc><lastmod>${now}</lastmod><priority>0.6</priority></url>\n`;
  xml += `  <url><loc>${BASE_URL}/weer/regen</loc><lastmod>${now}</lastmod><priority>0.6</priority></url>\n`;

  // Provinces
  const provinces = ["groningen", "friesland", "drenthe", "overijssel", "flevoland", "gelderland", "utrecht", "noord-holland", "zuid-holland", "zeeland", "noord-brabant", "limburg"];
  provinces.forEach(p => {
    xml += `  <url><loc>${BASE_URL}/weer/${p}</loc><lastmod>${now}</lastmod><priority>0.9</priority></url>\n`;
  });

  // Priority Places (Manual focus)
  const priorityCityNames = ["Amsterdam", "Rotterdam", "Den Haag", "Utrecht", "Groningen", "Haarlem"];
  const priorityPlaces = places.filter((p: any) => priorityCityNames.includes(p.name));
  const otherPlaces = places.filter((p: any) => !priorityCityNames.includes(p.name));

  [...priorityPlaces, ...otherPlaces].forEach((place: any) => {
    const slug = placeSlug(place.name);
    xml += `  <url><loc>${BASE_URL}/weer/${place.province}/${slug}</loc><lastmod>${now}</lastmod><priority>${priorityCityNames.includes(place.name) ? '0.7' : '0.5'}</priority></url>\n`;
  });

  xml += '</urlset>';

  fs.writeFileSync(sitemapPath, xml);
  console.log(`✅ Sitemap saved to ${sitemapPath} (${places.length} locations with prioritized cities)`);
}

run().catch(console.error);
