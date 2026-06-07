// Hartman WK 2026 Poule — gedeelde deelnemerslijst (server-side helpers).
// Houdt de identiteits-normalisatie identiek aan het loginscherm in
// public/hartmanwk2026-prototype/wk-auth.jsx, zodat dezelfde persoon die
// opnieuw inlogt altijd dezelfde rij is (geen dubbele deelnemers).

export const HARTMANWK_MEMBERS_TABLE = "hartmanwk_members";
export const HARTMANWK_PREDICTIONS_TABLE = "hartmanwk_predictions";
export const HARTMANWK_RESULTS_TABLE = "hartmanwk_results";
export const HARTMANWK_PLAYER_STATS_TABLE = "hartmanwk_player_stats";
export const MAX_PHOTO_LENGTH = 600_000; // ~ ruim genoeg voor een 360px jpeg, blokkeert misbruik

// Aantal groepswedstrijden (id 1..72, gid A–L). De rest (73..104) is knock-out.
export const HARTMANWK_GROUP_MATCH_COUNT = 72;
export function isGroupMatchId(matchId: string): boolean {
  const n = Number(matchId);
  return Number.isInteger(n) && n >= 1 && n <= HARTMANWK_GROUP_MATCH_COUNT;
}

// Verplicht-slot: eerste aftrap 2026-06-11 21:00 CEST = 19:00 UTC.
export const HARTMANWK_LOCK_ISO = "2026-06-11T19:00:00Z";
export function isLocked(now: Date = new Date()): boolean {
  return now.getTime() >= new Date(HARTMANWK_LOCK_ISO).getTime();
}

export type HartmanWkContact = { type: "email" | "phone"; contact: string };

export function normalizePhone(value: string): string {
  return value.replace(/[^\d+]/g, "").replace(/^00/, "+");
}

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isPhone(value: string): boolean {
  return /^\+?\d{8,15}$/.test(normalizePhone(value));
}

/** Bepaalt of een ruwe invoer een geldig e-mail of telefoonnummer is en normaliseert hem. */
export function classifyContact(raw: string): HartmanWkContact | null {
  const value = (raw || "").trim();
  if (isEmail(value)) return { type: "email", contact: value.toLowerCase() };
  if (isPhone(value)) return { type: "phone", contact: normalizePhone(value) };
  return null;
}

export function cleanName(value: string): string {
  return (value || "").trim().replace(/\s+/g, " ").slice(0, 80);
}

export function isFullName(value: string): boolean {
  return cleanName(value).split(" ").filter(Boolean).length >= 2;
}

type MemberRow = {
  id: string;
  name: string;
  photo: string | null;
  joined_at: string;
  contact?: string;
  contact_type?: string;
};

/**
 * Publieke vorm voor de browser. We sturen BEWUST geen contact (e-mail/telefoon)
 * mee in de gedeelde lijst — alleen de eigenaar krijgt zijn eigen contact terug.
 */
export function toPublicMember(row: MemberRow) {
  return {
    id: row.id,
    name: row.name,
    photo: row.photo ?? "",
    joinedAt: row.joined_at,
  };
}

export function toOwnMember(row: MemberRow) {
  return {
    ...toPublicMember(row),
    contact: row.contact ?? null,
    contactType: row.contact_type ?? null,
  };
}

// ---------------------------------------------------------------- Scoring
// Zelfde regels als het prototype (wk-data.js), nu server-side als bron van waarheid.
export const HARTMANWK_POINTS = {
  exact: 100,
  outcome: 50,
  teamGoals: 25,
  fantasy: { appearance: 1, goal: 5, assist: 3, yellow: -2, red: -7 },
};

const outcome = (h: number, a: number) => (h > a ? "home" : h < a ? "away" : "draw");

export type MatchScore = { points: number; hit: "exact" | "toto" | null };

/** Wedstrijdpunten voor één voorspelling tegen de echte uitslag. */
export function scoreMatch(
  pred: { home: number; away: number } | null | undefined,
  result: { home: number; away: number } | null | undefined,
): MatchScore {
  if (!pred || !result) return { points: 0, hit: null };

  if (pred.home === result.home && pred.away === result.away) {
    return { points: HARTMANWK_POINTS.exact, hit: "exact" };
  }

  const right = outcome(pred.home, pred.away) === outcome(result.home, result.away);
  let points = right ? HARTMANWK_POINTS.outcome : 0;
  if (pred.home === result.home) points += HARTMANWK_POINTS.teamGoals;
  if (pred.away === result.away) points += HARTMANWK_POINTS.teamGoals;
  return { points, hit: right ? "toto" : null };
}

export type PlayerStats = {
  goals?: number | null;
  assists?: number | null;
  minutes?: number | null;
  yellow?: number | null;
  red?: number | null;
};

/** Fantasypunten van de gekozen sterspeler (toernooi-cumulatief). */
export function fantasyPoints(stats: PlayerStats | null | undefined): number {
  if (!stats) return 0;
  const f = HARTMANWK_POINTS.fantasy;
  const played = (stats.minutes ?? 0) > 0 ? f.appearance : 0;
  return (
    played
    + (stats.goals ?? 0) * f.goal
    + (stats.assists ?? 0) * f.assist
    + (stats.yellow ?? 0) * f.yellow
    + (stats.red ?? 0) * f.red
  );
}

/** Genormaliseerde sleutel voor een (vrij ingetypte) spelersnaam. */
export function normalizePlayerKey(name: string): string {
  return (name || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "") // accenten weg, accent-ongevoelig matchen
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function cleanPlayerName(name: string): string {
  return (name || "").replace(/\s+/g, " ").trim().slice(0, 60);
}
