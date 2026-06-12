import React, { useState, useRef, useEffect } from "react";
import { Terminal, Send } from "lucide-react";

interface HermesTerminalProps {
  scenarioName: string;
  convectiveGate: "INACTIVE" | "ACTIVATE";
  cape: number;
}

export const HermesTerminal: React.FC<HermesTerminalProps> = ({
  scenarioName,
  convectiveGate,
  cape,
}) => {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<{ type: "cmd" | "ai"; text: string }[]>([
    { type: "ai", text: "Mariana is gereed. Stel een vraag over weerpatronen en risico's." },
  ]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const handleCommand = (cmdText: string) => {
    if (!cmdText.trim()) return;

    setHistory(prev => [...prev, { type: "cmd", text: cmdText }]);
    setInput("");
    setLoading(true);

    setTimeout(() => {
      let response = "";
      const query = cmdText.toLowerCase();

      if (query.includes("oracle") || query.includes("regime")) {
        response = `[ORACLE DETECTION] Current regime based on 48-96h analysis. Active scenario: ${scenarioName}. ${
          convectiveGate === "ACTIVATE"
            ? "An active shortwave trough/disturbance is situated over Western Europe. Convective gate is OPEN (ACTIVATE)."
            : "Strong high-pressure ridging inhibits updrafts. Stable airmass."
        }`;
      } else if (query.includes("tesla") || query.includes("convect") || query.includes("cape")) {
        response = `[TESLA METRICS] Convective risk analysis. CAPE energy: ${cape} J/kg. ${
          cape > 2000
            ? "Extremely unstable atmosphere detected. High potential for severe lightning density, large hail, and damaging wind gusts. Deep-layer wind shear promotes supercellular organization."
            : "CAPE energy is insufficient for severe convective storms. No active mesoscale threat."
        }`;
      } else if (query.includes("clear")) {
        setHistory([]);
        setLoading(false);
        return;
      } else if (query.includes("help") || query.includes("status")) {
        response = "AVAILABLE COMMANDS:\n- 'oracle report' (weather regime analysis)\n- 'tesla convective risk' (severe storm risk & indices)\n- 'clear' (clear terminal history)";
      } else {
        response = `[MARIANA RETRIEVAL] Command '${cmdText}' not recognized. Type 'help' for a list of available commands.`;
      }

      setHistory(prev => [...prev, { type: "ai", text: response }]);
      setLoading(false);
    }, 800);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCommand(input);
  };

  return (
    <div className="border border-[#e3e8f1] bg-white rounded-3xl p-6 shadow-md relative flex flex-col h-[320px] font-sans">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl border border-slate-200/55 text-slate-500 bg-slate-50">
            <Terminal size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-wider text-[#0f1a2c] uppercase">HERMES TERMINAL</h3>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">
              Oracle, Regions and Local reasoning shell
            </p>
          </div>
        </div>
      </div>

      {/* Terminal logs screen */}
      <div className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-[11px] overflow-y-auto space-y-3 leading-relaxed text-slate-800">
        {history.map((log, index) => (
          <div key={index} className="space-y-1.5">
            {log.type === "cmd" ? (
              <div className="text-slate-400 font-bold">
                <span>FOUNDER:~$ </span>
                <span className="text-slate-800">{log.text}</span>
              </div>
            ) : (
              <div className="text-[#12805c] whitespace-pre-wrap font-medium">
                <span className="text-[#0f1a2c] font-bold">MARIANA: </span>
                {log.text}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="text-slate-400 animate-pulse">
            FOUNDER:~$ DECODING ATMOSPHERE...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <form onSubmit={onSubmit} className="flex gap-2 mt-3 shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type 'oracle report', 'tesla risk', or 'help'..."
          className="flex-1 bg-slate-50 border border-slate-200 hover:border-slate-350 focus:border-[#3b7ff0] rounded-xl py-2 px-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-colors"
        />
        <button
          type="submit"
          className="flex items-center justify-center p-2.5 bg-[#e8f0ff] border border-[#3b7ff0]/20 text-[#2a5fc4] rounded-xl cursor-pointer hover:bg-[#3b7ff0]/10 transition-colors"
        >
          <Send size={14} />
        </button>
      </form>

      {/* Pre-sets */}
      <div className="flex gap-2 mt-2 overflow-x-auto pb-1 scrollbar-none shrink-0">
        <button
          type="button"
          onClick={() => handleCommand("oracle report")}
          className="text-[9px] px-2 py-1 bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 rounded-lg uppercase tracking-wider cursor-pointer whitespace-nowrap"
        >
          Oracle report
        </button>
        <button
          type="button"
          onClick={() => handleCommand("tesla convective risk")}
          className="text-[9px] px-2 py-1 bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 rounded-lg uppercase tracking-wider cursor-pointer whitespace-nowrap"
        >
          Tesla risk
        </button>
      </div>
    </div>
  );
};
