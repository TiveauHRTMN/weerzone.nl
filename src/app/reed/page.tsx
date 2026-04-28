import type { Metadata } from "next";
import WeatherDashboard from "@/components/WeatherDashboard";
import ReedExtended from "@/components/ReedExtended";
import PremiumGate from "@/components/PremiumGate";
import { getSavedLocationServer } from "@/lib/location-cookies";
import { fetchWeatherData } from "@/lib/weather";
import { DUTCH_CITIES } from "@/lib/types";

export const metadata: Metadata = {
  title: "Reed — extreem weer alerts",
  description:
    "Reed van WEERZONE waarschuwt voor storm, onweer, hitte, vorst en zware neerslag. Alleen als er echt iets op komst is — geen ruis.",
  alternates: { canonical: "https://weerzone.nl/reed" },
  openGraph: {
    title: "Reed — extreem weer alerts | WEERZONE",
    description:
      "Storm, onweer, hitte of vorst op komst? Reed waarschuwt je alleen als er echt iets aan de hand is.",
    type: "website",
    locale: "nl_NL",
    url: "https://weerzone.nl/reed",
    siteName: "WEERZONE",
  },
  twitter: {
    card: "summary_large_image",
    title: "Reed — extreem weer alerts | WEERZONE",
    description:
      "Persoonlijke weeralerts voor storm, hitte en vorst. Alleen als het écht nodig is.",
  },
};

export default async function ReedPage() {
  const loc = await getSavedLocationServer();
  const defaultCity = DUTCH_CITIES.find(c => c.name === "De Bilt") || DUTCH_CITIES[0];
  const activeLoc = loc || defaultCity;

  const initialWeather = await fetchWeatherData(activeLoc.lat, activeLoc.lon).catch(() => null);

  return (
    <main>
      <WeatherDashboard
        initialCity={activeLoc}
        initialWeather={initialWeather ?? undefined}
        hideWeatherInfo={true}
        beforeFooter={
          <div className="space-y-6">
            {/* Persona intro */}
            <div className="card p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-text-muted mb-1">
                WEERZONE Persona · Extreem Weer
              </p>
              <h2 className="text-3xl font-black text-text-primary leading-tight flex items-center gap-3">
                <span>⚠️</span> Reed
              </h2>
              <p className="text-text-secondary text-sm leading-relaxed mt-2">
                Alleen een melding als er écht iets op komst is: storm,
                onweer, extreme hitte, strenge vorst of zware neerslag.
                Geen ruis — wel attitude.
              </p>
            </div>

            <PremiumGate>
              <ReedExtended
                initialWeather={initialWeather}
                initialCity={loc || undefined}
              />
            </PremiumGate>
          </div>
        }
      />
    </main>
  );
}
