// ============================================================
// B2B outreach email templates per branche
// ============================================================

import { amazonProductUrl, amazonUrl } from "./affiliates";

type GearItem = { emoji: string; title: string; desc: string; href: string };

const GEAR: Record<string, GearItem[]> = {
  glazenwasser: [
    { emoji: "☂️", title: "Senz° stormparaplu", desc: "Als het tóch tegenzit onderweg — windproof tot 100 km/u.", href: amazonProductUrl("B07B8K47M2") },
    { emoji: "🧤", title: "Waterdichte werkhandschoenen", desc: "Grip op natte ladders, warme vingers.", href: amazonUrl("waterdichte werkhandschoenen winter grip") },
    { emoji: "🧥", title: "Regenpak heren/dames", desc: "Als de weersmelding tóch afwijkt.", href: amazonUrl("regenpak werk waterdicht heren") },
  ],
  bouw: [
    { emoji: "🦺", title: "Thermo-werkkleding set", desc: "Blijven doorwerken bij vorst.", href: amazonProductUrl("B0DB2TYZ3W") },
    { emoji: "🧤", title: "Gevoerde werkhandschoenen", desc: "Grip + warmte bij nul graden.", href: amazonUrl("werkhandschoenen gevoerd winter") },
    { emoji: "❄️", title: "Antivries beton-dekzeil", desc: "Verse stort beschermen bij nachtvorst.", href: amazonUrl("thermo dekzeil bouw beton") },
  ],
  horeca: [
    { emoji: "🔥", title: "Terrasverwarmer elektrisch", desc: "Gasten blijven zitten als de avond afkoelt.", href: amazonUrl("terrasverwarmer elektrisch heater") },
    { emoji: "⛱️", title: "Zware parasolvoet 50kg", desc: "Houdt stand bij plotse windvlagen.", href: amazonUrl("parasolvoet 50kg gevuld zwaar") },
    { emoji: "🌬️", title: "Ventilator staand horeca", desc: "Terras aangenaam bij 28°+.", href: amazonUrl("ventilator staand horeca krachtig") },
  ],
  evenementen: [
    { emoji: "⛺", title: "Partytent stormverankering", desc: "Grondankers voor als Bft 6 opduikt.", href: amazonUrl("partytent grondankers stormset") },
    { emoji: "🎪", title: "Waterdichte zijwanden", desc: "Droog podium, droge gasten.", href: amazonUrl("partytent zijwanden waterdicht") },
    { emoji: "🔦", title: "Noodverlichting oplaadbaar", desc: "Voor als onweer het stroompunt raakt.", href: amazonUrl("led noodverlichting oplaadbaar event") },
  ],
  agrarisch: [
    { emoji: "🌧️", title: "Regenmeter digitaal", desc: "Eigen perceel-data naast WEERZONE.", href: amazonUrl("digitale regenmeter draadloos tuin") },
    { emoji: "🌡️", title: "Bodemthermometer professioneel", desc: "Zaaien op het juiste moment.", href: amazonUrl("bodemthermometer professioneel landbouw") },
    { emoji: "🧊", title: "Vliesdoek vorstbescherming", desc: "Gewassen sparen bij nachtvorst.", href: amazonUrl("vliesdoek vorstbescherming tuin xxl") },
  ],
  transport: [
    { emoji: "❄️", title: "Strooizout 25kg", desc: "Eigen laadperron ijsvrij houden.", href: amazonUrl("strooizout 25kg bigbag") },
    { emoji: "🪟", title: "Voorruit anti-vries dekzeil XL", desc: "5 minuten tijdwinst elke ochtend-shift.", href: amazonUrl("voorruit dekzeil xl vrachtwagen") },
    { emoji: "🔦", title: "LED-mistlamp 12V/24V", desc: "Zicht als mist onverwacht ligt.", href: amazonUrl("led mistlamp vrachtwagen 24v") },
  ],
  sport: [
    { emoji: "☔", title: "Stormparaplu XL trainer", desc: "Staf droog langs de lijn.", href: amazonProductUrl("B07B8K47M2") },
    { emoji: "🧤", title: "Keeperstraining handschoenen koud", desc: "Grip bij vorst en vochtigheid.", href: amazonUrl("keepershandschoenen winter grip") },
    { emoji: "🚰", title: "Bidon rack 12x (hitte)", desc: "Hydratatie bij 25°+ trainingen.", href: amazonUrl("bidonrek 12 teamsport") },
  ],
  schoonmaak: [
    { emoji: "💨", title: "Bladblazer accu professional", desc: "Natte bladeren snel weg voor terras wassen.", href: amazonUrl("bladblazer accu professioneel") },
    { emoji: "🪣", title: "Microvezel-set droog/nat", desc: "Schakelt mee met het weer.", href: amazonUrl("microvezel doeken set professioneel") },
    { emoji: "🧤", title: "Nitril werkhandschoenen", desc: "Grip ook onder natte condities.", href: amazonUrl("nitril werkhandschoenen professional") },
  ],
  schildersbedrijf: [
    { emoji: "🌡️", title: "Infrarood thermometer oppervlak", desc: "Meet of de gevel warm genoeg is (10°+).", href: amazonUrl("infrarood thermometer oppervlak") },
    { emoji: "💧", title: "Vochtmeter hout/steen", desc: "Weet of de ondergrond écht droog is.", href: amazonUrl("vochtmeter hout professioneel") },
    { emoji: "🛡️", title: "Afdekzeil professional zwaar", desc: "Onverwachte bui? Geen paniek.", href: amazonUrl("afdekzeil professioneel waterdicht zwaar") },
  ],
  dakdekker: [
    { emoji: "🦺", title: "Valbeveiliging harnas set", desc: "Verplicht bij wind — deze set is compleet.", href: amazonUrl("valbeveiliging harnas set dak") },
    { emoji: "☂️", title: "Senz° stormparaplu", desc: "Voor de weg heen en terug.", href: amazonProductUrl("B07B8K47M2") },
    { emoji: "🧤", title: "Snijvaste werkhandschoenen", desc: "Grip op natte pannen, cut-resistant.", href: amazonUrl("snijvaste werkhandschoenen dak") },
  ],
  tuinonderhoud: [
    { emoji: "✂️", title: "Accu-heggenschaar professioneel", desc: "Werkt door waar benzine natwerk faalt.", href: amazonUrl("accu heggenschaar professioneel makita") },
    { emoji: "🥾", title: "Waterdichte werkschoenen S3", desc: "Drassig gras? Droge voeten.", href: amazonUrl("werkschoenen s3 waterdicht heren") },
    { emoji: "🧊", title: "Vliesdoek vorstbescherming", desc: "Klant-planten beschermen bij nachtvorst.", href: amazonUrl("vliesdoek vorstbescherming tuin") },
  ],
  bezorging: [
    { emoji: "🧥", title: "Windbreaker koeriersjas", desc: "Fietsen bij Bft 6 zonder trillen.", href: amazonProductUrl("B0DLH9WJSG") },
    { emoji: "🧤", title: "Koerier-handschoenen touchscreen", desc: "Telefoon bedienen bij vorst.", href: amazonUrl("fietshandschoenen winter touchscreen") },
    { emoji: "🎒", title: "Waterdichte koerierstas", desc: "Zendingen droog bij elke bui.", href: amazonUrl("waterdichte koerierstas rolltop") },
  ],
};

function buildGearHtml(industry: string): string {
  const items = GEAR[industry] || GEAR.bouw;
  const rows = items.map(i => `
    <a href="${i.href}" target="_blank" rel="sponsored noopener" style="display:block;padding:12px 14px;background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:8px;text-decoration:none;">
      <div style="display:flex;align-items:center;gap:12px;">
        <span style="font-size:24px;">${i.emoji}</span>
        <div style="flex:1;">
          <p style="margin:0;font-size:13px;font-weight:800;color:#1e293b;line-height:1.3;">${i.title}</p>
          <p style="margin:2px 0 0;font-size:11px;color:#64748b;line-height:1.4;">${i.desc}</p>
        </div>
        <span style="color:#f59e0b;font-size:14px;font-weight:900;">→</span>
      </div>
    </a>
  `).join("");
  return `
    <div style="background:#f8fafc;border-radius:12px;padding:18px;margin:20px 0;border:1px solid #e2e8f0;">
      <p style="margin:0 0 4px;font-size:11px;color:#94a3b8;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;">Uitrusting die meewerkt</p>
      <p style="margin:0 0 14px;font-size:12px;color:#64748b;">Branche-specifiek, getest door collega's. Amazon-partnerlinks.</p>
      ${rows}
    </div>
  `;
}

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
    solution: "Met WEERZONE weet je 48 uur vooruit of het droog blijft. Plan je routes op basis van weerdata, niet op basis van hoop.",
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
    solution: "WEERZONE levert KNMI HARMONIE-data op 2,5 km resolutie. Je weet per uur of het veilig is om door te werken.",
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
    solution: "WEERZONE geeft je per uur de exacte neerslag, wind en temperatuur voor jouw perceel. Plan op data, niet op gevoel.",
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
    solution: "WEERZONE toont droogperiodes, temperatuur en luchtvochtigheid per uur. Plan je buitenwerk wanneer het écht kan.",
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

export type OutreachStage = 1 | 2 | 3;

// Lichte type-ref — full type woont in b2b-relevance
interface WeatherSnippetLike {
  city: string;
  temp: number;
  desc: string;
  windMax: number;
  rain48h: number;
  tempMin: number;
  tempMax: number;
  event: { kind: string; label: string; urgencyHours: number } | null;
}

export function getB2BSubject(
  industry: B2BIndustry,
  city?: string,
  stage: OutreachStage = 1,
  snippet?: WeatherSnippetLike | null,
): string {
  const hook = HOOKS[industry];
  const location = city ? ` in ${city}` : "";

  // Stage 1 met event → event-in-subject (hoogste open rate)
  if (stage === 1 && snippet?.event) {
    return `⚠️ ${snippet.event.label}${location} — voor ${industry}`;
  }
  if (stage === 2) return `Korte herinnering: ${hook?.headline ?? "WEERZONE"}${location}`;
  if (stage === 3) return `Laatste mail van mij${location}`;
  if (!hook) return "48-uurs weerdata voor jouw bedrijf — WEERZONE";
  return `${hook.headline}${location}`;
}

function buildWeatherSnippetHtml(snippet: WeatherSnippetLike | null | undefined): string {
  if (!snippet) return "";
  const eventPill = snippet.event
    ? `<div style="margin-top:10px;padding:10px 14px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;">
         <p style="margin:0;font-size:12px;color:#991b1b;font-weight:800;text-transform:uppercase;letter-spacing:1px;">⚠️ Alert voor ${snippet.city}</p>
         <p style="margin:4px 0 0;font-size:13px;color:#7f1d1d;font-weight:700;line-height:1.4;">${snippet.event.label}</p>
       </div>`
    : "";
  return `
    <div style="background:#ecfeff;border:1px solid #a5f3fc;border-radius:12px;padding:16px 18px;margin:0 0 20px;">
      <p style="margin:0 0 6px;font-size:10px;color:#0e7490;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;">Live 48-uurs voor ${snippet.city}</p>
      <p style="margin:0;font-size:14px;color:#0c4a6e;line-height:1.5;">
        Nu <strong>${Math.round(snippet.temp)}°</strong> · ${snippet.desc} ·
        <strong>${Math.round(snippet.tempMin)}°/${Math.round(snippet.tempMax)}°</strong> ·
        wind tot <strong>${Math.round(snippet.windMax)} km/u</strong> ·
        neerslag <strong>${snippet.rain48h.toFixed(1)}mm</strong>
      </p>
      ${eventPill}
    </div>
  `;
}

// ============================================================
// Steve-persona (afgeleid van Steve Jobs):
// - Korte declaratieve zinnen.
// - Geen marketing-taal. Geen "oplossingen", geen "synergy".
// - Minachting voor ruis, 14-daagse voorspellingen, dashboards.
// - "Het werkt gewoon." Herhaal kernbelofte.
// - One more thing → altijd als subtiele close.
// ============================================================

export const STEVE_PROMPT = `
Role: Steve van WEERZONE Zakelijk.
Persona: Afgeleid van Steve Jobs. Minimalistisch. Declaratief. Geen marketing-BS.

STIJL:
- Korte zinnen. Veel punten. Pauzes zijn macht.
- Geen jargon. Geen "oplossingen", "synergy", "optimaliseren".
- Spreek de lezer direct aan.
- Minachting voor complexiteit en ruis.
- Herhaal de kernbelofte: 48 uur. De rest is ruis.
- Sluit af met één scherpe zin. Geen call-to-actions-stapels.

REGELS:
- Max 60 woorden.
- Geen emoji's in tekstbody.
- Geen bullet-lists in outreach-tekst (die zitten al in de template).
`.trim();

function stageCopy(stage: OutreachStage, hook: IndustryHook, businessName: string, snippet: WeatherSnippetLike | null | undefined) {
  const city = snippet?.city || "jouw regio";

  if (stage === 2) {
    return {
      headline: `Eén ding.`,
      intro: `${businessName},`,
      body: `Vorige week stuurde ik een mail. Geen reactie. Prima.\n\nKijk omhoog. Dat is ${city}. 48 uur vooruit. Elke ochtend. Zo simpel.\n\nGeen dashboard. Geen app. Geen 14-daagse fantasie. Eén mail.`,
      proof: `Het werkt. Dat is alles.`,
    };
  }
  if (stage === 3) {
    return {
      headline: `Laatste keer.`,
      intro: `${businessName},`,
      body: `Drie keer is genoeg. Hierboven zie je ${city}. Nu. Straks. Morgen.\n\nDit krijg je elke ochtend. Of niet. Jij kiest.`,
      proof: `One more thing — je weet waar ik zit.`,
    };
  }
  return {
    headline: hook.headline,
    intro: `${businessName},`,
    body: `${hook.painPoint}\n\n${hook.solution}`,
    proof: "",
  };
}

export function getB2BEmailHtml(
  industry: B2BIndustry,
  businessName: string,
  city?: string,
  snippet?: WeatherSnippetLike | null,
  stage: OutreachStage = 1,
): string {
  const hook = getIndustryHook(industry);
  const location = city || "jouw regio";
  const unsubscribeUrl = "https://weerzone.nl/api/unsubscribe";
  const copy = stageCopy(stage, hook, businessName, snippet);
  const snippetHtml = buildWeatherSnippetHtml(snippet);

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
      <img src="https://weerzone.nl/logo-full.png" alt="WEERZONE" style="height:32px;width:auto;margin-bottom:6px;opacity:0.9;" />
      <p style="color:rgba(255,255,255,0.5);font-size:9px;margin:0 0 24px;letter-spacing:2px;text-transform:uppercase;font-weight:700;">Data Intelligence · 48-uurs Impact Monitor</p>
      <h1 style="color:#ffffff;font-size:24px;font-weight:900;margin:0;line-height:1.3;">${copy.headline}</h1>
    </div>

    <!-- ONE-LINER -->
    <div style="background:#f59e0b;padding:12px 24px;text-align:center;">
      <p style="margin:0;font-size:13px;color:#1e293b;font-weight:700;">${hook.oneLiner}</p>
    </div>

    <!-- BODY -->
    <div style="background:#ffffff;padding:28px 24px;">
      ${snippetHtml}

      <p style="margin:0 0 16px;font-size:15px;color:#1e293b;font-weight:700;">${stage === 1 ? `Beste ${businessName},` : copy.intro}</p>

      <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.6;white-space:pre-line;">${stage === 1 ? hook.painPoint : copy.body}</p>

      ${stage === 1 ? `<p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.6;">${hook.solution}</p>` : (copy.proof ? `<p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.6;">${copy.proof}</p>` : "")}

      ${stage === 1 ? `<!-- WAT JE KRIJGT -->
      <div style="background:#f8fafc;border-radius:12px;padding:20px;margin:20px 0;border:1px solid #e2e8f0;">
        <p style="margin:0 0 12px;font-size:12px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Wat je krijgt voor ${location}</p>
        <ul style="margin:0;padding-left:20px;list-style:none;">
          ${bulletsHtml}
        </ul>
      </div>

      <p style="margin:0 0 8px;font-size:14px;color:#475569;line-height:1.6;">Eén mail per dag. Gratis. Stop wanneer je wil.</p>

      ${buildGearHtml(industry)}` : ""}
    </div>

    <!-- CTA -->
    <div style="background:#ffffff;padding:0 24px 28px;text-align:center;">
      <a href="https://weerzone.nl/zakelijk" style="display:block;padding:16px;background:#f59e0b;color:#1e293b;font-weight:800;font-size:15px;border-radius:12px;text-decoration:none;text-align:center;box-shadow:0 4px 16px rgba(245,158,11,0.3);">
        ${stage === 3 ? "Zie wat je mist →" : stage === 2 ? "Aanmelden (30 sec) →" : "Gratis aanmelden →"}
      </a>
      <p style="margin:20px 0 0;font-size:13px;color:#475569;"><strong>Steve · WEERZONE Zakelijk</strong><br><span style="font-size:11px;color:#94a3b8;font-weight:400;">Reply werkt — ik lees mee.</span></p>
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
        WEERZONE.nl — 48 uur. De rest is ruis.<br>
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
