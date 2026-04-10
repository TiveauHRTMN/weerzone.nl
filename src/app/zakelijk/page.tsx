import type { Metadata } from "next";
import { Building2, Clock, TrendingUp, Shield, Zap, BarChart3, Phone } from "lucide-react";

export const metadata: Metadata = {
  title: "WeerZone Zakelijk — 48-uurs Weerdata voor Professionals",
  description:
    "Bespaar duizenden euro's door te focussen op de enige 48 uur die ertoe doen. Hyperlocale weerdata voor horeca, festivals, strandtenten en evenementen.",
  openGraph: {
    title: "WeerZone Zakelijk — De enige 48 uur die ertoe doen",
    description: "Hyperlocale weerdata voor ondernemers. Geen 14-daagse gokkerij meer.",
  },
};

const USECASES = [
  {
    icon: "🏖️",
    title: "Strandtenten",
    desc: "Weet 48 uur van tevoren of je terras volloopt of dat je zandzakken moet leggen. Geen verrassingen meer.",
  },
  {
    icon: "🍽️",
    title: "Horeca & Terrassen",
    desc: "Personeel inplannen op basis van weerdata die klopt. Niet te veel, niet te weinig. Winst per uur omhoog.",
  },
  {
    icon: "🎪",
    title: "Festivals & Evenementen",
    desc: "48 uur is genoeg om operationele beslissingen te nemen. Tenten, beveiliging, noodplannen — allemaal op tijd.",
  },
  {
    icon: "🚛",
    title: "Logistiek & Transport",
    desc: "Gladheid, storm, mist — je weet het 48 uur eerder dan je concurrent. Routes aanpassen, niet achteraf klagen.",
  },
  {
    icon: "🌾",
    title: "Agrarisch",
    desc: "Oogst, besproeiing, bestrijding. 48 uur nauwkeurige data is meer waard dan een maand speculatie.",
  },
  {
    icon: "🏗️",
    title: "Bouw & Infra",
    desc: "Kraanwerk bij windkracht 7? Storten bij vriestemperatuur? Wij vertellen het je voordat het misgaat.",
  },
];

const FEATURES = [
  { icon: Clock, title: "48-uurs precisie", desc: "De enige window die meteorologisch betrouwbaar is. De rest is ruis." },
  { icon: BarChart3, title: "Hyperlocaal", desc: "Op de vierkante meter. Niet 'regio Zuid-Holland' maar jouw exacte locatie." },
  { icon: Zap, title: "Realtime alerts", desc: "Extreme weer? Je weet het eerder dan het KNMI het publiceert." },
  { icon: Shield, title: "API toegang", desc: "Integreer onze data direct in je eigen systemen. JSON, webhook, wat je wilt." },
  { icon: TrendingUp, title: "Impact analyse", desc: "Niet alleen wat het weer doet, maar wat het voor jouw business betekent." },
  { icon: Building2, title: "Multi-locatie", desc: "Meerdere vestigingen? Eén dashboard. Elk filiaal zijn eigen hyperlocale data." },
];

export default function ZakelijkPage() {
  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #1e293b 0%, #0f172a 100%)" }}>
      {/* Hero */}
      <div className="max-w-4xl mx-auto px-4 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent-orange/15 rounded-full mb-6">
          <Building2 className="w-4 h-4 text-accent-orange" />
          <span className="text-xs font-bold text-accent-orange uppercase tracking-wider">WeerZone Zakelijk</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-6">
          Bespaar duizenden euro&apos;s<br />
          <span className="text-accent-orange">door te focussen op 48 uur</span>
        </h1>

        <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto mb-8">
          Vergeet de 14-daagse. Die klopt niet. Dat weet iedereen behalve de mensen die hem verkopen.
          WeerZone levert de enige data die er toe doet: de komende 48 uur, op de vierkante meter.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="mailto:zakelijk@weerzone.nl"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-accent-orange text-text-primary font-bold text-lg hover:brightness-90 transition-all"
          >
            <Phone className="w-5 h-5" />
            Neem contact op
          </a>
        </div>
      </div>

      {/* Social proof */}
      <div className="max-w-4xl mx-auto px-4 pb-12">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
          <p className="text-white/80 text-lg italic">
            &ldquo;Wij gebruikten de KNMI 14-daagse voor ons terras. Sinds WeerZone plannen we op 48 uur en besparen we gemiddeld 2 uur personeel per dag.&rdquo;
          </p>
          <p className="text-white/40 text-sm mt-3">— Toekomstige klant. Wij zoeken de eerste 10 early adopters.</p>
        </div>
      </div>

      {/* Use cases */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-black text-white text-center mb-8">
          Voor wie is dit?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {USECASES.map((uc) => (
            <div key={uc.title} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/8 transition-colors">
              <div className="text-3xl mb-3">{uc.icon}</div>
              <h3 className="text-white font-bold mb-1">{uc.title}</h3>
              <p className="text-white/50 text-sm">{uc.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-black text-white text-center mb-8">
          Wat krijg je?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white/5 border border-white/10 rounded-xl p-5">
              <Icon className="w-6 h-6 text-accent-orange mb-3" />
              <h3 className="text-white font-bold mb-1">{title}</h3>
              <p className="text-white/50 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-black text-white text-center mb-3">
          Pricing
        </h2>
        <p className="text-white/50 text-center mb-8">Geen verrassingen. Net als ons weer.</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
            <h3 className="text-white font-bold text-lg mb-1">Starter</h3>
            <div className="text-3xl font-black text-white mb-1">&euro;49<span className="text-sm font-normal text-white/40">/maand</span></div>
            <p className="text-white/40 text-xs mb-4">1 locatie • 48-uurs data • Email alerts</p>
            <a href="mailto:zakelijk@weerzone.nl" className="block py-2 rounded-lg border border-white/20 text-white text-sm font-bold hover:bg-white/10 transition-colors">
              Start nu
            </a>
          </div>
          <div className="bg-accent-orange/10 border-2 border-accent-orange rounded-xl p-6 text-center relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-accent-orange rounded-full text-text-primary text-xs font-bold">
              Populair
            </div>
            <h3 className="text-white font-bold text-lg mb-1">Professional</h3>
            <div className="text-3xl font-black text-white mb-1">&euro;149<span className="text-sm font-normal text-white/40">/maand</span></div>
            <p className="text-white/40 text-xs mb-4">5 locaties • API • Impact analyse • Prioriteit support</p>
            <a href="mailto:zakelijk@weerzone.nl" className="block py-2 rounded-lg bg-accent-orange text-text-primary text-sm font-bold hover:brightness-90 transition-colors">
              Start nu
            </a>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
            <h3 className="text-white font-bold text-lg mb-1">Enterprise</h3>
            <div className="text-3xl font-black text-white mb-1">Op maat</div>
            <p className="text-white/40 text-xs mb-4">Onbeperkt locaties • SLA • Dedicated support • Webhook</p>
            <a href="mailto:zakelijk@weerzone.nl" className="block py-2 rounded-lg border border-white/20 text-white text-sm font-bold hover:bg-white/10 transition-colors">
              Contact
            </a>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-4xl mx-auto px-4 pb-20 text-center">
        <h2 className="text-3xl font-black text-white mb-4">
          Klaar om te stoppen met gokken?
        </h2>
        <p className="text-white/50 mb-6">
          De eerste 10 zakelijke klanten krijgen 3 maanden gratis. Serieus.
        </p>
        <a
          href="mailto:zakelijk@weerzone.nl"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-accent-orange text-text-primary font-bold text-lg hover:brightness-90 transition-all"
        >
          zakelijk@weerzone.nl
        </a>
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 py-8 text-center">
        <p className="text-white/30 text-xs">WeerZone — 48 uur. De rest is ruis.</p>
      </div>
    </div>
  );
}
