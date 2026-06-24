import type { HourlyForecast } from "@/lib/types";

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

const RANK: Record<ReedVerdict, number> = { rustig: 0, oplettend: 1, onrustig: 2, code: 3 };
function worst(a: ReedVerdict, b: ReedVerdict): ReedVerdict { return RANK[a] >= RANK[b] ? a : b; }
function hhmm(iso: string): string { return iso.slice(11, 16); }

export function reedExpertReading(hours: HourlyForecast[], dayLabel: "vandaag" | "morgen"): ReedExpertReading {
  if (hours.length === 0) {
    return { verdict: "rustig", headline: `Geen uurdata beschikbaar voor ${dayLabel}.`, moments: [], layers: [], hours: [] };
  }

  const cape = hours.map((h) => h.cape ?? 0);
  const cin = hours.map((h) => h.cin ?? 0);
  const li = hours.map((h) => h.liftedIndex ?? 0);
  const shear = hours.map((h) => h.windShear ?? 0);
  const dew = hours.map((h) => h.dewPoint ?? 0);
  const wind = hours.map((h) => h.windSpeed ?? 0);

  const capeMax = Math.max(...cape);
  const moments: ReedMoment[] = [];

  // Onweerspiek: CAPE > 1500 samen met LI < -6 (sterk), of CAPE > 1000 + LI < -2 (matig).
  let peakStart = -1, peakEnd = -1, peakSev: ReedVerdict = "rustig";
  for (let i = 0; i < hours.length; i++) {
    const strong = cape[i] > 1500 && li[i] < -6;
    const moderate = cape[i] > 1000 && li[i] < -2;
    if (strong || moderate) {
      if (peakStart === -1) peakStart = i;
      peakEnd = i;
      peakSev = worst(peakSev, strong ? "code" : "onrustig");
    }
  }
  if (peakStart !== -1) {
    moments.push({
      time: hours[peakStart].time, hourIndex: peakStart, kind: "onweerspiek",
      label: "Piek onweerskans", detail: `${hhmm(hours[peakStart].time)}–${hhmm(hours[peakEnd].time)}`,
      severity: peakSev,
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
          label: "Deksel breekt", detail: hhmm(hours[i].time), severity: "onrustig",
        });
        break;
      }
    }
  }

  // Scheringpiek: hoogste windschering > 35 tijdens CAPE > 500.
  let shearIdx = -1, shearVal = 35;
  for (let i = 0; i < hours.length; i++) {
    if (shear[i] > shearVal && cape[i] > 500) { shearVal = shear[i]; shearIdx = i; }
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

  // Lagen.
  const capeSev: ReedVerdict = capeMax > 1500 ? "onrustig" : capeMax > 500 ? "oplettend" : "rustig";
  const layers: ReedLayer[] = [
    {
      key: "cape", title: "Onweerskans (CAPE)", type: "bar", unit: "", series: cape,
      max: Math.max(2000, capeMax), threshold: 1000, thresholdLabel: "Pas op", severity: capeSev,
      phrase: capeMax > 1500 ? "Genoeg brandstof voor flinke buien." : capeMax > 500 ? "Wat opbouw, maar nog beheersbaar." : "Weinig opbouw — rustige lucht.",
    },
    {
      key: "dewPoint", title: "Vocht (dauwpunt)", type: "line", unit: "°C", series: dew,
      max: 25, threshold: 15, thresholdLabel: "Broeierig", severity: dewMax >= 18 ? "oplettend" : "rustig",
      phrase: dewMax >= 18 ? "Drukkend en zwoel." : dewMax >= 15 ? "Wat vochtig." : "Aangenaam droog.",
    },
    {
      key: "cin", title: "Deksel (CIN)", type: "bar", unit: "J/kg", series: cin,
      max: 150, threshold: 100, thresholdLabel: "Sterk deksel", severity: hadLid ? "oplettend" : "rustig",
      phrase: hadLid ? "Een deksel houdt buien voorlopig tegen." : "Geen rem op de buienvorming.",
    },
    {
      key: "liftedIndex", title: "Stabiliteit (Lifted Index)", type: "line", unit: "°C", series: li,
      min: -10, max: 15, threshold: 0, thresholdLabel: "Instabiel (< 0)",
      severity: Math.min(...li) <= -6 ? "onrustig" : Math.min(...li) < 0 ? "oplettend" : "rustig",
      phrase: Math.min(...li) <= -6 ? "Zeer onstabiel — storm mogelijk." : Math.min(...li) < 0 ? "Licht onstabiel." : "Stabiele opbouw.",
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

  const verdict = [...moments.map((m) => m.severity), ...layers.map((l) => l.severity)].reduce(worst, "rustig" as ReedVerdict);

  const deksel = moments.find((m) => m.kind === "deksel-breekt");
  const peak = moments.find((m) => m.kind === "onweerspiek");
  let headline: string;
  if (peak && deksel) {
    headline = `Geduld tot een uur of ${parseInt(deksel.detail)} — daarna kan het in korte tijd flink tekeergaan.`;
  } else if (peak) {
    headline = `Vanaf ${peak.detail.split("–")[0]} staat de atmosfeer op scherp; korte, felle buien liggen op de loer.`;
  } else if (verdict === "oplettend") {
    headline = `Grotendeels rustig, maar houd de lucht in de gaten.`;
  } else {
    headline = `Een rustige, stabiele ${dayLabel}; geen onweer of storm in de cijfers.`;
  }

  return { verdict, headline, moments, layers, hours };
}
