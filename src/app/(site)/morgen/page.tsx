import type { Metadata } from "next";
import { Suspense } from "react";
import { Manrope } from "next/font/google";
import DayBriefing from "@/components/DayBriefing";
import WeatherBackdrop from "@/components/WeatherBackdrop";
import { buildAgentContext } from "@/lib/agents/context";
import { getAgentPreferences } from "@/lib/agents/preferences-server";
import { getSavedLocationServer } from "@/lib/location-cookies";
import { DUTCH_CITIES } from "@/lib/types";
import { fetchAirQuality } from "@/lib/weather";
import { hreflangSelf } from "@/lib/hreflang";
import "../vandaag/vandaag-skin.css";

const manrope = Manrope({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], display: "swap" });

export const metadata: Metadata = {
  title: "Morgen - het weer voor jouw locatie",
  description: "Het lokale weer van morgen, met een praktisch dagverloop, risico's en het beste moment voor je plannen.",
  alternates: { canonical: "https://weerzone.nl/morgen", languages: hreflangSelf("nl", "/morgen") },
};

function withDeadline<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([promise.catch(() => fallback), new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))]);
}

function Loading({ locationName = "jouw locatie" }: { locationName?: string }) {
  return <div className="relative z-10 mx-auto max-w-[680px] space-y-4 px-4 py-9 sm:px-6 sm:py-14"><div className="va-card p-7"><div className="va-micro text-slate-400">Weerzone · Morgen</div><h1 className="mt-4 text-3xl font-extrabold text-slate-950">Vooruitblik voor {locationName}</h1><div className="mt-6 h-16 animate-pulse rounded-2xl bg-slate-100" /></div>{[1, 2, 3].map((item) => <div key={item} className="va-card h-36 animate-pulse bg-white/90" />)}</div>;
}

async function MorgenFlow({ name, lat, lon }: { name: string; lat: number; lon: number }) {
  const [ctx, preferences, airQuality] = await Promise.all([
    buildAgentContext({ name, lat, lon }),
    getAgentPreferences(),
    withDeadline(fetchAirQuality(lat, lon), 1200, null),
  ]);
  if (!ctx?.weather.daily[1]) return <div className="relative z-10 mx-auto max-w-[680px] px-4 py-14"><div className="va-card p-8 text-center"><h1 className="text-2xl font-extrabold text-slate-950">De vooruitblik is even niet beschikbaar</h1><p className="mt-2 text-sm text-slate-600">Probeer het over een moment opnieuw.</p></div></div>;
  return <><WeatherBackdrop weatherCode={ctx.weather.daily[1].weatherCode} isDay /><DayBriefing ctx={ctx} preferences={preferences} dayOffset={1} airQuality={airQuality} /></>;
}

async function MorgenContent() {
  const saved = await getSavedLocationServer().catch(() => null);
  const location = saved || DUTCH_CITIES.find((city) => city.name === "De Bilt") || DUTCH_CITIES[0];
  return <Suspense fallback={<Loading locationName={location.name} />}><MorgenFlow name={location.name} lat={location.lat} lon={location.lon} /></Suspense>;
}

export default function MorgenPage() {
  return <main className={`va-skin ${manrope.className}`}><Suspense fallback={<Loading />}><MorgenContent /></Suspense></main>;
}
