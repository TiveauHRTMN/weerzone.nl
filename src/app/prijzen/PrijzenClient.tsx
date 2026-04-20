"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Plus } from "lucide-react";
import { PERSONAS, PERSONA_ORDER, formatPrice, type PersonaTier } from "@/lib/personas";
import { WzNavbar, WzFooter } from "@/components/wz";
import { displaySubCount } from "@/lib/social-proof";

const HIGHLIGHT: PersonaTier = "reed";
const BADGES: Partial<Record<PersonaTier, string>> = { reed: "Meest gekozen" };

const STEPS: Array<[string, string, string]> = [
  ["1", "Kies een abonnement", "Piet, Reed of Steve. Geen creditcard nodig. Opzeggen kan altijd."],
  [
    "2",
    "Vul je profiel in",
    "Postcode en een paar vragen (hond, fiets, kelder, vestiging). Alleen wat je kwijt wilt.",
  ],
  ["3", "Morgen om 7:00", "Je eerste mail in je inbox. Het dashboard staat altijd klaar."],
];

const FAQS: Array<[string, string]> = [
  [
    "Waarom is het nu gratis?",
    "We zijn nog in opbouw. Je kunt je nu aanmelden zonder te betalen en zonder creditcard. Vroege aanmelders houden hun introductieprijs, ook als we binnenkort live gaan.",
  ],
  [
    "Wat is het verschil tussen Piet, Reed en Steve?",
    "Piet schrijft een dagelijkse weermail voor thuis. Reed stuurt daarnaast alleen bericht als het weer over jouw drempel gaat. Steve doet hetzelfde voor bedrijven, inclusief advies per vestiging over openen, sluiten, inkopen of annuleren.",
  ],
  [
    "Kan ik wisselen van abonnement?",
    "Ja. Je kunt maandelijks upgraden of downgraden via je account. Als je nu bij de eerste aanmeldingen zit, behoud je de lage aanmeldprijs van je nieuwe abonnement.",
  ],
  [
    "Waarom maar 48 uur vooruit?",
    "Omdat een voorspelling verder dan 48 uur onbetrouwbaar wordt. Wij houden ons aan wat met het KNMI HARMONIE-model accuraat te zeggen is — 48 uur op een raster van 2,5 km.",
  ],
  [
    "Hoe gaat de betaling straks?",
    "Via Mollie: iDEAL, creditcard of Bancontact. Per maand of per jaar (jaar: twee maanden korting). Opzeggen kan op elk moment vanuit je account.",
  ],
  [
    "Wat is het verschil met Buienradar of Weerplaza?",
    "Weerzone is reclamevrij en is afgestemd op jouw situatie: je postcode en de voorkeuren die je bij aanmelden hebt doorgegeven.",
  ],
];

export default function PrijzenClient() {
  const subCount = displaySubCount(0);

  return (
    <div className="wz-page min-h-screen">
      <WzNavbar />

      <div className="max-w-[1200px] mx-auto px-5 md:px-12 pt-12 md:pt-20 pb-12">
        {/* Hero */}
        <div className="text-center mb-10 md:mb-14">
          <span className="wz-badge-sun">★ Nu nog gratis aanmelden</span>
          <h1 className="wz-h-display mt-4 mb-4" style={{ fontSize: "clamp(32px, 5vw, 52px)" }}>
            Een abonnement op Weerzone
          </h1>
          <p className="wz-body max-w-[640px] mx-auto">
            Piet voor thuis, Reed voor waarschuwingen, Steve voor je zaak. Elke ochtend een korte
            weermail op jouw postcode. Geen reclame. Opzeggen kan maandelijks.
          </p>
          <p className="wz-small max-w-[560px] mx-auto mt-4">
            Tijdelijk gratis. Vroege aanmelders houden hun introductieprijs, ook zodra we binnenkort
            live gaan.
          </p>
          <div
            className="inline-flex items-center gap-2.5 mt-5 px-4 py-2 rounded-full bg-white"
            style={{ border: "1px solid var(--wz-border)" }}
          >
            <span className="font-extrabold text-[15px]">
              {subCount.toLocaleString("nl-NL")}
            </span>
            <span className="text-[13px]" style={{ color: "var(--wz-text-mute)" }}>
              Nederlanders staan al op de lijst
            </span>
          </div>
        </div>

        {/* Plans */}
        <div
          className="grid gap-5 items-stretch"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))" }}
        >
          {PERSONA_ORDER.map((tier) => {
            const p = PERSONAS[tier];
            const highlight = tier === HIGHLIGHT;
            const badge = BADGES[tier];
            return (
              <div
                key={tier}
                className="wz-card relative flex flex-col"
                style={{
                  padding: "clamp(20px, 2.5vw, 28px)",
                  borderColor: highlight ? "var(--wz-brand)" : "var(--wz-border)",
                  boxShadow: highlight
                    ? "0 20px 50px rgba(59,127,240,.18), 0 0 0 2px var(--wz-brand)"
                    : "var(--wz-shadow-sm)",
                }}
              >
                {badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span
                      className="wz-badge-sun"
                      style={{ boxShadow: "0 4px 10px rgba(255,210,26,.35)" }}
                    >
                      ★ {badge}
                    </span>
                  </div>
                )}
                <div className="flex items-baseline gap-2.5 mb-1.5">
                  <span className="text-2xl font-extrabold tracking-tight">{p.name}</span>
                  <span className="wz-micro">· {p.label}</span>
                </div>
                <h3 className="wz-h-3 mb-3" style={{ minHeight: 52, fontSize: 17 }}>
                  {p.tagline}
                </h3>
                <p className="wz-body mb-4" style={{ fontSize: 14 }}>
                  {p.description}
                </p>

                <div
                  className="rounded-xl mb-4 px-4 py-3.5"
                  style={{ background: "var(--ink-050)" }}
                >
                  <div className="text-[13px] mb-0.5" style={{ color: "var(--wz-text-mute)" }}>
                    {formatPrice(p.priceCents)}/mnd, binnenkort
                  </div>
                  <div className="text-[15px] font-bold">
                    Introductieprijs: {formatPrice(p.founderPriceCents)}/mnd{" "}
                    <span style={{ color: "var(--wz-text-mute)", fontWeight: 500 }}>
                      · vastgezet
                    </span>
                  </div>
                </div>

                <Link
                  href={`/app/signup?tier=${tier}`}
                  className={`wz-btn wz-btn-block wz-btn-lg ${
                    highlight ? "wz-btn-primary" : "wz-btn-ghost"
                  }`}
                >
                  Aanmelden →
                </Link>

                <ul className="list-none p-0 mt-5 mb-0">
                  {p.features.map((f, i) => (
                    <li
                      key={i}
                      className="flex gap-2.5 items-start mb-2.5 text-[14px]"
                      style={{ color: "var(--wz-text-soft)" }}
                    >
                      <span
                        className="inline-flex items-center justify-center rounded-full flex-none mt-[1px]"
                        style={{
                          width: 18,
                          height: 18,
                          background: highlight ? "var(--wz-brand-soft)" : "var(--ink-100)",
                          color: highlight ? "var(--wz-brand)" : "var(--wz-text-soft)",
                        }}
                      >
                        <Check className="w-3 h-3" strokeWidth={2.5} />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                <div
                  className="mt-auto pt-4 text-[13px] italic"
                  style={{ color: "var(--wz-text-mute)" }}
                >
                  {p.audience}
                </div>
              </div>
            );
          })}
        </div>

        {/* How it works */}
        <div className="mt-12 md:mt-20">
          <h2 className="wz-h-1 text-center mb-8" style={{ fontSize: "clamp(26px, 3vw, 34px)" }}>
            Zo werkt het
          </h2>
          <div
            className="grid gap-5"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}
          >
            {STEPS.map(([n, t, d]) => (
              <div
                key={n}
                className="p-6 rounded-[18px] bg-white"
                style={{ border: "1px solid var(--wz-border)" }}
              >
                <div
                  className="inline-flex items-center justify-center font-extrabold mb-3.5"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "var(--wz-blue)",
                    color: "#fff",
                  }}
                >
                  {n}
                </div>
                <div className="wz-h-3 mb-1.5">{t}</div>
                <p className="wz-small">{d}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-12 md:mt-20">
          <h2 className="wz-h-1 text-center mb-8" style={{ fontSize: "clamp(26px, 3vw, 34px)" }}>
            Veelgestelde vragen
          </h2>
          <div className="max-w-[760px] mx-auto">
            <FAQ items={FAQS} />
          </div>
        </div>

        <div className="text-center mt-10">
          <p className="wz-small">
            Nog niet zeker?{" "}
            <Link href="/" className="underline font-bold" style={{ color: "var(--wz-brand)" }}>
              Terug naar homepage
            </Link>
          </p>
        </div>
      </div>

      <WzFooter />
    </div>
  );
}

function FAQ({ items }: { items: Array<[string, string]> }) {
  const [open, setOpen] = useState<number>(0);
  return (
    <div className="grid gap-2">
      {items.map(([q, a], i) => (
        <div key={i} className="wz-card overflow-hidden" style={{ padding: 0 }}>
          <button
            type="button"
            onClick={() => setOpen(open === i ? -1 : i)}
            className="w-full flex justify-between items-center gap-3 px-5 py-4 bg-transparent border-0 cursor-pointer text-left"
            style={{ font: "inherit" }}
          >
            <span className="font-bold text-[15px]">{q}</span>
            <span
              className="inline-flex items-center justify-center rounded-full font-extrabold"
              style={{
                width: 24,
                height: 24,
                background: "var(--ink-100)",
                transform: open === i ? "rotate(45deg)" : "rotate(0)",
                transition: "transform .2s",
              }}
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
            </span>
          </button>
          {open === i && (
            <div
              className="px-5 pb-4 text-[14px] leading-relaxed"
              style={{ color: "var(--wz-text-soft)" }}
            >
              {a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
