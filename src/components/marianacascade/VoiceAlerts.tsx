import React, { useState, useEffect } from "react";
import { Volume2, VolumeX, Radio, Check } from "lucide-react";

interface VoiceAlertsProps {
  scenarioName: string;
  convectiveGate: "INACTIVE" | "ACTIVATE";
  cape: number;
}

export const VoiceAlerts: React.FC<VoiceAlertsProps> = ({
  scenarioName,
  convectiveGate,
  cape,
}) => {
  const [enabled, setEnabled] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const speakText = (text: string) => {
    if (!enabled || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.95;
    utterance.pitch = 0.85;

    const voices = window.speechSynthesis.getVoices();
    const enVoice = voices.find(v => v.lang.startsWith("en"));
    if (enVoice) utterance.voice = enVoice;

    window.speechSynthesis.speak(utterance);

    const timestamp = new Date().toLocaleTimeString();
    setLog(prev => [`[${timestamp}] Spoken: "${text}"`, ...prev.slice(0, 4)]);
  };

  useEffect(() => {
    if (!enabled) return;

    if (convectiveGate === "ACTIVATE") {
      speakText(`Warning. Mariana Tesla has detected severe convective activity. CAPE is at ${cape} Joules per kilogram. Reed convective gate trigger has been activated.`);
    } else {
      speakText(`System update. Mariana Cascade is operating in stable conditions. Severe risk is currently low.`);
    }
  }, [scenarioName, convectiveGate, enabled]);

  const handleTestSpeech = () => {
    if (!window.speechSynthesis) {
      alert("Speech synthesis is not supported in this browser.");
      return;
    }
    const testText = "Mariana tactical alarm. System check completed. Airspace under surveillance.";

    const oldEnabled = enabled;
    if (!oldEnabled) setEnabled(true);

    setTimeout(() => {
      speakText(testText);
      if (!oldEnabled) setEnabled(false);
    }, 100);
  };

  return (
    <div className="border border-[#e3e8f1] bg-white rounded-3xl p-6 shadow-md relative">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl border ${
            enabled ? "bg-amber-500/10 border-amber-500/20 text-amber-600 animate-pulse" : "bg-slate-100 border-slate-200 text-slate-400"
          }`}>
            {enabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </div>
          <div className="font-sans">
            <h3 className="text-sm font-bold tracking-wider text-[#0f1a2c] uppercase">VOICE ALERTS</h3>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">
              Text-to-speech hazard announcements
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setEnabled(!enabled)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide cursor-pointer transition-all border font-sans ${
            enabled
              ? "bg-[#e8f0ff] border-[#3b7ff0]/50 text-[#2a5fc4]"
              : "bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700"
          }`}
        >
          {enabled ? "MUTE" : "UNMUTE"}
        </button>
      </div>

      <div className="space-y-4 font-sans">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleTestSpeech}
            className="w-full flex items-center justify-center gap-2 bg-[#f8fafc] border border-slate-200 hover:border-slate-350 text-slate-750 hover:text-[#0f1a2c] py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            <Radio size={14} className={enabled ? "text-amber-500 animate-pulse" : ""} />
            <span>TEST VOICE</span>
          </button>
        </div>

        <div className="space-y-1.5">
          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">Voice Log:</span>
          <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl min-h-[90px] text-[11px] text-slate-500 space-y-2">
            {log.length === 0 ? (
              <span className="italic block text-center text-slate-400 pt-5">
                No spoken alerts. Enable voice sound above.
              </span>
            ) : (
              log.map((entry, idx) => (
                <div key={idx} className="flex items-start gap-1.5 text-slate-500">
                  <Check size={12} className="shrink-0 text-emerald-600 mt-0.5" />
                  <span>{entry}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
