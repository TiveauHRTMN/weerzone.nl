// Hartman WK 2026 — groepswedstrijden (id 1..72), spiegelt public/hartmanwk2026-prototype/wk-data.js.
// Nodig server-side voor het beheerscherm (uitslagen invoeren met echte landen).
// Knock-out (73..104) valt buiten het groepsfase-slot en staat hier bewust niet in.

export type HartmanWkMatch = {
  id: string;
  gid: string;
  round: number;
  date: string; // yyyy-mm-dd
  time: string; // HH:MM (Europe/Amsterdam weergavetijd)
  home: string; // landcode
  away: string;
};

// [id, gid, round, date, time, home, away]
const RAW: [number, string, number, string, string, string, string][] = [
  [1, "A", 1, "2026-06-11", "21:00", "MEX", "RSA"], [2, "A", 1, "2026-06-12", "04:00", "KOR", "CZE"],
  [3, "A", 2, "2026-06-18", "18:00", "CZE", "RSA"], [4, "A", 2, "2026-06-19", "03:00", "MEX", "KOR"],
  [5, "A", 3, "2026-06-25", "03:00", "CZE", "MEX"], [6, "A", 3, "2026-06-25", "03:00", "RSA", "KOR"],
  [7, "B", 1, "2026-06-12", "21:00", "CAN", "BIH"], [8, "B", 1, "2026-06-13", "21:00", "QAT", "SUI"],
  [9, "B", 2, "2026-06-18", "21:00", "SUI", "BIH"], [10, "B", 2, "2026-06-19", "00:00", "CAN", "QAT"],
  [11, "B", 3, "2026-06-24", "21:00", "SUI", "CAN"], [12, "B", 3, "2026-06-24", "21:00", "BIH", "QAT"],
  [13, "C", 1, "2026-06-14", "00:00", "BRA", "MAR"], [14, "C", 1, "2026-06-14", "03:00", "HAI", "SCO"],
  [15, "C", 2, "2026-06-20", "00:00", "SCO", "MAR"], [16, "C", 2, "2026-06-20", "02:30", "BRA", "HAI"],
  [17, "C", 3, "2026-06-25", "00:00", "SCO", "BRA"], [18, "C", 3, "2026-06-25", "00:00", "MAR", "HAI"],
  [19, "D", 1, "2026-06-13", "03:00", "USA", "PAR"], [20, "D", 1, "2026-06-13", "06:00", "AUS", "TUR"],
  [21, "D", 2, "2026-06-19", "06:00", "TUR", "PAR"], [22, "D", 2, "2026-06-19", "21:00", "USA", "AUS"],
  [23, "D", 3, "2026-06-26", "04:00", "TUR", "USA"], [24, "D", 3, "2026-06-26", "04:00", "PAR", "AUS"],
  [25, "E", 1, "2026-06-14", "19:00", "GER", "CUW"], [26, "E", 1, "2026-06-15", "01:00", "CIV", "ECU"],
  [27, "E", 2, "2026-06-20", "22:00", "GER", "CIV"], [28, "E", 2, "2026-06-21", "02:00", "ECU", "CUW"],
  [29, "E", 3, "2026-06-25", "22:00", "ECU", "GER"], [30, "E", 3, "2026-06-25", "22:00", "CUW", "CIV"],
  [31, "F", 1, "2026-06-14", "22:00", "NED", "JPN"], [32, "F", 1, "2026-06-15", "04:00", "SWE", "TUN"],
  [33, "F", 2, "2026-06-20", "06:00", "TUN", "JPN"], [34, "F", 2, "2026-06-20", "19:00", "NED", "SWE"],
  [35, "F", 3, "2026-06-26", "01:00", "JPN", "SWE"], [36, "F", 3, "2026-06-26", "01:00", "TUN", "NED"],
  [37, "G", 1, "2026-06-15", "21:00", "BEL", "EGY"], [38, "G", 1, "2026-06-16", "03:00", "IRN", "NZL"],
  [39, "G", 2, "2026-06-21", "21:00", "BEL", "IRN"], [40, "G", 2, "2026-06-22", "03:00", "NZL", "EGY"],
  [41, "G", 3, "2026-06-27", "05:00", "EGY", "IRN"], [42, "G", 3, "2026-06-27", "05:00", "NZL", "BEL"],
  [43, "H", 1, "2026-06-15", "18:00", "ESP", "CPV"], [44, "H", 1, "2026-06-16", "00:00", "KSA", "URU"],
  [45, "H", 2, "2026-06-21", "18:00", "ESP", "KSA"], [46, "H", 2, "2026-06-22", "00:00", "URU", "CPV"],
  [47, "H", 3, "2026-06-27", "02:00", "CPV", "KSA"], [48, "H", 3, "2026-06-27", "02:00", "URU", "ESP"],
  [49, "I", 1, "2026-06-16", "21:00", "FRA", "SEN"], [50, "I", 1, "2026-06-17", "00:00", "IRQ", "NOR"],
  [51, "I", 2, "2026-06-22", "23:00", "FRA", "IRQ"], [52, "I", 2, "2026-06-23", "02:00", "NOR", "SEN"],
  [53, "I", 3, "2026-06-26", "21:00", "NOR", "FRA"], [54, "I", 3, "2026-06-26", "21:00", "SEN", "IRQ"],
  [55, "J", 1, "2026-06-16", "06:00", "AUT", "JOR"], [56, "J", 1, "2026-06-17", "03:00", "ARG", "ALG"],
  [57, "J", 2, "2026-06-22", "19:00", "ARG", "AUT"], [58, "J", 2, "2026-06-23", "05:00", "JOR", "ALG"],
  [59, "J", 3, "2026-06-28", "04:00", "ALG", "AUT"], [60, "J", 3, "2026-06-28", "04:00", "JOR", "ARG"],
  [61, "K", 1, "2026-06-17", "19:00", "POR", "COD"], [62, "K", 1, "2026-06-18", "04:00", "UZB", "COL"],
  [63, "K", 2, "2026-06-23", "19:00", "POR", "UZB"], [64, "K", 2, "2026-06-24", "04:00", "COL", "COD"],
  [65, "K", 3, "2026-06-28", "01:30", "COL", "POR"], [66, "K", 3, "2026-06-28", "01:30", "COD", "UZB"],
  [67, "L", 1, "2026-06-17", "22:00", "ENG", "CRO"], [68, "L", 1, "2026-06-18", "01:00", "GHA", "PAN"],
  [69, "L", 2, "2026-06-23", "22:00", "ENG", "GHA"], [70, "L", 2, "2026-06-24", "01:00", "PAN", "CRO"],
  [71, "L", 3, "2026-06-27", "23:00", "PAN", "ENG"], [72, "L", 3, "2026-06-27", "23:00", "CRO", "GHA"],
];

export const HARTMANWK_GROUP_MATCHES: HartmanWkMatch[] = RAW.map(
  ([id, gid, round, date, time, home, away]) => ({ id: String(id), gid, round, date, time, home, away }),
);

// Korte landnamen voor het beheerscherm (alleen de landen die in de groepsfase spelen).
export const HARTMANWK_TEAM_NAMES: Record<string, string> = {
  MEX: "Mexico", RSA: "Zuid-Afrika", KOR: "Zuid-Korea", CZE: "Tsjechië",
  CAN: "Canada", BIH: "Bosnië-Herz.", QAT: "Qatar", SUI: "Zwitserland",
  BRA: "Brazilië", MAR: "Marokko", HAI: "Haïti", SCO: "Schotland",
  USA: "Verenigde Staten", PAR: "Paraguay", AUS: "Australië", TUR: "Turkije",
  GER: "Duitsland", CUW: "Curaçao", CIV: "Ivoorkust", ECU: "Ecuador",
  NED: "Nederland", JPN: "Japan", SWE: "Zweden", TUN: "Tunesië",
  BEL: "België", EGY: "Egypte", IRN: "Iran", NZL: "Nieuw-Zeeland",
  ESP: "Spanje", CPV: "Kaapverdië", KSA: "Saoedi-Arabië", URU: "Uruguay",
  FRA: "Frankrijk", SEN: "Senegal", IRQ: "Irak", NOR: "Noorwegen",
  AUT: "Oostenrijk", JOR: "Jordanië", ARG: "Argentinië", ALG: "Algerije",
  POR: "Portugal", COD: "DR Congo", UZB: "Oezbekistan", COL: "Colombia",
  ENG: "Engeland", CRO: "Kroatië", GHA: "Ghana", PAN: "Panama",
};

export function teamName(code: string): string {
  return HARTMANWK_TEAM_NAMES[code] ?? code;
}

// Aftrap per wedstrijd in ms. De tijden zijn Nederlandse weergavetijden (CEST = UTC+2,
// het hele WK valt in de zomertijd), dus +02:00.
const KICKOFF_MS_BY_ID = new Map(
  HARTMANWK_GROUP_MATCHES.map((m) => [m.id, Date.parse(`${m.date}T${m.time}:00+02:00`)]),
);

export function groupMatchKickoffMs(matchId: string): number | null {
  return KICKOFF_MS_BY_ID.get(matchId) ?? null;
}

/** Is de aftrap van deze groepswedstrijd al geweest? (per-wedstrijd-slot) */
export function isGroupMatchStarted(matchId: string, now: Date = new Date()): boolean {
  const k = KICKOFF_MS_BY_ID.get(matchId);
  return k !== undefined && now.getTime() >= k;
}
