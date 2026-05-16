import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/auth/", "/app/"],
      },
      // Zoekmachines
      { userAgent: "Bingbot", crawlDelay: 1 },
      // AdSense crawler — expliciet toegelaten (anders valt 'ie onder *)
      { userAgent: "Mediapartners-Google", allow: "/" },
      // AI search crawlers — expliciet welkom
      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "OAI-SearchBot", allow: "/" },
      { userAgent: "ChatGPT-User", allow: "/" },
      { userAgent: "ClaudeBot", allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
      // Gemini training crawler — expliciet toegelaten (pro-AI-zichtbaarheid)
      { userAgent: "Google-Extended", allow: "/" },
      // Training-only crawler — geblokkeerd
      { userAgent: "CCBot", disallow: "/" },
    ],
    sitemap: [
      "https://weerzone.nl/sitemap.xml",
      "https://weerzone.nl/sitemap-static.xml",
      "https://weerzone.nl/sitemap-nl.xml",
      "https://weerzone.nl/sitemap-be.xml",
      "https://weerzone.nl/sitemap-de.xml",
      "https://weerzone.nl/sitemap-fr.xml",
      "https://weerzone.nl/sitemap-lu.xml",
    ],
  };
}
