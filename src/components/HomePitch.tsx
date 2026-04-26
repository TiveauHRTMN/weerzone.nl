import Link from "next/link";
import { PERSONAS, PERSONA_ORDER, formatPrice } from "@/lib/personas";

/**
 * Korte pitch onder de homepage-dashboard. De dashboard is de demo,
 * dit is het "waarom betalen". Alleen WEERZONE in kleur, de rest wit
 * op de blauwe achtergrond.
 *
 * Server component.
 */
export default function HomePitch() {
  return (
    <section className="px-4 py-14 sm:py-20 max-w-5xl mx-auto">
      {/* Lead */}
      <div className="text-center mb-10">
        <p className="text-xs font-black tracking-[0.2em] uppercase text-white/70 mb-4">
          Een abonnement op <span style={{ color: "#FFB400" }}>WEERZONE</span>
        </p>
        <h2 className="text-3xl sm:text-5xl font-black text-white leading-[1.05] mb-5 drop-shadow">
          Geen reclame.<br />
          Eén mail per ochtend.
        </h2>
        <p className="text-white/85 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Piet schrijft je weerbericht. Reed waarschuwt als het over jouw
          grens gaat. Steve vertaalt het weer naar een beslissing voor je
          zaak. Jij vertelt bij aanmelden waar je woont en wat voor jou
          telt. De rest is aan ons.
        </p>
      </div>

      {/* Drie persona-kaarten (kleine versie, click-through naar onboarding) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {PERSONA_ORDER.map((tier) => {
          const p = PERSONAS[tier];
          const hasPrice = p.priceCents !== undefined && p.founderPriceCents !== undefined;
          const isComingSoon = tier === "steve";

          return (
            <Link
              key={tier}
              href={isComingSoon ? "/zakelijk" : `/app/signup?tier=${tier}`}
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
              
              <div className="pt-3 border-t border-black/10">
                {hasPrice ? (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-text-primary">
                        {formatPrice(p.founderPriceCents!)}
                      </span>
                      <span className="text-xs text-text-muted">/mnd — als je nu aanmeldt</span>
                    </div>
                    <p className="text-[11px] text-text-muted mt-1">
                      Normaal {formatPrice(p.priceCents!)}/mnd, binnenkort
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-black text-text-primary">
                        In ontwikkeling
                      </span>
                    </div>
                    <p className="text-[11px] text-text-muted mt-1">
                      Binnenkort beschikbaar voor zakelijk gebruik
                    </p>
                  </>
                )}
              </div>

              <div
                className="mt-4 text-center rounded-xl py-2.5 text-white font-bold text-sm group-hover:brightness-110"
                style={{ background: p.color }}
              >
                {isComingSoon ? "Lees meer →" : "Aanmelden →"}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Schaarste + CTA */}
      <div className="text-center">
        <p className="text-white/80 text-sm mb-4">
          Tijdelijk gratis. Vroege aanmelders houden hun introductieprijs.
        </p>
        <Link
          href="/prijzen"
          className="inline-block px-6 py-3 rounded-full bg-white text-text-primary font-black text-sm shadow-xl hover:bg-accent-orange hover:text-white transition-colors"
        >
          Bekijk de abonnementen →
        </Link>
      </div>
    </section>
  );
}
