import React, { useState } from "react";
import { Cpu, ArrowRight, Play, Eye, EyeOff, TreeDeciduous, Info, Activity } from "lucide-react";

interface CascadeGraphProps {
  convectiveGate: "INACTIVE" | "ACTIVATE";
  oracleRegime: string;
  oracleConfidence: number;
  oracleData?: {
    regimeSummary?: string;
    pressurePattern?: string;
    ridgeAxisAssessment?: string;
    jetstreamAssessment?: string;
    airmassAssessment?: string;
    h850Trend?: string;
    h700CapSignal?: string;
    h500Pattern?: string;
    frontTroughTiming?: string;
    regimeShiftWatch?: boolean;
    scenarioTree?: Array<{
      scenario: string;
      probability: number;
      driver: string;
      confirmation_signal: string;
      failure_signal: string;
    }>;
    modelConflict?: {
      level: string;
      type: string[];
      summary: string;
    };
    domainImpacts?: {
      temperature: string;
      rain: string;
      wind: string;
      thunder: string;
      pollen: string;
      comfort: string;
    };
    confidenceScores?: {
      regime: number;
      temperature_trend: number;
      precipitation_regime: number;
      wind_regime: number;
      convective_gate: number;
      model_agreement: number;
    };
  };
}

export const CascadeGraph: React.FC<CascadeGraphProps> = ({
  convectiveGate,
  oracleRegime,
  oracleConfidence,
  oracleData,
}) => {
  const [showDeepAnalysis, setShowDeepAnalysis] = useState(false);
  const gateActive = convectiveGate === "ACTIVATE";

  return (
    <div className="border border-[#e3e8f1] bg-white rounded-3xl p-6 shadow-md relative">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl border border-slate-200/50 text-violet-600 bg-violet-50">
            <Cpu size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-wider text-[#0f1a2c] uppercase font-sans">
              MARIANA CASCADA GEOPROCESSING PIPELINE
            </h3>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5 font-sans">
              Live status and calculation trajectory of active forecast agents
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 font-sans">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Confidence:</span>
            <span className="text-xs font-bold text-violet-600">{oracleConfidence}%</span>
          </div>
          {oracleData && (
            <button
              type="button"
              onClick={() => setShowDeepAnalysis(!showDeepAnalysis)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 hover:border-slate-350 hover:bg-slate-100/50 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-all"
            >
              {showDeepAnalysis ? (
                <>
                  <EyeOff size={13} />
                  <span>HIDE DEEP ORACLE</span>
                </>
              ) : (
                <>
                  <Eye size={13} />
                  <span>DEEP ORACLE</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col space-y-6 md:space-y-0 md:flex-row md:items-center md:justify-between p-4 bg-[#f8fafc] border border-[#e3e8f1] rounded-2xl relative overflow-hidden">
        {/* Flow line background */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2 hidden md:block" />

        {/* Node 1: Mariana Oracle */}
        <div className="relative z-10 flex flex-col items-center p-4 bg-white border border-[#e3e8f1] rounded-xl w-full md:w-48 text-center shadow-sm">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Step 1: Regime</span>
          <span className="text-xs font-bold text-violet-600 uppercase tracking-wider">Mariana Oracle</span>
          <div className="mt-2 text-[10px] text-slate-500 font-sans leading-relaxed line-clamp-2 px-1">
            {oracleRegime}
          </div>
        </div>

        {/* Flow indicator 1 */}
        <div className="flex justify-center md:block">
          <ArrowRight className="text-slate-300 animate-pulse hidden md:block" />
        </div>

        {/* Middle split: Tesla & Regions */}
        <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:gap-4 items-center">

          {/* Node 2a: Tesla */}
          <div className={`relative z-10 flex flex-col items-center p-4 border rounded-xl w-full md:w-48 text-center transition-all shadow-sm ${
            gateActive
              ? "bg-[#fff3dc] border-amber-300 text-[#a8660b]"
              : "bg-slate-50/50 border-slate-200/50 opacity-40"
          }`}>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tesla Gate</span>
            <span className={`text-xs font-bold uppercase tracking-wider ${
              gateActive ? "text-amber-600 animate-pulse" : "text-slate-400"
            }`}>
              Mariana Tesla
            </span>
            <div className="mt-2 text-[10px] font-bold">
              {gateActive ? "🚨 ACTIVE TRACKING" : "🔒 NO THREAT"}
            </div>
          </div>

          <div className="hidden md:block w-4 h-0.5 bg-slate-350" />

          {/* Node 2b: Regions */}
          <div className="relative z-10 flex flex-col items-center p-4 bg-white border border-[#e3e8f1] rounded-xl w-full md:w-48 text-center shadow-sm">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Step 2: Region</span>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Regions</span>
            <div className="mt-2 text-[10px] text-slate-500">
              11 Mesoscale Zones
            </div>
          </div>
        </div>

        {/* Flow indicator 2 */}
        <div className="flex justify-center md:block">
          <ArrowRight className="text-slate-300 animate-pulse hidden md:block" />
        </div>

        {/* Node 3: Mariana Local */}
        <div className="relative z-10 flex flex-col items-center p-4 bg-white border border-[#e3e8f1] rounded-xl w-full md:w-48 text-center shadow-sm">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Step 3: GPS</span>
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Local Feed</span>
          <div className="mt-2 text-[10px] text-slate-500">
            10,000+ Locations
          </div>
        </div>
      </div>

      {/* Convective Gate Status Banner */}
      <div className="mt-6 flex items-center justify-between p-4 bg-[#f8fafc] border border-slate-100 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded border ${
            gateActive
              ? "bg-rose-500/10 border-rose-500/20 text-rose-600 animate-pulse"
              : "bg-slate-200/50 border-slate-300/30 text-slate-400"
          }`}>
            <Play size={14} />
          </div>
          <div className="font-sans">
            <span className="text-xs font-bold text-[#0f1a2c] block uppercase tracking-wider">
              CONVECTIVE STORM GATE STATUS
            </span>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest block mt-0.5">
              Binary decision triggered by Oracle (48-96h)
            </span>
          </div>
        </div>

        <span className={`px-4 py-1.5 border rounded-xl text-xs font-bold tracking-widest font-sans ${
          gateActive
            ? "bg-[#fde7e5] border-[#ef4444]/20 text-[#b4322b]"
            : "bg-slate-100 border-slate-200 text-slate-450"
        }`}>
          {gateActive ? "ACTIVE (STORM DANGER)" : "INACTIVE (CALM)"}
        </span>
      </div>

      {/* Expanded Deep Oracle Section */}
      {showDeepAnalysis && oracleData && (
        <div className="mt-6 pt-6 border-t border-slate-100 space-y-6 animate-fadeIn font-sans">

          {/* Regime Summary Description */}
          {oracleData.regimeSummary && (
            <div className="p-4 bg-[#f8fafc] border border-slate-100 rounded-2xl">
              <div className="flex gap-2 items-start">
                <Info size={16} className="text-violet-500 mt-0.5 shrink-0" />
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Regime Analysis Summary</span>
                  <p className="text-xs text-slate-700 mt-1 leading-relaxed">{oracleData.regimeSummary}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Column 1: Atmospheric Upper-Air Profile */}
            <div className="space-y-4 md:col-span-2">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Activity size={15} className="text-violet-500" />
                <span className="text-xs font-bold text-[#0f1a2c] uppercase tracking-wider">Upper-Air & Synoptic Assessment</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {oracleData.pressurePattern && (
                  <div className="p-3 bg-white border border-[#e3e8f1] rounded-xl shadow-xs">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Surface Pressure Pattern</span>
                    <span className="text-xs text-slate-700 mt-1 block font-medium">{oracleData.pressurePattern}</span>
                  </div>
                )}
                {oracleData.ridgeAxisAssessment && (
                  <div className="p-3 bg-white border border-[#e3e8f1] rounded-xl shadow-xs">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Ridge Axis Alignment</span>
                    <span className="text-xs text-slate-700 mt-1 block font-medium">{oracleData.ridgeAxisAssessment}</span>
                  </div>
                )}
                {oracleData.jetstreamAssessment && (
                  <div className="p-3 bg-white border border-[#e3e8f1] rounded-xl shadow-xs">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Jet Stream Placement</span>
                    <span className="text-xs text-slate-700 mt-1 block font-medium">{oracleData.jetstreamAssessment}</span>
                  </div>
                )}
                {oracleData.airmassAssessment && (
                  <div className="p-3 bg-white border border-[#e3e8f1] rounded-xl shadow-xs">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Airmass Profile</span>
                    <span className="text-xs text-slate-700 mt-1 block font-medium">{oracleData.airmassAssessment}</span>
                  </div>
                )}
                {oracleData.h850Trend && (
                  <div className="p-3 bg-white border border-[#e3e8f1] rounded-xl shadow-xs">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">850 hPa Thermal Trend</span>
                    <span className="text-xs text-slate-700 mt-1 block font-medium">{oracleData.h850Trend}</span>
                  </div>
                )}
                {oracleData.h700CapSignal && (
                  <div className="p-3 bg-white border border-[#e3e8f1] rounded-xl shadow-xs">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">700 hPa Capping Inversion</span>
                    <span className="text-xs text-slate-700 mt-1 block font-medium">{oracleData.h700CapSignal}</span>
                  </div>
                )}
                {oracleData.h500Pattern && (
                  <div className="p-3 bg-white border border-[#e3e8f1] rounded-xl shadow-xs">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">500 hPa Flow Pattern</span>
                    <span className="text-xs text-slate-700 mt-1 block font-medium">{oracleData.h500Pattern}</span>
                  </div>
                )}
                {oracleData.frontTroughTiming && (
                  <div className="p-3 bg-white border border-[#e3e8f1] rounded-xl shadow-xs">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Front/Trough Timing</span>
                    <span className="text-xs text-slate-700 mt-1 block font-medium">{oracleData.frontTroughTiming}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: Confidence Meters */}
            {oracleData.confidenceScores && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Activity size={15} className="text-violet-500" />
                  <span className="text-xs font-bold text-[#0f1a2c] uppercase tracking-wider">Oracle Confidence Metrics</span>
                </div>
                <div className="space-y-3.5 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                  {Object.entries(oracleData.confidenceScores).map(([key, val]) => {
                    const pct = Math.round(Number(val) * 100);
                    return (
                      <div key={key} className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                          <span className="text-slate-500">{key.replace("_", " ")}</span>
                          <span className="text-violet-600">{pct}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-violet-600 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Scenario Tree & Model Conflicts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100">

            {/* Scenario Tree (48-96h forecast tree) */}
            {oracleData.scenarioTree && oracleData.scenarioTree.length > 0 && (
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <TreeDeciduous size={15} className="text-violet-500" />
                  <span className="text-xs font-bold text-[#0f1a2c] uppercase tracking-wider">Regime Scenario Tree (48-96h)</span>
                </div>
                <div className="space-y-3">
                  {oracleData.scenarioTree.map((scen, idx) => {
                    const probPct = Math.round(scen.probability * 100);
                    return (
                      <div key={idx} className="p-4 bg-white border border-[#e3e8f1] rounded-2xl space-y-2 hover:shadow-xs transition-shadow">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#0f1a2c]">{scen.scenario}</span>
                          <span className="bg-violet-100 text-violet-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{probPct}% Prob</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[10px] leading-relaxed pt-1.5 border-t border-slate-50">
                          <div>
                            <span className="font-bold text-slate-400 uppercase tracking-widest block">Primary Driver</span>
                            <span className="text-slate-700 mt-0.5 block">{scen.driver}</span>
                          </div>
                          <div>
                            <span className="font-bold text-slate-400 uppercase tracking-widest block">Confirmation Signal</span>
                            <span className="text-slate-700 mt-0.5 block">{scen.confirmation_signal}</span>
                          </div>
                          <div>
                            <span className="font-bold text-slate-400 uppercase tracking-widest block">Failure Signal</span>
                            <span className="text-slate-700 mt-0.5 block">{scen.failure_signal}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Model Conflicts & Domain Impacts */}
            <div className="space-y-6">
              {/* Conflicts */}
              {oracleData.modelConflict && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-[#0f1a2c] uppercase tracking-wider">Model Disagreements</span>
                  </div>
                  <div className="p-4 bg-amber-50/50 border border-amber-200/50 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Conflict Level:</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                        oracleData.modelConflict.level === "high"
                          ? "bg-rose-50 border-rose-200 text-rose-700 animate-pulse"
                          : oracleData.modelConflict.level === "medium"
                            ? "bg-amber-50 border-amber-200 text-amber-700"
                            : "bg-emerald-50 border-emerald-200 text-emerald-700"
                      }`}>
                        {oracleData.modelConflict.level}
                      </span>
                    </div>
                    {oracleData.modelConflict.type && oracleData.modelConflict.type.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {oracleData.modelConflict.type.map((t, i) => (
                          <span key={i} className="text-[9px] bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded-md font-medium uppercase">{t}</span>
                        ))}
                      </div>
                    )}
                    <p className="text-[11px] text-slate-600 leading-relaxed mt-2">{oracleData.modelConflict.summary}</p>
                  </div>
                </div>
              )}

              {/* Domain Impacts */}
              {oracleData.domainImpacts && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-[#0f1a2c] uppercase tracking-wider">Forecasted Local Impacts</span>
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] space-y-2 leading-relaxed">
                    {Object.entries(oracleData.domainImpacts).map(([key, val]) => (
                      <div key={key} className="flex justify-between border-b border-slate-100/60 pb-1.5 last:border-0 last:pb-0">
                        <span className="font-bold text-slate-500 uppercase tracking-wider">{key}</span>
                        <span className="text-slate-700 font-medium text-right max-w-[65%] truncate">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
