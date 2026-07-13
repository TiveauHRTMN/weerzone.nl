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
