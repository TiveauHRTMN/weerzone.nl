import type { Metadata } from "next";
import Link from "next/link";
import ContactForm from "@/components/ContactForm";
import { schemaContactPage, schemaBreadcrumb, schemaLd } from "@/lib/schema";
import { hreflangCluster } from "@/lib/hreflang";

const CONTACT_EMAIL = "info@weerzone.nl";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Neem contact op met Weerzone. Voor vragen, pers of technische meldingen.",
  alternates: {
    canonical: "https://weerzone.nl/contact",
    languages: hreflangCluster({
      nl: "/contact",
    }),
  },
  openGraph: {
    title: "Contact Weerzone",
    description:
      "Voor vragen, pers of technische meldingen.",
    type: "website",
    locale: "nl_NL",
    url: "https://weerzone.nl/contact",
    siteName: "WEERZONE",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Weerzone",
    description: "Voor vragen, pers of technische meldingen.",
  },
};

export default function ContactPage() {
  return (
    <>
      <main className="relative z-10 px-4 py-12 sm:py-16 text-white">
        <script
          {...schemaLd([
            schemaContactPage(),
            schemaBreadcrumb([
              { name: "WEERZONE", item: "https://weerzone.nl" },
              { name: "Contact", item: "https://weerzone.nl/contact" },
            ]),
          ])}
        />

        <div className="mx-auto max-w-2xl space-y-10">
          {/* Header */}
          <header className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/70">
              Contact
            </p>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white drop-shadow-sm leading-[1.05]">
              Neem contact op met Weerzone
            </h1>
            <p className="max-w-xl text-base sm:text-lg text-white/85 leading-relaxed">
              Voor vragen, pers of technische meldingen. Gebruik een echt
              e-mailadres, zodat we je kunnen bereiken.
            </p>
          </header>

          {/* E-mailadres */}
          <section className="space-y-3">
            <h2 className="text-[10px] font-black uppercase tracking-[0.22em] text-white/70 px-1">
              E-mail
            </h2>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="block rounded-2xl border border-white/20 bg-white p-6 shadow-sm transition-transform hover:scale-[1.005]"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Schrijf ons rechtstreeks
              </p>
              <p className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 break-all">
                {CONTACT_EMAIL}
              </p>
            </a>
          </section>

          {/* Form */}
          <section className="space-y-3">
            <h2 className="text-[10px] font-black uppercase tracking-[0.22em] text-white/70 px-1">
              Of stuur direct een bericht
            </h2>
            <div className="rounded-2xl border border-white/20 bg-white p-6 sm:p-8 shadow-sm">
              <ContactForm />
            </div>
          </section>

          {/* Privacy */}
          <p className="text-xs text-white/70 leading-relaxed px-1">
            Door dit formulier in te vullen ga je akkoord met de verwerking
            van je bericht zoals beschreven in het{" "}
            <Link href="/privacy" className="font-bold underline underline-offset-2 hover:text-white">
              privacybeleid
            </Link>
            .
          </p>
        </div>
      </main>
    </>
  );
}
