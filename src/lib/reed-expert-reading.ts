import type { HourlyForecast } from "@/lib/types";
import type { TeslaSignal } from "@/lib/mariana/tesla/types";
import type { KNMIWarning } from "@/lib/knmi-warnings";
import { getThunderstormChance } from "@/lib/risk-analysis";

export type ReedVerdict = "rustig" | "oplettend" | "onrustig" | "code";

export type ReedMomentKind =
  | "deksel-breekt"
  | "onweerspiek"
  | "schering-piek"
  | "broeierig"
  | "windpiek";

export interface ReedMoment {
  time: string;
  hourIndex: number;
  kind: ReedMomentKind;
  label: string;
  detail: string;
  severity: ReedVerdict;
}

export interface ReedLayer {
  key: "cape" | "cin" | "liftedIndex" | "windShear" | "dewPoint" | "windSpeed";
  title: string;
  phrase: string;
  severity: ReedVerdict;
  series: number[];
  unit: string;
  threshold?: number;
  thresholdLabel?: string;
  min?: number;
  max: number;
  type: "bar" | "line";
}

export interface ReedExpertReading {
  verdict: ReedVerdict;
  headline: string;
  moments: ReedMoment[];
  layers: ReedLayer[];
  hours: HourlyForecast[];
}

/** De cascade-laag: Tesla's severe-signaal (null = gate nooit geactiveerd = geen severe) + KNMI-waarschuwingen. */
export interface ReedCascadeInput {
  tesla?: TeslaSignal | null;
  warnings?: KNMIWarning[];
}

const RANK: Record<ReedVerdict, number> = { rustig: 0, oplettend: 1, onrustig: 2, code: 3 };
function worst(a: ReedVerdict, b: ReedVerdict): ReedVerdict { return RANK[a] >= RANK[b] ? a : b; }
function hhmm(iso: string): string { return iso.slice(11, 16); }

/** Tesla-niveau (1/2/3) → Reed-verdict. null = geen escalatie. */
function teslaVerdict(tesla?: TeslaSignal | null): ReedVerdict | null {
  if (!tesla) return null;
  return tesla.tesla_signal === 3 ? "code" : tesla.tesla_signal === 2 ? "onrustig" : "oplettend";
}

export function reedExpertReading(
  hours: HourlyForecast[],
  dayLabel: "vandaag" | "morgen",
  cascade: ReedCascadeInput = {},
): ReedExpertReading {
  if (hours.length === 0) {
    return { verdict: "rustig", headline: `Geen uurdata beschikbaar voor ${dayLabel}.`, moments: [], layers: [], hours: [] };
  }

  const cape = hours.map((h) => h.cape ?? 0);
  const cin = hours.map((h) => h.cin ?? 0);
  const li = hours.map((h) => h.liftedIndex ?? 0);
  const shear = hours.map((h) => h.windShear ?? 0);
  const dew = hours.map((h) => h.dewPoint ?? 0);
  const wind = hours.map((h) => h.windSpeed ?? 0);

  // De cascade beslist over onweer: CIN-bewuste, fysisch-consistente onweerskans
  // (snoeit op deksel + droog profiel) i.p.v. kale CAPE/LI. Tesla escaleert later.
  const thunder = hours.map((h) => getThunderstormChance(h, cascade.warnings));
  const thunderPeak = Math.max(...thunder);

  const capeMax = Math.max(...cape);
  const moments: ReedMoment[] = [];

  // Onweerspiek: keyt op de échte onweerskans (deksel-bewust), niet op kale CAPE.
  // Drempel 35% = lokaal een bui mogelijk; lager = ruis.
  const STORM_THRESHOLD = 35;
  const teslaSev = teslaVerdict(cascade.tesla);
  if (thunderPeak >= STORM_THRESHOLD || teslaSev !== null) {
    let start = thunder.findIndex((t) => t >= STORM_THRESHOLD);
    let end = start;
    for (let i = 0; i < thunder.length; i++) if (thunder[i] >= STORM_THRESHOLD) end = i;
    if (start === -1) { start = thunder.indexOf(thunderPeak); end = start; }
    // Severity uit de cijfers, daarna door de cascade (Tesla) omhoog getild.
    const numericSev: ReedVerdict = thunderPeak >= 70 ? "onrustig" : thunderPeak >= 50 ? "oplettend" : thunderPeak >= STORM_THRESHOLD ? "oplettend" : "rustig";
    const sev = teslaSev ? worst(numericSev, teslaSev) : numericSev;
    moments.push({
      time: hours[start].time, hourIndex: start, kind: "onweerspiek",
      label: cascade.tesla?.tesla_signal === 3 ? "Hoog onweersrisico" : "Onweerskans",
      detail: `${hhmm(hours[start].time)}–${hhmm(hours[end].time)}`,
      severity: sev,
    });
  }

  // Deksel breekt: CIN >= 100 in een eerder uur, dan eerste uur waar CIN < 35 terwijl CAPE > 500.
  const hadLid = cin.some((c, i) => c >= 100 && i < hours.length - 1);
  if (hadLid) {
    const firstLidHour = cin.findIndex((c) => c >= 100);
    for (let i = firstLidHour + 1; i < hours.length; i++) {
      if (cin[i] < 35 && cape[i] > 500) {
        moments.push({
          time: hours[i].time, hourIndex: i, kind: "deksel-breekt",
          label: "Deksel breekt", detail: hhmm(hours[i].time), severity: "oplettend",
        });
        break;
      }
    }
  }

  // Scheringpiek: hoogste windschering > 35 tijdens een reële onweerskans.
  let shearIdx = -1, shearVal = 35;
  for (let i = 0; i < hours.length; i++) {
    if (shear[i] > shearVal && thunder[i] >= STORM_THRESHOLD) { shearVal = shear[i]; shearIdx = i; }
  }
  if (shearIdx !== -1) {
    moments.push({
      time: hours[shearIdx].time, hourIndex: shearIdx, kind: "schering-piek",
      label: "Stormen kunnen zich organiseren", detail: hhmm(hours[shearIdx].time), severity: "oplettend",
    });
  }

  // Windpiek: wind > 50 km/u.
  let windIdx = -1, windVal = 50;
  for (let i = 0; i < hours.length; i++) { if (wind[i] > windVal) { windVal = wind[i]; windIdx = i; } }
  if (windIdx !== -1) {
    moments.push({
      time: hours[windIdx].time, hourIndex: windIdx, kind: "windpiek",
      label: "Harde wind", detail: hhmm(hours[windIdx].time), severity: "oplettend",
    });
  }

  // Broeierig: dauwpunt >= 18.
  const dewMax = Math.max(...dew);
  if (dewMax >= 18) {
    const i = dew.indexOf(dewMax);
    moments.push({
      time: hours[i].time, hourIndex: i, kind: "broeierig",
      label: "Broeierig", detail: hhmm(hours[i].time), severity: "oplettend",
    });
  }

  // Is er veel brandstof die door de deksel wordt tegengehouden? (verklaart het verschil
  // tussen "veel CAPE" en "toch geen onweer" — precies de val die we wilden dichten.)
  const cappedFuel = capeMax > 1000 && thunderPeak < STORM_THRESHOLD;

  // Lagen — eigen display-severity voor de kleuren van het meteogram. Deze voeden
  // bewust NIET het eindoordeel (anders tilt kale LI/CAPE het oordeel ten onrechte op).
  const capeSev: ReedVerdict = thunderPeak >= 50 ? "onrustig" : thunderPeak >= STORM_THRESHOLD ? "oplettend" : "rustig";
  const layers: ReedLayer[] = [
    {
      key: "cape", title: "Onweerskans (CAPE)", type: "bar", unit: "", series: cape,
      max: Math.max(2000, capeMax), threshold: 1000, thresholdLabel: "Pas op", severity: capeSev,
      phrase: cappedFuel
        ? "Veel brandstof, maar de deksel (CIN) houdt het dicht."
        : thunderPeak >= 50 ? "Genoeg brandstof én de deksel gaat eraf."
        : thunderPeak >= STORM_THRESHOLD ? "Wat opbouw; lokaal kan een bui ontstaan."
        : capeMax > 500 ? "Wat opbouw, maar geen trigger." : "Weinig opbouw — rustige lucht.",
    },
    {
      key: "dewPoint", title: "Vocht (dauwpunt)", type: "line", unit: "°C", series: dew,
      max: 25, threshold: 15, thresholdLabel: "Broeierig", severity: dewMax >= 18 ? "oplettend" : "rustig",
      phrase: dewMax >= 18 ? "Drukkend en zwoel." : dewMax >= 15 ? "Wat vochtig." : "Aangenaam droog.",
    },
    {
      key: "cin", title: "Deksel (CIN)", type: "bar", unit: "J/kg", series: cin,
      max: 150, threshold: 100, thresholdLabel: "Sterk deksel", severity: "rustig",
      phrase: Math.max(...cin) > 100 ? "Een sterke deksel houdt buien tegen." : hadLid ? "Een deksel houdt buien voorlopig tegen." : "Geen rem op de buienvorming.",
    },
    {
      key: "liftedIndex", title: "Stabiliteit (Lifted Index)", type: "line", unit: "°C", series: li,
      min: -10, max: 15, threshold: 0, thresholdLabel: "Instabiel (< 0)",
      severity: Math.min(...li) <= -6 ? "onrustig" : Math.min(...li) < 0 ? "oplettend" : "rustig",
      phrase: Math.min(...li) <= -6 ? "De lucht zelf is zeer onstabiel." : Math.min(...li) < 0 ? "Licht onstabiel." : "Stabiele opbouw.",
    },
    {
      key: "windShear", title: "Windschering (0–80m)", type: "line", unit: "km/u", series: shear,
      max: 50, threshold: 35, thresholdLabel: "Organisatie",
      severity: Math.max(...shear) >= 35 ? "oplettend" : "rustig",
      phrase: Math.max(...shear) >= 35 ? "Buien kunnen zich organiseren." : "Te weinig schering voor organisatie.",
    },
    {
      key: "windSpeed", title: "Wind", type: "line", unit: "km/u", series: wind,
      max: Math.max(80, Math.max(...wind)), threshold: 50, thresholdLabel: "Harde wind",
      severity: Math.max(...wind) > 50 ? "oplettend" : "rustig",
      phrase: Math.max(...wind) > 50 ? "Stevige wind op komst." : "Rustige wind.",
    },
  ];

  // Eindoordeel: alleen de momenten (storm/wind/schering/broeierig/deksel) tellen,
  // niet de kale expert-lagen. Zo blijft een gedekselde dag "rustig".
  const verdict = moments.map((m) => m.severity).reduce(worst, "rustig" as ReedVerdict);

  const storm = moments.find((m) => m.kind === "onweerspiek");
  const broeierig = moments.find((m) => m.kind === "broeierig");
  let headline: string;
  if (storm && (storm.severity === "code" || storm.severity === "onrustig")) {
    headline = `Vanaf ${storm.detail.split("–")[0]} staat de atmosfeer op scherp; korte, felle buien liggen op de loer.`;
  } else if (storm) {
    headline = `Rond ${storm.detail.split("–")[0]} kan lokaal een bui met onweer ontstaan.`;
  } else if (cappedFuel) {
    headline = `Er is genoeg brandstof in de lucht, maar een sterke deksel houdt het onweer tegen — droog en rustig.`;
  } else if (broeierig && verdict === "oplettend") {
    headline = `Rustig en stabiel, alleen wat broeierig.`;
  } else if (verdict === "oplettend") {
    headline = `Grotendeels rustig, maar houd de lucht in de gaten.`;
  } else {
    headline = `Een rustige, stabiele ${dayLabel}; geen onweer of storm in de cijfers.`;
  }

  return { verdict, headline, moments, layers, hours };
}
