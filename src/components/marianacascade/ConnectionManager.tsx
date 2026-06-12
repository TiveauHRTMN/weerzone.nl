import React, { useState, useEffect } from "react";
import { Database, Wifi, WifiOff, Save, CheckCircle2, RefreshCw } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

interface ConnectionManagerProps {
  onConfigChange: (config: DbConfig) => void;
  currentMode: "mock" | "live";
  onModeToggle: (mode: "mock" | "live") => void;
}

export interface DbConfig {
  supabaseUrl: string;
  supabaseKey: string;
}

export const ConnectionManager: React.FC<ConnectionManagerProps> = ({
  onConfigChange,
  currentMode,
  onModeToggle,
}) => {
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseKey, setSupabaseKey] = useState("");
  const [status, setStatus] = useState<"disconnected" | "testing" | "connected" | "error">("disconnected");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const savedUrl = localStorage.getItem("mclcr_sb_url") || "";
    const savedKey = localStorage.getItem("mclcr_sb_key") || "";
    if (savedUrl && savedKey) {
      setSupabaseUrl(savedUrl);
      setSupabaseKey(savedKey);
      onConfigChange({ supabaseUrl: savedUrl, supabaseKey: savedKey });
      setStatus("connected");
    }
  }, []);

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseUrl || !supabaseKey) {
      setStatus("error");
      setErrorMessage("Vul beide velden in.");
      return;
    }

    setStatus("testing");
    setErrorMessage("");

    try {
      const client = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await client.from("system_state").select("key").limit(1);

      if (error) {
        throw new Error(error.message);
      }

      localStorage.setItem("mclcr_sb_url", supabaseUrl);
      localStorage.setItem("mclcr_sb_key", supabaseKey);
      onConfigChange({ supabaseUrl, supabaseKey });
      setStatus("connected");
      onModeToggle("live");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Fout bij verbinden met Supabase.");
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem("mclcr_sb_url");
    localStorage.removeItem("mclcr_sb_key");
    setSupabaseUrl("");
    setSupabaseKey("");
    setStatus("disconnected");
    onModeToggle("mock");
    onConfigChange({ supabaseUrl: "", supabaseKey: "" });
  };

  return (
    <div className="border border-zinc-800 bg-[#0c0c10] rounded-xl p-6 shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-900">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg border ${
            currentMode === "live"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-blue-500/10 border-blue-500/30 text-blue-400"
          }`}>
            <Database size={20} className={currentMode === "live" ? "text-glow-green" : "text-glow-blue"} />
          </div>
          <div>
            <h3 className="text-sm font-bold font-mono tracking-wider text-zinc-200">DATABRON MANAGER</h3>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5">
              Live database of tactische mockmode
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onModeToggle("mock")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono tracking-wide cursor-pointer transition-all border ${
              currentMode === "mock"
                ? "bg-blue-900/20 border-blue-500/50 text-blue-400 font-bold"
                : "bg-[#050507] border-zinc-800 text-zinc-500 hover:text-zinc-300"
            }`}
          >
            MOCK MODE
          </button>
          <button
            type="button"
            onClick={() => {
              if (status === "connected") {
                onModeToggle("live");
              } else {
                alert("Stel eerst een geldige Supabase-verbinding in.");
              }
            }}
            disabled={status !== "connected"}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono tracking-wide cursor-pointer transition-all border ${
              currentMode === "live"
                ? "bg-emerald-900/20 border-emerald-500/50 text-emerald-400 font-bold"
                : "bg-[#050507] border-zinc-800 text-zinc-500 hover:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed"
            }`}
          >
            LIVE DB
          </button>
        </div>
      </div>

      {currentMode === "mock" ? (
        <div className="p-4 bg-blue-950/15 border border-blue-500/10 rounded-lg text-xs font-mono text-blue-300/80 leading-relaxed flex gap-3">
          <WifiOff size={18} className="shrink-0 text-blue-400 animate-pulse" />
          <div>
            <span className="font-bold text-blue-400 block mb-1">TACTISCHE CHASER MOCKMODE ACTIEF</span>
            De applicatie draait op vooraf geladen meteorologische scenario's van onweer en regime-wisselingen. Geen actieve verbinding vereist. Perfect voor demonstraties.
          </div>
        </div>
      ) : (
        <div className="p-4 bg-emerald-950/15 border border-emerald-500/10 rounded-lg text-xs font-mono text-emerald-300/80 leading-relaxed flex gap-3 mb-4">
          <Wifi size={18} className="shrink-0 text-emerald-400 text-glow-green animate-pulse" />
          <div>
            <span className="font-bold text-emerald-400 block mb-1">LIVE DATABASE VERBONDEN</span>
            Er is een actieve query-verbinding met Supabase. Het dashboard haalt realtime data op uit de tabellen van Mariana Cascada.
          </div>
        </div>
      )}

      <form onSubmit={handleTestAndSave} className="space-y-4 mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5">
              Supabase Project URL
            </label>
            <input
              type="text"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="https://your-project.supabase.co"
              className="w-full bg-[#050507] border border-zinc-800 rounded-lg py-2 px-3 text-xs font-mono text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-zinc-700"
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5">
              Supabase API Anon/Service Key
            </label>
            <input
              type="password"
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
              placeholder="eyJhbGciOi..."
              className="w-full bg-[#050507] border border-zinc-800 rounded-lg py-2 px-3 text-xs font-mono text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-zinc-700"
            />
          </div>
        </div>

        {status === "error" && (
          <p className="text-xs font-mono text-rose-500 uppercase tracking-wide">
            ⚠ Connection Error: {errorMessage}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          {status === "connected" && (
            <button
              type="button"
              onClick={handleDisconnect}
              className="px-4 py-2 border border-rose-500/30 text-rose-400 bg-rose-500/5 hover:bg-rose-500/10 rounded-lg text-xs font-mono font-bold tracking-wider cursor-pointer transition-all"
            >
              DISCONNECT
            </button>
          )}

          <button
            type="submit"
            disabled={status === "testing"}
            className="flex items-center gap-2 px-5 py-2 bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 hover:border-zinc-500 text-zinc-100 rounded-lg text-xs font-mono font-bold tracking-wider cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {status === "testing" ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>VERBINDING TESTEN...</span>
              </>
            ) : status === "connected" ? (
              <>
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span>VERBINDING VERIFIËREN</span>
              </>
            ) : (
              <>
                <Save size={14} />
                <span>OPSLAAN & VERBINDEN</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
