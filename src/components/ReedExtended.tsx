"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Clock, Layers, MapPin, ShieldAlert, Thermometer, Zap } from "lucide-react";
import { loadWeather, loadWWS } from "@/lib/weatherCache";
import {
  DUTCH_CITIES,
  FRENCH_CITIES,
  GERMAN_CITIES,
  reverseGeocode,
  type City,
  type WeatherData,
  type WWSPayload,
} from "@/lib/types";
import type { KNMIWarningEnriched } from "@/lib/knmi-warnings";
import { persistCity } from "@/lib/persist-city";
import LightningMap from "@/components/LightningMap";
import { groupRiskPeriods, type RiskPeriod } from "@/lib/risk-analysis";

type Locale = "nl" | "de" | "fr" | "es";
type ExpertHour = WeatherData["hourly"][number] & {
  cin?: number;
  dewPoint?: number;
  liftedIndex?: number;
  windShear?: number;
  windGusts?: number;
  cloudCover?: number;
};

const MADRID: City = { name: "Madrid", lat: 40.4168, lon: -3.7038 };

const COPY = {
  nl: {
    currentLocation: "Jouw locatie",
    locating: "Locatie bepalen...",
    loading: "We kijken wat er op je afkomt...",
    warnings: "Officiele Waarschuwingen",
    red: "Code Rood",
    orange: "Code Oranje",
    yellow: "Code Geel",
    lightning: "Live Bliksem",
    important: "BELANGRIJK BERICHT",
    mustKnow: "Wat je moet weten",
    dashboard: "Dashboard",
    dateLocale: "nl-NL",
  },
  de: {
    currentLocation: "Dein Standort",
    locating: "Standort wird ermittelt...",
    loading: "Wir prufen, was auf dich zukommt...",
    warnings: "Offizielle Wetterwarnungen (DWD/KNMI)",
    red: "Warnstufe Rot",
    orange: "Warnstufe Orange",
    yellow: "Warnstufe Gelb",
    lightning: "Live Blitze",
    important: "WICHTIGE MELDUNG",
    mustKnow: "Was du wissen musst",
    dashboard: "Dashboard",
    dateLocale: "de-DE",
  },
  fr: {
    currentLocation: "Votre position",
    locating: "Localisation en cours...",
    loading: "Nous verifions ce qui vous attend...",
    warnings: "Avertissements officiels",
    red: "Alerte Rouge",
    orange: "Alerte Orange",
    yellow: "Alerte Jaune",
    lightning: "Foudre en direct",
    important: "MESSAGE IMPORTANT",
    mustKnow: "Ce qu'il faut savoir",
    dashboard: "Tableau de bord",
    dateLocale: "fr-FR",
  },
  es: {
    currentLocation: "Tu ubicacion",
    locating: "Buscando ubicacion...",
    loading: "Comprobamos lo que se acerca...",
    warnings: "Avisos oficiales (AEMET)",
    red: "Alerta Roja",
    orange: "Alerta Naranja",
    yellow: "Alerta Amarilla",
    lightning: "Rayos en vivo",
    important: "AVISO IMPORTANTE",
    mustKnow: "Lo que debes saber",
    dashboard: "Panel",
    dateLocale: "es-ES",
  },
} as const;

function getSavedCity(): City | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem("wz_city");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.name && typeof parsed.lat === "number" && typeof parsed.lon === "number") {
        return { name: parsed.name, lat: parsed.lat, lon: parsed.lon };
      }
    }
  } catch {}
  return null;
}

function getDefaultCity(locale: Locale): City {
  if (locale === "es") return MADRID;
  if (locale === "fr") return FRENCH_CITIES[0];
  if (locale === "de") return GERMAN_CITIES[0];
  return DUTCH_CITIES.find((city) => city.name === "De Bilt") || DUTCH_CITIES[0];
}

function formatPeriodRange(start: string, end: string, dateLocale: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  
  const startDay = startDate.toLocaleDateString(dateLocale, { weekday: "long" });
  const endDay = endDate.toLocaleDateString(dateLocale, { weekday: "long" });
  
  const startHM = startDate.toLocaleTimeString(dateLocale, { hour: "2-digit", minute: "2-digit" });
  const endHM = endDate.toLocaleTimeString(dateLocale, { hour: "2-digit", minute: "2-digit" });

  if (startDate.getTime() === endDate.getTime()) {
    const capitalizedDay = startDay.charAt(0).toUpperCase() + startDay.slice(1);
    return `${capitalizedDay} rond ${startHM}`;
  }
  
  if (startDay === endDay) {
    const capitalizedDay = startDay.charAt(0).toUpperCase() + startDay.slice(1);
    return `${capitalizedDay} van ${startHM} tot ${endHM}`;
  } else {
    const capitalizedStartDay = startDay.charAt(0).toUpperCase() + startDay.slice(1);
    const capitalizedEndDay = endDay.charAt(0).toUpperCase() + endDay.slice(1);
    return `${capitalizedStartDay} ${startHM} tot ${capitalizedEndDay} ${endHM}`;
  }
}

function getRiskTone(period: RiskPeriod) {
  if (period.maxThunderstormChance >= 70 || period.maxPrecipitation >= 5) {
    return {
      label: "Hoog risico",
      accent: "text-rose-600 dark:text-rose-400",
      border: "border-rose-500/25",
      bg: "bg-rose-500/5",
      bar: "bg-rose-500",
    };
  }
  if (period.maxThunderstormChance >= 30 || period.maxRainChance >= 70 || period.maxPrecipitation >= 1.5) {
    return {
      label: "Verhoogde buienkans",
      accent: "text-orange-600 dark:text-orange-400",
      border: "border-orange-500/25",
      bg: "bg-orange-500/5",
      bar: "bg-orange-500",
    };
  }
  return {
    label: "Laag risico",
    accent: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/20",
    bg: "bg-amber-500/5",
    bar: "bg-amber-500",
  };
}

function getExpertVerdict(period: RiskPeriod): string {
  if (period.maxThunderstormChance >= 60) return "Onweer mogelijk, lokaal intens";
  if (period.maxThunderstormChance >= 30) return "Enkele ontladingen mogelijk";
  if (period.maxPrecipitation >= 5) return "Signaal voor felle buiencel";
  if (period.maxRainChance >= 60) return "Zwak convectief signaal";
  return "Geen duidelijk extreem";
}

function getImpactSummary(period: RiskPeriod): string {
  if (period.maxThunderstormChance >= 60 && period.maxPrecipitation >= 5) {
    return "Reken op stevige buien met kans op onweer en lokaal een felle cel in korte tijd.";
  }
  if (period.maxThunderstormChance >= 30) {
    return "Een enkele ontlading kan, maar er is geen duidelijk signaal voor georganiseerd zwaar onweer.";
  }
  if (period.maxRainChance >= 70) {
    return "Een bui of passerende zone is waarschijnlijk. De intensiteit blijft volgens het model beperkt.";
  }
  return "Het signaal is zwak en lokaal. Buiten dit tijdvak is er weinig aanleiding voor extra weerimpact.";
}

function getSetupSummary(period: RiskPeriod): string {
  const energy =
    period.maxCape >= 1000 ? "veel energie" :
    period.maxCape >= 500 ? "matige energie" :
    "weinig energie";
  const cap =
    period.maxCin > 85 ? "een stevige rem" :
    period.maxCin > 30 ? "een matige rem" :
    "weinig remming";
  const organisation =
    period.avgWindShear >= 35 ? "buien kunnen zich organiseren" :
    period.avgWindShear >= 15 ? "organisatie is beperkt" :
    "buien blijven waarschijnlijk losstaand";

  return `Het model ziet ${energy}, ${cap} en ${organisation}. Daarom is de kans op buien duidelijker dan de kans op zwaar onweer.`;
}

function getStormMode(period: RiskPeriod): { label: string; detail: string } {
  if (period.avgWindShear >= 45 && period.maxCape >= 800) {
    return {
      label: "Georganiseerde stormen",
      detail: "Combinatie van energie en schering ondersteunt multicells of lijnvorming.",
    };
  }
  if (period.avgWindShear >= 25) {
    return {
      label: "Beperkt georganiseerd",
      detail: "Buien kunnen clusteren, maar zware organisatie is niet dominant.",
    };
  }
  if (period.maxCape >= 100) {
    return {
      label: "Pulsebuien",
      detail: "Losstaande, kortlevende buien met lokaal felle cel mogelijk.",
    };
  }
  return {
    label: "Geen stormmodus",
    detail: "Te weinig energie of organisatie voor actief onweer.",
  };
}

function formatPeakTime(iso: string, dateLocale: string): string {
  return new Date(iso).toLocaleString(dateLocale, { weekday: "short", hour: "2-digit", minute: "2-digit" });
}

function formatHourShort(iso: string, dateLocale: string): string {
  return new Date(iso).toLocaleTimeString(dateLocale, { hour: "2-digit", minute: "2-digit" });
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function definedNumbers(values: Array<number | undefined | null>): number[] {
  return values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
}

function getPeriodHours(hourly: WeatherData["hourly"], period: RiskPeriod): ExpertHour[] {
  const start = new Date(period.startHour).getTime();
  const end = new Date(period.endHour).getTime();
  return (hourly as ExpertHour[]).filter((hour) => {
    const time = new Date(hour.time).getTime();
    return Number.isFinite(time) && time >= start && time <= end;
  });
}

function getModelSpread(hours: ExpertHour[], field: "precipitation" | "windSpeed") {
  const values: number[] = [];
  hours.forEach((hour) => {
    Object.values(hour.models ?? {}).forEach((model) => {
      const value = model?.[field];
      if (typeof value === "number" && Number.isFinite(value)) values.push(value);
    });
  });

  if (values.length === 0) return null;
  return {
    min: round1(Math.min(...values)),
    max: round1(Math.max(...values)),
    count: values.length,
  };
}

function getModelCount(hours: ExpertHour[]): number {
  const models = new Set<string>();
  hours.forEach((hour) => {
    Object.entries(hour.models ?? {}).forEach(([name, value]) => {
      if (value) models.add(name);
    });
  });
  return models.size;
}

function getModelLabel(key: string): string {
  const labels: Record<string, string> = {
    harmonie: "HARMONIE",
    icon: "ICON",
    arome: "AROME",
    ecmwf: "ECMWF",
    gfs: "GFS",
    aifs: "AIFS",
    google: "Google",
  };
  return labels[key] ?? key.replace(/[_-]/g, " ").toUpperCase();
}

function getModelCards(hours: ExpertHour[]) {
  const bucket = new Map<string, Array<{ temperature: number; precipitation: number; weatherCode: number; windSpeed: number }>>();

  hours.forEach((hour) => {
    Object.entries(hour.models ?? {}).forEach(([key, model]) => {
      if (!model) return;
      const rows = bucket.get(key) ?? [];
      rows.push(model);
      bucket.set(key, rows);
    });
  });

  if (bucket.size === 0 && hours.length > 0) {
    bucket.set("lead", hours.map((hour) => ({
      temperature: hour.temperature,
      precipitation: hour.precipitation,
      weatherCode: hour.weatherCode,
      windSpeed: hour.windSpeed,
    })));
  }

  return Array.from(bucket.entries()).map(([key, rows]) => {
    const precipitation = rows.map((row) => row.precipitation || 0);
    const wind = rows.map((row) => row.windSpeed || 0);
    const temps = rows.map((row) => row.temperature);
    return {
      key,
      label: key === "lead" ? "Leidend model" : getModelLabel(key),
      totalPrecip: round1(precipitation.reduce((sum, value) => sum + value, 0)),
      peakPrecip: round1(Math.max(0, ...precipitation)),
      peakWind: Math.round(Math.max(0, ...wind)),
      minTemp: Math.round(Math.min(...temps)),
      maxTemp: Math.round(Math.max(...temps)),
      thunderHours: rows.filter((row) => [95, 96, 99].includes(row.weatherCode)).length,
      showerHours: rows.filter((row) => [80, 81, 82].includes(row.weatherCode)).length,
    };
  });
}

function getExpertMetrics(period: RiskPeriod, hours: ExpertHour[]) {
  const scopedHours = hours.length > 0 ? hours : [];
  const precipitation = scopedHours.map((hour) => hour.precipitation || 0);
  const wind = scopedHours.map((hour) => hour.windSpeed || 0);
  const cape = scopedHours.map((hour) => hour.cape || 0);
  const cin = definedNumbers(scopedHours.map((hour) => hour.cin));
  const dewPoint = definedNumbers(scopedHours.map((hour) => hour.dewPoint));
  const liftedIndex = definedNumbers(scopedHours.map((hour) => hour.liftedIndex));
  const shear = definedNumbers(scopedHours.map((hour) => hour.windShear));
  const temps = scopedHours.map((hour) => hour.temperature);
  const precipSpread = getModelSpread(scopedHours, "precipitation");
  const windSpread = getModelSpread(scopedHours, "windSpeed");

  return {
    durationHours: Math.max(1, scopedHours.length),
    totalPrecip: round1(precipitation.reduce((sum, value) => sum + value, 0)),
    wetHours: precipitation.filter((value) => value >= 0.1).length,
    heavyRainHours: precipitation.filter((value) => value >= 2).length,
    peakWind: Math.round(Math.max(0, ...wind)),
    avgWind: Math.round(average(wind) ?? 0),
    avgCape: Math.round(average(cape) ?? period.maxCape),
    maxDewPoint: dewPoint.length ? Math.round(Math.max(...dewPoint)) : null,
    minLiftedIndex: liftedIndex.length ? Math.round(Math.min(...liftedIndex)) : period.minLiftedIndex,
    maxCin: cin.length ? Math.round(Math.max(...cin)) : Math.round(period.maxCin),
    maxShear: shear.length ? Math.round(Math.max(...shear)) : period.avgWindShear,
    avgShear: shear.length ? Math.round(average(shear) ?? 0) : period.avgWindShear,
    minTemp: temps.length ? Math.round(Math.min(...temps)) : null,
    maxTemp: temps.length ? Math.round(Math.max(...temps)) : null,
    thunderCodeHours: scopedHours.filter((hour) => [95, 96, 99].includes(hour.weatherCode)).length,
    showerCodeHours: scopedHours.filter((hour) => [80, 81, 82].includes(hour.weatherCode)).length,
    modelCount: getModelCount(scopedHours),
    modelCards: getModelCards(scopedHours),
    precipSpread,
    windSpread,
    timeline: scopedHours.slice(0, 8),
  };
}

function ExpertMetric({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-black/5 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
      <p className="text-[10px] font-black uppercase tracking-wider text-text-muted">{label}</p>
      <p className="mt-1 break-words text-sm font-black leading-tight text-text-primary">{value}</p>
      {detail && <p className="mt-1 text-[11px] leading-snug text-text-secondary">{detail}</p>}
    </div>
  );
}

function ExpertRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-black/5 py-2 first:border-t-0 dark:border-white/10">
      <span className="text-xs font-bold text-text-secondary">{label}</span>
      <span className="text-sm font-black text-text-primary">{value}</span>
    </div>
  );
}

function getCapeDescription(cape: number, dewPoint: number | undefined, locale: Locale): string {
  if (cape === 0) {
    if (locale === "de") return "Stabil: Keine direkte Energie (CAPE: 0) an diesem Standort berechnet. Gewitter können jedoch von anderswo hereinziehen.";
    if (locale === "fr") return "Stable : Aucune énergie directe (CAPE : 0) calculée à cet endroit. Cependant, des orages peuvent arriver d'ailleurs.";
    if (locale === "es") return "Estable: Sin energía directa (CAPE: 0) calculada en esta ubicación. Sin embargo, las tormentas pueden entrar desde otros lugares.";
    return "Stabiel: Geen directe energie (CAPE: 0) berekend op deze locatie. Onweersbuien kunnen echter van elders binnentrekken.";
  }
  if (cape > 1000) {
    const dpStr = dewPoint !== undefined ? `${dewPoint}°C` : (locale === "de" ? "hoch" : locale === "fr" ? "élevé" : locale === "es" ? "alto" : "hoog");
    if (locale === "de") return `Sehr instabil: Schwüle Luft (Taupunkt ${dpStr}). Viel Energie für schwere Gewitter.`;
    if (locale === "fr") return `Très instable : Air lourd (point de rosée ${dpStr}). Beaucoup d'énergie pour des orages violents.`;
    if (locale === "es") return `Muy inestable: Aire bochornoso (punto de rocío ${dpStr}). Mucha energía para tormentas fuertes.`;
    return `Zeer onstabiel: Broeierige lucht (dauwpunt ${dpStr}). Veel energie voor zwaar onweer.`;
  }
  if (cape > 500) {
    if (locale === "de") return "Mäßig instabil: Ausreichend Energie für aktive Schauer mit Blitzgefahr.";
    if (locale === "fr") return "Modérément instable : Assez d'énergie pour des averses actives avec risque de foudre.";
    if (locale === "es") return "Moderadamente inestable: Energía suficiente para chubascos activos con probabilidad de rayos.";
    return "Matig onstabiel: Voldoende energie voor actieve buien met kans op ontladingen.";
  }
  if (locale === "de") return "Leichte Instabilität: Begrenzte Energie; Blitze sind möglich, aber wahrscheinlich schwach.";
  if (locale === "fr") return "Faible instabilité : Énergie limitée ; les éclairs sont possibles mais probablement faibles.";
  if (locale === "es") return "Ligera inestabilidad: Energía limitada; los rayos son posibles pero probablemente débiles.";
  return "Lichte onstabiliteit: Beperkte energie; ontladingen zijn mogelijk maar waarschijnlijk zwak.";
}

function getCinDescription(cin: number, locale: Locale): string {
  if (cin > 100) {
    if (locale === "de") return "Starke Dämpfung: Hoher Deckel unterdrückt Schauerbildung. Große Chance, dass es trocken bleibt, außer bei einem starken Trigger.";
    if (locale === "fr") return "Forte inhibition : Un couvercle solide empêche la formation d'averses. Forte probabilité de temps sec, sauf déclencheur puissant.";
    if (locale === "es") return "Fuerte inhibición: Una tapa alta suprime la formación de tormentas. Gran probabilidad de que permanezca seco, salvo un activador fuerte.";
    return "Sterke rem: Hoge deksel onderdrukt buienvorming. Grote kans dat het droog blijft, tenzij er een sterke trigger komt.";
  }
  if (cin > 30) {
    if (locale === "de") return "Mäßiger Deckel: Schauer benötigen einen klaren Trigger (wie Böen oder eine Kaltfront), um durchzubrechen.";
    if (locale === "fr") return "Inhibition modérée : Les averses ont besoin d'un déclencheur clair (comme des rafales ou un front froid) pour éclater.";
    if (locale === "es") return "Inhibición moderada: Las tormentas necesitan un activador claro (como rachas o un frente frío) para romper.";
    return "Matige deksel: Buien hebben een duidelijke trigger nodig (zoals windvlagen of een koufront) om door te breken.";
  }
  if (locale === "de") return "Kein Deckel: Schauer können ungehindert und schnell entstehen, sobald die Sonne den Boden erwärmt.";
  if (locale === "fr") return "Pas d'inhibition : Les averses peuvent se former rapidement et sans obstacle dès que le soleil réchauffe le sol.";
  if (locale === "es") return "Sin inhibición: Las tormentas pueden desarrollarse libremente tan pronto como el sol caliente el suelo.";
  return "Geen deksel: Buien kunnen ongehinderd en snel ontstaan zodra de zon de grond opwarmt.";
}

function getWindShearDescription(shear: number, locale: Locale): string {
  if (shear >= 35) {
    if (locale === "de") return "Organisierte Stürme: Starke Windscherung. Gefahr von größerem Hagel und schweren Sturmböen durch organisierte Gewitterlinien.";
    if (locale === "fr") return "Orages organisés : Fort cisaillement du vent. Risque de grêle importante et de fortes rafales sous des lignes de grains.";
    if (locale === "es") return "Tormentas organizadas: Fuerte cizalladura del viento. Riesgo de granizo grande y rachas fuertes debido a líneas de tormenta organizadas.";
    return "Georganiseerde stormen: Sterke schering. Kans op grotere hagel en zware uitschieters door georganiseerde buienlijnen.";
  }
  if (locale === "de") return "Einzelne Schauer: Schwache Windscherung. Schauer sind kurzlebig und fallen schnell durch eigenen Niederschlag in sich zusammen.";
  if (locale === "fr") return "Averses isolées : Faible cisaillement. Les averses sont de courte durée et s'effondrent rapidement sous leur propre pluie.";
  if (locale === "es") return "Tormentas aisladas: Cizalladura débil. Las tormentas son de corta duración y se colapsan rápidamente debido a su propia lluvia.";
  return "Losstaande buien: Zwakke schering. Buien zijn kortstondig en vallen snel terug in hun eigen neerslaggebied.";
}

function getLiftedIndexDescription(li: number, locale: Locale): string {
  if (li <= -6) {
    if (locale === "de") return "Extrem instabil: Sehr starke Aufwinde möglich. Gefahr schwerer Gewitter mit Hagel und Sturmböen.";
    if (locale === "fr") return "Extrêmement instable : Très forts courants ascendants possibles. Risque d'orages violents avec grêle et rafales.";
    if (locale === "es") return "Extremadamente inestable: Posibles corrientes ascendentes muy fuertes. Riesgo de tormentas severas con granizo y rachas.";
    return "Extreem onstabiel: Zeer sterke stijgstromen mogelijk. Kans op zware onweersbuien met hagel en windstoten.";
  }
  if (li < 0) {
    if (locale === "de") return "Instabil: Atmosphäre ist anfällig für Schauer- und Gewitterbildung.";
    if (locale === "fr") return "Instable : L'atmosphère est propice au développement d'averses et d'orages.";
    if (locale === "es") return "Inestable: La atmósfera es propicia para la formación de chubascos y tormentas.";
    return "Onstabiel: Atmosfeer is gevoelig voor buienvorming en onweer.";
  }
  if (locale === "de") return "Stabil: Warme Luft steigt nicht leicht auf. Die Wahrscheinlichkeit aktiver Gewitter ist gering.";
  if (locale === "fr") return "Stable : L'air chaud ne s'élève pas facilement. La probabilité d'orages actifs est faible.";
  if (locale === "es") return "Estable: El aire cálido no asciende fácilmente. La probabilidad de tormentas activas es baja.";
  return "Stabiel: Warme lucht stijgt niet makkelijk op. De kans op actieve onweersbuien is klein.";
}

interface ReedProps {
  initialWeather?: WeatherData | null;
  initialCity?: City;
  locale?: Locale;
  includeExternalAiWeather?: boolean;
}

export default function ReedExtended({ initialWeather, initialCity, locale = "nl", includeExternalAiWeather = false }: ReedProps) {
  const copy = COPY[locale];
  const [city, setCity] = useState<City>(() => initialCity || getSavedCity() || getDefaultCity(locale));
  const [weather, setWeather] = useState<WeatherData | null>(initialWeather || null);
  const [wws, setWWS] = useState<WWSPayload | null>(null);
  const [knmiWarnings, setKnmiWarnings] = useState<KNMIWarningEnriched[]>([]);
  const [loading, setLoading] = useState(!initialWeather);
  const [locating, setLocating] = useState(false);
  const [expertMode, setExpertMode] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!weather) setLoading(true);

    fetch(`/api/knmi-warnings?lat=${city.lat}&lon=${city.lon}&enrich=1`)
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled) setKnmiWarnings(data.warnings ?? []);
      })
      .catch(() => {});

    loadWeather(city.lat, city.lon, () => {}, (fresh) => {
      if (!cancelled) {
        setWeather(fresh);
        setLoading(false);
      }
    }, undefined, true, locale, includeExternalAiWeather)
      .then((nextWeather) => {
        if (cancelled) return;
        setWeather(nextWeather);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    loadWWS(city.lat, city.lon)
      .then((wwsPayload) => {
        if (!cancelled) setWWS(wwsPayload);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [city, includeExternalAiWeather, locale]);

  const locate = () => {
    if (!("geolocation" in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        const provisionalCity: City = { name: copy.currentLocation, lat, lon };
        setCity(provisionalCity);
        persistCity(provisionalCity);
        setLocating(false);
        reverseGeocode(lat, lon, locale)
          .then((resolvedCity) => {
            setCity(resolvedCity);
            persistCity(resolvedCity);
            window.location.reload();
          })
          .catch(() => {
            window.location.reload();
          });
      },
      () => setLocating(false),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60 * 60 * 1000 },
    );
  };

  const fmtTime = (iso: string | null) => {
    if (!iso) return "-";
    const date = new Date(iso);
    return date.toLocaleString(copy.dateLocale, { weekday: "short", hour: "2-digit", minute: "2-digit" });
  };

  // Compute 48-hour atmospheric parameters from weather.hourly
  let enriched48 = {
    capeMaxJkg: 0,
    precipitationPeakMm: 0,
    precipitationPeakHour: null as string | null,
    precipitationTotalMm: 0,
    windPeakKmh: 0,
    windPeakHour: null as string | null,
    cinMaxJkg: undefined as number | undefined,
    dewPointMaxC: undefined as number | undefined,
    windShearMaxKmh: undefined as number | undefined,
    liftedIndexMinC: undefined as number | undefined,
  };

  if (weather && weather.hourly) {
    const hourlyLimit = weather.hourly.slice(0, 48);
    let capeMax = 0;
    let precipTotal = 0;
    let precipPeak = 0;
    let precipPeakHour: string | null = null;
    let windPeak = 0;
    let windPeakHour: string | null = null;
    let cinMax: number | undefined = undefined;
    let dewPointMax: number | undefined = undefined;
    let windShearMax: number | undefined = undefined;
    let liftedIndexMin: number | undefined = undefined;

    hourlyLimit.forEach((h) => {
      if (h.cape > capeMax) capeMax = h.cape;
      precipTotal += h.precipitation || 0;
      if (h.precipitation > precipPeak) {
        precipPeak = h.precipitation;
        precipPeakHour = h.time;
      }
      if (h.windSpeed > windPeak) {
        windPeak = h.windSpeed;
        windPeakHour = h.time;
      }
      if (h.cin !== undefined && h.cin !== null) {
        if (cinMax === undefined || h.cin > cinMax) cinMax = h.cin;
      }
      if (h.dewPoint !== undefined && h.dewPoint !== null) {
        if (dewPointMax === undefined || h.dewPoint > dewPointMax) dewPointMax = h.dewPoint;
      }
      if (h.windShear !== undefined && h.windShear !== null) {
        if (windShearMax === undefined || h.windShear > windShearMax) windShearMax = h.windShear;
      }
      if (h.liftedIndex !== undefined && h.liftedIndex !== null) {
        if (liftedIndexMin === undefined || h.liftedIndex < liftedIndexMin) liftedIndexMin = h.liftedIndex;
      }
    });

    enriched48 = {
      capeMaxJkg: Math.round(capeMax),
      precipitationPeakMm: Math.round(precipPeak * 10) / 10,
      precipitationPeakHour: precipPeakHour,
      precipitationTotalMm: Math.round(precipTotal * 10) / 10,
      windPeakKmh: Math.round(windPeak),
      windPeakHour,
      cinMaxJkg: cinMax !== undefined ? Math.round(cinMax) : undefined,
      dewPointMaxC: dewPointMax !== undefined ? Math.round(dewPointMax) : undefined,
      windShearMaxKmh: windShearMax !== undefined ? Math.round(windShearMax) : undefined,
      liftedIndexMinC: liftedIndexMin !== undefined ? Math.round(liftedIndexMin) : undefined,
    };
  }

  const hasExtreme = wws?.reed_alert?.active || false;
  const alert = wws?.reed_alert;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={locate}
          disabled={locating}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/20 bg-white/10 backdrop-blur-md text-white text-sm font-bold hover:bg-white/20 transition-all disabled:opacity-60"
        >
          <MapPin className={`w-4 h-4 ${locating ? "animate-pulse" : ""}`} />
          {locating ? copy.locating : city.name}
        </button>
      </div>

      {loading && !weather && (
        <div className="card !p-12 text-center">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-4 text-text-secondary" />
          <p className="text-sm font-bold text-text-secondary">{copy.loading}</p>
        </div>
      )}

      {knmiWarnings.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-text-muted">{copy.warnings}</p>
          {knmiWarnings.map((warning) => {
            const accent =
              warning.severity === "RED"
                ? { line: "border-l-rose-500", bg: "bg-rose-500/5", text: "text-rose-500", chip: copy.red }
                : warning.severity === "ORANGE"
                  ? { line: "border-l-orange-500", bg: "bg-orange-500/5", text: "text-orange-500", chip: copy.orange }
                  : { line: "border-l-amber-400", bg: "bg-amber-400/5", text: "text-amber-400", chip: copy.yellow };
            const fmtTime = (iso: string | null) => {
              if (!iso) return "-";
              const date = new Date(iso);
              return date.toLocaleString(copy.dateLocale, { weekday: "short", hour: "2-digit", minute: "2-digit" });
            };

            return (
              <div key={warning.key} className={`card !p-5 border-l-4 ${accent.line} ${accent.bg}`}>
                <div className="flex items-start gap-4">
                  <AlertTriangle className={`w-5 h-5 mt-0.5 shrink-0 ${accent.text}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-2 mb-2">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${accent.text}`}>
                        {accent.chip} - {warning.type}
                      </span>
                      <span className="text-[10px] text-text-muted">- {warning.province}</span>
                      {warning.validFrom && warning.validUntil && (
                        <span className="text-[10px] font-bold text-text-secondary">
                          - {fmtTime(warning.validFrom)} to {fmtTime(warning.validUntil)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-text-primary leading-snug whitespace-pre-line">{warning.description}</p>
                    {warning.enriched && (
                      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-black/10 pt-4 dark:border-white/10 md:grid-cols-4">
                        <div className="rounded-lg border border-black/5 bg-white/45 p-3 dark:border-white/10 dark:bg-white/5">
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-text-muted">
                            <Zap className="h-3.5 w-3.5 text-orange-500" />
                            CAPE
                          </div>
                          <p className="mt-1 text-sm font-black text-text-primary">{warning.enriched.capeMaxJkg ?? 0} J/kg</p>
                        </div>
                        <div className="rounded-lg border border-black/5 bg-white/45 p-3 dark:border-white/10 dark:bg-white/5">
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-text-muted">
                            <ShieldAlert className="h-3.5 w-3.5 text-rose-500" />
                            Remming
                          </div>
                          <p className="mt-1 text-sm font-black text-text-primary">{warning.enriched.cinMaxJkg ?? 0} J/kg</p>
                        </div>
                        <div className="rounded-lg border border-black/5 bg-white/45 p-3 dark:border-white/10 dark:bg-white/5">
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-text-muted">
                            <Layers className="h-3.5 w-3.5 text-purple-500" />
                            Schering
                          </div>
                          <p className="mt-1 text-sm font-black text-text-primary">{warning.enriched.windShearMaxKmh ?? 0} km/h</p>
                        </div>
                        <div className="rounded-lg border border-black/5 bg-white/45 p-3 dark:border-white/10 dark:bg-white/5">
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-text-muted">
                            <Thermometer className="h-3.5 w-3.5 text-blue-500" />
                            Lifted Index
                          </div>
                          <p className="mt-1 text-sm font-black text-text-primary">{warning.enriched.liftedIndexMinC ?? 0}°C</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && weather && (
        <div className="space-y-6 animate-fade-in mb-6">
          {/* Reed's Extremen */}
          <div className="space-y-3">
            <div className="flex flex-col gap-3 px-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">
                  Reed&apos;s Extremen
                </h3>
                <p className="mt-1 text-[11px] text-text-secondary">
                  {expertMode ? "Alle convectieve signalen achter onweer en storm." : "Normale view vat onweers-/stormrisico compact samen."}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden text-[9px] font-black uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 sm:inline-flex">
                  Live Kansberekening
                </span>
                <div className="grid grid-cols-2 rounded-xl border border-black/10 bg-white/40 p-1 text-[10px] font-black uppercase tracking-wider shadow-sm dark:border-white/10 dark:bg-white/5">
                  <button
                    type="button"
                    onClick={() => setExpertMode(false)}
                    className={`rounded-lg px-3 py-1.5 transition ${!expertMode ? "bg-white text-text-primary shadow-sm dark:bg-white/10" : "text-text-muted hover:text-text-primary"}`}
                    aria-pressed={!expertMode}
                  >
                    Normaal
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpertMode(true)}
                    className={`rounded-lg px-3 py-1.5 transition ${expertMode ? "bg-slate-950 text-white shadow-sm dark:bg-white dark:text-slate-950" : "text-text-muted hover:text-text-primary"}`}
                    aria-pressed={expertMode}
                  >
                    Expert
                  </button>
                </div>
              </div>
            </div>

            {(() => {
              const periods = groupRiskPeriods(weather.hourly, knmiWarnings);
              if (periods.length === 0) {
                return (
                  <div className="card p-6 border border-emerald-500/25 bg-emerald-500/5 rounded-2xl">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-lg bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
                        <ShieldAlert className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                          Geen Reed-extremen
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-text-secondary">
                          De komende 48 uur tonen geen relevante Reed-signalen: geen combinatie van instabiliteit, trigger, bliksemcode en stormorganisatie voor {city.name}.
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {periods.map((period, idx) => {
                    const timeLabel = formatPeriodRange(period.startHour, period.endHour, copy.dateLocale);
                    const tone = getRiskTone(period);
                    const thunderWidth = Math.min(100, Math.max(0, period.maxThunderstormChance));
                    const periodHours = getPeriodHours(weather.hourly, period);
                    const expert = getExpertMetrics(period, periodHours);
                    const stormMode = getStormMode(period);

                    if (expertMode) {
                      return (
                        <div key={idx} className="space-y-3">
                          <div className={`rounded-xl border ${tone.border} bg-white/90 p-5 shadow-sm backdrop-blur dark:bg-slate-950/70 sm:p-6`}>
                            <div className="flex flex-col gap-4">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className={`text-[10px] font-black uppercase tracking-[0.18em] ${tone.accent}`}>
                                    Reed analyse
                                  </span>
                                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-text-muted">
                                    Periode {idx + 1}
                                  </span>
                                </div>
                                <h4 className="mt-1 text-2xl font-black leading-tight text-text-primary">
                                  {getExpertVerdict(period)}
                                </h4>
                                <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-text-primary">
                                  {getImpactSummary(period)}
                                </p>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <ExpertMetric label="Venster" value={timeLabel.replace(" van ", " ")} detail={`${expert.durationHours} uur`} />
                                <ExpertMetric label="Piek" value={formatPeakTime(period.peakHour, copy.dateLocale)} detail="Modelpiek" />
                                <ExpertMetric label="Ontladingen" value={`${period.maxThunderstormChance}%`} detail="Max signaal" />
                                <ExpertMetric label="Stormmodus" value={stormMode.label} detail="Structuur" />
                              </div>
                            </div>
                          </div>

                          <div className="grid gap-3">
                            <div className="rounded-xl border border-orange-500/15 bg-white/90 p-5 shadow-sm backdrop-blur dark:bg-slate-950/70">
                              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-700 dark:text-orange-300">Atmosfeer</p>
                              <h5 className="mt-1 text-lg font-black text-text-primary">Convectieve setup</h5>
                              <p className="mt-2 text-xs leading-relaxed text-text-secondary">{getSetupSummary(period)}</p>
                              <div className="mt-4 grid grid-cols-2 gap-2">
                                <ExpertMetric
                                  label="CAPE"
                                  value={period.maxCape >= 1000 ? "zeer hoog" : period.maxCape >= 500 ? "hoog" : period.maxCape >= 200 ? "matig" : "laag"}
                                  detail="Piekinstabiliteit"
                                />
                                <ExpertMetric label="Stabiliteit" value={`${expert.minLiftedIndex}°C`} detail={expert.minLiftedIndex < 0 ? "Instabiel" : "Marginaal/stabiel"} />
                                <ExpertMetric label="Remming" value={`${expert.maxCin} J/kg`} detail={expert.maxCin > 30 ? "Rem aanwezig" : "Weinig rem"} />
                                <ExpertMetric label="Dauwpunt" value={expert.maxDewPoint === null ? "n/b" : `${expert.maxDewPoint}°C`} detail="Vocht" />
                              </div>
                            </div>

                            <div className="rounded-xl border border-rose-500/15 bg-white/90 p-5 shadow-sm backdrop-blur dark:bg-slate-950/70">
                              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-rose-700 dark:text-rose-300">Trigger & bliksem</p>
                              <h5 className="mt-1 text-lg font-black text-text-primary">Ontladingspotentie</h5>
                              <p className="mt-2 text-xs leading-relaxed text-text-secondary">
                                Combineert instabiliteit, buiencode, trigger en remming tot onweersignaal.
                              </p>
                              <div className="mt-4 grid grid-cols-2 gap-2">
                                <ExpertMetric label="Onweerskans" value={`${period.maxThunderstormChance}%`} detail="Max periode" />
                                <ExpertMetric label="WMO onweer" value={`${expert.thunderCodeHours} uur`} detail="95/96/99" />
                                <ExpertMetric label="Trigger" value={expert.wetHours > 0 ? "Aanwezig" : "Zwak"} detail={`${expert.wetHours} actief uur`} />
                                <ExpertMetric label="Remming" value={expert.maxCin > 30 ? "Geremd" : "Open"} detail={`CIN ${expert.maxCin}`} />
                              </div>
                            </div>

                            <div className="rounded-xl border border-purple-500/15 bg-white/90 p-5 shadow-sm backdrop-blur dark:bg-slate-950/70">
                              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-purple-700 dark:text-purple-300">Dynamiek</p>
                              <h5 className="mt-1 text-lg font-black text-text-primary">Stormmodus</h5>
                              <p className="mt-2 text-xs leading-relaxed text-text-secondary">
                                {stormMode.detail}
                              </p>
                              <div className="mt-4 grid grid-cols-2 gap-2">
                                <ExpertMetric label="Modus" value={stormMode.label} detail="Op basis van energie/schering" />
                                <ExpertMetric label="Schering" value={`${expert.maxShear} km/h`} detail={`Gem. ${expert.avgShear}`} />
                                <ExpertMetric label="WMO convectief" value={`${expert.showerCodeHours} uur`} detail="80/81/82" />
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-end justify-between px-1">
                              <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Modelsignalen</h5>
                              <span className="text-[10px] font-bold text-text-secondary">{weather.models.agreement}% consensus</span>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                              {expert.modelCards.map((model) => (
                                <div key={`${period.startHour}-${model.key}`} className="rounded-xl border border-black/5 bg-white/90 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/70">
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-text-muted">Model</p>
                                      <h6 className="mt-1 text-lg font-black text-text-primary">{model.label}</h6>
                                    </div>
                                    <span className={`rounded-lg px-2 py-1 text-[10px] font-black ${model.thunderHours > 0 ? "bg-rose-500/10 text-rose-600 dark:text-rose-400" : model.showerHours > 0 || model.peakPrecip >= 1 ? "bg-orange-500/10 text-orange-600 dark:text-orange-400" : "bg-black/5 text-text-muted dark:bg-white/10"}`}>
                                      {model.thunderHours > 0 ? "Onweer" : model.showerHours > 0 || model.peakPrecip >= 1 ? "Convectief" : "Geen WMO-signaal"}
                                    </span>
                                  </div>
                                  <div className="mt-4 grid grid-cols-2 gap-2">
                                    <ExpertMetric label="WMO onweer" value={`${model.thunderHours} uur`} detail="95/96/99" />
                                    <ExpertMetric label="WMO convectief" value={`${model.showerHours} uur`} detail="80/81/82" />
                                    <ExpertMetric
                                      label="Buiensignaal"
                                      value={model.peakPrecip >= 2 ? "sterk" : model.peakPrecip >= 1 ? "matig" : "zwak"}
                                      detail="Celontwikkeling"
                                    />
                                    <ExpertMetric label="Thermiek" value={`${model.minTemp}-${model.maxTemp}°C`} detail="Modeltemperatuur" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {expert.timeline.length > 0 && (
                            <div className="overflow-hidden rounded-xl border border-black/5 bg-white/90 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/70">
                              <div className="border-b border-black/5 px-5 py-4 dark:border-white/10">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Uurlijkse convectie</p>
                              </div>
                              <div className="overflow-x-auto">
                                <table className="w-full min-w-[680px] text-left text-xs">
                                  <thead className="bg-black/5 text-[10px] uppercase tracking-wider text-text-muted dark:bg-white/5">
                                    <tr>
                                      <th className="px-4 py-3">Uur</th>
                                      <th className="px-4 py-3">Intensiteit</th>
                                      <th className="px-4 py-3">CAPE</th>
                                      <th className="px-4 py-3">Stabiliteit</th>
                                      <th className="px-4 py-3">Remming</th>
                                      <th className="px-4 py-3">Wind</th>
                                      <th className="px-4 py-3">Weercode</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-black/5 dark:divide-white/10">
                                    {expert.timeline.map((hour) => (
                                      <tr key={`${period.startHour}-${hour.time}`}>
                                        <td className="px-4 py-3 font-black text-text-primary">{formatHourShort(hour.time, copy.dateLocale)}</td>
                                        <td className="px-4 py-3 text-text-secondary">{(hour.precipitation || 0).toFixed(1)} mm</td>
                                        <td className="px-4 py-3 text-text-secondary">{Math.round(hour.cape || 0)}</td>
                                        <td className="px-4 py-3 text-text-secondary">{hour.liftedIndex ?? 0}</td>
                                        <td className="px-4 py-3 text-text-secondary">{hour.cin ?? 0}</td>
                                        <td className="px-4 py-3 text-text-secondary">{Math.round(hour.windSpeed || 0)} km/h</td>
                                        <td className="px-4 py-3 text-text-secondary">{hour.weatherCode}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div key={idx} className={`overflow-hidden rounded-xl border ${tone.border} bg-white/90 shadow-sm backdrop-blur dark:bg-slate-950/70`}>
                        <div>
                          <section className="p-5 sm:p-6">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className={`rounded-md bg-white/70 px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${tone.accent} dark:bg-white/10`}>
                                    {tone.label}
                                  </span>
                                  <span className="text-[10px] font-black uppercase tracking-[0.16em] text-text-muted">
                                    Reed-extreem {idx + 1}
                                  </span>
                                </div>
                                <h4 className="mt-3 text-2xl font-black leading-tight text-text-primary">
                                  {getExpertVerdict(period)}
                                </h4>
                                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold text-text-secondary">
                                  <span className="inline-flex items-center gap-2">
                                    <Clock className="h-3.5 w-3.5" />
                                    {timeLabel}
                                  </span>
                                  <span>{formatPeakTime(period.peakHour, copy.dateLocale)}</span>
                                </div>
                              </div>
                            </div>

                            <div className="mt-5 max-w-3xl space-y-2">
                              <p className="text-sm font-semibold leading-relaxed text-text-primary">
                                {getImpactSummary(period)}
                              </p>
                              <p className="text-xs leading-relaxed text-text-secondary">
                                {getSetupSummary(period)}
                              </p>
                            </div>

                            <div className="mt-5 grid overflow-hidden rounded-lg border border-black/5 bg-black/5 dark:border-white/10 dark:bg-white/10 sm:grid-cols-4">
                              <div className="bg-white/70 p-3 dark:bg-black/20">
                                <p className="text-[10px] font-black uppercase tracking-wider text-text-muted">CAPE</p>
                                <p className="mt-1 text-sm font-black text-text-primary">{Math.round(period.maxCape)} J/kg</p>
                              </div>
                              <div className="bg-white/70 p-3 dark:bg-black/20">
                                <p className="text-[10px] font-black uppercase tracking-wider text-text-muted">Stabiliteit</p>
                                <p className="mt-1 text-sm font-black text-text-primary">{period.minLiftedIndex}°C</p>
                              </div>
                              <div className="bg-white/70 p-3 dark:bg-black/20">
                                <p className="text-[10px] font-black uppercase tracking-wider text-text-muted">Remming</p>
                                <p className="mt-1 text-sm font-black text-text-primary">{Math.round(period.maxCin)} J/kg</p>
                              </div>
                              <div className="bg-white/70 p-3 dark:bg-black/20">
                                <p className="text-[10px] font-black uppercase tracking-wider text-text-muted">Schering</p>
                                <p className="mt-1 text-sm font-black text-text-primary">{period.avgWindShear} km/h</p>
                              </div>
                            </div>
                          </section>

                          <aside className="border-t border-black/5 bg-white/50 p-5 dark:border-white/10 dark:bg-black/10">
                            <div className="grid gap-5 sm:grid-cols-[220px_minmax(0,1fr)]">
                              <div>
                                <div className="flex items-end justify-between gap-4">
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-text-muted">Onweerskans</p>
                                <p className={`mt-1 text-5xl font-black leading-none ${period.maxThunderstormChance >= 30 ? tone.accent : "text-text-primary"}`}>
                                  {period.maxThunderstormChance}%
                                </p>
                              </div>
                              <Zap className={`h-7 w-7 ${tone.accent}`} />
                            </div>
                            <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                              <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${thunderWidth}%` }} />
                            </div>
                              </div>
                              <div className="space-y-3 text-sm">
                              <div className="flex items-baseline justify-between gap-4 border-t border-black/5 pt-3 dark:border-white/10">
                                <span className="font-bold text-text-secondary">Stormmodus</span>
                                <span className="text-right font-black text-text-primary">{stormMode.label}</span>
                              </div>
                              <div className="flex items-baseline justify-between gap-4 border-t border-black/5 pt-3 dark:border-white/10">
                                <span className="font-bold text-text-secondary">Organisatie</span>
                                <span className="text-right font-black text-text-primary">{period.avgWindShear >= 25 ? "mogelijk" : "zwak"}</span>
                              </div>
                              <div className="flex items-baseline justify-between gap-4 border-t border-black/5 pt-3 dark:border-white/10">
                                <span className="font-bold text-text-secondary">Modelduur</span>
                                <span className="text-right font-black text-text-primary">{expert.durationHours} uur</span>
                              </div>
                              </div>
                            </div>
                          </aside>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()
          }
          </div>

          <div className="space-y-3">
            <div className="flex items-end justify-between px-1">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">{copy.lightning}</h3>
            </div>
            <LightningMap lat={city.lat} lon={city.lon} locale={locale} />
          </div>
        </div>
      )}

      {(!loading || weather) && hasExtreme && alert && (
        <div className={`rounded-xl border p-6 shadow-sm ${alert.severity === "RED" ? "border-rose-500/30 bg-rose-500/5" : alert.severity === "ORANGE" ? "border-orange-500/30 bg-orange-500/5" : "border-amber-500/30 bg-amber-500/5"}`}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
              <AlertTriangle className={`w-6 h-6 ${alert.severity === "RED" ? "text-rose-500" : alert.severity === "ORANGE" ? "text-orange-500" : "text-amber-500"}`} />
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-text-muted">
                {copy.important} - {alert.severity}
              </span>
            </div>
              <h2 className="mt-4 text-3xl font-black leading-tight text-text-primary">{alert.type.join(" & ")}</h2>
              <p className="mt-2 text-base font-bold text-text-secondary">
              {alert.location} - {alert.timing}
            </p>
            </div>
            <div className="max-w-xl rounded-lg border border-black/5 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
              <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">{copy.mustKnow}</p>
              <p className="text-sm font-semibold leading-relaxed text-text-primary">{alert.instruction}</p>
              <p className="text-[10px] text-text-muted mt-4 uppercase">WEERZONE</p>
            </div>
          </div>
        </div>
      )}

      <div className="text-center pt-8">
        <Link href="/" className="text-sm text-white/40 hover:text-white underline font-bold tracking-tight">
          &larr; {copy.dashboard}
        </Link>
      </div>
    </div>
  );
}

const RefreshCw = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
);
