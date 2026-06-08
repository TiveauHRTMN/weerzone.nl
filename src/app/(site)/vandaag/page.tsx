import type { Metadata } from "next";
import { Suspense } from "react";
import { Manrope } from "next/font/google";
import AgentFeed from "@/components/AgentFeed";
import WeatherBackdrop from "@/components/WeatherBackdrop";
import { getSavedLocationServer } from "@/lib/location-cookies";
import { DUTCH_CITIES } from "@/lib/types";
import { buildAgentContext } from "@/lib/agents/context";
import { orchestrateAgents } from "@/lib/agents/orchestrator";
import { hreflangSelf } from "@/lib/hreflang";
import "./vandaag-skin.css";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vandaag — Piet, Reed en Koos voor jouw dag",
  description:
    "Eén overzicht: wat de komende 48 uur betekenen voor jouw plek. Piet voor het dagbeeld, Reed voor onweer en storm, Koos als je eropuit wilt — samen, op volgorde van wat ertoe doet.",
  alternates: {
    canonical: "https://weerzone.nl/vandaag",
    languages: hreflangSelf("nl", "/vandaag"),
  },
  openGraph: {
    title: "Vandaag | WEERZONE",
    description:
      "Piet, Reed en Koos als één systeem: de belangrijkste heads-ups voor jouw dag, op volgorde.",
    type: "website",
    locale: "nl_NL",
    url: "https://weerzone.nl/vandaag",
    siteName: "WEERZONE",
  },
};

/**
 * De zware kant: wereldmodel + orkestratie (incl. LLM-stemmen en Koos' fetches).
 * Staat achter een Suspense-grens zodat de pagina-shell meteen paint en dit
 * binnenstroomt — i.p.v. ~5s blocken op de SSR. De globale weer-lucht
 * (GlobalWeatherBackground) staat al achter de skeleton, dus geen witte flits.
 */
async function VandaagFeed({ name, lat, lon }: { name: string; lat: number; lon: number }) {
  const ctx = await buildAgentContext({ name, lat, lon });

  if (!ctx) {
    return (
      <div className="relative z-10 max-w-[640px] mx-auto px-4 sm:px-6 py-14 text-center">
        <div className="va-card has-accent p-7 sm:p-9">
          <h1 className="text-[22px] font-extrabold text-slate-900">Even geen verbinding met de weerdata</h1>
          <p className="mt-2 text-[14px] text-slate-600">
            De agents kunnen de gegevens voor {name} nu niet ophalen. Probeer het zo nog eens.
          </p>
        </div>
      </div>
    );
  }

  const result = await orchestrateAgents(ctx);

  return (
    <>
      <WeatherBackdrop
        weatherCode={ctx.weather.current.weatherCode}
        isDay={ctx.weather.current.isDay}
      />
      <AgentFeed result={result} locationName={name} day={ctx.day} />
    </>
  );
}

/** Directe shell tijdens het streamen: hero met locatie + rustige skeleton-kaarten. */
function VandaagSkeleton({ locationName }: { locationName: string }) {
  return (
    <div className="relative z-10 max-w-[640px] mx-auto px-4 sm:px-6 py-9 sm:py-14 space-y-4">
      <header className="va-card has-accent p-6 sm:p-8">
        <div className="va-micro text-slate-400">WEERZONE · Vandaag</div>
        <h1
          className="mt-3 text-[30px] sm:text-[40px] font-extrabold text-slate-900 leading-[1.03]"
          style={{ letterSpacing: "-0.032em" }}
        >
          Jouw dag in {locationName}
        </h1>
        <p className="mt-3 text-[14px] text-slate-500">Piet, Reed en Koos kijken even mee…</p>
      </header>
      {[0, 1].map((i) => (
        <div key={i} className="va-card has-accent p-5 sm:p-6 animate-pulse">
          <div className="h-3 w-28 rounded bg-slate-200/70" />
          <div className="mt-4 h-5 w-3/4 rounded bg-slate-200/70" />
          <div className="mt-2 h-3 w-full rounded bg-slate-100" />
          <div className="mt-1.5 h-3 w-2/3 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export default async function VandaagPage() {
  const loc = await getSavedLocationServer().catch(() => null);
  const activeLoc =
    loc || DUTCH_CITIES.find((c) => c.name === "De Bilt") || DUTCH_CITIES[0];

  return (
    <main className={`va-skin ${manrope.className}`}>
      <Suspense fallback={<VandaagSkeleton locationName={activeLoc.name} />}>
        <VandaagFeed name={activeLoc.name} lat={activeLoc.lat} lon={activeLoc.lon} />
      </Suspense>
    </main>
  );
}
