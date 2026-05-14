import { Metadata } from "next";
import { getSupabase } from "@/lib/supabase";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Agent Cockpit | WEERZONE Founder",
};

export const dynamic = "force-dynamic";

export default async function AgentCockpit() {
  const supabase = getSupabase();
  
  if (!supabase) {
    return <div className="p-20 text-center text-white/50 uppercase font-black tracking-widest">Supabase niet geconfigureerd.</div>;
  }

  // Fetch Logs
  const { data: logs } = await supabase
    .from("agent_activity")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  // Fetch WWS Patrol Logs (The new Truth logs)
  const { data: patrolLogs } = await supabase
    .from("wws_patrol_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  // Fetch WWS Truth Cache Stats
  const { data: truthStats } = await supabase
    .from("wws_truth_cache")
    .select("id, sector, consensus_index, is_alert, place_name, created_at");

  const publicTruths = truthStats?.filter(t => t.sector === 'public') || [];
  const businessTruths = truthStats?.filter(t => t.sector === 'business') || [];
  const avgConsensus = publicTruths.length > 0 
    ? Math.round(publicTruths.reduce((acc, curr) => acc + (curr.consensus_index || 0), 0) / publicTruths.length)
    : 0;
  const activeAlerts = truthStats?.filter(t => t.is_alert).length || 0;

  // Growth Engine: Fetch Data Vault status
  const { count: totalLeads } = await supabase
    .from("subscribers")
    .select("*", { count: "exact", head: true });

  const { count: leadsToday } = await supabase
    .from("subscribers")
    .select("*", { count: "exact", head: true })
    .gte("created_at", new Date(new Date().setHours(0,0,0,0)).toISOString());

  const arpuEstimate = 7.50; 
  const pipeValue = (totalLeads || 0) * arpuEstimate;

  const agents = [
    { name: "Hermes", role: "WWS Truth Messenger", status: "Patrolling", color: "text-purple-400", bg: "bg-purple-400/10", mood: "Precise", kpi: "GPS Truths" },
    { name: "Steve", role: "Business Strategist", status: "Monitoring", color: "text-amber-400", bg: "bg-amber-400/10", mood: "Conservative", kpi: "Operational ROI" },
    { name: "OpenClaw", role: "Data Harvester", status: "Scanning", color: "text-blue-400", bg: "bg-blue-400/10", mood: "Autonomous", kpi: "New Records" },
    { name: "Paperclip", role: "Revenue Optimizer", status: "Optimizing", color: "text-emerald-400", bg: "bg-emerald-400/10", mood: "Efficient", kpi: "CPM / CTR" },
    { name: "Sentinel", role: "Safety Engine", status: "Alert", color: "text-red-400", bg: "bg-red-400/10", mood: "Monitoring", kpi: "Events Fired" }
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-white p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">Agent Cockpit</h1>
            <p className="text-white/40 text-sm font-medium tracking-widest uppercase">Management dashboard voor AI-medewerkers</p>
          </div>
          <div className="flex gap-4">
            <Link href="/admin/architect" className="text-xs font-black px-4 py-2 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-full hover:bg-purple-500/20 transition-all uppercase tracking-widest">
              Architect Mode
            </Link>
            <Link href="/admin/b2b" className="text-xs font-black px-4 py-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all uppercase tracking-widest">
              B2B Assets
            </Link>
            <Link href="/admin" className="text-xs font-black px-4 py-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all uppercase tracking-widest">
              ← Dashboard
            </Link>
          </div>
        </header>

        {/* WWS METEOROLOGICAL TRUTH STATUS */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
           <div className="bg-gradient-to-br from-purple-500/20 to-transparent border border-purple-500/30 p-8 rounded-[40px] backdrop-blur-xl">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400 mb-4">WWS GPS Coverage</h3>
              <div className="text-6xl font-black tracking-tighter mb-1">{truthStats?.length || 0}</div>
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Cached Truth Points</p>
           </div>
           <div className="bg-white/5 border border-white/10 p-8 rounded-[40px] backdrop-blur-xl">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-4">Avg Model Consensus</h3>
              <div className="text-5xl font-black tracking-tighter mb-1">{avgConsensus}%</div>
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">High Agreement</p>
           </div>
           <div className="bg-white/5 border border-white/10 p-8 rounded-[40px] backdrop-blur-xl">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-4">Business NO-GOs</h3>
              <div className="text-5xl font-black tracking-tighter mb-1 text-amber-400">{businessTruths.filter(t => t.is_alert).length}</div>
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Operational Alerts</p>
           </div>
           <div className="bg-gradient-to-br from-rose-500/10 to-transparent border border-rose-500/20 p-8 rounded-[40px] backdrop-blur-xl">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 mb-4">Extreme Alerts</h3>
              <div className="text-5xl font-black tracking-tighter mb-1 text-rose-500">{activeAlerts}</div>
              <p className="text-xs font-bold text-rose-500/40 uppercase tracking-widest">Active Reed Events</p>
           </div>
        </section>

        {/* AGENT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-12">
          {agents.map((agent) => (
            <div key={agent.name} className={`p-8 rounded-[32px] border border-white/5 ${agent.bg} backdrop-blur-xl relative overflow-hidden group hover:border-white/20 transition-all duration-500`}>
              <div className="absolute top-0 right-0 p-8">
                <div className={`w-3 h-3 rounded-full ${agent.status !== "Offline" ? "bg-green-400 animate-pulse" : "bg-white/20"}`} />
              </div>
              <div className={`text-4xl font-black mb-1 ${agent.color}`}>{agent.name}</div>
              <div className="text-xs font-bold uppercase tracking-widest text-white/50 mb-6">{agent.role}</div>
              
              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-[0.1em]">
                  <span className="text-white/30">Focus KPI</span>
                  <span className="text-white font-black">{agent.kpi}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-[0.1em]">
                  <span className="text-white/30">Status</span>
                  <span className={agent.color}>{agent.status}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-[0.1em]">
                  <span className="text-white/30">Mode</span>
                  <span className="text-white/70">{agent.mood}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* HERMES PATROL LOG */}
            <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 backdrop-blur-2xl">
                <h2 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                    Hermes: Truth Patrol Log
                </h2>
                <div className="space-y-4">
                    {patrolLogs?.map((log, i) => (
                        <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex justify-between items-center">
                            <div>
                                <p className="text-[10px] font-black uppercase text-purple-400 mb-0.5">{log.action}</p>
                                <p className="text-xs font-bold text-white/80">{log.meta?.place || "System"}</p>
                            </div>
                            <div className="text-right">
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded ${log.status === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                    {log.status.toUpperCase()}
                                </span>
                                <p className="text-[9px] text-white/20 mt-1">{new Date(log.created_at).toLocaleTimeString()}</p>
                            </div>
                        </div>
                    ))}
                    {(!patrolLogs || patrolLogs.length === 0) && (
                        <p className="text-xs text-white/20 italic p-10 text-center">Hermes is momenteel niet op patrouille.</p>
                    )}
                </div>
            </div>

            {/* STEVE BUSINESS MONITORING */}
            <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 backdrop-blur-2xl">
                <h2 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                    <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                    Steve: Asset Monitoring
                </h2>
                <div className="space-y-4">
                    {businessTruths.slice(0, 5).map((truth, i) => (
                        <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex justify-between items-center">
                            <div>
                                <p className="text-xs font-bold text-white/80">{(truth as {place_name?: string}).place_name ?? "—"}</p>
                                <p className="text-[9px] text-white/40 uppercase tracking-widest">ID: {(truth.id as string).slice(0,8)}</p>
                            </div>
                            <div className="text-right">
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded ${truth.is_alert ? 'bg-rose-500 text-white' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                    {truth.is_alert ? 'NO-GO' : 'GO'}
                                </span>
                                <p className="text-[9px] text-white/20 mt-1">Updated {new Date(truth.created_at).toLocaleTimeString()}</p>
                            </div>
                        </div>
                    ))}
                    {businessTruths.length === 0 && (
                        <div className="p-10 text-center">
                            <p className="text-xs text-white/20 italic mb-4">Steve heeft nog geen zakelijke assets geanalyseerd.</p>
                            <Link href="/admin/b2b" className="text-[10px] font-black text-amber-400 uppercase tracking-widest border border-amber-400/30 px-4 py-2 rounded-full">
                                Voeg Asset Toe
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* ACTIVITY LOG (GENERIC) */}
        <div className="bg-white/5 border border-white/10 rounded-[40px] p-10 backdrop-blur-2xl">
          <h2 className="text-xl font-bold mb-8 flex items-center gap-3">
            <span className="w-2 h-2 bg-accent-cyan rounded-full animate-ping" />
            Live Activity Feed
          </h2>
          
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-white/10">
            {logs?.map((log) => (
              <div key={log.id} className="group p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all flex items-start gap-6">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-xs font-bold group-hover:scale-110 transition-transform uppercase">
                  {log.agent_name[0]}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-black uppercase tracking-widest text-white/40">{log.agent_name}</span>
                    <span className="text-[10px] text-white/20 font-mono italic">
                      {new Date(log.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-white/80">{log.description}</p>
                  {log.metadata && (
                    <div className="mt-3 text-[10px] text-white/40 bg-black/40 p-3 rounded-lg font-mono overflow-hidden">
                      {JSON.stringify(log.metadata)}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {(!logs || logs.length === 0) && (
              <div className="text-center py-20 text-white/20 uppercase font-black tracking-widest text-xs">
                Wachten op de eerste acties van je medewerkers...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
