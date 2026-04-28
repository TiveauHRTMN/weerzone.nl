import { MetadataRoute } from 'next';
import ALL_PLACES_RAW from '@/lib/places.json';

const BASE_URL = 'https://weerzone.nl';

const PROVINCES = [
  "groningen", "friesland", "drenthe", "overijssel", "flevoland",
  "gelderland", "utrecht", "noord-holland", "zuid-holland", "zeeland",
  "noord-brabant", "limburg",
];

function placeSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/&/g, "en")
    .replace(/[^a-z0-9\-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Single Unified Sitemap
 * Next.js automatically maps this to /sitemap.xml
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // 1. Static Core Routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL,                  lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/piet`,        lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/reed`,        lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/zakelijk`,    lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/prijzen`,     lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/contact`,     lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/privacy`,     lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/weer`,        lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/weer/48-uur`, lastModified: now, changeFrequency: 'daily', priority: 0.6 },
    { url: `${BASE_URL}/weer/onweer`, lastModified: now, changeFrequency: 'daily', priority: 0.6 },
    { url: `${BASE_URL}/weer/regen`,  lastModified: now, changeFrequency: 'daily', priority: 0.6 },
  ];

  // 2. Weather Themes
  const themes: MetadataRoute.Sitemap = [
    "bbq-weer", "strandweer", "hardloopweer", "hooikoorts", "wintersport-nl",
  ].map(slug => ({
    url: `${BASE_URL}/weer/themas/${slug}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }));

  // 3. Province Pages
  const provincieRoutes: MetadataRoute.Sitemap = PROVINCES.map(p => ({
    url: `${BASE_URL}/weer/${p}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }));

  // 4. All Micro-locations (~8,600)
  const placeRoutes: MetadataRoute.Sitemap = (ALL_PLACES_RAW as { name: string; province: string }[]).map(place => ({
    url: `${BASE_URL}/weer/${place.province}/${placeSlug(place.name)}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }));

  return [...staticRoutes, ...themes, ...provincieRoutes, ...placeRoutes];
}
