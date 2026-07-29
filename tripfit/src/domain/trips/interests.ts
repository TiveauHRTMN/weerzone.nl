export const INTEREST_IDS = [
  "beach",
  "nature",
  "culture",
  "history",
  "food",
  "adventure",
  "wellness",
  "wildlife",
  "nightlife",
  "shopping",
  "photography",
  "water-activities",
  "family-activities",
  "road-trips",
] as const;

export type InterestId = (typeof INTEREST_IDS)[number];

export interface InterestOption {
  id: InterestId;
  label: string;
  description: string;
}

export const INTERESTS = [
  { id: "beach", label: "Strand", description: "Rustige baaien, brede stranden en bijzondere kusten." },
  { id: "nature", label: "Natuur", description: "Nationale parken, watervallen en landschappen." },
  { id: "culture", label: "Cultuur", description: "Lokale tradities, muziek en dagelijks leven." },
  { id: "history", label: "Geschiedenis", description: "Historische plaatsen en verhalen achter de bestemming." },
  { id: "food", label: "Eten", description: "Dominicaanse smaken, markten en bijzondere adressen." },
  { id: "adventure", label: "Avontuur", description: "Actieve dagen op land, rivier en zee." },
  { id: "wellness", label: "Wellness", description: "Vertragen, herstellen en goed voor jezelf zorgen." },
  { id: "wildlife", label: "Wildlife", description: "Dieren in hun natuurlijke leefomgeving." },
  { id: "nightlife", label: "Nightlife", description: "Muziek, dans en avonden met lokale energie." },
  { id: "shopping", label: "Shopping", description: "Design, ambacht, winkels en lokale producten." },
  { id: "photography", label: "Fotografie", description: "Sterke landschappen, straten en lichtmomenten." },
  { id: "water-activities", label: "Wateractiviteiten", description: "Snorkelen, varen, surfen en andere waterdagen." },
  { id: "family-activities", label: "Gezinsactiviteiten", description: "Keuzes die voor volwassenen én kinderen werken." },
  { id: "road-trips", label: "Roadtrips", description: "Routes, uitzichtpunten en stops onderweg." },
] as const satisfies readonly InterestOption[];
