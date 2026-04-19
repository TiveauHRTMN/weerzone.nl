import Link from "next/link";
import { PERSONAS, PERSONA_ORDER, formatPrice, FOUNDER_SLOTS } from "@/lib/personas";

/**
 * Pitch-sectie onder de homepage-dashboard. De dashboard is de demo —
 * dit is het "waarom betalen". Scherp, concreet, geen corporate ruis.
 *
 * Server component; geen client-state nodig.
 */
export default function HomePitch() {
  return (
    <section className="px-4 py-14 sm:py-20 max-w-5xl mx-auto">
      {/* Lead */}
      <div className="text-center mb-12">
        <p className="text-xs font-black tracking-[0.2em] uppercase text-white/60 mb-4">
          Waarom WEERZONE
        </p>
        <h2 className="text-3xl sm:text-5xl font-black text-white leading-[1.05] mb-5 drop-shadow">
          Een weer-app kent je niet.<br />
          <span className="bg-gradient-to-r from-[#22c55e] via-[#ef4444] to-[#3b82f6] bg-clip-text text-transparent">
            WEERZONE wel.
          </span>
        </h2>
        <p className="text-white/85 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Buienradar weet niet dat je een hond hebt. Weeronline weet niet dat je
          kelder onderloopt bij 40 mm. Je weer-app spamt iedereen in Nederland
          met dezelfde code-geel. Dat kan beter, vonden we. Dus deden we het.
        </p>
      </div>

      {/* Waarom-pijlers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-14">
        {[
          {
            h: "Geen 14-daagse — want dat is gokken",
            p: "Alles voorbij 48 uur is een muntje opgooien met een zonnetje erop. Wij voorspellen alleen wat we wáár kunnen maken: 48 uur, KNMI HARMONIE, 2,5 km-raster op jouw GPS.",
          },
          {
            h: "Eén mail, niet twintig meldingen",
            p: "Elke ochtend om zeven uur één bericht. Wat het weer vandaag doet, wat dat voor jou betekent, en of je iets moet ondernemen. Rust in je ochtend, geen pushmelding-theater.",
          },
          {
            h: "Kent jouw leven — geen generieke prietpraat",
            p: "Je hond, je fiets, je platte dak, je strandtent, je windkracht-drempel. WEERZONE schrijft voor jou, niet voor alle 17 miljoen Nederlanders tegelijk.",
          },
          {
            h: "Nederlandse data, Nederlandse toon",
            p: "KNMI HARMONIE is het scherpste model van de lage landen — gebouwd voor ons kustklimaat. Wij ontsluiten dat rauw, zonder Silicon-Valley-filter eroverheen.",
          },
        ].map((item) => (
          <div
            key={item.h}
            className="rounded-2xl bg-white/95 backdrop-blur p-5 sm:p-6 shadow-xl"
          >
            <h3 className="font-black text-text-primary text-lg leading-tight mb-2">
              {item.h}
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">{item.p}</p>
          </div>
        ))}
      </div>

      {/* Drie-persona-pitch */}
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight mb-3 drop-shadow">
          Kies wie jou wakker belt
        </h2>
        <p className="text-white/80 text-sm sm:text-base max-w-xl mx-auto">
          Drie karakters, één belofte: jou kennen beter dan je weer-app dat ooit zal doen.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {PERSONA_ORDER.map((tier) => {
          const p = PERSONAS[tier];
          return (
            <Link
              key={tier}
              href={`/app/onboarding?tier=${tier}`}
              className="group rounded-2xl bg-white/95 backdrop-blur p-5 sm:p-6 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: p.color }}
                />
                <span
                  className="text-xs font-black uppercase tracking-wider"
                  style={{ color: p.color }}
                >
                  {p.name} · {p.label}
                </span>
              </div>
              <h3 className="font-black text-text-primary text-lg leading-snug mb-2">
                {p.tagline}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed mb-4">
                {p.description}
              </p>
              <div className="flex items-baseline gap-2 pt-3 border-t border-black/10">
                <span className="text-2xl font-black text-text-primary">
                  {formatPrice(p.founderPriceCents)}
                </span>
                <span className="text-xs text-text-muted">/mnd · founder voor altijd</span>
              </div>
              <p className="text-[11px] text-text-muted mt-1">
                Normaal {formatPrice(p.priceCents)}/mnd vanaf 1 juni
              </p>
              <div
                className="mt-4 text-center rounded-xl py-2.5 text-white font-bold text-sm group-hover:brightness-110"
                style={{ background: p.color }}
              >
                Gratis tot 1 juni →
              </div>
            </Link>
          );
        })}
      </div>

      {/* Schaarste + CTA */}
      <div className="text-center">
        <p className="text-white/80 text-sm mb-4">
          <strong className="text-white">{FOUNDER_SLOTS} founder-plekken per persona.</strong>{" "}
          Wie er vroeg bij is, betaalt die prijs voor altijd — ook als we over
          twee jaar de tarieven verdubbelen.
        </p>
        <Link
          href="/prijzen"
          className="inline-block px-6 py-3 rounded-full bg-white text-text-primary font-black text-sm shadow-xl hover:bg-accent-orange hover:text-white transition-colors"
        >
          Vergelijk alle drie →
        </Link>
      </div>
    </section>
  );
}
