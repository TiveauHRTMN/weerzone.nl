"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { PERSONAS, formatPrice, type PersonaTier } from "@/lib/personas";
import Footer from "@/components/Footer";
import NavBar from "@/components/NavBar";
import { loadWeather } from "@/lib/weatherCache";

const WeatherBackground = dynamic(() => import("@/components/WeatherBackground"));

const VISIBLE_TIERS: PersonaTier[] = ["piet", "reed", "steve"];
const HIGHLIGHT: PersonaTier = "reed";
const UNAVAILABLE: PersonaTier[] = ["steve"];

interface Props {
  userTier: PersonaTier | null;
  isFounder: boolean;
  initialWeatherCode?: number;
  initialIsDay?: boolean;
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

function PageShell({ children, initialWeatherCode = 2, initialIsDay = true }: { children: React.ReactNode; initialWeatherCode?: number; initialIsDay?: boolean }) {
  const [weatherCode, setWeatherCode] = useState(initialWeatherCode);
  const [isDay, setIsDay] = useState(initialIsDay);

  useEffect(() => {
    let cancelled = false;
    let lat = 52.1, lon = 5.18; // De Bilt default
    try {
      const saved = localStorage.getItem("wz_city");
      if (saved) {
        const city = JSON.parse(saved);
        if (city && typeof city.lat === "number" && typeof city.lon === "number") {
          lat = city.lat;
          lon = city.lon;
        }
      }
    } catch {}
    loadWeather(lat, lon).then((w) => {
      if (!cancelled && w) {
        setWeatherCode(w.current.weatherCode);
        setIsDay(w.current.isDay);
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <WeatherBackground weatherCode={weatherCode} isDay={isDay} />
      <div className="relative z-10 pt-24">
        {children}
      </div>
    </div>
  );
}

export default function PrijzenClient({ userTier, isFounder, initialWeatherCode, initialIsDay }: Props) {
  const shellProps = { initialWeatherCode, initialIsDay };

  if (isFounder) {
    return (
      <PageShell {...shellProps}>
        <div className="min-h-screen flex flex-col items-center justify-center p-6">
          <div className="card p-10 text-center w-full" style={{ maxWidth: 420 }}>
            <div className="flex items-center justify-center gap-2 mb-5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#8b5cf6" }} />
              <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: "#8b5cf6" }}>★ Founder</span>
            </div>
            <h1 className="text-2xl font-black text-text-primary mb-3" style={{ letterSpacing: "-0.02em" }}>
              Je hebt volledige toegang.
            </h1>
            <p className="text-sm text-text-muted leading-relaxed mb-8">
              Als founder heb je Steve-niveau toegang tot alle functies van Weerzone, nu en na de lancering — zonder abonnement, zonder creditcard.
            </p>
            <Link href="/app" className="btn btn-primary btn-block btn-lg">Naar dashboard →</Link>
          </div>
        </div>
        <div className="max-w-2xl mx-auto w-full"><Footer /></div>
      </PageShell>
    );
  }

  if (userTier === "reed" || userTier === "steve") {
    const p = PERSONAS[userTier];
    return (
      <PageShell {...shellProps}>
        <div className="min-h-screen flex flex-col items-center justify-center p-6">
          <div className="card p-10 text-center w-full" style={{ maxWidth: 460 }}>
            <div className="flex items-center justify-center gap-2 mb-5">
              <span className="w-2 h-2 rounded-full bg-accent-green" />
              <span className="text-[11px] font-black uppercase tracking-widest text-accent-green">Actief abonnement</span>
            </div>
            <h1 className="text-2xl font-black text-text-primary mb-3">Je bent {p.name}-abonnee.</h1>
            <p className="text-sm text-text-muted leading-relaxed mb-8">{p.tagline} Alles staat klaar.</p>
            <Link href="/app" className="btn btn-primary btn-lg btn-block">Naar dashboard →</Link>
          </div>
        </div>
        <div className="max-w-2xl mx-auto w-full"><Footer /></div>
      </PageShell>
    );
  }

  if (userTier === "piet") {
    const reed = PERSONAS.reed;
    return (
      <PageShell {...shellProps}>
        <div className="min-h-screen flex flex-col items-center justify-center p-6">
          <div className="card w-full" style={{ maxWidth: 500, padding: "clamp(24px,3vw,36px)" }}>
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-accent-cyan" />
                <span className="text-[11px] font-black uppercase tracking-widest text-text-muted">Huidig abonnement</span>
              </div>
              <h1 className="text-2xl font-black text-text-primary mb-2">Je bent Piet-abonnee.</h1>
              <p className="text-sm text-text-muted">Upgrade naar Reed voor persoonlijke weerswaarschuwingen.</p>
            </div>

            <div className="rounded-3xl p-5 relative" style={{ border: "2px solid var(--persona-reed)", background: "rgba(239,68,68,0.04)" }}>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest text-white bg-accent-amber shadow-md">★ Upgrade beschikbaar</span>
              </div>
              <div className="flex items-baseline gap-2 mb-1 mt-2">
                <span className="text-xl font-black text-text-primary">{reed.name}</span>
                <span className="text-[11px] font-black uppercase tracking-wider text-text-muted">· {reed.label}</span>
              </div>
              <h3 className="font-black text-text-primary mb-2" style={{ fontSize: 16 }}>{reed.tagline}</h3>
              <p className="text-sm text-text-muted mb-4">{reed.description}</p>
              <div className="rounded-2xl p-3 mb-4" style={{ background: "rgba(0,0,0,0.04)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg font-black text-text-primary">Gratis tijdens bèta</span>
                  <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-accent-cyan/10 text-accent-cyan">bèta</span>
                </div>
                <p className="text-xs text-text-muted">Straks {formatPrice(reed.priceCents!)}/mnd — geen creditcard nodig</p>
              </div>
              <Link href="/app/checkout/reed" className="btn btn-primary btn-block btn-lg">Upgrade naar Reed →</Link>
              <ul className="mt-4 space-y-2">
                {reed.features.map((f, i) => (
                  <li key={i} className="flex gap-2.5 items-start text-sm text-text-muted">
                    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" className="shrink-0 mt-0.5">
                      <circle cx="9" cy="9" r="9" fill="rgba(239,68,68,0.1)" />
                      <path d="M5 9.5l2.5 2.5L13 6.5" stroke="var(--persona-reed)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="text-center mt-5">
              <Link href="/app" className="btn btn-link text-text-muted">Terug naar dashboard</Link>
            </div>
          </div>
        </div>
        <div className="max-w-2xl mx-auto w-full"><Footer /></div>
      </PageShell>
    );
  }

  // Niet ingelogd: toon alle abonnementen
  return (
    <PageShell {...shellProps}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "clamp(60px,8vw,100px) clamp(20px,4vw,48px) 0" }}>

        {/* Hero */}
        <div className="text-center mb-14">
          <h1 className="text-white font-black mb-4" style={{ fontSize: "clamp(32px,5vw,52px)", letterSpacing: "-0.025em", lineHeight: 1.05, textShadow: "0 2px 20px rgba(0,0,0,0.15)" }}>
            Een abonnement op Weerzone
          </h1>
          <p className="mx-auto" style={{ maxWidth: 600, fontSize: "clamp(15px,1.6vw,17px)", color: "rgba(255,255,255,0.8)", lineHeight: 1.6 }}>
            Piet voor thuis, Reed voor waarschuwingen, Steve voor je zaak. Elke ochtend een korte weermail op jouw postcode. Geen reclame. Opzeggen kan maandelijks.
          </p>
          <p className="mt-3 text-[13px]" style={{ color: "rgba(255,255,255,0.55)" }}>
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
                className="card"
                style={{
                  padding: "clamp(20px,2.5vw,28px)",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  borderColor: highlight ? "var(--wz-brand)" : undefined,
                  boxShadow: highlight
                    ? "0 20px 50px rgba(59,127,240,.2), 0 0 0 2px var(--wz-brand), inset 0 1px 0 rgba(255,255,255,0.6)"
                    : undefined,
                  opacity: unavailable ? 0.6 : 1,
                }}
              >
                {highlight && (
                  <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)" }}>
                    <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest text-white bg-accent-amber" style={{ boxShadow: "0 4px 10px rgba(245,158,11,.35)", whiteSpace: "nowrap" }}>
                      ★ Meest gekozen
                    </span>
                  </div>
                )}
                {unavailable && (
                  <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)" }}>
                    <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest text-text-muted" style={{ background: "rgba(0,0,0,0.08)", whiteSpace: "nowrap" }}>
                      Binnenkort beschikbaar
                    </span>
                  </div>
                )}

                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl font-black text-text-primary" style={{ letterSpacing: "-0.01em" }}>{p.name}</span>
                  <span className="text-[11px] font-black uppercase tracking-widest text-text-muted">· {p.label}</span>
                </div>
                <h3 className="font-black text-text-primary mb-3" style={{ fontSize: 17, lineHeight: 1.3, minHeight: 52 }}>{p.tagline}</h3>
                <p className="text-sm text-text-muted leading-relaxed mb-4">{p.description}</p>

                <div className="rounded-2xl p-3 mb-4" style={{ background: "rgba(0,0,0,0.04)" }}>
                  {unavailable ? (
                    <>
                      <div className="text-lg font-black text-text-primary mb-1">{formatPrice(p.priceCents!)}/mnd</div>
                      <div className="text-xs text-text-muted">Nog niet beschikbaar — komt later in 2026</div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg font-black text-text-primary">Gratis tijdens bèta</span>
                        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ background: "var(--wz-brand-soft)", color: "var(--wz-brand)" }}>bèta</span>
                      </div>
                      <div className="text-xs text-text-muted">Straks {formatPrice(p.priceCents!)}/mnd — geen creditcard nodig</div>
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
                    <li key={i} className="flex gap-2.5 items-start text-sm text-text-muted">
                      <svg width="16" height="16" viewBox="0 0 18 18" fill="none" className="shrink-0 mt-0.5">
                        <circle cx="9" cy="9" r="9" fill={highlight ? "var(--wz-brand-soft)" : "rgba(0,0,0,0.06)"} />
                        <path d="M5 9.5l2.5 2.5L13 6.5" stroke={highlight ? "var(--wz-brand)" : "var(--text-muted)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-4 text-[13px] italic text-text-muted">{p.audience}</div>
              </div>
            );
          })}
        </div>

        {/* Zo werkt het */}
        <div style={{ marginTop: "clamp(56px,7vw,88px)" }}>
          <h2 className="text-white font-black text-center mb-8" style={{ fontSize: "clamp(26px,3vw,34px)", letterSpacing: "-0.02em", textShadow: "0 2px 16px rgba(0,0,0,0.12)" }}>
            Zo werkt het
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            {STEPS.map(([n, t, d]) => (
              <div key={n} className="card p-6">
                <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-white text-sm mb-4" style={{ background: "var(--wz-brand)" }}>{n}</div>
                <div className="font-black text-text-primary mb-2" style={{ fontSize: 16 }}>{t}</div>
                <p className="text-sm text-text-muted leading-relaxed">{d}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div style={{ marginTop: "clamp(56px,7vw,88px)" }}>
          <h2 className="text-white font-black text-center mb-8" style={{ fontSize: "clamp(26px,3vw,34px)", letterSpacing: "-0.02em", textShadow: "0 2px 16px rgba(0,0,0,0.12)" }}>
            Veelgestelde vragen
          </h2>
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            <FAQ items={FAQS} />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto w-full"><Footer /></div>
    </PageShell>
  );
}

function FAQ({ items }: { items: Array<[string, string]> }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="space-y-2 mt-0 pb-20">
      {items.map(([q, a], i) => (
        <div key={i} className="card" style={{ overflow: "hidden", padding: 0 }}>
          <button
            type="button"
            onClick={() => setOpen(open === i ? -1 : i)}
            className="w-full flex justify-between items-center gap-3 text-left"
            style={{ padding: "18px 20px", background: "transparent", border: 0, cursor: "pointer", font: "inherit" }}
          >
            <span className="font-black text-text-primary text-sm">{q}</span>
            <span className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-black text-text-muted shrink-0"
              style={{ background: "rgba(0,0,0,0.06)", transform: open === i ? "rotate(45deg)" : "rotate(0)", transition: "transform .2s" }}>+</span>
          </button>
          {open === i && (
            <div className="text-sm text-text-muted leading-relaxed" style={{ padding: "0 20px 18px" }}>{a}</div>
          )}
        </div>
      ))}
    </div>
  );
}
