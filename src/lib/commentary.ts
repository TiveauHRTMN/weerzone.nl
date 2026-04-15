import type { WeatherData } from "./types";

// ============================================================
// Commentary engine — WeerZone: Roddelpraat-stijl, brutaal, provocerend
// 48 uur. De rest is ruis.
// Kijkt naar CURRENT + komende uren + morgen voor slimme context
// ============================================================

export function getMainCommentary(w: WeatherData): string {
  const t = w.current.temperature;
  const rain = w.current.precipitation;
  const wind = w.current.windSpeed;
  const gusts = w.current.windGusts;
  const code = w.current.weatherCode;
  const feelsLike = w.current.feelsLike;
  const humidity = w.current.humidity;

  // Komende uren analyse
  const next6h = w.hourly.slice(0, 6);
  const next12h = w.hourly.slice(0, 12);
  const rainNext6h = next6h.filter(h => h.precipitation > 0.3);
  const rainNext12h = next12h.filter(h => h.precipitation > 0.3);
  const firstRainHour = next12h.find(h => h.precipitation > 0.3);
  const firstDryHour = rain > 0 ? next12h.find(h => h.precipitation === 0) : null;
  const maxTempToday = w.daily[0].tempMax;
  const minTempToday = w.daily[0].tempMin;
  const tempRange = maxTempToday - minTempToday;

  // Morgen
  const tomorrow = w.daily[1];
  const tomorrowDiff = tomorrow ? tomorrow.tempMax - maxTempToday : 0;
  const tomorrowRain = tomorrow?.precipitationSum ?? 0;

  // Onweer in de komende uren
  const thunderHours = next12h.filter(h => h.weatherCode >= 95);

  // ===== EXTREME SITUATIES =====

  // Zwaar onweer actief of op komst
  if (code >= 95) return "Onweer, bliksem, het hele circus. Ga naar binnen, weg bij ramen, en geniet van het drama. De modellen zagen dit uren geleden al.";
  if (thunderHours.length >= 3) {
    const firstT = new Date(thunderHours[0].time).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
    return `Onweer op komst vanaf ${firstT}. ${thunderHours.length} uur lang. Houd je telefoon geladen en je binnen. Andere apps waarschuwen je straks pas.`;
  }
  if (thunderHours.length > 0) {
    const firstT = new Date(thunderHours[0].time).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
    return `Rond ${firstT} kans op onweer. Niet paniekeren, maar ook niet onder een boom gaan staan. Even slim plannen.`;
  }

  // Storm
  if (wind > 60 || gusts > 90) return `Storm: ${wind} km/h met stoten tot ${gusts}. Alles wat niet vastzit waait weg. Jij ook als je niet oppast. Blijf binnen.`;
  if (wind > 40 || gusts > 65) return `Het waait stevig: ${wind} km/h, stoten tot ${gusts}. Je fiets ligt al in de sloot. Fietsen = gokken met je leven.`;

  // Sneeuw
  if (code >= 71 && code <= 77) return `Sneeuw! Over een kwartier staat heel Nederland op z'n gat. ${t}°, het blijft liggen. Geniet ervan of vloek erop, maar het is er.`;

  // Extreme hitte
  if (t >= 33) return `${t}° — tropisch alarm. Airco is geen luxe, het is overleving. Drink water, zoek schaduw. De 14-daagse-app van je buurman zag dit niet aankomen.`;
  if (t >= 30) return `${t}° en dat voelt als ${feelsLike}°. Nederland smelt. Smeer je in (UV!), drink genoeg, en laat die BBQ maar staan — je bent zelf al gaar.`;

  // Extreme kou
  if (t <= -8) return `${t}°. Poolkou. Leidingen beschermen, auto voorverwarmen, en onder geen beding die handschoenen vergeten. Dit is geen grapje.`;
  if (t <= -3) return `${t}° (voelt als ${feelsLike}°). Het vriest stevig. Gladheid op de weg, ijskrabber klaarzetten. Fietsers: roekeloos.`;
  if (t <= 0) return `Onder nul: ${t}°. Trek die handschoenen aan. ${tomorrow && tomorrowDiff > 3 ? `Morgen wordt het wél ${tomorrow.tempMax}°, nog even volhouden.` : "En het wordt er morgen niet beter op."}`;

  // Mist
  if (code >= 45 && code <= 48) return `Dikke mist. Zicht onder de 200 meter. Rij voorzichtig, doe je lichten aan, en vertrouw niet op je gevoel. ${rainNext6h.length > 0 ? "Plus: straks ook regen erbij. Geweldig." : ""}`;

  // ===== REGEN SITUATIES =====

  // Het regent NU
  if (rain > 5) {
    return `Het giet: ${rain}mm nu. ${firstDryHour ? `Droog venster rond ${new Date(firstDryHour.time).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })} — markeer het in je agenda.` : "Geen droog moment in zicht. Accepteer het."} Buienradar past z'n voorspelling nu pas aan.`;
  }
  if (rain > 1) {
    return `Regen: ${rain}mm op dit moment. ${firstDryHour ? `Het stopt rond ${new Date(firstDryHour.time).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}.` : "Blijft nog even aanhouden."} ${wind > 20 ? `Plus ${wind} km/h wind — paraplu is zinloos, regenjas verplicht.` : "Paraplu mee, geen discussie."}`;
  }
  if (rain > 0) {
    return `Motregen. ${feelsLike < t - 2 ? `Voelt als ${feelsLike}° door de wind.` : ""} ${firstDryHour ? "Het trekt zo weg." : "Blijft nog even hangen."} ${tomorrowRain === 0 ? "Morgen wél droog — hou vol." : ""}`.trim();
  }

  // Droog NU maar regen op komst
  if (firstRainHour && rainNext6h.length >= 2) {
    const rainTime = new Date(firstRainHour.time).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
    const totalMm = next12h.reduce((sum, h) => sum + h.precipitation, 0).toFixed(1);
    return `Nu droog, maar om ${rainTime} begint het. ${rainNext6h.length} uur regen verwacht (${totalMm}mm). ${t > 15 ? "Pak nu je kans om naar buiten te gaan." : "Paraplu meenemen, niet onderhandelen."}`;
  }
  if (firstRainHour) {
    const rainTime = new Date(firstRainHour.time).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
    return `Droog tot ${rainTime}, daarna een bui. ${w.daily[0].precipitationSum > 5 ? `Vandaag in totaal ${w.daily[0].precipitationSum}mm — dat merk je.` : "Valt mee qua hoeveelheid, maar je wordt er toch nat van."}`;
  }

  // ===== MOOI WEER =====

  // Echt prachtweer
  if (code <= 1 && t >= 20 && wind < 20 && rain === 0) {
    return `${t}° (voelt als ${feelsLike}°), strakblauwe lucht, amper wind. Telefoon weg, naar buiten. ${tomorrowRain > 2 ? `Morgen regent het (${tomorrowRain}mm) — dit is je kans.` : "Dit duurt zelden lang in Nederland."} De rest van Europa is jaloers.`;
  }
  if (code <= 2 && t >= 15 && wind < 25 && rain === 0) {
    const extraContext = tomorrowDiff <= -3
      ? `Morgen ${Math.abs(tomorrowDiff)}° kouder — geniet er vandaag van.`
      : tomorrowRain > 3
      ? `Morgen ${tomorrowRain}mm regen. Vandaag is de dag.`
      : "Niet spectaculair, maar echt genieten.";
    return `${t}°, ${code === 0 ? "onbewolkt" : "half bewolkt"}, wind ${wind} km/h. ${extraContext}`;
  }

  // Redelijk weer
  if (code <= 3 && t >= 10 && rain === 0) {
    if (tempRange >= 8) {
      return `${t}° nu, maar vanmiddag ${maxTempToday}°. Groot verschil — begin met een jas, strip af na de lunch. ${wind > 20 ? `Die ${wind} km/h wind maakt het frisser dan het lijkt.` : ""}`.trim();
    }
    if (humidity > 80) {
      return `${t}° maar ${humidity}% luchtvochtigheid — klammer dan het klinkt. Droog wél, dus zeuren mag niet. ${tomorrowRain > 0 ? "Morgen wordt het nat, vandaag is beter." : ""}`.trim();
    }
    if (feelsLike < t - 3) {
      return `${t}° op papier, maar voelt als ${feelsLike}° door de wind. Jas mee, ook al lijkt het fatsoenlijk weer.`;
    }
    return `${t}°, bewolkt, droog. Niet spectaculair, niet dramatisch. ${tomorrowDiff >= 3 ? `Morgen wél ${tomorrow.tempMax}° — dat wordt beter.` : tomorrowDiff <= -3 ? `Morgen ${Math.abs(tomorrowDiff)}° kouder — vandaag is de betere dag.` : "Gewoon een doorsnee dag. Maar wél met correcte data."} De 14-daagse voorspelling van je buurman is ondertussen alweer bijgesteld.`;
  }

  // ===== KOEL / GRIJS =====

  if (t < 5 && rain === 0) {
    return `${t}° (voelt als ${feelsLike}°). Koud, maar droog. ${wind > 20 ? `Die ${wind} km/h wind snijdt door alles heen.` : "Jas dicht, muts op."} ${tomorrowDiff >= 4 ? `Morgen wordt het ${tomorrow.tempMax}° — licht aan het einde van de tunnel.` : "Morgen niet veel beter. Sorry."}`;
  }
  if (t < 10) {
    return `${t}° in de buitenlucht. Fris. ${feelsLike < t - 2 ? `Voelt als ${feelsLike}° door de wind.` : ""} ${rain === 0 ? "In ieder geval droog." : ""} ${tomorrowDiff >= 3 ? `Goed nieuws: morgen ${tomorrow.tempMax}°.` : "Morgen vergelijkbaar."} Jas aan, niet onderhandelen.`.replace(/\s+/g, " ").trim();
  }

  // ===== DEFAULT =====
  return `${t}° in de lucht, voelt als ${feelsLike}°. ${code <= 3 ? "Bewolkt" : "Wisselend"}. ${wind > 20 ? `Wind ${wind} km/h — frisser dan je denkt.` : ""} ${rain === 0 ? "Droog." : `${rain}mm neerslag.`} ${tomorrowDiff >= 3 ? `Morgen stuk beter: ${tomorrow.tempMax}°.` : tomorrowDiff <= -3 ? `Morgen kouder: ${tomorrow.tempMax}°.` : "Morgen vergelijkbaar."} Twee weermodellen bevestigen dit.`.replace(/\s+/g, " ").trim();
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
  "Buienradar gokt, wij rekenen. 48 uur messcherp met HARMONIE, ICON en ICON-D2. De rest is koffiedik kijken.",
  "Morgen wordt het beter? Dat zeiden ze gisteren ook. Geloof die 14-daagse fantasie-apps niet blind.",
  "\"Kans op zon\" is de laffe uitweg van Weerplaza. Wij vertellen je gewoon de realiteit op de kilometer nauwkeurig.",
  "48 uur. Meer heb je niet nodig. Een 14-daagse voorspelling is commerciële clickbait voor de massa.",
  "Je weer-app zegt 22° volgende week? Trap er niet in. Puur bedrog om clicks te genereren.",
  "KNMI HARMONIE op volle sterkte. 2.5km resolutie. Eén brute waarheid. Geen gelul.",
  "14-daagse voorspelling? Dan kun je net zo goed je horoscoop of de krant van gisteren lezen.",
  "Weerplaza, NOS, Buienradar... Stuk voor stuk bezig met nattevingerwerk. Wij doen data.",
  "Jas-aan-jas-uit-jas-aan weer. Typisch Nederlands. Volkomen ruk, maar wij waarschuwen tenminste eerlijk.",
  "\"Lokaal een bui\" is meteorologen-taal voor: we hebben geen flauw idee. Wij wel.",
  "De gevestigde orde zit er weer naast? Logisch, die gebruiken achterhaalde modellen.",
  "WeerZone liegt niet. Geen valse hoop, geen 'misschien'. Keiharde data over jouw eigen postzegel.",
  "Iedereen is meteoroloog totdat ze kletsnat op de fiets staan. Vertrouw op de radar, niet je onderbuik.",
  "Wij beloven niks. Behalve dat de komende 48 uur klopt. De rest is commerciële ruis.",
  "\"Lekker weertje\" zeggen terwijl het 12 graden is. Wij doen niet mee aan die massapsychose.",
  "De enige weerdienst die niet bang is om je de waarheid te vertellen. Geen poespas.",
  "Regen voorspeld? Dan regent het ook. De rest draait eromheen om je humeur niet te verpesten.",
  "Weerplaza zit qua voorspellingen dichter bij een waarzegster dan bij de realiteit.",
  "Icon-D2 is ingeschakeld. We zien nu zelfs de individuele druppels in jouw straat aankomen.",
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
