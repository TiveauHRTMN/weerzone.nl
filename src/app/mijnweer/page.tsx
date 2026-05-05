import type { Metadata } from "next";
import WeatherDashboard from "@/components/WeatherDashboard";
import PietExtended from "@/components/PietExtended";
import PremiumGate from "@/components/PremiumGate";
import { getSavedLocationServer } from "@/lib/location-cookies";
import { DUTCH_CITIES } from "@/lib/types";
import { fetchWeatherData } from "@/lib/weather";
import { fetchKNMIWarnings, warningsForProvince, nearestProvinceSlug, PROVINCE_SLUG_TO_KNMI } from "@/lib/knmi-warnings";
import KnmiWarningBanner from "@/components/KnmiWarningBanner";
import LocateButton from "@/components/LocateButton";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const loc = await getSavedLocationServer().catch(() => null);
  const place = loc?.name || "jouw locatie";
  const title = loc?.name
    ? `Mijn Weer voor ${place} - 48 uur vooruit`
    : "Mijn Weer - Hyperlokaal weerbericht";
  const description = loc?.name
    ? `Persoonlijk weerbericht voor ${place}. Je ziet wat de komende 48 uur betekenen voor regen, wind en planning.`
    : "Persoonlijk weerbericht voor de komende 48 uur op jouw locatie. In gewone taal, zonder reclame en zonder gokwerk over twee weken vooruit.";

  return {
    title,
    description,
    keywords: [
      "mijn weer",
      "persoonlijk weerbericht",
      "48 uur weer",
      "weer op locatie",
      "regen verwachting",
      "wind voorspelling",
      "weer vandaag",
    ],
    alternates: { canonical: "https://weerzone.nl/mijnweer" },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "nl_NL",
      url: "https://weerzone.nl/mijnweer",
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
  name: "Mijn Weer",
  headline: "Piet - Hyperlokaal 48-uurs weerbericht",
  description:
    "De dagelijkse weeranalyse van Piet voor jouw GPS-locatie. Geen 14-daagse gok, gewoon de komende 48 uur in gewone taal.",
  author: { "@type": "Organization", name: "WEERZONE" },
  url: "https://weerzone.nl/mijnweer",
  inLanguage: "nl-NL",
  about: {
    "@type": "Thing",
    name: "Hyperlokaal weerbericht voor de komende 48 uur",
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

export default async function MijnWeerPage() {
  const loc = await getSavedLocationServer().catch(() => null);
  const activeLoc = loc || DUTCH_CITIES.find(c => c.name === "De Bilt") || DUTCH_CITIES[0];

  const lat = typeof activeLoc.lat === "number" && !isNaN(activeLoc.lat) ? activeLoc.lat : 52.1;
  const lon = typeof activeLoc.lon === "number" && !isNaN(activeLoc.lon) ? activeLoc.lon : 5.18;
  const [initialWeather, allWarnings, provinceSlug] = await Promise.all([
    fetchWeatherData(lat, lon).catch(() => undefined),
    fetchKNMIWarnings().catch(() => []),
    nearestProvinceSlug(lat, lon).catch(() => null),
  ]);
  const provinceWarnings = provinceSlug ? warningsForProvince(allWarnings, provinceSlug) : [];

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
  } catch {
    // Default greeting
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
          slimMode={true}
          topContent={
            <div className="space-y-6">
              <div className="rounded-3xl bg-white/95 backdrop-blur p-6 sm:p-8 shadow-xl border-b-4 border-b-emerald-500">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-xs font-black uppercase tracking-widest text-emerald-600">
                    Mijn Weer · 48 uur
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight mb-2">
                  {greetingName !== "jou" ? `Hoi ${greetingName}, dit is jouw weer` : "Dit is jouw weer"}
                </h1>
                <p className="text-sm text-slate-500 leading-relaxed mb-5">
                  Hyperlokale 48-uurs voorspelling voor <strong className="text-slate-900">{activeLoc.name}</strong>
                  {provinceSlug && PROVINCE_SLUG_TO_KNMI[provinceSlug] && ` · ${PROVINCE_SLUG_TO_KNMI[provinceSlug]}`}.
                  Per uur bijgewerkt, in gewone taal.
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                  <LocateButton compact label="Gebruik mijn GPS" className="!text-slate-900 !bg-slate-100 !border-slate-200 hover:!bg-slate-200" />
                  <span className="text-[11px] text-slate-400 font-medium">
                    Niet de juiste plaats? Klik hierboven.
                  </span>
                </div>
              </div>

              {provinceWarnings.length > 0 && (
                <KnmiWarningBanner warnings={provinceWarnings} />
              )}

              <PremiumGate>
                <PietExtended initialCity={loc || undefined} hideLocate />
              </PremiumGate>

              <p className="text-center text-white/40 text-xs font-medium pb-4">
                Verder dan 48 uur kijken we niet vooruit - dan wordt het gokken.
              </p>
            </div>
          }
        />
      </main>

    </>
  );
}
