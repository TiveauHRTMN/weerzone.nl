import type { MetadataRoute } from "next";

import { isServerFeatureEnabled } from "@/config/server-features";

const APP_URL = "https://calortravel.nl";

export default function robots(): MetadataRoute.Robots {
  if (!isServerFeatureEnabled("publicLaunchEnabled")) {
    return {
      rules: { userAgent: "*", disallow: "/" },
      host: APP_URL,
    };
  }
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/preview", "/trips/", "/dashboard", "/account"],
    },
    host: APP_URL,
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
