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
  priceCents?: number;       // normale prijs vanaf 1 juni (cent)
  founderPriceCents?: number; // founder-lock prijs voor altijd (cent)
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
    tagline: "Elke ochtend een weermail, op jouw postcode.",
    description:
      "Piet stuurt je elke ochtend voor 7:00 een korte mail: wat het weer vandaag en morgen doet op jouw adres.",
    priceCents: 399,
    features: [
      "Elke ochtend vóór 7:00 in je mail",
      "Op jouw postcode (KNMI HARMONIE, 2,5 km)",
      "Jij kiest wat Piet meeneemt: fiets, tuin, kinderen, hond",
      "Dashboard met uur-voor-uur verloop",
      "Geen reclame, geen tracking, geen cookiemuren",
    ],
    audience: "Voor wie 's ochtends in één minuut wil weten hoe de dag eruitziet.",
  },

  reed: {
    tier: "reed",
    name: "Reed",
    label: "Waarschuwing",
    color: "#ef4444",
    colorVar: "--persona-reed",
    tagline: "Waarschuwing als het over jouw grens gaat.",
    description:
      "Reed stuurt alleen een bericht als het weer door jouw drempel heen gaat. Bij al het andere laat hij je met rust.",
    priceCents: 699,
    features: [
      "Alles wat Piet ook stuurt",
      "Waarschuwing op jouw drempel (wind, regen, vorst, onweer)",
      "Jij vult in wat kwetsbaar is: kelder, plat dak, dieren buiten",
      "Mail én push — jij kiest per categorie",
      "Achteraf: klopte de waarschuwing? Per alert te zien",
    ],
    audience: "Voor gezinnen en huiseigenaren die niet over elk buitje gebeld willen worden.",
    includes: ["piet"],
  },

  steve: {
    tier: "steve",
    name: "Steve",
    label: "Zakelijk",
    color: "#3b82f6",
    colorVar: "--persona-steve",
    tagline: "Weer vertaald naar een bedrijfsbeslissing.",
    description:
      "Steve leest het weer voor 48 uur vooruit en vertaalt het naar wat het voor je zaak betekent: openen, sluiten, inkopen of annuleren.",
    priceCents: 49900,
    features: [
      "Dagelijkse zakelijke mail + live dashboard",
      "48 uur vooruit in blokken van 2 uur, per locatie",
      "Drempels per vestiging: wind, regen, temperatuur, onweer",
      "Inkoop- en roostersuggestie per dag",
      "Hoe vaak klopte het? Meetbaar per locatie",
      "Meerdere adressen en vestigingen tegelijk",
    ],
    audience: "Strandtent, horeca, dakdekker, hovenier, bouw, evenementen.",
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
