import React, { useState } from "react";
import { Zap, Wind, AlertTriangle, ShieldAlert, Eye, EyeOff, Info, HelpCircle } from "lucide-react";

interface TeslaTelemetryProps {
  cape: number;
  cin: number;
  windShear: number;
  supercellComposite: number;
  lightningStrikes: number;
  alertLevel: "GREEN" | "AMBER" | "RED" | "CRIMSON";
  teslaData?: {
    convectiveRegime?: string;
    synopticSetup?: string;
    modelConsensus?: string;
    capeAssessment?: string;
    cinStatus?: string;
    effectiveCinAssessment?: string;
    triggerAlignment?: string;
    timingWindow?: string;
    initiationZone?: string;
    upstreamHijackRisk?: boolean;
    seedCellWatch?: boolean;
    peakCorridor?: string;
    expectedMode?: string;
    inflowOutflowExpectation?: string;
    dutchMesoscaleFactors?: string[];
    founderInputAssessment?: string;
    confidenceScores?: {
      initiation: number;
      thunder: number;
      severe: number;
      upscale: number;
      timing: number;
      location: number;
      model_agreement: number;
      founder_signal_weight: number;
    };
    failureModes?: string[];
    reedAction?: string;
    reasoningChain?: string[];
  };
}

export const TeslaTelemetry: React.FC<TeslaTelemetryProps> = ({
  cape,
  cin,
  windShear,
  supercellComposite,
  lightningStrikes,
  alertLevel,
  teslaData,
}) => {
  const [showDeepConvective, setShowDeepConvective] = useState(false);

  // Light theme colors matching Weerzone brand guidelines
  const getAlertBanner = () => {
    switch (alertLevel) {
      case "CRIMSON":
        return "bg-[#fde7e5] border-[#ef4444]/20 text-[#b4322b]";
      case "RED":
        return "bg-[#fde7e5] border-[#ef4444]/20 text-[#b4322b]";
      case "AMBER":
        return "bg-[#fff3dc] border-[#f59e0b]/20 text-[#a8660b]";
      default:
        return "bg-[#e0f5ec] border-[#10b981]/25 text-[#12805c]";
    }
  };

  const getDialColor = (val: number, isCin = false) => {
    if (isCin) {
      return val > 100 ? "stroke-emerald-500" : "stroke-rose-500";
    }
    if (val > 2000 || (val > 5 && !isCin)) return "stroke-rose-500";
    if (val > 1000 || (val > 2 && !isCin)) return "stroke-amber-500";
    return "stroke-emerald-500";
  };

  const renderDial = (
    value: number,
    max: number,
    label: string,
    unit: string,
    strokeColor: string,
    icon: React.ReactNode
  ) => {
    const percentage = Math.min(100, (value / max) * 100);
    const radius = 40;
    const strokeDasharray = 2 * Math.PI * radius;
    const strokeDashoffset = strokeDasharray - (percentage / 100) * strokeDasharray;

    return (
      <div className="flex flex-col items-center p-5 bg-white border border-[#e3e8f1] rounded-2xl shadow-sm hover:shadow-md transition-shadow">
        <div className="relative w-28 h-28 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="56"
              cy="56"
              r={radius}
              className="stroke-slate-100"
              strokeWidth="5"
              fill="transparent"
            />
            <circle
              cx="56"
              cy="56"
              r={radius}
              className={`${strokeColor} transition-all duration-500`}
              strokeWidth="7"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-xl font-bold text-[#0f1a2c] font-sans">{value}</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{unit}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 mt-4 text-slate-500">
          {icon}
          <span className="text-[11px] font-bold tracking-wider uppercase font-sans">{label}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="border border-[#e3e8f1] bg-white rounded-3xl p-6 shadow-md relative">
      <div className="absolute top-4 right-6 flex items-center gap-3">
        {teslaData && (
          <button
            type="button"
            onClick={() => setShowDeepConvective(!showDeepConvective)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 hover:border-slate-350 hover:bg-slate-100/50 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-all"
          >
            {showDeepConvective ? (
              <>
                <EyeOff size={13} />
                <span>HIDE CONVECTIVE DETAIL</span>
              </>
            ) : (
              <>
                <Eye size={13} />
                <span>DEEP CONVECTIVE DETAIL</span>
              </>
            )}
          </button>
        )}
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full animate-pulse ${
            alertLevel === "CRIMSON" || alertLevel === "RED" ? "bg-rose-500" : "bg-emerald-500"
          }`} />
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">LIVE DATA FEED</span>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
        <div className={`p-2 rounded-xl border border-slate-200/50`}>
          <ShieldAlert size={20} className={alertLevel === "CRIMSON" || alertLevel === "RED" ? "text-rose-500" : "text-amber-500"} />
        </div>
        <div>
          <h3 className="text-sm font-bold tracking-wider text-[#0f1a2c] uppercase font-sans">
            MARIANA TESLA CONVECTIVE TELEMETRY
          </h3>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5 font-sans">
            Atmospheric instability parameters (Convective indices)
          </p>
        </div>
      </div>

      {/* Warning banner */}
      {(alertLevel === "CRIMSON" || alertLevel === "RED") && (
        <div className={`mb-6 p-4 border rounded-2xl flex items-center gap-4 ${getAlertBanner()}`}>
          <AlertTriangle size={24} className="shrink-0" />
          <div className="font-sans">
            <span className="text-xs font-bold block uppercase tracking-wider">MARIANA TESLA HAZARD ALERT</span>
            <span className="text-[11px] block mt-0.5 leading-relaxed">
              Atmospheric energy parameters exceed safe thresholds. Highly favorable environment for severe convective storm development, including hail and wind gusts.
            </span>
          </div>
        </div>
      )}

      {/* Dials Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {renderDial(
          cape,
          3500,
          "CAPE Energy",
          "J/kg",
          getDialColor(cape),
          <Zap size={12} className={cape > 1000 ? "text-amber-500" : "text-slate-400"} />
        )}

        {renderDial(
          cin,
          250,
          "CIN Inhibition",
          "J/kg",
          getDialColor(cin, true),
          <AlertTriangle size={12} className="text-slate-400" />
        )}

        {renderDial(
          windShear,
          40,
          "Wind Shear",
          "m/s",
          getDialColor(windShear),
          <Wind size={12} className="text-slate-400" />
        )}

        {renderDial(
          supercellComposite,
          10,
          "Supercell Index",
          "Index",
          getDialColor(supercellComposite),
          <ShieldAlert size={12} className="text-slate-400" />
        )}
      </div>

      {/* Bottom info bar */}
      <div className="mt-6 p-4 bg-[#f8fafc] border border-slate-100 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`h-2.5 w-2.5 rounded-full ${
            lightningStrikes > 20 ? "bg-rose-500 animate-ping" : "bg-amber-500"
          }`} />
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 font-sans">
            Detected Lightning Frequency:
          </span>
        </div>
        <div className="flex items-end gap-1.5 text-slate-800">
          <span className="text-2xl font-bold text-[#0f1a2c] leading-none">{lightningStrikes}</span>
          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold pb-0.5">discharges / min</span>
        </div>
      </div>

      {/* Expanded Deep Convective Detail */}
      {showDeepConvective && teslaData && (
        <div className="mt-6 pt-6 border-t border-slate-100 space-y-6 animate-fadeIn font-sans">

          {/* Synoptic Overview & Consensus */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Info size={15} className="text-amber-500" />
                <span className="text-xs font-bold text-[#0f1a2c] uppercase tracking-wider">Convective Setup & Model Consensus</span>
              </div>
              <div className="space-y-3">
                {teslaData.convectiveRegime && (
                  <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Convective Regime</span>
                    <p className="text-xs text-slate-700 mt-1 leading-relaxed">{teslaData.convectiveRegime}</p>
                  </div>
                )}
                {teslaData.synopticSetup && (
                  <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Synoptic Dynamics</span>
                    <p className="text-xs text-slate-700 mt-1 leading-relaxed">{teslaData.synopticSetup}</p>
                  </div>
                )}
                {teslaData.modelConsensus && (
                  <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Storm Model Consensus</span>
                    <p className="text-xs text-slate-700 mt-1 leading-relaxed">{teslaData.modelConsensus}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: Tesla Confidence Scores */}
            {teslaData.confidenceScores && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-[#0f1a2c] uppercase tracking-wider">Tesla Confidence Profile</span>
                </div>
                <div className="space-y-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                  {Object.entries(teslaData.confidenceScores).map(([key, val]) => {
                    const pct = Math.round(Number(val) * 100);
                    return (
                      <div key={key} className="space-y-1">
                        <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider">
                          <span className="text-slate-500">{key.replace("_", " ")}</span>
                          <span className="text-amber-600">{pct}%</span>
                        </div>
                        <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full transition-all duration-500"
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

          {/* Meteorological Parameters Detailed Assessment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
            {teslaData.capeAssessment && (
              <div className="p-3.5 bg-white border border-[#e3e8f1] rounded-xl shadow-xs">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">CAPE Assessment</span>
                <p className="text-xs text-slate-700 mt-1.5 leading-relaxed">{teslaData.capeAssessment}</p>
              </div>
            )}
            {teslaData.cinStatus && (
              <div className="p-3.5 bg-white border border-[#e3e8f1] rounded-xl shadow-xs">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">CIN Status</span>
                <p className="text-xs text-slate-700 mt-1.5 leading-relaxed">{teslaData.cinStatus}</p>
              </div>
            )}
            {teslaData.effectiveCinAssessment && (
              <div className="p-3.5 bg-white border border-[#e3e8f1] rounded-xl shadow-xs">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Effective CIN</span>
                <p className="text-xs text-slate-700 mt-1.5 leading-relaxed">{teslaData.effectiveCinAssessment}</p>
              </div>
            )}
            {teslaData.triggerAlignment && (
              <div className="p-3.5 bg-white border border-[#e3e8f1] rounded-xl shadow-xs">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Trigger Alignment</span>
                <p className="text-xs text-slate-700 mt-1.5 leading-relaxed">{teslaData.triggerAlignment}</p>
              </div>
            )}
            {teslaData.timingWindow && (
              <div className="p-3.5 bg-white border border-[#e3e8f1] rounded-xl shadow-xs">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Severe Timing Window</span>
                <p className="text-xs text-slate-700 mt-1.5 leading-relaxed">{teslaData.timingWindow}</p>
              </div>
            )}
            {teslaData.initiationZone && (
              <div className="p-3.5 bg-white border border-[#e3e8f1] rounded-xl shadow-xs">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Convective Initiation Zone</span>
                <p className="text-xs text-slate-700 mt-1.5 leading-relaxed">{teslaData.initiationZone}</p>
              </div>
            )}
            {teslaData.expectedMode && (
              <div className="p-3.5 bg-white border border-[#e3e8f1] rounded-xl shadow-xs">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Expected Storm Mode</span>
                <p className="text-xs text-slate-700 mt-1.5 leading-relaxed">{teslaData.expectedMode}</p>
              </div>
            )}
            {teslaData.peakCorridor && (
              <div className="p-3.5 bg-white border border-[#e3e8f1] rounded-xl shadow-xs">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Peak Damage Corridor</span>
                <p className="text-xs text-slate-700 mt-1.5 leading-relaxed">{teslaData.peakCorridor}</p>
              </div>
            )}
            {teslaData.inflowOutflowExpectation && (
              <div className="p-3.5 bg-white border border-[#e3e8f1] rounded-xl shadow-xs">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Inflow/Outflow dynamics</span>
                <p className="text-xs text-slate-700 mt-1.5 leading-relaxed">{teslaData.inflowOutflowExpectation}</p>
              </div>
            )}
          </div>

          {/* Warnings Badges & Mesoscale Dynamics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-[#0f1a2c] uppercase tracking-wider font-sans">Dutch Mesoscale Factors</span>
              </div>
              {teslaData.dutchMesoscaleFactors && teslaData.dutchMesoscaleFactors.length > 0 ? (
                <ul className="space-y-2">
                  {teslaData.dutchMesoscaleFactors.map((factor, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-md mt-0.5">#{idx + 1}</span>
                      <span className="leading-relaxed">{factor}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400 italic font-medium">No localized mesoscale dynamics reported.</p>
              )}
            </div>

            {/* Badges Column */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-[#0f1a2c] uppercase tracking-wider">Convective Watch Badges</span>
              </div>
              <div className="space-y-3.5">
                <div className="flex justify-between items-center p-3.5 bg-white border border-[#e3e8f1] rounded-2xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Upstream Hijack Risk</span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                    teslaData.upstreamHijackRisk
                      ? "bg-rose-50 border-rose-200 text-rose-700 animate-pulse"
                      : "bg-slate-50 border-slate-200 text-slate-450"
                  }`}>
                    {teslaData.upstreamHijackRisk ? "HIGH RISK" : "NOMINAL"}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3.5 bg-white border border-[#e3e8f1] rounded-2xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Seed Cell Watch</span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                    teslaData.seedCellWatch
                      ? "bg-rose-50 border-rose-200 text-rose-700 animate-pulse"
                      : "bg-slate-50 border-slate-200 text-slate-450"
                  }`}>
                    {teslaData.seedCellWatch ? "ACTIVE WATCH" : "NONE"}
                  </span>
                </div>
                {teslaData.reedAction && (
                  <div className="flex justify-between items-center p-3.5 bg-white border border-[#e3e8f1] rounded-2xl">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Reed Storm Chaser Action</span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider bg-rose-100 border-rose-200 text-rose-800`}>
                      {teslaData.reedAction}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Reasoning Chain & Failure Modes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
            {teslaData.reasoningChain && teslaData.reasoningChain.length > 0 && (
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-[#0f1a2c] uppercase tracking-wider font-sans">Tesla Convective Reasoning Chain</span>
                </div>
                <div className="p-4 bg-[#fdfcfa] border border-amber-100 rounded-2xl space-y-3 text-xs text-slate-700 leading-relaxed shadow-sm">
                  {teslaData.reasoningChain.map((step, idx) => (
                    <div key={idx} className="flex gap-2">
                      <span className="text-amber-500 font-bold shrink-0">{`>`}</span>
                      <p>{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {teslaData.failureModes && teslaData.failureModes.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <HelpCircle size={15} className="text-slate-400" />
                  <span className="text-xs font-bold text-[#0f1a2c] uppercase tracking-wider">Failure Modes</span>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs text-slate-500 space-y-2.5 leading-relaxed">
                  {teslaData.failureModes.map((mode, idx) => (
                    <div key={idx} className="flex items-start gap-1.5">
                      <span className="text-rose-500 font-bold shrink-0 mt-0.5">•</span>
                      <p>{mode}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
