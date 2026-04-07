import type { WeatherData } from "./types";

// ============================================================
// Commentary engine — droog, sarcastisch, Jip-en-Janneke taal
// Regel: het woord "kutweer" wordt NOOIT gebruikt
// ============================================================

export function getMainCommentary(w: WeatherData): string {
  const t = w.current.temperature;
  const rain = w.current.precipitation;
  const wind = w.current.windSpeed;
  const code = w.current.weatherCode;

  // Regen
  if (rain > 5) return "Wie had dit gedacht? Regen in Nederland! Verrassend.";
  if (rain > 1) return "Het regent. Alsof we niet genoeg teleurgesteld waren.";
  if (rain > 0) return "Er valt wat vocht uit de lucht. Net genoeg om je humeur te verpesten.";

  // Sneeuw
  if (code >= 71 && code <= 77) return "Sneeuw! Leuk voor de eerste vijf minuten.";

  // Onweer
  if (code >= 95) return "Onweer. De natuur is ook niet blij vandaag.";

  // Mist
  if (code >= 45 && code <= 48) return "Dikke mist. Nederland op z'n sfeervollst.";

  // Wind
  if (wind > 60) return "Storm. Blijf gewoon binnen. Serieus.";
  if (wind > 40) return "De wind rukt aan je fiets alsof-ie die persoonlijk haat.";

  // Temperatuur extremen
  if (t >= 30) return "Tropisch. Nederland smelt. Niemand heeft airco.";
  if (t >= 25) return "Het is warm. Heel Nederland staat in de rij bij de IJkspoorplein.";
  if (t <= -5) return "Pak alles aan dat warm is. Het vriest dat het kraakt.";
  if (t <= 0) return "Het vriest. Je handen zijn officieel decoratie.";

  // Mooi weer
  if (code <= 2 && t >= 15 && wind < 25) {
    return "Het is mooi weer en dat mag ook wel eens. Terras!";
  }
  if (code <= 3 && t >= 10) {
    return "Best aardig weer eigenlijk. Niet klagen vandaag.";
  }

  // Default
  if (t < 5) return "Koud en saai. De standaard.";
  if (t < 10) return "Frisjes. Een jas is geen optie, het is een verplichting.";
  return "Typisch Nederlands weer. Niet geweldig, niet dramatisch.";
}

export function getKutweerScore(w: WeatherData): { score: number; label: string; emoji: string } {
  let score = 5; // baseline

  const t = w.current.temperature;
  const rain = w.current.precipitation;
  const wind = w.current.windSpeed;
  const code = w.current.weatherCode;

  // Temperatuur (ideaal = 18-22°C)
  if (t >= 18 && t <= 22) score -= 2;
  else if (t >= 15 && t <= 25) score -= 1;
  else if (t >= 10 && t <= 28) score += 0;
  else if (t < 0 || t > 33) score += 3;
  else if (t < 5 || t > 30) score += 2;
  else score += 1;

  // Regen
  if (rain === 0) score -= 1.5;
  else if (rain < 1) score += 1;
  else if (rain < 5) score += 2;
  else score += 3;

  // Wind
  if (wind < 15) score -= 0.5;
  else if (wind < 30) score += 0.5;
  else if (wind < 50) score += 1.5;
  else score += 2.5;

  // Weercode
  if (code === 0) score -= 1;
  if (code >= 95) score += 2;
  if (code >= 71 && code <= 77) score += 1;

  // Clamp
  score = Math.max(0.5, Math.min(10, Math.round(score * 10) / 10));

  if (score <= 2) return { score, label: "Niks te klagen. Geniet ervan.", emoji: "😊" };
  if (score <= 4) return { score, label: "Prima weer. Normáál doen.", emoji: "🙂" };
  if (score <= 6) return { score, label: "Meh. Het is wat het is.", emoji: "😐" };
  if (score <= 8) return { score, label: "Het is bagger. Blijf lekker binnen.", emoji: "😒" };
  return { score, label: "Dramatisch. Red jezelf.", emoji: "🤮" };
}

export function getFietsScore(w: WeatherData): { score: number; label: string } {
  let score = 10;

  if (w.current.precipitation > 0) score -= 4;
  if (w.current.precipitation > 2) score -= 3;
  if (w.current.windSpeed > 30) score -= 2;
  if (w.current.windSpeed > 50) score -= 3;
  if (w.current.temperature < 0) score -= 2;
  if (w.current.temperature < 5) score -= 1;
  if (w.current.weatherCode >= 95) score -= 3;
  if (w.current.weatherCode >= 45 && w.current.weatherCode <= 48) score -= 1;

  score = Math.max(0, Math.min(10, Math.round(score * 10) / 10));

  if (score >= 8) return { score, label: "Ideaal fietsweer. Pak die fiets!" };
  if (score >= 6) return { score, label: "Prima te doen. Jas mee voor de zekerheid." };
  if (score >= 4) return { score, label: "Kan, maar je gaat het voelen." };
  if (score >= 2) return { score, label: "Alleen als je echt moet." };
  return { score, label: "Nee. Gewoon nee. Pak de bus." };
}

export function getOutfitAdvice(w: WeatherData): { emoji: string; advice: string } {
  const t = w.current.feelsLike;
  const rain = w.current.precipitation;

  if (t >= 25) {
    return { emoji: "🩳", advice: rain > 0 ? "Kort, maar neem een paraplu mee." : "Kort en luchtig. Zonnebrand niet vergeten." };
  }
  if (t >= 18) {
    return { emoji: "👕", advice: rain > 0 ? "T-shirt, maar neem een regenjas mee." : "T-shirt weer. Eindelijk." };
  }
  if (t >= 12) {
    return { emoji: "🧥", advice: "Jas mee. Het is kouder dan je denkt." };
  }
  if (t >= 5) {
    return { emoji: "🧥", advice: "Warme jas. Het voelt killer dan het lijkt." };
  }
  if (t >= 0) {
    return { emoji: "🧣", advice: "Sjaal, muts, handschoenen. De hele mikmak." };
  }
  return { emoji: "🥶", advice: "Alles aan. Múts op. Thermisch ondergoed is geen schande." };
}

export function getWindComment(wind: number, gusts: number): string {
  if (gusts > 80) return "\"Windstoten waar je fiets van omvalt. Letterlijk.\"";
  if (gusts > 60) return "\"Flink waaiig. Je paraplu heeft het lastig.\"";
  if (wind > 40) return "\"Stevig. Loop niet te dicht bij het water.\"";
  if (wind > 25) return "\"Flink wat wind. Je paraplu heeft het lastig.\"";
  if (wind > 15) return "\"Een lekker briesje. Fris maar niet vervelend.\"";
  return "\"Windstil. Dat is zeldzaam hier.\"";
}

const ROTATING_QUOTES = [
  "De zon schijnt. Nederlanders weten niet wat ze ermee moeten doen.",
  "Morgen wordt het beter. Zeiden ze gisteren ook.",
  "Het is geen slecht weer, het is alleen verkeerde kleding.",
  "In Nederland regent het niet, het \"miezert\". Alsof dat beter is.",
  "25 graden en heel Nederland doet alsof het Ibiza is.",
  "De weervrouw zei 'kans op zon'. Kans. Niet garantie.",
  "Het is precies het weer waar je niks mee kan.",
  "Fietsen in de regen bouwt karakter. Zeggen mensen die een auto hebben.",
  "Het KNMI waarschuwt voor code geel. Wij waarschuwen voor teleurstelling.",
  "Nederlands weer: verwacht het ergste, hoop op het beste, krijg geen van beide.",
  "\"Lekker weertje\" zeggen terwijl het 12 graden is. Zo zijn we.",
  "Vandaag is het weer perfect. Om teleurgesteld te worden.",
  "De windmolens draaien. Tenminste iemand die er blij van wordt.",
  "Het regent. Pak een boek, een deken, en accepteer het.",
  "Nederland: vier seizoenen op één dag. Soms op één uur.",
];

export function getRandomQuote(): string {
  return ROTATING_QUOTES[Math.floor(Math.random() * ROTATING_QUOTES.length)];
}

export function getUvLabel(uv: number): { label: string; color: string } {
  if (uv <= 2) return { label: "Laag", color: "#34d399" };
  if (uv <= 5) return { label: "Matig", color: "#f0a040" };
  if (uv <= 7) return { label: "Hoog", color: "#e8743a" };
  if (uv <= 10) return { label: "Zeer hoog", color: "#ef4444" };
  return { label: "Extreem", color: "#a855f7" };
}
