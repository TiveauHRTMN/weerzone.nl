import type { Metadata } from "next";
import Link from "next/link";
import WeatherDashboard from "@/components/WeatherDashboard";
import { DUTCH_CITIES } from "@/lib/types";

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
  description:
    "WEERZONE.nl — Vergeet de 14-daagse. De komende 48 uur vooruit. De rest is ruis. KNMI HARMONIE data op de vierkante meter.",
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
        text: "WEERZONE vertelt je de werkelijkheid. We gebruiken de scherpste bronnen die er zijn (zoals KNMI HARMONIE) voor de enige voorspelling die ertoe doet: de komende 48 uur op je eigen postzegel nauwkeurig. De rest is ruis.",
      },
    },
    {
      "@type": "Question",
      name: "Waarom voorspelt WEERZONE maar 48 uur vooruit?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Omdat alles na 48 uur wetenschappelijk gezien onbetrouwbaar is. Die 14-daagse van je weer-app? Een random number generator met een zonnetje erop. Wij doen alleen wat bewezen klopt.",
      },
    },
    {
      "@type": "Question",
      name: "Welke weermodellen gebruikt WEERZONE?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We gebruiken de meest geavanceerde technieken van het KNMI en Duitsland die op je eigen postzegel nauwkeurig zijn. Wanneer de bronnen het eens zijn, weet je het zeker. Wanneer ze het oneens zijn, vertellen we je dat ook. Eerlijkheid boven alles.",
      },
    },
    {
      "@type": "Question",
      name: "Is WEERZONE gratis?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Het 48-uurs weerbericht is volledig gratis. Met een gratis account krijg je extra features: postcodespecifieke alerts, AI-kledingadvies van Piet en de 48-uurs Impact Analyse. Geen creditcard nodig.",
      },
    },
  ],
};

export default function Home() {
  // Top 10 cities for SEO internal linking
  const topCities = DUTCH_CITIES.slice(0, 10);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <main>
        <WeatherDashboard />
      </main>
    </>
  );
}
