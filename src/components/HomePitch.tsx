import Link from "next/link";
import { PERSONAS, PERSONA_ORDER, formatPrice, daysUntilLaunch, FOUNDER_SLOTS } from "@/lib/personas";

/**
 * Korte pitch onder de homepage-dashboard. De dashboard is de demo,
 * dit is het "waarom betalen". 
 * 
 * Bevat nu de "Urgentie-Motor": countdown + founder scarcity.
 */
export default function HomePitch() {
  const daysLeft = daysUntilLaunch();

  return (
    <section className="px-4 py-14 sm:py-20 max-w-5xl mx-auto">

      {/* Lead */}
      <div className="text-center mb-10">
        <h2 className="text-3xl sm:text-5xl font-black text-white leading-[1.05] mb-5 drop-shadow">
          Weer voor keuzes.<br />
          Niet voor eindeloos scrollen.
        </h2>
        <p className="text-white/85 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          WEERZONE vertaalt de komende 48 uur naar concrete momenten:
          wanneer je droog fietst, buiten kunt werken of beter moet wachten.
          Piet, Reed en Steve maken die keuzes persoonlijker.
        </p>
      </div>

      {/* Drie persona-kaarten */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {PERSONA_ORDER.map((tier) => {
          const p = PERSONAS[tier];
          
          return (
            <Link
              key={tier}
              href={`/app/signup?tier=${tier}`}
              className="group rounded-3xl bg-white/95 backdrop-blur p-6 sm:p-8 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all border-b-4"
              style={{ borderBottomColor: p.color }}
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="w-3 h-3 rounded-full" style={{ background: p.color }} />
                <span className="text-xs font-black uppercase tracking-widest" style={{ color: p.color }}>
                  {p.name} · {p.label}
                </span>
              </div>
              <h3 className="font-black text-slate-900 text-xl leading-snug mb-3">{p.tagline}</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">{p.description}</p>

              <div className="pt-4 border-t border-slate-100">
                <div className="text-2xl font-black text-slate-900">
                  Abonneren
                </div>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tighter mt-1">
                  Tijdelijk gratis te proberen
                </p>
              </div>

              <div
                className="mt-6 text-center rounded-2xl py-3 text-white font-black text-sm group-hover:brightness-110 shadow-lg shadow-black/5"
                style={{ background: p.color }}
              >
                Bekijk {p.name} →
              </div>
            </Link>
          );
        })}
      </div>

      {/* CTA */}
      <div className="text-center">
        <Link
          href="/prijzen"
          className="inline-block px-8 py-4 rounded-full bg-white text-slate-900 font-black text-sm shadow-2xl hover:bg-accent-orange hover:text-white transition-all transform hover:scale-105"
        >
          Vergelijk de weerhulpen →
        </Link>
      </div>
    </section>
  );
}
