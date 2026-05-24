import type { Metadata } from "next";
import Link from "next/link";
import WeerzoneBackground from "@/components/WeerzoneBackground";

export const metadata: Metadata = {
  title: "About",
  description:
    "Weerzone is je persoonlijke weeragent voor de komende 48 uur. Piet geeft je dagelijkse heads-up, Reed helpt bij buien, wind en onweer, Koos helpt als je eropuit wilt.",
  alternates: { canonical: "https://weerzone.nl/over" },
  openGraph: {
    title: "About Weerzone",
    description:
      "Weerzone is je persoonlijke weeragent voor de komende 48 uur. Piet, Reed en Koos helpen je beslissen.",
    type: "website",
    locale: "nl_NL",
    url: "https://weerzone.nl/over",
    siteName: "WEERZONE",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Weerzone",
    description: "Je persoonlijke weeragent voor de komende 48 uur.",
  },
};

const AGENTS = [
  {
    key: "piet",
    name: "Piet",
    role: "Je dagelijkse heads-up",
    href: "/mijnweer",
    color: "#10b981",
    text:
      "Piet helpt je elke dag snel begrijpen wat slim is. Naar buiten, wachten of later beter. Met aandacht voor weekend, schooldag en de plekken die voor jou tellen.",
  },
  {
    key: "reed",
    name: "Reed",
    role: "Voor buien, wind en onweer",
    href: "/waarschuwingen",
    color: "#ef4444",
    text:
      "Reed is de scherpe laag boven Piet. Buienkans, wind, onweer en omslagmomenten — met timing en onzekerheid als die nog meespeelt.",
  },
  {
    key: "koos",
    name: "Koos",
    role: "Als je eropuit wilt",
    href: "/koos",
    color: "#f59e0b",
    text:
      "Koos vergelijkt jouw plekken met andere locaties en zoekt waar het de komende 48 uur het prettigst is. Voor een vrije dag, weekend of dagje weg.",
  },
] as const;

const FAQ_ITEMS = [
  {
    q: "Waarom kijkt Weerzone maar 48 uur vooruit?",
    a: "Omdat je daar echt iets aan hebt. Vandaag en morgen kun je nog plannen — fiets pakken, was buiten, terras open, klus uitstellen. Verder vooruit geeft richting, maar te weinig zekerheid om op te beslissen. Weerzone kiest voor bruikbaar boven indrukwekkend.",
  },
  {
    q: "Wat doet een agent eigenlijk?",
    a: "Een agent is een vaste rol in Weerzone die uit het weer een heads-up maakt: wat moet je hiermee doen? Piet doet je dagelijkse beslismomenten, Reed let op risico's, Koos kijkt waar het beter is. Geen open chat — een heads-up komt naar jou toe, niet andersom.",
  },
  {
    q: "Waarom geen heads-up als er niets bijzonders is?",
    a: "Omdat ruis even erg is als geen verwachting. Heeft Weerzone niets te zeggen, dan zie je rust: \"Geen heads-ups. Je weerbeeld is stabiel.\" Dat is geen fout, dat is het signaal dat je gewoon kunt doen wat je van plan was.",
  },
  {
    q: "Hoe werkt mijn locatie?",
    a: "Je kiest je plek via de locatieknop bovenin. Die wordt onthouden voor je volgende bezoek. In Mijn Weerzone kun je later meerdere plekken bewaren; alleen die plekken kijken Piet en Reed actief voor je in de gaten.",
  },
  {
    q: "Is Weerzone gratis?",
    a: "Tot augustus 2026 is Weerzone volledig gratis te gebruiken. We bepalen daarna welke functies in een betaald abonnement passen, op basis van wat mensen écht waardevol vinden.",
  },
  {
    q: "Hoe zit het met advertenties of partners?",
    a: "Weerzone heeft geen advertenties, affiliate-links, hotelboekingen of reisdeals. Het is één product met één doel: jou helpen kiezen voor de komende 48 uur. Andere business-modellen passen daar niet bij.",
  },
];

const JSON_LD = [
  {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About Weerzone",
    description:
      "Weerzone is je persoonlijke weeragent voor de komende 48 uur, met Piet, Reed en Koos.",
    url: "https://weerzone.nl/over",
    inLanguage: "nl-NL",
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  },
];

export default function OverPage() {
  return (
    <>
      <WeerzoneBackground />
      <main className="relative z-10 px-4 py-12 sm:py-16 text-white">
        {JSON_LD.map((schema, i) => (
          <script
            key={i}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}

        <div className="mx-auto max-w-3xl space-y-12">
          {/* Header */}
          <header className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/70">
              About
            </p>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white drop-shadow-sm leading-[1.05]">
              Het idee achter Weerzone
            </h1>
          </header>

          {/* Het idee — letterlijk uit de productdefinitie */}
          <section className="rounded-2xl border border-white/20 bg-white p-7 sm:p-10 shadow-sm">
            <p className="text-lg leading-relaxed text-slate-800">
              Weerzone is gebouwd vanuit één simpele gedachte:
              <br />
              je wilt niet alleen weten wat het weer wordt, je wilt weten wat
              je ermee moet doen.
            </p>
            <p className="mt-5 text-base leading-relaxed text-slate-700">
              Daarom kijkt Weerzone 48 uur vooruit met Piet, Reed en Koos.
              Piet geeft je dagelijkse heads-up. Reed helpt bij buien, wind en
              onweer. Koos helpt als je eropuit wilt.
            </p>
          </section>

          {/* Waarom gewone weerapps tekortschieten */}
          <section className="space-y-3">
            <h2 className="text-[10px] font-black uppercase tracking-[0.22em] text-white/70 px-1">
              Waarom gewone weerapps tekortschieten
            </h2>
            <div className="rounded-2xl border border-white/20 bg-white p-7 sm:p-9 shadow-sm">
              <p className="text-base leading-relaxed text-slate-800">
                De meeste weerapps geven je data. Tien dagen vooruit, vier
                modellen, zes grafieken — en dan zelf maar uitzoeken wat je
                vanavond doet. Weerzone draait die volgorde om. Je krijgt geen
                ruwe data om te ontcijferen, maar een korte heads-up over wat
                er ertoe doet, in jouw woorden, voor de komende 48 uur.
              </p>
              <p className="mt-4 text-base leading-relaxed text-slate-700">
                Geen advertenties, geen reisdeals, geen partners die mee
                willen praten. Eén product, één doel.
              </p>
            </div>
          </section>

          {/* Piet, Reed en Koos */}
          <section className="space-y-3">
            <h2 className="text-[10px] font-black uppercase tracking-[0.22em] text-white/70 px-1">
              Piet, Reed en Koos
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {AGENTS.map((agent) => (
                <Link
                  key={agent.key}
                  href={agent.href}
                  className="rounded-2xl border border-white/20 bg-white p-5 shadow-sm transition-transform hover:scale-[1.01]"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-full"
                      style={{ background: agent.color }}
                      aria-hidden
                    />
                    <span
                      className="text-[10px] font-black uppercase tracking-[0.2em]"
                      style={{ color: agent.color }}
                    >
                      {agent.name}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-bold text-slate-700">
                    {agent.role}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-700">
                    {agent.text}
                  </p>
                </Link>
              ))}
            </div>
            <p className="px-1 text-xs text-white/70">
              Later komt Steve voor zakelijke heads-ups.
            </p>
          </section>

          {/* Q&A */}
          <section id="faq" className="space-y-3">
            <h2 className="text-[10px] font-black uppercase tracking-[0.22em] text-white/70 px-1">
              Q&amp;A
            </h2>
            <div className="space-y-2">
              {FAQ_ITEMS.map(({ q, a }) => (
                <details
                  key={q}
                  className="group rounded-2xl border border-white/20 bg-white shadow-sm"
                >
                  <summary
                    className="flex cursor-pointer select-none list-none items-center justify-between gap-3 px-5 py-4"
                    style={{ WebkitUserSelect: "none" }}
                  >
                    <span className="text-sm font-black text-slate-900">{q}</span>
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-black text-slate-500 transition-transform group-open:rotate-45"
                      style={{ background: "rgba(0,0,0,0.06)" }}
                    >
                      +
                    </span>
                  </summary>
                  <div className="px-5 pb-5 text-sm leading-relaxed text-slate-700">
                    {a}
                  </div>
                </details>
              ))}
            </div>
          </section>

          {/* Juridisch */}
          <section className="space-y-3">
            <h2 className="text-[10px] font-black uppercase tracking-[0.22em] text-white/70 px-1">
              Juridisch
            </h2>
            <div className="rounded-2xl border border-white/20 bg-white p-5 shadow-sm">
              <ul className="space-y-2 text-sm font-bold text-slate-800">
                <li>
                  <Link href="/privacy" className="hover:text-slate-900 hover:underline">
                    Privacybeleid
                  </Link>
                </li>
                {/* Algemene voorwaarden en cookiebeleid komen in een latere fase. */}
              </ul>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
