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

  return routes;
}
