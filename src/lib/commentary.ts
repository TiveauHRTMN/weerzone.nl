import type { WeatherData } from "./types";

// ============================================================
// Commentary engine — WeerZone: Roddelpraat-stijl, brutaal, provocerend
// 48 uur. De rest is ruis.
// ============================================================

export function getMainCommentary(w: WeatherData): string {
  const t = w.current.temperature;
  const rain = w.current.precipitation;
  const wind = w.current.windSpeed;
  const code = w.current.weatherCode;

  // Regen
  if (rain > 5) return "Het regent alsof Petrus z'n aquarium omgooit. Buienradar had dit niet zien aankomen, wij wel.";
  if (rain > 1) return "Regen. Andere apps doen alsof het droog is. Wij liegen niet tegen je.";
  if (rain > 0) return "Motregen. Net genoeg om je humeur en je kapsel naar de klote te helpen.";

  // Sneeuw
  if (code >= 71 && code <= 77) return "Sneeuw! Over een kwartier staat heel Nederland op z'n gat. Letterlijk.";

  // Onweer
  if (code >= 95) return "Onweer. Bliksem, donder, het hele circus. Ga naar binnen en geniet van het drama.";

  // Mist
  if (code >= 45 && code <= 48) return "Dikke mist. Je ziet geen hand voor ogen. KNMI-nerds zitten weer te puzzelen, wij kijken gewoon 48 uur vooruit.";

  // Wind
  if (wind > 60) return "Storm. Ga nu naar buiten en je kunt je eigen begrafenis regelen.";
  if (wind > 40) return "Het waait de pleuris. Je fiets ligt al in de sloot en je paraplu is van je buurman.";

  // Temperatuur extremen
  if (t >= 30) return "Tropisch. Nederland smelt als een ijsje op het Binnenhof. Airco is geen luxe, het is overleving.";
  if (t >= 25) return "Warm. Heel Nederland rent naar de Hema voor een raketijsje. En terecht, geniet ervan.";
  if (t <= -5) return "Het vriest de klauwen van je lijf. Alles aan, jas dicht, muts op, niet lullen.";
  if (t <= 0) return "Onder nul. Trek die handschoenen aan of je vingers zijn straks souvenirs.";

  // Mooi weer
  if (code <= 2 && t >= 15 && wind < 25) {
    return "Prachtweer. Telefoon weg, bek dicht, naar buiten. Dit duurt niet lang in Nederland.";
  }
  if (code <= 3 && t >= 10) {
    return "Best aardig weer. Niet om over naar huis te schrijven, maar zeiken mag je niet.";
  }

  // Default
  if (t < 5) return "Koud en grijs. Welkom in de realiteit. Welkom in Nederland.";
  if (t < 10) return "Frisjes. Jas aan. Niet onderhandelen, niet zeuren, gewoon doen.";
  return "Doorsnee Nederlands weer. Niet warm, niet koud, niet droog, niet nat. Saai.";
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

  if (score <= 2) return { score, label: "Koningsweer. Telefoon weg, deur uit, nu.", emoji: "😎" };
  if (score <= 4) return { score, label: "Niks om over te janken. Gewoon genieten.", emoji: "🙂" };
  if (score <= 6) return { score, label: "Matig. Je overleeft het, maar blij word je er niet van.", emoji: "😐" };
  if (score <= 8) return { score, label: "Bagger. Bank, Netflix, bezorgen laten komen.", emoji: "😒" };
  return { score, label: "Compleet waardeloos. Sterkte en gecondoleerd.", emoji: "💀" };
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

  if (score >= 8) return { score, label: "Topfietsweer. Wie nu de auto pakt is een aansteller." };
  if (score >= 6) return { score, label: "Prima te doen. Jasje mee, bek dicht, trappen." };
  if (score >= 4) return { score, label: "Kan, maar je gaat er niet blij van worden." };
  if (score >= 2) return { score, label: "Alleen voor de echte diehards. Of gekken." };
  return { score, label: "Nee. Gewoon nee. OV, Uber, kruipen. Alles beter dan dit." };
}

export function getOutfitAdvice(w: WeatherData): { emoji: string; advice: string } {
  const t = w.current.feelsLike;
  const rain = w.current.precipitation;

  if (t >= 25) {
    return { emoji: "🩳", advice: rain > 0 ? "Kort broekje, maar paraplu mee. Je bent geen eend." : "Kort en luchtig. Smeer die kale kop maar in, je bent geen krokodil." };
  }
  if (t >= 18) {
    return { emoji: "👕", advice: rain > 0 ? "T-shirt, maar pak die regenjas. Vertrouw ons, niet Buienradar." : "T-shirt weer. Eindelijk. Duurt toch geen week in dit land." };
  }
  if (t >= 12) {
    return { emoji: "🧥", advice: "Jas mee. Niet discussiëren. Je moeder had gelijk en dat weet je." };
  }
  if (t >= 5) {
    return { emoji: "🧥", advice: "Winterjas. Altijd kouder dan je denkt. Altijd." };
  }
  if (t >= 0) {
    return { emoji: "🧣", advice: "Sjaal, muts, handschoenen. De hele rambam. Geen stoer gedoe." };
  }
  return { emoji: "🥶", advice: "Álles aan. Thermisch ondergoed is geen schande, het is zelfbehoud." };
}

export function getWindComment(wind: number, gusts: number): string {
  if (gusts > 80) return "Windstoten boven de 80. Je fiets is weg. Jij straks ook als je niet oppast.";
  if (gusts > 60) return "Heftige rukwinden. Je paraplu? Die is al in Duitsland.";
  if (wind > 40) return "Stevig waaiig. Niet stoer doen bij het water, niet lullen, naar binnen.";
  if (wind > 25) return "Behoorlijk wat wind. Fietsen wordt cardio op steroïden.";
  if (wind > 15) return "Lekker briesje. Fris, maar niks om over te zeiken.";
  return "Windstil. Zeldzaam in dit kikkerlandje. Geniet ervan.";
}

const ROTATING_QUOTES = [
  "Buienradar kan de tering krijgen met hun 14-daagse. Wij doen 48 uur en dat klopt.",
  "Morgen wordt het beter. Dat zeiden ze gisteren ook. Wij zeggen gewoon hoe het zit.",
  "\"Kans op zon\" is meteorologen-taal voor: we hebben geen flauw idee. Wij weten het wél.",
  "48 uur. Meer heb je niet nodig. Meer is ook gewoon nep.",
  "Je weer-app zegt 22° volgende week? Dat is een random number generator met een zonnebloem-icoontje.",
  "KNMI HARMONIE + DWD ICON. Twee supercomputers. Eén eerlijk antwoord. Geen gelul.",
  "14-daagse voorspelling? Dan kun je net zo goed een dartpijl naar een kalender gooien.",
  "Fietsen in de regen bouwt karakter, zeggen mensen die lekker droog in hun auto zitten.",
  "Jas-aan-jas-uit-jas-aan weer. Typisch Nederlands. Typisch kut.",
  "De windmolens draaien. Tenminste iemand profiteert van deze ellende.",
  "Nederland: vier seizoenen op één dag. Soms op één uur. Soms in één straat.",
  "WeerZone liegt niet. Nooit. Punt. Andere apps wel.",
  "Iedereen is meteoroloog totdat ze kletsnat op het station staan.",
  "Wij beloven niks. Behalve dat de komende 48 uur klopt. De rest is ruis.",
  "\"Lekker weertje\" zeggen terwijl het 12 graden is. Typisch Nederland. Wij doen daar niet aan mee.",
  "De eerlijkste weerdienst van Nederland. Brutaal? Nee. Gewoon niet bang voor de waarheid.",
  "Regen voorspeld? Dan regent het ook. Andere apps draaien er omheen, wij niet.",
  "Je horoscoop is betrouwbaarder dan een 10-daagse weersverwachting. Denk daar maar eens over na.",
];

export function getRandomQuote(): string {
  return ROTATING_QUOTES[Math.floor(Math.random() * ROTATING_QUOTES.length)];
}

export function getUvLabel(uv: number): { label: string; color: string } {
  if (uv <= 2) return { label: "Laag — chill", color: "#34d399" };
  if (uv <= 5) return { label: "Matig — smeer je in, malloot", color: "#f0a040" };
  if (uv <= 7) return { label: "Hoog — factor 30 minimaal", color: "#e8743a" };
  if (uv <= 10) return { label: "Zeer hoog — binnenblijven of factor 50, geen discussie", color: "#ef4444" };
  return { label: "Extreem — je verbrandt sneller dan een tosti", color: "#a855f7" };
}
