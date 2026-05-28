import type { Metadata } from "next";
import Link from "next/link";
import ContactForm from "@/components/ContactForm";
import MarketingPageShell from "@/components/MarketingPageShell";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Contacta con WEERZONE para prensa, beta, negocios o feedback sobre Juan, Reed y Steve.",
  alternates: {
    canonical: "https://weerzone.nl/es/contacto",
    languages: {
      "nl-NL": "https://weerzone.nl/contact",
      "de-DE": "https://weerzone.nl/de/kontakt",
      "fr-FR": "https://weerzone.nl/fr/contact",
      "es-ES": "https://weerzone.nl/es/contacto",
      "x-default": "https://weerzone.nl/contact",
    },
  },
};

export default function ContactoPage() {
  return (
    <main>
      <MarketingPageShell locale="es">
        <header className="card p-6 sm:p-8">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-3">
            Contacto
          </p>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight mb-3">
            Aqui contesta una persona.
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Para beta, prensa, soporte o negocios. Escribimos en castellano y respondemos en horario laboral europeo.
          </p>
        </header>

        <section className="card p-6 sm:p-8">
          <h2 className="text-xl font-black text-slate-900 mb-3">Enviar un mensaje</h2>
          <ContactForm locale="es" />
        </section>

        <section className="card p-6">
          <p className="text-sm text-slate-600 leading-relaxed">
            Tambien puedes escribir a{" "}
            <a href="mailto:info@weerzone.nl" className="font-black text-sky-600 underline underline-offset-4">
              info@weerzone.nl
            </a>
            . Antes de empezar, puedes revisar{" "}
            <Link href="/es/sobre-nosotros" className="font-black text-sky-600 underline underline-offset-4">sobre nosotros</Link>{" "}
            o <Link href="/app/signup?lang=es" className="font-black text-sky-600 underline underline-offset-4">Mi Weerzone</Link>.
          </p>
        </section>
      </MarketingPageShell>
    </main>
  );
}
