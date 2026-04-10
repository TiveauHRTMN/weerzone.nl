import type { Metadata } from "next";
import { DUTCH_CITIES } from "@/lib/types";
import EmbedConfigurator from "./EmbedConfigurator";

export const metadata: Metadata = {
  title: "WeerZone Widget — Embed op je website",
  description: "Gratis weerwidget voor je website. Live weer data powered by WeerZone.",
};

export default function EmbedPage() {
  const cities = DUTCH_CITIES.slice(0, 10).map(c => c.name);

  return (
    <div style={{ background: "linear-gradient(160deg, #0f172a 0%, #1e293b 60%, #0c1a2e 100%)" }} className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-black text-white mb-2">WeerZone Widget</h1>
        <p className="text-white/60 text-sm mb-8">
          Gratis live weer op jouw website. Kopieer de code, plak het in je HTML, klaar.
        </p>
        <EmbedConfigurator cities={cities} />
      </div>
    </div>
  );
}
