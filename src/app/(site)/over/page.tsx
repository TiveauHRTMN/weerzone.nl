import type { Metadata } from "next";
import Link from "next/link";
import WeerzoneBackground from "@/components/WeerzoneBackground";
import { hreflangCluster } from "@/lib/hreflang";

export const metadata: Metadata = {
  title: { absolute: "Over Weerzone - zo werkt het" },
  description: "Lees hoe Mariana, Piet, Reed en Koos het lokale weer voor vandaag en morgen bruikbaar maken.",
  alternates: { canonical: "https://weerzone.nl/over", languages: hreflangCluster({ nl: "/over" }) },
};

const MARIANA_PARTS = [
  ["Mariana Local", "Kijkt naar jouw locatie en wat daar de komende uren verandert."],
  ["Mariana Regions", "Herkent verschillen tussen kust, stad, polder en binnenland."],
  ["Mariana Oracle", "Weegt verwachtingen en onzekerheid tegen elkaar af."],
  ["Mariana Tesla", "Let extra scherp op snel ontwikkelend onweer en zware buien."],
] as const;

const LAYERS = [
  ["Piet", "Vertaalt de verwachting naar duidelijke uitleg voor je dag."],
  ["Reed", "Bewaakt risico, onzekerheid en officiële waarschuwingen."],
  ["Koos", "Helpt kiezen wanneer, waar en voor welke activiteit het weer het beste past."],
] as const;

const QA = [
  [
    "Welke gegevens gebruikt Weerzone?",
    "We combineren meerdere professionele weermodellen: HARMONIE van het KNMI, ICON van de Duitse weerdienst DWD, AROME van Météo-France, en de Europese en Amerikaanse wereldmodellen ECMWF en GFS. Die halen we op via Open-Meteo. Officiële waarschuwingen komen rechtstreeks van het KNMI.",
  ],
  [
    "Wat is de doorgetrokken lijn in de grafiek?",
    "Dat is onze gewogen verwachting. Elk weermodel telt mee, maar niet even zwaar: per dag en per regio krijgt het model dat de situatie het best aankan het meeste gewicht. Zo zie je één duidelijke lijn, met de losse verwachtingen er transparant omheen.",
  ],
  [
    "Wat is Mariana?",
    "Mariana is de motor achter Weerzone. Ze leest elke dag het grotere weerbeeld, herkent regionale verschillen en bepaalt hoe zwaar elk weermodel die dag meetelt. Piet, Reed en Koos vertalen haar werk naar gewone taal.",
  ],
  [
    "Waarom staan er geen modelnamen in de grafiek?",
    "Omdat het beeld dan leesbaar blijft. Welke modellen en bronnen meedoen lees je hier, op één plek — zo weet je altijd waar de verwachting vandaan komt zonder dat elke grafiek een voetnoot nodig heeft.",
  ],
  [
    "Waarom maar 48 uur?",
    "Omdat daar de meeste bruikbare keuzes liggen: eerder vertrekken, een buitenplan verschuiven, regenkleding meenemen of morgen kiezen. Verder vooruit geeft richting, maar minder zekerheid voor concrete beslissingen.",
  ],
] as const;

export default function OverPage() {
  return (
    <>
      <WeerzoneBackground />
      <main className="relative z-10 px-4 py-12 text-white sm:py-16">
        <div className="mx-auto max-w-3xl space-y-10">
          <header>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/70">Over</p>
            <h1 className="mt-3 text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl">Zo werkt Weerzone</h1>
          </header>

          <section className="rounded-3xl border border-white/20 bg-white p-7 shadow-sm sm:p-10">
            <h2 className="text-2xl font-black text-slate-950">Eén helder beeld voor 48 uur</h2>
            <p className="mt-4 text-base leading-7 text-slate-700">Weerzone brengt lokale weerdata, informatie van het KNMI en regionale patronen samen. De aandacht ligt op vandaag, vannacht en morgen: de periode waarin je plannen nog echt kunt aanpassen.</p>
            <p className="mt-4 text-base leading-7 text-slate-700">Op Vandaag en Morgen zie je het resultaat als een kort weerverhaal, een dagverloop en praktische details. De techniek blijft op de achtergrond.</p>
          </section>

          <section className="space-y-3">
            <h2 className="px-1 text-[10px] font-black uppercase tracking-[0.22em] text-white/70">Mariana, de motor achter Weerzone</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {MARIANA_PARTS.map(([name, text]) => (
                <article key={name} className="rounded-3xl border border-white/20 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-black text-slate-950">{name}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{text}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="px-1 text-[10px] font-black uppercase tracking-[0.22em] text-white/70">Piet, Reed en Koos</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {LAYERS.map(([name, text]) => (
                <article key={name} className="rounded-3xl border border-white/20 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-black text-slate-950">{name}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{text}</p>
                </article>
              ))}
            </div>
            <p className="rounded-3xl border border-white/20 bg-white p-6 text-sm leading-6 text-slate-700 shadow-sm">Je kiest in Mijn Weerzone welke lagen aanstaan. Een uitgeschakelde laag verdwijnt volledig uit Vandaag en Morgen. De basisverwachting blijft altijd zichtbaar.</p>
          </section>

          <section id="qa" className="scroll-mt-24 space-y-3">
            <h2 className="px-1 text-[10px] font-black uppercase tracking-[0.22em] text-white/70">Vraag en antwoord</h2>
            <div className="space-y-3">
              {QA.map(([question, answer]) => (
                <details key={question} className="group rounded-3xl border border-white/20 bg-white p-6 shadow-sm">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-base font-black text-slate-950">
                    {question}
                    <span className="text-slate-400 transition-transform group-open:rotate-45" aria-hidden>+</span>
                  </summary>
                  <p className="mt-3 text-sm leading-6 text-slate-700">{answer}</p>
                </details>
              ))}
            </div>
          </section>

          <footer className="flex flex-wrap gap-5 border-t border-white/20 pt-6 text-xs font-bold text-white/80">
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/contact" className="hover:text-white">Contact</Link>
            <Link href="/vandaag" className="hover:text-white">Vandaag</Link>
            <Link href="/morgen" className="hover:text-white">Morgen</Link>
          </footer>
        </div>
      </main>
    </>
  );
}
