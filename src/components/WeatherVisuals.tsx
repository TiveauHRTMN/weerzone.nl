"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import type { WeatherData } from "@/lib/types";
import type { PluimIntelligence } from "@/lib/model-blend";

const visualLoader = <div className="va-card h-48 animate-pulse bg-white/70" aria-label="Weerkaart laden" />;
const LightningMap = dynamic(() => import("@/components/LightningMap"), { ssr: false, loading: () => visualLoader });
const ModelPluim = dynamic(() => import("@/components/ModelPluim"), { ssr: false, loading: () => visualLoader });
const ReedExtremeCharts = dynamic(() => import("@/components/ReedExtremeCharts"), { ssr: false, loading: () => visualLoader });

export default function WeatherVisuals({ weather, lat, lon, locationName, dayOffset, reedEnabled, pluim }: {
  weather: WeatherData;
  lat: number;
  lon: number;
  locationName: string;
  dayOffset: 0 | 1;
  reedEnabled: boolean;
  pluim?: PluimIntelligence | null;
}) {
  const forecastDate = weather.daily[dayOffset]?.date;
  const reedHours = forecastDate
    ? weather.hourly.filter((hour) => hour.time.startsWith(forecastDate))
    : weather.hourly;

  return (
    <section className="va-visual-section space-y-4">
      <div className="va-section-head px-1">
        <div><span className="va-onsky va-micro">Zelf bekijken · {locationName}</span><h2>Voor de expert</h2></div>
        <span className="va-section-number">04</span>
      </div>

      {dayOffset === 0 && reedEnabled && (
        <div className="va-visual-stack space-y-4">
          <LightningMap lat={lat} lon={lon} />
        </div>
      )}

      <details className="va-card va-expert-disclosure">
        <summary>
          <span><strong>Piet&apos;s temperatuurverwachting</strong><small>{pluim ? "Meerdere verwachtingen samengebracht in één lijn" : "Temperatuur en neerslag in één grafiek"}</small></span>
          <span className="va-disclosure-icon" aria-hidden>+</span>
        </summary>
        <div className="va-visual-stack space-y-4 px-4 pb-5 sm:px-5 sm:pb-6">
          <ModelPluim hourly={weather.hourly} sunrise={weather.sunrise} sunset={weather.sunset} pluim={pluim} />
        </div>
      </details>

      {reedEnabled && (
        <details className="va-card va-expert-disclosure">
          <summary>
            <span><strong>Reed&apos;s expertkaarten</strong><small>CAPE, CIN, Lifted Index, dauwpunt en windschering voor {dayOffset === 0 ? "vandaag" : "morgen"}</small></span>
            <span className="va-disclosure-icon" aria-hidden>+</span>
          </summary>
          <div className="va-visual-stack space-y-4 px-4 pb-5 sm:px-5 sm:pb-6">
            <ReedExtremeCharts hourly={reedHours} showRain={false} />
          </div>
        </details>
      )}

      <p className="px-1 text-right">
        <Link href="/over#qa" className="text-[11px] font-bold text-slate-400 underline-offset-2 hover:text-slate-600 hover:underline">
          Hoe komt deze verwachting tot stand?
        </Link>
      </p>
    </section>
  );
}
