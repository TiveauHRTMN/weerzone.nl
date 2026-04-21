import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Clock, TrendingUp, Shield, Zap, BarChart3 } from "lucide-react";
import B2BSignupForm from "@/components/B2BSignupForm";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "WEERZONE Zakelijk — Het weer, maar dan echt",
  description:
    "Werk je buiten? Dan kost slecht weer je geld. Met 48-uurs data van het KNMI HARMONIE weet je precies wat er aankomt. Op de meter. Op tijd.",
  openGraph: {
    title: "WEERZONE Zakelijk — Het weer, maar dan echt",
    description: "48 uur vooruit. Op de vierkante meter. Voor bedrijven die buiten werken.",
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
  { icon: Shield, title: "KNMI HARMONIE", desc: "Hetzelfde model dat het KNMI gebruikt. 2,5 km resolutie. Zo nauwkeurig als het in Nederland kan." },
  { icon: TrendingUp, title: "Elke ochtend om 08:00", desc: "Je weerrapport staat in je inbox voor je dag begint. Geen app, geen gezeur." },
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

        <a
          href="#aanmelden"
          className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-accent-orange text-text-primary font-bold text-lg hover:brightness-90 transition-all"
        >
          Gratis aanmelden →
        </a>
      </div>

      {/* Het eerlijke verhaal */}
      <div className="max-w-4xl mx-auto px-4 pb-12">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-black text-white mb-3">
            De 14-daagse klopt niet. Dat weet je zelf ook.
          </h2>
          <p className="text-white/60 text-sm sm:text-base leading-relaxed">
            Na drie dagen is een weersvoorspelling zo onbetrouwbaar dat je er geen beslissingen meer op kunt baseren. Toch verkopen de meeste weerapps je een 14-daagse alsof het de waarheid is. Wij doen dat niet.
          </p>
          <p className="text-white/80 font-semibold text-sm sm:text-base mt-3">
            WEERZONE stopt bij 48 uur. Want dat is de window waarin voorspellingen daadwerkelijk kloppen. KNMI HARMONIE, 2,5 km resolutie. Wat je ziet, klopt.
          </p>
        </div>
      </div>

      {/* Hoe het werkt */}
      <div className="max-w-4xl mx-auto px-4 pb-12">
        <div className="bg-accent-orange/10 border border-accent-orange/20 rounded-2xl p-8">
          <p className="text-xs font-bold text-accent-orange uppercase tracking-wider mb-3">Hoe het werkt</p>
          <p className="text-white/80 text-base leading-relaxed">
            Je geeft je bedrijfsadres. Wij rekenen op KNMI HARMONIE, elke ochtend opnieuw. Als er iets in de komende 48 uur jouw werk raakt — regen, vorst, storm, hitte — krijg je een mail. Anders niet.
          </p>
          <p className="text-white/60 text-sm leading-relaxed mt-3">
            Geen ruis. Geen schaarste-spelletjes. Geen app. Eén mail wanneer het telt.
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
        <h2 className="text-2xl font-black text-white text-center mb-2">Dit krijg je. Gratis.</h2>
        <p className="text-white/40 text-center mb-8 text-sm">We zijn nieuw en willen bewijzen dat het werkt. Jij test, wij verbeteren.</p>
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

      {/* Waarom gratis */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 text-center">
          <h3 className="text-xl font-black text-white mb-3">&ldquo;Waarom is dit gratis?&rdquo;</h3>
          <p className="text-white/60 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            Omdat we liever tien bedrijven hebben die het elke dag gebruiken dan niemand die er een keer over nadenkt. Jij gebruikt het, wij leren ervan. Bevalt het? Dan praten we verder. Geen verplichtingen, geen verborgen kosten.
          </p>
        </div>
      </div>

      {/* Signup form */}
      <div id="aanmelden" className="max-w-2xl mx-auto px-4 pb-20">
        <h2 className="text-3xl font-black text-white text-center mb-3">
          Gewoon proberen.
        </h2>
        <p className="text-white/50 text-center mb-8">
          30 seconden invullen. Morgenochtend om 08:00 je eerste weerrapport. Klaar.
        </p>
        <B2BSignupForm />
      </div>

      {/* Meet Steve + triade */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
          <p className="text-xs font-bold text-accent-orange uppercase tracking-wider mb-3">Wie schrijft je?</p>
          <h3 className="text-xl sm:text-2xl font-black text-white mb-3">
            Steve. Kort. Zakelijk. Geen ruis.
          </h3>
          <p className="text-white/60 text-sm sm:text-base leading-relaxed mb-4">
            Steve is de stem achter WEERZONE Zakelijk. Eén mail als het telt, stilte als het niet telt. Reply werkt — hij leest mee.
          </p>
          <p className="text-white/50 text-sm leading-relaxed">
            Niet zakelijk? WEERZONE heeft er nog twee:
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
