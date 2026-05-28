import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/auth/", "/app/", "/reiszone/"],
      },
      // Zoekmachines
      { userAgent: "Bingbot", crawlDelay: 1 },
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
    sitemap: "https://weerzone.nl/sitemap.xml",
  };
}
