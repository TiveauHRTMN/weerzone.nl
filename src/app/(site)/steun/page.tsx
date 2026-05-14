import { Metadata } from "next";
import Link from "next/link";
import SupportForm from "@/components/SupportForm";
import WeatherDashboard from "@/components/WeatherDashboard";
import { fetchWeatherData } from "@/lib/weather";
import { DUTCH_CITIES } from "@/lib/types";

export const metadata: Metadata = {
  title: "Support voor een koekje",
  description: "Draag bij aan de groei van Weerzone met een vrijwillige bijdrage.",
};

export default async function SteunPage() {
  const amsterdam = DUTCH_CITIES.find(c => c.name === "Amsterdam") || DUTCH_CITIES[0];
  const weather = await fetchWeatherData(amsterdam.lat, amsterdam.lon).catch(() => null);

  return (
    <WeatherDashboard
      initialCity={amsterdam}
      initialWeather={weather || undefined}
      hideWeatherInfo={true}
      topContent={
        <div className="text-center mt-8 mb-4">
          <Link href="/" className="inline-block mb-8 text-white/70 hover:text-white font-bold text-sm tracking-widest uppercase transition-colors">
            ← Terug naar Weerzone
          </Link>
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tighter mb-4 drop-shadow-2xl leading-none">
            Support voor een koekje 🍪
          </h1>
          <p className="text-lg text-white/80 leading-relaxed max-w-lg mx-auto font-medium">
            Weerzone is onafhankelijk. Jouw bijdrage houdt de servers draaiend en helpt ons groeien.
          </p>
          
          <div className="mt-10">
            <SupportForm />
          </div>

          <div className="mt-12 text-center opacity-30">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-white">
              Groei jij mee?!
            </p>
          </div>
        </div>
      }
    />
  );
}
