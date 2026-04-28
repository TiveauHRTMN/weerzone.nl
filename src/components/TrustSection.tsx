const TIERS = [
  {
    range: "0–48 uur",
    label: "Precisie",
    desc: "Voorspellingen op 1×1 km — nauwkeurig genoeg om beslissingen op te baseren.",
    emoji: "🎯",
    accent: "#10b981",
    tint: "rgba(16,185,129,0.10)",
    border: "rgba(16,185,129,0.25)",
    pct: "92–98%",
  },
  {
    range: "3–7 dagen",
    label: "Beperkte zekerheid",
    desc: "De verwachting kan nog flink veranderen. Baseer grotere beslissingen op de 48-uurs voorspelling.",
    emoji: "🎲",
    accent: "#f59e0b",
    tint: "rgba(245,158,11,0.09)",
    border: "rgba(245,158,11,0.22)",
    pct: "45–75%",
  },
  {
    range: "10+ dagen",
    label: "Indicatief",
    desc: "Geschikt voor een globaal seizoensgevoel — niet voor dagplanning.",
    emoji: "🔮",
    accent: "rgba(255,255,255,0.35)",
    tint: "rgba(255,255,255,0.04)",
    border: "rgba(255,255,255,0.10)",
    pct: "<20%",
  },
];

const BARS = [
  { day: "Dag 1", val: 98,  color: "#10b981" },
  { day: "Dag 2", val: 92,  color: "#34d399" },
  { day: "Dag 3", val: 70,  color: "#fbbf24" },
  { day: "Dag 4", val: 48,  color: "#f59e0b" },
  { day: "Dag 5", val: 28,  color: "rgba(255,255,255,0.22)" },
  { day: "Dag 6", val: 14,  color: "rgba(255,255,255,0.13)" },
  { day: "Dag 7", val: 6,   color: "rgba(255,255,255,0.07)" },
];

export default function TrustSection() {
  return (
    <section className="px-4 py-20">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50 mb-4">
            Transparantie over nauwkeurigheid
          </p>
          <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-5">
            Waarom stopt WEERZONE<br />
            bij <span style={{ color: "#ffd60a" }}>48 uur?</span>
          </h2>
          <p className="text-white/65 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Veel weerdiensten tonen een 14-daagse voorspelling alsof die net zo betrouwbaar is als vandaag.
            De werkelijkheid is anders.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

          {/* Tier cards */}
          <div className="flex flex-col gap-3">
            {TIERS.map((t) => (
              <div
                key={t.range}
                className="flex gap-4 rounded-3xl p-5 border transition-all duration-300 hover:scale-[1.01]"
                style={{ background: t.tint, borderColor: t.border, backdropFilter: "blur(12px)" }}
              >
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 border"
                  style={{ background: `${t.tint}`, borderColor: t.border }}
                >
                  {t.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: t.accent }}>
                      {t.range}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: t.accent }}>
                      {t.pct}
                    </span>
                  </div>
                  <p className="font-black text-white text-sm mb-1">{t.label}</p>
                  <p className="text-white/50 text-xs leading-relaxed">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Accuracy chart */}
          <div
            className="rounded-3xl border p-6 flex flex-col"
            style={{
              background: "rgba(255,255,255,0.05)",
              borderColor: "rgba(255,255,255,0.10)",
              backdropFilter: "blur(12px)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.08)",
            }}
          >
            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1" style={{ color: "#ffd60a" }}>
              Nauwkeurigheid per dag
            </p>
            <p className="text-white/35 text-[10px] font-bold mb-6">
              Typische modelnauwkeurigheid voor Nederland
            </p>

            <div className="flex flex-col gap-3 flex-1">
              {BARS.map((b, i) => (
                <div key={b.day} className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-white/35 w-10 text-right shrink-0">{b.day}</span>
                  <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${b.val}%`, background: b.color, transition: "width 1s ease" }}
                    />
                  </div>
                  <span
                    className="text-[10px] font-black w-9 text-right shrink-0"
                    style={{ color: i < 2 ? "#10b981" : i < 4 ? "#f59e0b" : "rgba(255,255,255,0.2)" }}
                  >
                    {b.val}%
                  </span>
                </div>
              ))}
            </div>

            {/* 48h marker */}
            <div
              className="mt-5 pt-4 flex items-center gap-2"
              style={{ borderTop: "1px dashed rgba(255,255,255,0.10)" }}
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                WeerZone focust op dag 1–2
              </span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
