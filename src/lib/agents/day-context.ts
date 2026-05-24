/**
 * DayContext — wat voor dag is het vandaag (of een gegeven datum)?
 *
 * Piet, Reed en Koos hebben deze context nodig om relevante heads-ups te
 * kiezen. Op een woensdag in maart praat je anders over "het beste moment"
 * dan op Pinksterzaterdag in zomervakantie regio Zuid.
 *
 * Officiële NL feestdagen worden berekend (Pasen-algoritme + vaste data).
 * Schoolvakanties zijn hardcoded per regio Noord/Midden/Zuid en moeten
 * jaarlijks geverifieerd worden via rijksoverheid.nl/onderwerpen/schoolvakanties.
 */

export type Season = "winter" | "lente" | "zomer" | "herfst";
export type SchoolRegion = "noord" | "midden" | "zuid";

export interface DayContext {
  /** YYYY-MM-DD in Europe/Amsterdam. */
  date: string;
  /** Maandag/dinsdag/... — Nederlandse weekdag. */
  weekday: string;
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName?: string;
  isSchoolHoliday: boolean;
  schoolHolidayName?: string;
  schoolRegion?: SchoolRegion;
  season: Season;
  /** Vrije, niet-gestructureerde tags zoals "moederdag", "halloween" — agents
   *  mogen ze gebruiken voor toon, niet voor logica. */
  specialContext?: string[];
}

const WEEKDAYS_NL = [
  "zondag",
  "maandag",
  "dinsdag",
  "woensdag",
  "donderdag",
  "vrijdag",
  "zaterdag",
] as const;

function toIsoDate(date: Date): string {
  // Forceer Europe/Amsterdam — server kan UTC zijn.
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Amsterdam",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(date);
}

function dateFromIso(iso: string): Date {
  // YYYY-MM-DD → middernacht UTC. Goed genoeg voor day-level vergelijkingen,
  // we doen geen tijd-aritmetiek over DST-grenzen.
  return new Date(`${iso}T00:00:00Z`);
}

function addDays(iso: string, days: number): string {
  const d = dateFromIso(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return toIsoDate(d);
}

function isoBetween(iso: string, start: string, end: string): boolean {
  return iso >= start && iso <= end;
}

// ─── Feestdagen ──────────────────────────────────────────────────────────────

/**
 * Pasen volgens Meeus/Jones/Butcher (Gregoriaans). Geeft eerste paasdag
 * terug als ISO-datum.
 */
function easterSunday(year: number): string {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

interface HolidayEntry {
  date: string;
  name: string;
}

function holidaysForYear(year: number): HolidayEntry[] {
  const easter = easterSunday(year);
  const koningsdag = (() => {
    // 27 april, tenzij die op zondag valt — dan 26 april.
    const candidate = `${year}-04-27`;
    return dateFromIso(candidate).getUTCDay() === 0
      ? `${year}-04-26`
      : candidate;
  })();

  return [
    { date: `${year}-01-01`,         name: "Nieuwjaarsdag" },
    { date: addDays(easter, -2),     name: "Goede Vrijdag" },
    { date: easter,                  name: "Eerste Paasdag" },
    { date: addDays(easter, 1),      name: "Tweede Paasdag" },
    { date: koningsdag,              name: "Koningsdag" },
    // Bevrijdingsdag is officieel een vrije dag in lustrumjaren (elk 5e jaar).
    // We tonen het altijd als kalenderdag, agents bepalen zelf hun toon.
    { date: `${year}-05-05`,         name: "Bevrijdingsdag" },
    { date: addDays(easter, 39),     name: "Hemelvaartsdag" },
    { date: addDays(easter, 49),     name: "Eerste Pinksterdag" },
    { date: addDays(easter, 50),     name: "Tweede Pinksterdag" },
    { date: `${year}-12-25`,         name: "Eerste Kerstdag" },
    { date: `${year}-12-26`,         name: "Tweede Kerstdag" },
  ];
}

// ─── Schoolvakanties ─────────────────────────────────────────────────────────

interface SchoolHolidayEntry {
  name: string;
  /** Welke regio's deze entry geldt voor. Voorjaarsvakantie heeft drie aparte
   *  entries (noord/midden/zuid), zomervakantie ook. */
  regions: readonly SchoolRegion[];
  start: string;
  end: string;
}

/**
 * Officiële NL schoolvakantieperiodes per regio.
 *
 * BELANGRIJK — verifieer en update jaarlijks via:
 *   https://www.rijksoverheid.nl/onderwerpen/schoolvakanties/overzicht-schoolvakanties-per-schooljaar
 *
 * Onderstaande data zijn een eerste invulling voor 2026; behandel ze als
 * "best effort" tot een redactionele review gedaan is. De struct is bewust
 * data-driven zodat updates puur regel-toevoegingen zijn.
 */
const SCHOOL_HOLIDAYS_2026: readonly SchoolHolidayEntry[] = [
  // Voorjaarsvakantie
  { name: "Voorjaarsvakantie", regions: ["zuid"],   start: "2026-02-14", end: "2026-02-22" },
  { name: "Voorjaarsvakantie", regions: ["midden"], start: "2026-02-21", end: "2026-03-01" },
  { name: "Voorjaarsvakantie", regions: ["noord"],  start: "2026-02-21", end: "2026-03-01" },
  // Meivakantie
  { name: "Meivakantie",       regions: ["noord", "midden", "zuid"], start: "2026-04-25", end: "2026-05-03" },
  // Zomervakantie
  { name: "Zomervakantie",     regions: ["midden"], start: "2026-07-04", end: "2026-08-16" },
  { name: "Zomervakantie",     regions: ["noord"],  start: "2026-07-11", end: "2026-08-23" },
  { name: "Zomervakantie",     regions: ["zuid"],   start: "2026-07-18", end: "2026-08-30" },
  // Herfstvakantie
  { name: "Herfstvakantie",    regions: ["noord", "midden"], start: "2026-10-10", end: "2026-10-18" },
  { name: "Herfstvakantie",    regions: ["zuid"],            start: "2026-10-17", end: "2026-10-25" },
  // Kerstvakantie
  { name: "Kerstvakantie",     regions: ["noord", "midden", "zuid"], start: "2026-12-19", end: "2027-01-03" },
];

const ALL_SCHOOL_HOLIDAYS: readonly SchoolHolidayEntry[] = [
  ...SCHOOL_HOLIDAYS_2026,
];

// ─── Seizoen ─────────────────────────────────────────────────────────────────

/**
 * Meteorologisch seizoen (KNMI-conventie): per kalender-kwartaal.
 *   lente  = mrt/apr/mei
 *   zomer  = jun/jul/aug
 *   herfst = sep/okt/nov
 *   winter = dec/jan/feb
 */
function seasonFor(month: number): Season {
  if (month >= 3 && month <= 5)  return "lente";
  if (month >= 6 && month <= 8)  return "zomer";
  if (month >= 9 && month <= 11) return "herfst";
  return "winter";
}

// ─── Special context ────────────────────────────────────────────────────────

interface SpecialDayEntry {
  /** "MM-DD" — geldt elk jaar. */
  monthDay: string;
  tag: string;
}

/**
 * Lichte set context-tags die agents mogen gebruiken voor toon. Géén logica
 * hier (bv. moederdag is tweede zondag van mei — die berekenen we live).
 */
const ANNUAL_SPECIAL_DAYS: readonly SpecialDayEntry[] = [
  { monthDay: "02-14", tag: "valentijnsdag" },
  { monthDay: "10-31", tag: "halloween" },
  { monthDay: "11-11", tag: "sint-maarten" },
  { monthDay: "12-05", tag: "sinterklaasavond" },
  { monthDay: "12-31", tag: "oudejaarsavond" },
];

function dynamicSpecialTags(iso: string): string[] {
  const tags: string[] = [];
  const d = dateFromIso(iso);
  const month = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  const weekday = d.getUTCDay();

  // Moederdag = tweede zondag van mei
  if (month === 5 && weekday === 0 && day >= 8 && day <= 14) {
    tags.push("moederdag");
  }
  // Vaderdag = derde zondag van juni
  if (month === 6 && weekday === 0 && day >= 15 && day <= 21) {
    tags.push("vaderdag");
  }
  return tags;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Bouw een DayContext op voor een gegeven moment (default: nu, Europe/Amsterdam).
 *
 * @param region Optioneel — vereist alleen voor `isSchoolHoliday` /
 *               `schoolHolidayName`. Zonder regio is dat altijd `false`.
 */
export function getDayContext(
  input?: Date | string,
  region?: SchoolRegion,
): DayContext {
  const iso = typeof input === "string"
    ? input
    : toIsoDate(input ?? new Date());

  const d = dateFromIso(iso);
  const weekdayIdx = d.getUTCDay();
  const weekday = WEEKDAYS_NL[weekdayIdx];
  const isWeekend = weekdayIdx === 0 || weekdayIdx === 6;
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth() + 1;
  const monthDay = `${String(month).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;

  const holiday = holidaysForYear(year).find((h) => h.date === iso);

  const schoolMatch = region
    ? ALL_SCHOOL_HOLIDAYS.find(
        (h) => h.regions.includes(region) && isoBetween(iso, h.start, h.end),
      )
    : undefined;

  const specialContext: string[] = [
    ...ANNUAL_SPECIAL_DAYS.filter((s) => s.monthDay === monthDay).map((s) => s.tag),
    ...dynamicSpecialTags(iso),
  ];

  return {
    date: iso,
    weekday,
    isWeekend,
    isHoliday: !!holiday,
    holidayName: holiday?.name,
    isSchoolHoliday: !!schoolMatch,
    schoolHolidayName: schoolMatch?.name,
    schoolRegion: schoolMatch ? region : undefined,
    season: seasonFor(month),
    specialContext: specialContext.length ? specialContext : undefined,
  };
}

/** Test-hook: alle feestdagen voor een jaar, gesorteerd op datum. */
export function listHolidays(year: number): HolidayEntry[] {
  return holidaysForYear(year).slice().sort((a, b) => a.date.localeCompare(b.date));
}

/** Test-hook: alle schoolvakantie-entries (alle regio's). */
export function listSchoolHolidays(): readonly SchoolHolidayEntry[] {
  return ALL_SCHOOL_HOLIDAYS;
}
