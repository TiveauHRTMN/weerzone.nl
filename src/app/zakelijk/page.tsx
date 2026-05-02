import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Clock, TrendingUp, Shield, Zap, BarChart3, Mail } from "lucide-react";
import B2BSignupForm from "@/components/B2BSignupForm";
import WeatherDashboard from "@/components/WeatherDashboard";

export const metadata: Metadata = {
  title: "WEERZONE Zakelijk — Het weer, maar dan echt",
  description:
    "Werkt u buiten? Dan kost onverwacht weer u geld. WEERZONE levert de nauwkeurigste 48-uurs voorspelling van Nederland — op 1 bij 1 kilometer, voor uw bedrijfsadres.",
  alternates: { canonical: "https://weerzone.nl/zakelijk" },
  openGraph: {
    title: "WEERZONE Zakelijk — Het weer, maar dan echt",
    description:
      "De nauwkeurigste 48-uurs voorspelling van Nederland. Op 1 bij 1 kilometer. Voor bedrijven die buiten werken.",
    type: "website",
    locale: "nl_NL",
    url: "https://weerzone.nl/zakelijk",
    siteName: "WEERZONE",
  },
  twitter: {
    card: "summary_large_image",
    title: "WEERZONE Zakelijk — Het weer, maar dan echt",
    description: "De nauwkeurigste 48-uurs voorspelling voor bedrijven die buiten werken.",
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
    <main>
      <WeatherDashboard
        hideWeatherInfo={true}
        beforeFooter={
          <div className="space-y-10 pb-6">

            {/* Steve hero intro */}
            <div className="card p-8 text-center">
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5"
                style={{ background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.25)" }}
              >
                <Building2 className="w-4 h-4 text-accent-orange" />
                <span className="text-xs font-black text-accent-orange uppercase tracking-wider">
                  Steve · WEERZONE Zakelijk
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-text-primary leading-tight mb-4">
                Werk je buiten?<br />
                <span className="text-accent-orange">Dan kost slecht weer je geld.</span>
              </h1>
              <p className="text-text-secondary text-sm sm:text-base leading-relaxed max-w-lg mx-auto mb-3">
                Dat weet jij beter dan wie ook. Je plant je week, het weer draait en je staat
                met een vol team op een lege dag. Of andersom.
              </p>
              <p className="text-text-primary font-bold text-sm sm:text-base max-w-lg mx-auto mb-8">
                WEERZONE geeft je de komende 48 uur. Jouw locatie, op de meter. Elke ochtend in je inbox.
              </p>
              <div className="inline-flex flex-col items-center gap-3">
                <span
                  className="px-5 py-2 rounded-full text-text-muted font-bold text-xs uppercase tracking-widest"
                  style={{ background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.08)" }}
                >
                  In ontwikkeling — Binnenkort beschikbaar
                </span>
                <a
                  href="mailto:zakelijk@weerzone.nl"
                  className="text-text-muted hover:text-text-primary transition-colors text-sm font-medium"
                >
                  Interesse? Mail zakelijk@weerzone.nl
                </a>
              </div>
            </div>

            {/* Het eerlijke verhaal */}
            <div className="card p-6">
              <h2 className="text-lg font-black text-text-primary mb-2">
                Een voorspelling waar u uw werk op kunt plannen.
              </h2>
              <p className="text-text-secondary text-sm leading-relaxed">
                Na drie dagen loopt de nauwkeurigheid van elke weersvoorspelling sterk terug.
                Toch presenteren veel weerdiensten een 14-daagse alsof die net zo betrouwbaar
                is als vandaag. Wij doen dat niet.
              </p>
              <p className="text-text-primary font-semibold text-sm mt-3">
                WEERZONE richt zich op de komende 48 uur — de periode waarin voorspellingen
                écht kloppen. Op 1 bij 1 kilometer precies, voor uw locatie.
              </p>
            </div>

            {/* Hoe het werkt */}
            <div
              className="rounded-[20px] p-6"
              style={{
                background: "rgba(249,115,22,0.09)",
                border: "1px solid rgba(249,115,22,0.22)",
                backdropFilter: "blur(12px)",
              }}
            >
              <p className="text-[10px] font-black text-accent-orange uppercase tracking-wider mb-2">
                Hoe het werkt
              </p>
              <p className="text-text-primary text-sm leading-relaxed">
                U geeft uw bedrijfsadres op. Wij maken elke ochtend een nieuwe voorspelling
                op 1 bij 1 kilometer. Zodra er in de komende 48 uur iets uw werk raakt —
                regen, vorst, storm, hitte — krijgt u een mail. Anders niet.
              </p>
              <p className="text-text-secondary text-sm leading-relaxed mt-2">
                Geen overbodige meldingen. Geen app. Eén mail wanneer het telt.
              </p>
            </div>

            {/* Use cases */}
            <div>
              <h2 className="text-2xl font-black text-white text-center mb-1">Herken je dit?</h2>
              <p className="text-white/50 text-center mb-6 text-xs font-bold uppercase tracking-widest">
                Iedereen die buiten werkt kent dit verhaal
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {USECASES.map((uc) => (
                  <div key={uc.title} className="card p-5">
                    <div className="text-3xl mb-3">{uc.icon}</div>
                    <h3 className="text-text-primary font-black mb-1">{uc.title}</h3>
                    <p className="text-text-secondary text-sm leading-relaxed">{uc.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Meer branches */}
            <div>
              <h2 className="text-2xl font-black text-white text-center mb-1">En jullie ook.</h2>
              <p className="text-white/50 text-center mb-6 text-xs font-bold uppercase tracking-widest">
                Buitenwerk is weerafhankelijk. Altijd.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {MORE_INDUSTRIES.map((ind) => (
                  <div key={ind.title} className="card p-5">
                    <div className="text-3xl mb-3">{ind.icon}</div>
                    <h3 className="text-text-primary font-black mb-1">{ind.title}</h3>
                    <p className="text-text-secondary text-sm leading-relaxed">{ind.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Features */}
            <div>
              <h2 className="text-2xl font-black text-white text-center mb-1">Dit staat gepland.</h2>
              <p className="text-white/50 text-center mb-6 text-xs font-bold uppercase tracking-widest">
                We bouwen aan de zakelijke motor van WEERZONE
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {FEATURES.map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="card p-5">
                    <Icon className="w-5 h-5 text-accent-orange mb-3" />
                    <h3 className="text-text-primary font-black mb-1">{title}</h3>
                    <p className="text-text-secondary text-sm leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA aanmelden */}
            <div id="aanmelden" className="card p-8">
              <div className="text-center mb-6">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: "rgba(249,115,22,0.15)" }}
                >
                  <Mail className="w-7 h-7 text-accent-orange" />
                </div>
                <h2 className="text-2xl font-black text-text-primary mb-2">Meld u aan voor de bèta</h2>
                <p className="text-text-secondary text-sm leading-relaxed max-w-sm mx-auto">
                  Steve is momenteel in actieve ontwikkeling. Laat uw gegevens achter —
                  wij nodigen u uit zodra uw branche aan de beurt is.
                </p>
              </div>
              <B2BSignupForm />
            </div>

            {/* Meet Steve + triade */}
            <div className="card p-6">
              <p className="text-[10px] font-black text-accent-orange uppercase tracking-wider mb-2">
                Wie schrijft je?
              </p>
              <h3 className="text-lg font-black text-text-primary mb-2">
                Steve. Kort. Zakelijk. Geen ruis.
              </h3>
              <p className="text-text-secondary text-sm leading-relaxed mb-3">
                Steve is de stem achter WEERZONE Zakelijk. Eén mail als het telt, stilte als
                het niet telt. Reply werkt — hij leest mee zodra we live zijn.
              </p>
              <p className="text-text-muted text-xs mb-3">
                Niet zakelijk? WEERZONE heeft er nog twee die wél al live zijn:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link
                  href="/jouwweer"
                  className="rounded-2xl p-4 transition-all hover:scale-[1.01]"
                  style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.07)" }}
                >
                  <p className="text-text-primary font-black text-sm mb-1">Piet · 48 uur</p>
                  <p className="text-text-muted text-xs">Dagelijks weerbericht voor thuis. Nuchter, kort, zonder drama.</p>
                </Link>
                <Link
                  href="/waarschuwingen"
                  className="rounded-2xl p-4 transition-all hover:scale-[1.01]"
                  style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.07)" }}
                >
                  <p className="text-text-primary font-black text-sm mb-1">Reed · Waarschuwing</p>
                  <p className="text-text-muted text-xs">Alleen een mail als het weer écht gevaarlijk wordt. Code geel, oranje, rood.</p>
                </Link>
              </div>
            </div>

          </div>
        }
      />
    </main>
  );
}
