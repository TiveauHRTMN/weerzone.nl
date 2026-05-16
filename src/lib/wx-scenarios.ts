/**
 * Dev-scenarios voor WeatherBackground.
 * Via ?wx=<key> in de URL kan een specifieke weersituatie geforceerd
 * worden voor visuele tests, los van wat het echte weer doet.
 */

export type WxScenarioKey =
  | "clear-day"
  | "clear-night"
  | "mainly-clear-day"
  | "mainly-clear-night"
  | "partly-cloudy-day"
  | "partly-cloudy-night"
  | "cloudy"
  | "fog"
  | "drizzle"
  | "rain"
  | "heavy-rain"
  | "snow"
  | "heavy-snow"
  | "storm"
  | "hail"
  | "smog"
  | "saharadust";

export interface WxScenario {
  key: WxScenarioKey;
  code: number;
  isDay: boolean;
  label: string;
}

export const WX_SCENARIOS: WxScenario[] = [
  { key: "clear-day",            code: 0,  isDay: true,  label: "☀️  Helder (dag)" },
  { key: "clear-night",          code: 0,  isDay: false, label: "🌙  Helder (nacht)" },
  { key: "mainly-clear-day",     code: 1,  isDay: true,  label: "🌤️  Licht bewolkt (dag)" },
  { key: "mainly-clear-night",   code: 1,  isDay: false, label: "🌙  Licht bewolkt (nacht)" },
  { key: "partly-cloudy-day",    code: 2,  isDay: true,  label: "⛅  Half bewolkt (dag)" },
  { key: "partly-cloudy-night",  code: 2,  isDay: false, label: "🌥️  Half bewolkt (nacht)" },
  { key: "cloudy",               code: 3,  isDay: true,  label: "☁️  Zwaar bewolkt" },
  { key: "fog",                  code: 45, isDay: true,  label: "🌫️  Mist" },
  { key: "drizzle",              code: 53, isDay: true,  label: "🌦️  Motregen" },
  { key: "rain",                 code: 63, isDay: true,  label: "🌧️  Regen" },
  { key: "heavy-rain",           code: 65, isDay: true,  label: "⛈️  Zware regen" },
  { key: "snow",                 code: 73, isDay: true,  label: "❄️  Sneeuw" },
  { key: "heavy-snow",           code: 75, isDay: true,  label: "🌨️  Hevige sneeuw" },
  { key: "storm",                code: 95, isDay: true,  label: "⚡  Onweer" },
  { key: "hail",                 code: 96, isDay: true,  label: "🌩️  Onweer + hagel" },
  { key: "smog",                 code: 200, isDay: true, label: "🟫  Smog" },
  { key: "saharadust",           code: 201, isDay: true, label: "🟠  Sahara-zand" },
];

const SCENARIO_BY_KEY: Record<string, WxScenario> = Object.fromEntries(
  WX_SCENARIOS.map((s) => [s.key, s]),
);

export function resolveWxScenario(key: string | null | undefined): WxScenario | null {
  if (!key) return null;
  return SCENARIO_BY_KEY[key] ?? null;
}

export const WX_QUERY_KEY = "wx";
