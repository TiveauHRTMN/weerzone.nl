import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Clock, TrendingUp, Shield, Zap, BarChart3, Mail } from "lucide-react";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "WEERZONE Zakelijk — Het weer, maar dan echt",
  description:
    "Werkt u buiten? Dan kost onverwacht weer u geld. WEERZONE levert de nauwkeurigste 48-uurs voorspelling van Nederland — op 1 bij 1 kilometer, voor uw bedrijfsadres.",
  openGraph: {
    title: "WEERZONE Zakelijk — Het weer, maar dan echt",
    description: "De nauwkeurigste 48-uurs voorspelling van Nederland. Op 1 bij 1 kilometer. Voor bedrijven die buiten werken.",
  },
};

const USECASES = [
  {
    icon: "🏖️",
    title: "Strandtenten",
    desc: "Te weinig besteld op een topdag of te veel personeel op een regendag — dat scheelt aan het einde van de maand meer dan je denkt.",
  },
  {
    icon: "🍽️",
    title: "Horeca & Terrassen",
    desc: "Terrasseizoen draait op het weer. Weet je 48 uur van tevoren wat er aankomt, dan plan je slim. En verdien je meer.",
  },
  {
    icon: "🎪",
    title: "Festivals & Evenementen",
    desc: "Op het laatste moment noodtenten regelen kost drie keer zoveel. Met 48 uur voorsprong beslis je rustig. En op tijd.",
  },
  {
    icon: "🚛",
    title: "Transport & Logistiek",
    desc: "Gladheid, storm en mist kosten je tijd en geld. Met 48 uur echte data pas je je routes aan voordat het misgaat.",
  },
  {
    icon: "🌾",
    title: "Agrarisch",
    desc: "Spuiten bij wind werkt niet. Oogsten bij regen kost je de helft. Wanneer is het wél goed? Dat vertellen wij je.",
  },
  {
    icon: "🏗️",
    title: "Bouw & Infra",
    desc: "Beton storten bij vorst of kraanwerk bij harde wind — dat zijn fouten die je maar één keer maakt. Wij zorgen dat je het van tevoren weet.",
  },
];

const MORE_INDUSTRIES = [
  { icon: "🪟", title: "Glazenwassers", desc: "Je staat met je ladder klaar en dan begint het te regenen. Met een dag vooruit plannen voorkom je dat." },
  { icon: "🎨", title: "Schilders", desc: "Verf hecht niet onder 10 graden en niet bij regen. Weet wanneer het ideaal is om buiten te werken." },
  { icon: "🏠", title: "Dakdekkers", desc: "Een droog en windstil moment is goud waard. Wij laten je precies zien wanneer dat de komende 48 uur is." },
  { icon: "🌿", title: "Hoveniers", desc: "Werken op een drassig gazon kost je een boze klant. Plan je groendagen op de juiste momenten." },
  { icon: "🧹", title: "Schoonmaak", desc: "Gevelreiniging bij regen doe je twee keer. Weet wanneer het droog is en doe het één keer goed." },
  { icon: "🚴", title: "Bezorging", desc: "Jouw mensen werken bij elk weer. Maar met 48 uur vooruit weet je wanneer je extra aandacht nodig is." },
];

const FEATURES = [
  { icon: Clock, title: "48 uur vooruit", desc: "De enige voorspelling die echt betrouwbaar is. Daarna wordt het gokken — en dat weten wij ook." },
  { icon: BarChart3, title: "Op de vierkante meter", desc: "Niet ergens in de regio. Jouw adres, jouw locatie, jouw weer." },
  { icon: Zap, title: "Alleen wat telt", desc: "Geen melding dat het bewolkt wordt. Wel een signaal als het jou iets gaat kosten." },
  { icon: Shield, title: "Meest nauwkeurig", desc: "De nauwkeurigste weersvoorspelling van Nederland. Op 1 bij 1 kilometer precies." },
  { icon: TrendingUp, title: "Elke ochtend om 08:00", desc: "Uw weerrapport staat in uw inbox voor de dag begint. Geen app nodig." },
  { icon: Building2, title: "Meerdere locaties", desc: "Meerdere vestigingen of bouwplaatsen? Elk adres zijn eigen data. Overzicht houd je zelf." },
];

export default function ZakelijkPage() {
  return (
    <div className="min-h-screen bg-[#4a9ee8]">

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-4 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent-orange/15 rounded-full mb-6">
          <Building2 className="w-4 h-4 text-accent-orange" />
          <span className="text-xs font-bold text-accent-orange uppercase tracking-wider">Steve · WEERZONE Zakelijk</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-6">
          Werk je buiten?<br />
          <span className="text-accent-orange">Dan kost slecht weer je geld.</span>
        </h1>

        <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto mb-4">
          Dat weet jij beter dan wie ook. Je plant je week, het weer draait en je staat met een vol team op een lege dag. Of andersom.
        </p>
        <p className="text-lg sm:text-xl text-white/80 font-bold max-w-2xl mx-auto mb-8">
          WEERZONE geeft je de komende 48 uur. Jouw locatie, op de meter. Elke ochtend in je inbox.
        </p>

        <div className="inline-flex flex-col items-center gap-4">
          <span className="px-6 py-2 rounded-full bg-white/10 border border-white/20 text-white font-bold text-sm uppercase tracking-widest">
            In ontwikkeling — Binnenkort beschikbaar
          </span>
          <a
            href="mailto:zakelijk@weerzone.nl"
            className="text-white/60 hover:text-white transition-colors text-sm font-medium"
          >
            Interesse? Mail naar zakelijk@weerzone.nl
          </a>
        </div>
      </div>

      {/* Het eerlijke verhaal */}
      <div className="max-w-4xl mx-auto px-4 pb-12">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-black text-white mb-3">
            Een voorspelling waar u uw werk op kunt plannen.
          </h2>
          <p className="text-white/60 text-sm sm:text-base leading-relaxed">
            Na drie dagen loopt de nauwkeurigheid van elke weersvoorspelling sterk terug. Toch presenteren veel weerdiensten een 14-daagse alsof die net zo betrouwbaar is als vandaag. Wij doen dat niet.
          </p>
          <p className="text-white/80 font-semibold text-sm sm:text-base mt-3">
            WEERZONE richt zich op de komende 48 uur — de periode waarin voorspellingen écht kloppen. Op 1 bij 1 kilometer precies, voor uw locatie.
          </p>
        </div>
      </div>

      {/* Hoe het werkt */}
      <div className="max-w-4xl mx-auto px-4 pb-12">
        <div className="bg-accent-orange/10 border border-accent-orange/20 rounded-2xl p-8">
          <p className="text-xs font-bold text-accent-orange uppercase tracking-wider mb-3">Hoe het werkt</p>
          <p className="text-white/80 text-base leading-relaxed">
            U geeft uw bedrijfsadres op. Wij maken elke ochtend een nieuwe voorspelling op 1 bij 1 kilometer. Zodra er in de komende 48 uur iets uw werk raakt — regen, vorst, storm, hitte — krijgt u een mail. Anders niet.
          </p>
          <p className="text-white/60 text-sm leading-relaxed mt-3">
            Geen overbodige meldingen. Geen app. Eén mail wanneer het telt.
          </p>
        </div>
      </div>

      {/* Use cases */}
      <div className="max-w-4xl mx-auto px-4 pb-12">
        <h2 className="text-2xl font-black text-white text-center mb-2">Herken je dit?</h2>
        <p className="text-white/40 text-center mb-8 text-sm">Iedereen die buiten werkt kent dit verhaal.</p>
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

      {/* Meer branches */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-black text-white text-center mb-2">En jullie ook.</h2>
        <p className="text-white/40 text-center mb-8 text-sm">Buitenwerk is weerafhankelijk. Altijd.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MORE_INDUSTRIES.map((ind) => (
            <div key={ind.title} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/8 transition-colors">
              <div className="text-3xl mb-3">{ind.icon}</div>
              <h3 className="text-white font-bold mb-1">{ind.title}</h3>
              <p className="text-white/50 text-sm">{ind.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-black text-white text-center mb-2">Dit staat gepland.</h2>
        <p className="text-white/40 text-center mb-8 text-sm">We bouwen aan de zakelijke motor van WEERZONE.</p>
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

      {/* Status update */}
      <div id="aanmelden" className="max-w-2xl mx-auto px-4 pb-20 text-center">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-10 sm:p-14">
          <div className="w-16 h-16 bg-accent-orange/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-accent-orange" />
          </div>
          <h2 className="text-3xl font-black text-white mb-4">
            Blijf op de hoogte
          </h2>
          <p className="text-white/60 text-lg leading-relaxed mb-8">
            Steve (WEERZONE Zakelijk) is momenteel in actieve ontwikkeling. We laten u weten zodra we de eerste bedrijven toelaten tot de private bèta.
          </p>
          <a
            href="mailto:zakelijk@weerzone.nl?subject=Interesse%20in%20WEERZONE%20Zakelijk"
            className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-white text-slate-900 font-bold text-lg hover:bg-accent-orange hover:text-white transition-all group"
          >
            Mail zakelijk@weerzone.nl
            <Mail className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
          </a>
          <p className="mt-6 text-white/30 text-sm">
            Geen kosten, geen verplichtingen. U hoort van ons zodra we live gaan.
          </p>
        </div>
      </div>

      {/* Meet Steve + triade */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
          <p className="text-xs font-bold text-accent-orange uppercase tracking-wider mb-3">Wie schrijft je?</p>
          <h3 className="text-xl sm:text-2xl font-black text-white mb-3">
            Steve. Kort. Zakelijk. Geen ruis.
          </h3>
          <p className="text-white/60 text-sm sm:text-base leading-relaxed mb-4">
            Steve is de stem achter WEERZONE Zakelijk. Eén mail als het telt, stilte als het niet telt. Reply werkt — hij leest mee zodra we live zijn.
          </p>
          <p className="text-white/50 text-sm leading-relaxed">
            Niet zakelijk? WEERZONE heeft er nog twee die wél al live zijn:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            <Link href="/piet" className="bg-white/5 hover:bg-white/8 border border-white/10 rounded-xl p-4 transition-colors">
              <p className="text-white font-bold text-sm mb-1">Piet · 48 uur</p>
              <p className="text-white/50 text-xs">Dagelijks weerbericht voor thuis. Nuchter, kort, zonder drama.</p>
            </Link>
            <Link href="/reed" className="bg-white/5 hover:bg-white/8 border border-white/10 rounded-xl p-4 transition-colors">
              <p className="text-white font-bold text-sm mb-1">Reed · Waarschuwing</p>
              <p className="text-white/50 text-xs">Alleen een mail als het weer écht gevaarlijk wordt. Code geel, oranje, rood.</p>
            </Link>
          </div>
        </div>
      </div>

      <Footer />

    </div>
  );
}
