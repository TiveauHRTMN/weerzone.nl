import type { Metadata } from "next";
import WeatherDashboard from "@/components/WeatherDashboard";
import PietExtended from "@/components/PietExtended";
import PremiumGate from "@/components/PremiumGate";
import { getSavedLocationServer } from "@/lib/location-cookies";
import { DUTCH_CITIES } from "@/lib/types";
import { fetchWeatherData } from "@/lib/weather";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Jouw Weer — Hyperlokaal weerbericht voor jouw straat",
  description:
    "Een eerlijk, persoonlijk weerbericht voor de komende 48 uur op jouw GPS-locatie. In gewone taal, zonder reclame, zonder gokwerk over twee weken vooruit.",
  alternates: { canonical: "https://weerzone.nl/jouwweer" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Piet — Hyperlokaal 48-uurs weerbericht",
  description:
    "De dagelijkse, eerlijke weeranalyse van Piet voor jouw GPS-locatie. Geen 14-daagse-gok, gewoon de komende 48 uur in gewone taal.",
  author: { "@type": "Organization", name: "Weerzone" },
  datePublished: new Date().toISOString().split("T")[0],
};

export default async function PietPage() {
  const loc = await getSavedLocationServer().catch(() => null);
  const activeLoc = loc || DUTCH_CITIES.find(c => c.name === "De Bilt") || DUTCH_CITIES[0];

  const lat = typeof activeLoc.lat === "number" && !isNaN(activeLoc.lat) ? activeLoc.lat : 52.1;
  const lon = typeof activeLoc.lon === "number" && !isNaN(activeLoc.lon) ? activeLoc.lon : 5.18;
  const initialWeather = await fetchWeatherData(lat, lon).catch(() => undefined);

  let greetingName = "jou";
  try {
    const supabase = await createSupabaseServerClient();
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user) {
        const { data: profile } = await supabase
            .from("user_profile")
            .select("full_name")
            .eq("id", userData.user.id)
            .maybeSingle();
        if (profile?.full_name) {
            greetingName = profile.full_name.split(" ")[0];
        }
    }
  } catch (e) {
    // Silent fail, we use default greeting
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main>
        <WeatherDashboard
          initialCity={activeLoc}
          initialWeather={initialWeather}
          hideWeatherInfo={true}
          beforeFooter={
            <div className="space-y-6">
              {/* Persona intro — HomePitch stijl */}
              <div className="rounded-3xl bg-white/95 backdrop-blur p-6 sm:p-8 shadow-xl border-b-4 border-b-emerald-500">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-xs font-black uppercase tracking-widest text-emerald-600">
                    Piet · 48 uur
                  </span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 leading-snug mb-2">
                  {greetingName !== "jou" ? `Jouw Weer, ${greetingName}` : "Jouw Weer"}
                </h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                  De volledige 48 uur voor jouw locatie — in gewone taal, met
                  concrete tips voor je dag. Betrouwbaar en lokaal, voor elke
                  straat van Nederland.
                </p>
              </div>

              <PremiumGate>
                <PietExtended initialCity={loc || undefined} />
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
