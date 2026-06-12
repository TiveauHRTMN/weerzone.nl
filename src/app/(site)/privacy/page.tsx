import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacybeleid",
  description: "Hoe WEERZONE omgaat met je gegevens. Kort, eerlijk, zonder juridisch geneuzel.",
  alternates: { canonical: "https://weerzone.nl/privacy" },
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#4BA3E3] to-[#2980B9]">
      <div className="max-w-2xl mx-auto px-4 py-12 sm:px-6">

        <div className="card p-6 sm:p-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Privacybeleid</h1>
            <p className="text-sm text-gray-500 mt-1">
              Laatst bijgewerkt: 8 april 2026
            </p>
          </div>

          <p className="text-sm text-gray-700 leading-relaxed">
            Weerzone is je persoonlijke weeragent voor de komende 48 uur. Met je
            gegevens zijn we zuinig: we verzamelen alleen wat de dienst nodig
            heeft en delen niets met adverteerders of marketingpartners.
          </p>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-gray-900">Wat we verzamelen</h2>
            <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
              <li>
                <strong>Account:</strong> je naam, e-mailadres en wachtwoord als
                je een account aanmaakt. Wachtwoorden worden versleuteld
                opgeslagen; we kunnen ze zelf niet lezen.
              </li>
              <li>
                <strong>E-mailadres:</strong> alleen als je je aanmeldt voor onze weerberichten of waarschuwingen. We gebruiken dit uitsluitend om je de weerrapporten te sturen waarvoor je hebt gekozen.
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
                <strong>Functioneel:</strong> we onthouden je gekozen plek
                (wz_lat / wz_lon / wz_name) zodat je niet bij elk bezoek
                opnieuw hoeft te zoeken. Als je ingelogd bent in Mijn
                Weerzone houden Supabase-sessiecookies je sessie veilig.
              </p>
              <p>
                <strong>Analytics:</strong> PostHog en Vercel Analytics
                geven ons geanonimiseerd inzicht in welke pagina&apos;s
                bezocht worden en hoe snel ze laden. Er wordt geen profiel
                van jou opgebouwd voor advertenties.
              </p>
              <p>
                <strong>Geen advertentie- of affiliate-cookies.</strong>{" "}
                Weerzone werkt niet met Amazon, Bol, Booking of Expedia, en
                heeft geen AdSense. Voor de volledige uitleg zie het{" "}
                <a
                  href="/over#cookiebeleid"
                  className="text-accent-orange hover:underline font-medium"
                >
                  cookiebeleid
                </a>
                .
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
              Weergegevens komen van externe weerbronnen.
              De API-calls bevatten alleen coördinaten, geen identificerende informatie.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-gray-900">Je rechten</h2>
            <p className="text-sm text-gray-700">
              Je kunt je cookie-voorkeur altijd wijzigen door je browserdata te
              wissen. Heb je een account, dan kun je je gegevens inzien of laten
              verwijderen: mail naar{" "}
              <a
                href="mailto:info@weerzone.nl"
                className="text-accent-orange hover:underline font-medium"
              >
                info@weerzone.nl
              </a>{" "}
              en we regelen het.
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
        </div>
      </div>
    </main>
  );
}
