/**
 * Centrale agent-types voor Weerzone v2.
 *
 * Vier agents bedienen de gebruiker rond de komende 48 uur:
 *  - Piet  → dagelijkse heads-up
 *  - Reed  → buien, wind, onweer
 *  - Koos  → als je eropuit wilt (vergelijkt jouw plekken)
 *  - Steve → zakelijke heads-up (later)
 *
 * Belangrijke regel uit de productdefinitie:
 *   "Geen heads-up zonder concrete actie. Als de gebruiker niets hoeft te
 *    doen, toon rust."
 * Een lege array van AgentHeadsUp is dus een geldige output, geen fout.
 */

export type WeatherAgent = "piet" | "reed" | "koos" | "steve";

export type AgentHeadsUpCategory =
  | "daily_advice"
  | "best_moment"
  | "rain_risk"
  | "wind_risk"
  | "thunderstorm_risk"
  | "better_place"
  | "going_out"
  | "business_opportunity";

export type AgentHeadsUpSeverity = "info" | "useful" | "important" | "urgent";

export interface AgentHeadsUp {
  id: string;
  agent: WeatherAgent;
  category: AgentHeadsUpCategory;
  severity: AgentHeadsUpSeverity;
  /** Korte titel, max ~6 woorden. */
  title: string;
  /** Eén zin, direct en in NL. Volgt taalregels uit de productdefinitie. */
  message: string;
  /** Concrete actie — wat moet/kan de gebruiker hiermee doen. */
  action: string;
  /** 0..1 — laat de UI bepalen of/hoe dit getoond wordt. */
  confidence?: number;
  /** ISO 8601. Vanaf wanneer is de heads-up van toepassing. */
  validFrom?: string;
  /** ISO 8601. Tot wanneer. Na deze tijd: niet meer tonen. */
  validUntil?: string;
  /** Locatie waar de heads-up over gaat (meestal de actieve plek). */
  locationId?: string;
  /** Voor Koos: de doel-locatie (de "betere plek"). */
  targetLocationId?: string;
  createdAt: string;
}

/**
 * Eén concrete uitstap-suggestie van Koos: een andere plek waar het de
 * komende 48 uur prettiger lijkt dan op origin.
 */
export interface WeatherOpportunity {
  originLocationId: string;
  targetLocationId: string;
  targetName: string;
  /** Hoger = beter. Schaal is intern, UI normaliseert. */
  score: number;
  /** Korte NL-uitleg waarom deze plek beter is. */
  reason: string;
  bestMomentStart?: string;
  bestMomentEnd?: string;
  distanceKm?: number;
  travelTimeMinutes?: number;
  confidence?: number;
}

/**
 * Privacy-laag rond opgeslagen plekken. Onderscheid tussen:
 *  - session_only   : gebruikt in deze sessie, niet bewaard voor agents
 *  - suggestion_only: mag gebruikt worden voor UI-suggesties, niet voor
 *                     proactieve heads-ups
 *  - agent_allowed  : Piet/Reed/Koos mogen actief deze plek monitoren en
 *                     proactieve heads-ups versturen
 */
export type PlaceUsagePermission =
  | "session_only"
  | "suggestion_only"
  | "agent_allowed";

export type UserPlaceType =
  | "home"
  | "work"
  | "school"
  | "sport"
  | "friend"
  | "family"
  | "favorite";

export interface UserPlace {
  id: string;
  /** Verwijst naar de interne locations-tabel / places-data id. */
  locationId: string;
  /** Display naam (kan afwijken van de officiële plaatsnaam). */
  name: string;
  placeType: UserPlaceType;
  usagePermission: PlaceUsagePermission;
  source: "manual" | "location_permission" | "saved_from_search";
  createdAt: string;
  lastUsedAt?: string;
}

/** Convenience: alle bekende agents (volgorde = UI-volgorde). */
export const ALL_AGENTS: readonly WeatherAgent[] = [
  "piet",
  "reed",
  "koos",
  "steve",
] as const;
