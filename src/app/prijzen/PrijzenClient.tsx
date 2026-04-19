"use client";

import { useState } from "react";
import Link from "next/link";
import { PERSONA_ORDER, FOUNDER_SLOTS, daysUntilLaunch, type PersonaTier } from "@/lib/personas";
import PersonaCard from "@/components/PersonaCard";

const FAQS = [
  {
    q: "Wat is dat 'founder'-verhaal precies?",
    a: "Simpel: iedereen die vóór 1 juni 2026 instapt betaalt de founder-prijs. Voor altijd. Ook als we over twee jaar de normale prijs verdubbelen — jij blijft op jouw tarief zitten, zolang je abonnement doorloopt.",
  },
  {
    q: "Kan ik wisselen tussen Piet, Reed en Steve?",
    a: "Ja, gewoon. Upgrade of downgrade kan maandelijks via je account. De founder-lock gaat mee: je betaalt de founder-prijs van je nieuwe tier, niet het nieuwe volle tarief.",
  },
  {
    q: "Waarom is het nu gratis?",
    a: "Tot 1 juni 2026 bouwen we door. Wie nu meedoet helpt ons uitvinden wat wel en niet werkt. Wisselgeld: gratis tot de launch, daarna de founder-prijs vastgeklikt. Geen creditcard vooraf, geen automatische incasso-verrassing.",
  },
  {
    q: "En die 14-daagse dan?",
    a: "Daar doen we niet aan. Alles voorbij 48 uur is gokken met een zonnetje erop — geen app die beweert dat 'ie het zaterdag over twaalf dagen al weet, spreekt de waarheid. Wij houden ons bij wat bewezen klopt: 48 uur vooruit op jouw GPS-punt.",
  },
  {
    q: "Hoe ga ik betalen vanaf 1 juni?",
    a: "Via Mollie. iDEAL, creditcard, Bancontact. Maand of jaar (jaar = twee maanden gratis op Piet en Reed). Opzeggen? Eén klik in je account. Geen belcentrum, geen formulier, geen drempel.",
  },
  {
    q: "Wat kan WEERZONE wat Buienradar niet kan?",
    a: "Buienradar kent je niet. Weeronline ook niet. Wij wél: dat je hond om half acht uit moet, dat je kelder bij 40 mm onderloopt, dat je strandtent bij windkracht 6 dichtgaat. Dat verschil zit in één mail, elke ochtend — niet in een pushmelding die je negeert.",
  },
];

export default function PrijzenClient() {
  const [selected, setSelected] = useState<PersonaTier | null>(null);
  const days = daysUntilLaunch();

  const handleSelect = (tier: PersonaTier) => {
    setSelected(tier);
    window.location.href = `/app/onboarding?tier=${tier}`;
  };

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 backdrop-blur mb-6 shadow-sm">
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: "#ef4444" }}
            />
            <span className="text-xs font-black text-text-primary uppercase tracking-wider">
              Tijdelijk gratis · nog {days} dagen
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-4 drop-shadow">
            Drie personen. <br />
            <span style={{ background: "linear-gradient(90deg, #22c55e, #ef4444, #3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Één eerlijk weerbericht.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-white/90 max-w-2xl mx-auto mb-3">
            Piet voor thuis. Reed voor als het misgaat. Steve voor je bedrijf.
            Alle drie kennen je locatie op de meter, je leven in grote lijnen, en
            je drempels tot op de millimeter.
          </p>
          <p className="text-sm text-white/80 max-w-xl mx-auto">
            Slechts <strong>{FOUNDER_SLOTS}</strong> founder-plekken per persona. Wie er vroeg bij is, betaalt die prijs voor altijd.
          </p>
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
            Zo ziet morgenochtend eruit
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-accent-orange/15 text-accent-orange flex items-center justify-center mx-auto mb-3 font-black text-lg">
                1
              </div>
              <h3 className="font-black text-text-primary mb-1">Kies je type</h3>
              <p className="text-sm text-text-secondary">
                Piet, Reed of Steve. Alle drie gratis tot 1 juni. Geen creditcard.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-accent-orange/15 text-accent-orange flex items-center justify-center mx-auto mb-3 font-black text-lg">
                2
              </div>
              <h3 className="font-black text-text-primary mb-1">Vertel wie je bent</h3>
              <p className="text-sm text-text-secondary">
                Locatie, hond, fiets, kelder, bedrijf — hoe meer je kwijt wil, hoe scherper de brief.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-accent-orange/15 text-accent-orange flex items-center justify-center mx-auto mb-3 font-black text-lg">
                3
              </div>
              <h3 className="font-black text-text-primary mb-1">Morgen om zeven uur</h3>
              <p className="text-sm text-text-secondary">
                Je eerste brief in je inbox. Dashboard altijd bij de hand.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white/90 backdrop-blur rounded-3xl p-6 sm:p-10 mb-12 shadow-xl">
          <h2 className="text-2xl sm:text-3xl font-black text-text-primary mb-6 text-center">
            Vragen die je waarschijnlijk hebt
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
