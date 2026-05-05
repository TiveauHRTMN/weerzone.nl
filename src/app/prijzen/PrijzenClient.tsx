"use client";

import { useState } from "react";
import Link from "next/link";
import { PERSONAS, formatPrice, type PersonaTier } from "@/lib/personas";
import { WzFooter } from "@/components/wz";
import WzAuthShell from "@/components/wz/WzAuthShell";

const VISIBLE_TIERS: PersonaTier[] = ["piet", "reed", "steve"];
const HIGHLIGHT: PersonaTier = "reed";
const UNAVAILABLE: PersonaTier[] = ["steve"];

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

export default function PrijzenClient({ userTier, isFounder }: Props) {
  // Founder/CEO: geen abonnement UI
  if (isFounder) {
    return (
      <WzAuthShell
        title={"Je hebt\nvolledige toegang."}
        subtitle="Als founder heb je Steve-niveau toegang tot alle functies van Weerzone, nu en na de lancering."
      >
        <div className="animate-in fade-in slide-in-from-right-4 duration-500 text-center py-4">
          <span className="badge sun" style={{ marginBottom: 24, display: "inline-flex" }}>★ Founder</span>
          <h1 className="h-1 mb-3">Alles staat klaar.</h1>
          <p className="t-body mb-8">
            Je hebt toegang tot Piet, Reed en Steve — zonder abonnement, zonder creditcard.
          </p>
          <Link href="/app" className="btn btn-primary btn-block btn-lg">
            Naar dashboard →
          </Link>
        </div>
      </WzAuthShell>
    );
  }

  // Ingelogd als Reed of Steve: al abonnee
  if (userTier === "reed" || userTier === "steve") {
    const p = PERSONAS[userTier];
    return (
      <div className="wz-page min-h-screen">
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "clamp(60px,8vw,100px) clamp(20px,4vw,48px)", textAlign: "center" }}>
          <span className="badge ok" style={{ marginBottom: 20 }}>Actief abonnement</span>
          <h1 className="h-1" style={{ marginBottom: 16 }}>Je bent {p.name}-abonnee.</h1>
          <p className="t-body" style={{ marginBottom: 32 }}>
            {p.tagline} Je hoeft niets te doen — alles staat klaar.
          </p>
          <Link href="/app" className="btn btn-primary btn-lg">Naar dashboard →</Link>
        </div>
        <WzFooter />
      </div>
    );
  }

  // Ingelogd als Piet: toon alleen upgrade naar Reed
  if (userTier === "piet") {
    const piet = PERSONAS.piet;
    const reed = PERSONAS.reed;
    return (
      <div className="wz-page min-h-screen">
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "clamp(60px,8vw,100px) clamp(20px,4vw,48px)" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <span className="badge brand" style={{ marginBottom: 16 }}>Huidig abonnement</span>
            <h1 className="h-1" style={{ marginBottom: 12 }}>Je bent Piet-abonnee.</h1>
            <p className="t-body">Upgrade naar Reed voor persoonlijke weerswaarschuwingen.</p>
          </div>

          {/* Upgrade card */}
          <div className="card" style={{
            padding: "clamp(20px,2.5vw,28px)", display: "flex", flexDirection: "column",
            position: "relative",
            borderColor: "var(--wz-brand)",
            boxShadow: "0 20px 50px rgba(59,127,240,.18), 0 0 0 2px var(--wz-brand)",
          }}>
            <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)" }}>
              <span className="badge sun" style={{ boxShadow: "0 4px 10px rgba(255,210,26,.35)" }}>
                ★ Upgrade beschikbaar
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 24, fontWeight: 800 }}>{reed.name}</span>
              <span className="t-micro">· {reed.label}</span>
            </div>
            <h3 className="h-3" style={{ marginBottom: 12, fontSize: 17 }}>{reed.tagline}</h3>
            <p className="t-body" style={{ marginBottom: 18, fontSize: 14 }}>{reed.description}</p>

            <div style={{ padding: "14px 16px", background: "var(--ink-050)", borderRadius: 12, marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                <span style={{ fontSize: 20, fontWeight: 800 }}>Gratis tijdens bèta</span>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 999,
                  background: "var(--wz-brand-soft)", color: "var(--wz-brand)",
                  letterSpacing: ".04em", textTransform: "uppercase",
                }}>bèta</span>
              </div>
              <div className="t-small">
                Straks {formatPrice(reed.priceCents!)}/mnd — geen creditcard nodig
              </div>
            </div>

            <Link href="/app/checkout/reed" className="btn btn-primary btn-block btn-lg">
              Upgrade naar Reed →
            </Link>

            <ul style={{ listStyle: "none", padding: 0, margin: "20px 0 0" }}>
              {reed.features.map((f, i) => (
                <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10, fontSize: 14, color: "var(--text-soft)" }}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flex: "0 0 auto", marginTop: 1 }}>
                    <circle cx="9" cy="9" r="9" fill="var(--wz-brand-soft)" />
                    <path d="M5 9.5l2.5 2.5L13 6.5" stroke="var(--wz-brand)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <div style={{ textAlign: "center", marginTop: 24 }}>
            <Link href="/app" className="btn btn-link">Terug naar dashboard</Link>
          </div>
        </div>
        <WzFooter />
      </div>
    );
  }

  // Niet ingelogd: toon alle abonnementen
  return (
    <div className="wz-page min-h-screen">

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "clamp(40px,6vw,80px) clamp(20px,4vw,48px) 48px" }}>

        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: "clamp(32px,4vw,56px)" }}>
          <h1 className="h-display" style={{ marginTop: 14, marginBottom: 14, fontSize: "clamp(32px,5vw,52px)" }}>
            Een abonnement op Weerzone
          </h1>
          <p className="t-body" style={{ maxWidth: 640, margin: "0 auto", fontSize: "clamp(15px,1.6vw,17px)" }}>
            Piet voor thuis, Reed voor waarschuwingen, Steve voor je zaak. Elke ochtend een korte weermail op jouw postcode. Geen reclame. Opzeggen kan maandelijks.
          </p>
          <p className="t-small" style={{ maxWidth: 560, margin: "16px auto 0" }}>
            Nu tijdelijk gratis te proberen.
          </p>
        </div>

        {/* Plans */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
          gap: 20,
          alignItems: "stretch",
        }}>
          {VISIBLE_TIERS.map((tier) => {
            const p = PERSONAS[tier];
            const highlight = tier === HIGHLIGHT;
            const unavailable = UNAVAILABLE.includes(tier);

            return (
              <div
                key={tier}
                className="card"
                style={{
                  padding: "clamp(20px,2.5vw,28px)",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  borderColor: highlight ? "var(--wz-brand)" : "var(--border)",
                  boxShadow: highlight
                    ? "0 20px 50px rgba(59,127,240,.18), 0 0 0 2px var(--wz-brand)"
                    : "var(--shadow-sm)",
                  opacity: unavailable ? 0.6 : 1,
                }}
              >
                {highlight && (
                  <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)" }}>
                    <span className="badge sun" style={{ boxShadow: "0 4px 10px rgba(255,210,26,.35)" }}>
                      ★ Meest gekozen
                    </span>
                  </div>
                )}
                {unavailable && (
                  <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)" }}>
                    <span className="badge" style={{ background: "var(--ink-200)", color: "var(--text-mute)", whiteSpace: "nowrap" }}>
                      Binnenkort beschikbaar
                    </span>
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-.01em" }}>{p.name}</span>
                  <span className="t-micro">· {p.label}</span>
                </div>

                <h3 className="h-3" style={{ marginBottom: 12, minHeight: 52, fontSize: 17 }}>
                  {p.tagline}
                </h3>
                <p className="t-body" style={{ marginBottom: 18, fontSize: 14 }}>
                  {p.description}
                </p>

                {/* Price box */}
                <div style={{ padding: "14px 16px", background: "var(--ink-050)", borderRadius: 12, marginBottom: 18 }}>
                  {unavailable ? (
                    <>
                      <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 2 }}>
                        {formatPrice(p.priceCents!)}/mnd
                      </div>
                      <div className="t-small">
                        Nog niet beschikbaar — komt later in 2026
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                        <span style={{ fontSize: 20, fontWeight: 800 }}>Gratis tijdens bèta</span>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 999,
                          background: "var(--wz-brand-soft)", color: "var(--wz-brand)",
                          letterSpacing: ".04em", textTransform: "uppercase",
                        }}>bèta</span>
                      </div>
                      <div className="t-small">
                        Straks {formatPrice(p.priceCents!)}/mnd — geen creditcard nodig
                      </div>
                    </>
                  )}
                </div>

                {unavailable ? (
                  <button disabled className="btn btn-ghost btn-block btn-lg" style={{ opacity: 0.45, cursor: "not-allowed" }}>
                    Nog niet beschikbaar
                  </button>
                ) : (
                  <Link
                    href={`/app/signup?tier=${tier}`}
                    className={`btn btn-block btn-lg ${highlight ? "btn-primary" : "btn-ghost"}`}
                  >
                    Aanmelden →
                  </Link>
                )}

                <ul style={{ listStyle: "none", padding: 0, margin: "20px 0 0" }}>
                  {p.features.map((f, i) => (
                    <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10, fontSize: 14, color: "var(--text-soft)" }}>
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flex: "0 0 auto", marginTop: 1 }}>
                        <circle cx="9" cy="9" r="9" fill={highlight ? "var(--wz-brand-soft)" : "var(--ink-100)"} />
                        <path d="M5 9.5l2.5 2.5L13 6.5" stroke={highlight ? "var(--wz-brand)" : "var(--text-soft)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                <div style={{ marginTop: "auto", paddingTop: 16, fontSize: 13, color: "var(--text-mute)", fontStyle: "italic" }}>
                  {p.audience}
                </div>
              </div>
            );
          })}
        </div>

        {/* Zo werkt het */}
        <div style={{ marginTop: "clamp(48px,6vw,80px)" }}>
          <h2 className="h-1" style={{ textAlign: "center", marginBottom: 32, fontSize: "clamp(26px,3vw,34px)" }}>
            Zo werkt het
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
            {STEPS.map(([n, t, d]) => (
              <div key={n} style={{ padding: 24, background: "#fff", borderRadius: 18, border: "1px solid var(--border)" }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: "var(--wz-brand)", color: "#fff",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 800, marginBottom: 14,
                }}>{n}</div>
                <div className="h-3" style={{ marginBottom: 6 }}>{t}</div>
                <p className="t-small">{d}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div style={{ marginTop: "clamp(48px,6vw,80px)" }}>
          <h2 className="h-1" style={{ textAlign: "center", marginBottom: 32, fontSize: "clamp(26px,3vw,34px)" }}>
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
    <div style={{ display: "grid", gap: 8 }}>
      {items.map(([q, a], i) => (
        <div key={i} className="card" style={{ overflow: "hidden", padding: 0 }}>
          <button
            type="button"
            onClick={() => setOpen(open === i ? -1 : i)}
            style={{
              width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
              gap: 12, padding: "18px 20px", background: "transparent", border: 0,
              cursor: "pointer", textAlign: "left", font: "inherit",
            }}
          >
            <span style={{ fontWeight: 700, fontSize: 15 }}>{q}</span>
            <span style={{
              width: 24, height: 24, borderRadius: "50%", background: "var(--ink-100)",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 800, flexShrink: 0,
              transform: open === i ? "rotate(45deg)" : "rotate(0)",
              transition: "transform .2s",
            }}>+</span>
          </button>
          {open === i && (
            <div style={{ padding: "0 20px 18px", color: "var(--text-soft)", fontSize: 14, lineHeight: 1.6 }}>
              {a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
