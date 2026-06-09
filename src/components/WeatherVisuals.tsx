"use client";

import dynamic from "next/dynamic";
import type { WeatherData } from "@/lib/types";
import type { PluimIntelligence } from "@/lib/model-blend";

const visualLoader = <div className="va-card h-48 animate-pulse bg-white/70" aria-label="Weerkaart laden" />;
const RainMap = dynamic(() => import("@/components/RainMap"), { ssr: false, loading: () => visualLoader });
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
  return (
    <section className="va-visual-section space-y-4">
      <div className="va-section-head px-1">
        <div><span className="va-onsky va-micro">Zelf bekijken · {locationName}</span><h2>{dayOffset === 0 ? "Radar en modelverwachting" : "Modelverwachting"}</h2></div>
        <span className="va-section-number">04</span>
      </div>

      {dayOffset === 0 && (
        <div className="va-visual-stack space-y-4">
          <RainMap lat={lat} lon={lon} />
          {reedEnabled && <LightningMap lat={lat} lon={lon} />}
        </div>
      )}

      <details className="va-card va-expert-disclosure">
        <summary>
          <span><strong>{dayOffset === 0 ? "Bekijk de modelverwachting" : "Bekijk de grafieken voor morgen"}</strong><small>Temperatuur en neerslag in één grafiek{reedEnabled ? ", plus weerrisico" : ""}</small></span>
          <span className="va-disclosure-icon" aria-hidden>+</span>
        </summary>
        <div className="va-visual-stack space-y-4 px-4 pb-5 sm:px-5 sm:pb-6">
          <ModelPluim hourly={weather.hourly} sunrise={weather.sunrise} sunset={weather.sunset} />
          {reedEnabled && <ReedExtremeCharts hourly={weather.hourly} showRain={false} />}
        </div>
      </details>
    </section>
  );
}
