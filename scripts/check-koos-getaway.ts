import assert from "node:assert/strict";
import {
  comfortScore,
  haversineKm,
  scoreGetaways,
  scoreGetawayPicks,
  koosTemplateLine,
  INTERNATIONAL_SUNSET,
  type DailyOutlook,
} from "../src/lib/koos-getaway";

function outlook(over: Partial<DailyOutlook>): DailyOutlook {
  return {
    name: "X",
    locationId: "x",
    lat: 52,
    lon: 5,
    kind: "domestic",
    tempMax: 18,
    precipProbMax: 40,
    sunshineHours: 4,
    weatherCode: 3,
    distanceKm: 0,
    ...over,
  };
}

// 1. comfortScore: zonnig+droog+22° scoort hoger dan grauw+nat+koud.
const warm = comfortScore({ tempMax: 22, precipProbMax: 5, sunshineHours: 11 });
const grey = comfortScore({ tempMax: 12, precipProbMax: 80, sunshineHours: 1 });
assert.ok(warm > grey, "zonnige dag moet hoger scoren dan grauwe");
assert.ok(warm <= 1 && grey >= 0, "score moet binnen 0..1 vallen");

// 2. haversineKm: Amsterdam -> Maastricht ~ 175 km (ruwe check 150..210).
const km = haversineKm({ lat: 52.37, lon: 4.9 }, { lat: 50.85, lon: 5.69 });
assert.ok(km >= 150 && km <= 210, `afstand AMS-MST onverwacht: ${km}`);

// 3. Binnenlandse plek die merkbaar beter is -> verschijnt, score > 0.
const origin = outlook({ tempMax: 13, precipProbMax: 70, sunshineHours: 1, locationId: "thuis" });
const better = outlook({ name: "Maastricht", locationId: "limburg/maastricht", tempMax: 21, precipProbMax: 10, sunshineHours: 9, distanceKm: 175 });
const r1 = scoreGetaways(origin, [better]);
assert.equal(r1.length, 1, "betere NL-plek moet verschijnen");
assert.ok(r1[0].score > 0, "score moet positief zijn");
assert.equal(r1[0].targetName, "Maastricht", "targetName moet kloppen");

// 4. Koos zwijgt: een even goede / slechtere plek levert lege output.
const sameish = outlook({ name: "Bijna-Thuis", locationId: "x/y", tempMax: 13, precipProbMax: 68, sunshineHours: 1, distanceKm: 40 });
assert.equal(scoreGetaways(origin, [sameish]).length, 0, "geen merkbaar betere plek -> Koos zwijgt");

// 5. Internationale zon-gate: bij prima thuisweer NIET tonen.
const mildHome = outlook({ tempMax: 21, precipProbMax: 15, sunshineHours: 8, locationId: "thuis" });
const sunny = outlook({ name: "Valencia", locationId: "sunset-valencia", kind: "sunset", tempMax: 26, precipProbMax: 5, sunshineHours: 11, distanceKm: 1500 });
assert.equal(scoreGetaways(mildHome, [sunny]).length, 0, "bij goed thuisweer geen zon-ontsnapping");

// 6. Internationale zon-gate: bij grauw/koud thuis WEL tonen.
const r2 = scoreGetaways(origin, [sunny]);
assert.equal(r2.length, 1, "bij grauw thuisweer wel zon-ontsnapping");
assert.equal(r2[0].targetName, "Valencia", "zon-bestemming moet kloppen");

// 7. koosTemplateLine: niet-lege NL-zin met de bestemmingsnaam erin.
const line = koosTemplateLine(r1[0]);
assert.ok(line.length > 0 && line.includes("Maastricht"), "sjabloon-zin moet bestemming noemen");

// 8. INTERNATIONAL_SUNSET bevat de uitgebreide zon-set (meerdere opties).
assert.ok(INTERNATIONAL_SUNSET.length >= 8, `verwacht >=8 zon-bestemmingen, kreeg ${INTERNATIONAL_SUNSET.length}`);
assert.ok(INTERNATIONAL_SUNSET.every((d) => d.lat && d.lon && d.name && d.locationId), "elke bestemming compleet");
assert.equal(new Set(INTERNATIONAL_SUNSET.map((d) => d.locationId)).size, INTERNATIONAL_SUNSET.length, "geen dubbele locationId's");

// 9. scoreGetawayPicks draagt de weerdata mee en mapt 1-op-1 op scoreGetaways.
const picks = scoreGetawayPicks(origin, [better]);
assert.equal(picks.length, 1, "pick moet verschijnen");
assert.equal(picks[0].tempMax, 21, "pick draagt tempMax mee");
assert.equal(picks[0].sunshineHours, 9, "pick draagt zon mee");
assert.equal(picks[0].precipProbMax, 10, "pick draagt regen mee");
assert.equal(picks[0].kind, "domestic", "pick draagt kind mee");
assert.equal(picks[0].opportunity.targetName, "Maastricht", "pick.opportunity koppelt aan dezelfde plek");

// 10. NL-first: een mooie binnenlandse getaway onderdrukt de buitenland-tip,
//     ook al is het thuis grauw (buitenland pas als heel NL niets moois biedt).
const niceNL = outlook({ name: "Terschelling", locationId: "friesland/terschelling", character: "coastal", tempMax: 22, precipProbMax: 8, sunshineHours: 9, distanceKm: 120 });
const r3 = scoreGetaways(origin, [niceNL, sunny]);
assert.ok(r3.some((o) => o.targetName === "Terschelling"), "mooie NL-plek moet verschijnen");
assert.ok(!r3.some((o) => o.targetName === "Valencia"), "buitenland onderdrukt zolang NL iets moois biedt");

// 11. NL-first: een droge, redelijke NL-plek (geen topdag) mag verschijnen en
//     onderdrukt buitenland.
const dryMeh = outlook({ name: "Iets-Beter", locationId: "x/meh", character: "inland", tempMax: 17, precipProbMax: 30, sunshineHours: 5, weatherCode: 2, distanceKm: 60 });
const mehResult = scoreGetaways(origin, [dryMeh]);
assert.equal(mehResult.length, 1, "droge, merkbaar betere NL-plek verschijnt");
assert.equal(mehResult[0].targetName, "Iets-Beter", "NL target moet kloppen");

// 12. Droogte-eis: een NL-plek waar het ook regent wordt NIET getipt — dan mag
//     buitenland juist wel (heel NL nat).
const wetNL = outlook({ name: "De Veluwe", locationId: "gelderland/de-veluwe", character: "highland", tempMax: 18, precipProbMax: 70, sunshineHours: 5, weatherCode: 63, distanceKm: 70 });
const r4 = scoreGetaways(origin, [wetNL, sunny]);
assert.ok(!r4.some((o) => o.targetName === "De Veluwe"), "natte NL-plek wordt niet getipt");
assert.ok(r4.some((o) => o.targetName === "Valencia"), "bij natte NL mag de verre zon-set verschijnen");

// 13. Karakter-bewuste reden: kust -> 'aan zee'.
const coastalPick = scoreGetawayPicks(origin, [niceNL])[0];
assert.ok(/aan zee/i.test(coastalPick.opportunity.reason), `kust-reden verwacht 'aan zee': ${coastalPick.opportunity.reason}`);

// 14. Campings worden als plek op de camping verwoord, niet als stad.
const camping = outlook({ name: "Camping De Lakens", locationId: "noord-holland/camping-de-lakens", character: "coastal", tempMax: 22, precipProbMax: 5, sunshineHours: 9, distanceKm: 80 });
const campingPick = scoreGetawayPicks(origin, [camping])[0];
assert.ok(/op Camping De Lakens/i.test(campingPick.opportunity.reason), `camping-reden verwacht 'op Camping': ${campingPick.opportunity.reason}`);

// 15. Dichtbij-buitenland verschijnt naast een NL-pick (75% NL + 1-2 dichtbij).
const goodNearby = outlook({ name: "Antwerpen", locationId: "nearby-antwerpen", kind: "nearby", tempMax: 21, precipProbMax: 15, sunshineHours: 8, weatherCode: 2, distanceKm: 120, country: "België", transport: "auto of trein" });
const r5 = scoreGetaways(origin, [better, goodNearby]);
assert.ok(r5.some((o) => o.targetName === "Maastricht"), "NL-pick aanwezig in de mix");
assert.ok(r5.some((o) => o.targetName === "Antwerpen"), "dichtbij-buitenland verschijnt ernaast");

// 16. Harde droogte-eis: warm maar nat wordt nooit getipt.
const wetButWarm = outlook({ name: "NatMaarWarm", locationId: "x/nat", tempMax: 24, precipProbMax: 90, sunshineHours: 8, weatherCode: 61, distanceKm: 50 });
assert.equal(scoreGetaways(origin, [wetButWarm]).length, 0, "natte plek wordt niet getipt, ook al is het warm");

// 17. Heel NL nat → dichtbij-buitenland (droog) wordt getoond i.p.v. de natte NL-plek.
const r6 = scoreGetaways(origin, [wetNL, goodNearby]);
assert.ok(r6.some((o) => o.targetName === "Antwerpen"), "bij natte NL toont Koos dichtbij-buitenland");
assert.ok(!r6.some((o) => o.targetName === "De Veluwe"), "natte NL-plek niet getipt");

// 18. Stralende dag thuis → Koos zwijgt, ook al is elders nóg beter.
const sunnyHome = outlook({ tempMax: 24, precipProbMax: 5, sunshineHours: 11, locationId: "thuis" });
const evenBetter = outlook({ name: "Texel", locationId: "noord-holland/texel", character: "coastal", tempMax: 26, precipProbMax: 0, sunshineHours: 12, distanceKm: 90 });
assert.equal(scoreGetaways(sunnyHome, [evenBetter]).length, 0, "mooie thuisdag -> Koos zwijgt");

console.log("OK - koos-getaway pure logica gedraagt zich correct");
