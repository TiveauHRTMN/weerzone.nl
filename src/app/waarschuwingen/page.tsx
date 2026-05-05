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
import { Check, AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
  title: "Waarschuwingen — Extreem weer alerts | Weerzone",
  description:
    "Weerzone waarschuwt voor storm, onweer, hitte, vorst en zware neerslag. Alleen als er echt iets op komst is — geen ruis.",
  alternates: { canonical: "https://weerzone.nl/waarschuwingen" },
};

export default async function ReedPage() {
  const loc = await getSavedLocationServer().catch(() => null);
  const activeLoc = loc || DUTCH_CITIES.find(c => c.name === "De Bilt") || DUTCH_CITIES[0];

  const lat = typeof activeLoc.lat === "number" && !isNaN(activeLoc.lat) ? activeLoc.lat : 52.1;
  const lon = typeof activeLoc.lon === "number" && !isNaN(activeLoc.lon) ? activeLoc.lon : 5.18;
  const [initialWeather, allWarnings, provinceSlug, estofex] = await Promise.all([
    fetchWeatherData(lat, lon).catch(() => undefined),
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

  return (
    <main>
      <WeatherDashboard
        initialCity={activeLoc}
        initialWeather={initialWeather}
        hideWeatherInfo={true}
        beforeFooter={
          <div className="space-y-6">
            {/* PAGE-HEADER — direct duidelijk: status voor jouw provincie */}
            <div className={`rounded-3xl bg-white/95 backdrop-blur p-6 sm:p-8 shadow-xl border-b-4 ${tone.border}`}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-3 h-3 rounded-full ${tone.dot} ${topSeverity ? "animate-pulse" : ""}`} />
                <span className={`text-xs font-black uppercase tracking-widest ${tone.chip} px-2 py-0.5 rounded ${tone.chipBg}`}>
                  {statusLabel}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight mb-2">
                Waarschuwingen voor {provinceLabel}
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed mb-5">
                {tone.line}{" "}
                <span className="text-slate-400">Wij melden alleen storm, onweer, hitte, vorst of zware neerslag — geen ruis.</span>
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <LocateButton compact label="Andere provincie? Gebruik GPS" className="!text-slate-900 !bg-slate-100 !border-slate-200 hover:!bg-slate-200" />
                <span className="text-[11px] text-slate-400 font-medium">
                  Locatie: <strong className="text-slate-700">{activeLoc.name}</strong>
                </span>
              </div>
            </div>

            {/* Empty-state als alles rustig is — zichtbaar zonder paywall */}
            {provinceWarnings.length === 0 && (
              <div className="rounded-3xl bg-emerald-500/10 border border-emerald-400/30 p-6 flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center flex-none">
                  <Check className="w-5 h-5 text-emerald-300" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black text-emerald-100 mb-1">Geen actieve waarschuwingen</p>
                  <p className="text-xs text-emerald-200/80 leading-relaxed">
                    Het KNMI heeft nu niets uitstaan voor {provinceLabel}. Je krijgt direct een melding (mits ingeschakeld) zodra dat verandert.
                  </p>
                </div>
              </div>
            )}

            {/* Compacte banner alleen als er actieve warnings zijn — dossier komt verderop */}
            {provinceWarnings.length > 0 && (
              <KnmiWarningBanner warnings={provinceWarnings} detailsLink={false} compact />
            )}

            {/* Estofex — Nederlandse samenvatting, geen Engelse bulletin */}
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
