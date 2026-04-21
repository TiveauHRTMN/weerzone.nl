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

  // Growth Engine: Fetch Data Vault status
  const { count: totalLeads } = await supabase
    .from("subscribers")
    .select("*", { count: "exact", head: true });

  const { count: leadsToday } = await supabase
    .from("subscribers")
    .select("*", { count: "exact", head: true })
    .gte("created_at", new Date(new Date().setHours(0,0,0,0)).toISOString());

  // Fetch Recent Subscribers
  const { data: recentLeads } = await supabase
    .from("subscribers")
    .select("email, city, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  const pipeValue = (totalLeads || 0) * 10; // €10 target per lead/mo

  const agents = [
    { name: "Hermes", role: "SEO & Spider Architect", status: "Active", color: "text-purple-400", bg: "bg-purple-400/10", mood: "Methodical", kpi: "Indexed Pages" },
    { name: "OpenClaw", role: "Data Harvester & Discovery", status: "Scanning", color: "text-blue-400", bg: "bg-blue-400/10", mood: "Autonomous", kpi: "New Records" },
    { name: "Paperclip", role: "Revenue & Yield Optimizer", status: "Optimizing", color: "text-emerald-400", bg: "bg-emerald-400/10", mood: "Efficient", kpi: "CPM / CTR" },
    { name: "Sentinel", role: "Safety & Trigger Engine", status: "Monitoring", color: "text-red-400", bg: "bg-red-400/10", mood: "Alert", kpi: "Events Fired" }
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-white p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">Agent Cockpit</h1>
            <p className="text-white/40 text-sm font-medium tracking-widest uppercase">Management dashboard voor AI-medewerkers</p>
          </div>
          <Link href="/admin" className="text-xs font-black px-4 py-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all uppercase tracking-widest">
            ← Dashboard
          </Link>
        </header>

        {/* GROWTH ENGINE: DATA VAULT */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
           <div className="bg-gradient-to-br from-accent-cyan/20 to-transparent border border-accent-cyan/30 p-8 rounded-[40px] backdrop-blur-xl">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-cyan mb-4">Lead Vault (Data Capital)</h3>
              <div className="text-6xl font-black tracking-tighter mb-1">{totalLeads || 0}</div>
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Total Active Emails</p>
           </div>
           <div className="bg-white/5 border border-white/10 p-8 rounded-[40px] backdrop-blur-xl">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-4">Daily Velocity</h3>
              <div className="text-5xl font-black tracking-tighter mb-1">+{leadsToday || 0}</div>
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest text-accent-green">New Leads Today</p>
           </div>
           <div className="bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 p-8 rounded-[40px] backdrop-blur-xl border-dashed">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-4">Pipeline Value (Est. June)</h3>
              <div className="text-5xl font-black tracking-tighter mb-1">€{pipeValue.toLocaleString()} <span className="text-xl text-white/20">/mo</span></div>
              <p className="text-xs font-bold text-emerald-400/40 uppercase tracking-widest">Projected MRR</p>
           </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* RECENT LEADS TABLE */}
            <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-[40px] p-8 backdrop-blur-2xl">
                <h2 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full" />
                    Recent Leads Content
                </h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] uppercase font-black tracking-widest text-white/20 border-b border-white/5">
                                <th className="pb-4 px-2">Email Hash / Address</th>
                                <th className="pb-4 px-2">City Focus</th>
                                <th className="pb-4 px-2">Acquired</th>
                            </tr>
                        </thead>
                        <tbody className="text-xs">
                            {recentLeads?.map((lead, i) => (
                                <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                    <td className="py-4 px-2 font-bold text-white/80">{lead.email}</td>
                                    <td className="py-4 px-2 uppercase tracking-widest text-white/40">{lead.city}</td>
                                    <td className="py-4 px-2 text-white/20 italic">{new Date(lead.created_at).toLocaleDateString()}</td>
                                </tr>
                            ))}
                            {(!recentLeads || recentLeads.length === 0) && (
                                <tr>
                                    <td colSpan={3} className="py-20 text-center text-white/10 italic">Geen recente data in de kluis.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* QUICK STATS / INSIGHTS */}
            <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 backdrop-blur-2xl">
                <h2 className="text-sm font-black uppercase tracking-widest mb-6">Founder Intelligence</h2>
                <div className="space-y-6">
                    <div className="p-4 rounded-3xl bg-accent-cyan/10 border border-accent-cyan/20">
                        <p className="text-[10px] font-black uppercase text-accent-cyan mb-1">Most Profitable Region</p>
                        <p className="text-lg font-black">{recentLeads?.[0]?.city || "N/A"}</p>
                    </div>
                    <div className="p-4 rounded-3xl bg-white/5 border border-white/10">
                        <p className="text-[10px] font-black uppercase text-white/30 mb-1">Lead Conversion Rate</p>
                        <p className="text-lg font-black">2.4% <span className="text-[10px] text-accent-green text-normal lowercase ml-1">avg baseline</span></p>
                    </div>
                </div>
            </div>
        </div>

        {/* AGENT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-12">
          {agents.map((agent) => (
            <div key={agent.name} className={`p-8 rounded-[32px] border border-white/5 ${agent.bg} backdrop-blur-xl relative overflow-hidden group hover:border-white/20 transition-all duration-500`}>
              <div className="absolute top-0 right-0 p-8">
                <div className={`w-3 h-3 rounded-full ${agent.status === "Active" || agent.status === "Monitoring" ? "bg-green-400 animate-pulse" : "bg-white/20"}`} />
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

        {/* ACTIVITY LOG */}
        <div className="bg-white/5 border border-white/10 rounded-[40px] p-10 backdrop-blur-2xl">
          <h2 className="text-xl font-bold mb-8 flex items-center gap-3">
            <span className="w-2 h-2 bg-accent-cyan rounded-full animate-ping" />
            Live Activity Feed
          </h2>
          
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-white/10">
            {logs?.map((log) => (
              <div key={log.id} className="group p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all flex items-start gap-6">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-xs font-bold group-hover:scale-110 transition-transform">
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
