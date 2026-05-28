import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import ReedWarningsPage from "@/components/ReedWarningsPage";
import { getSavedLocationServer } from "@/lib/location-cookies";
import { DUTCH_CITIES } from "@/lib/types";
import { fetchWeatherData } from "@/lib/weather";
import { fetchEstofexBeneluxSummary, summarizeEstofexNL } from "@/lib/estofex";
import { hreflangCluster } from "@/lib/hreflang";
import "./reed-skin.css";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Reed's Extremen - onweer en stormrisico",
  description:
    "Reed volgt onweer, storm en officiële extremen met modelduiding, bliksemkaart en expertanalyse. Alleen als er echt iets op komst is.",
  alternates: {
    canonical: "https://weerzone.nl/reed",
    languages: hreflangCluster({
      nl: "/reed",
      de: "/de/warnungen",
      fr: "/fr/alertes",
      es: "/es/alertas",
    }),
  },
  openGraph: {
    title: "Reed's Extremen | WEERZONE",
    description:
      "Bekijk onweers- en stormrisico met modelduiding, bliksemkaart en expertanalyse.",
    type: "website",
    locale: "nl_NL",
    url: "https://weerzone.nl/reed",
    siteName: "WEERZONE",
  },
  twitter: {
    card: "summary_large_image",
    title: "Reed's Extremen",
    description:
      "Onweer, storm en officiële extremen voor jouw provincie, zonder ruis.",
  },
};

export default async function ReedPage() {
  const loc = await getSavedLocationServer().catch(() => null);
  const activeLoc =
    loc || DUTCH_CITIES.find((c) => c.name === "De Bilt") || DUTCH_CITIES[0];

  // Background is dynamisch op basis van het lokale weer (zelfde bron als /weer).
  const [initialWeather, estofex] = await Promise.all([
    fetchWeatherData(activeLoc.lat, activeLoc.lon, false, true).catch(() => undefined),
    fetchEstofexBeneluxSummary(2).catch(() => null),
  ]);

  const estofexInfo = estofex
    ? {
        level: estofex.maxLevel,
        synopsis:
          estofex.beneluxText?.slice(0, 320) ??
          summarizeEstofexNL(estofex) ??
          "Verhoogd risico op zwaar onweer in (een deel van) de regio. Bekijk de volledige outlook op estofex.org.",
        imageUrl: estofex.imageUrl,
        sourceUrl: estofex.sourceUrl,
        validUntil: estofex.validUntil,
      }
    : null;

  return (
    <ReedWarningsPage
      fontClassName={manrope.className}
      weatherCode={initialWeather?.current.weatherCode ?? 2}
      isDay={initialWeather?.current.isDay ?? true}
      lat={activeLoc.lat}
      lon={activeLoc.lon}
      estofex={estofexInfo}
    />
  );
}
