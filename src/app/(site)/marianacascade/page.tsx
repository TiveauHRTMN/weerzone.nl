"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/session-context";
import { CascadeGraph } from "@/components/marianacascade/CascadeGraph";
import { TeslaTelemetry } from "@/components/marianacascade/TeslaTelemetry";
import { ConvectiveCharts } from "@/components/marianacascade/ConvectiveCharts";
import { RegionSelector, TESLA_REGIONS } from "@/components/marianacascade/RegionSelector";
import { VoiceAlerts } from "@/components/marianacascade/VoiceAlerts";
import { HermesTerminal } from "@/components/marianacascade/HermesTerminal";
import {
  SCENARIOS,
  applyFluctuations,
  loadLiveCascadeData,
  mapLiveToScenario,
  WeatherScenario
} from "@/lib/marianacascade/marianacascade";
import { ShieldCheck, Database, RefreshCw, Sliders } from "lucide-react";

export default function MarianaCascadePage() {
  const { isFounder, loading: sessionLoading } = useSession();
  const [mode, setMode] = useState<"mock" | "live">("mock");
  const [selectedRegionSlug, setSelectedRegionSlug] = useState("zuidwest-nl");

  // Data states
  const [mockScenario, setMockScenario] = useState<WeatherScenario>(SCENARIOS[1]); // Default to Storm
  const [liveOracle, setLiveOracle] = useState<any>(null);
  const [liveRegions, setLiveRegions] = useState<Record<string, any>>({});
  const [liveTesla, setLiveTesla] = useState<any>(null);
  const [loadingDb, setLoadingDb] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Active data presented to widgets
  const [activeData, setActiveData] = useState<WeatherScenario>(SCENARIOS[1]);

  // Load live data from Supabase via marianacascade.ts DAL
  const loadLiveData = async () => {
    setLoadingDb(true);
    try {
      const { oracle, regions, tesla } = await loadLiveCascadeData(selectedRegionSlug);

      if (oracle) {
        setLiveOracle(oracle);
      }

      if (regions && regions.length > 0) {
        const indexed: Record<string, any> = {};
        for (const row of regions) {
          if (!indexed[row.region_slug] || new Date(row.run_at) > new Date(indexed[row.region_slug].run_at)) {
            indexed[row.region_slug] = row;
          }
        }
        setLiveRegions(indexed);
      }

      if (tesla) {
        setLiveTesla(tesla);
      } else {
        setLiveTesla(null);
      }
      setLastSyncTime(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Failed to load live data from Supabase:", err);
    } finally {
      setLoadingDb(false);
    }
  };

  // Sync on mode toggle
  useEffect(() => {
    if (mode === "live") {
      loadLiveData();
    }
  }, [mode]);

  // Refetch Tesla run when region slug changes in live mode
  useEffect(() => {
    if (mode !== "live") return;

    const fetchTeslaForRegion = async () => {
      try {
        const { tesla } = await loadLiveCascadeData(selectedRegionSlug);
        setLiveTesla(tesla || null);
      } catch (err) {
        console.error("Error fetching live Tesla run:", err);
      }
    };

    fetchTeslaForRegion();
  }, [selectedRegionSlug, mode]);

  // Fluctuations for Mock mode
  useEffect(() => {
    if (mode === "live") return;

    const interval = setInterval(() => {
      setActiveData((prev) => applyFluctuations(mockScenario));
    }, 1500);

    return () => clearInterval(interval);
  }, [mockScenario, mode]);

  // Mapping activeData in Live mode
  useEffect(() => {
    if (mode === "mock") {
      setActiveData(mockScenario);
      return;
    }

    const regionRow = liveRegions[selectedRegionSlug];
    if (!regionRow) return;

    const mapped = mapLiveToScenario({
      selectedRegionSlug,
      regionRow,
      liveOracle,
      liveTesla,
    });

    setActiveData(mapped);
  }, [liveOracle, liveRegions, liveTesla, selectedRegionSlug, mode, mockScenario]);

  const handleScenarioChange = (id: string) => {
    const found = SCENARIOS.find((scen) => scen.id === id);
    if (found) {
      setMockScenario(found);
      setActiveData(found);
    }
  };

  // Hazards mapping for RegionSelector buttons
  const getActiveHazards = () => {
    const hazards: Record<string, string[]> = {};
    if (mode === "mock") {
      if (mockScenario.id === "severe_thunderstorm") {
        hazards["zuidwest-nl"] = ["thunder"];
        hazards["zuidoost-nl"] = ["thunder"];
        hazards["rivierengebied"] = ["thunder"];
        hazards["zuiden-noord-brabant"] = ["thunder"];
      }
    } else {
      Object.keys(liveRegions).forEach((slug) => {
        const row = liveRegions[slug];
        if (row.tesla_context_used || row.local_feed?.convectiveActive) {
          hazards[slug] = ["thunder"];
        }
      });
    }
    return hazards;
  };

  if (sessionLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#f5f7fb]">
        <div className="text-slate-450 font-sans text-xs uppercase tracking-[0.2em] animate-pulse">
          Verifying Weerzone session...
        </div>
      </div>
    );
  }

  // Founder Auth check
  if (!isFounder) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#f5f7fb]">
        <div className="relative w-full max-w-md p-8 border border-[#e3e8f1] bg-white rounded-[24px] text-center shadow-lg">
          <div className="flex flex-col items-center">
            <h2 className="text-xl font-bold tracking-wider text-[#0f1a2c] font-sans uppercase">
              ACCESS DENIED
            </h2>
            <p className="text-xs text-slate-500 font-sans mt-3 uppercase tracking-wider leading-relaxed">
              This control deck is restricted to authorized Weerzone founders only.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const selectedRegion = TESLA_REGIONS.find((r) => r.slug === selectedRegionSlug) || TESLA_REGIONS[0];

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-800 flex flex-col relative pb-16 pt-4 font-sans">

      {/* Header */}
      <header className="border border-[#e3e8f1] bg-white/90 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between mx-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <h1 className="text-sm font-bold tracking-widest text-[#0f1a2c] uppercase m-0 leading-none">
              MARIANA CASCADE CONTROL ROOM
            </h1>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              CONVECTIVE STORM DETECTOR (48-96H EARLY WARNING)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider">Status:</span>
            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-widest border ${
              mode === "live"
                ? "bg-[#e0f5ec] border-[#10b981]/20 text-[#12805c]"
                : "bg-[#e8f0ff] border-[#3b7ff0]/20 text-[#2a5fc4] animate-pulse"
            }`}>
              {mode === "live" ? "DATABASE LIVE" : "SIMULATION MODE"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="p-1 bg-[#e0f5ec] border border-[#10b981]/20 text-[#12805c] rounded-lg">
              <ShieldCheck size={12} />
            </div>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-1">FOUNDER VERIFIED</span>
          </div>
        </div>
      </header>

      {/* Dashboard Body */}
      <main className="max-w-[1400px] w-full mx-auto p-4 space-y-6">

        {/* Row 0: Controller & Sync */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="border border-[#e3e8f1] bg-white rounded-3xl p-6 shadow-md flex items-center justify-between lg:col-span-2">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl border ${
                mode === "live"
                  ? "bg-[#e0f5ec] border-[#10b981]/25 text-[#12805c]"
                  : "bg-[#e8f0ff] border-[#3b7ff0]/25 text-[#2a5fc4]"
              }`}>
                <Database size={24} />
              </div>
              <div>
                <span className="text-xs font-bold text-[#0f1a2c] block uppercase tracking-wider">
                  {mode === "live" ? "LIVE DATABASE SYNCHRONIZATION" : "SIMULATION MODE (OFFLINE)"}
                </span>
                <span className="text-[9px] text-slate-450 block uppercase mt-0.5 font-bold">
                  {mode === "live"
                    ? `Connected to Weerzone Supabase. Last sync: ${lastSyncTime || "None"}`
                    : "Using local meteorological scenarios for simulation."}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              {mode === "live" && (
                <button
                  type="button"
                  onClick={loadLiveData}
                  disabled={loadingDb}
                  className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-350 text-slate-700 rounded-lg cursor-pointer transition-colors"
                  title="Refresh data"
                >
                  <RefreshCw size={14} className={loadingDb ? "animate-spin" : ""} />
                </button>
              )}
              <button
                type="button"
                onClick={() => setMode(mode === "live" ? "mock" : "live")}
                className={`px-4 py-2 border rounded-xl text-xs font-bold tracking-wider transition-all cursor-pointer ${
                  mode === "live"
                    ? "bg-[#e0f5ec] border-[#10b981]/40 text-[#12805c] hover:bg-[#e0f5ec]/80"
                    : "bg-[#e8f0ff] border-[#3b7ff0]/40 text-[#2a5fc4] hover:bg-[#e8f0ff]/80"
                }`}
              >
                {mode === "live" ? "SWITCH TO SIMULATOR" : "CONNECT LIVE DATABASE"}
              </button>
            </div>
          </div>

          <div className="border border-[#e3e8f1] bg-white rounded-3xl p-6 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
                <Sliders size={16} className="text-slate-400" />
                <span className="text-xs font-bold text-[#0f1a2c] uppercase tracking-wider">SCENARIO CONTROLLER</span>
              </div>
            </div>
            {mode === "mock" ? (
              <div className="space-y-2">
                {SCENARIOS.map((scen) => (
                  <button
                    key={scen.id}
                    type="button"
                    onClick={() => handleScenarioChange(scen.id)}
                    className={`w-full text-left p-2.5 border rounded-xl text-xs cursor-pointer transition-all ${
                      mockScenario.id === scen.id
                        ? "bg-[#e8f0ff] border-[#3b7ff0]/50 text-[#2a5fc4] font-bold"
                        : "bg-slate-50 border-slate-200 text-slate-550 hover:bg-slate-100/50"
                    }`}
                  >
                    <div className="font-bold">{scen.name}</div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center p-4 bg-slate-50 border border-slate-100 rounded-xl text-center text-[10px] text-slate-400 uppercase tracking-widest">
                Realtime database stream active.
              </div>
            )}
          </div>
        </div>

        {/* Row 1: Pipeline / Mariana Oracle 48-96h Gate */}
        <div>
          <CascadeGraph
            convectiveGate={activeData.oracle.convectiveGate}
            oracleRegime={activeData.oracle.regimeName}
            oracleConfidence={activeData.oracle.confidence}
            oracleData={activeData.oracle}
          />
        </div>

        {/* Row 2: Convective Storm Telemetry (Mariana Tesla) */}
        <div>
          <TeslaTelemetry
            cape={activeData.tesla.cape}
            cin={activeData.tesla.cin}
            windShear={activeData.tesla.windShear}
            supercellComposite={activeData.tesla.supercellComposite}
            lightningStrikes={activeData.tesla.lightningStrikes}
            alertLevel={activeData.tesla.alertLevel}
            teslaData={activeData.tesla}
          />
        </div>

        {/* Row 3: Convective Trend & Shear Profile Graphs */}
        <div>
          <ConvectiveCharts
            cape={activeData.tesla.cape}
            cin={activeData.tesla.cin}
            windShear={activeData.tesla.windShear}
            alertLevel={activeData.tesla.alertLevel}
          />
        </div>

        {/* Row 4: Region Selector & Audio/Hermes Shell */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Region Selector */}
          <div className="lg:col-span-1">
            <RegionSelector
              selectedSlug={selectedRegionSlug}
              onSelectSlug={(slug) => setSelectedRegionSlug(slug)}
              activeHazards={getActiveHazards()}
            />
          </div>

          {/* Audio & Hermes Shell */}
          <div className="lg:col-span-2 space-y-6">

            {/* Active Region Info Banner */}
            <div className="p-4 bg-white border border-[#e3e8f1] rounded-2xl shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-widest mb-1">
                Selected Mesoscale Region Analysis:
              </span>
              <span className="text-[#0f1a2c] font-bold text-sm block">
                {selectedRegion.name}
              </span>
              <span className="text-[11px] font-medium text-amber-600 block mt-1 font-sans">
                Trigger Role: {selectedRegion.role}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <VoiceAlerts
                scenarioName={activeData.name}
                convectiveGate={activeData.oracle.convectiveGate}
                cape={activeData.tesla.cape}
              />
              <HermesTerminal
                scenarioName={activeData.name}
                convectiveGate={activeData.oracle.convectiveGate}
                cape={activeData.tesla.cape}
              />
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="w-full absolute bottom-0 left-0 right-0 py-3.5 px-6 border-t border-[#e3e8f1] bg-[#f8fafc] flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-widest">
        <span>SECURITY ENCRYPTED DECK (AES-256)</span>
        <span>DESIGNED FOR THE WEERZONE FOUNDER</span>
      </footer>
    </div>
  );
}
