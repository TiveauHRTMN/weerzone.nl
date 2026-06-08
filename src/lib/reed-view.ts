/**
 * Reed view-adapter: mapt live weerdata naar het presentatie-model dat
 * ReedWarningsPage rendert. Puur en testbaar (geen netwerk) — zie
 * scripts/check-reed-view.ts.
 *
 * Beslislaag: het lokale weer opent Reed. Zodra er ook maar een minimale kans is
 * op onweer, storm of veel regen, gaat de pagina in-depth open. Pas als er écht
 * niks speelt, blijft alleen de rust-tagline staan.
 *
 * Stem: Reed = nuchtere buurman die scherp let op gevaar — kalm, nooit paniek,
 * urgent als het moet. Sjabloontekst; schaalt naar de 10K-pagina's.
 */

import type { WeatherData } from "@/lib/types";
import type { KNMISeverity, KNMIWarning } from "@/lib/knmi-warnings";
import type { TeslaSignal } from "@/lib/mariana/tesla/types";

export type ReedState = "calm" | "watch" | "warning";
export type ReedTone = "amber" | "orange" | "red" | "blue";

export interface ReedEstofex {
  level: 1 | 2 | 3;
  synopsis: string;
  imageUrl: string;
  sourceUrl: string;
  validUntil: string | null;
}

export interface ReedChip {
  label: string;
  value: string;
  tone: ReedTone;
}

export interface ReedActiveWarning {
  title: string;
  levelLabel: string;
  tone: ReedTone;
  summary: string;
  chips: ReedChip[];
}

export interface ReedRiskDay {
  key: "vd" | "mo";
  label: string;
  weekday: string;
  dateLabel: string;
  hasRisk: boolean;
  badge: string;
  windowLabel: string | null;
  peakLabel: string | null;
  durationH: number;
  chips: ReedChip[];
  gaugePct: number;
  prob: { onweer: number; regen: number };
  /** Buurman-uitleg waarom het rustig is (alleen als hasRisk=false). */
  calmReason: string | null;
}

export interface ReedKnmiItem {
  headline: string;
  window: string;
  severity: KNMISeverity;
}

export interface ReedView {
  locationName: string;
  provinceLabel: string | null;
  state: ReedState;
  windowLabel: string;
  active: ReedActiveWarning | null;
  days: { vd: ReedRiskDay; mo: ReedRiskDay };
  capeMax: number;
  tesla: TeslaSignal | null;
  estofex: ReedEstofex | null;
  knmi: { severityLabel: string | null; items: ReedKnmiItem[] };
  nextUpdate: string;
}

/* ---------- helpers ---------- */
const SEVERITY_RANK: Record<KNMISeverity, number> = { GREEN: 0, YELLOW: 1, ORANGE: 2, RED: 3 };
const SEVERITY_LABEL: Record<KNMISeverity, string> = {
  GREEN: "Code groen",
  YELLOW: "Code geel",
  ORANGE: "Code oranje",
  RED: "Code rood",
};
const SEVERITY_TONE: Record<KNMISeverity, ReedTone> = {
  GREEN: "blue",
  YELLOW: "amber",
  ORANGE: "orange",
  RED: "red",
};

function hourNum(iso: string): number {
  return Number(iso.slice(11, 13));
}
function dateOf(iso: string): string {
  return iso.slice(0, 10);
}
function nlWeekday(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  const wd = new Intl.DateTimeFormat("nl-NL", { weekday: "long", timeZone: "Europe/Amsterdam" }).format(d);
  return wd.charAt(0).toUpperCase() + wd.slice(1);
}
function nlDayMonth(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  return new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "long", timeZone: "Europe/Amsterdam" }).format(d);
}
function amsterdamIsoDate(now: Date, offsetDays = 0): string {
  const shifted = new Date(now.getTime() + offsetDays * 24 * 60 * 60 * 1000);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Amsterdam",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(shifted);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}
function isThunderCode(code: number): boolean {
  return code >= 95;
}
function clampPct(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/* ---------- per-dag convectie-analyse ---------- */
interface DayAnalysis {
  capeMax: number;
  thunderHours: number[];
  precipPeakMm: number;
  rainSharePct: number;
  windMaxKmh: number;
  onweerPct: number;
  regenPct: number;
}

function analyseDay(weather: WeatherData, isoDate: string): DayAnalysis {
  const hours = weather.hourly.filter((h) => dateOf(h.time) === isoDate);
  const daytime = hours.filter((h) => hourNum(h.time) >= 6 && hourNum(h.time) <= 23);
  const capeMax = hours.reduce((m, h) => Math.max(m, h.cape ?? 0), 0);
  const thunderHours = hours.filter((h) => isThunderCode(h.weatherCode)).map((h) => hourNum(h.time));
  const precipPeakMm = hours.reduce((m, h) => Math.max(m, h.precipitation ?? 0), 0);
  const rainHours = daytime.filter((h) => (h.precipitation ?? 0) > 0.1 || h.weatherCode >= 51).length;
  const rainSharePct = daytime.length ? (rainHours / daytime.length) * 100 : 0;
  const dayDaily = weather.daily.find((d) => d.date === isoDate);
  const windMaxKmh = dayDaily?.windSpeedMax ?? Math.round(weather.current.windGusts ?? 0);

  // Onweerskans uit onweersuren + CAPE-energie (proxy; geen apart kans-veld).
  const thunderShare = daytime.length ? (thunderHours.length / daytime.length) * 100 : 0;
  const capeProxy = capeMax >= 1500 ? 70 : capeMax >= 800 ? 45 : capeMax >= 300 ? 20 : 5;
  const onweerPct = clampPct(Math.max(thunderShare * 1.5, capeProxy));
  const regenPct = clampPct(rainSharePct);

  return { capeMax: Math.round(capeMax), thunderHours, precipPeakMm, rainSharePct, windMaxKmh, onweerPct, regenPct };
}

function contiguousWindow(hoursWithRisk: number[]): { from: number; to: number } | null {
  if (hoursWithRisk.length === 0) return null;
  const sorted = [...hoursWithRisk].sort((a, b) => a - b);
  return { from: sorted[0], to: sorted[sorted.length - 1] };
}

function hh(h: number): string {
  return `${String(h).padStart(2, "0")}:00`;
}

function buildRiskDay(
  weather: WeatherData,
  key: "vd" | "mo",
  isoDate: string,
  label: string,
  estofexLevelToday: number,
): ReedRiskDay {
  const a = analyseDay(weather, isoDate);
  const riskHours = weather.hourly
    .filter((h) => dateOf(h.time) === isoDate && (isThunderCode(h.weatherCode) || (h.cape ?? 0) >= 800))
    .map((h) => hourNum(h.time));
  const win = contiguousWindow(riskHours);

  // Risico op deze dag? Al een minimale kans op onweer, storm of veel regen telt:
  // onweer(suren) / energie in de lucht / stevige windstoten / flinke regen.
  const hasRisk =
    a.thunderHours.length > 0 ||
    a.capeMax >= 500 ||
    a.windMaxKmh >= 50 ||
    a.rainSharePct >= 50 ||
    a.precipPeakMm >= 4 ||
    (key === "vd" && estofexLevelToday >= 2);

  const chips: ReedChip[] = [];
  if (hasRisk) {
    if (a.windMaxKmh >= 50) chips.push({ label: "Windstoten", value: `${a.windMaxKmh} km/u`, tone: "amber" });
    if (a.precipPeakMm >= 3) chips.push({ label: "Regen", value: `${Math.round(a.precipPeakMm)} mm/u`, tone: "blue" });
    if (a.thunderHours.length > 0) chips.push({ label: "Onweer", value: a.thunderHours.length >= 3 ? "frequent" : "lokaal", tone: "orange" });
  }

  // Piek = uur met de meeste CAPE op de risico-dag.
  let peakHour: number | null = null;
  if (hasRisk) {
    let best = -1;
    for (const h of weather.hourly.filter((x) => dateOf(x.time) === isoDate)) {
      if ((h.cape ?? 0) > best) { best = h.cape ?? 0; peakHour = hourNum(h.time); }
    }
  }

  return {
    key,
    label,
    weekday: nlWeekday(isoDate),
    dateLabel: nlDayMonth(isoDate),
    hasRisk,
    badge: a.thunderHours.length > 0 ? "Onweer" : a.windMaxKmh >= 50 ? "Wind" : a.rainSharePct >= 50 ? "Zware regen" : "Rustig",
    windowLabel: win ? `van ${hh(win.from)} tot ${hh(win.to)}` : null,
    peakLabel: peakHour !== null ? hh(peakHour) : null,
    durationH: win ? win.to - win.from + 1 : 0,
    chips,
    gaugePct: hasRisk ? Math.max(a.onweerPct, 35) : Math.min(a.onweerPct, 20),
    prob: { onweer: a.onweerPct, regen: a.regenPct },
    calmReason: hasRisk
      ? null
      : a.capeMax < 300
        ? "De lucht blijft stabiel — weinig energie om buien te voeden. Hooguit een spatje, geen onweer in zicht."
        : "Wat onrust in de lucht, maar te weinig om echt los te barsten. Reed houdt het in de gaten, jij hoeft nergens op te letten.",
  };
}

/* ---------- actieve waarschuwing ---------- */
function buildActive(
  weather: WeatherData,
  today: ReedRiskDay,
  todayCapeMax: number,
  knmiWorst: KNMIWarning | null,
  estofex: ReedEstofex | null,
): { state: ReedState; active: ReedActiveWarning | null } {
  // 1. Officiële KNMI-waarschuwing heeft voorrang (geel/oranje/rood).
  if (knmiWorst && SEVERITY_RANK[knmiWorst.severity] >= 1) {
    const rank = SEVERITY_RANK[knmiWorst.severity];
    const state: ReedState = rank >= 2 ? "warning" : "watch";
    const chips = today.chips.length ? today.chips : convectiveChips(weather, today);
    return {
      state,
      active: {
        title: `${knmiWorst.type} — ${knmiWorst.province}`,
        levelLabel: SEVERITY_LABEL[knmiWorst.severity],
        tone: SEVERITY_TONE[knmiWorst.severity],
        summary: knmiWarningSummary(knmiWorst, today),
        chips,
      },
    };
  }

  // 2. Convectief risico uit ESTOFEX + CAPE/onweer (geen officiële waarschuwing).
  const estLevel = estofex?.level ?? 0;
  if (today.hasRisk || estLevel >= 2) {
    const heavy = today.prob.onweer >= 55 || estLevel >= 2 || todayCapeMax >= 1500;
    return {
      state: heavy ? "warning" : "watch",
      active: {
        title:
          today.badge === "Onweer"
            ? "Onweer en felle buien"
            : today.badge === "Wind"
              ? "Stevige wind"
              : today.badge === "Zware regen"
                ? "Flinke regen op komst"
                : "Buien op komst",
        levelLabel: heavy ? "Verhoogd risico" : "Iets in de gaten houden",
        tone: heavy ? "orange" : "amber",
        summary: convectiveSummary(today),
        chips: today.chips.length ? today.chips : convectiveChips(weather, today),
      },
    };
  }

  // 3. Rustig.
  return { state: "calm", active: null };
}

function convectiveChips(weather: WeatherData, today: ReedRiskDay): ReedChip[] {
  const chips: ReedChip[] = [];
  const wind = weather.daily.find((d) => d.date === dateOf(weather.hourly[0]?.time ?? ""))?.windSpeedMax ?? 0;
  if (wind >= 50) chips.push({ label: "Windstoten", value: `${wind} km/u`, tone: "amber" });
  if (today.prob.regen >= 40) chips.push({ label: "Regen", value: `${today.prob.regen}%`, tone: "blue" });
  if (today.prob.onweer >= 30) chips.push({ label: "Onweer", value: `${today.prob.onweer}%`, tone: "orange" });
  return chips;
}

function knmiWarningSummary(w: KNMIWarning, today: ReedRiskDay): string {
  const when = today.windowLabel ? ` Vooral ${today.windowLabel}.` : "";
  const sev =
    w.severity === "RED"
      ? "Dit is code rood — neem het serieus en blijf zo veel mogelijk binnen."
      : w.severity === "ORANGE"
        ? "Code oranje: er kan flinke overlast zijn, pas je plannen aan."
        : "Code geel: hou er rekening mee, maar geen reden tot paniek.";
  return `Er is een officiële waarschuwing voor ${w.type.toLowerCase()} in ${w.province}.${when} ${sev}`;
}

function convectiveSummary(today: ReedRiskDay): string {
  if (today.badge === "Onweer") {
    const when = today.windowLabel ? `tussen ${today.windowLabel.replace("van ", "").replace(" tot ", " en ")}` : "in de loop van de dag";
    return `Er zit genoeg energie in de lucht voor onweer, ${when}${today.peakLabel ? `, met de grootste kans rond ${today.peakLabel}` : ""}. Geen ramp, maar plan even om de buien heen.`;
  }
  if (today.badge === "Wind") {
    return `Het gaat stevig waaien vandaag. Zet losse spullen vast en hou rekening met wat hinder onderweg.`;
  }
  return `Er trekken buien over. Niks dramatisch, maar een droog moment uitkiezen scheelt.`;
}

/* ---------- hoofdadapter ---------- */
export function buildReedView(input: {
  weather: WeatherData;
  locationName: string;
  provinceLabel?: string | null;
  estofex?: ReedEstofex | null;
  knmi?: KNMIWarning[];
  tesla?: TeslaSignal | null;
  now?: Date;
}): ReedView {
  const { weather, locationName, now = new Date() } = input;
  const estofex = input.estofex ?? null;
  const knmi = input.knmi ?? [];

  const todayIso = amsterdamIsoDate(now, 0);
  const tomorrowIso = amsterdamIsoDate(now, 1);

  const estLevelToday = estofex?.level ?? 0;
  const vd = buildRiskDay(weather, "vd", todayIso, "Vandaag", estLevelToday);
  const mo = buildRiskDay(weather, "mo", tomorrowIso, "Morgen", 0);
  const todayCapeMax = analyseDay(weather, todayIso).capeMax;

  const knmiSorted = [...knmi].sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]);
  const knmiWorst = knmiSorted[0] && SEVERITY_RANK[knmiSorted[0].severity] >= 1 ? knmiSorted[0] : null;

  // Het lokale weer (plus optionele officiële waarschuwing / brede outlook)
  // bepaalt of Reed opengaat. Minimale kans op onweer/storm/veel regen = open.
  const { state, active } = buildActive(weather, vd, todayCapeMax, knmiWorst, estofex);

  const capeMax = Math.max(todayCapeMax, analyseDay(weather, tomorrowIso).capeMax);
  const nextUpdate = new Intl.DateTimeFormat("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(now.getTime() + 60 * 60 * 1000));

  return {
    locationName,
    provinceLabel: input.provinceLabel ?? null,
    state,
    windowLabel: `${vd.weekday.toLowerCase()} + ${mo.weekday.toLowerCase()}`,
    active,
    days: { vd, mo },
    capeMax,
    tesla: input.tesla ?? null,
    estofex,
    knmi: {
      severityLabel: knmiWorst ? SEVERITY_LABEL[knmiWorst.severity] : null,
      items: knmiSorted
        .filter((w) => SEVERITY_RANK[w.severity] >= 1)
        .map((w) => ({
          headline: `${w.type} — ${w.province}`,
          window: w.validFrom ? new Intl.DateTimeFormat("nl-NL", { weekday: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam" }).format(new Date(w.validFrom)) : "—",
          severity: w.severity,
        })),
    },
    nextUpdate,
  };
}
