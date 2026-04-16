// ============================================================
// B2B outreach email templates per branche
// ============================================================

export type B2BIndustry =
  | "glazenwasser"
  | "bouw"
  | "horeca"
  | "evenementen"
  | "agrarisch"
  | "transport"
  | "sport"
  | "schoonmaak"
  | "schildersbedrijf"
  | "dakdekker"
  | "tuinonderhoud"
  | "bezorging";

interface IndustryHook {
  headline: string;
  painPoint: string;
  solution: string;
  oneLiner: string;
  bullets: string[];
}

const HOOKS: Record<B2BIndustry, IndustryHook> = {
  glazenwasser: {
    headline: "Ramen wassen bij regen is weggegooid geld",
    painPoint: "Je rijdt naar de klant, zet je ladder neer — en het begint te regenen. Klus uitstellen, klant ontevreden, dag verspild.",
    solution: "Met WeerZone weet je 48 uur vooruit of het droog blijft. Plan je routes op basis van weerdata, niet op basis van hoop.",
    oneLiner: "Stop met gokken op droog weer. Weet het.",
    bullets: [
      "48-uurs regenvoorspelling per locatie",
      "Windsnelheid per uur (belangrijk voor hoogbouw)",
      "Dagelijkse email om 08:00 met jouw werkgebied",
    ],
  },
  bouw: {
    headline: "Beton storten bij vorst kost duizenden euro's",
    painPoint: "Kraanwerk bij te veel wind, stortwerk bij vrieskou, dakwerk bij regen — elke fout kost tijd en geld.",
    solution: "WeerZone levert KNMI HARMONIE-data op 2,5 km resolutie. Je weet per uur of het veilig is om door te werken.",
    oneLiner: "De bouwplaats draait door. Het weer beslist niet meer.",
    bullets: [
      "Windsnelheid per uur (kraanwerk-drempel instelbaar)",
      "Neerslagvoorspelling per 15 minuten",
      "Vorstmelding 48 uur vooruit",
    ],
  },
  horeca: {
    headline: "Leeg terras bij bewolking, tekort aan personeel bij zon",
    painPoint: "Personeel inplannen op basis van een 14-daagse die niet klopt. Te veel mensen op een regendag, te weinig als het 25° wordt.",
    solution: "Plan je terras-personeel op basis van 48-uurs weerdata. Elke dag om 08:00 weet je precies wat je die dag nodig hebt.",
    oneLiner: "Personeelskosten omlaag. Terrasomzet omhoog.",
    bullets: [
      "Temperatuur en zon per uur — plan je terrascapaciteit",
      "Regenalert — dekzeilen en parasols op tijd",
      "48u vooruit = inkoop afstemmen op weersomstandigheden",
    ],
  },
  evenementen: {
    headline: "Eén onverwachte bui kan een heel event ruïneren",
    painPoint: "Noodtenten bestellen op het laatste moment kost het dubbele. Bezoekers die weglopen door regen komen niet terug.",
    solution: "48 uur is genoeg om operationele beslissingen te nemen. Tenten, beveiliging, noodplannen — allemaal op tijd.",
    oneLiner: "Geen verrassing. Geen paniek. Geen schade.",
    bullets: [
      "Neerslagkans per uur — plan je opbouw en afbouw",
      "Windstoten-alert — podium en tenten beveiligen",
      "Onweersrisico — bliksemprotocol op tijd activeren",
    ],
  },
  agrarisch: {
    headline: "Oogsten bij regen vernietigt opbrengst",
    painPoint: "Spuiten bij wind is geldverspilling. Maaien op een nat veld beschadigt de bodem. Te laat oogsten door onverwachte regen kost de helft van je opbrengst.",
    solution: "WeerZone geeft je per uur de exacte neerslag, wind en temperatuur voor jouw perceel. Plan op data, niet op gevoel.",
    oneLiner: "Het veld wacht niet. Jouw planning ook niet.",
    bullets: [
      "Neerslag per uur — plan zaai-, spuit- en oogstmomenten",
      "Windsnelheid — effectief spuiten vereist <3 Bft",
      "Vorstmelding — gewassen beschermen voor het te laat is",
    ],
  },
  transport: {
    headline: "Elke stilstaande vrachtwagen kost €500 per dag",
    painPoint: "Gladheid, storm, mist — weergerelateerde uitval kost de transportsector miljoenen per jaar.",
    solution: "48-uurs weerdata per route. Je chauffeurs weten vooraf wat ze tegenkomen. Jij plant je vloot efficiënter.",
    oneLiner: "De route kent geen verrassingen meer.",
    bullets: [
      "Gladheidsrisico per regio — nachtvorst 48u vooruit",
      "Windstoten — bijzonder voertuig-advies automatisch",
      "Mistmelding — vertragingen voorspellen en communiceren",
    ],
  },
  sport: {
    headline: "Training annuleren op het laatste moment is amateuristisch",
    painPoint: "Spelers die voor niets komen, velden die beschadigd raken door regen, competitiewedstrijden die te laat worden afgelast.",
    solution: "Communiceer 48 uur van tevoren. Velden sparen, planning optimaliseren, spelers en ouders op tijd informeren.",
    oneLiner: "Professionele planning begint bij het weer.",
    bullets: [
      "Neerslag en veldcondities — 48u vooruit",
      "Onweersrisico — veiligheidsprotocol tijdig activeren",
      "Temperatuuralerts — hittemaatregelen of vorstbescherming",
    ],
  },
  schoonmaak: {
    headline: "Gevelreiniging bij regen is twee keer hetzelfde werk",
    painPoint: "Ruitenreiniging, gevelreiniging, terrasreiniging — alles afhankelijk van droog weer. Fout plannen = dubbel werk.",
    solution: "Plan je buitenklussen op basis van 48-uurs droogperiodes. Nooit meer een dag verspillen aan weer dat niet meewerkt.",
    oneLiner: "Één keer goed. Niet twee keer over.",
    bullets: [
      "Droogperiodes per dag — plan buitenwerk efficiënt",
      "Windsnelheid — hoogwerker alleen bij veilige condities",
      "Regenradar — weet wanneer je binnen moet beginnen",
    ],
  },
  schildersbedrijf: {
    headline: "Buitenwerk bij regen = verspilde verf én tijd",
    painPoint: "Latex droogt niet onder 10°C. Regen op natte verf betekent opnieuw beginnen. Een verkeerde planning kost materiaal en uren.",
    solution: "WeerZone toont droogperiodes, temperatuur en luchtvochtigheid per uur. Plan je buitenwerk wanneer het écht kan.",
    oneLiner: "De verf droogt. Gegarandeerd.",
    bullets: [
      "Temperatuur per uur — minimaal 10°C voor buitenwerk",
      "Luchtvochtigheid — droogtijden berekenen",
      "48-uurs droog-window — plan je grootste klussen",
    ],
  },
  dakdekker: {
    headline: "Op een nat dak werken is levensgevaarlijk",
    painPoint: "Uitglijden op natte dakpannen, materiaal dat niet hecht bij regen, klussen die halverwege worden afgebroken.",
    solution: "Weet 48 uur vooruit wanneer het dak droog en veilig is. Plan je team, materiaal en kraan op het juiste moment.",
    oneLiner: "Veilig omhoog. Elke dag.",
    bullets: [
      "Regenvrije periodes — plan dakreparaties met zekerheid",
      "Windsnelheid — maximaal Bft 5 voor dakwerk",
      "Vorstmelding — dakbedekking hecht niet bij vrieskou",
    ],
  },
  tuinonderhoud: {
    headline: "Gras maaien bij regen, snoeien bij storm — zinloos",
    painPoint: "Klanten verwachten een strak gazon, maar jij kunt niet maaien als het veld drassig is. Snoeien bij harde wind is gevaarlijk.",
    solution: "Plan je routes per dag op basis van weer per locatie. Droge dagen voor gazonwerk, windstille dagen voor snoeiwerk.",
    oneLiner: "De tuin wordt perfect. Het weer werkt mee.",
    bullets: [
      "Droog-periodes per dag — gazononderhoud plannen",
      "Windsnelheid — veilig snoeien en kappen",
      "Vorstmelding — plantbescherming op tijd regelen",
    ],
  },
  bezorging: {
    headline: "Gladheid, storm, extreme hitte — je chauffeurs verdienen bescherming",
    painPoint: "Pakketbezorgers op gladde wegen, fietskoeriers in stormwind, voedsel dat bevriest of oververhit raakt.",
    solution: "Geef je team 48 uur vooruit de weersituatie. Routes aanpassen, extra tijd inplannen, veiligheid voorop.",
    oneLiner: "Veilig bezorgen. Bij elk weer.",
    bullets: [
      "Gladheidsrisico per uur — route-aanpassingen op tijd",
      "Windstoten — fietskoeriers veilig inplannen",
      "Extreme temperatuur — productbescherming activeren",
    ],
  },
};

export function getIndustryHook(industry: B2BIndustry): IndustryHook {
  return HOOKS[industry] ?? HOOKS.bouw;
}

export function getB2BSubject(industry: B2BIndustry, city?: string): string {
  const hook = HOOKS[industry];
  if (!hook) return "48-uurs weerdata voor jouw bedrijf — WeerZone";
  const location = city ? ` in ${city}` : "";
  return `${hook.headline}${location}`;
}

export function getB2BEmailHtml(
  industry: B2BIndustry,
  businessName: string,
  city?: string
): string {
  const hook = getIndustryHook(industry);
  const location = city || "jouw regio";
  const unsubscribeUrl = "https://weerzone.nl/api/unsubscribe";

  const bulletsHtml = hook.bullets
    .map(
      (b) =>
        `<li style="padding:6px 0;color:#475569;font-size:14px;line-height:1.5;">${b}</li>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:520px;margin:0 auto;">

    <!-- HEADER -->
    <div style="background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);padding:32px 24px 28px;text-align:center;">
      <img src="https://weerzone.nl/logo-full.png" alt="WeerZone" style="height:32px;width:auto;margin-bottom:6px;opacity:0.9;" />
      <p style="color:rgba(255,255,255,0.5);font-size:9px;margin:0 0 24px;letter-spacing:2px;text-transform:uppercase;font-weight:700;">Data Intelligence · 48-uurs Impact Monitor</p>
      <h1 style="color:#ffffff;font-size:24px;font-weight:900;margin:0;line-height:1.3;">${hook.headline}</h1>
    </div>

    <!-- ONE-LINER -->
    <div style="background:#f59e0b;padding:12px 24px;text-align:center;">
      <p style="margin:0;font-size:13px;color:#1e293b;font-weight:700;">${hook.oneLiner}</p>
    </div>

    <!-- BODY -->
    <div style="background:#ffffff;padding:28px 24px;">
      <p style="margin:0 0 16px;font-size:15px;color:#1e293b;font-weight:700;">Beste ${businessName},</p>

      <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.6;">${hook.painPoint}</p>

      <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.6;">${hook.solution}</p>

      <!-- EXCLUSIVE OFFER BOX -->
      <div style="background:#fff7ed;border:2px dashed #f59e0b;border-radius:12px;padding:20px;margin:24px 0;text-align:center;">
        <p style="margin:0 0 8px;font-size:12px;color:#c2410c;font-weight:800;text-transform:uppercase;letter-spacing:1px;">Founding Member Actie 🚀</p>
        <p style="margin:0 0 16px;font-size:14px;color:#7c2d12;font-weight:600;line-height:1.4;">
          We zoeken de eerste 10 ${industry}bedrijven die WeerZone willen helpen perfect te worden. Jij test, wij leren.
        </p>
        <div style="background:#f59e0b;color:#1e293b;padding:8px 12px;border-radius:6px;display:inline-block;font-weight:800;font-size:13px;">
          GRATIS TOEGANG — Geen factuur, nooit.
        </div>
      </div>

      <!-- WAT JE KRIJGT -->
      <div style="background:#f8fafc;border-radius:12px;padding:20px;margin:20px 0;border:1px solid #e2e8f0;">
        <p style="margin:0 0 12px;font-size:12px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Wat je krijgt voor ${location}</p>
        <ul style="margin:0;padding-left:20px;list-style:none;">
          ${bulletsHtml}
        </ul>
      </div>

      <p style="margin:0 0 8px;font-size:14px;color:#475569;line-height:1.6;">Aanmelden duurt 30 seconden. Claim je plek voordat de 10 Founding Member-slots in ${location} vol zijn.</p>
    </div>

    <!-- CTA -->
    <div style="background:#ffffff;padding:0 24px 28px;text-align:center;">
      <a href="https://weerzone.nl/zakelijk" style="display:block;padding:16px;background:#f59e0b;color:#1e293b;font-weight:800;font-size:15px;border-radius:12px;text-decoration:none;text-align:center;box-shadow:0 4px 16px rgba(245,158,11,0.3);">
        Gratis aanmelden →
      </a>
      <p style="margin:20px 0 0;font-size:13px;color:#475569;"><strong>Team WeerZone</strong></p>
    </div>

    <!-- TRUST -->
    <div style="background:#f8fafc;padding:20px 24px;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;">
      <table cellpadding="0" cellspacing="0" border="0" style="width:100%;"><tr>
        <td style="text-align:center;padding:0 8px;">
          <p style="margin:0;font-size:20px;">🛡️</p>
          <p style="margin:4px 0 0;font-size:10px;color:#64748b;font-weight:600;">KNMI HARMONIE</p>
        </td>
        <td style="text-align:center;padding:0 8px;">
          <p style="margin:0;font-size:20px;">📡</p>
          <p style="margin:4px 0 0;font-size:10px;color:#64748b;font-weight:600;">2,5 km resolutie</p>
        </td>
        <td style="text-align:center;padding:0 8px;">
          <p style="margin:0;font-size:20px;">⏰</p>
          <p style="margin:4px 0 0;font-size:10px;color:#64748b;font-weight:600;">Elke ochtend 08:00</p>
        </td>
      </tr></table>
    </div>

    <!-- FOOTER -->
    <div style="padding:20px 24px;text-align:center;">
      <p style="margin:0;font-size:11px;color:#94a3b8;">
        WeerZone.nl — 48 uur. De rest is ruis.<br>
        <span style="font-size:10px;">Dit bericht is verstuurd omdat jouw bedrijf profiteert van nauwkeurige weerdata.</span>
      </p>
      <p style="margin:10px 0 0;font-size:11px;">
        <a href="${unsubscribeUrl}" style="color:#94a3b8;text-decoration:underline;">Geen interesse? Schrijf je uit.</a>
      </p>
    </div>

  </div>
</body>
</html>`;
}
