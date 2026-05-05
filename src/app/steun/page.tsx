import { Metadata } from "next";
import Link from "next/link";
import SupportForm from "@/components/SupportForm";
import WeatherBackground from "@/components/WeatherBackground";

export const metadata: Metadata = {
  title: "Laat ons groeien - Steun Weerzone",
  description: "Draag bij aan de groei van Weerzone met een vrijwillige bijdrage.",
};

export default function SteunPage() {
  return (
    <main className="min-h-screen relative overflow-hidden flex flex-col">
      <WeatherBackground weatherCode={0} isDay={false} />
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-blue-900/20 to-transparent pointer-events-none" />
      
      <div className="relative z-10 flex-1 max-w-2xl mx-auto w-full px-4 py-12 sm:py-20 flex flex-col items-center">
        <div className="text-center mb-10">
          <Link href="/" className="inline-block mb-8 text-white/50 hover:text-white font-bold text-sm tracking-widest uppercase transition-colors">
            ← Terug naar Weerzone
          </Link>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4 drop-shadow-md">
            Support voor een koekje 🍪
          </h1>
          <p className="text-lg text-white/70 leading-relaxed max-w-lg mx-auto font-medium">
            Weerzone is onafhankelijk. Jouw bijdrage houdt de servers draaiend en maakt nieuwe tools mogelijk.
          </p>
        </div>

        <SupportForm />
      </div>
    </main>
  );
}
