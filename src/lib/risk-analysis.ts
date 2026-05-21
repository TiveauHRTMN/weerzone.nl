import type { HourlyForecast } from "./types";
import type { KNMIWarning } from "./knmi-warnings";

export interface RiskPeriod {
  startHour: string; // ISO string
  endHour: string; // ISO string
  peakHour: string; // ISO string
  maxThunderstormChance: number;
  maxRainChance: number;
  maxCape: number;
  minLiftedIndex: number;
  maxCin: number;
  maxPrecipitation: number;
  avgWindShear: number;
  narrative: string;
}

/**
 * Unieke rekenfunctie die de kans op onweer en regen voor een specifiek uur berekent.
 * Voorkomt tegenstrijdigheden (zoals onweerskans > regenkans of hoge onweerskans op een kurkdroge dag).
 */
export function calculateHourlyRisk(h: HourlyForecast, activeWarnings?: KNMIWarning[]): { thunderChance: number; rainChance: number } {
  const cape = h.cape || 0;
  const li = h.liftedIndex ?? 0;
  const cin = h.cin ?? 0;
  const dewPoint = h.dewPoint ?? 0;
  const code = h.weatherCode;
  const precip = h.precipitation || 0;

  // Check of er actieve waarschuwingen zijn voor dit specifieke uur
  const hTime = new Date(h.time).getTime();
  let hasActiveThunderWarning = false;
  let hasActiveRainWarning = false;

  if (activeWarnings) {
    for (const w of activeWarnings) {
      const from = w.validFrom ? new Date(w.validFrom).getTime() : 0;
      const until = w.validUntil ? new Date(w.validUntil).getTime() : Infinity;
      if (hTime >= from && hTime <= until) {
        const typeLower = w.type.toLowerCase();
        if (typeLower.includes("onweer")) {
          hasActiveThunderWarning = true;
        }
        if (typeLower.includes("regen") || typeLower.includes("water") || typeLower.includes("neerslag")) {
          hasActiveRainWarning = true;
        }
      }
    }
  }

  // 1. Basis regenkans berekenen
  let rainChance = 10; // Ambient base risk
  if (precip > 2.0) rainChance = 95;
  else if (precip > 0.5) rainChance = 85;
  else if (precip > 0.1) rainChance = 70;
  else if (precip > 0) rainChance = 50;
  else {
    // WMO Code fallback
    if ([95, 96, 99].includes(code)) rainChance = 90;
    else if ([80, 81, 82, 61, 63, 65, 67].includes(code)) rainChance = 80;
    else if ([51, 53, 55, 56, 57, 66].includes(code)) rainChance = 60;
    else if ([45, 48].includes(code)) rainChance = 20;
  }

  if (hasActiveRainWarning) {
    rainChance = Math.max(rainChance, 70);
  }

  // 2. Onweerskans berekenen
  let thunderChance = 0;
  const hasInstability = cape >= 50 || li < 0;
  const hasThunderCode = [95, 96, 99].includes(code);

  if (hasInstability || hasThunderCode || hasActiveThunderWarning) {
    // CAPE Bijdrage (max 45%)
    let capeScore = 0;
    if (cape > 1000) capeScore = 45;
    else if (cape > 500) capeScore = 30 + ((cape - 500) / 500) * 15;
    else if (cape > 100) capeScore = 10 + ((cape - 100) / 400) * 20;
    else capeScore = (cape / 100) * 10;

    // Lifted Index Bijdrage (max 35%)
    let liScore = 0;
    if (li <= -6) liScore = 35;
    else if (li <= -2) liScore = 20 + ((-2 - li) / 4) * 15;
    else if (li < 0) liScore = 5 + ((0 - li) / 2) * 15;

    // Dauwpunt Bijdrage (max 20%)
    let dpScore = 0;
    if (dewPoint >= 15) dpScore = 20;
    else if (dewPoint >= 10) dpScore = 5 + ((dewPoint - 10) / 5) * 15;
    else if (dewPoint >= 5) dpScore = (dewPoint / 10) * 5;

    const baseChance = capeScore + liScore + dpScore;

    // CIN Modifier (Snoeit de kans als de deksel te dik is)
    let cinModifier = 1.0;
    if (cin > 120) {
      cinModifier = 0.15;
    } else if (cin > 60) {
      cinModifier = 0.35;
    } else if (cin > 20) {
      cinModifier = 0.65;
    } else if (cin > 5) {
      cinModifier = 0.85;
    }

    let finalThunder = baseChance * cinModifier;

    // Trigger / Rain modifier
    const hasTrigger = precip > 0.1 || [80, 81, 82, 95, 96, 99].includes(code) || hasActiveThunderWarning;
    if (hasTrigger) {
      finalThunder = Math.min(100, finalThunder + 25);
    } else {
      // Dry profile modifier: als het model geen regen en droog weer berekent,
      // dan ontbreekt een duidelijke trigger om de energie vrij te laten.
      finalThunder = finalThunder * 0.25;
    }

    // WMO code minimums
    if ([95, 96, 99].includes(code)) {
      finalThunder = Math.max(finalThunder, 75);
    } else if ([80, 81, 82].includes(code)) {
      finalThunder = Math.max(finalThunder, 40);
    }

    // Actieve KNMI waarschuwing minimum
    if (hasActiveThunderWarning) {
      finalThunder = Math.max(finalThunder, 50);
    }

    thunderChance = Math.min(100, Math.max(0, Math.round(finalThunder)));
  }

  // 3. Fysische consistentie bewaren:
  // - Onweerskans kan nooit groter zijn dan regenkans (het regent altijd bij onweer)
  // - Als onweerskans door instabiliteit stijgt, stijgt de regenkans (warmtebuien) mee
  if (thunderChance > rainChance) {
    rainChance = thunderChance;
  }

  return { thunderChance, rainChance };
}

export function getThunderstormChance(h: HourlyForecast, activeWarnings?: KNMIWarning[]): number {
  return calculateHourlyRisk(h, activeWarnings).thunderChance;
}

export function getRainChance(h: HourlyForecast, activeWarnings?: KNMIWarning[]): number {
  return calculateHourlyRisk(h, activeWarnings).rainChance;
}

/**
 * Groepeert de komende 48 uur in opeenvolgende periodes met verhoogd weer-risico.
 */
export function groupRiskPeriods(hourly: HourlyForecast[], activeWarnings?: KNMIWarning[]): RiskPeriod[] {
  const risks = hourly.map(h => ({
    hour: h,
    thunderChance: getThunderstormChance(h, activeWarnings),
    rainChance: getRainChance(h, activeWarnings),
  }));

  const periods: RiskPeriod[] = [];
  let currentGroup: typeof risks = [];
  let gapCounter = 0;

  for (const r of risks) {
    const isRiskHour = r.thunderChance >= 15 || r.rainChance >= 40 || (r.hour.precipitation || 0) > 0;

    if (isRiskHour) {
      currentGroup.push(r);
      gapCounter = 0; // reset gap
    } else {
      if (currentGroup.length > 0) {
        if (gapCounter < 2) {
          // Voeg toe aan huidige groep om een tijdelijke dip te overbruggen
          currentGroup.push(r);
          gapCounter++;
        } else {
          // Sluit de groep en verwijder de laatste 'gap' uren
          const validGroup = currentGroup.slice(0, currentGroup.length - gapCounter);
          if (validGroup.length > 0) {
            periods.push(buildRiskPeriod(validGroup));
          }
          currentGroup = [];
          gapCounter = 0;
        }
      }
    }
  }

  // Restgroep verwerken
  if (currentGroup.length > 0) {
    const validGroup = gapCounter > 0 ? currentGroup.slice(0, currentGroup.length - gapCounter) : currentGroup;
    if (validGroup.length > 0) {
      periods.push(buildRiskPeriod(validGroup));
    }
  }

  // Filter uitgesproken lage risicoblokken eruit om ruis te voorkomen
  return periods.filter(p => p.maxThunderstormChance >= 20 || p.maxRainChance >= 50 || p.maxPrecipitation > 0.2);
}

function buildRiskPeriod(group: { hour: HourlyForecast; thunderChance: number; rainChance: number }[]): RiskPeriod {
  const startHour = group[0].hour.time;
  const endHour = group[group.length - 1].hour.time;

  let maxThunder = 0;
  let maxRain = 0;
  let maxCape = 0;
  let minLI = 99;
  let maxCin = 0;
  let maxPrecip = 0;
  let totalShear = 0;
  let shearCount = 0;
  let peakHour = group[0].hour.time;

  for (const item of group) {
    if (item.thunderChance > maxThunder) {
      maxThunder = item.thunderChance;
      peakHour = item.hour.time;
    }
    if (item.rainChance > maxRain) {
      maxRain = item.rainChance;
      if (maxThunder === 0) peakHour = item.hour.time;
    }
    if (item.hour.cape > maxCape) maxCape = item.hour.cape;
    if (item.hour.liftedIndex !== undefined && item.hour.liftedIndex < minLI) minLI = item.hour.liftedIndex;
    if (item.hour.cin !== undefined && item.hour.cin > maxCin) maxCin = item.hour.cin;
    if (item.hour.precipitation > maxPrecip) maxPrecip = item.hour.precipitation;
    if (item.hour.windShear !== undefined) {
      totalShear += item.hour.windShear;
      shearCount++;
    }
  }

  const avgShear = shearCount > 0 ? Math.round(totalShear / shearCount) : 0;
  const minLiftedIndexResolved = minLI === 99 ? 0 : minLI;

  // Genereer narratief
  let narrative = "";
  if (maxThunder >= 30) {
    narrative += `**Onweersdreiging:** Met een maximale energie (CAPE) van ${Math.round(maxCape)} J/kg en een atmosferische stabiliteit (Lifted Index) van ${minLiftedIndexResolved}°C is de lucht erg onstabiel. `;
    
    // CIN / Deksel invloed
    if (maxCin > 85) {
      narrative += "Er is echter sprake van een **zeer stevige deksel (CIN)**. Dit houdt de buien in eerste instantie tegen. Mocht de grondtemperatuur voldoende oplopen of passeert er een front, dan breekt de deksel door en kan er direct zwaar onweer ontstaan. ";
    } else if (maxCin > 30) {
      narrative += "De **deksel (CIN) is matig sterk**, wat betekent dat buien een duidelijke trigger nodig hebben (zoals windvlagen of botsende luchtstromen) om los te breken. ";
    } else {
      narrative += "De **deksel (CIN) is nagenoeg afwezig**. Buien kunnen ongehinderd en snel naar grote hoogte schieten zodra de zon de grond verwarmt. ";
    }

    // Shear / Organisatie invloed
    if (avgShear >= 35) {
      narrative += `De windschering is fors (${avgShear} km/h). Dit helpt buien te organiseren in grotere complexen of buienlijnen, wat de kans op **hagel en zware windstoten** vergroot.`;
    } else if (avgShear < 15) {
      narrative += `De windschering is erg zwak (${avgShear} km/h). Eventuele buien zijn losstaand (pulse storms). Ze verplaatsen zich traag, waardoor er **lokaal erg veel regen** in korte tijd kan vallen, waarna de bui door zijn eigen gewicht snel ineenstort.`;
    } else {
      narrative += "De buien kunnen zich matig organiseren, met lokaal kans op hagel en onweersklappen.";
    }
  } else {
    // Regen focus
    if (maxPrecip > 5.0) {
      narrative += `**Zware neerslag:** Er trekt een actieve buienzone over met piekhoeveelheden tot ${maxPrecip.toFixed(1)} mm per uur. Dit kan lokaal leiden tot wateroverlast op straten en in kelders.`;
    } else if (maxPrecip > 1.5) {
      narrative += `**Stevige regen:** Er valt gedurende deze periode geregeld regen, met pieken tot ${maxPrecip.toFixed(1)} mm per uur. Houd rekening met matig zicht in het verkeer.`;
    } else {
      narrative += `**Lichte regen/buien:** Er passeren enkele lichtere buien of regenzones met in totaal beperkte neerslag. Geen extreme weersituaties verwacht.`;
    }
  }

  return {
    startHour,
    endHour,
    peakHour,
    maxThunderstormChance: maxThunder,
    maxRainChance: maxRain,
    maxCape,
    minLiftedIndex: minLiftedIndexResolved,
    maxCin,
    maxPrecipitation: maxPrecip,
    avgWindShear: avgShear,
    narrative,
  };
}
