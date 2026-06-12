import type { Metadata } from "next";
import { Suspense } from "react";
import { Manrope } from "next/font/google";
import DayBriefing from "@/components/DayBriefing";
import { getSavedLocationServer } from "@/lib/location-cookies";
import { DUTCH_CITIES } from "@/lib/types";
import { buildAgentContext } from "@/lib/agents/context";
import { getAgentPreferences } from "@/lib/agents/preferences-server";
import { fetchAirQuality } from "@/lib/weather";
import { hreflangSelf } from "@/lib/hreflang";
import { schemaLd, schemaWebPage } from "@/lib/schema";
import "./vandaag-skin.css";

const manrope = Manrope({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], display: "swap" });

export const metadata: Metadata = {
  title: "Vandaag - het weer voor jouw locatie",
  description: "Het lokale weer van vandaag, met een praktisch dagverloop, risico's en het beste moment voor je plannen.",
  alternates: { canonical: "https://weerzone.nl/vandaag", languages: hreflangSelf("nl", "/vandaag") },
};

function withDeadline<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([promise.catch(() => fallback), new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))]);
}

function Loading({ locationName = "jouw locatie" }: { locationName?: string }) {
  return (
    <div className="relative z-10 mx-auto max-w-[680px] space-y-4 px-4 py-9 sm:px-6 sm:py-14">
      <div className="va-card p-7"><div className="va-micro text-slate-400">Weerzone · Vandaag</div><h1 className="mt-4 text-3xl font-extrabold text-slate-950">Het weer in {locationName}</h1><div className="mt-6 h-16 animate-pulse rounded-2xl bg-slate-100" /></div>
      {[1, 2, 3].map((item) => <div key={item} className="va-card h-36 animate-pulse bg-white/90" />)}
    </div>
  );
}

async function VandaagFlow({ name, lat, lon }: { name: string; lat: number; lon: number }) {
  const [ctx, preferences, airQuality] = await Promise.all([
    buildAgentContext({ name, lat, lon }),
    getAgentPreferences(),
    withDeadline(fetchAirQuality(lat, lon), 1200, null),
  ]);
  if (!ctx) return <div className="relative z-10 mx-auto max-w-[680px] px-4 py-14"><div className="va-card p-8 text-center"><h1 className="text-2xl font-extrabold text-slate-950">De weergegevens zijn even niet beschikbaar</h1><p className="mt-2 text-sm text-slate-600">Probeer het over een moment opnieuw.</p></div></div>;
  return <DayBriefing ctx={ctx} preferences={preferences} dayOffset={0} airQuality={airQuality} />;
}

async function VandaagContent() {
  const saved = await getSavedLocationServer().catch(() => null);
  const location = saved || DUTCH_CITIES.find((city) => city.name === "De Bilt") || DUTCH_CITIES[0];
  return <Suspense fallback={<Loading locationName={location.name} />}><VandaagFlow name={location.name} lat={location.lat} lon={location.lon} /></Suspense>;
}

export default function VandaagPage() {
  return <><script {...schemaLd(schemaWebPage({ name: "Het weer vandaag voor jouw locatie", url: "https://weerzone.nl/vandaag", description: metadata.description as string }))} /><main className={`va-skin ${manrope.className}`}><Suspense fallback={<Loading />}><VandaagContent /></Suspense></main></>;
}
