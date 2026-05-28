export type PersonaTier = "piet" | "karl" | "reed" | "steve";

export interface PersonaConfig {
  tier: PersonaTier;
  name: string;
  label: string;
  color: string;
  colorVar: string;
  tagline: string;
  description: string;
  features: string[];
  audience: string;
  includes?: PersonaTier[];
}

export const PERSONAS: Record<PersonaTier, PersonaConfig> = {
  karl: {
    tier: "karl",
    name: "Karl",
    label: "Dagelijkse heads-up",
    color: "#22c55e",
    colorVar: "--persona-karl",
    tagline: "Dein lokaler Wetter-Heads-up fuer Deutschland.",
    description:
      "Karl sagt dir jeden Morgen, was heute und morgen fuer deinen Ort wichtig ist.",
    features: [
      "Jeden Morgen ein klarer 48-Stunden-Heads-up",
      "Fuer deinen Ort",
      "Kontext fuer Fahrrad, Garten, Kinder oder Hund",
      "Stundenverlauf ohne Werberauschen",
      "Keine Anzeigen, keine Partnerdeals, keine Paywall",
    ],
    audience: "Fuer alle, die morgens schnell wissen wollen, was mit dem Wetter klug ist.",
  },
  piet: {
    tier: "piet",
    name: "Piet",
    label: "Dagelijkse heads-up",
    color: "#22c55e",
    colorVar: "--persona-piet",
    tagline: "Je dagelijkse weer-heads-up.",
    description:
      "Piet vertelt je wat vandaag en morgen slim is: ga nu, wacht even of plan later.",
    features: [
      "Elke ochtend een heldere 48-uurs heads-up",
      "Voor jouw plek",
      "Context voor fiets, tuin, kinderen, hond of sport",
      "Uur-voor-uur verloop zonder ruis",
      "Geen advertenties, geen partnerdeals, geen betaalmuur",
    ],
    audience: "Voor wie in een minuut wil weten wat het weer met de dag doet.",
  },
  reed: {
    tier: "reed",
    name: "Reed",
    label: "Buien, wind en onweer",
    color: "#ef4444",
    colorVar: "--persona-reed",
    tagline: "Reed let op wanneer het riskant wordt.",
    description:
      "Reed komt in beeld bij buien, wind, onweer en scherpe omslagmomenten.",
    features: [
      "Buien-, wind- en onweerrisico",
      "Timing en onzekerheid in normale taal",
      "Alleen melden wanneer het ertoe doet",
      "Officiele waarschuwingen met lokale context",
      "Geen betaalmuur of commerciele CTA",
    ],
    audience: "Voor iedereen die niet elk buitje hoeft te horen, maar wel de echte risico's.",
    includes: ["piet"],
  },
  steve: {
    tier: "steve",
    name: "Steve",
    label: "Zakelijke heads-up",
    color: "#3b82f6",
    colorVar: "--persona-steve",
    tagline: "Weer vertaald naar een zakelijke heads-up.",
    description:
      "Steve komt later en vertaalt weer, timing en locatie naar zakelijke beslissingen.",
    features: [
      "48 uur vooruit per locatie",
      "Weerimpact voor planning en operatie",
      "Drempels voor wind, regen, temperatuur en onweer",
      "Rustige zakelijke heads-up",
      "Coming soon",
    ],
    audience: "Voor events, media, buitenwerk en weergevoelige beslissingen.",
  },
};

export const PERSONA_ORDER: PersonaTier[] = ["piet", "reed", "steve"];
export const PERSONA_ORDER_DE: PersonaTier[] = ["karl", "reed", "steve"];

export const TRIAL_END = new Date("2026-08-01T00:00:00+02:00");
export const FOUNDER_SLOTS = 25;

export function daysUntilLaunch(): number {
  const now = Date.now();
  const diff = TRIAL_END.getTime() - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
