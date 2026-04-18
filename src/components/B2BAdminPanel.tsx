"use client";

import { useState } from "react";
import type { B2BIndustry } from "@/lib/b2b-emails";

const INDUSTRIES: { value: B2BIndustry; label: string }[] = [
  { value: "glazenwasser",     label: "Glazenwassers" },
  { value: "bouw",             label: "Bouw & Infra" },
  { value: "horeca",           label: "Horeca & Terrassen" },
  { value: "evenementen",      label: "Evenementen" },
  { value: "agrarisch",        label: "Agrarisch" },
  { value: "transport",        label: "Transport & Logistiek" },
  { value: "sport",            label: "Sportverenigingen" },
  { value: "schoonmaak",       label: "Schoonmaak" },
  { value: "schildersbedrijf", label: "Schildersbedrijven" },
  { value: "dakdekker",        label: "Dakdekkers" },
  { value: "tuinonderhoud",    label: "Hoveniers" },
  { value: "bezorging",        label: "Bezorging" },
];

interface Lead {
  id: string;
  business_name: string;
  email: string;
  city: string | null;
  industry: string;
  phone: string | null;
  status: string;
  outreach_count: number;
  source: string;
  created_at: string;
}

interface Stats {
  total: number;
  new: number;
  emailed: number;
  subscribed: number;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    new:          "bg-blue-500/20 text-blue-300 border-blue-500/20",
    emailed:      "bg-amber-500/20 text-amber-300 border-amber-500/20",
    subscribed:   "bg-green-500/20 text-green-300 border-green-500/20",
    unsubscribed: "bg-red-500/20 text-red-400 border-red-500/20",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${map[status] ?? "bg-white/10 text-white/50 border-white/10"}`}>
      {status}
    </span>
  );
}

export default function B2BAdminPanel({ stats, leads, secret }: { stats: Stats; leads: Lead[]; secret: string }) {
  const [industry, setIndustry] = useState<B2BIndustry>("glazenwasser");
  const [city, setCity]         = useState("Amsterdam");
  const [discovering, setDiscovering]     = useState(false);
  const [discoverResult, setDiscoverResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [sendingOutreach, setSendingOutreach] = useState(false);
  const [outreachResult, setOutreachResult]   = useState<{ ok: boolean; msg: string } | null>(null);

  async function handleDiscover() {
    setDiscovering(true);
    setDiscoverResult(null);
    try {
      const res = await fetch("/api/b2b/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
        body: JSON.stringify({ industry, city }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDiscoverResult({ ok: false, msg: data.error + (data.hint ? ` — ${data.hint}` : "") });
      } else {
        setDiscoverResult({ ok: true, msg: `${data.found} bedrijven gevonden · ${data.saved} opgeslagen · ${data.noEmail} zonder e-mail` });
      }
    } catch {
      setDiscoverResult({ ok: false, msg: "Verbindingsfout" });
    } finally {
      setDiscovering(false);
    }
  }

  async function handleOutreach() {
    setSendingOutreach(true);
    setOutreachResult(null);
    try {
      const res = await fetch("/api/b2b/outreach", {
        headers: { Authorization: `Bearer ${secret}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setOutreachResult({ ok: false, msg: data.error });
      } else {
        setOutreachResult({ ok: true, msg: `${data.sent} e-mails verstuurd van ${data.total} leads` });
      }
    } catch {
      setOutreachResult({ ok: false, msg: "Verbindingsfout" });
    } finally {
      setSendingOutreach(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #1e293b 0%, #0f172a 100%)" }}>
      <div className="max-w-5xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="mb-10">
          <p className="text-xs font-bold text-accent-orange uppercase tracking-widest mb-1">WEERZONE</p>
          <h1 className="text-3xl font-black text-white mb-1">B2B Outreach</h1>
          <p className="text-white/40 text-sm">Leads beheren, bedrijven zoeken, outreach versturen.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Totaal",       value: stats.total,      color: "text-white" },
            { label: "Nieuw",        value: stats.new,        color: "text-blue-400" },
            { label: "Gemaild",      value: stats.emailed,    color: "text-amber-400" },
            { label: "Ingeschreven", value: stats.subscribed, color: "text-green-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4">
              <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-1">{label}</p>
              <p className={`text-4xl font-black ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

          {/* Discovery */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">🔍</span>
              <h2 className="text-lg font-black text-white">Bedrijven zoeken</h2>
            </div>
            <p className="text-white/40 text-sm mb-5">
              Zoekt via Google Places, scrapet e-mailadressen van websites en slaat ze op als lead.
              Vereist <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs">GOOGLE_MAPS_API_KEY</code>.
            </p>

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-bold text-white/50 mb-1.5">Branche</label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value as B2BIndustry)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white text-sm focus:outline-none focus:border-accent-orange"
                >
                  {INDUSTRIES.map((i) => (
                    <option key={i.value} value={i.value} className="bg-slate-900">{i.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-white/50 mb-1.5">Stad</label>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Amsterdam"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-accent-orange"
                />
              </div>
            </div>

            <button
              onClick={handleDiscover}
              disabled={discovering}
              className="w-full py-3 rounded-xl bg-accent-orange text-text-primary font-bold text-sm hover:brightness-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {discovering ? "Zoeken..." : "Zoek bedrijven →"}
            </button>

            {discoverResult && (
              <div className={`mt-3 px-4 py-3 rounded-xl text-sm font-medium ${discoverResult.ok ? "bg-green-500/10 text-green-300" : "bg-red-500/10 text-red-400"}`}>
                {discoverResult.ok ? "✅" : "❌"} {discoverResult.msg}
              </div>
            )}
          </div>

          {/* Outreach */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">📨</span>
              <h2 className="text-lg font-black text-white">Outreach versturen</h2>
            </div>
            <p className="text-white/40 text-sm mb-5">
              Stuurt branche-specifieke e-mails naar nieuwe leads. Max 10 per keer, max 3 pogingen per lead, minimaal 7 dagen tussen pogingen.
              Draait ook automatisch via de cron <span className="text-white/60 font-semibold">ma–vr 09:00</span>.
            </p>

            <div className="bg-white/5 rounded-xl p-4 mb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/40">Wachten op outreach</span>
                <span className="text-blue-400 font-bold">{stats.new} leads</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/40">Al gemaild</span>
                <span className="text-amber-400 font-bold">{stats.emailed} leads</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/40">Ingeschreven</span>
                <span className="text-green-400 font-bold">{stats.subscribed} leads</span>
              </div>
            </div>

            <button
              onClick={handleOutreach}
              disabled={sendingOutreach || stats.new === 0}
              className="w-full py-3 rounded-xl bg-accent-orange text-text-primary font-bold text-sm hover:brightness-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sendingOutreach ? "Versturen..." : `Stuur outreach naar ${stats.new} leads →`}
            </button>

            {outreachResult && (
              <div className={`mt-3 px-4 py-3 rounded-xl text-sm font-medium ${outreachResult.ok ? "bg-green-500/10 text-green-300" : "bg-red-500/10 text-red-400"}`}>
                {outreachResult.ok ? "✅" : "❌"} {outreachResult.msg}
              </div>
            )}
          </div>
        </div>

        {/* Leads tabel */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-base font-black text-white">Leads</h2>
            <span className="text-sm text-white/40">{leads.length} totaal</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {["Bedrijf", "E-mail", "Stad", "Branche", "Bron", "Status", "Pogingen"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-bold text-white/30 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-white/30 text-sm">
                      Nog geen leads. Gebruik de discovery hierboven om te beginnen.
                    </td>
                  </tr>
                ) : leads.map((lead) => (
                  <tr key={lead.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-semibold text-white">{lead.business_name}</td>
                    <td className="px-5 py-3.5 text-sm text-white/50">{lead.email}</td>
                    <td className="px-5 py-3.5 text-sm text-white/40">{lead.city ?? "—"}</td>
                    <td className="px-5 py-3.5 text-sm text-white/40">{lead.industry}</td>
                    <td className="px-5 py-3.5 text-xs text-white/25">{lead.source}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={lead.status} /></td>
                    <td className="px-5 py-3.5 text-sm text-white/30 text-center">{lead.outreach_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-6 text-center text-white/20 text-xs">
          WEERZONE B2B Admin ·{" "}
          <a href="/zakelijk" className="text-accent-orange hover:underline">/zakelijk</a>
          {" · "}
          <a href="/" className="hover:text-white/40">Dashboard</a>
        </p>

      </div>
    </div>
  );
}
