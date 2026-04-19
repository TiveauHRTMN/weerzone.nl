import type { Metadata } from "next";
import Link from "next/link";
import WeatherDashboard from "@/components/WeatherDashboard";
import HomePitch from "@/components/HomePitch";
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
    "WEERZONE.nl — De 14-daagse is gokken. Wij niet. 48 uur vooruit, KNMI HARMONIE, op jouw vierkante meter. Eén mail per ochtend, verder nergens last van.",
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
        text: "WEERZONE is een weerbericht dat jou kent. Elke ochtend één mail, 48 uur vooruit, op je eigen GPS-punt. Geen 14-daagse, geen code-geel-spam, geen ruis.",
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
        text: "De 48-uurs voorspelling op de homepage is gratis. De dagelijkse persoonlijke mail (Piet, Reed of Steve) is tot 1 juni 2026 gratis voor founders. Daarna vanaf €2,99 per maand, met jouw founder-tarief voor altijd vastgeklikt.",
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
        <WeatherDashboard initialCity={DUTCH_CITIES[0]} />
        <HomePitch />
      </main>
    </>
  );
}
