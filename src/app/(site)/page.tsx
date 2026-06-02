import type { Metadata } from "next";
import WeatherDashboard from "@/components/WeatherDashboard";
import KNMIForecastCard from "@/components/KNMIForecastCard";
import HomePitch from "@/components/HomePitch";
import TrustSection from "@/components/TrustSection";
import { DUTCH_CITIES } from "@/lib/types";
import { fetchWeatherData } from "@/lib/weather";
import { getSavedLocationServer } from "@/lib/location-cookies";
import { schemaSearchAction, schemaLd } from "@/lib/schema";
import { hreflangLanguages } from "@/lib/hreflang";

export const metadata: Metadata = {
  title: {
    absolute: "WEERZONE - Weer voor vandaag en morgen",
  },
  description:
    "WEERZONE geeft je een helder 48-uurs weerbericht voor jouw locatie. Reclamevrij en gericht op keuzes voor vandaag en morgen.",
  alternates: {
    canonical: "https://weerzone.nl",
    languages: hreflangLanguages("/"),
  },
  openGraph: {
    title: "WEERZONE - Weer voor vandaag en morgen",
    description:
      "Een helder 48-uurs weerbericht voor jouw locatie. Geen ruis, geen reclame, wel bruikbare keuzes.",
    type: "website",
    locale: "nl_NL",
    url: "https://weerzone.nl",
    siteName: "WEERZONE",
  },
  twitter: {
    card: "summary_large_image",
    title: "WEERZONE - Weer voor jouw plek",
    description:
      "Bekijk wat het weer vandaag en morgen betekent voor jouw locatie.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "WEERZONE",
  url: "https://weerzone.nl",
  description: "WEERZONE helpt je beslissen wat je vandaag en morgen met het weer doet. Helder, reclamevrij en tot 48 uur vooruit.",
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
          titleOverride="WEERZONE - weer voor vandaag en morgen"
          deferBelowFold
          lightweightBackground
          showSupportBanner={false}
          staticWeatherFallback
          showNarrative={false}
          afterWeatherContent={initialWeather ? (
            <KNMIForecastCard
              lat={activeLoc.lat}
              lon={activeLoc.lon}
              city={activeLoc.name}
              initialWeather={initialWeather}
              variant="compact"
            />
          ) : null}
          beforeFooter={
            <>
              <TrustSection />
              <HomePitch />
            </>
          }
        />
      </main>
    </>
  );
}
