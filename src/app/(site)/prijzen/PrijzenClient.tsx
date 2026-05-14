"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, BellRing, BriefcaseBusiness, Check, CloudSun, ShieldCheck } from "lucide-react";
import WeatherDashboard from "@/components/WeatherDashboard";
import { PERSONAS, formatPrice, type PersonaTier } from "@/lib/personas";

const VISIBLE_TIERS: PersonaTier[] = ["piet", "reed", "steve"];
const HIGHLIGHT: PersonaTier = "reed";
const UNAVAILABLE: PersonaTier[] = ["steve"];

interface Props {
  userTier: PersonaTier | null;
  isFounder: boolean;
  initialWeatherCode?: number;
  initialIsDay?: boolean;
}

const FAQS: Array<[string, string]> = [
  ["Waarom is het nu gratis?", "WEERZONE zit in beta. Je kunt Piet en Reed proberen zonder creditcard, zodat we het product met echte gebruikers kunnen aanscherpen."],
  ["Wat is het verschil tussen Piet en Reed?", "Piet geeft je dagelijkse weerduiding. Reed voegt persoonlijke waarschuwingen toe wanneer wind, regen, onweer, hitte of vorst over jouw grens gaat."],
  ["Kan ik later wisselen?", "Ja. Je kunt later upgraden of downgraden. Tijdens de beta zit je nergens aan vast."],
  ["Waarom 48 uur vooruit?", "Omdat die periode bruikbaar is voor echte keuzes. Verder vooruit is vaak richting, geen planning."],
];

const TIER_META: Record<PersonaTier, { icon: React.ReactNode; accent: string; soft: string; href: string }> = {
  piet: {
    icon: <CloudSun className="h-5 w-5" />,
    accent: "#22c55e",
    soft: "rgba(34,197,94,0.10)",
    href: "/app/signup?tier=piet",
  },
  reed: {
    icon: <BellRing className="h-5 w-5" />,
    accent: "#ef4444",
    soft: "rgba(239,68,68,0.10)",
    href: "/app/signup?tier=reed",
  },
  steve: {
    icon: <BriefcaseBusiness className="h-5 w-5" />,
    accent: "#3b7ff0",
    soft: "rgba(59,127,240,0.12)",
    href: "/zakelijk",
  },
  karl: {
    icon: <CloudSun className="h-5 w-5" />,
    accent: "#22c55e",
    soft: "rgba(34,197,94,0.10)",
    href: "/app/signup?tier=karl",
  },
};

function PageShell({ children, initialWeatherCode, initialIsDay }: {
  children: React.ReactNode;
  initialWeatherCode?: number;
  initialIsDay?: boolean;
}) {
  return (
    <WeatherDashboard
      hideWeatherInfo
      initialWeatherCode={initialWeatherCode ?? 2}
      initialIsDay={initialIsDay ?? true}
      beforeFooter={children}
    />
  );
}

function StatusPage({
  label,
  title,
  body,
  href,
  initialWeatherCode,
  initialIsDay,
}: {
  label: string;
  title: string;
  body: string;
  href: string;
  initialWeatherCode?: number;
  initialIsDay?: boolean;
}) {
  return (
    <PageShell initialWeatherCode={initialWeatherCode} initialIsDay={initialIsDay}>
      <section className="card p-7 text-center">
        <p className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-blue-600">{label}</p>
        <h1 className="mb-3 text-2xl font-black tracking-tight text-text-primary">{title}</h1>
        <p className="mb-6 text-sm leading-6 text-text-secondary">{body}</p>
        <Link href={href} className="btn btn-primary btn-block">
          Naar dashboard <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </PageShell>
  );
}

export default function PrijzenClient({
  userTier,
  isFounder,
  initialWeatherCode,
  initialIsDay,
}: Props) {
  if (isFounder) {
    return (
      <StatusPage
        label="Founder"
        title="Je hebt volledige toegang."
        body="Als founder heb je volledige toegang tot alles wat WEERZONE te bieden heeft."
        href="/app"
        initialWeatherCode={initialWeatherCode}
        initialIsDay={initialIsDay}
      />
    );
  }

  if (userTier === "reed" || userTier === "steve") {
    const p = PERSONAS[userTier];
    return (
      <StatusPage
        label="Actief abonnement"
        title={`Je bent ${p.name}-abonnee.`}
        body={`${p.tagline} Alles staat klaar.`}
        href="/app"
        initialWeatherCode={initialWeatherCode}
        initialIsDay={initialIsDay}
      />
    );
  }

  return (
    <PageShell initialWeatherCode={initialWeatherCode} initialIsDay={initialIsDay}>
      <section className="space-y-5">
        <div className="card p-7 sm:p-9 text-center">
          <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">
            <ShieldCheck className="h-3.5 w-3.5" />
            Beta toegang
          </div>
          <h1 className="mx-auto max-w-xl text-3xl font-black leading-tight tracking-tight text-text-primary sm:text-4xl">
            Kies de weerhulp die bij je dag past.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-text-secondary">
            Piet voor dagelijkse duiding, Reed voor waarschuwingen op jouw drempels en Steve voor zakelijke beslissingen.
          </p>
          <div className="mt-6 grid gap-2 sm:grid-cols-3">
            {["Geen creditcard", "Reclamevrij", "48 uur vooruit"].map((item) => (
              <span key={item} className="rounded-2xl bg-slate-50 px-3 py-3 text-xs font-black text-slate-700">
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="relative left-1/2 w-[min(1120px,calc(100vw-32px))] -translate-x-1/2">
          <div className="mb-4 flex flex-col justify-between gap-2 px-1 sm:flex-row sm:items-end">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/70">Abonnementen</p>
              <h2 className="text-2xl font-black tracking-tight text-white">Piet, Reed en Steve naast elkaar.</h2>
            </div>
            <p className="max-w-md text-xs font-bold leading-5 text-white/65">
              Tijdens de beta start je gratis. Na de beta zie je vooraf de maandprijs.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {VISIBLE_TIERS.map((tier) => (
              <TierCard key={tier} tier={tier} />
            ))}
          </div>
        </div>

        <div className="card p-6 sm:p-7">
          <h2 className="mb-4 text-xl font-black tracking-tight text-text-primary">Veelgestelde vragen</h2>
          <FAQ items={FAQS} />
        </div>
      </section>
    </PageShell>
  );
}

function TierCard({ tier }: { tier: PersonaTier }) {
  const p = PERSONAS[tier];
  const meta = TIER_META[tier];
  const highlighted = tier === HIGHLIGHT;
  const unavailable = UNAVAILABLE.includes(tier);

  return (
    <article
      className={`card flex min-h-[560px] flex-col p-6 sm:p-7 ${
        highlighted ? "ring-4 ring-white/80" : ""
      } ${unavailable ? "opacity-85" : ""}`}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-2xl"
            style={{ background: meta.soft, color: meta.accent }}
          >
            {meta.icon}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">{p.label}</p>
            <h3 className="text-3xl font-black tracking-tight text-text-primary">{p.name}</h3>
          </div>
        </div>
        {highlighted && (
          <span className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white" style={{ background: meta.accent }}>
            Populair
          </span>
        )}
        {unavailable && (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
            Binnenkort
          </span>
        )}
      </div>

      <p className="min-h-[72px] text-sm font-semibold leading-6 text-text-secondary">{p.description}</p>

      <div className="my-5 rounded-3xl border border-slate-100 bg-slate-50 p-5">
        {unavailable ? (
          <>
            <p className="text-3xl font-black text-text-primary">{formatPrice(p.priceCents!)}</p>
            <p className="mt-1 text-xs font-bold text-text-muted">per maand, later in 2026</p>
          </>
        ) : (
          <>
            <p className="text-3xl font-black text-text-primary">Gratis</p>
            <p className="mt-1 text-xs font-bold text-text-muted">tijdens beta, daarna {formatPrice(p.priceCents!)}/mnd</p>
          </>
        )}
      </div>

      <Link
        href={unavailable ? meta.href : `/app/signup?tier=${tier}`}
        className={`btn btn-block btn-lg mb-6 ${highlighted ? "btn-primary" : "btn-ghost"}`}
        style={highlighted ? { background: meta.accent, boxShadow: `0 14px 32px ${meta.accent}33` } : undefined}
      >
        {unavailable ? "Bekijk zakelijk" : "Start gratis"}
        <ArrowRight className="h-4 w-4" />
      </Link>

      <ul className="space-y-3">
        {p.features.map((feature) => (
          <li key={feature} className="flex gap-3 text-sm font-semibold leading-5 text-text-secondary">
            <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: meta.accent }} />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <p className="mt-auto pt-6 text-xs font-bold leading-5 text-text-muted">{p.audience}</p>
    </article>
  );
}

function FAQ({ items }: { items: Array<[string, string]> }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="divide-y divide-slate-100">
      {items.map(([question, answer], index) => (
        <div key={question}>
          <button
            type="button"
            onClick={() => setOpen(open === index ? -1 : index)}
            className="flex w-full items-center justify-between gap-4 py-4 text-left"
          >
            <span className="text-sm font-black text-text-primary">{question}</span>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-lg font-black text-text-muted">
              {open === index ? "-" : "+"}
            </span>
          </button>
          {open === index && (
            <p className="pb-4 text-sm leading-6 text-text-secondary">{answer}</p>
          )}
        </div>
      ))}
    </div>
  );
}
