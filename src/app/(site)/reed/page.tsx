import type { Metadata } from "next";
import WeatherDashboard from "@/components/WeatherDashboard";
import ReedExtended from "@/components/ReedExtended";
import PremiumGate from "@/components/PremiumGate";
import KnmiWarningBanner from "@/components/KnmiWarningBanner";
import { getSavedLocationServer } from "@/lib/location-cookies";
import { DUTCH_CITIES } from "@/lib/types";
import { fetchWeatherData } from "@/lib/weather";
import { fetchKNMIWarnings, warningsForProvince, nearestProvinceSlug, highestSeverity, PROVINCE_SLUG_TO_KNMI, SEVERITY_LABEL, type KNMISeverity } from "@/lib/knmi-warnings";
import { fetchEstofexBeneluxSummary, summarizeEstofexNL } from "@/lib/estofex";
import LocateButton from "@/components/LocateButton";
import { AlertTriangle } from "lucide-react";
import { schemaLd, schemaWeatherWarnings } from "@/lib/schema";
import { hreflangCluster } from "@/lib/hreflang";

export const metadata: Metadata = {
  title: "Reed's Extremen - onweer en stormrisico",
  description:
    "Reed volgt onweer, storm en officiële extremen met modelduiding, bliksemkaart en expertanalyse. Alleen als er echt iets op komst is.",
  alternates: {
    canonical: "https://weerzone.nl/reed",
    languages: hreflangCluster({
      nl: "/reed",
      de: "/de/warnungen",
      fr: "/fr/alertes",
      es: "/es/alertas",
    }),
  },
  openGraph: {
    title: "Reed's Extremen | WEERZONE",
    description:
      "Bekijk onweers- en stormrisico met modelduiding, bliksemkaart en expertanalyse.",
    type: "website",
    locale: "nl_NL",
    url: "https://weerzone.nl/reed",
    siteName: "WEERZONE",
  },
  twitter: {
    card: "summary_large_image",
    title: "Reed's Extremen",
    description:
      "Onweer, storm en officiële extremen voor jouw provincie, zonder ruis.",
  },
};

export default async function ReedPage() {
  const loc = await getSavedLocationServer().catch(() => null);
  const activeLoc = loc || DUTCH_CITIES.find(c => c.name === "De Bilt") || DUTCH_CITIES[0];
  const lat = activeLoc.lat;
  const lon = activeLoc.lon;

  const [initialWeather, allWarnings, provinceSlug, estofex] = await Promise.all([
    fetchWeatherData(lat, lon, false, true).catch(() => undefined),
    fetchKNMIWarnings().catch(() => []),
    nearestProvinceSlug(lat, lon).catch(() => null),
    fetchEstofexBeneluxSummary(2).catch(() => null),
  ]);
  const provinceWarnings = provinceSlug ? warningsForProvince(allWarnings, provinceSlug) : [];
  const topSeverity: KNMISeverity | null = highestSeverity(provinceWarnings);
  const provinceLabel = provinceSlug ? PROVINCE_SLUG_TO_KNMI[provinceSlug] ?? provinceSlug : "Nederland";

  const STATUS_TONE: Record<"GREEN" | KNMISeverity, { dot: string; chip: string; chipBg: string; border: string; line: string }> = {
    GREEN:  { dot: "bg-emerald-500", chip: "text-emerald-700",  chipBg: "bg-emerald-50",  border: "border-b-emerald-500",  line: "Alles rustig — geen actieve waarschuwingen." },
    YELLOW: { dot: "bg-yellow-400",  chip: "text-yellow-700",   chipBg: "bg-yellow-50",   border: "border-b-yellow-400",   line: "Eén of meer code geel-waarschuwingen actief voor jouw provincie." },
    ORANGE: { dot: "bg-orange-500",  chip: "text-orange-700",   chipBg: "bg-orange-50",   border: "border-b-orange-500",   line: "Code oranje actief — neem maatregelen." },
    RED:    { dot: "bg-rose-600",    chip: "text-rose-700",     chipBg: "bg-rose-50",     border: "border-b-rose-600",     line: "Code rood actief — extreem weer, hoogste alarm." },
  };
  const tone = STATUS_TONE[topSeverity ?? "GREEN"];
  const statusLabel = topSeverity ? SEVERITY_LABEL[topSeverity] : "Code groen";

  const estofexSummary = estofex ? summarizeEstofexNL(estofex) : null;
  const warningSchemas = schemaWeatherWarnings(
    provinceWarnings.map((warning) => ({
      name: `${SEVERITY_LABEL[warning.severity]} ${warning.type} voor ${warning.province}`,
      description: warning.description,
      url: "https://weerzone.nl/reed",
      validFrom: warning.validFrom,
      validUntil: warning.validUntil,
      issuedAt: warning.issuedAt,
      areaServed: warning.province,
    })),
  );

  return (
    <main>
      {warningSchemas.length > 0 && <script {...schemaLd(warningSchemas)} />}
      <WeatherDashboard
        initialCity={activeLoc}
        initialWeather={initialWeather}
        initialWeatherCode={initialWeather?.current.weatherCode}
        initialIsDay={initialWeather?.current.isDay}
        hideWeatherInfo={true}
        beforeFooter={
          <div className="space-y-6">
            <div className="card p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-3 h-3 rounded-full ${tone.dot} ${topSeverity ? "animate-pulse" : ""}`} />
                <span className={`text-xs font-black uppercase tracking-widest ${tone.chip} px-2 py-0.5 rounded ${tone.chipBg}`}>
                  {statusLabel}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight mb-2">
                Reed&apos;s Extremen voor {provinceLabel}
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed mb-5">
                {tone.line}{" "}
                <span className="text-slate-400">Focus op onweers-/stormrisico en officiële extremen — geen dagelijkse comfortindex.</span>
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <LocateButton compact label="Andere provincie? Gebruik GPS" className="!text-slate-900 !bg-slate-100 !border-slate-200 hover:!bg-slate-200" />
                <span className="text-[11px] text-slate-400 font-medium">
                  Locatie: <strong className="text-slate-700">{activeLoc.name}</strong>
                </span>
              </div>
            </div>

            {provinceWarnings.length > 0 && (
              <KnmiWarningBanner warnings={provinceWarnings} detailsLink={false} />
            )}

            {estofex && estofexSummary && (
              <div className="rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-white/50" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/50">
                    Europees vooruitzicht
                  </span>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                    estofex.maxLevel >= 3 ? "bg-rose-500/30 text-rose-100" :
                    estofex.maxLevel >= 2 ? "bg-orange-500/30 text-orange-100" :
                    "bg-yellow-500/30 text-yellow-100"
                  }`}>
                    Level {estofex.maxLevel}
                  </span>
                </div>
                <p className="text-sm text-white/85 leading-relaxed">{estofexSummary}</p>
                <p className="text-[10px] text-white/40 mt-3">
                  Bron: ESTOFEX (Europees onweer-vooruitzicht) · vernieuwt 1–2× per dag
                </p>
              </div>
            )}

            <PremiumGate tierRequired="reed">
              <ReedExtended initialCity={loc || undefined} />
            </PremiumGate>
          </div>
        }
      />
    </main>
  );
}
