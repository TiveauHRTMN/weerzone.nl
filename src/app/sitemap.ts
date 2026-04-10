import type { MetadataRoute } from "next";
import { DUTCH_CITIES } from "@/lib/types";

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

  // City pages — /weer/amsterdam, /weer/rotterdam, etc.
  for (const city of DUTCH_CITIES) {
    const slug = city.name.toLowerCase().replace(/\s+/g, "-");
    routes.push({
      url: `${baseUrl}/weer/${slug}`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    });
  }

  // Static pages
  routes.push(
    { url: `${baseUrl}/zakelijk`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/embed`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  );

  return routes;
}
