import { defaultCaption } from "../src/lib/mariana/studio/caption";
import type { StudioDay } from "../src/lib/mariana/studio/types";

function assert(cond: boolean, msg: string) {
  if (!cond) { console.error("FAIL:", msg); process.exit(1); }
  console.log("ok:", msg);
}

const day: StudioDay = {
  forecastDate: "2026-06-29",
  runAt: "2026-06-29T03:30:00.000Z",
  slide1: { badge: "Maandag 29 juni · 08:00", titel: "Vandaag", intro: "Zonnig en warm.", regionTemps: { noord: 25, oost: 30, midden: 31, west: 29, zuid: 32 }, dayparts: { ochtend: 22, middag: 31, avond: 27, nacht: 19 }, metrics: { uvIndex: 7, hooikoorts: "Hoog", windBft: 3, fietsweer: "Goed" }, tagline: "x" },
  slide2: { badge: "Nu · 14:00", titel: "Actueel weer", subtitel: "Zo staat het er nu voor", regionTempsNow: null, warmstePlek: null },
  slide3: { badge: "Avond · 29 juni", titel: "Vandaag & Morgen", vandaag: { hoogste: { temp: 34, plaats: "Maastricht" }, laagste: { temp: 12, label: "vannacht" }, weerfeit: "Warm" }, morgen: { temp: 29, alinea: "Iets koeler morgen." } },
  slide4: { type: "onweer", badge: "Heads-up · vanavond", titel: "Onweer trekt binnen", intro: "Pas op voor onweer.", rijen: { wanneer: "20-23u", waar: "Zuidoosten", verwacht: "Felle buien" }, advies: "Blijf binnen." },
};

const HASH = "#weer #weerzone #weerbericht #nederland";

const c1 = defaultCaption(day, "slide1");
assert(c1.includes("Zonnig en warm.") && c1.endsWith(HASH), "slide1 bevat intro + eindigt op hashtags");

const c2 = defaultCaption(day, "slide2");
assert(c2.includes("Zo staat het er nu voor") && c2.endsWith(HASH), "slide2 bevat subtitel + hashtags");

const c3 = defaultCaption(day, "slide3");
assert(c3.includes("Iets koeler morgen.") && c3.endsWith(HASH), "slide3 bevat morgen-alinea + hashtags");

const c4 = defaultCaption(day, "slide4");
assert(c4.includes("Onweer trekt binnen") && c4.endsWith(HASH), "slide4 bevat titel + hashtags");

assert(!/KNMI|DWD|Mariana/i.test(c1 + c2 + c3 + c4), "geen bronnamen in captions");

console.log("ALL PASS");
