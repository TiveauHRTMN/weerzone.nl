import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle, Mail, Send, ShieldCheck, ArrowUpRight } from "lucide-react";
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
          <div className="space-y-5 sm:space-y-6">
            <div className="card p-8 sm:p-12 lg:p-14">
              <div className="flex items-center gap-2 mb-6">
                <MessageCircle className="w-3.5 h-3.5 text-slate-400" strokeWidth={2.25} aria-hidden />
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  Contact · Weerzone
                </span>
              </div>
              <h1 className="text-[40px] sm:text-[56px] font-black text-slate-900 leading-[1.04] tracking-[-0.025em] mb-6">
                Neem contact op
              </h1>
              <p className="text-lg sm:text-xl text-slate-500 leading-[1.55] max-w-[34rem]">
                Voor support, feedback en samenwerkingen. We antwoorden op werkdagen meestal binnen 24 uur.
              </p>
            </div>

            <a
              href="mailto:info@weerzone.nl"
              className="card p-6 sm:p-8 block group no-underline"
              aria-label="Stuur e-mail naar info@weerzone.nl"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="inline-flex items-center gap-2 mb-4 px-2.5 py-1 rounded-md bg-slate-100">
                    <Mail className="w-3.5 h-3.5 text-slate-500" strokeWidth={2.5} aria-hidden />
                    <span className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-600">
                      E-mail
                    </span>
                  </div>
                  <div
                    className="text-2xl sm:text-3xl font-black text-slate-900 break-all leading-tight transition-colors"
                    style={{ transitionDuration: "180ms" }}
                  >
                    <span className="group-hover:text-[color:var(--wz-brand)] transition-colors">
                      info@weerzone.nl
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed mt-3">
                    Gebruik dit adres voor support, feedback en zakelijke vragen.
                  </p>
                </div>
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center flex-none transition-all"
                  style={{ background: "var(--wz-brand-soft)" }}
                >
                  <ArrowUpRight
                    className="w-5 h-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    strokeWidth={2.5}
                    style={{ color: "var(--wz-brand)" }}
                    aria-hidden
                  />
                </div>
              </div>
            </a>

            <div className="card p-6 sm:p-8">
              <div className="inline-flex items-center gap-2 mb-4 px-2.5 py-1 rounded-md bg-slate-100">
                <Send className="w-3.5 h-3.5 text-slate-500" strokeWidth={2.5} aria-hidden />
                <span className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-600">
                  Bericht
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight tracking-tight mb-5">
                Direct een bericht sturen
              </h2>
              <ContactForm />
            </div>

            <div className="card p-5 sm:p-6 flex items-start gap-4">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-none"
                style={{ background: "var(--wz-brand-soft)" }}
              >
                <ShieldCheck className="w-5 h-5" strokeWidth={2.5} style={{ color: "var(--wz-brand)" }} aria-hidden />
              </div>
              <p className="text-sm text-slate-600 leading-relaxed pt-1.5">
                Door contact op te nemen ga je akkoord met verwerking van je bericht zoals beschreven in de{" "}
                <Link
                  href="/privacy"
                  className="font-bold underline decoration-2 underline-offset-2 transition-colors"
                  style={{
                    color: "var(--wz-brand)",
                    textDecorationColor: "rgba(59,127,240,0.4)",
                  }}
                >
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
