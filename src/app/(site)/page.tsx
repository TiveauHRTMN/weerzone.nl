import type { Metadata } from "next";
import WeatherDashboard from "@/components/WeatherDashboard";
import HomePitch from "@/components/HomePitch";
import TrustSection from "@/components/TrustSection";
import AdSenseSlot from "@/components/AdSenseSlot";
import { DUTCH_CITIES } from "@/lib/types";
import { fetchWeatherData } from "@/lib/weather";
import { getSavedLocationServer } from "@/lib/location-cookies";
import { schemaSearchAction, schemaLd } from "@/lib/schema";

export const metadata: Metadata = {
  title: {
    absolute: "WEERZONE - Hyperlokaal weer voor vandaag en morgen",
  },
  description:
    "WEERZONE geeft je een helder 48-uurs weerbericht voor jouw locatie. Hyperlokaal, reclamevrij en gericht op keuzes voor vandaag en morgen.",
  keywords: [
    "weer",
    "weer vandaag",
    "weer morgen",
    "weerbericht Nederland",
    "hyperlokaal weer",
    "regen verwachting",
    "weersverwachting 48 uur",
  ],
  alternates: {
    canonical: "https://weerzone.nl",
    languages: {
      "nl-NL": "https://weerzone.nl",
      "nl-BE": "https://weerzone.nl",
      "de-DE": "https://weerzone.nl/de",
      "fr-FR": "https://weerzone.nl/fr",
      "x-default": "https://weerzone.nl",
    },
  },
  openGraph: {
    title: "WEERZONE - Hyperlokaal weer voor vandaag en morgen",
    description:
      "Een helder 48-uurs weerbericht voor jouw locatie. Geen ruis, geen reclame, wel bruikbare keuzes.",
    type: "website",
    locale: "nl_NL",
    url: "https://weerzone.nl",
    siteName: "WEERZONE",
  },
  twitter: {
    card: "summary_large_image",
    title: "WEERZONE - Hyperlokaal weer",
    description:
      "Bekijk wat het weer vandaag en morgen betekent voor jouw locatie.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "WEERZONE",
  url: "https://weerzone.nl",
  description: "WEERZONE helpt je beslissen wat je vandaag en morgen met het weer doet. Hyperlokaal, tot 48 uur vooruit.",
};

export default async function Home() {
  const loc = await getSavedLocationServer().catch(() => null);
  const activeLoc = loc || DUTCH_CITIES.find(c => c.name === "De Bilt") || DUTCH_CITIES[0];
  const initialWeather = await fetchWeatherData(activeLoc.lat, activeLoc.lon).catch(() => undefined);

  return (
    <>
      <script
        {...schemaLd([
          jsonLd,
          schemaSearchAction()
        ])}
      />
      <main>
        <WeatherDashboard
          initialCity={activeLoc}
          initialWeather={initialWeather}
          beforeFooter={
            <>
              <TrustSection />
              <HomePitch />
              <div className="mx-auto w-full max-w-3xl px-4 py-6">
                <AdSenseSlot slot="6163080099" />
              </div>
            </>
          }
        />
      </main>
    </>
  );
}
