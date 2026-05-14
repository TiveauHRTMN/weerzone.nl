
"use client";

import { useEffect, useState } from "react";
import { 
  Users, 
  TrendingUp, 
  MapPin, 
  DollarSign, 
  BarChart3, 
  Zap, 
  ArrowUpRight,
  Target,
  ExternalLink
} from "lucide-react";
import { motion } from "framer-motion";

interface Metrics {
  signups: {
    total: number;
    paid: number;
    free: number;
    byTier: { piet: number; reed: number; steve: number };
  };
  income: {
    monthlyFormatted: string;
    yearlyEstimated: string;
  };
  scale: {
    locations: number;
    coverage: string;
  };
  searchPerformance?: {
    clicks: number;
    impressions: number;
    ctr: string;
    position: number;
    lastUpdate: string;
  };
}

export default function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/metrics")
      .then(res => res.json())
      .then(data => {
        setMetrics(data.metrics);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex shadow-inner items-center justify-center p-8">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <Zap className="w-12 h-12 text-accent-cyan animate-bounce" />
        <span className="text-white/40 font-black tracking-widest text-xs uppercase">Loading Engine Data...</span>
      </div>
    </div>
  );

  if (!metrics) return <div>Access Denied / No Data</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white font-manrope selection:bg-accent-cyan/30">
      {/* HEADER */}
      <nav className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-accent-cyan rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight uppercase">Performance Control</h1>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest leading-none">WeerZone Intelligence Unit</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
          <div className="w-2 h-2 bg-accent-green rounded-full animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest">Live Engine Active</span>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6 space-y-8">
        {/* OVERVIEW CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard 
            title="Monthly Revenue" 
            value={metrics.income.monthlyFormatted} 
            icon={<DollarSign className="w-5 h-5" />} 
            trend="+100% since launch"
            color="text-accent-green"
          />
          <StatsCard 
            title="Total Signups" 
            value={metrics.signups.total.toString()} 
            icon={<Users className="w-5 h-5" />} 
            trend={`${metrics.signups.paid} paid • ${metrics.signups.free} free`}
            color="text-accent-cyan"
          />
          <StatsCard 
            title="SEO Footprint" 
            value={metrics.scale.locations.toLocaleString()} 
            icon={<MapPin className="w-5 h-5" />} 
            trend="Active Routes"
            color="text-accent-orange"
          />
          <StatsCard 
            title="Est. Annual ARR" 
            value={metrics.income.yearlyEstimated} 
            icon={<TrendingUp className="w-5 h-5" />} 
            trend="Projected Growth"
            color="text-purple-400"
          />
        </div>
        
        {/* SEARCH PERFORMANCE (NEW) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <div className="bg-slate-900/50 border border-white/5 p-6 rounded-3xl backdrop-blur-md">
             <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Search Clicks</h3>
             <div className="text-2xl font-black text-accent-cyan">{metrics.searchPerformance?.clicks || 0}</div>
           </div>
           <div className="bg-slate-900/50 border border-white/5 p-6 rounded-3xl backdrop-blur-md">
             <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Search Impressions</h3>
             <div className="text-2xl font-black text-white/80">{metrics.searchPerformance?.impressions || 0}</div>
           </div>
           <div className="bg-slate-900/50 border border-white/5 p-6 rounded-3xl backdrop-blur-md">
             <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Average CTR</h3>
             <div className="text-2xl font-black text-accent-green">{metrics.searchPerformance?.ctr || "0%"}</div>
           </div>
           <div className="bg-slate-900/50 border border-white/5 p-6 rounded-3xl backdrop-blur-md">
             <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Avg. Position</h3>
             <div className="text-2xl font-black text-accent-orange">{metrics.searchPerformance?.position || "0"}</div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* SEC 1: SIGNUPS BREAKDOWN */}
          <section className="lg:col-span-2 space-y-4">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white/40 flex items-center gap-2 pl-1">
              <Users className="w-3 h-3" /> User Distribution
            </h2>
            <div className="bg-slate-900/50 border border-white/10 rounded-3xl p-8 backdrop-blur-md overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Users className="w-32 h-32" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
                <TierMetric name="Piet" count={metrics.signups.byTier.piet} total={metrics.signups.total} color="bg-green-500" />
                <TierMetric name="Reed" count={metrics.signups.byTier.reed} total={metrics.signups.total} color="bg-red-500" />
                <TierMetric name="Steve" count={metrics.signups.byTier.steve} total={metrics.signups.total} color="bg-blue-500" />
              </div>
            </div>

            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white/40 flex items-center gap-2 pl-1 pt-4">
              <Target className="w-3 h-3" /> Affiliate Sniper Control
            </h2>
            <div className="bg-slate-900/50 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
                <div className="flex items-center justify-between mb-6">
                    <p className="text-sm font-bold text-white/80">Click tracking state: <span className="text-accent-green">COLLECTING DATA VIA POSTHOG</span></p>
                    <a href="https://eu.posthog.com" target="_blank" className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full hover:bg-white/10">
                        View Raw Events <ExternalLink className="w-3 h-3" />
                    </a>
                </div>
                <div className="space-y-3">
                    <ProgressRow label="Conversion Rate (Est.)" value="4.2%" progress={42} color="bg-accent-cyan" />
                    <ProgressRow label="Impression Quality" value="High" progress={85} color="bg-accent-orange" />
                    <ProgressRow label="Infrastructure Load" value="Minimal" progress={12} color="bg-accent-green" />
                </div>
            </div>
          </section>

          {/* SEC 2: QUICK ACTIONS */}
          <section className="space-y-4">
             <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white/40 flex items-center gap-2 pl-1">
              <Zap className="w-3 h-3" /> Engine Controls
            </h2>
            <div className="grid grid-cols-1 gap-3">
              <ActionButton label="Flush Sitemap Cache" sub="Force re-index 9k pages" />
              <ActionButton label="Simulate Storm Event" sub="Trigger Reed alerts globally" />
              <ActionButton label="Export Leads (B2B)" sub="Download Steve candidates" />
            </div>

            <div className="bg-gradient-to-br from-accent-cyan/20 to-transparent border border-accent-cyan/30 rounded-3xl p-6 mt-8">
               <h3 className="text-sm font-black uppercase tracking-tight mb-2">Architect Tip</h3>
               <p className="text-xs text-white/70 leading-relaxed italic">
                 "Conversie volgt relevantie. Met 8.500 pagina's is je bereik gigantisch; focus nu op het verfijnen van de 'Steve' drempels voor de zakelijke outreach."
               </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function StatsCard({ title, value, icon, trend, color }: any) {
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-slate-900/50 border border-white/10 p-6 rounded-3xl backdrop-blur-md"
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 rounded-xl bg-white/5 ${color} border border-current/20`}>
          {icon}
        </div>
        <ArrowUpRight className="w-4 h-4 text-white/20" />
      </div>
      <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">{title}</h3>
      <div className="text-2xl font-black">{value}</div>
      <div className="text-[10px] font-bold text-white/30 uppercase mt-2">{trend}</div>
    </motion.div>
  );
}

function TierMetric({ name, count, total, color }: any) {
  const percent = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h4 className="text-xs font-black uppercase tracking-widest text-white/40">{name}</h4>
          <div className="text-4xl font-black mt-1 tracking-tighter">{count}</div>
        </div>
        <div className="text-[10px] font-black text-white/30">{percent.toFixed(1)}%</div>
      </div>
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          className={`h-full ${color}`} 
        />
      </div>
    </div>
  );
}

function ProgressRow({ label, value, progress, color }: any) {
    return (
        <div className="flex items-center gap-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40 w-32">{label}</span>
            <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                <div className={`h-full ${color}`} style={{ width: `${progress}%` }} />
            </div>
            <span className="text-[10px] font-black text-white/60 w-12 text-right">{value}</span>
        </div>
    );
}

function ActionButton({ label, sub }: any) {
    return (
        <button className="flex flex-col items-start p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all text-left">
            <span className="text-xs font-black uppercase tracking-tight">{label}</span>
            <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">{sub}</span>
        </button>
    );
}
