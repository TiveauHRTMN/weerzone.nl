import type { Metadata } from "next";
import WeatherDashboard from "@/components/WeatherDashboard";
import PietExtended from "@/components/PietExtended";
import PremiumGate from "@/components/PremiumGate";
import { getSavedLocationServer } from "@/lib/location-cookies";
import { getCachedTruth } from "@/lib/wws-truth-server";
import { fetchWeatherData } from "@/lib/weather";
import { DUTCH_CITIES } from "@/lib/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Piet — Hyperlokaal weerbericht voor jouw straat",
  description:
    "Een eerlijke, korte weerbrief voor de komende 48 uur op jouw GPS-locatie. In gewone taal, zonder reclame, zonder gokwerk over twee weken vooruit.",
  alternates: { canonical: "https://weerzone.nl/piet" },
  openGraph: {
    title: "Piet — Het eerlijke 48-uurs weerbericht | Weerzone",
    description:
      "48 uur vooruit voor jouw locatie. Eerlijk, kort, persoonlijk — geen glazen-bol-praat over twee weken vooruit.",
    images: ["/og-image.png"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Piet — Hyperlokaal 48-uurs weerbericht",
  description:
    "De dagelijkse, eerlijke weeranalyse van Piet voor jouw GPS-locatie. Geen 14-daagse-gok, gewoon de komende 48 uur in gewone taal.",
  author: { "@type": "Organization", name: "Weerzone" },
  publisher: {
    "@type": "Organization",
    name: "Weerzone",
    logo: "https://weerzone.nl/weerzone-icon.png",
  },
  datePublished: new Date().toISOString().split("T")[0],
};

export default async function PietPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from("user_profile")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();
    profile = data;
  }

  const greetingName = profile?.full_name?.split(" ")[0] || "jou";

  const loc = await getSavedLocationServer();
  const defaultCity = DUTCH_CITIES.find(c => c.name === "De Bilt") || DUTCH_CITIES[0];
  const activeLoc = loc || defaultCity;

  const [initialTruth, initialWeather] = await Promise.all([
    getCachedTruth(activeLoc.lat, activeLoc.lon, "public"),
    fetchWeatherData(activeLoc.lat, activeLoc.lon).catch(() => null),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main>
        <WeatherDashboard
          initialCity={activeLoc}
          initialWeather={initialWeather ?? undefined}
          hideWeatherInfo={true}
          beforeFooter={
            <div className="space-y-6">
              {/* Persona intro */}
              <div className="card p-6">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-text-muted mb-1">
                  WEERZONE Persona · 48 uur
                </p>
                <h2 className="text-3xl font-black text-text-primary leading-tight">
                  Piet &amp; {greetingName}
                </h2>
                <p className="text-text-secondary text-sm leading-relaxed mt-2">
                  De volledige 48 uur voor jouw locatie — in gewone taal, met
                  concrete tips voor je dag. Betrouwbaar en lokaal, voor elke
                  straat van Nederland.
                </p>
              </div>

              <PremiumGate>
                <PietExtended
                  initialWWS={initialTruth}
                  initialWeather={initialWeather}
                  initialCity={loc || undefined}
                />
              </PremiumGate>

              <p className="text-center text-white/40 text-xs font-medium pb-4">
                Verder dan 48 uur kijken we niet vooruit — dan wordt het gokken.
              </p>
            </div>
          }
        />
      </main>
    </>
  );
}
