"use client";

import { useState } from "react";

export default function EmbedConfigurator({ cities }: { cities: string[] }) {
  const [selectedCity, setSelectedCity] = useState("Amsterdam");
  const [copied, setCopied] = useState(false);

  const embedCode = `<iframe src="https://weerzone.nl/widget?city=${encodeURIComponent(selectedCity)}" width="340" height="200" style="border:none;border-radius:16px;overflow:hidden;" loading="lazy" title="Weer ${selectedCity} — WeerZone"></iframe>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* City picker */}
      <div>
        <label className="text-xs font-bold text-white/50 uppercase tracking-wider block mb-2">Stad</label>
        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm font-semibold w-full focus:outline-none focus:border-accent-orange"
        >
          {cities.map(c => (
            <option key={c} value={c} className="bg-gray-900 text-white">{c}</option>
          ))}
        </select>
      </div>

      {/* Preview */}
      <div>
        <label className="text-xs font-bold text-white/50 uppercase tracking-wider block mb-2">Preview</label>
        <div className="bg-white/5 rounded-2xl p-6 flex justify-center">
          <iframe
            src={`/widget?city=${encodeURIComponent(selectedCity)}`}
            width="340"
            height="200"
            style={{ border: "none", borderRadius: "16px", overflow: "hidden" }}
            title={`Weer ${selectedCity}`}
          />
        </div>
      </div>

      {/* Code */}
      <div>
        <label className="text-xs font-bold text-white/50 uppercase tracking-wider block mb-2">Embed code</label>
        <div className="relative">
          <pre className="bg-black/40 border border-white/10 rounded-xl p-4 text-xs text-green-400 font-mono overflow-x-auto whitespace-pre-wrap break-all">
            {embedCode}
          </pre>
          <button
            onClick={handleCopy}
            className="absolute top-3 right-3 px-3 py-1.5 bg-accent-orange text-text-primary text-xs font-bold rounded-lg hover:brightness-90 transition-colors"
          >
            {copied ? "Gekopieerd!" : "Kopieer"}
          </button>
        </div>
      </div>

      <p className="text-[11px] text-white/30">
        De widget update automatisch. Geen API key nodig. Gratis voor altijd.
      </p>
    </div>
  );
}
