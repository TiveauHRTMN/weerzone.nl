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
    "De brutale weerdienst van Nederland. KNMI HARMONIE + DWD ICON: 48 uur extreem nauwkeurig. Geen verzonnen voorspellingen.",
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
        text: "WeerZone is de brutale weerdienst van Nederland. We combineren twee toonaangevende weermodellen — KNMI HARMONIE en DWD ICON — voor een extreem nauwkeurige voorspelling van maximaal 48 uur.",
      },
    },
    {
      "@type": "Question",
      name: "Waarom voorspelt WeerZone maar 48 uur vooruit?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Weermodellen worden na 48 uur steeds onbetrouwbaarder. Een 14-daagse voorspelling is wetenschappelijk onzin. WeerZone toont alleen data waar je op kunt vertrouwen.",
      },
    },
    {
      "@type": "Question",
      name: "Welke weermodellen gebruikt WeerZone?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "WeerZone combineert KNMI HARMONIE (het Nederlandse supercomputer-model, gespecialiseerd in lokaal weer) en DWD ICON (het Duitse weermodel). Wanneer beide modellen het eens zijn, weet je dat de voorspelling klopt.",
      },
    },
    {
      "@type": "Question",
      name: "Is WeerZone gratis?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Ja, WeerZone is volledig gratis. Geen abonnementen, geen verborgen kosten. Gewoon eerlijk weer.",
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
      {/* Internal links for SEO — crawlable city pages */}
      <nav className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 pb-12" aria-label="Weer per stad">
        <h2 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">
          Weer per stad
        </h2>
        <div className="flex flex-wrap gap-2">
          {topCities.map((c) => {
            const slug = c.name.toLowerCase().replace(/\s+/g, "-");
            return (
              <Link
                key={c.name}
                href={`/weer/${slug}`}
                className="px-3 py-1.5 text-xs font-semibold text-white/60 bg-white/8 border border-white/15 rounded-full hover:bg-white/15 hover:text-white/90 transition-colors"
              >
                Weer {c.name}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
