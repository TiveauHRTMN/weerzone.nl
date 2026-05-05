import type { Metadata } from "next";
import WeatherDashboard from "@/components/WeatherDashboard";
import HomePitch from "@/components/HomePitch";
import TrustSection from "@/components/TrustSection";
import { DUTCH_CITIES } from "@/lib/types";
import { fetchWeatherData } from "@/lib/weather";

export const revalidate = 600; // 10 minute cache

export const metadata: Metadata = {
  alternates: {
    canonical: "https://weerzone.nl",
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
  // No hardcoded default city — WeatherDashboard reads localStorage on client.
  // We prefetch Amsterdam as a warm server-side initial for SEO/LCP.
  const amsterdam = DUTCH_CITIES.find(c => c.name === "Amsterdam") || DUTCH_CITIES[0];
  const initialWeather = await fetchWeatherData(amsterdam.lat, amsterdam.lon).catch(() => undefined);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main>
        <WeatherDashboard
          initialCity={amsterdam}
          initialWeather={initialWeather}
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
