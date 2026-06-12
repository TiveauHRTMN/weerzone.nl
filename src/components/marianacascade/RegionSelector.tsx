import React from "react";
import { MapPin, Navigation } from "lucide-react";

export interface TeslaRegion {
  slug: string;
  name: string;
  lat: number;
  lon: number;
  role: string;
}

export const TESLA_REGIONS: TeslaRegion[] = [
  {
    slug: "zuidwest-nl",
    name: "Southwest-NL (Zeeland/Delta)",
    lat: 51.5,
    lon: 3.9,
    role: "Coastal convergence, offshore initiation, first landfall with SW flow.",
  },
  {
    slug: "zuidoost-nl",
    name: "Southeast-NL (Limburg/Brabant-East)",
    lat: 51.2,
    lon: 5.9,
    role: "Early southern theta-e advection (Spanish Plume), higher severe threshold.",
  },
  {
    slug: "noordzee-kust",
    name: "North Sea / Coast",
    lat: 52.46,
    lon: 4.3,
    role: "Cooler boundary layer, elevated convection, offshore initiation.",
  },
  {
    slug: "kop-noord-holland",
    name: "Northern Noord-Holland",
    lat: 52.78,
    lon: 4.8,
    role: "Land-water transition, wind convergence, early seed cells.",
  },
  {
    slug: "ijsselmeer-markermeer",
    name: "IJsselmeer / Markermeer",
    lat: 52.6,
    lon: 5.25,
    role: "Open fetch, boundary interaction, corridor to Flevoland.",
  },
  {
    slug: "flevoland",
    name: "Flevoland",
    lat: 52.51,
    lon: 5.47,
    role: "Flat terrain fetch, propagation corridor to the Veluwe.",
  },
  {
    slug: "veluwe",
    name: "Veluwe / Utrechtse Heuvelrug",
    lat: 52.2,
    lon: 5.85,
    role: "Thermal triggering on dry sandy soils, boundary convergence.",
  },
  {
    slug: "rivierengebied",
    name: "River Region",
    lat: 51.85,
    lon: 5.55,
    role: "Moist low-level boundary layers, advection from Belgium.",
  },
  {
    slug: "duitse-grens",
    name: "German Border / Achterhoek",
    lat: 52.0,
    lon: 6.3,
    role: "Downstream storm maturation, reactivation away from marine influence.",
  },
  {
    slug: "wadden-friesland",
    name: "Wadden Islands / Friesland",
    lat: 53.2,
    lon: 5.6,
    role: "Northern storm tracks, boundary enhancement over tidal flats.",
  },
  {
    slug: "zuiden-noord-brabant",
    name: "Central South (Noord-Brabant)",
    lat: 51.5,
    lon: 5.25,
    role: "Central corridor, thermal triggering on heathlands.",
  },
];

interface RegionSelectorProps {
  selectedSlug: string;
  onSelectSlug: (slug: string) => void;
  activeHazards: Record<string, string[]>;
}

export const RegionSelector: React.FC<RegionSelectorProps> = ({
  selectedSlug,
  onSelectSlug,
  activeHazards,
}) => {
  return (
    <div className="border border-[#e3e8f1] bg-white rounded-3xl p-6 shadow-md flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 shrink-0">
        <Navigation size={16} className="text-amber-500" />
        <span className="text-xs font-bold text-[#0f1a2c] uppercase tracking-wider font-sans">
          MESOSCALE REGION SELECTOR (NL)
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[300px] scrollbar-thin">
        {TESLA_REGIONS.map((region) => {
          const isSelected = region.slug === selectedSlug;
          const hazards = activeHazards[region.slug] || [];

          return (
            <button
              key={region.slug}
              type="button"
              onClick={() => onSelectSlug(region.slug)}
              className={`w-full text-left p-3.5 border rounded-2xl font-sans text-xs cursor-pointer transition-all ${
                isSelected
                  ? "bg-[#e8f0ff] border-[#3b7ff0]/50 text-[#2a5fc4] font-bold shadow-sm"
                  : "bg-slate-50/50 border-slate-200/60 text-slate-700 hover:bg-slate-100/50 hover:text-[#0f1a2c]"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin size={14} className={isSelected ? "text-[#3b7ff0]" : "text-slate-450"} />
                  <span className="text-xs">{region.name}</span>
                </div>
                {hazards.includes("thunder") && (
                  <span className="bg-[#fde7e5] border border-[#ef4444]/20 text-[#b4322b] text-[8px] font-bold px-1.5 py-0.5 rounded-lg animate-pulse uppercase tracking-wider">
                    ⚡ convective
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-450 mt-1.5 font-normal leading-relaxed">
                {region.role}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
