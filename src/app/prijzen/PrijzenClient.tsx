"use client";

import { useState } from "react";
import Link from "next/link";
import { PERSONA_ORDER, type PersonaTier } from "@/lib/personas";
import PersonaCard from "@/components/PersonaCard";
import { displaySubCount } from "@/lib/social-proof";

const FAQS = [
  {
    q: "Waarom is het nu gratis?",
    a: "We zijn nog in opbouw. Je kunt je nu aanmelden zonder te betalen en zonder creditcard. Vroege aanmelders houden hun introductieprijs, ook als we binnenkort live gaan.",
  },
  {
    q: "Hoe werkt het precies?",
    a: "Je kiest een abonnement (Piet, Reed of Steve), vult je postcode in en een paar vragen over wat voor jou belangrijk is. Vanaf de volgende ochtend krijg je elke dag voor 7:00 een mail. Het dashboard is daarnaast altijd bereikbaar.",
  },
  {
    q: "Wat is het verschil tussen Piet, Reed en Steve?",
    a: "Piet schrijft een dagelijkse weermail voor thuis. Reed stuurt daarnaast alleen bericht als het weer over jouw drempel gaat (wind, regen, vorst). Steve doet hetzelfde voor bedrijven, inclusief advies per vestiging over openen, sluiten, inkopen of annuleren.",
  },
  {
    q: "Kan ik wisselen van abonnement?",
    a: "Ja. Je kunt maandelijks upgraden of downgraden via je account. Als je nu bij de eerste aanmeldingen zit, behoud je de lage aanmeldprijs van je nieuwe abonnement.",
  },
  {
    q: "Waarom maar 48 uur vooruit?",
    a: "Omdat een voorspelling verder dan 48 uur onbetrouwbaar wordt. Wij kiezen ervoor om ons te houden aan wat met het KNMI HARMONIE-model accuraat te zeggen is — 48 uur op een raster van 2,5 km.",
  },
  {
    q: "Hoe gaat de betaling straks?",
    a: "Via Mollie: iDEAL, creditcard of Bancontact. Je kunt per maand of per jaar betalen (bij een jaarabonnement op Piet of Reed krijg je twee maanden korting). Opzeggen kan op elk moment vanuit je account.",
  },
  {
    q: "Wat is het verschil met Buienradar of Weerplaza?",
    a: "Een abonnement op WEERZONE is reclamevrij en is afgestemd op jouw situatie: je postcode en de voorkeuren die je bij aanmelden hebt doorgegeven. Op de gratis homepage staan advertenties; die verdwijnen zodra je een abonnement hebt.",
  },
];

export default function PrijzenClient() {
  const [selected, setSelected] = useState<PersonaTier | null>(null);
  const subCount = displaySubCount(0);

  const handleSelect = (tier: PersonaTier) => {
    setSelected(tier);
    window.location.href = `/app/signup?tier=${tier}`;
  };

  return (
    <main className="min-h-screen py-12 px-4 bg-[#4a9ee8]">
      <div className="max-w-6xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 backdrop-blur mb-6 shadow-sm">
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: "#ef4444" }}
            />
            <span className="text-xs font-black text-text-primary uppercase tracking-wider">
              Nu nog gratis aanmelden
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-4 drop-shadow">
            Een abonnement op{" "}
            <span style={{ color: "#FFB400" }}>WEERZONE</span>
          </h1>

          <p className="text-base sm:text-lg text-white/90 max-w-2xl mx-auto mb-3">
            Piet voor thuis, Reed voor waarschuwingen, Steve voor je zaak.
            Elke ochtend een korte weermail op jouw postcode. Geen reclame.
            Opzeggen kan maandelijks.
          </p>
          <p className="text-sm text-white/80 max-w-xl mx-auto">
            Tijdelijk gratis. Vroege aanmelders houden hun introductieprijs, ook zodra we binnenkort live gaan.
          </p>

          <div className="inline-flex items-center justify-center gap-1.5 mt-5 px-5 py-2.5 rounded-full bg-white/90 backdrop-blur shadow-sm text-xs sm:text-sm">
            <strong className="text-text-primary">{subCount.toLocaleString("nl-NL")}</strong>
            <span className="text-text-secondary">Nederlanders staan al op de lijst</span>
          </div>
        </div>

        {/* Persona cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-16">
          {PERSONA_ORDER.map((tier) => (
            <PersonaCard
              key={tier}
              tier={tier}
              onSelect={handleSelect}
              highlighted={selected === tier}
            />
          ))}
        </div>

        {/* Hoe werkt het */}
        <div className="bg-white/90 backdrop-blur rounded-3xl p-6 sm:p-10 mb-12 shadow-xl">
          <h2 className="text-2xl sm:text-3xl font-black text-text-primary mb-6 text-center">
            Zo werkt het
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-accent-orange/15 text-accent-orange flex items-center justify-center mx-auto mb-3 font-black text-lg">
                1
              </div>
              <h3 className="font-black text-text-primary mb-1">Kies een abonnement</h3>
              <p className="text-sm text-text-secondary">
                Piet, Reed of Steve. Geen creditcard nodig. Opzeggen kan altijd.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-accent-orange/15 text-accent-orange flex items-center justify-center mx-auto mb-3 font-black text-lg">
                2
              </div>
              <h3 className="font-black text-text-primary mb-1">Vul je profiel in</h3>
              <p className="text-sm text-text-secondary">
                Postcode en een paar vragen (hond, fiets, kelder, vestiging). Alleen wat je kwijt wilt.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-accent-orange/15 text-accent-orange flex items-center justify-center mx-auto mb-3 font-black text-lg">
                3
              </div>
              <h3 className="font-black text-text-primary mb-1">Morgen om 7:00</h3>
              <p className="text-sm text-text-secondary">
                Je eerste mail in je inbox. Het dashboard staat altijd klaar.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white/90 backdrop-blur rounded-3xl p-6 sm:p-10 mb-12 shadow-xl">
          <h2 className="text-2xl sm:text-3xl font-black text-text-primary mb-6 text-center">
            Veelgestelde vragen
          </h2>
          <div className="space-y-4 max-w-3xl mx-auto">
            {FAQS.map((f) => (
              <details
                key={f.q}
                className="group bg-black/[0.03] rounded-xl p-4 hover:bg-black/[0.05] transition-colors"
              >
                <summary className="cursor-pointer font-bold text-text-primary text-sm sm:text-base list-none flex justify-between items-center">
                  <span>{f.q}</span>
                  <span className="text-accent-orange group-open:rotate-45 transition-transform text-xl font-light">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm text-text-secondary leading-relaxed">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </div>

        {/* Footer-CTA */}
        <div className="text-center">
          <p className="text-white/80 text-sm mb-4">
            Nog niet zeker? <Link href="/" className="underline font-bold hover:text-white">Terug naar homepage</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
