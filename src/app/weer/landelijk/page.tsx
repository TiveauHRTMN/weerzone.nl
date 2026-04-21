import type { Metadata } from "next";
import WeatherDashboard from "@/components/WeatherDashboard";
import { DUTCH_CITIES } from "@/lib/types";

export const metadata: Metadata = {
  title: "Weer Nederland — Landelijke weersverwachting | WEERZONE",
  description: "Het actuele weerbericht voor heel Nederland. Gebaseerd op De Bilt, 48 uur messcherp vooruit.",
  alternates: { canonical: "https://weerzone.nl/weer/landelijk" },
};

export default function LandelijkPage() {
  const deBilt = DUTCH_CITIES.find(c => c.name === "De Bilt") || DUTCH_CITIES[0];

  return (
    <main>
      <WeatherDashboard 
        initialCity={deBilt}
        titleOverride="Weer in Nederland (Landelijk)"
      />
    </main>
  );
}
