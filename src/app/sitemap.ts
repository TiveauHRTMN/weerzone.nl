import { MetadataRoute } from 'next';
import { ALL_PLACES } from '@/lib/places-data';

/**
 * SEO TURBO: Segmented Sitemap Index
 * We splitsen de 9.000+ pagina's op per provincie.
 * Dit voorkomt memory limits en zorgt dat Google de site sneller 'snapt'.
 */

const PROVINCES = [
  "groningen", "friesland", "drenthe", "overijssel", "flevoland", "gelderland", 
  "utrecht", "noord-holland", "zuid-holland", "zeeland", "noord-brabant", "limburg"
];

export async function generateSitemaps() {
  // We genereren 12 sitemaps (één per provincie)
  return PROVINCES.map((prov, id) => ({ id }));
}

export default async function sitemap({
  id,
}: {
  id: number;
}): Promise<MetadataRoute.Sitemap> {
  // Als er geen id is (de hoofd sitemap.xml), geven we de statische pagina's
  if (id === undefined) {
    return [
      { url: 'https://weerzone.nl', lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
      { url: 'https://weerzone.nl/prijzen', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
      { url: 'https://weerzone.nl/over-ons', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    ];
  }

  const prov = PROVINCES[id];
  const cities = ALL_PLACES.filter(p => p.province === prov);

  return cities.map((city) => ({
    url: `https://weerzone.nl/weer/${city.name.toLowerCase().replace(/ /g, '-')}`,
    lastModified: new Date(),
    changeFrequency: 'hourly',
    priority: 0.7,
  }));
}
