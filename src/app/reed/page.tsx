import type { Metadata } from "next";
import WeatherDashboard from "@/components/WeatherDashboard";
import ReedExtended from "@/components/ReedExtended";
import PremiumGate from "@/components/PremiumGate";
import { getSavedLocationServer } from "@/lib/location-cookies";
import { DUTCH_CITIES } from "@/lib/types";

export const metadata: Metadata = {
  title: "Waarschuwingen — Extreem weer alerts | Weerzone",
  description:
    "Weerzone waarschuwt voor storm, onweer, hitte, vorst en zware neerslag. Alleen als er echt iets op komst is — geen ruis.",
  alternates: { canonical: "https://weerzone.nl/reed" },
};

export default async function ReedPage() {
  const loc = await getSavedLocationServer().catch(() => null);
  const activeLoc = loc || DUTCH_CITIES.find(c => c.name === "De Bilt") || DUTCH_CITIES[0];

  return (
    <main>
      <WeatherDashboard
        initialCity={activeLoc}
        hideWeatherInfo={true}
        beforeFooter={
          <div className="space-y-6">
            {/* Persona intro */}
            <div className="card p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-text-muted mb-1">
                Weerzone · Extreem Weer
              </p>
              <h2 className="text-3xl font-black text-text-primary leading-tight flex items-center gap-3">
                <span>⚠️</span> Waarschuwingen
              </h2>
              <p className="text-text-secondary text-sm leading-relaxed mt-2">
                Alleen een melding als er écht iets op komst is: storm,
                onweer, extreme hitte, strenge vorst of zware neerslag.
                Geen ruis.
              </p>
            </div>

            <PremiumGate>
              <ReedExtended initialCity={loc || undefined} />
            </PremiumGate>
          </div>
        }
      />
    </main>
  );
}
