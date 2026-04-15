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
  name: "WeerZone",
  url: "https://weerzone.nl",
  description:
    "Vergeet de 14-daagse. De komende 48 uur op de vierkante meter. KNMI HARMONIE + DWD ICON + ICON-D2. De enige weerdienst die niet liegt.",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://weerzone.nl/weer/{city}",
    "query-input": "required name=city",
  },
};

const orgLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "WeerZone",
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
      name: "Wat is WeerZone?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "WeerZone is de weerdienst die niet liegt. We combineren KNMI HARMONIE, DWD ICON en ICON-D2 — voor de enige voorspelling die ertoe doet: de komende 48 uur op de kilometer nauwkeurig. De rest is ruis.",
      },
    },
    {
      "@type": "Question",
      name: "Waarom voorspelt WeerZone maar 48 uur vooruit?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Omdat alles na 48 uur wetenschappelijk gezien onbetrouwbaar is. Die 14-daagse van je weer-app? Een random number generator met een zonnetje erop. Wij doen alleen wat bewezen klopt.",
      },
    },
    {
      "@type": "Question",
      name: "Welke weermodellen gebruikt WeerZone?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "KNMI HARMONIE (het Nederlandse weermodel), DWD ICON en ICON-D2 (het ultra-high-resolution geneste model). Wanneer alle modellen het eens zijn, weet je het zeker. Wanneer ze het oneens zijn, vertellen we je dat ook. Eerlijkheid boven alles.",
      },
    },
    {
      "@type": "Question",
      name: "Is WeerZone gratis?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Het 48-uurs weerbericht is volledig gratis. Met een gratis account krijg je extra features: postcodespecifieke alerts, AI-kledingadvies en de 48-uurs Impact Analyse. Geen creditcard nodig.",
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
