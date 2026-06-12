import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Voorwaarden",
  description:
    "De afspraken tussen jou en Weerzone. Kort, eerlijk, zonder juridisch geneuzel.",
  alternates: { canonical: "https://weerzone.nl/voorwaarden" },
};

export default function VoorwaardenPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#4BA3E3] to-[#2980B9]">
      <div className="max-w-2xl mx-auto px-4 py-12 sm:px-6">

        <div className="card p-6 sm:p-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Voorwaarden</h1>
            <p className="text-sm text-gray-500 mt-1">
              Laatst bijgewerkt: 10 juni 2026
            </p>
          </div>

          <p className="text-sm text-gray-700 leading-relaxed">
            Weerzone is een persoonlijke weerdienst voor de komende 48 uur.
            Door een account aan te maken ga je akkoord met deze afspraken.
            We houden ze bewust kort en leesbaar.
          </p>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-gray-900">De dienst</h2>
            <p className="text-sm text-gray-700">
              Met een gratis account krijg je toegang tot je persoonlijke
              weerpagina&apos;s en kun je weerberichten per e-mail ontvangen.
              We doen ons best de dienst altijd beschikbaar te houden, maar
              kunnen geen ononderbroken beschikbaarheid garanderen.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-gray-900">
              Het weer blijft het weer
            </h2>
            <p className="text-sm text-gray-700">
              Onze verwachtingen en waarschuwingen zijn zo goed als we ze
              kunnen maken, maar het blijven verwachtingen. Gebruik ze als
              hulpmiddel bij je planning, niet als enige basis voor
              beslissingen waarbij veiligheid of grote belangen op het spel
              staan. Weerzone is niet aansprakelijk voor schade die ontstaat
              door beslissingen op basis van onze informatie.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-gray-900">Je account</h2>
            <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
              <li>Je account is persoonlijk; houd je wachtwoord voor jezelf.</li>
              <li>
                Je kunt op elk moment stoppen. Mail naar{" "}
                <a
                  href="mailto:info@weerzone.nl"
                  className="text-accent-orange hover:underline font-medium"
                >
                  info@weerzone.nl
                </a>{" "}
                en we verwijderen je account en gegevens.
              </li>
              <li>
                E-mails van Piet, Reed of Koos zet je zelf aan of uit in
                Mijn Weerzone.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-gray-900">Eerlijk gebruik</h2>
            <p className="text-sm text-gray-700">
              Gebruik de dienst zoals die bedoeld is: voor jezelf. Het
              geautomatiseerd leegtrekken van pagina&apos;s of het doorverkopen
              van onze verwachtingen is niet de bedoeling. Bij misbruik kunnen
              we een account sluiten.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-gray-900">Je gegevens</h2>
            <p className="text-sm text-gray-700">
              Hoe we met je gegevens omgaan staat in het{" "}
              <a
                href="/privacy"
                className="text-accent-orange hover:underline font-medium"
              >
                privacybeleid
              </a>
              . Kort gezegd: we verzamelen alleen wat de dienst nodig heeft en
              delen niets met adverteerders.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-gray-900">Wijzigingen</h2>
            <p className="text-sm text-gray-700">
              Weerzone is volop in ontwikkeling. Deze voorwaarden kunnen
              veranderen; bij grote wijzigingen laten we dat weten via e-mail
              of op de site. De datum bovenaan vertelt je wanneer ze voor het
              laatst zijn bijgewerkt.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-gray-900">Contact</h2>
            <p className="text-sm text-gray-700">
              Vragen over deze voorwaarden? Mail naar{" "}
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
