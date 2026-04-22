import type { Metadata } from "next";
import Link from "next/link";
import WeatherDashboard from "@/components/WeatherDashboard";
import HomePitch from "@/components/HomePitch";
import TrustSection from "@/components/TrustSection";
import { DUTCH_CITIES } from "@/lib/types";
import { fetchWeatherData } from "@/lib/weather";

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
  description: "WeerZone.nl — De weerdienst die niet gokt. Vergeet de 14-daagse onzin. Wij leveren de komende 48 uur puur de hardst mogelijke KNMI HARMONIE data, exact op jouw vierkante meter. De rest is ruis.",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://weerzone.nl/weer/{city}",
    "query-input": "required name=city",
  },
};

const orgLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "WEERZONE",
  url: "https://weerzone.nl",
  logo: "https://weerzone.nl/favicon-icon.png",
  sameAs: [],
};

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Wat is WEERZONE?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "WEERZONE is een abonnement op een eerlijk weerbericht. Elke ochtend één mail op je postcode, 48 uur vooruit. Zonder reclame, zonder 14-daagse gokwerk.",
      },
    },
    {
      "@type": "Question",
      name: "Waarom maar 48 uur vooruit?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Omdat alles daarna gokken is. Een 14-daagse voorspelling is een muntje opgooien met een zonnetje erop — elke dag die je verder kijkt, neemt de betrouwbaarheid snel af. Wij houden ons bij wat bewezen klopt: 48 uur.",
      },
    },
    {
      "@type": "Question",
      name: "Welk model gebruikt WEERZONE?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "KNMI HARMONIE — het scherpste weermodel van Nederland, gebouwd voor ons kustklimaat. Raster van 2,5 km, dus fijnmazig genoeg voor jouw straat. Wij ontsluiten het rauw, zonder Silicon-Valley-filter ertussen.",
      },
    },
    {
      "@type": "Question",
      name: "Is het gratis?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "De 48-uurs voorspelling op de homepage is gratis en met advertenties. Een abonnement (Piet, Reed of Steve) is tijdelijk gratis. Vroege aanmelders houden hun introductieprijs. Abonnees krijgen de mails en het dashboard zonder reclame.",
      },
    },
  ],
};

export default async function Home() {
  // Default city for homepage server fetch
  const defaultCity = DUTCH_CITIES.find(c => c.name === "De Bilt") || DUTCH_CITIES[0];
  const initialWeather = await fetchWeatherData(defaultCity.lat, defaultCity.lon).catch(() => undefined);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, orgLd, faqLd]) }}
      />
      <main>
        <WeatherDashboard
          initialCity={defaultCity}
          initialWeather={initialWeather}
          titleOverride="WEERZONE | De eerlijke 48-uurs weersverwachting"
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
