/**
 * Moment-types zonder `server-only`, deelbaar met client components
 * (onboarding, regiekamer). Runtime-serverlogica blijft in moments.ts.
 */

export const AGENT_MOMENTS_TABLE = "agent_moments";

export type MomentKind = "commute" | "dog" | "outdoor" | "laundry" | "sport" | "custom";
export type MomentTransport = "bike" | "ov" | "car" | "none";

export interface AgentMoment {
  id: string;
  kind: MomentKind;
  label: string;
  /** ISO-weekdagen, 1=ma .. 7=zo. */
  days: number[];
  /** "HH:MM" of "HH:MM:SS" (Postgres time). */
  windowStart: string;
  windowEnd: string;
  transport: MomentTransport | null;
  /** "YYYY-MM-DD": eendags-moment — geldt alléén die datum, `days` wordt genegeerd. */
  date: string | null;
  /** Optionele bestemming (dagje weg): de motor bewaakt dan óók dat weer. */
  province: string | null;
  placeSlug: string | null;
}

export const MOMENT_KIND_LABEL: Record<MomentKind, string> = {
  commute: "Onderweg",
  dog: "Hond",
  outdoor: "Buiten",
  laundry: "Was",
  sport: "Sport",
  custom: "Eigen moment",
};

export interface MomentWindow {
  moment: AgentMoment;
  start: Date;
  end: Date;
}

/** ISO-weekdag (1=ma..7=zo) van een datum in NL-tijd. */
function nlIsoWeekday(day: Date): number {
  const short = day.toLocaleDateString("en-US", { weekday: "short", timeZone: "Europe/Amsterdam" });
  return { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }[short] ?? 1;
}

/** NL-kalenderdatum ("YYYY-MM-DD") van een Date. */
export function nlDateISO(d: Date): string {
  return d.toLocaleDateString("sv-SE", { timeZone: "Europe/Amsterdam" });
}

/** Date voor "HH:MM(:SS)" op de NL-kalenderdag van `day`. */
function nlTimeOnDay(day: Date, hhmm: string): Date {
  const dateISO = nlDateISO(day);
  const [h, m] = hhmm.split(":").map((v) => parseInt(v, 10));
  // NL-offset op die dag bepalen: neem 12:00Z en kijk hoe laat het dan in NL is.
  const probe = new Date(`${dateISO}T12:00:00Z`);
  const nlHourAtProbe = parseInt(
    probe.toLocaleTimeString("nl-NL", { hour: "2-digit", timeZone: "Europe/Amsterdam", hour12: false }),
    10,
  );
  const offsetHours = nlHourAtProbe - 12; // 1 (CET) of 2 (CEST)
  return new Date(Date.parse(`${dateISO}T00:00:00Z`) + ((h - offsetHours) * 60 + (m || 0)) * 60_000);
}

/** Vensters van deze momenten op de NL-dag van `day` (leeg = geen momenten die dag). */
export function momentWindowsForDay(moments: AgentMoment[], day: Date): MomentWindow[] {
  const weekday = nlIsoWeekday(day);
  const dayISO = nlDateISO(day);
  return moments
    .filter((moment) => (moment.date ? moment.date === dayISO : moment.days.includes(weekday)))
    .map((moment) => ({
      moment,
      start: nlTimeOnDay(day, moment.windowStart),
      end: nlTimeOnDay(day, moment.windowEnd),
    }))
    .filter((w) => w.end > w.start);
}

/** Bij routine-pauze tellen woon-werk-momenten niet mee (vensters blijven bewaard). */
export function effectiveMoments(moments: AgentMoment[], routinePaused: boolean): AgentMoment[] {
  return routinePaused ? moments.filter((m) => m.kind !== "commute") : moments;
}

/** Vakantiestand / "vandaag vrij": stil t/m de datum (inclusief). */
export function isPausedOn(pausedUntil: string | null, dayISO: string): boolean {
  return !!pausedUntil && pausedUntil >= dayISO;
}
