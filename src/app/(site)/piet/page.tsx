import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import PietWeatherPage from "@/components/PietWeatherPage";
import { getSavedLocationServer } from "@/lib/location-cookies";
import { DUTCH_CITIES } from "@/lib/types";
import { fetchWeatherData, fetchAirQuality } from "@/lib/weather";
import { buildPietView } from "@/lib/piet-view";
import { hreflangCluster } from "@/lib/hreflang";
import "./piet-skin.css";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const loc = await getSavedLocationServer().catch(() => null);
  const place = loc?.name || "jouw locatie";
  const title = loc?.name
    ? `Piet voor ${place} - 48 uur vooruit`
    : "Piet - jouw dagelijkse heads-up";
  const description = loc?.name
    ? `Persoonlijk weerbericht voor ${place}. Je ziet wat de komende 48 uur betekenen voor regen, wind en planning.`
    : "Persoonlijk weerbericht voor de komende 48 uur op jouw locatie. In gewone taal, zonder reclame en zonder gokwerk over twee weken vooruit.";

  return {
    title,
    description,
    alternates: {
      canonical: "https://weerzone.nl/piet",
      languages: hreflangCluster({
        nl: "/piet",
      }),
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "nl_NL",
      url: "https://weerzone.nl/piet",
      siteName: "WEERZONE",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Piet",
  headline: "Piet - 48 uur vooruit",
  description:
    "Een duidelijk weerbericht voor jouw locatie. Geen 14-daagse gok, gewoon de komende 48 uur in gewone taal.",
  author: { "@type": "Organization", name: "WEERZONE" },
  url: "https://weerzone.nl/piet",
  inLanguage: "nl-NL",
  about: {
    "@type": "Thing",
    name: "Weerbericht voor de komende 48 uur",
  },
  mainEntity: [
    {
      "@type": "Question",
      name: "Waarom stopt Mijn Weer bij 48 uur?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Omdat die periode het meest bruikbaar is voor concrete keuzes en planning per uur.",
      },
    },
    {
      "@type": "Question",
      name: "Kan ik mijn locatie aanpassen?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Ja. Gebruik de GPS-knop om direct je actuele locatie te laden of kies een andere plaats.",
      },
    },
  ],
};

export default async function PietPage() {
  const loc = await getSavedLocationServer().catch(() => null);
  const activeLoc =
    loc || DUTCH_CITIES.find((c) => c.name === "De Bilt") || DUTCH_CITIES[0];

  // Live data voedt zowel de UI-cijfers als de achtergrond/regenradar.
  const [initialWeather, air] = await Promise.all([
    fetchWeatherData(activeLoc.lat, activeLoc.lon).catch(() => null),
    fetchAirQuality(activeLoc.lat, activeLoc.lon).catch(() => null),
  ]);

  if (!initialWeather) {
    // Zeldzame upstream-uitval: nette rust-staat i.p.v. een crash.
    return (
      <main className={`piet-skin relative min-h-screen ${manrope.className}`}>
        <div className="relative z-10 max-w-[680px] mx-auto px-4 sm:px-6 py-16 text-center">
          <div className="rcard p-7 sm:p-9">
            <h1 className="text-[22px] font-extrabold text-slate-900">Even geen verbinding met de weerdata</h1>
            <p className="mt-2 text-[14px] text-slate-600">
              Piet kan de gegevens voor {activeLoc.name} nu niet ophalen. Probeer het zo nog eens.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const view = buildPietView(initialWeather, activeLoc.name, air);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PietWeatherPage
        view={view}
        fontClassName={manrope.className}
        weatherCode={initialWeather.current.weatherCode}
        isDay={initialWeather.current.isDay}
        lat={activeLoc.lat}
        lon={activeLoc.lon}
      />
    </>
  );
}
