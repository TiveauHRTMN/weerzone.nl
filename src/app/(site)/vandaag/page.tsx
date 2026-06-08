import type { Metadata } from "next";
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

export default async function VandaagPage() {
  const loc = await getSavedLocationServer().catch(() => null);
  const activeLoc =
    loc || DUTCH_CITIES.find((c) => c.name === "De Bilt") || DUTCH_CITIES[0];

  const ctx = await buildAgentContext({
    name: activeLoc.name,
    lat: activeLoc.lat,
    lon: activeLoc.lon,
  });

  // Zeldzame upstream-uitval: nette rust-staat i.p.v. een crash.
  if (!ctx) {
    return (
      <main className={`va-skin ${manrope.className}`}>
        <div
          className="fixed inset-0 z-0"
          style={{ background: "linear-gradient(170deg,#3a9ae8 0%,#7ec4f6 100%)" }}
          aria-hidden
        />
        <div className="relative z-10 max-w-[640px] mx-auto px-4 sm:px-6 py-14 text-center">
          <div className="va-card has-accent p-7 sm:p-9">
            <h1 className="text-[22px] font-extrabold text-slate-900">Even geen verbinding met de weerdata</h1>
            <p className="mt-2 text-[14px] text-slate-600">
              De agents kunnen de gegevens voor {activeLoc.name} nu niet ophalen. Probeer het zo nog eens.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const result = await orchestrateAgents(ctx);

  return (
    <main className={`va-skin ${manrope.className}`}>
      <WeatherBackdrop
        weatherCode={ctx.weather.current.weatherCode}
        isDay={ctx.weather.current.isDay}
      />
      <AgentFeed result={result} locationName={activeLoc.name} day={ctx.day} />
    </main>
  );
}
