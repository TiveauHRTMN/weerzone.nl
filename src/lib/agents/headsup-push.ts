/**
 * Heads-up-push kandidaten (spec 2026-07-10 §3A/B): pure wiskunde van
 * uurlijkse tijdlijn + persoonlijke momenten naar push-waardige berichten.
 * Geen I/O, geen LLM — de cron (agent-headsup-push) doet de bezorging.
 *
 * Ontwerpregel: geen heads-up zonder concrete actie; stilte als feature.
 */

import type { HourlyForecast } from "@/lib/types";
import type { AgentHeadsUp } from "@/lib/agents/types";
import type { MomentWindow } from "@/lib/agents/moments";

export const PIET_MAX_PER_DAY = 3;
export const KOOS_MAX_PER_DAY = 1;
/** ISO-weekdagen waarop Koos mag pushen: do/vr/za (het beslisvenster). */
export const KOOS_DAYS = [4, 5, 6];
export const WET_MM_PER_HOUR = 0.2;
/** Bezorgvenster in NL-uren. */
const DELIVERY_FROM = 7;
const DELIVERY_TO = 22;
/** Kandidaat moet binnen dit venster vanaf nu vallen. */
const LOOKAHEAD_HOURS = 12;

export interface PushCandidate {
  agent: "piet" | "koos";
  category: string;
  /** Stabiele dedup-sleutel; de cron prefixt niet — dit ís de headsup_key. */
  key: string;
  title: string;
  body: string;
  /** Raakt een persoonlijk moment → voorrang binnen het budget. */
  matchedMoment: boolean;
}

export interface RainTransition {
  kind: "dry_to_wet" | "wet_to_dry";
  /** Eerste uur van de nieuwe toestand. */
  at: Date;
}

export function inDeliveryWindow(now: Date): boolean {
  const hour = parseInt(
    now.toLocaleTimeString("nl-NL", { hour: "2-digit", timeZone: "Europe/Amsterdam", hour12: false }),
    10,
  );
  return hour >= DELIVERY_FROM && hour < DELIVERY_TO;
}

export function nlWeekday(now: Date): number {
  const short = now.toLocaleDateString("en-US", { weekday: "short", timeZone: "Europe/Amsterdam" });
  return { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }[short] ?? 1;
}

const uurNL = (d: Date) =>
  d.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam" });

/** Sleutel-bucket: NL-datum + uur, zodat dezelfde omslag maar één push geeft. */
function hourBucket(d: Date): string {
  return `${d.toLocaleDateString("sv-SE", { timeZone: "Europe/Amsterdam" })}T${d
    .toLocaleTimeString("nl-NL", { hour: "2-digit", timeZone: "Europe/Amsterdam", hour12: false })}`;
}

/**
 * Droog↔nat-omslagen in de komende LOOKAHEAD_HOURS. De nieuwe toestand moet
 * minstens 2 uur standhouden (geen geflapper). Hooguit één omslag per richting.
 */
export function rainTransitions(hourly: HourlyForecast[], now: Date): RainTransition[] {
  const horizon = new Date(now.getTime() + LOOKAHEAD_HOURS * 3600_000);
  const upcoming = hourly
    .map((h) => ({ at: new Date(h.time), wet: h.precipitation >= WET_MM_PER_HOUR }))
    .filter((h) => h.at >= new Date(now.getTime() - 3600_000) && h.at <= horizon);
  if (upcoming.length < 3) return [];

  const out: RainTransition[] = [];
  const seen = new Set<string>();
  for (let i = 1; i < upcoming.length - 1; i++) {
    const prev = upcoming[i - 1];
    const cur = upcoming[i];
    const next = upcoming[i + 1];
    if (cur.wet !== prev.wet && cur.wet === next.wet && cur.at > now) {
      const kind = cur.wet ? "dry_to_wet" : "wet_to_dry";
      if (!seen.has(kind)) {
        seen.add(kind);
        out.push({ kind, at: cur.at });
      }
    }
  }
  return out;
}

/** Momentvenster dat door `at` geraakt wordt (incl. 60 min aanloop). */
function windowHit(windows: MomentWindow[], at: Date): MomentWindow | null {
  for (const w of windows) {
    const leadStart = new Date(w.start.getTime() - 60 * 60_000);
    if (at >= leadStart && at <= w.end) return w;
  }
  return null;
}

function momentCopy(
  w: MomentWindow,
  transition: RainTransition,
  placeName: string,
): { title: string; body: string } | null {
  const t = uurNL(transition.at);
  if (transition.kind === "dry_to_wet") {
    switch (w.moment.kind) {
      case "commute":
        if (w.moment.transport === "car") return null; // auto's geen regen-spam
        return {
          title: `Regen om ${t} — ${w.moment.label.toLowerCase()}`,
          body: `Regenpak mee: rond ${t} rijd je door een bui heen. Eerder vertrekken scheelt.`,
        };
      case "dog":
        return {
          title: `Laat de hond vóór ${t} uit`,
          body: `Daarna wordt het nat in ${placeName}. Nu is het nog droog.`,
        };
      case "laundry":
        return {
          title: `Was binnenhalen vóór ${t}`,
          body: `Vanaf ${t} regent het in ${placeName}.`,
        };
      case "sport":
      case "outdoor":
      case "custom":
        return {
          title: `${w.moment.label}: vóór ${t} blijft het droog`,
          body: `Daarna regen in ${placeName}. Plan het ervoor of erna.`,
        };
    }
  }
  // wet_to_dry raakt een moment: "vanaf dan kan het weer"
  return {
    title: `Vanaf ${t} droog — ${w.moment.label.toLowerCase()} kan door`,
    body: `De regen in ${placeName} is dan voorbij.`,
  };
}

/**
 * Piets push-kandidaten: omslagen gekoppeld aan momenten gaan voor; een kale
 * omslag (zonder moment) mag ook, met generieke maar concrete copy. Daarnaast
 * per momentvenster een natte-venster-check — óók als de regen al uren eerder
 * begon (de omslag zelf raakt het venster dan niet, de bui wel).
 */
export function pietPushCandidates(
  placeName: string,
  hourly: HourlyForecast[],
  windows: MomentWindow[],
  now: Date,
): PushCandidate[] {
  const out: PushCandidate[] = [];
  const momentCovered = new Set<string>();

  for (const transition of rainTransitions(hourly, now)) {
    const key = `piet|weather_shift|${transition.kind}|${hourBucket(transition.at)}`;
    const hit = windowHit(windows, transition.at);
    if (hit) {
      const copy = momentCopy(hit, transition, placeName);
      if (copy) {
        momentCovered.add(hit.moment.id);
        out.push({ agent: "piet", category: "weather_shift", key, matchedMoment: true, ...copy });
      }
      continue;
    }
    const t = uurNL(transition.at);
    out.push(
      transition.kind === "dry_to_wet"
        ? {
            agent: "piet", category: "weather_shift", key, matchedMoment: false,
            title: `Vanaf ${t} regen in ${placeName}`,
            body: `Wat je buiten wilt doen: doe het vóór ${t}.`,
          }
        : {
            agent: "piet", category: "weather_shift", key, matchedMoment: false,
            title: `Vanaf ${t} droog in ${placeName}`,
            body: `Daarna kun je weer naar buiten zonder nat te worden.`,
          },
    );
  }

  // Natte-venster-check per moment: is het nat tijdens het venster zelf,
  // ook zonder omslag die het venster raakt? Dan alsnog de momenten-copy.
  const dayISO = now.toLocaleDateString("sv-SE", { timeZone: "Europe/Amsterdam" });
  for (const w of windows) {
    if (momentCovered.has(w.moment.id)) continue;
    if (w.end <= now) continue; // voorbij
    if (w.start.getTime() - now.getTime() > LOOKAHEAD_HOURS * 3600_000) continue;
    const firstWet = hourly
      .map((h) => ({ at: new Date(h.time), wet: h.precipitation >= WET_MM_PER_HOUR }))
      .find((h) => h.wet && h.at >= new Date(w.start.getTime() - 3600_000) && h.at <= w.end);
    if (!firstWet) continue;
    const copy = momentCopy(w, { kind: "dry_to_wet", at: firstWet.at > w.start ? firstWet.at : w.start }, placeName);
    if (!copy) continue;
    out.push({
      agent: "piet",
      category: "weather_shift",
      key: `piet|moment_rain|${w.moment.id}|${dayISO}`,
      matchedMoment: true,
      ...copy,
    });
  }
  return out;
}

/**
 * Koos: alleen zijn beste `better_place`-heads-up (severity useful of hoger)
 * wordt push-waardig; hij is de schaarse stem van het stel.
 */
export function koosPushCandidates(
  headsUps: AgentHeadsUp[],
  province: string,
  placeSlug: string,
  now: Date,
): PushCandidate[] {
  const best = headsUps.find(
    (h) => h.category === "better_place" && (h.severity === "useful" || h.severity === "important"),
  );
  if (!best) return [];
  const dayISO = now.toLocaleDateString("sv-SE", { timeZone: "Europe/Amsterdam" });
  return [
    {
      agent: "koos",
      category: "better_place",
      key: `koos|better_place|${province}/${placeSlug}|${dayISO}`,
      title: best.title,
      body: `${best.message} ${best.action}`.trim().slice(0, 170),
      matchedMoment: false,
    },
  ];
}

/**
 * Budget + dedup, puur: momenten-treffers eerst, dan de rest; nooit boven
 * PIET_MAX_PER_DAY / KOOS_MAX_PER_DAY (dagtelling komt uit agent_headsup_log).
 */
export function selectWithinBudget(
  candidates: PushCandidate[],
  sentKeys: Set<string>,
  countsByAgent: Map<string, number>,
  limitOverrides?: Partial<Record<string, number>>,
): PushCandidate[] {
  const limits: Record<string, number> = {
    piet: PIET_MAX_PER_DAY,
    koos: KOOS_MAX_PER_DAY,
    ...limitOverrides,
  };
  const counts = new Map(countsByAgent);
  const ordered = [...candidates].sort((a, b) => Number(b.matchedMoment) - Number(a.matchedMoment));
  const out: PushCandidate[] = [];
  for (const c of ordered) {
    if (sentKeys.has(c.key)) continue;
    const used = counts.get(c.agent) ?? 0;
    if (used >= (limits[c.agent] ?? 0)) continue;
    counts.set(c.agent, used + 1);
    out.push(c);
  }
  return out;
}
