import type { Metadata } from "next";
import WeatherDashboard from "@/components/WeatherDashboard";
import ReedExtended from "@/components/ReedExtended";
import PremiumGate from "@/components/PremiumGate";
import { getSavedLocationServer } from "@/lib/location-cookies";
import { DUTCH_CITIES } from "@/lib/types";
import { fetchWeatherData } from "@/lib/weather";

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
  const initialWeather = await fetchWeatherData(lat, lon).catch(() => undefined);

  return (
    <main>
      <WeatherDashboard
        initialCity={activeLoc}
        initialWeather={initialWeather}
        hideWeatherInfo={true}
        beforeFooter={
          <div className="space-y-6">
            {/* Persona intro — HomePitch stijl */}
            <div className="rounded-3xl bg-white/95 backdrop-blur p-6 sm:p-8 shadow-xl border-b-4 border-b-rose-500">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="text-xs font-black uppercase tracking-widest text-rose-600">
                  Reed · Extreem Weer
                </span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 leading-snug mb-2">
                Waarschuwingen
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed">
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
