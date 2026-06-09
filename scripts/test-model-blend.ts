import {
  blendedTemperatureSeries,
  topWeightedDisplayModel,
  parseTimingWindow,
  timingAppliesToDay,
  safeInsight,
} from "../src/lib/model-blend";
import type { HourlyForecast } from "../src/lib/types";

let failures = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) {
    failures++;
    console.error(
      `FAIL ${name}: kreeg ${JSON.stringify(actual)}, verwachtte ${JSON.stringify(expected)}`,
    );
  } else {
    console.log(`ok   ${name}`);
  }
}

function hour(models: HourlyForecast["models"], temperature = 10): HourlyForecast {
  return {
    time: "2026-06-09T12:00",
    temperature,
    apparentTemperature: temperature,
    weatherCode: 1,
    precipitation: 0,
    windSpeed: 10,
    cape: 0,
    confidence: "high",
    models,
  } as HourlyForecast;
}

const point = (temperature: number) => ({ temperature, precipitation: 0, weatherCode: 1, windSpeed: 10 });

// 1. Gewogen gemiddelde: HARMONIE 0.6 op 10°, ICON_D2 0.54 op 20° → (10*0.6+20*0.54)/1.14 ≈ 14.74
const twoModels = [hour({ harmonie: point(10), icon: point(20) })];
const blended = blendedTemperatureSeries(twoModels, null);
check(
  "blend gewogen gemiddelde",
  Math.round(blended[0] * 100) / 100,
  Math.round(((10 * 0.6 + 20 * 0.54) / 1.14) * 100) / 100,
);

// 2. Feed-gewichten winnen van defaults: ICON_D2 op 1.0, HARMONIE op 0.1 → lijn trekt naar 20°
const tuned = blendedTemperatureSeries(twoModels, { HARMONIE: 0.1, ICON_D2: 1.0 });
check("blend volgt feed-gewichten", tuned[0] > 18, true);

// 3. Geen modellen → terugval op basistemperatuur
check("blend terugval zonder modellen", blendedTemperatureSeries([hour(undefined, 7)], null)[0], 7);

// 4. topWeightedDisplayModel: icon wint via feed
check("leidend getoond model", topWeightedDisplayModel(twoModels, { HARMONIE: 0.1, ICON_D2: 1.0 }), "icon");

// 5. Niet-getoond model (ECMWF) wint → null
const withEcmwf = [hour({ harmonie: point(10), icon: point(20), ecmwf: point(15) })];
check(
  "verborgen winnaar geeft null",
  topWeightedDisplayModel(withEcmwf, { HARMONIE: 0.1, ICON_D2: 0.2, ECMWF: 1.0 }),
  null,
);

// 6. Minder dan 2 getoonde modellen → null (één lijn 'leunt' nergens op)
check("één model geeft null", topWeightedDisplayModel([hour({ harmonie: point(10) })], null), null);

// 7. Timing-venster parsen
check("parse 14-18", parseTimingWindow("vandaag 14-18 uur"), { fromHour: 14, toHour: 18 });
check("parse 14:00 tot 18:00", parseTimingWindow("tussen 14:00 tot 18:00"), { fromHour: 14, toHour: 18 });
check("parse zonder venster", parseTimingWindow("in de middag"), null);
check("parse tussen 9 en 12", parseTimingWindow("tussen 9 en 12"), { fromHour: 9, toHour: 12 });
check("parse nachtvenster 22-02", parseTimingWindow("vanavond 22-02"), { fromHour: 22, toHour: 2 });

// 8. timingAppliesToDay
check("vandaag-only geldt niet voor morgen", timingAppliesToDay("vandaag 14-18", 1), false);
check("morgen geldt voor morgen", timingAppliesToDay("morgen 12-16", 1), true);
check("onbepaald geldt voor beide", timingAppliesToDay("14-18 uur", 0), true);

// 9. safeInsight filtert bron-/motornamen
check(
  "insight zonder namen blijft",
  safeInsight("De timing van de regen is het grootste verschil."),
  "De timing van de regen is het grootste verschil.",
);
check("insight met KNMI vervalt", safeInsight("Het KNMI verwacht regen."), null);
check("insight met Mariana vervalt", safeInsight("Mariana weegt HARMONIE zwaarder."), null);
check("lege insight geeft null", safeInsight("  "), null);
check("insight met 'iconische' blijft", safeInsight("Een iconische zomerdag met veel zon."), "Een iconische zomerdag met veel zon.");

if (failures > 0) {
  console.error(`\n${failures} check(s) gefaald`);
  process.exit(1);
}
console.log("\nAlle checks geslaagd");
