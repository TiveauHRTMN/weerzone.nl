"use client";

import { useState } from "react";
import Link from "next/link";
import { PERSONAS, formatPrice, type PersonaTier } from "@/lib/personas";
import { WzFooter } from "@/components/wz";

const VISIBLE_TIERS: PersonaTier[] = ["piet", "reed", "steve"];
const HIGHLIGHT: PersonaTier = "reed";
const UNAVAILABLE: PersonaTier[] = ["steve"];

const PAGE_BG = "linear-gradient(160deg, #1a3a6e 0%, #0f2244 40%, #080f1f 100%)";

interface Props {
  userTier: PersonaTier | null;
  isFounder: boolean;
}

const STEPS: Array<[string, string, string]> = [
  ["1", "Kies een abonnement", "Piet, Reed of Steve. Geen creditcard nodig. Opzeggen kan altijd."],
  ["2", "Vul je profiel in", "Postcode en een paar vragen (hond, fiets, kelder). Alleen wat je kwijt wilt."],
  ["3", "Morgen om 7:00", "Je eerste mail in je inbox. Het dashboard staat altijd klaar."],
];

const FAQS: Array<[string, string]> = [
  ["Waarom is het nu gratis?", "We zijn nog in opbouw. Je kunt je nu gratis aanmelden zonder creditcard."],
  ["Wat is het verschil tussen Piet, Reed en Steve?", "Piet schrijft een dagelijkse weermail voor thuis. Reed stuurt daarnaast alleen bericht als het weer over jouw drempel gaat. Steve doet hetzelfde voor bedrijven, inclusief advies per vestiging."],
  ["Kan ik wisselen van abonnement?", "Ja. Je kunt maandelijks upgraden of downgraden via je account. Als je nu bij de eerste aanmeldingen zit, behoud je de lage aanmeldprijs van je nieuwe abonnement."],
  ["Waarom maar 48 uur vooruit?", "Omdat een voorspelling verder dan 48 uur onbetrouwbaar wordt. Wij houden ons aan wat met het KNMI HARMONIE-model accuraat te zeggen is — 48 uur op een raster van 2,5 km."],
  ["Hoe gaat de betaling straks?", "Via Mollie: iDEAL, creditcard of Bancontact. Per maand of per jaar (jaar: twee maanden korting). Opzeggen kan op elk moment vanuit je account."],
  ["Wat is het verschil met Buienradar of Weerplaza?", "Weerzone is reclamevrij en is afgestemd op jouw situatie: je postcode en de voorkeuren die je bij aanmelden hebt doorgegeven."],
];

const GLASS_CARD: React.CSSProperties = {
  background: "rgba(255,255,255,0.93)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  borderRadius: 24,
  border: "1px solid rgba(255,255,255,0.6)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.8)",
};

export default function PrijzenClient({ userTier, isFounder }: Props) {
  if (isFounder) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: PAGE_BG }}>
        <div style={{ ...GLASS_CARD, maxWidth: 400, width: "100%", padding: "clamp(32px,4vw,48px)", textAlign: "center" }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6" style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.3)" }}>
            <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: "#7c3aed" }}>★ Founder</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-3" style={{ letterSpacing: "-0.02em" }}>
            Je hebt volledige toegang.
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed mb-8">
            Als founder heb je Steve-niveau toegang tot alle functies van Weerzone, nu en na de lancering — zonder abonnement, zonder creditcard.
          </p>
          <Link href="/app" className="btn btn-primary btn-block btn-lg">
            Naar dashboard →
          </Link>
        </div>
        <WzFooter />
      </div>
    );
  }

  if (userTier === "reed" || userTier === "steve") {
    const p = PERSONAS[userTier];
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: PAGE_BG }}>
        <div style={{ ...GLASS_CARD, maxWidth: 480, width: "100%", padding: "clamp(32px,4vw,48px)", textAlign: "center" }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)" }}>
            <span className="text-[11px] font-black uppercase tracking-widest text-emerald-700">Actief abonnement</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-3" style={{ letterSpacing: "-0.02em" }}>
            Je bent {p.name}-abonnee.
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed mb-8">
            {p.tagline} Je hoeft niets te doen — alles staat klaar.
          </p>
          <Link href="/app" className="btn btn-primary btn-lg btn-block">Naar dashboard →</Link>
        </div>
        <WzFooter />
      </div>
    );
  }

  if (userTier === "piet") {
    const reed = PERSONAS.reed;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: PAGE_BG }}>
        <div style={{ ...GLASS_CARD, maxWidth: 520, width: "100%", padding: "clamp(24px,3vw,36px)" }}>
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4" style={{ background: "rgba(59,127,240,0.1)", border: "1px solid rgba(59,127,240,0.25)" }}>
              <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: "#3b7ff0" }}>Huidig abonnement</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 mb-2">Je bent Piet-abonnee.</h1>
            <p className="text-sm text-slate-500">Upgrade naar Reed voor persoonlijke weerswaarschuwingen.</p>
          </div>

          <div className="rounded-2xl p-5 relative" style={{ background: "rgba(59,127,240,0.06)", border: "2px solid #3b7ff0" }}>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest text-white" style={{ background: "#f59e0b" }}>★ Upgrade beschikbaar</span>
            </div>
            <div className="flex items-baseline gap-2 mb-1 mt-2">
              <span className="text-xl font-black text-slate-900">{reed.name}</span>
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">· {reed.label}</span>
            </div>
            <h3 className="text-base font-black text-slate-900 mb-2">{reed.tagline}</h3>
            <p className="text-sm text-slate-500 mb-4">{reed.description}</p>
            <div className="rounded-xl p-3 mb-4" style={{ background: "rgba(0,0,0,0.04)" }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg font-black text-slate-900">Gratis tijdens bèta</span>
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ background: "rgba(59,127,240,0.12)", color: "#3b7ff0" }}>bèta</span>
              </div>
              <p className="text-xs text-slate-400">Straks {formatPrice(reed.priceCents!)}/mnd — geen creditcard nodig</p>
            </div>
            <Link href="/app/checkout/reed" className="btn btn-primary btn-block btn-lg">Upgrade naar Reed →</Link>
            <ul className="mt-5 space-y-2">
              {reed.features.map((f, i) => (
                <li key={i} className="flex gap-2.5 items-start text-sm text-slate-500">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="shrink-0 mt-0.5">
                    <circle cx="9" cy="9" r="9" fill="rgba(59,127,240,0.12)" />
                    <path d="M5 9.5l2.5 2.5L13 6.5" stroke="#3b7ff0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="text-center mt-6">
            <Link href="/app" className="btn btn-link text-slate-400">Terug naar dashboard</Link>
          </div>
        </div>
        <WzFooter />
      </div>
    );
  }

  // Niet ingelogd: toon alle abonnementen
  return (
    <div className="min-h-screen" style={{ background: PAGE_BG }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "clamp(60px,8vw,100px) clamp(20px,4vw,48px) 48px" }}>

        {/* Hero */}
        <div className="text-center mb-14">
          <h1 className="text-white font-black mb-4" style={{ fontSize: "clamp(32px,5vw,52px)", letterSpacing: "-0.025em", lineHeight: 1.05 }}>
            Een abonnement op Weerzone
          </h1>
          <p className="mx-auto" style={{ maxWidth: 600, fontSize: "clamp(15px,1.6vw,17px)", color: "rgba(255,255,255,0.65)", lineHeight: 1.6 }}>
            Piet voor thuis, Reed voor waarschuwingen, Steve voor je zaak. Elke ochtend een korte weermail op jouw postcode. Geen reclame. Opzeggen kan maandelijks.
          </p>
          <p className="mt-3 text-[13px]" style={{ color: "rgba(255,255,255,0.4)" }}>
            Nu tijdelijk gratis te proberen.
          </p>
        </div>

        {/* Plans */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: 20, alignItems: "stretch" }}>
          {VISIBLE_TIERS.map((tier) => {
            const p = PERSONAS[tier];
            const highlight = tier === HIGHLIGHT;
            const unavailable = UNAVAILABLE.includes(tier);

            return (
              <div
                key={tier}
                style={{
                  ...GLASS_CARD,
                  padding: "clamp(20px,2.5vw,28px)",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  borderColor: highlight ? "#3b7ff0" : "rgba(255,255,255,0.5)",
                  boxShadow: highlight
                    ? "0 20px 50px rgba(59,127,240,.25), 0 0 0 2px #3b7ff0, inset 0 1px 0 rgba(255,255,255,0.8)"
                    : GLASS_CARD.boxShadow,
                  opacity: unavailable ? 0.6 : 1,
                }}
              >
                {highlight && (
                  <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)" }}>
                    <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest text-white" style={{ background: "#f59e0b", boxShadow: "0 4px 10px rgba(245,158,11,.35)" }}>
                      ★ Meest gekozen
                    </span>
                  </div>
                )}
                {unavailable && (
                  <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)" }}>
                    <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest" style={{ background: "rgba(0,0,0,0.12)", color: "rgba(0,0,0,0.4)", whiteSpace: "nowrap" }}>
                      Binnenkort beschikbaar
                    </span>
                  </div>
                )}

                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl font-black text-slate-900" style={{ letterSpacing: "-0.01em" }}>{p.name}</span>
                  <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">· {p.label}</span>
                </div>
                <h3 className="font-black text-slate-900 mb-3" style={{ fontSize: 17, lineHeight: 1.3, minHeight: 52 }}>{p.tagline}</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">{p.description}</p>

                <div className="rounded-xl p-3 mb-4" style={{ background: "rgba(0,0,0,0.04)" }}>
                  {unavailable ? (
                    <>
                      <div className="text-xl font-black text-slate-900 mb-1">{formatPrice(p.priceCents!)}/mnd</div>
                      <div className="text-xs text-slate-400">Nog niet beschikbaar — komt later in 2026</div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl font-black text-slate-900">Gratis tijdens bèta</span>
                        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ background: "rgba(59,127,240,0.12)", color: "#3b7ff0" }}>bèta</span>
                      </div>
                      <div className="text-xs text-slate-400">Straks {formatPrice(p.priceCents!)}/mnd — geen creditcard nodig</div>
                    </>
                  )}
                </div>

                {unavailable ? (
                  <button disabled className="btn btn-ghost btn-block btn-lg" style={{ opacity: 0.45, cursor: "not-allowed" }}>
                    Nog niet beschikbaar
                  </button>
                ) : (
                  <Link href={`/app/signup?tier=${tier}`} className={`btn btn-block btn-lg ${highlight ? "btn-primary" : "btn-ghost"}`}>
                    Aanmelden →
                  </Link>
                )}

                <ul className="mt-5 space-y-2 flex-1">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex gap-2.5 items-start text-sm text-slate-500">
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="shrink-0 mt-0.5">
                        <circle cx="9" cy="9" r="9" fill={highlight ? "rgba(59,127,240,0.12)" : "rgba(0,0,0,0.06)"} />
                        <path d="M5 9.5l2.5 2.5L13 6.5" stroke={highlight ? "#3b7ff0" : "#64748b"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-4 text-[13px] italic text-slate-400">{p.audience}</div>
              </div>
            );
          })}
        </div>

        {/* Zo werkt het */}
        <div style={{ marginTop: "clamp(56px,7vw,88px)" }}>
          <h2 className="text-white font-black text-center mb-8" style={{ fontSize: "clamp(26px,3vw,34px)", letterSpacing: "-0.02em" }}>
            Zo werkt het
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            {STEPS.map(([n, t, d]) => (
              <div key={n} style={{ ...GLASS_CARD, padding: 24 }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-white text-sm mb-4" style={{ background: "#3b7ff0" }}>{n}</div>
                <div className="font-black text-slate-900 mb-2" style={{ fontSize: 16 }}>{t}</div>
                <p className="text-sm text-slate-500 leading-relaxed">{d}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div style={{ marginTop: "clamp(56px,7vw,88px)" }}>
          <h2 className="text-white font-black text-center mb-8" style={{ fontSize: "clamp(26px,3vw,34px)", letterSpacing: "-0.02em" }}>
            Veelgestelde vragen
          </h2>
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            <FAQ items={FAQS} />
          </div>
        </div>
      </div>

      <WzFooter />
    </div>
  );
}

function FAQ({ items }: { items: Array<[string, string]> }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="space-y-2">
      {items.map(([q, a], i) => (
        <div key={i} style={{ ...GLASS_CARD, overflow: "hidden", padding: 0 }}>
          <button
            type="button"
            onClick={() => setOpen(open === i ? -1 : i)}
            className="w-full flex justify-between items-center gap-3 text-left"
            style={{ padding: "18px 20px", background: "transparent", border: 0, cursor: "pointer", font: "inherit" }}
          >
            <span className="font-black text-slate-900 text-sm">{q}</span>
            <span className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-black text-slate-400 shrink-0"
              style={{ background: "rgba(0,0,0,0.06)", transform: open === i ? "rotate(45deg)" : "rotate(0)", transition: "transform .2s" }}>+</span>
          </button>
          {open === i && (
            <div className="text-sm text-slate-500 leading-relaxed" style={{ padding: "0 20px 18px" }}>{a}</div>
          )}
        </div>
      ))}
    </div>
  );
}
