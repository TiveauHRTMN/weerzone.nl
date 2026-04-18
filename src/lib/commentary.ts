import type { WeatherData } from "./types";
import { getWeatherDescription } from "./weather";

// ============================================================
// Commentary engine — WEERZONE: Roddelpraat-stijl, brutaal, provocerend
// 48 uur. De rest is ruis.
// Kijkt naar CURRENT + komende uren + morgen voor slimme context
// ============================================================
export function getMainCommentary(w: WeatherData): string {
  const currentDesc = getWeatherDescription(w.current.weatherCode);
  const tomorrow = w.daily[1];
  const rainNext6h = w.hourly.slice(0, 6).reduce((acc, h) => acc + h.precipitation, 0).toFixed(1);
  
  let report = `Op dit moment is het ${currentDesc.toLowerCase()} in de omgeving. De thermometer wijst ${w.current.temperature}° aan, `;
  
  if (w.current.feelsLike < w.current.temperature - 2) {
    report += `maar door de wind voelt het aan als een schrale ${w.current.feelsLike}°. `;
  } else {
    report += `en dat voelt buiten ook daadwerkelijk zo aan. `;
  }

  if (w.current.precipitation > 0) {
    report += `Het regent momenteel aardig door met ${w.current.precipitation}mm nu. `;
  } else if (parseFloat(rainNext6h) > 0.5) {
    report += `Het is nu nog droog, maar houd rekening met zo'n ${rainNext6h}mm aan nattigheid in de komende uren. `;
  } else {
    report += `Voorlopig houden we het droog, dus daar hoef je je geen zorgen over te maken. `;
  }

  if (tomorrow) {
    report += `Morgen schakelen we over naar ${getWeatherDescription(tomorrow.weatherCode).toLowerCase()} met een maximumtemperatuur van rond de ${tomorrow.tempMax}°. `;
  }

  report += "Dit is de situatie zoals het KNMI het bevestigt. Geen ruis, gewoon de feiten.";
  
  return report;
}

export function getMisereScore(w: WeatherData): { score: number; label: string; emoji: string } {
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

  // Komende uren: verslechtering straft extra
  const rainNext3h = w.hourly.slice(0, 3).filter(h => h.precipitation > 0.5).length;
  if (rainNext3h >= 2) score += 1;

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
  const rainComing = w.hourly.slice(0, 6).some(h => h.precipitation > 0.5);

  if (t >= 25) {
    return { emoji: "🩳", advice: rain > 0 || rainComing ? "Kort broekje, maar regenjas in je tas. Je wordt nat vandaag." : "Kort en luchtig. Smeer je in — je huid vergeet niks." };
  }
  if (t >= 18) {
    return { emoji: "👕", advice: rain > 0 || rainComing ? "T-shirt, maar pak die regenjas. Vertrouw ons, niet Buienradar." : "T-shirt weer. Eindelijk. Duurt zelden lang in dit land." };
  }
  if (t >= 12) {
    return { emoji: "🧥", advice: `Jas mee. ${rainComing ? "Waterdicht." : "Licht jack is genoeg."} Je moeder had gelijk en dat weet je.` };
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

export function getKutweerScore(w: WeatherData): number {
  return getMisereScore(w).score;
}

const ROTATING_QUOTES = [
  "Buienradar gokt, wij rekenen. 48 uur messcherp met KNMI HARMONIE data. De rest is ruis.",
  "Morgen wordt het beter? Dat zeiden ze gisteren ook. Geloof die 14-daagse fantasie-apps niet blind.",
  "\"Kans op zon\" is de laffe uitweg van Weerplaza. Wij vertellen je gewoon de realiteit op de kilometer nauwkeurig.",
  "48 uur. Meer heb je niet nodig. Een 14-daagse voorspelling is commerciële clickbait voor de massa.",
  "Je weer-app zegt 22° volgende week? Trap er niet in. Puur bedrog om clicks te genereren.",
  "KNMI HARMONIE op volle sterkte. Eén brute waarheid. Geen gelul.",
  "14-daagse voorspelling? Dan kun je net zo goed je horoscoop of de krant van gisteren lezen.",
  "Weerplaza, NOS, Buienradar... Stuk voor stuk bezig met nattevingerwerk. Wij vertellen je de feiten.",
  "Jas-aan-jas-uit-jas-aan weer. Typisch Nederlands. Volkomen ruk, maar wij waarschuwen tenminste eerlijk.",
  "\"Lokaal een bui\" is meteorologen-taal voor: we hebben geen flauw idee. Wij wel.",
  "De gevestigde orde zit er weer naast? Logisch, die gebruiken achterhaalde data. Wij hebben de bron.",
  "WEERZONE liegt niet. Geen valse hoop, geen 'misschien'. Keiharde data over jouw eigen postzegel.",
  "Iedereen is meteoroloog totdat ze kletsnat op de fiets staan. Vertrouw op de radar, niet je onderbuik.",
  "Wij beloven niks. Behalve dat de komende 48 uur klopt. De rest is commerciële ruis.",
  "\"Lekker weertje\" zeggen terwijl het 12 graden is. Wij doen niet mee aan die massapsychose.",
  "De enige weerdienst die niet bang is om je de waarheid te vertellen. Geen poespas.",
  "Regen voorspeld? Dan regent het ook. De rest draait eromheen om je humeur niet te verpesten.",
  "Weerplaza zit qua voorspellingen dichter bij een waarzegster dan bij de realiteit.",
  "KNMI HARMONIE is de enige bron die telt voor Nederland. De rest is vulling.",
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
