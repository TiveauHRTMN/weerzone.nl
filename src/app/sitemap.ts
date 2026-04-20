import type { MetadataRoute } from "next";
import { DUTCH_CITIES } from "@/lib/types";
import { ALL_PLACES, PROVINCE_LABELS, placeSlug, type Province } from "@/lib/places-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://weerzone.nl";

  // Homepage
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1.0,
    },
  ];

  // Legacy city pages — /weer/amsterdam, /weer/rotterdam, etc.
  for (const city of DUTCH_CITIES) {
    const slug = city.name.toLowerCase().replace(/\s+/g, "-");
    routes.push({
      url: `${baseUrl}/weer/${slug}`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    });
  }

  // City alert pages — /weer/amsterdam/alert, etc.
  // Hogere priority: Google beloont frequent bijgewerkte alert-content
  for (const city of DUTCH_CITIES) {
    const slug = city.name.toLowerCase().replace(/\s+/g, "-");
    routes.push({
      url: `${baseUrl}/weer/${slug}/alert`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    });
  }

  // ── PROGRAMMATIC SEO: Province hub pages ──
  for (const prov of Object.keys(PROVINCE_LABELS)) {
    routes.push({
      url: `${baseUrl}/weer/${prov}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    });
  }

  // ── PROGRAMMATIC SEO: All place pages ──
  // Elke plaats = een indexeerbare pagina voor "weer [plaatsnaam]"
  for (const place of ALL_PLACES) {
    routes.push({
      url: `${baseUrl}/weer/${place.province}/${placeSlug(place.name)}`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.85,
    });
  }

  // Topic pages — hoge prioriteit, mikken op generieke queries
  routes.push(
    { url: `${baseUrl}/weer`, lastModified: new Date(), changeFrequency: "daily", priority: 0.95 },
    { url: `${baseUrl}/weer/onweer`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/weer/regen`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/weer/48-uur`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
  );

  // Static pages
  routes.push(
    { url: `${baseUrl}/zakelijk`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/embed`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  );

  return routes;
}
