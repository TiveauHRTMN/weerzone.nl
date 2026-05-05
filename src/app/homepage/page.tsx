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
  logo: "https://weerzone.nl/weerzone-icon.png",
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
        text: "WEERZONE is een hyperlokale weerhulp voor beslissingen vandaag en morgen. Je ziet wat het weer betekent voor fietsen, buiten werken, terras, strand, tuin en waarschuwingen, tot 48 uur vooruit.",
      },
    },
    {
      "@type": "Question",
      name: "Waarom maar 48 uur vooruit?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Omdat de komende 48 uur de periode is waarin weersverwachtingen het nuttigst zijn voor concrete keuzes. Verder vooruit kan nog richting geven, maar is minder geschikt voor planning per uur.",
      },
    },
    {
      "@type": "Question",
      name: "Waarom is WEERZONE zo nauwkeurig?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We combineren lokale weerdata, modelvergelijking en een praktische vertaalslag naar wat je vandaag en morgen kunt doen. Daardoor krijg je geen generieke samenvatting, maar informatie die echt bruikbaar is op locatie.",
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
  // No hardcoded default city — WeatherDashboard reads localStorage on client.
  // We prefetch Amsterdam as a warm server-side initial for SEO/LCP.
  const amsterdam = DUTCH_CITIES.find(c => c.name === "Amsterdam") || DUTCH_CITIES[0];
  const initialWeather = await fetchWeatherData(amsterdam.lat, amsterdam.lon).catch(() => undefined);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, orgLd, faqLd]) }}
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
