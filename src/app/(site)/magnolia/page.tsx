'use client';

import { useEffect, useMemo, useState } from 'react';
import { ActivityIcon, BrainCircuit, Database, RefreshCw, ShieldCheck, WalletCards } from 'lucide-react';

interface Activity {
  id: string;
  created_at: string;
  agent_name: string;
  action_type: string;
  description: string;
  metadata: Record<string, unknown> | null;
}

interface Position {
  symbol: string;
  balance: number;
  priceUsd: number;
  valueUsd: number;
}

interface Portfolio {
  sol: number;
  usdc: number;
  wallet: string;
  portfolioUsd: number;
  solUsd: number;
  positions: Position[];
  timestamp: string;
}

function formatUsd(value = 0, digits = 2) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function formatNumber(value = 0, digits = 4) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(value);
}

export default function MagnoliaDashboard() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchActivities = async () => {
    const res = await fetch('/api/magnolia', { cache: 'no-store' });
    const data = await res.json();
    if (Array.isArray(data)) setActivities(data);
  };

  const fetchPortfolio = async () => {
    const res = await fetch('/api/magnolia/balance', { cache: 'no-store' });
    const data = await res.json();
    if (data && typeof data.portfolioUsd === 'number') setPortfolio(data);
  };

  const refresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchActivities(), fetchPortfolio()]);
    } catch (err) {
      console.error('Failed to refresh Magnolia dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
  }, []);

  const latestSystemCheck = useMemo(
    () => activities.find((activity) => activity.action_type === 'system_check'),
    [activities],
  );

  const jlpPosition = portfolio?.positions.find((position) => position.symbol === 'JLP');
  const jitoPosition = portfolio?.positions.find((position) => position.symbol === 'JitoSOL');
  const totalValue = portfolio?.portfolioUsd || 0;

  return (
    <div className="min-h-screen bg-[#07090d] text-zinc-100">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
        <header className="mb-8 flex flex-col gap-5 border-b border-zinc-800 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-400">
              Magnolia Oracle
            </p>
            <h1 className="text-3xl font-black tracking-tight text-white md:text-5xl">
              USD Command Center
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
              Guardian, Banker, Farmer en Hermes draaien op USD-waardering. Oracle krijgt elke dag rond 09:00 een verse run.
            </p>
          </div>

          <button
            type="button"
            onClick={refresh}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-zinc-700 bg-zinc-900 px-4 text-sm font-semibold text-zinc-100 hover:border-emerald-500 hover:text-emerald-300"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Sync
          </button>
        </header>

        <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5">
            <div className="mb-4 flex items-center justify-between text-zinc-500">
              <span className="text-xs font-semibold uppercase tracking-widest">Portfolio</span>
              <WalletCards className="h-4 w-4" />
            </div>
            <div className="text-3xl font-black text-white">
              {portfolio ? formatUsd(portfolio.portfolioUsd) : '...'}
            </div>
            <p className="mt-2 text-xs text-zinc-500">Canonical valuation in USD</p>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5">
            <div className="mb-4 flex items-center justify-between text-zinc-500">
              <span className="text-xs font-semibold uppercase tracking-widest">SOL</span>
              <ActivityIcon className="h-4 w-4" />
            </div>
            <div className="text-3xl font-black text-white">
              {portfolio ? formatUsd(portfolio.solUsd) : '...'}
            </div>
            <p className="mt-2 text-xs text-zinc-500">{portfolio ? `${formatNumber(portfolio.sol, 6)} SOL reserve` : 'Loading reserve'}</p>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5">
            <div className="mb-4 flex items-center justify-between text-zinc-500">
              <span className="text-xs font-semibold uppercase tracking-widest">Carry</span>
              <Database className="h-4 w-4" />
            </div>
            <div className="text-3xl font-black text-white">
              {jlpPosition && totalValue ? `${((jlpPosition.valueUsd / totalValue) * 100).toFixed(1)}%` : '...'}
            </div>
            <p className="mt-2 text-xs text-zinc-500">JLP allocation</p>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5">
            <div className="mb-4 flex items-center justify-between text-zinc-500">
              <span className="text-xs font-semibold uppercase tracking-widest">Policy</span>
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="text-3xl font-black text-emerald-300">USD</div>
            <p className="mt-2 text-xs text-zinc-500">Single valuation layer</p>
          </div>
        </section>

        <section className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-lg border border-zinc-800 bg-zinc-950">
            <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
              <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-300">Portfolio Positions</h2>
              <span className="text-xs text-zinc-500">{portfolio ? new Date(portfolio.timestamp).toLocaleTimeString('nl-NL') : 'syncing'}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-widest text-zinc-500">
                  <tr className="border-b border-zinc-800">
                    <th className="px-5 py-3 text-left">Asset</th>
                    <th className="px-5 py-3 text-right">Balance</th>
                    <th className="px-5 py-3 text-right">Price</th>
                    <th className="px-5 py-3 text-right">Value</th>
                    <th className="px-5 py-3 text-right">Alloc.</th>
                  </tr>
                </thead>
                <tbody>
                  {(portfolio?.positions || []).map((position) => (
                    <tr key={position.symbol} className="border-b border-zinc-900 last:border-0">
                      <td className="px-5 py-4 font-semibold text-white">{position.symbol}</td>
                      <td className="px-5 py-4 text-right text-zinc-300">{formatNumber(position.balance, 6)}</td>
                      <td className="px-5 py-4 text-right text-zinc-300">{formatUsd(position.priceUsd, position.priceUsd < 2 ? 4 : 2)}</td>
                      <td className="px-5 py-4 text-right font-semibold text-white">{formatUsd(position.valueUsd)}</td>
                      <td className="px-5 py-4 text-right text-zinc-300">
                        {totalValue ? `${((position.valueUsd / totalValue) * 100).toFixed(1)}%` : '0.0%'}
                      </td>
                    </tr>
                  ))}
                  {!portfolio && (
                    <tr>
                      <td className="px-5 py-8 text-zinc-500" colSpan={5}>Portfolio sync loopt...</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5">
            <div className="mb-5 flex items-center gap-3">
              <BrainCircuit className="h-5 w-5 text-emerald-300" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-300">Current Runtime</h2>
            </div>
            <div className="space-y-4 text-sm text-zinc-300">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <span className="text-zinc-500">Oracle</span>
                <span className="font-semibold text-white">09:00 daily gate</span>
              </div>
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <span className="text-zinc-500">Hermes runtime</span>
                <span className="font-semibold text-white">Hermes 4 / fallback Pro</span>
              </div>
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <span className="text-zinc-500">Primary carry</span>
                <span className="font-semibold text-white">{jlpPosition ? `${formatUsd(jlpPosition.valueUsd)} JLP` : 'JLP'}</span>
              </div>
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <span className="text-zinc-500">Staking leg</span>
                <span className="font-semibold text-white">{jitoPosition ? `${formatUsd(jitoPosition.valueUsd)} JitoSOL` : 'JitoSOL'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Latest system note</span>
                <span className="max-w-[260px] truncate text-right font-semibold text-white">
                  {latestSystemCheck?.description || 'Waiting for agent_activity'}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-zinc-800 bg-zinc-950">
          <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-300">Oracle Logboek</h2>
            {loading ? (
              <span className="text-xs text-zinc-500">Loading</span>
            ) : (
              <span className="rounded bg-emerald-950 px-2 py-1 text-xs font-bold text-emerald-300">LIVE SYNC</span>
            )}
          </div>
          <div className="max-h-[620px] divide-y divide-zinc-900 overflow-y-auto">
            {activities.length === 0 && !loading ? (
              <div className="p-10 text-center text-sm text-zinc-500">Geen activiteit gevonden in de Weerzone DB.</div>
            ) : (
              activities.map((activity) => (
                <div key={activity.id} className="grid gap-3 px-5 py-4 md:grid-cols-[160px_1fr_160px]">
                  <div>
                    <span className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs font-bold uppercase text-zinc-200">
                      {activity.agent_name}
                    </span>
                  </div>
                  <p className="text-sm leading-6 text-zinc-300">{activity.description}</p>
                  <div className="text-left text-xs uppercase tracking-widest text-zinc-500 md:text-right">
                    <div className="font-semibold text-zinc-400">{activity.action_type.replaceAll('_', ' ')}</div>
                    <div className="mt-1 normal-case tracking-normal">
                      {new Date(activity.created_at).toLocaleString('nl-NL', { timeStyle: 'short', dateStyle: 'short' })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
