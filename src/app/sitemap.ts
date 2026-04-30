import { MetadataRoute } from 'next';
import ALL_PLACES_RAW from '@/lib/places.json';

const BASE_URL = 'https://weerzone.nl';

const PROVINCES = [
  "groningen", "friesland", "drenthe", "overijssel", "flevoland",
  "gelderland", "utrecht", "noord-holland", "zuid-holland", "zeeland",
  "noord-brabant", "limburg",
] as const;

const THEME_SLUGS = [
  "bbq-weer", "strandweer", "hardloopweer", "hooikoorts", "wintersport-nl",
] as const;

type Place = { name: string; province: string; population?: number };

function placeSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, "en")
    .replace(/[^a-z0-9\-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function placePriority(population?: number): number {
  if (!population)             return 0.5;
  if (population >= 100_000)   return 0.8;
  if (population >= 10_000)    return 0.7;
  if (population >= 1_000)     return 0.6;
  return 0.5;
}

// Geen generateSitemaps: alles in één /sitemap.xml (8.600+ URLs, ruim onder Google's limiet van 50.000)
export default function sitemap(): MetadataRoute.Sitemap {
  const today = new Date(new Date().toDateString());
  const places = ALL_PLACES_RAW as Place[];

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL,                  lastModified: today, changeFrequency: 'hourly',  priority: 1.0 },
    { url: `${BASE_URL}/weer`,        lastModified: today, changeFrequency: 'hourly',  priority: 0.9 },
    { url: `${BASE_URL}/piet`,        lastModified: today, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE_URL}/reed`,        lastModified: today, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE_URL}/zakelijk`,    lastModified: today, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE_URL}/prijzen`,     lastModified: today, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/weer/48-uur`, lastModified: today, changeFrequency: 'hourly',  priority: 0.7 },
    { url: `${BASE_URL}/weer/onweer`, lastModified: today, changeFrequency: 'hourly',  priority: 0.6 },
    { url: `${BASE_URL}/weer/regen`,  lastModified: today, changeFrequency: 'hourly',  priority: 0.6 },
    { url: `${BASE_URL}/contact`,     lastModified: today, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/privacy`,     lastModified: today, changeFrequency: 'monthly', priority: 0.3 },
  ];

  const themeRoutes: MetadataRoute.Sitemap = THEME_SLUGS.map(slug => ({
    url: `${BASE_URL}/weer/themas/${slug}`,
    lastModified: today,
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }));

  const provinceRoutes: MetadataRoute.Sitemap = PROVINCES.map(p => ({
    url: `${BASE_URL}/weer/${p}`,
    lastModified: today,
    changeFrequency: 'hourly' as const,
    priority: 0.9,
  }));

  // Gesorteerd: grote steden eerst (beste crawlbudget-benutting)
  const placeRoutes: MetadataRoute.Sitemap = [...places]
    .sort((a, b) => (b.population ?? 0) - (a.population ?? 0))
    .map(place => ({
      url: `${BASE_URL}/weer/${place.province}/${placeSlug(place.name)}`,
      lastModified: today,
      changeFrequency: 'hourly' as const,
      priority: placePriority(place.population),
    }));

  return [...staticRoutes, ...themeRoutes, ...provinceRoutes, ...placeRoutes];
}
