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
    <a href="${i.href}" target="_blank" rel="sponsored noopener" style="display:block;padding:16px;background:#ffffff;border:1.5px solid #f1f5f9;border-radius:16px;margin-bottom:12px;text-decoration:none;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
        <td style="width:44px;vertical-align:middle;font-size:32px;line-height:1;">${i.emoji}</td>
        <td style="vertical-align:middle;padding-left:12px;">
          <div style="font-size:14px;font-weight:900;color:#0f172a;line-height:1.2;">${i.title}</div>
          <div style="font-size:12px;color:#64748b;margin-top:2px;">${i.desc}</div>
        </td>
        <td style="width:24px;vertical-align:middle;text-align:right;color:#f59e0b;font-weight:900;">→</td>
      </tr></table>
    </a>
  `).join("");
  return `
    <div style="background:#f8fafc;border-radius:24px;padding:24px;margin:32px 0;border:1px solid #e2e8f0;">
      <div style="font-size:10px;color:#94a3b8;font-weight:900;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px;">Uitrusting die meewerkt</div>
      ${rows}
      <div style="font-size:10px;color:#94a3b8;margin-top:8px;text-align:center;">Branche-specifiek geselecteerd · Amazon Partner</div>
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
      "Windsnelheid per uur (hoogbouw-veiligheid)",
      "Dagelijkse briefing voor jouw regio",
    ],
  },
  bouw: {
    headline: "Beton storten bij vorst kost duizenden euro's",
    painPoint: "Kraanwerk bij te veel wind of stortwerk bij vrieskou — elke inschattingsfout kost direct rendement.",
    solution: "WEERZONE levert hyper-lokale data op 1x1km grid. Je ziet per uur exact wanneer de wind gaat liggen of de vorst invalt.",
    oneLiner: "De bouwplaats draait door. Het weer beslist niet meer.",
    bullets: [
      "Windsnelheid per uur (kraan-drempels)",
      "Neerslagvoorspelling per 15 minuten",
      "Vorstmelding 48 uur vooruit",
    ],
  },
  horeca: {
    headline: "Leeg terras bij bewolking, personeelstekort bij zon",
    painPoint: "Personeel inplannen op basis van een 14-daagse die niet klopt. Te veel mensen op een regendag, te weinig als het plotseling 25° wordt.",
    solution: "Plan je terras-bezetting op basis van 48-uurs weerdata. Elke ochtend weet je precies wat je nodig hebt voor die dag.",
    oneLiner: "Personeelskosten omlaag. Terrasomzet omhoog.",
    bullets: [
      "Temperatuur en zonuren per uur",
      "Regenalerts voor parasol-management",
      "48u inkoop-optimalisatie",
    ],
  },
  evenementen: {
    headline: "Eén onverwachte bui kan een heel event ruïneren",
    painPoint: "Noodtenten bestellen op het laatste moment kost het dubbele. Bezoekers die weglopen door regen komen niet terug.",
    solution: "48 uur is genoeg om operationele beslissingen te nemen. Tenten, beveiliging en noodplannen staan klaar op basis van data.",
    oneLiner: "Geen verrassing. Geen paniek. Geen schade.",
    bullets: [
      "Neerslagkans per uur (op- en afbouw)",
      "Windstoten-alert voor podiumveiligheid",
      "Onweersrisico en bliksemprotocol",
    ],
  },
  agrarisch: {
    headline: "Oogsten bij regen vernietigt opbrengst",
    painPoint: "Spuiten bij wind is verspilling. Maaien op een nat veld beschadigt de bodem. Te laat oogsten kost de helft van je marge.",
    solution: "WEERZONE geeft je per uur de exacte neerslag en wind voor jouw perceel. Plan op data, niet op onderbuikgevoel.",
    oneLiner: "Het veld wacht niet. Jouw planning ook niet.",
    bullets: [
      "Neerslag per uur (zaai- en oogstmomenten)",
      "Windsnelheid onder 3 Bft (spuit-window)",
      "Vorstmelding voor gewasbescherming",
    ],
  },
  transport: {
    headline: "Elke stilstaande vrachtwagen kost €500 per dag",
    painPoint: "Gladheid, storm, mist — weergerelateerde uitval kost de transportsector miljoenen per jaar.",
    solution: "48-uurs weerdata per route. Je chauffeurs weten vooraf wat ze tegenkomen. Jij plant je vloot op maximale efficiëntie.",
    oneLiner: "De route kent geen verrassingen meer.",
    bullets: [
      "Gladheidsrisico per regio",
      "Windstoten-advies voor voertuigen",
      "Mistmeldingen voor route-communicatie",
    ],
  },
  sport: {
    headline: "Training annuleren op het laatste moment is amateuristisch",
    painPoint: "Spelers die voor niets komen, velden die kapot gelopen worden bij regen, ouders die te laat geïnformeerd zijn.",
    solution: "Communiceer 48 uur van tevoren met zekerheid. Velden sparen, planning strak en iedereen tijdig op de hoogte.",
    oneLiner: "Professionele planning begint bij het weer.",
    bullets: [
      "Veldcondities-voorspelling 48u vooruit",
      "Onweers-veiligheidsprotocol",
      "Temperatuuralerts voor hitte of kou",
    ],
  },
  schoonmaak: {
    headline: "Gevelreiniging bij regen is twee keer hetzelfde werk",
    painPoint: "Ruitenreiniging, gevelreiniging, terrasreiniging — alles afhankelijk van droog weer. Fout plannen = dubbel werk.",
    solution: "Plan je buitenklussen op basis van 48-uurs droogperiodes. Nooit meer een dag verspillen aan een verloren rit.",
    oneLiner: "Één keer goed. Niet twee keer over.",
    bullets: [
      "48u droog-window voor buitenwerk",
      "Windsnelheid voor hoogwerker-veiligheid",
      "Regenradar-integratie per uur",
    ],
  },
  schildersbedrijf: {
    headline: "Buitenwerk bij regen = verspilde verf én tijd",
    painPoint: "Latex droogt niet onder 10°C. Regen op natte verf betekent opnieuw beginnen. Een verkeerde planning kost materiaal en uren.",
    solution: "WEERZONE toont droogwindows, temperatuur en luchtvochtigheid per uur. Plan je klus wanneer de verf écht droogt.",
    oneLiner: "De verf droogt. Gegarandeerd.",
    bullets: [
      "Temperatuur per uur (minimaal 10°C)",
      "Luchtvochtigheid voor droogtijd",
      "48-uurs regenvrije periodes",
    ],
  },
  dakdekker: {
    headline: "Op een nat dak werken is levensgevaarlijk",
    painPoint: "Uitglijden op natte pannen, materiaal dat niet hecht bij regen, klussen die halverwege worden afgebroken.",
    solution: "Weet exact wanneer het dak droog en veilig is. Plan je team, materiaal en kraan op het enige juiste moment.",
    oneLiner: "Veilig omhoog. Elke dag.",
    bullets: [
      "Regenvrije periodes per locatie",
      "Windsnelheid drempel (max Bft 5)",
      "Vorstmelding voor hechting",
    ],
  },
  tuinonderhoud: {
    headline: "Gras maaien bij regen, snoeien bij storm — zinloos",
    painPoint: "Klanten verwachten resultaat, maar maaien op een drassig veld is onmogelijk. Snoeien bij wind is gevaarlijk.",
    solution: "Plan je routes op basis van weer per locatie. Droge dagen voor gazonwerk, windstille dagen voor snoeiwerk.",
    oneLiner: "De tuin wordt perfect. Het weer werkt mee.",
    bullets: [
      "Gazononderhoud droog-periodes",
      "Veiligheid voor boomverzorging",
      "Plantbescherming bij nachtvorst",
    ],
  },
  bezorging: {
    headline: "Gladheid of storm — je koeriers verdienen bescherming",
    painPoint: "Pakketbezorgers op gladde wegen, fietskoeriers in stormwind, voedsel dat bevriest onderweg.",
    solution: "Geef je team 48 uur vooruit de weersituatie. Routes aanpassen, extra tijd inplannen en veiligheid garanderen.",
    oneLiner: "Veilig bezorgen. Bij elk weer.",
    bullets: [
      "Gladheidsrisico route-planning",
      "Windstoten-alert voor tweewielers",
      "Extreme temperatuur-alerts",
    ],
  },
};

export function getIndustryHook(industry: B2BIndustry): IndustryHook {
  return HOOKS[industry] ?? HOOKS.bouw;
}

export type OutreachStage = 1 | 2 | 3;

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

  if (stage === 1 && snippet?.event) {
    return `⚠️ ${snippet.event.label}${location} — voor ${industry}`;
  }
  if (stage === 2) return `Eén ding: ${hook?.headline ?? "WEERZONE"}${location}`;
  if (stage === 3) return `Laatste mail van mij${location}`;
  if (!hook) return "48-uurs weerdata voor jouw bedrijf — WEERZONE";
  return `${hook.headline}${location}`;
}

function buildWeatherSnippetHtml(snippet: WeatherSnippetLike | null | undefined): string {
  if (!snippet) return "";
  const eventPill = snippet.event
    ? `<div style="margin-top:16px;padding:12px 16px;background:rgba(239,68,68,0.1);border:1.5px solid rgba(239,68,68,0.2);border-radius:12px;">
         <p style="margin:0;font-size:11px;color:#ef4444;font-weight:900;text-transform:uppercase;letter-spacing:1px;">⚠️ Impact Alert: ${snippet.city}</p>
         <p style="margin:4px 0 0;font-size:14px;color:#991b1b;font-weight:800;line-height:1.4;">${snippet.event.label}</p>
       </div>`
    : "";
  return `
    <div style="background:#0f172a;border-radius:20px;padding:24px;margin:0 0 32px;box-shadow:0 10px 30px rgba(0,0,0,0.15);">
      <div style="font-size:10px;color:rgba(255,255,255,0.4);font-weight:900;text-transform:uppercase;letter-spacing:2px;margin-bottom:12px;">Real-time 48u Monitor: ${snippet.city}</div>
      <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
        <td style="vertical-align:top;">
            <div style="font-size:44px;font-weight:900;color:#ffffff;line-height:1;letter-spacing:-0.03em;">${Math.round(snippet.temp)}<span style="color:#3b7ff0;">°</span></div>
            <div style="font-size:14px;font-weight:700;color:rgba(255,255,255,0.6);margin-top:4px;">${snippet.desc}</div>
        </td>
        <td style="vertical-align:top;text-align:right;">
            <div style="font-size:12px;font-weight:800;color:#ffffff;margin-bottom:2px;">${Math.round(snippet.tempMin)}° / ${Math.round(snippet.tempMax)}°</div>
            <div style="font-size:11px;color:rgba(255,255,255,0.4);font-weight:700;">DAGRANGE</div>
        </td>
      </tr></table>
      <div style="margin-top:20px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.1);display:table;width:100%;">
        <div style="display:table-cell;width:50%;">
            <div style="font-size:10px;color:rgba(255,255,255,0.4);font-weight:800;text-transform:uppercase;margin-bottom:2px;">Max Wind</div>
            <div style="font-size:14px;color:#ffffff;font-weight:800;">${Math.round(snippet.windMax)} km/u</div>
        </div>
        <div style="display:table-cell;width:50%;">
            <div style="font-size:10px;color:rgba(255,255,255,0.4);font-weight:800;text-transform:uppercase;margin-bottom:2px;">Neerslag</div>
            <div style="font-size:14px;color:#ffffff;font-weight:800;">${snippet.rain48h.toFixed(1)} mm</div>
        </div>
      </div>
      ${eventPill}
    </div>
  `;
}

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
        `<div style="padding:8px 0;border-bottom:1px solid #f1f5f9;display:table;width:100%;">
            <div style="display:table-cell;width:24px;vertical-align:top;color:#3b7ff0;font-weight:900;">✓</div>
            <div style="display:table-cell;font-size:14px;color:#475569;font-weight:600;">${b}</div>
         </div>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width">
<meta name="color-scheme" content="light">
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;-webkit-text-size-adjust:100%;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;box-shadow:0 4px 30px rgba(0,0,0,0.02);">

    <!-- HEADER -->
    <div style="background:#020617;padding:48px 40px;text-align:left;">
      <img src="https://weerzone.nl/logo-white.png" alt="WEERZONE" style="height:24px;width:auto;margin-bottom:24px;display:block;" />
      <div style="font-size:10px;font-weight:900;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:3px;margin-bottom:16px;">STRATEGIC INTEL</div>
      <h1 style="color:#ffffff;font-size:32px;font-weight:900;margin:0;line-height:1.1;letter-spacing:-0.03em;">${copy.headline}</h1>
    </div>

    <!-- ACCENT BAR -->
    <div style="background:#f59e0b;padding:14px 40px;">
      <div style="font-size:13px;color:#020617;font-weight:900;text-transform:uppercase;letter-spacing:1px;">${hook.oneLiner}</div>
    </div>

    <!-- CONTENT -->
    <div style="padding:40px;">
      ${snippetHtml}

      <div style="font-size:16px;font-weight:800;color:#0f172a;margin-bottom:20px;">${stage === 1 ? `Beste ${businessName},` : copy.intro}</div>

      <div style="font-size:15px;color:#475569;line-height:1.7;white-space:pre-line;font-weight:500;margin-bottom:24px;">${stage === 1 ? hook.painPoint : copy.body}</div>

      ${stage === 1 ? `<div style="font-size:15px;color:#475569;line-height:1.7;font-weight:500;margin-bottom:24px;">${hook.solution}</div>` : (copy.proof ? `<div style="font-size:15px;color:#475569;line-height:1.7;font-weight:800;margin-bottom:24px;">${copy.proof}</div>` : "")}

      ${stage === 1 ? `
      <!-- SPEC SPECS -->
      <div style="margin-bottom:32px;">
        <div style="font-size:11px;color:#94a3b8;font-weight:900;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:16px;">Wat je krijgt voor ${location}</div>
        <div style="border-top:1px solid #f1f5f9;">
          ${bulletsHtml}
        </div>
      </div>

      <div style="font-size:14px;color:#94a3b8;font-weight:600;margin-bottom:32px;font-style:italic;">Eén mail per dag. Geen ruis. Geen kosten.</div>

      ${buildGearHtml(industry)}` : ""}

      <!-- CTA -->
      <div style="text-align:center;margin-top:40px;">
        <a href="https://weerzone.nl/zakelijk" style="display:inline-block;padding:22px 48px;background:#f59e0b;color:#020617;font-weight:900;font-size:16px;border-radius:16px;text-decoration:none;text-transform:uppercase;letter-spacing:1px;box-shadow:0 10px 25px rgba(245,158,11,0.25);">
          ${stage === 3 ? "Zie wat je mist →" : stage === 2 ? "Aanmelden (30 sec) →" : "Gratis aanmelden →"}
        </a>
        <div style="margin-top:32px;">
            <div style="font-size:14px;font-weight:900;color:#0f172a;">Steve</div>
            <div style="font-size:12px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:1px;">WEERZONE Zakelijk</div>
        </div>
      </div>
    </div>

    <!-- FOOTER -->
    <div style="background:#f8fafc;padding:48px 40px;text-align:center;border-top:1px solid #f1f5f9;">
      <div style="font-size:10px;font-weight:900;color:#94a3b8;text-transform:uppercase;letter-spacing:3px;margin-bottom:16px;">48 UUR · DE REST IS RUIS</div>
      <div style="font-size:11px;color:#94a3b8;line-height:1.6;max-width:320px;margin:0 auto;">
        Je ontvangt deze mail omdat jouw bedrijf in de sector ${industry} direct geraakt wordt door weersinvloeden.
      </div>
      <div style="margin-top:24px;">
        <a href="${unsubscribeUrl}" style="font-size:11px;font-weight:800;color:#64748b;text-decoration:none;text-transform:uppercase;letter-spacing:1px;">Uitschrijven</a>
      </div>
    </div>

  </div>
</body>
</html>`;
}
