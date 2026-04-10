import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacybeleid — WeerZone",
  description: "Hoe WeerZone omgaat met je gegevens. Kort, eerlijk, zonder juridisch geneuzel.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#4BA3E3] to-[#2980B9]">
      <div className="max-w-2xl mx-auto px-4 py-12 sm:px-6">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm mb-8 transition-colors"
        >
          ← Terug naar WeerZone
        </a>

        <div className="card p-6 sm:p-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Privacybeleid</h1>
            <p className="text-sm text-gray-500 mt-1">
              Laatst bijgewerkt: 8 april 2026
            </p>
          </div>

          <p className="text-sm text-gray-700 leading-relaxed">
            WeerZone is de brutale weerdienst van Nederland. Maar met je gegevens
            zijn we niet brutaal — daar zijn we juist heel voorzichtig mee.
          </p>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-gray-900">Wat we verzamelen</h2>
            <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
              <li>
                <strong>Locatie (optioneel):</strong> alleen als je op de locatieknop
                klikt. Wordt niet opgeslagen.
              </li>
              <li>
                <strong>Stadkeuze:</strong> onthouden we lokaal in je browser
                (localStorage).
              </li>
              <li>
                <strong>Cookie-voorkeur:</strong> of je cookies accepteert.
                Lokaal opgeslagen.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-gray-900">Cookies</h2>
            <div className="text-sm text-gray-700 space-y-2">
              <p>
                <strong>Noodzakelijk:</strong> je voorkeuren onthouden. Geen tracking.
              </p>
              <p>
                <strong>Affiliate-cookies:</strong> als je doorklikt naar Bol.com,
                Booking.com of Thuisbezorgd, plaatsen zij cookies om te meten dat
                je via WeerZone komt. Hier verdienen wij een kleine commissie mee.
                Dit gebeurt alleen als je actief doorklikt én je cookies hebt
                geaccepteerd.
              </p>
              <p>
                <strong>Analytics:</strong> we gebruiken anonieme, privacy-vriendelijke
                analytics (geen Google Analytics). Geen persoonlijke data.
              </p>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-gray-900">Wat we NIET doen</h2>
            <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
              <li>Je gegevens verkopen. Nooit.</li>
              <li>Je tracken over het internet. Nee.</li>
              <li>Persoonlijke profielen opbouwen. Nope.</li>
              <li>Je e-mailadres vragen. Waarom zou je?</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-gray-900">Weer-data</h2>
            <p className="text-sm text-gray-700">
              Weerdata komt van Open-Meteo (KNMI HARMONIE + DWD ICON modellen).
              Open-Meteo verwerkt geen persoonsgegevens. De API-calls bevatten
              alleen coördinaten, geen identificerende informatie.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-gray-900">Je rechten</h2>
            <p className="text-sm text-gray-700">
              Je kunt je cookie-voorkeur altijd wijzigen door je browserdata te
              wissen. Aangezien we geen persoonsgegevens opslaan, is er niks om
              in te zien of te verwijderen.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-gray-900">Contact</h2>
            <p className="text-sm text-gray-700">
              Vragen? Mail naar{" "}
              <a
                href="mailto:info@weerzone.nl"
                className="text-accent-orange hover:underline font-medium"
              >
                info@weerzone.nl
              </a>
            </p>
          </section>

          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-400">
              © {new Date().getFullYear()} WeerZone.nl — 48 uur. De rest is ruis.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
