import Link from "next/link";
import HomePitchCTA from "./HomePitchCTA";

const SECTIONS = [
  {
    name: "Piet",
    label: "Je dag in een oogopslag",
    color: "#22c55e",
    href: "/vandaag#piet",
    text: "Piet vertaalt vandaag en morgen naar een simpel advies: ga nu, wacht even of plan slimmer.",
  },
  {
    name: "Reed",
    label: "Voor buien, wind en onweer",
    color: "#ef4444",
    href: "/vandaag#reed",
    text: "Reed laat zien wanneer stevige buien, wind of onweer jouw plannen kunnen raken.",
  },
  {
    name: "Koos",
    label: "Als je eropuit wilt",
    color: "#3b82f6",
    href: "/vandaag#koos",
    text: "Koos helpt je kiezen waar en wanneer het beter blijft voor je buitenplan.",
  },
] as const;

export default function HomePitch() {
  return (
    <section className="px-4 py-14 sm:py-20 max-w-5xl mx-auto">
      <div className="text-center mb-10">
        <h2
          className="text-3xl sm:text-5xl font-black leading-[1.05] mb-5"
          style={{
            background: "linear-gradient(135deg, #ff5400 0%, #ffd200 50%, #ff5400 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Weer voor keuzes.<br />
          Niet voor eindeloos scrollen.
        </h2>
        <p className="text-white/85 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Weerzone kijkt naar vandaag en morgen en zet de belangrijkste informatie voor je op een rij.
          Piet, Reed en Koos helpen je kiezen: ga nu, wacht, let op of ga ergens heen.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {SECTIONS.map((section) => (
          <Link key={section.name} href={section.href} className="card group p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-3 h-3 rounded-full" style={{ background: section.color }} />
              <span className="text-xs font-black uppercase tracking-widest" style={{ color: section.color }}>
                {section.name}
              </span>
            </div>
            <h3 className="font-black text-slate-900 text-xl leading-snug mb-3">{section.label}</h3>
            <p className="text-sm text-slate-500 leading-relaxed mb-6">{section.text}</p>
            <div
              className="mt-6 text-center rounded-2xl py-3 text-white font-black text-sm group-hover:brightness-110 shadow-lg shadow-black/5"
              style={{ background: section.color }}
            >
              Bekijk {section.name} bij Vandaag -&gt;
            </div>
          </Link>
        ))}
      </div>

      <div className="text-center">
        <HomePitchCTA />
      </div>
    </section>
  );
}
