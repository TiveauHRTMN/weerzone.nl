import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacybeleid — WEERZONE",
  description: "Hoe WEERZONE omgaat met je gegevens. Kort, eerlijk, zonder juridisch geneuzel.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#4BA3E3] to-[#2980B9]">
      <div className="max-w-2xl mx-auto px-4 py-12 sm:px-6">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm mb-8 transition-colors"
        >
          ← Terug naar WEERZONE
        </a>

        <div className="card p-6 sm:p-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Privacybeleid</h1>
            <p className="text-sm text-gray-500 mt-1">
              Laatst bijgewerkt: 8 april 2026
            </p>
          </div>

          <p className="text-sm text-gray-700 leading-relaxed">
            WEERZONE is de brutale weerdienst van Nederland. Maar met je gegevens
            zijn we niet brutaal — daar zijn we juist heel voorzichtig mee.
          </p>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-gray-900">Wat we verzamelen</h2>
            <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
              <li>
                <strong>E-mailadres:</strong> alleen als je je aanmeldt voor een van onze briefings (Piet, Reed of Steve). We gebruiken dit uitsluitend om je de weerrapporten te sturen waarvoor je hebt gekozen.
              </li>
              <li>
                <strong>Locatie (optioneel):</strong> alleen als je op de locatieknop
                klikt of je postcode opgeeft voor de briefing. Wordt gebruikt voor de weersverwachting, niet voor tracking.
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
                <strong>Noodzakelijk:</strong> je voorkeuren onthouden en je sessie veilig houden als je ingelogd bent. Geen tracking.
              </p>
              <p>
                <strong>Affiliate-cookies:</strong> als je doorklikt naar Bol.com,
                Booking.com of Amazon, plaatsen zij cookies om te meten dat
                je via WEERZONE komt. Hier verdienen wij een kleine commissie mee.
                Dit gebeurt alleen als je actief doorklikt.
              </p>
              <p>
                <strong>Analytics:</strong> we gebruiken anonieme analytics (PostHog) om de site te verbeteren. Geen persoonlijke data wordt gekoppeld aan je browser-gedrag tenzij je bent ingelogd.
              </p>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-gray-900">Wat we NIET doen</h2>
            <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
              <li>Je gegevens verkopen aan derden. Nooit.</li>
              <li>Je tracken over het internet voor advertenties. Nee.</li>
              <li>Je inbox volspammen met onzin. Alleen het weerbericht dat je vroeg.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-gray-900">Weer-data</h2>
            <p className="text-sm text-gray-700">
              Weerdata komt van Open-Meteo (KNMI HARMONIE model).
              De API-calls bevatten alleen coördinaten, geen identificerende informatie.
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
              © {new Date().getFullYear()} WEERZONE.nl — 48 uur. De rest is ruis.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
