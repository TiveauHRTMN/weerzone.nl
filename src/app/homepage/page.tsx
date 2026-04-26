import type { Metadata } from "next";
import Link from "next/link";
import WeatherDashboard from "@/components/WeatherDashboard";
import HomePitch from "@/components/HomePitch";
import TrustSection from "@/components/TrustSection";
import { DUTCH_CITIES } from "@/lib/types";
import { fetchWeatherData } from "@/lib/weather";

export const dynamic = "force-dynamic";

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
  description: "WeerZone is de nauwkeurigste weersvoorspelling van Nederland. Voor jouw postcode, op 1 bij 1 kilometer, tot 48 uur vooruit.",
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
        text: "WEERZONE is de nauwkeurigste weersvoorspelling van Nederland. Elke ochtend één mail op je postcode, 48 uur vooruit, op 1 bij 1 kilometer precies. Zonder advertenties.",
      },
    },
    {
      "@type": "Question",
      name: "Waarom maar 48 uur vooruit?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Omdat dat zo ver is als een weersvoorspelling betrouwbaar reikt. Elke dag die je verder kijkt, neemt de nauwkeurigheid sterk af. Binnen die 48 uur zijn wij de meest precieze van Nederland.",
      },
    },
    {
      "@type": "Question",
      name: "Waarom is WEERZONE zo nauwkeurig?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We voorspellen op 1 bij 1 kilometer precies — veel fijnmaziger dan de gangbare weerdiensten. Daardoor klopt onze voorspelling op straatniveau, niet alleen voor je provincie.",
      },
    },
    {
      "@type": "Question",
      name: "Is het gratis?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "De 48-uurs voorspelling op de homepage is gratis en met advertenties. Een abonnement (Piet, Reed of Steve) is tijdelijk gratis. Vroege aanmelders houden hun introductieprijs. Abonnees krijgen de mails en het dashboard zonder advertenties.",
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
