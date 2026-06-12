import React from "react";
import { Activity } from "lucide-react";

interface ModelSpectrumProps {
  models: {
    harmonie: number;
    arome: number;
    icon: number;
    ecmwf: number;
    gfs: number;
  };
}

export const ModelSpectrum: React.FC<ModelSpectrumProps> = ({ models }) => {
  const modelList = [
    { name: "HARMONIE-AROME (NL Hi-Res)", value: models.harmonie, desc: "KNMI storm & convectie model" },
    { name: "AROME (FR Hi-Res)", value: models.arome, desc: "Météo-France hoge resolutie wind/regen" },
    { name: "ICON-D2 (DE Hi-Res)", value: models.icon, desc: "DWD fijnmazig Duitsland/NL grid" },
    { name: "ECMWF (Global High-End)", value: models.ecmwf, desc: "Europees model, stabiel bij hogedruk" },
    { name: "GFS (Global Standard)", value: models.gfs, desc: "Amerikaans mondiaal model" },
  ];

  return (
    <div className="border border-zinc-800 bg-[#0c0c10] rounded-xl p-6 shadow-xl relative">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-900">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg border bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
            <Activity size={20} className="text-glow-green" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-mono tracking-wider text-zinc-200">MODEL BLENDING SPECTRUM</h3>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5">
              Dynamische weging van weersmodellen op basis van regime
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {modelList.map((model) => {
          const percent = Math.round(model.value * 100);

          const getBarColor = () => {
            if (model.name.includes("HARMONIE") || model.name.includes("AROME")) {
              return "bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]";
            }
            if (model.name.includes("ECMWF")) {
              return "bg-gradient-to-r from-violet-600 to-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.3)]";
            }
            return "bg-gradient-to-r from-zinc-700 to-zinc-500";
          };

          return (
            <div key={model.name} className="space-y-1.5">
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-[11px] font-mono font-bold text-zinc-300 block">
                    {model.name}
                  </span>
                  <span className="text-[9px] font-mono text-zinc-600 block uppercase tracking-wide">
                    {model.desc}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-zinc-200">{percent}%</span>
              </div>

              <div className="h-2 w-full bg-[#050507] border border-zinc-900 rounded-sm overflow-hidden">
                <div
                  className={`h-full rounded-sm transition-all duration-500 ${getBarColor()}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 p-3 bg-[#070709] border border-zinc-900 rounded-lg text-[9px] font-mono text-zinc-500 leading-relaxed uppercase tracking-wider">
        💡 <span className="font-bold text-zinc-400">Tactische Duiding:</span> Bij zware buien of onweer verhoogt de cascade automatisch de weging van fijnmazige hi-res stormmodellen, omdat globale modellen de timing en intensiteit van lokale ontladingen missen.
      </div>
    </div>
  );
};
