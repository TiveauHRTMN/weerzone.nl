import type { MetadataRoute } from "next";

import { dominicanRepublicPack } from "@/domain/countries/packs/dominican-republic";

const APP_URL = "https://tripfit.travel";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date(
    `${dominicanRepublicPack.sourceCoverage.lastReviewedAt}T12:00:00Z`,
  );

  return [
    {
      url: APP_URL,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${APP_URL}/dominicaanse-republiek`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...dominicanRepublicPack.regions.map((region) => ({
      url: `${APP_URL}/dominicaanse-republiek/${region.slug}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: region.coverageLevel === "FLAGSHIP" ? 0.85 : 0.7,
    })),
  ];
}
