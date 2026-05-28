import type { Metadata } from "next";
import Link from "next/link";
import WeatherDashboard from "@/components/WeatherDashboard";
import ContactForm from "@/components/ContactForm";
import { ALL_PLACES } from "@/lib/places-data";
import { fetchWeatherData } from "@/lib/weather";
import { getSavedLocationServer } from "@/lib/location-cookies";
import { hreflangCluster } from "@/lib/hreflang";

export const metadata: Metadata = {
  title: "Kontakt",
  description:
    "Kontakt mit WEERZONE aufnehmen? Schreib an info@weerzone.nl oder sende direkt eine Nachricht. Wir antworten an Werktagen in der Regel innerhalb von 24 Stunden.",
  alternates: {
    canonical: "https://weerzone.nl/de/kontakt",
    languages: hreflangCluster({
      nl: "/contact",
      de: "/de/kontakt",
      fr: "/fr/contact",
      es: "/es/contacto",
    }),
  },
  openGraph: {
    title: "Kontakt mit WEERZONE aufnehmen",
    description:
      "Schick WEERZONE eine Nachricht für Support, Feedback, geschäftliche Anfragen oder Kooperationen.",
    type: "website",
    locale: "de_DE",
    url: "https://weerzone.nl/de/kontakt",
    siteName: "WEERZONE",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kontakt mit WEERZONE aufnehmen",
    description:
      "Support, Feedback und geschäftliche Anfragen. Wir antworten in der Regel innerhalb von 24 Stunden an Werktagen.",
  },
};

const berlin = ALL_PLACES.find((p) => p.name === "Berlin") ?? ALL_PLACES[0];

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Kontakt — WEERZONE",
    url: "https://weerzone.nl/de/kontakt",
    inLanguage: "de-DE",
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "WEERZONE", item: "https://weerzone.nl/de" },
      { "@type": "ListItem", position: 2, name: "Kontakt", item: "https://weerzone.nl/de/kontakt" },
    ],
  },
];

export default async function KontaktPage() {
  const loc = await getSavedLocationServer().catch(() => null);
  const activeLoc = loc || berlin;
  const initialWeather = await fetchWeatherData(activeLoc.lat, activeLoc.lon, false, false, undefined, "de").catch(() => undefined);

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
                  Kontakt · Weerzone
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight mb-2">
                Kontakt aufnehmen
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed">
                Für Support, Feedback und Kooperationen. Wir antworten an Werktagen in der Regel innerhalb von 24 Stunden.
              </p>
            </div>

            <div className="card p-6 sm:p-8">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2">
                E-Mail
              </p>
              <a
                href="mailto:info@weerzone.nl"
                className="text-2xl sm:text-3xl font-black text-slate-900 hover:text-sky-600 transition-colors break-all"
              >
                info@weerzone.nl
              </a>
              <p className="text-sm text-slate-500 leading-relaxed mt-3">
                Nutze diese Adresse für Support, Feedback und geschäftliche Anfragen.
              </p>
            </div>

            <div className="card p-6 sm:p-8">
              <h2 className="text-xl font-black text-slate-900 mb-3">Direkt eine Nachricht senden</h2>
              <ContactForm locale="de" />
            </div>

            <div className="card p-6">
              <p className="text-sm text-slate-500 leading-relaxed">
                Mit der Kontaktaufnahme stimmst du der Verarbeitung deiner Nachricht zu, wie in der{" "}
                <Link href="/privacy" className="text-sky-600 hover:underline font-semibold">
                  Datenschutzerklärung
                </Link>{" "}
                beschrieben.
              </p>
            </div>
          </div>
        }
      />
    </main>
  );
}
