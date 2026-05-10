import type { PietDailyBriefingData } from "@/lib/piet-briefing";
import { currentSegment } from "@/lib/piet-briefing";

const DAGEN = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"];

const SEGMENT_HOURS: Record<string, string> = {
  Ochtend: "06:00 – 12:00",
  Middag: "12:00 – 18:00",
  Avond: "18:00 – 00:00",
  Nacht: "00:00 – 06:00",
};

export default function PietDailyBriefing({ data }: { data: PietDailyBriefingData }) {
  const active = currentSegment();
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Amsterdam" }));
  const dagVandaag = DAGEN[now.getDay()].charAt(0).toUpperCase() + DAGEN[now.getDay()].slice(1);
  const updatedAt = new Date(data.generated_at).toLocaleTimeString("nl-NL", {
    timeZone: "Europe/Amsterdam",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="card p-5 sm:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🌤️</span>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
            {dagVandaag} · vandaag
          </p>
        </div>
        <span className="text-[10px] text-slate-400 font-medium">bijgewerkt {updatedAt}</span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {data.slots.map((slot) => {
          const isActive = slot.name === active;
          return (
            <div
              key={slot.name}
              className={`rounded-xl p-3 text-center transition-all ${
                isActive
                  ? "text-white shadow-md border border-[#3b7ff0]"
                  : "bg-slate-50 text-slate-700 border border-transparent"
              }`}
              style={isActive ? { background: "#3b7ff0" } : {}}
            >
              <p className={`text-[10px] font-black uppercase tracking-wide mb-1 ${isActive ? "text-white/70" : "text-slate-400"}`}>
                {slot.name}
                <span className={`block font-normal normal-case tracking-normal text-[9px] ${isActive ? "text-white/60" : "text-slate-300"}`}>
                  {SEGMENT_HOURS[slot.name]}
                </span>
              </p>
              <span className="text-xl block mb-1">{slot.emoji}</span>
              <p className={`text-sm font-black ${isActive ? "text-white" : "text-slate-800"}`}>{slot.temp}</p>
              <p className={`text-[10px] font-semibold ${isActive ? "text-white/80" : "text-slate-400"}`}>{slot.rain}</p>
            </div>
          );
        })}
      </div>

      <p className="text-sm text-slate-600 leading-relaxed border-l-2 border-sky-500/30 pl-4">
        {data.commentary}
      </p>
    </div>
  );
}
