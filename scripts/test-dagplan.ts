/** Rooktests dagplan-logica (spec 2026-07-13): npx tsx scripts/test-dagplan.ts */
import assert from "node:assert";
import {
  momentWindowsForDay,
  effectiveMoments,
  isPausedOn,
  nlDateISO,
  type AgentMoment,
} from "../src/lib/agents/moments-shared";
import { freedayCandidate, inFreedayWindow } from "../src/lib/agents/headsup-push";
import type { HourlyForecast } from "../src/lib/types";

const base = { id: "x", label: "T", windowStart: "10:00", windowEnd: "12:00", transport: null, province: null, placeSlug: null };
const wk = (kind: AgentMoment["kind"], days: number[]): AgentMoment => ({ ...base, kind, days, date: null });
const oneOff = (date: string): AgentMoment => ({ ...base, kind: "outdoor", days: [], date });

// Zondag 2026-07-19 12:00 NL (10:00Z in CEST)
const sunday = new Date("2026-07-19T10:00:00Z");
assert.equal(nlDateISO(sunday), "2026-07-19");

// datum-moment matcht alleen op zijn datum; days genegeerd
assert.equal(momentWindowsForDay([oneOff("2026-07-19")], sunday).length, 1);
assert.equal(momentWindowsForDay([oneOff("2026-07-20")], sunday).length, 0);
// weekdag-moment blijft werken (7 = zondag)
assert.equal(momentWindowsForDay([wk("dog", [7])], sunday).length, 1);
assert.equal(momentWindowsForDay([wk("dog", [1])], sunday).length, 0);

// routine-pauze filtert alleen commute
const mix = [wk("commute", [7]), wk("dog", [7])];
assert.deepEqual(effectiveMoments(mix, true).map((m) => m.kind), ["dog"]);
assert.equal(effectiveMoments(mix, false).length, 2);

// vakantiestand: t/m de datum stil
assert.equal(isPausedOn("2026-07-19", "2026-07-19"), true);
assert.equal(isPausedOn("2026-07-18", "2026-07-19"), false);
assert.equal(isPausedOn(null, "2026-07-19"), false);

// freeday-venster: 07:00–09:00 NL
assert.equal(inFreedayWindow(new Date("2026-07-19T06:00:00Z")), true); // 08:00 NL
assert.equal(inFreedayWindow(new Date("2026-07-19T10:00:00Z")), false); // 12:00 NL

// freeday-kandidaat: droog → nat om 14:00 NL
const mkHourly = (fn: (i: number) => number): HourlyForecast[] =>
  Array.from({ length: 18 }, (_, i) => ({
    time: new Date(Date.parse("2026-07-19T04:00:00Z") + i * 3600_000).toISOString(),
    temperature: 20,
    precipitation: fn(i),
    windSpeed: 10,
    weatherCode: 3,
  } as HourlyForecast));
const now = new Date("2026-07-19T05:30:00Z"); // 07:30 NL
const cand = freedayCandidate("Winkel", mkHourly((i) => (i >= 8 ? 1 : 0)), now);
assert.ok(cand && cand.agent === "piet" && cand.category === "freeday");
assert.equal(cand!.key, "piet|freeday|2026-07-19");
assert.ok(cand!.title.includes("Winkel"));
assert.ok(cand!.title.includes("14:00"));
// hele dag droog → ook een kandidaat (waarde-eerst), zelfde sleutel
const dryAll = freedayCandidate("Winkel", mkHourly(() => 0), now);
assert.ok(dryAll && dryAll.key === "piet|freeday|2026-07-19");
// hele dag nat → binnenplannen-variant
const wetAll = freedayCandidate("Winkel", mkHourly(() => 1), now);
assert.ok(wetAll && wetAll.title.includes("nat"));

console.log("test-dagplan: alles groen");
