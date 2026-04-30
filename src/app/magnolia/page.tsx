'use client';

import { useState, useEffect } from 'react';

interface Activity {
  id: string;
  created_at: string;
  agent_name: string;
  action_type: string;
  description: string;
  metadata: any;
}

interface Portfolio {
  sol: number;
  usdc: number;
  wallet: string;
}

export default function MagnoliaDashboard() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchActivities = async () => {
    try {
      const res = await fetch('/api/magnolia');
      const data = await res.json();
      if (Array.isArray(data)) {
        setActivities(data);
      }
    } catch (err) {
      console.error('Failed to fetch activities:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPortfolio = async () => {
    try {
      const res = await fetch('/api/magnolia/balance');
      const data = await res.json();
      if (data && typeof data.sol === 'number') {
        setPortfolio(data);
      }
    } catch (err) {
      console.error('Failed to fetch portfolio:', err);
    }
  };

  useEffect(() => {
    fetchActivities();
    fetchPortfolio();
    const interval = setInterval(() => {
      fetchActivities();
      fetchPortfolio();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 font-mono">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 border-b border-zinc-800 pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              MAGNOLIA CRYPTO SYNDICATE
            </h1>
            <p className="text-zinc-500 mt-2 uppercase tracking-widest text-xs flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Supreme Command Center // 2026 Agentic DeFi
            </p>
          </div>
          <div className="text-left md:text-right bg-zinc-900/50 p-3 rounded-xl border border-zinc-800">
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Live Portfolio Vault</div>
            <div className="text-lg font-bold">
              {portfolio ? (
                <>
                  <span className="text-purple-400">{portfolio.sol.toFixed(4)} SOL</span>
                  <span className="text-zinc-500 mx-2">|</span>
                  <span className="text-green-400">{portfolio.usdc.toFixed(2)} USDC</span>
                </>
              ) : (
                <span className="text-zinc-600">Syncing to blockchain...</span>
              )}
            </div>
            {portfolio && (
              <div className="text-[9px] text-zinc-600 mt-1 truncate max-w-[200px] md:max-w-none">
                {portfolio.wallet}
              </div>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-purple-500/20 transition-all"></div>
            <h3 className="text-zinc-500 text-xs uppercase mb-1">Strategische Focus</h3>
            <p className="text-xl font-bold">Airdrop Dominance</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="bg-purple-900/30 text-purple-400 text-[10px] px-2 py-1 rounded border border-purple-800/50 shadow-[0_0_10px_rgba(168,85,247,0.2)]">JUPITER</span>
              <span className="bg-pink-900/30 text-pink-400 text-[10px] px-2 py-1 rounded border border-pink-800/50 shadow-[0_0_10px_rgba(236,72,153,0.2)]">KAMINO YIELD</span>
              <span className="bg-emerald-900/30 text-emerald-400 text-[10px] px-2 py-1 rounded border border-emerald-800/50">SANCTUM LST</span>
            </div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-purple-500/20 transition-all"></div>
            <h3 className="text-zinc-500 text-xs uppercase mb-1">Intelligence Engine</h3>
            <p className="text-xl font-bold">Gemini 3.1 Pro</p>
            <p className="text-purple-400 text-[10px] font-black uppercase tracking-widest mt-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse"></span>
              Autonomous Risk Adjustment & Yield Routing
            </p>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <h3 className="text-zinc-500 text-xs uppercase mb-1">Netwerk & Infra</h3>
              <p className="text-xl font-bold">Solana Mainnet</p>
            </div>
            <div className="flex items-center gap-2 mt-4 bg-black/50 p-2 rounded border border-zinc-800/50">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></div>
              <p className="text-zinc-400 text-[10px]">Helius RPC Connected</p>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-zinc-800 bg-zinc-900/80 flex justify-between items-center backdrop-blur-sm">
            <h2 className="font-bold uppercase text-sm tracking-widest text-zinc-300">Syndicaat Logboek</h2>
            {loading ? (
              <div className="text-[10px] text-zinc-500 animate-spin">⚡</div>
            ) : (
              <div className="text-[10px] text-green-500 font-bold bg-green-900/20 px-2 py-1 rounded">LIVE SYNC</div>
            )}
          </div>
          <div className="divide-y divide-zinc-800/50 max-h-[600px] overflow-y-auto custom-scrollbar">
            {activities.length === 0 && !loading ? (
              <div className="p-12 text-center text-zinc-600">Geen activiteit gevonden in de Weerzone DB.</div>
            ) : (
              activities.map((act) => (
                <div key={act.id} className="p-4 hover:bg-zinc-800/40 transition-all duration-300 group">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        act.agent_name === 'Magnolia' ? 'bg-purple-900/40 text-purple-300 border border-purple-700/50' : 
                        act.agent_name === 'Paperclip' ? 'bg-blue-900/40 text-blue-300 border border-blue-700/50' :
                        'bg-zinc-800 text-zinc-400'
                      }`}>
                        {act.agent_name}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-medium opacity-70 group-hover:opacity-100 transition-opacity">
                        {new Date(act.created_at).toLocaleString('nl-NL', { timeStyle: 'medium', dateStyle: 'short' })}
                      </span>
                    </div>
                    <span className={`text-[10px] uppercase tracking-widest font-semibold ${
                      act.action_type === 'yield_optimized' ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]' : 
                      act.action_type === 'yield_farming' ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]' : 
                      act.action_type === 'system_check' ? 'text-amber-400' : 'text-zinc-500'
                    }`}>
                      {act.action_type.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed font-medium">
                    {act.description}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <footer className="mt-16 text-center text-zinc-600 text-[10px] uppercase tracking-[0.2em] flex flex-col items-center justify-center gap-2">
          <div className="w-12 h-px bg-gradient-to-r from-transparent via-zinc-500 to-transparent"></div>
          Powered by Weerzone AI // Absolute Financial Sovereignty
        </footer>
      </div>
    </div>
  );
}
