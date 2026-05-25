// Centrale config voor Piet · Karl · Reed · Steve tiers.
// Eén bron van waarheid voor prijs, kleur, kopij, founder-lock.
// Gebruikt door: /prijzen, /de/preise, PersonaModal, FounderBanner, signup-flow.
//
// Locale-mapping:
//   NL entry-tier → "piet"
//   DE entry-tier → "karl"
//   Reed + Steve zijn locale-onafhankelijk

export type PersonaTier = "piet" | "karl" | "reed" | "steve";

export interface PersonaConfig {
  tier: PersonaTier;
  name: string;
  label: string;
  color: string;
  colorVar: string;
  tagline: string;
  description: string;
  priceCents?: number;
  founderPriceCents?: number;
  features: string[];
  audience: string;
  includes?: PersonaTier[];
}

export const PERSONAS: Record<PersonaTier, PersonaConfig> = {
  // ─── Karl — DE entry-tier ───────────────────────────────────────────────────
  karl: {
    tier: "karl",
    name: "Karl",
    label: "Basis",
    color: "#22c55e",
    colorVar: "--persona-karl",
    tagline: "Dein lokaler Wetterassistent für Deutschland.",
    description:
      "Karl schickt dir jeden Morgen vor 7 Uhr eine kurze Mail: Was das Wetter heute und morgen an deiner genauen Adresse macht.",
    priceCents: 399,
    founderPriceCents: 199,
    features: [
      "Jeden Morgen vor 7 Uhr in deinem Posteingang",
      "Für deine genaue Adresse (hyperlokal, 1 km Auflösung)",
      "Du bestimmst, was Karl berücksichtigt: Fahrrad, Garten, Kinder, Hund",
      "Dashboard mit stündlichem Verlauf",
      "Keine Werbung, kein Tracking, keine Cookie-Banner",
    ],
    audience: "Für alle, die morgens in einer Minute wissen wollen, was der Tag meteorologisch bringt.",
  },

  // ─── Piet — NL entry-tier ───────────────────────────────────────────────────
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
    founderPriceCents: 199,
    features: [
      "Elke ochtend vóór 7:00 in je mail",
      "Op jouw postcode (KNMI HARMONIE, 2,5 km)",
      "Jij kiest wat Piet meeneemt: fiets, tuin, kinderen, hond",
      "Dashboard met uur-voor-uur verloop",
      "Geen reclame, geen tracking, geen cookiemuren",
    ],
    audience: "Voor wie 's ochtends in één minuut wil weten hoe de dag eruitziet.",
  },

  // ─── Reed — locale-onafhankelijk (NL + DE) ─────────────────────────────────
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

  // ─── Steve — locale-onafhankelijk (NL + DE) ────────────────────────────────
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

// NL persona-volgorde (voor /prijzen)
export const PERSONA_ORDER: PersonaTier[] = ["piet", "reed", "steve"];
// DE persona-volgorde (voor /de/preise)
export const PERSONA_ORDER_DE: PersonaTier[] = ["karl", "reed", "steve"];

export function formatPrice(cents: number): string {
  const euros = cents / 100;
  return `€${euros.toFixed(2).replace(".", ",")}`;
}

// Alles gratis tot augustus 2026. Daarna bepalen we pas welke betaalde laag zinvol is.
export const TRIAL_END = new Date("2026-08-01T00:00:00+02:00");
export const FOUNDER_SLOTS = 25;

export function daysUntilLaunch(): number {
  const now = Date.now();
  const diff = TRIAL_END.getTime() - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
