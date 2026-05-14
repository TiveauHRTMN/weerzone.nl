import type { MarianaForecastVariables, MarianaWeatherRegime } from "./types";

export function classifyWeatherRegime(variables: MarianaForecastVariables): MarianaWeatherRegime {
  const signals: string[] = [];
  const precipitation = variables.precipitation ?? 0;
  const wind = Math.max(variables.windSpeed ?? 0, variables.windGusts ?? 0);
  const temperature = variables.temperature;
  const humidity = variables.humidity;
  const pressure = variables.pressure;

  if (precipitation >= 5) signals.push("heavy_precipitation");
  else if (precipitation >= 1) signals.push("wet");

  if (wind >= 75) signals.push("storm_gusts");
  else if (wind >= 45) signals.push("windy");

  if (typeof temperature === "number" && temperature <= 1) signals.push("near_freezing");
  if (typeof temperature === "number" && temperature >= 28) signals.push("heat");
  if (typeof humidity === "number" && humidity >= 90) signals.push("humid");
  if (typeof pressure === "number" && pressure <= 995) signals.push("low_pressure");

  if (signals.includes("storm_gusts") || signals.includes("low_pressure")) {
    return { code: "dynamic_low", label: "Dynamisch lagedrukweer", signals };
  }
  if (signals.includes("heavy_precipitation")) {
    return { code: "wet", label: "Natte neerslagsetting", signals };
  }
  if (signals.includes("near_freezing")) {
    return { code: "winter_margin", label: "Winterse grenslaag", signals };
  }
  if (signals.includes("heat")) {
    return { code: "heat", label: "Warme convectieve setting", signals };
  }
  if (signals.includes("windy")) {
    return { code: "wind", label: "Windgevoelige setting", signals };
  }
  return { code: "benign", label: "Rustig weerbeeld", signals };
}
