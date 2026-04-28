import { Metadata } from "next";
import { getSupabase } from "@/lib/supabase";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Architect Mode | WEERZONE System",
};

export const dynamic = "force-dynamic";

export default async function ArchitectMode() {
  const supabase = getSupabase();
  
  // Fetch system metrics
  const { data: patrolLogs } = await supabase?.from("wws_patrol_log").select("*").order("created_at", { ascending: false }).limit(5) || { data: [] };
  const { data: agentLogs } = await supabase?.from("agent_activity").select("*").order("created_at", { ascending: false }).limit(5) || { data: [] };
  const { count: truthCount } = await supabase?.from("wws_truth_cache").select("*", { count: 'exact', head: true }) || { count: 0 };
  const { count: placeCount } = await supabase?.from("discovered_places").select("*", { count: 'exact', head: true }) || { count: 0 };

  const processes = [
    {
      name: "Hermes: Truth Patrol",
      endpoint: "/api/cron/hermes-patrol",
      schedule: "01:00 Daily",
      description: "Cross-references KNMI & AROME models for ground truth.",
      status: "Operational",
      target: "wws_truth_cache",
      color: "border-purple-500/30 text-purple-400"
    },
    {
      name: "OpenClaw: Harvester",
      endpoint: "/api/cron/openclaw-harvester",
      schedule: "02:00 Daily",
      description: "Systematic province-by-province micro-location discovery.",
      status: "Operational",
      target: "discovered_places",
      color: "border-blue-500/30 text-blue-400"
    },
    {
      name: "Discovery Engine",
      endpoint: "/api/cron/discovery-engine",
      schedule: "03:00 Daily",
      description: "Hydrates SEO metadata for newly found locations.",
      status: "Active",
      target: "sitemap.xml",
      color: "border-cyan-500/30 text-cyan-400"
    },
    {
      name: "Paperclip: Yield",
      endpoint: "/api/cron/paperclip-yield",
      schedule: "12:00 Daily",
      description: "Analyzes affiliate CTR and pivots product placement.",
      status: "Optimizing",
      target: "affiliate_performance",
      color: "border-emerald-500/30 text-emerald-400"
    }
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-white p-8 font-mono">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 border-b border-white/10 pb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-black tracking-tighter uppercase mb-2">Architect Mode</h1>
              <p className="text-white/40 text-xs tracking-[0.3em] uppercase">System Infrastructure & Autonomous Logic Map</p>
            </div>
            <Link href="/admin/agents" className="text-[10px] bg-white/5 border border-white/10 px-4 py-2 rounded hover:bg-white/10 transition-all uppercase tracking-widest">
              Back to Cockpit
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* SYSTEM ARCHITECTURE MAP */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xs font-black uppercase tracking-widest text-white/30 mb-4 italic">// Autonomous Process Map</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {processes.map((proc) => (
                <div key={proc.name} className={`p-6 rounded-xl border ${proc.color} bg-white/[0.02] backdrop-blur-sm group hover:bg-white/[0.05] transition-all`}>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-50">{proc.schedule}</span>
                    <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded uppercase font-bold tracking-tighter">{proc.status}</span>
                  </div>
                  <h3 className="text-lg font-black mb-2 uppercase italic">{proc.name}</h3>
                  <p className="text-xs text-white/50 mb-6 leading-relaxed">{proc.description}</p>
                  
                  <div className="space-y-2 border-t border-white/5 pt-4">
                    <div className="flex justify-between text-[10px]">
                      <span className="opacity-40 uppercase">Endpoint</span>
                      <code className="text-white/80">{proc.endpoint}</code>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="opacity-40 uppercase">Writing To</span>
                      <code className="text-white/80">{proc.target}</code>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* REAL-TIME STATE */}
          <div className="space-y-8">
            <section>
              <h2 className="text-xs font-black uppercase tracking-widest text-white/30 mb-6 italic">// Database Registry</h2>
              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-white/5 border border-white/5 flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-white/40 tracking-widest">Truth Cache</span>
                  <span className="text-xl font-black">{truthCount} pts</span>
                </div>
                <div className="p-4 rounded-lg bg-white/5 border border-white/5 flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-white/40 tracking-widest">Discovery Leads</span>
                  <span className="text-xl font-black text-blue-400">{placeCount} loc</span>
                </div>
                <div className="p-4 rounded-lg bg-white/5 border border-white/5 flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-white/40 tracking-widest">Sitemap Index</span>
                  <span className="text-xl font-black text-emerald-400">ONLINE</span>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xs font-black uppercase tracking-widest text-white/30 mb-6 italic">// Latest Protocol Logs</h2>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
                {patrolLogs?.map((log, i) => (
                  <div key={i} className="p-3 text-[10px] border-l-2 border-purple-500 bg-purple-500/5">
                    <div className="flex justify-between mb-1">
                      <span className="font-black uppercase text-purple-400">{log.action}</span>
                      <span className="opacity-30">{new Date(log.created_at).toLocaleTimeString()}</span>
                    </div>
                    <p className="opacity-60 truncate">{JSON.stringify(log.meta)}</p>
                  </div>
                ))}
                {agentLogs?.map((log, i) => (
                  <div key={i} className="p-3 text-[10px] border-l-2 border-blue-500 bg-blue-500/5">
                    <div className="flex justify-between mb-1">
                      <span className="font-black uppercase text-blue-400">{log.agent_name}</span>
                      <span className="opacity-30">{new Date(log.created_at).toLocaleTimeString()}</span>
                    </div>
                    <p className="opacity-60 truncate">{log.description}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* DATA FLOW VISUALIZATION */}
        <section className="mt-12 p-10 border border-white/10 rounded-3xl bg-gradient-to-b from-white/[0.02] to-transparent">
          <h2 className="text-xs font-black uppercase tracking-[0.4em] text-center text-white/20 mb-4">Meteorological Intelligence Pipeline</h2>
          <p className="text-[10px] text-center text-white/20 mb-12 max-w-2xl mx-auto">6 modellen → Hermes Truth Patrol → Piet/Reed Persona Layer</p>
          
          {/* LAYER 1: MODEL SOURCES */}
          <div className="mb-12">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-6 text-center">Layer 1 — Numerical Weather Prediction (NWP)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <div className="p-5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-center">
                <div className="w-12 h-12 rounded-full border-2 border-emerald-500/40 flex items-center justify-center mx-auto mb-3 text-emerald-400 text-[10px] font-black">NWP</div>
                <p className="text-xs font-black text-emerald-400 uppercase">KNMI Harmonie</p>
                <p className="text-[9px] text-white/30 mt-1">2.5km grid · Nederland</p>
                <span className="inline-block mt-2 text-[8px] bg-emerald-500/20 px-2 py-0.5 rounded-full text-emerald-300 font-bold uppercase">Live</span>
              </div>
              <div className="p-5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-center">
                <div className="w-12 h-12 rounded-full border-2 border-emerald-500/40 flex items-center justify-center mx-auto mb-3 text-emerald-400 text-[10px] font-black">NWP</div>
                <p className="text-xs font-black text-emerald-400 uppercase">DWD ICON-D2</p>
                <p className="text-[9px] text-white/30 mt-1">2.2km grid · Centraal-Europa</p>
                <span className="inline-block mt-2 text-[8px] bg-emerald-500/20 px-2 py-0.5 rounded-full text-emerald-300 font-bold uppercase">Live</span>
              </div>
              <div className="p-5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-center">
                <div className="w-12 h-12 rounded-full border-2 border-emerald-500/40 flex items-center justify-center mx-auto mb-3 text-emerald-400 text-[10px] font-black">NWP</div>
                <p className="text-xs font-black text-emerald-400 uppercase">MF AROME</p>
                <p className="text-[9px] text-white/30 mt-1">1.3km grid · West-Europa</p>
                <span className="inline-block mt-2 text-[8px] bg-emerald-500/20 px-2 py-0.5 rounded-full text-emerald-300 font-bold uppercase">Live</span>
              </div>
              <div className="p-5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-center">
                <div className="w-12 h-12 rounded-full border-2 border-emerald-500/40 flex items-center justify-center mx-auto mb-3 text-emerald-400 text-[10px] font-black">API</div>
                <p className="text-xs font-black text-emerald-400 uppercase">Google Weather</p>
                <p className="text-[9px] text-white/30 mt-1">Google Maps Platform</p>
                <span className="inline-block mt-2 text-[8px] bg-emerald-500/20 px-2 py-0.5 rounded-full text-emerald-300 font-bold uppercase">Live</span>
              </div>
            </div>
          </div>

          <div className="text-center text-2xl text-white/10 mb-8">↓</div>

          {/* LAYER 2: GOOGLE DEEPMIND AI MODELS */}
          <div className="mb-12">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-6 text-center">Layer 2 — Google DeepMind AI Models</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
              <div className="p-5 rounded-xl border border-amber-500/30 bg-amber-500/5 text-center">
                <div className="w-12 h-12 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto mb-3 text-amber-400 text-[9px] font-black">AI</div>
                <p className="text-xs font-black text-amber-400 uppercase">WeatherNext 2</p>
                <p className="text-[9px] text-white/30 mt-1">Global medium-range · 1hr res</p>
                <p className="text-[8px] text-white/20 mt-1">Vertex AI · Ensemble FGN</p>
                <span className="inline-block mt-2 text-[8px] bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full text-amber-300/70 font-bold uppercase">Planned Q3</span>
              </div>
              <div className="p-5 rounded-xl border border-amber-500/30 bg-amber-500/5 text-center">
                <div className="w-12 h-12 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto mb-3 text-amber-400 text-[9px] font-black">AI</div>
                <p className="text-xs font-black text-amber-400 uppercase">MetNet-3</p>
                <p className="text-[9px] text-white/30 mt-1">Nowcast · 0-12hr neerslag</p>
                <p className="text-[8px] text-white/20 mt-1">Satellite + Radar fusion</p>
                <span className="inline-block mt-2 text-[8px] bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full text-amber-300/70 font-bold uppercase">Planned Q3</span>
              </div>
              <div className="p-5 rounded-xl border border-amber-500/30 bg-amber-500/5 text-center">
                <div className="w-12 h-12 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto mb-3 text-amber-400 text-[9px] font-black">AI</div>
                <p className="text-xs font-black text-amber-400 uppercase">SEED</p>
                <p className="text-[9px] text-white/30 mt-1">Probabilistic scenarios</p>
                <p className="text-[8px] text-white/20 mt-1">Diffusion-based ensemble</p>
                <span className="inline-block mt-2 text-[8px] bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full text-amber-300/70 font-bold uppercase">Research</span>
              </div>
              <div className="p-5 rounded-xl border border-amber-500/30 bg-amber-500/5 text-center">
                <div className="w-12 h-12 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto mb-3 text-amber-400 text-[9px] font-black">AI</div>
                <p className="text-xs font-black text-amber-400 uppercase">NeuralGCM</p>
                <p className="text-[9px] text-white/30 mt-1">Physics-hybrid · climate</p>
                <p className="text-[8px] text-white/20 mt-1">Open-source · long-range</p>
                <span className="inline-block mt-2 text-[8px] bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full text-amber-300/70 font-bold uppercase">Research</span>
              </div>
            </div>
          </div>

          <div className="text-center text-2xl text-white/10 mb-8">↓</div>

          {/* LAYER 3: PROCESSING PIPELINE */}
          <div className="flex flex-col md:flex-row items-center justify-around gap-8 text-center uppercase tracking-widest text-[10px] font-black">
            <div className="space-y-4">
              <div className="w-24 h-24 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center mx-auto text-purple-400">HERMES</div>
              <p>Truth Patrol</p>
              <p className="text-[8px] text-white/20 normal-case tracking-normal">Cross-valideert modellen<br/>Detecteert divergentie</p>
            </div>
            <div className="hidden md:block text-2xl opacity-20">→</div>
            <div className="space-y-4">
              <div className="w-20 h-20 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center mx-auto">CACHE</div>
              <p>Truth Registry</p>
              <p className="text-[8px] text-white/20 normal-case tracking-normal">Supabase wws_truth_cache<br/>TTL: 10 min</p>
            </div>
            <div className="hidden md:block text-2xl opacity-20">→</div>
            <div className="space-y-4">
              <div className="w-24 h-24 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center mx-auto text-blue-400">GEMINI</div>
              <p>Piet / Reed View</p>
              <p className="text-[8px] text-white/20 normal-case tracking-normal">Persona-interpretatie<br/>Gemini 3 Flash</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
