/**
 * Type-bewuste copy/config voor venue-weerpagina's (attractieparken,
 * dierentuinen, buitenbaden, campings). Eén bron voor H1, metatitel, intro,
 * schema.org @type en de LLM-promptfragmenten, zodat de route/schema/actions
 * dun blijven.
 */

export const VENUE_TYPES = ["attractiepark", "dierentuin", "zwembad", "camping"] as const;
export type VenueType = (typeof VENUE_TYPES)[number];

interface VenueConfig {
  h1: (name: string) => string;
  metaTitle: (name: string) => string;
  intro: (name: string) => string;
  schemaType: string;
  promptFragment: (name: string) => string;
}

const CONFIG: Record<VenueType, VenueConfig> = {
  attractiepark: {
    h1: (n) => `Weer bij ${n}`,
    metaTitle: (n) => `Weer ${n} — plan je dagje uit`,
    intro: (n) => `Plan je dagje ${n} rond het weer: wanneer het droog blijft, de beste uren en of je een jas mee moet.`,
    schemaType: "AmusementPark",
    promptFragment: (n) => `${n} is een attractiepark; schrijf vanuit "plan je dagje uit": buitenattracties, regentiming en beste bezoekuren.`,
  },
  dierentuin: {
    h1: (n) => `Weer bij ${n}`,
    metaTitle: (n) => `Weer ${n} — dierentuin-bezoek plannen`,
    intro: (n) => `Plan je bezoek aan ${n}: de meeste dieren zijn buiten, dus weer en beste uren maken je dag.`,
    schemaType: "Zoo",
    promptFragment: (n) => `${n} is een dierentuin; schrijf vanuit een buitenbezoek: schaduw, regen en beste uren om de dieren actief te zien.`,
  },
  zwembad: {
    h1: (n) => `Weer bij ${n}`,
    metaTitle: (n) => `Weer ${n} — zwemweer vandaag en morgen`,
    intro: (n) => `Is het zwemweer bij ${n}? Bekijk zon, temperatuur en regen voor vandaag en morgen.`,
    schemaType: "SportsActivityLocation",
    promptFragment: (n) => `${n} is een buitenbad/zwemplas; schrijf vanuit zwemweer: zon-uren, temperatuur en wanneer het droog is.`,
  },
  camping: {
    h1: (n) => `Weer bij ${n}`,
    metaTitle: (n) => `Weer ${n} — kampeerweer vandaag en morgen`,
    intro: (n) => `Kampeerweer voor ${n}: wind, regen en temperatuur voor vandaag en morgen, zodat je weet waar je aan toe bent.`,
    schemaType: "Campground",
    promptFragment: (n) => `${n} is een camping; schrijf vanuit buitenplanning: wind, neerslag en nachttemperatuur voor kampeerders.`,
  },
};

export function venueH1(name: string, vt?: VenueType): string {
  return vt ? CONFIG[vt].h1(name) : `Weer in ${name}`;
}
export function venueMetaTitle(name: string, vt: VenueType): string {
  return CONFIG[vt].metaTitle(name);
}
export function venueIntro(name: string, vt: VenueType): string {
  return CONFIG[vt].intro(name);
}
export function venueSchemaType(vt: VenueType): string {
  return CONFIG[vt].schemaType;
}
export function venuePromptFragment(name: string, vt: VenueType): string {
  return CONFIG[vt].promptFragment(name);
}
