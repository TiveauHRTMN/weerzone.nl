import React from "react";

type WeatherCondition = "rain" | "heat" | "frost" | "default";

interface WeatherAdviceProps {
  temperature: number;
  precipitation: number;
  isFreezing?: boolean;
  locale?: "nl" | "de";
}

export default function WeatherAdvice({
  temperature,
  precipitation,
  isFreezing,
  locale = "nl",
}: WeatherAdviceProps) {
  let condition: WeatherCondition = "default";

  if (isFreezing || temperature < 2) {
    condition = "frost";
  } else if (precipitation > 1) {
    condition = "rain";
  } else if (temperature > 25) {
    condition = "heat";
  }

  if (condition === "default") return null;

  const contentMap = {
    rain: locale === "de"
      ? {
          title: "Kraeftige Schauer. Ga nu alleen als je een droog venster ziet.",
          action: "Wacht op een lichter moment of vertrek met marge.",
          icon: "!",
          color: "bg-blue-50 border-blue-200 text-blue-800",
        }
      : {
          title: "Flinke buien. Ga nu alleen als je een droog venster ziet.",
          action: "Wacht op een lichter moment of vertrek met marge.",
          icon: "!",
          color: "bg-blue-50 border-blue-200 text-blue-800",
        },
    heat: locale === "de"
      ? {
          title: "Warm. Het beste moment ligt vroeg of later op de avond.",
          action: "Plan inspanning buiten de middagpiek.",
          icon: "!",
          color: "bg-yellow-50 border-yellow-200 text-yellow-800",
        }
      : {
          title: "Warm. Het beste moment ligt vroeg of later op de avond.",
          action: "Plan inspanning buiten de middagpiek.",
          icon: "!",
          color: "bg-yellow-50 border-yellow-200 text-yellow-800",
        },
    frost: locale === "de"
      ? {
          title: "Frost moeglich. Vertrek rustiger en check lokale gladheid.",
          action: "Neem extra tijd voor de eerste rit.",
          icon: "!",
          color: "bg-indigo-50 border-indigo-200 text-indigo-800",
        }
      : {
          title: "Kans op vorst. Vertrek rustiger en check lokale gladheid.",
          action: "Neem extra tijd voor de eerste rit.",
          icon: "!",
          color: "bg-indigo-50 border-indigo-200 text-indigo-800",
        },
  };

  const advice = contentMap[condition];

  return (
    <div className={`mt-6 flex flex-col gap-3 rounded-xl border-2 p-4 shadow-sm md:flex-row md:items-center md:justify-between ${advice.color}`}>
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-lg font-black">
          {advice.icon}
        </span>
        <div>
          <h3 className="m-0 text-lg font-semibold">
            {locale === "de" ? "Weerzone Hinweis" : "Weerzone advies"}
          </h3>
          <p className="mt-1 text-sm opacity-90">{advice.title}</p>
        </div>
      </div>
      <p className="text-sm font-bold md:max-w-[240px] md:text-right">{advice.action}</p>
    </div>
  );
}
