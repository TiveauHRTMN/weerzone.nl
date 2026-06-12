import React, { useState } from "react";
import { ShieldAlert, Unlock, AlertTriangle } from "lucide-react";

interface PasscodeGateProps {
  onUnlock: () => void;
}

export const PasscodeGate: React.FC<PasscodeGateProps> = ({ onUnlock }) => {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState(false);

  // Read passcode from Next.js env variable
  const CORRECT_PASSCODE = process.env.NEXT_PUBLIC_FOUNDER_PASSCODE || "1997";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === CORRECT_PASSCODE) {
      setError(false);
      localStorage.setItem("mclcr_unlocked", "true");
      onUnlock();
    } else {
      setError(true);
      setPasscode("");
      if (navigator.vibrate) navigator.vibrate(100);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050507] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900/30 via-[#050507] to-[#010102]">
      {/* Scanline overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[size:100%_4px,6px_100%]" />

      <div className="relative w-full max-w-md p-8 border border-zinc-800 bg-[#0c0c10]/95 rounded-xl backdrop-blur-md shadow-2xl radar-glow-red transition-all duration-300">
        <div className="absolute -top-[1px] left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-rose-500 to-transparent" />

        <div className="flex flex-col items-center mb-8">
          <div className="p-4 bg-rose-500/10 rounded-full border border-rose-500/30 text-rose-500 mb-4 animate-pulse">
            <ShieldAlert size={40} className="text-glow-red" />
          </div>
          <h2 className="text-2xl font-bold tracking-wider text-zinc-100 font-mono">
            SYSTEM LOCK ACTIVE
          </h2>
          <p className="text-xs text-zinc-500 font-mono mt-1 uppercase tracking-widest">
            Mariana Cascada Live Control
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-zinc-400 mb-2">
              ENTER FOUNDER PINCODE
            </label>
            <input
              type="password"
              value={passcode}
              onChange={(e) => {
                setPasscode(e.target.value);
                setError(false);
              }}
              placeholder="••••"
              maxLength={12}
              className="w-full bg-[#050507] border border-zinc-800 rounded-lg py-3 px-4 text-center text-xl font-mono tracking-widest text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-rose-500/50 transition-colors"
              autoFocus
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-xs font-mono">
              <AlertTriangle size={16} className="shrink-0" />
              <span>ACCESS DENIED. INVALID PASSCODE.</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 hover:border-zinc-500 text-zinc-100 py-3 rounded-lg text-sm font-mono font-semibold uppercase tracking-wider transition-all cursor-pointer"
          >
            <Unlock size={16} />
            <span>UNSEAL COMMAND DECK</span>
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-zinc-900 text-center">
          <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider">
            AUTHORIZED FOUNDER ACCESS ONLY
          </p>
        </div>
      </div>
    </div>
  );
};
