import type { Metadata } from "next";
import Link from "next/link";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact opnemen met WeerZone? Stuur een mail naar info@weerzone.nl — we lezen alles, antwoorden op werkdagen binnen 24 uur.",
  alternates: { canonical: "https://weerzone.nl/contact" },
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white px-4 py-12">
      <div className="max-w-xl mx-auto">
        <nav className="text-xs text-white/50 mb-6">
          <Link href="/" className="hover:text-white">WeerZone</Link>
          <span className="mx-2">/</span>
          <span className="text-white/80">Contact</span>
        </nav>

        <header className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-4">Contact</h1>
          <p className="text-white/70 text-lg leading-relaxed">
            Vraag, klacht, tip, samenwerking, of gewoon een compliment? Stuur een mail. We lezen alles
            en antwoorden op werkdagen binnen 24 uur.
          </p>
        </header>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 mb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-accent-orange mb-2">
            E-mail
          </p>
          <a
            href="mailto:info@weerzone.nl"
            className="text-2xl sm:text-3xl font-black text-white hover:text-accent-orange transition-colors break-all"
          >
            info@weerzone.nl
          </a>
          <p className="text-xs text-white/50 mt-3">
            Klik op het adres of kopieer het naar je mail-app.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-black text-white mb-3">Of stuur direct een bericht</h2>
          <ContactForm />
        </section>

        <section className="space-y-4 text-sm text-white/70 leading-relaxed">
          <div className="flex gap-3">
            <span className="shrink-0 text-xl">💼</span>
            <div>
              <p className="font-bold text-white">Zakelijk / samenwerking</p>
              <p>
                Bedrijven die buiten werken, reclame, integraties:{" "}
                <Link href="/zakelijk" className="text-accent-orange hover:underline">
                  /zakelijk
                </Link>.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="shrink-0 text-xl">📧</span>
            <div>
              <p className="font-bold text-white">Piet — dagelijkse mail</p>
              <p>
                Gratis weerupdate elke ochtend. Aanmelden via de homepage.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="shrink-0 text-xl">⚠️</span>
            <div>
              <p className="font-bold text-white">Reed — extreem weer alerts</p>
              <p>
                Extra mail zodra er iets ongebruikelijks op komst is. Aanmelden op de homepage.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="shrink-0 text-xl">🔒</span>
            <div>
              <p className="font-bold text-white">Privacy</p>
              <p>
                Zie onze{" "}
                <Link href="/privacy" className="text-accent-orange hover:underline">
                  privacyverklaring
                </Link>{" "}
                voor hoe we met gegevens omgaan.
              </p>
            </div>
          </div>
        </section>

        <div className="mt-10">
          <Link
            href="/"
            className="inline-block px-6 py-3 rounded-xl bg-accent-orange text-slate-900 font-bold hover:brightness-95 transition-all"
          >
            ← Terug naar WeerZone
          </Link>
        </div>
      </div>
    </main>
  );
}
