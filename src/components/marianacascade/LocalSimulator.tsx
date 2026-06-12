import React, { useState } from "react";
import { Compass, Sun, MapPin, Navigation, Info } from "lucide-react";

interface LocalSimulatorProps {
  pietAdvice: string;
  referToReed: boolean;
  koosScore: number;
  koosDestination: string;
  koosReason: string;
  koosDistance: number;
}

interface Station {
  name: string;
  lat: number;
  lon: number;
}

const STATIONS: Station[] = [
  { name: "De Bilt (Centraal)", lat: 52.1, lon: 5.18 },
  { name: "Vlissingen (Kust)", lat: 51.44, lon: 3.59 },
  { name: "Leeuwarden (Noord)", lat: 53.22, lon: 5.76 },
  { name: "Maastricht (Zuid)", lat: 50.85, lon: 5.78 },
  { name: "Hoek van Holland (Haven)", lat: 51.98, lon: 4.12 },
];

export const LocalSimulator: React.FC<LocalSimulatorProps> = ({
  pietAdvice,
  referToReed,
  koosScore,
  koosDestination,
  koosReason,
  koosDistance,
}) => {
  const [selectedStation, setSelectedStation] = useState<Station>(STATIONS[0]);

  const getLocalizedPiet = () => {
    if (selectedStation.name.includes("Vlissingen") && pietAdvice.includes("onweer")) {
      return `[${selectedStation.name}] STORMCHASER ALERT: Kustregio Vlissingen ligt in de vuurlinie van de onweersbuien die over de Westerschelde trekken. Zware windstoten verwacht.`;
    }
    return `[${selectedStation.name}] ${pietAdvice}`;
  };

  const getLocalizedKoos = () => {
    if (koosScore < 0.3) {
      return {
        score: koosScore,
        destination: koosDestination,
        reason: koosReason,
        distance: koosDistance,
      };
    }

    const isCoastal = selectedStation.name.includes("Vlissingen") || selectedStation.name.includes("Hoek van Holland");
    const factor = isCoastal ? 0.08 : -0.05;
    const finalScore = Math.min(1.0, Math.max(0, koosScore + factor));

    return {
      score: Math.round(finalScore * 100) / 100,
      destination: isCoastal ? "Oostkapelle" : koosDestination,
      reason: isCoastal
        ? "Je bent al aan de kust! Uitstekend zandstrand met een lichte bries en volle zon."
        : koosReason,
      distance: isCoastal ? 12 : koosDistance,
    };
  };

  const localKoos = getLocalizedKoos();

  return (
    <div className="border border-zinc-800 bg-[#0c0c10] rounded-xl p-6 shadow-xl relative">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-900">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg border bg-amber-500/10 border-amber-500/30 text-amber-400">
            <Compass size={20} className="text-glow-amber" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-mono tracking-wider text-zinc-200">TACTISCHE LOCATIE SIMULATOR</h3>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5">
              Pingen van Piet en Koos op basis van coördinaten
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <span className="block text-[10px] font-mono uppercase tracking-widest text-zinc-500">
            Selecteer Teststation
          </span>
          <div className="space-y-2">
            {STATIONS.map((station) => (
              <button
                key={station.name}
                type="button"
                onClick={() => setSelectedStation(station)}
                className={`w-full flex items-center justify-between p-3 rounded-lg border font-mono text-xs cursor-pointer transition-all ${
                  selectedStation.name === station.name
                    ? "bg-amber-900/10 border-amber-500/50 text-amber-400 font-bold"
                    : "bg-[#050507] border-zinc-900 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <MapPin size={14} className={selectedStation.name === station.name ? "text-amber-400" : "text-zinc-600"} />
                  <span>{station.name}</span>
                </div>
                <span className="text-[10px] text-zinc-600">
                  {station.lat.toFixed(1)}°N, {station.lon.toFixed(1)}°E
                </span>
              </button>
            ))}
          </div>

          <div className="p-4 bg-[#050507] border border-zinc-900 rounded-lg font-mono text-[10px] text-zinc-500 uppercase tracking-wider space-y-1.5">
            <div className="flex justify-between">
              <span>GPS Satellites:</span>
              <span className="text-emerald-500 font-bold">LOCK (9/12)</span>
            </div>
            <div className="flex justify-between">
              <span>Target Lat:</span>
              <span className="text-zinc-300 font-bold">{selectedStation.lat.toFixed(4)}° N</span>
            </div>
            <div className="flex justify-between">
              <span>Target Lon:</span>
              <span className="text-zinc-300 font-bold">{selectedStation.lon.toFixed(4)}° E</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="border border-zinc-900 bg-[#070709] rounded-lg p-5 relative overflow-hidden">
            <div className="absolute top-2 right-4 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest">Piet (0-48u heads-up)</span>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <Navigation size={14} className="text-emerald-400 text-glow-green" />
              <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">PIET WEATHER OUTPUT</span>
            </div>

            <div className="p-4 bg-[#0a0a0e] border border-zinc-800 rounded-lg text-xs font-mono text-zinc-300 leading-relaxed min-h-[70px]">
              {getLocalizedPiet()}
            </div>

            {referToReed && (
              <div className="mt-3 flex items-center gap-2 p-2 bg-rose-950/15 border border-rose-500/20 text-[10px] font-mono text-rose-400 rounded">
                <Info size={14} className="shrink-0 text-glow-red" />
                <span>LET OP: Piet heeft de doorverwijzing naar Reed geactiveerd vanwege onweer.</span>
              </div>
            )}
          </div>

          <div className="border border-zinc-900 bg-[#070709] rounded-lg p-5 relative">
            <div className="absolute top-2 right-4 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 animate-pulse" />
              <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest">Koos (Travel Escapism)</span>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <Sun size={14} className="text-yellow-500 text-glow-amber" />
              <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">KOOS ESCAPE LENS</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex flex-col items-center justify-center p-3 bg-[#0a0a0e] border border-zinc-850 rounded-lg text-center font-mono">
                <span className="text-[9px] text-zinc-500 uppercase tracking-wider mb-1">Comfort Score</span>
                <span className={`text-xl font-bold text-glow-amber ${
                  localKoos.score >= 0.7 ? "text-yellow-400" : localKoos.score >= 0.4 ? "text-amber-500" : "text-rose-500"
                }`}>
                  {Math.round(localKoos.score * 100)}%
                </span>

                <div className="h-1 w-16 bg-zinc-800 rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      localKoos.score >= 0.7 ? "bg-yellow-400" : localKoos.score >= 0.4 ? "bg-amber-500" : "bg-rose-500"
                    }`}
                    style={{ width: `${localKoos.score * 100}%` }}
                  />
                </div>
              </div>

              <div className="md:col-span-3 p-4 bg-[#0a0a0e] border border-zinc-800 rounded-lg text-xs font-mono leading-relaxed flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest block mb-0.5">Aanbevolen Ontsnapping:</span>
                  <span className="text-zinc-200 font-bold">
                    {localKoos.destination}
                    {localKoos.distance > 0 && ` (${localKoos.distance} km hemelsbreed)`}
                  </span>
                </div>
                <div className="mt-2 text-zinc-400 border-t border-zinc-900 pt-2 text-[11px]">
                  {localKoos.reason}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
