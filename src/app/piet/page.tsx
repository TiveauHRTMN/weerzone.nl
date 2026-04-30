import type { Metadata } from "next";
import WeatherDashboard from "@/components/WeatherDashboard";
import PietExtended from "@/components/PietExtended";
import PremiumGate from "@/components/PremiumGate";
import { getSavedLocationServer } from "@/lib/location-cookies";
import { DUTCH_CITIES } from "@/lib/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Jouw Weer — Hyperlokaal weerbericht voor jouw straat",
  description:
    "Een eerlijk, persoonlijk weerbericht voor de komende 48 uur op jouw GPS-locatie. In gewone taal, zonder reclame, zonder gokwerk over twee weken vooruit.",
  alternates: { canonical: "https://weerzone.nl/piet" },
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
  // Snelle, non-blocking server calls
  const loc = await getSavedLocationServer().catch(() => null);
  const activeLoc = loc || DUTCH_CITIES.find(c => c.name === "De Bilt") || DUTCH_CITIES[0];
  
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
          hideWeatherInfo={true}
          beforeFooter={
            <div className="space-y-6">
              {/* Persona intro */}
              <div className="card p-6">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-text-muted mb-1">
                  Weerzone · 48 uur
                </p>
                <h2 className="text-3xl font-black text-text-primary leading-tight">
                  Jouw Weer{greetingName !== "jou" ? `, ${greetingName}` : ""}
                </h2>
                <p className="text-text-secondary text-sm leading-relaxed mt-2">
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
