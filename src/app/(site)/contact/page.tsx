import type { Metadata } from "next";
import Link from "next/link";
import WeatherDashboard from "@/components/WeatherDashboard";
import ContactForm from "@/components/ContactForm";
import { schemaContactPage, schemaBreadcrumb, schemaLd } from "@/lib/schema";
import { DUTCH_CITIES } from "@/lib/types";
import { fetchWeatherData } from "@/lib/weather";
import { getSavedLocationServer } from "@/lib/location-cookies";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact opnemen met WEERZONE? Mail naar info@weerzone.nl of stuur direct een bericht. We antwoorden op werkdagen meestal binnen 24 uur.",
  alternates: { canonical: "https://weerzone.nl/contact" },
  openGraph: {
    title: "Contact opnemen met WEERZONE",
    description:
      "Stuur WEERZONE een bericht voor support, feedback, zakelijke vragen of samenwerkingen.",
    type: "website",
    locale: "nl_NL",
    url: "https://weerzone.nl/contact",
    siteName: "WEERZONE",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact opnemen met WEERZONE",
    description:
      "Support, feedback en zakelijke vragen. We antwoorden meestal binnen 24 uur op werkdagen.",
  },
};

export default async function ContactPage() {
  const loc = await getSavedLocationServer().catch(() => null);
  const activeLoc = loc || DUTCH_CITIES.find(c => c.name === "De Bilt") || DUTCH_CITIES[0];
  const initialWeather = await fetchWeatherData(activeLoc.lat, activeLoc.lon).catch(() => undefined);

  return (
    <main>
      <script {...schemaLd([
        schemaContactPage(),
        schemaBreadcrumb([
          { name: "WEERZONE", item: "https://weerzone.nl" },

          { name: "Contact", item: "https://weerzone.nl/contact" },
        ]),
      ])} />
      <WeatherDashboard
        hideWeatherInfo
        initialCity={activeLoc}
        initialWeather={initialWeather}
        beforeFooter={
          <div className="space-y-6">
            <div className="card p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-3 h-3 rounded-full bg-sky-500" />
                <span className="text-xs font-black uppercase tracking-widest text-sky-600">
                  Contact · Weerzone
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight mb-2">
                Neem contact op
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed">
                Voor support, feedback en samenwerkingen. We antwoorden op werkdagen meestal binnen 24 uur.
              </p>
            </div>

            <div className="card p-6 sm:p-8">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2">
                E-mail
              </p>
              <a
                href="mailto:info@weerzone.nl"
                className="text-2xl sm:text-3xl font-black text-slate-900 hover:text-sky-600 transition-colors break-all"
              >
                info@weerzone.nl
              </a>
              <p className="text-sm text-slate-500 leading-relaxed mt-3">
                Gebruik dit adres voor support, feedback en zakelijke vragen.
              </p>
            </div>

            <div className="card p-6 sm:p-8">
              <h2 className="text-xl font-black text-slate-900 mb-3">Direct een bericht sturen</h2>
              <ContactForm />
            </div>

            <div className="card p-6">
              <p className="text-sm text-slate-500 leading-relaxed">
                Door contact op te nemen ga je akkoord met verwerking van je bericht zoals beschreven in de{" "}
                <Link href="/privacy" className="text-sky-600 hover:underline font-semibold">
                  privacyverklaring
                </Link>.
              </p>
            </div>
          </div>
        }
      />
    </main>
  );
}
