// Centrale config voor Piet · Reed · Steve tiers.
// Eén bron van waarheid voor prijs, kleur, kopij, founder-lock.
// Gebruikt door: /prijzen, PersonaModal, FounderBanner, NavBar-badge, signup-flow.

export type PersonaTier = "piet" | "reed" | "steve";

export interface PersonaConfig {
  tier: PersonaTier;
  name: string;              // "Piet"
  label: string;             // "Basis" | "Waarschuwing" | "Zakelijk"
  color: string;             // hex
  colorVar: string;          // CSS var name
  tagline: string;           // korte propositie
  description: string;       // langere omschrijving
  priceCents: number;        // normale prijs vanaf 1 juni (cent)
  founderPriceCents: number; // founder-lock prijs voor altijd (cent)
  features: string[];        // bullets op kaartje
  audience: string;          // voor wie
  includes?: PersonaTier[];  // tier-hiërarchie: Reed bevat Piet
}

export const PERSONAS: Record<PersonaTier, PersonaConfig> = {
  piet: {
    tier: "piet",
    name: "Piet",
    label: "Basis",
    color: "#22c55e",
    colorVar: "--persona-piet",
    tagline: "De buurman die toevallig verstand heeft van het weer.",
    description:
      "Elke ochtend om zeven uur één mail op jouw GPS-punt. Geen app die piept, geen 14-daagse die nergens op slaat. Piet weet dat je hond om half acht uit moet en dat het vanmiddag gaat hozen — en zegt dat ook gewoon, zonder poespas.",
    priceCents: 499,
    founderPriceCents: 299,
    features: [
      "Elke ochtend 07:00 in je inbox — geen app nodig",
      "48 uur op jouw vierkante meter (KNMI HARMONIE 2,5 km)",
      "Kent je hond, je fiets, je tuin — schrijft als je achterbuur",
      "Dashboard met uurdetail als je zelf wil kijken",
      "Nul reclame, nul pop-ups, nul cookie-gezeur",
    ],
    audience: "Voor wie de 14-daagse zat is en gewoon wil weten hoe morgen wordt.",
  },
  reed: {
    tier: "reed",
    name: "Reed",
    label: "Waarschuwing",
    color: "#ef4444",
    colorVar: "--persona-reed",
    tagline: "Piet — plus een schop onder je kont als het misgaat.",
    description:
      "Alles van Piet. Plus Reed, die alleen belt als het écht telt voor jouw huis. Geen code-geel voor een buitje: Reed meldt zich als je auto de garage in moet, je platte dak in de gevarenzone zit of je kelder onderloopt. Eén alert per keer. Altijd raak.",
    priceCents: 799,
    founderPriceCents: 499,
    features: [
      "Alles uit Piet, plus echte alerts",
      "Alleen als het jou raakt — wind, regen, onweer, ijs",
      "Kent je kelder, plat dak, paard in de wei",
      "Push én mail — jij bepaalt wanneer het mag knallen",
      "Achteraf eerlijk: klopte het? Score per alert, zichtbaar.",
    ],
    audience: "Gezinnen, huiseigenaren, ZZP'ers met iets kostbaars in een schuur.",
    includes: ["piet"],
  },
  steve: {
    tier: "steve",
    name: "Steve",
    label: "Zakelijk",
    color: "#3b82f6",
    colorVar: "--persona-steve",
    tagline: "Drie opties: inkopen, annuleren, doorzetten. Meer niet.",
    description:
      "Steve rekent in euro's, niet in millimeters. Hij kijkt naar jouw capaciteit, jouw drempels, jouw deadlines — en zegt wat je vandaag moet doen. Geen slag om de arm, geen 'wellicht', geen ruis. Beslissing in één mail, voordat de eerste klant belt.",
    priceCents: 4999,
    founderPriceCents: 2900,
    features: [
      "Dagelijkse zakelijke brief + live dashboard",
      "Werkramen per 2u-blok, 48 uur vooruit, per locatie",
      "Jouw drempels per vestiging (wind, regen, temp, onweer)",
      "Inkoop- en roosteradvies op basis van omzet-risico",
      "Houdt zichzelf eerlijk: nauwkeurigheid per locatie meetbaar",
      "Meerdere adressen, filialen en trucks tegelijk",
    ],
    audience: "Strandtent, dakdekker, hovenier, horeca, bouw, evenementen.",
  },
};

export const PERSONA_ORDER: PersonaTier[] = ["piet", "reed", "steve"];

export function formatPrice(cents: number): string {
  const euros = cents / 100;
  return `€${euros.toFixed(2).replace(".", ",")}`;
}

// Trial-einddatum (1 juni 2026). Alle pre-launch signups zijn founders.
export const TRIAL_END = new Date("2026-06-01T00:00:00+02:00");
export const FOUNDER_SLOTS = 25;

export function daysUntilLaunch(): number {
  const now = Date.now();
  const diff = TRIAL_END.getTime() - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
