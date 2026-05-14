
"use client";

import { useState } from "react";
import { Zap, Target, Search, Mail, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function OutreachControl() {
  const [isRunning, setIsRunning] = useState(false);
  const [log, setLog] = useState<any[]>([]);
  const [status, setStatus] = useState<"idle" | "running" | "success" | "error">("idle");

  const runHunter = async () => {
    setIsRunning(true);
    setStatus("running");
    setLog([{ msg: "Starting Autonomous Hunter Cycle...", type: "system" }]);

    try {
      // We gebruiken de API route die ik zojuist heb gemaakt
      const res = await fetch("/api/cron/b2b-hunter", {
        headers: {
          "Authorization": `Bearer weerzone-cron-2026-djaelito` // Secret uit env
        }
      });
      const data = await res.json();

      if (data.status === "Hunter Cycle Complete") {
        setLog(prev => [
            ...prev,
            { msg: `Scanned ${data.summary.scanned} cities.`, type: "info" },
            { msg: `Found ${data.summary.hotspotsFound} weather hotspots.`, type: "success" },
            { msg: `Generated ${data.summary.leadsGenerated} high-intent leads.`, type: "success" },
            { msg: `Sent ${data.summary.emailsSent} autonomous outreach emails.`, type: "income" }
        ]);
        setStatus("success");
      } else {
        throw new Error(data.error || "Unknown error");
      }
    } catch (err: any) {
      setLog(prev => [...prev, { msg: `Engine failure: ${err.message}`, type: "error" }]);
      setStatus("error");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 font-manrope">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">B2B Ignite <span className="text-accent-cyan">v2.0</span></h1>
                <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Autonomous Lead Acquisition & Outreach Engine</p>
            </div>
            <div className={`px-4 py-2 rounded-full border ${status === 'running' ? 'border-accent-cyan bg-accent-cyan/10 animate-pulse' : 'border-white/10 bg-white/5'}`}>
                <span className="text-[10px] font-black uppercase tracking-widest">
                    {status === 'running' ? 'Engine Hot' : 'Engine Standby'}
                </span>
            </div>
        </div>

        {/* MAIN ACTION */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-slate-900/50 border border-white/10 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-xl font-black mb-4">Start Autonomous Acquisition</h2>
                    <p className="text-white/60 text-sm mb-8 leading-relaxed">
                        De engine scant de weersverwachting voor de 20 grootste regio's in Nederland. 
                        Bij storm, hitte of vorst worden met de <strong>Google Places API</strong> direct 
                        relevante bedrijven (horeca, dakdekkers, hoveniers) gezocht en ge-e-maild.
                    </p>
                    
                    <button 
                        onClick={runHunter}
                        disabled={isRunning}
                        className={`group relative flex items-center gap-3 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all ${
                            isRunning ? 'bg-slate-800 text-white/40 cursor-not-allowed' : 'bg-accent-cyan text-slate-950 hover:scale-[1.02] active:scale-95 shadow-[0_0_30px_rgba(34,211,238,0.3)]'
                        }`}
                    >
                        {isRunning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 fill-current" />}
                        {isRunning ? 'Hunter is Hunting...' : 'Ignite Engine'}
                    </button>
                </div>
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Target className="w-48 h-48" />
                </div>
            </div>

            <div className="bg-slate-900/50 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
                <h3 className="text-xs font-black uppercase tracking-widest text-white/40 mb-4">Engine Metrics</h3>
                <div className="space-y-4">
                    <Metric mini label="Targeting" value="NL-WIDE" />
                    <Metric mini label="API State" value="READY" />
                    <Metric mini label="Ethical Filter" value="ON" />
                    <Metric mini label="Steve Priority" value="MAX" />
                </div>
            </div>
        </div>

        {/* OUTPUT LOG */}
        <div className="bg-black/50 border border-white/5 rounded-3xl p-6 font-mono text-[11px] min-h-[300px]">
             <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
                 <div className="w-2 h-2 rounded-full bg-accent-cyan" />
                 <span className="text-white/40 uppercase font-black">Process Log Output</span>
             </div>
             <div className="space-y-2">
                {log.length === 0 && <p className="text-white/20 italic">Wachten op initiatie...</p>}
                {log.map((l, i) => (
                    <div key={i} className="flex gap-3">
                        <span className="text-white/20">[{new Date().toLocaleTimeString()}]</span>
                        <span className={
                            l.type === 'error' ? 'text-red-400' : 
                            l.type === 'success' ? 'text-accent-green' : 
                            l.type === 'income' ? 'text-accent-cyan font-bold' : 
                            'text-white/60'
                        }>
                            {l.msg}
                        </span>
                    </div>
                ))}
            </div>
        </div>

      </div>
    </div>
  );
}

function Metric({ label, value, mini }: any) {
    return (
        <div className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-white/30">{label}</span>
            <span className="text-xs font-black text-white/80">{value}</span>
        </div>
    )
}
