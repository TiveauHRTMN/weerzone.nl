import type { MetadataRoute } from "next";

const APP_URL = "https://tripfit.travel";

export default function robots(): MetadataRoute.Robots {
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
