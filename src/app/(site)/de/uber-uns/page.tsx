import type { Metadata } from "next";
import Link from "next/link";
import WeatherDashboard from "@/components/WeatherDashboard";
import { ALL_PLACES } from "@/lib/places-data";
import { fetchWeatherData } from "@/lib/weather";
import { getSavedLocationServer } from "@/lib/location-cookies";
import { hreflangCluster } from "@/lib/hreflang";

export const metadata: Metadata = {
  title: "Über uns",
  description:
    "Lies, wofür WEERZONE steht: hyperlokale 48-Stunden-Wettervorhersage für Deutschland, ohne Rauschen, fokussiert auf Entscheidungen für heute und morgen.",
  keywords: [
    "WEERZONE",
    "über weerzone",
    "hyperlokales wetter",
    "48 stunden wetter",
    "persönlicher wetterbericht",
    "wetterdienst deutschland",
  ],
  alternates: {
    canonical: "https://weerzone.nl/de/uber-uns",
    languages: hreflangCluster({
      nl: "/over",
      de: "/de/uber-uns",
      fr: "/fr/a-propos",
      es: "/es/sobre-nosotros",
    }),
  },
  openGraph: {
    title: "Über WEERZONE",
    description:
      "WEERZONE macht Wetter brauchbar: hyperlokal, werbefrei und fokussiert auf Entscheidungen für heute und morgen.",
    type: "website",
    locale: "de_DE",
    url: "https://weerzone.nl/de/uber-uns",
    siteName: "WEERZONE",
  },
  twitter: {
    card: "summary_large_image",
    title: "Über WEERZONE",
    description:
      "Warum WEERZONE auf 48 Stunden voraus und hyperlokale Wetterhinweise fokussiert.",
  },
};

const PERSONAS = [
  {
    name: "Karl",
    href: "/de/mein-wetter",
    color: "#10b981",
    role: "Tägliches Wetter",
    desc: "Karl übersetzt die nächsten 48 Stunden in Klartext: Trockenheit, Regen, Wind und was das heute und morgen für dich bedeutet.",
  },
  {
    name: "Reed",
    href: "/de/warnungen",
    color: "#ef4444",
    role: "Warnungen",
    desc: "Reed meldet sich nur, wenn wirklich etwas im Anmarsch ist, wie Gewitter, Sturm, Hitze oder schwerer Niederschlag.",
  },
  {
    name: "Steve",
    href: "/steve",
    color: "#0ea5e9",
    role: "Unternehmen",
    desc: "Steve übersetzt Wetterdaten in operative Entscheidungen für Unternehmen, die draußen arbeiten oder von Besuch, Andrang und Planung leben.",
  },
];

const berlin = ALL_PLACES.find((p) => p.name === "Berlin") ?? ALL_PLACES[0];

export default async function UberUnsPage() {
  const loc = await getSavedLocationServer().catch(() => null);
  const activeLoc = loc || berlin;
  const initialWeather = await fetchWeatherData(activeLoc.lat, activeLoc.lon, false, false, undefined, "de").catch(() => undefined);

  const faqItems = [
    {
      q: "Warum schaut WEERZONE nur 48 Stunden voraus?",
      a: "Wettervorhersagen werden exponentiell ungenauer, je weiter sie in die Zukunft reichen. Die Atmosphäre ist ein chaotisches System: kleine Abweichungen im Anfangszustand führen nach 48 bis 72 Stunden zu großen Unsicherheiten. WEERZONE fokussiert bewusst auf die nächsten 48 Stunden, weil Modelle wie DWD ICON-D2, ICON-EU und AROME hier noch Stunde-für-Stunde zuverlässige Ergebnisse liefern. Weiter voraus gibt es bestenfalls eine grobe Tendenz — nützlich für Planung, aber nicht für konkrete Entscheidungen wie 'gehe ich Rad fahren' oder 'plane ich draußen ein'. Wir wählen Brauchbarkeit vor Eindruck.",
    },
    {
      q: "Was unterscheidet WEERZONE von wetter.com oder wetteronline?",
      a: "WEERZONE kombiniert mehrere Wettermodelle gleichzeitig — DWD ICON-D2 als primäre Basis, ergänzt mit europäischen Modellen — und übersetzt diese rohen Modelldaten in eine klare Antwort pro Standort. wetter.com und wetteronline zeigen die Daten, WEERZONE interpretiert sie. Außerdem ist WEERZONE werbefrei und arbeitet mit einer Auflösung von 1×1 Kilometer, sodass ein kleiner Ort andere Daten bekommt als die nächstgrößere Stadt. Der Fokus liegt auf der Frage, die eigentlich jeder stellt: Was bedeutet das für mich heute und morgen?",
    },
    {
      q: "Wie funktioniert die Standortbestimmung?",
      a: "WEERZONE fragt dich einmalig nach einem Ortsnamen oder einer Postleitzahl. Dieser Standort wird in einem Cookie gespeichert, damit du bei jedem nächsten Besuch direkt die richtige Vorhersage siehst, ohne erneut zu suchen. Du kannst den Standort jederzeit über die Standort-Taste oben auf der Seite ändern. Die Datenbank umfasst tausende Orte in Deutschland — von großen Städten bis zu kleinen Dörfern und Ortsteilen — sodass selbst der entlegenste Standort eigene, hyperlokale Daten bekommt.",
    },
    {
      q: "Ist WEERZONE kostenlos?",
      a: "WEERZONE ist während der Beta-Phase vorerst kostenlos zu testen. Nach der Beta bleiben die Basisfunktionen (Wettervorhersage pro Standort) kostenlos. Erweiterte Funktionen wie persönliche Wetterberichte von Karl, Extremwetter-Warnungen von Reed und geschäftliche Integrationen über Steve fallen unter ein kostenpflichtiges Abonnement. Die genauen Tarife und was du pro Plan bekommst, findest du auf der Preisseite. Es gibt keine versteckten Kosten — du siehst immer vorab, was du bezahlst.",
    },
    {
      q: "Kann ich mehrere Standorte speichern?",
      a: "Im Moment verfolgt WEERZONE einen aktiven Standort gleichzeitig. Du kannst diesen Standort jederzeit über die Standort-Taste wechseln. Die Möglichkeit, mehrere Standorte zu speichern und schnell zu wechseln — praktisch, wenn du an zwei Adressen wohnst oder regelmäßig woanders arbeitest — ist für eine spätere Version geplant. Nutzer des kostenpflichtigen Plans bekommen das als Erste. Wenn du dich für Updates zu neuen Funktionen anmelden willst, kannst du dich auf der Anmeldeseite registrieren.",
    },
    {
      q: "Wie kann ich Kontakt aufnehmen?",
      a: "Du erreichst WEERZONE über info@weerzone.nl oder über das Kontaktformular auf der Kontaktseite. An Werktagen antworten wir in der Regel innerhalb von 24 Stunden. Für technische Fragen zur App, fehlende Standorte oder Datenprobleme ist E-Mail der schnellste Weg. Für geschäftliche Anfragen — Partnerships, API-Integrationen oder B2B-Abonnements — kannst du direkt mit dem Betreff 'Unternehmen' mailen, damit deine Nachricht bei der richtigen Person ankommt.",
    },
  ];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      name: "Über WEERZONE",
      description:
        "WEERZONE konzentriert sich auf hyperlokale Wettervorhersagen für die nächsten 48 Stunden.",
      url: "https://weerzone.nl/de/uber-uns",
      inLanguage: "de-DE",
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: ["h1", ".wz-about-intro", ".wz-about-philosophy"],
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqItems.map(({ q, a }) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a },
      })),
    },
  ];

  return (
    <main>
      {jsonLd.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
      <WeatherDashboard
        hideWeatherInfo
        initialCity={activeLoc}
        initialWeather={initialWeather}
        locale="de"
        beforeFooter={
          <div className="space-y-6">
            <div className="card p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-3 h-3 rounded-full bg-sky-500" />
                <span className="text-xs font-black uppercase tracking-widest text-sky-600">
                  Über · Weerzone
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight mb-2">
                Weerzone macht Wetter brauchbar.
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed">
                WEERZONE ist für Menschen gebaut, die etwas mit dem Wetter entscheiden müssen. Nicht, um endlos
                durch lange Vorhersagen zu scrollen, sondern um zu wissen, was heute und morgen an deinem Ort passiert.
              </p>
            </div>

            <div className="card p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2">
                Wofür wir stehen
              </p>
              <p className="text-slate-900 font-black text-lg mb-2">
                Hyperlokal, kurz dran und brauchbar.
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                WEERZONE konzentriert sich auf die nächsten 48 Stunden, weil das der Zeitraum ist, in dem
                Wettervorhersagen für die stündliche Planung am brauchbarsten sind. Weiter voraus kann
                Richtung geben, ist aber weniger geeignet für konkrete Entscheidungen.
              </p>
            </div>

            <div className="card p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2">
                Unsere Philosophie
              </p>
              <p className="text-slate-900 font-black text-lg mb-2">
                Ehrliche Daten, ohne Schnickschnack.
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                WEERZONE nutzt die genauesten Quellen, um Temperatur, Regen, Wind und Risiken so relevant
                wie möglich pro Standort zu zeigen. Danach übersetzen wir das in Momente und Konsequenzen:
                Kannst du trocken Rad fahren, draußen arbeiten oder musst du mit einem Wetterumschwung rechnen?
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-black text-white text-center mb-1">Die Bestandteile von WEERZONE</h2>
              <p className="text-white/50 text-center mb-6 text-xs font-bold uppercase tracking-widest">
                Für zuhause, Warnungen und geschäftliche Nutzung
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {PERSONAS.map((persona) => (
                  <Link
                    key={persona.name}
                    href={persona.href}
                    className="card p-5 hover:scale-[1.01] transition-transform"
                  >
                    <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: persona.color }}>
                      {persona.name} · {persona.role}
                    </p>
                    <p className="text-text-secondary text-sm leading-relaxed">{persona.desc}</p>
                  </Link>
                ))}
              </div>
            </div>

            <div id="faq">
              <h2 className="text-2xl font-black text-white text-center mb-1">Häufig gestellte Fragen</h2>
              <p className="text-white/50 text-center mb-6 text-xs font-bold uppercase tracking-widest">
                Alles, was du über WEERZONE wissen willst
              </p>
              <div className="space-y-2">
                {faqItems.map(({ q, a }) => (
                  <details key={q} className="card group" style={{ padding: 0 }}>
                    <summary
                      className="flex justify-between items-center gap-3 cursor-pointer select-none list-none px-5 py-4"
                      style={{ WebkitUserSelect: "none" }}
                    >
                      <span className="font-black text-text-primary text-sm">{q}</span>
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-black text-text-muted shrink-0 transition-transform group-open:rotate-45" style={{ background: "rgba(0,0,0,0.06)" }}>+</span>
                    </summary>
                    <div className="text-sm text-text-muted leading-relaxed px-5 pb-4">{a}</div>
                  </details>
                ))}
              </div>
            </div>

            <div className="card p-6 text-center">
              <p className="text-slate-900 font-black text-lg mb-2">Mehr erfahren oder loslegen?</p>
              <p className="text-sm text-slate-600 leading-relaxed mb-5">
                Schau dir das aktuelle Wetter an, lies mehr über die Abos oder schick direkt eine Nachricht an info@weerzone.nl.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/de"
                  className="px-6 py-3 rounded-2xl text-white font-black text-sm transition-opacity hover:opacity-90"
                  style={{ background: "var(--wz-brand)" }}
                >
                  Zur Startseite
                </Link>
                <Link
                  href="/app/signup?lang=de"
                  className="px-6 py-3 rounded-2xl text-text-primary font-black text-sm transition-all hover:brightness-95"
                  style={{
                    background: "rgba(255,255,255,0.6)",
                    border: "1px solid rgba(255,255,255,0.8)",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  }}
                >
                  Tarife ansehen
                </Link>
              </div>
            </div>
          </div>
        }
      />
    </main>
  );
}
