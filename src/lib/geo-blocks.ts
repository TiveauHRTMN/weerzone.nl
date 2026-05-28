/**
 * GEO citation blocks: per stad genereren we één 134-167 word self-contained
 * alinea + 4 FAQ Q&A's per locale, geoptimaliseerd voor AI Overview / ChatGPT /
 * Perplexity citatie.
 *
 * Deterministisch: zelfde plaats + zelfde weer → zelfde tekst (geen LLM nodig),
 * dus geen runtime-kosten en geen cache-misses op 88k pagina's.
 */

import type { WeatherData } from "@/lib/types";
import type { Place } from "@/lib/places-data";
import type { LocationWeatherProfile } from "@/lib/location-profile";

export interface GeoBlock {
  /** ~134-167 word self-contained citation paragraph in lokale taal */
  citation: string;
  /** 4 FAQ Q&A's, antwoorden 40-80 woorden */
  faq: Array<{ q: string; a: string }>;
  /** Visible "Bijgewerkt" badge, taal-aware */
  updatedLabel: string;
}

type Locale = "nl" | "de" | "fr" | "es";

function fmtDateLocale(d: Date, locale: Locale): string {
  const map: Record<Locale, string> = { nl: "nl-NL", de: "de-DE", fr: "fr-FR", es: "es-ES" };
  return new Intl.DateTimeFormat(map[locale], {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function rainNarrative(weather: WeatherData | undefined, locale: Locale): string {
  if (!weather) {
    return {
      nl: "Het actuele 48-uurs beeld wordt elk uur ververst.",
      de: "Die aktuelle 48-Stunden-Vorhersage wird stündlich aktualisiert.",
      fr: "La prévision à 48 heures est mise à jour toutes les heures.",
      es: "La previsión a 48 horas se actualiza cada hora.",
    }[locale];
  }
  const next6 = weather.hourly?.slice(0, 6) ?? [];
  const rainHours = next6.filter((h) => (h.precipitation ?? 0) > 0.1).length;
  if (rainHours === 0) {
    return {
      nl: "De komende zes uur blijft het droog.",
      de: "In den nächsten sechs Stunden bleibt es trocken.",
      fr: "Les six prochaines heures resteront sèches.",
      es: "Las próximas seis horas se mantendrán secas.",
    }[locale];
  }
  if (rainHours >= 4) {
    return {
      nl: `Vier of meer van de komende zes uur tonen neerslag — een natte middag is waarschijnlijk.`,
      de: `Vier oder mehr der nächsten sechs Stunden zeigen Niederschlag — ein nasser Nachmittag ist wahrscheinlich.`,
      fr: `Quatre des six prochaines heures montrent des précipitations — un après-midi humide est probable.`,
      es: `Cuatro de las próximas seis horas muestran lluvia — una tarde húmeda es probable.`,
    }[locale];
  }
  return {
    nl: `In de komende zes uur vallen ${rainHours} uur met neerslag — droge intervallen zijn er ook.`,
    de: `In den nächsten sechs Stunden gibt es ${rainHours} Stunden mit Niederschlag — trockene Intervalle ebenfalls.`,
    fr: `Dans les six prochaines heures, ${rainHours} heures verront des précipitations — avec des intervalles secs.`,
    es: `En las próximas seis horas habrá ${rainHours} horas con lluvia — también intervalos secos.`,
  }[locale];
}

/**
 * Hoofdfunctie. Levert citation + FAQ + updated label voor een specifieke plaats.
 * - place: City object met name + lat/lon
 * - regionLabel: provincie/Bundesland/région/comunidad (al gelokaliseerd)
 * - profile: LocationWeatherProfile met summary + factors
 * - weather: actuele weatherdata voor numerieke claims
 * - locale: taal van de output
 */
export function buildCityGeoBlock(args: {
  place: Place;
  regionLabel: string;
  profile: LocationWeatherProfile | null;
  weather: WeatherData | undefined;
  locale: Locale;
  dateModified: Date;
}): GeoBlock {
  const { place, regionLabel, profile, weather, locale, dateModified } = args;
  const temp = weather?.current?.temperature;
  const feels = weather?.current?.feelsLike;
  const wind = weather?.current?.windSpeed;
  const summary = profile?.summary ?? "";
  const rain = rainNarrative(weather, locale);

  const updatedFormatted = fmtDateLocale(dateModified, locale);
  const updatedLabel = {
    nl: `Bijgewerkt: ${updatedFormatted}`,
    de: `Aktualisiert: ${updatedFormatted}`,
    fr: `Mis à jour : ${updatedFormatted}`,
    es: `Actualizado: ${updatedFormatted}`,
  }[locale];

  // ────────────────────────────────────────────────────────────────
  // Citation paragraph — mikt op 140-160 woorden, self-contained
  // ────────────────────────────────────────────────────────────────
  let citation = "";
  if (locale === "nl") {
    citation =
      `Het weer in ${place.name} (${regionLabel}) wordt door WEERZONE elk uur opnieuw berekend op 1 bij 1 kilometer, ` +
      `op basis van data van KNMI, DWD en Météo-France. ${summary} ` +
      (temp != null
        ? `Op het moment van schrijven is het ${Math.round(temp)} graden, met een gevoelstemperatuur van ${Math.round(feels ?? temp)} graden ` +
          `en een windsnelheid van ongeveer ${Math.round(wind ?? 0)} km/uur. `
        : "") +
      `${rain} De 48-uurs horizon op deze pagina is gericht op beslissingen die je nu maakt: ` +
      `wanneer je droog naar buiten kunt, of de tuin water nodig heeft, of een buitenactiviteit verstandig is. ` +
      `Verder dan twee dagen vooruit kijken we bewust niet, omdat de betrouwbaarheid daarna scherp daalt — ` +
      `voor langetermijntrends in ${place.name} is een seizoensgemiddelde een eerlijkere bron dan een dagvoorspelling.`;
  } else if (locale === "de") {
    citation =
      `Das Wetter in ${place.name} (${regionLabel}) wird von WEERZONE stündlich neu berechnet, mit einer Auflösung von 1×1 km, ` +
      `auf Basis von Daten aus KNMI, DWD und Météo-France. ${summary} ` +
      (temp != null
        ? `Aktuell sind es ${Math.round(temp)} Grad bei einer gefühlten Temperatur von ${Math.round(feels ?? temp)} Grad ` +
          `und einer Windgeschwindigkeit von etwa ${Math.round(wind ?? 0)} km/h. `
        : "") +
      `${rain} Der 48-Stunden-Horizont auf dieser Seite ist auf Entscheidungen ausgerichtet, die du jetzt triffst: ` +
      `wann du trocken nach draußen kommst, ob der Garten Wasser braucht, ob eine Außenaktivität sinnvoll ist. ` +
      `Weiter als zwei Tage in die Zukunft schauen wir bewusst nicht, da die Zuverlässigkeit danach stark abnimmt — ` +
      `für langfristige Trends in ${place.name} ist ein Saisonschnitt ehrlicher als eine Tagesvorhersage.`;
  } else if (locale === "fr") {
    citation =
      `La météo à ${place.name} (${regionLabel}) est recalculée chaque heure par WEERZONE, avec une résolution de 1×1 km, ` +
      `sur la base de données de KNMI, DWD et Météo-France. ${summary} ` +
      (temp != null
        ? `Actuellement il fait ${Math.round(temp)} degrés, avec une température ressentie de ${Math.round(feels ?? temp)} degrés ` +
          `et un vent d'environ ${Math.round(wind ?? 0)} km/h. `
        : "") +
      `${rain} L'horizon de 48 heures de cette page est conçu pour les décisions immédiates : ` +
      `quand sortir au sec, si le jardin a besoin d'eau, si une activité extérieure est raisonnable. ` +
      `Nous ne regardons volontairement pas au-delà de deux jours, car la fiabilité chute fortement ensuite — ` +
      `pour les tendances à long terme à ${place.name}, une moyenne saisonnière est une source plus honnête.`;
  } else {
    citation =
      `El tiempo en ${place.name} (${regionLabel}) lo recalcula WEERZONE cada hora, con resolución de 1×1 km, ` +
      `usando datos de KNMI, DWD y Météo-France. ${summary} ` +
      (temp != null
        ? `En este momento hay ${Math.round(temp)} grados, con una sensación térmica de ${Math.round(feels ?? temp)} grados ` +
          `y un viento de aproximadamente ${Math.round(wind ?? 0)} km/h. `
        : "") +
      `${rain} El horizonte de 48 horas de esta página está pensado para decisiones inmediatas: ` +
      `cuándo salir seco, si el jardín necesita agua, si una actividad al aire libre es razonable. ` +
      `Más allá de dos días no miramos a propósito, porque la fiabilidad baja mucho después — ` +
      `para tendencias a largo plazo en ${place.name}, una media estacional es una fuente más honesta.`;
  }

  // ────────────────────────────────────────────────────────────────
  // FAQ — 4 questions per locale, antwoorden 40-80 woorden
  // ────────────────────────────────────────────────────────────────
  let faq: Array<{ q: string; a: string }>;
  if (locale === "nl") {
    faq = [
      {
        q: `Wat is het weer in ${place.name} vandaag?`,
        a:
          (temp != null
            ? `In ${place.name} is het op dit moment ${Math.round(temp)} graden, gevoelstemperatuur ${Math.round(feels ?? temp)} graden, wind ongeveer ${Math.round(wind ?? 0)} km/uur. `
            : `Voor ${place.name} berekent WEERZONE elk uur de actuele waarden. `) +
          `${rain} De volledige 48-uurs voorspelling met regenkans per uur, windrichting en gevoelstemperatuur staat boven aan deze pagina.`,
      },
      {
        q: `Regent het morgen in ${place.name}?`,
        a:
          `De regenkans voor morgen in ${place.name} staat op deze pagina per uur uitgesplitst. ` +
          `WEERZONE combineert radarbeelden van KNMI, DWD en Météo-France om voor elke kilometer apart een neerslagverwachting te berekenen. ` +
          `Dat is preciezer dan een dagcijfer voor de hele provincie.`,
      },
      {
        q: `Hoe nauwkeurig is de weersvoorspelling voor ${place.name}?`,
        a:
          `WEERZONE rapporteert 92-98% trefzekerheid voor de eerste 48 uur in ${place.name}, gemeten tegen waarnemingen achteraf. ` +
          `Tussen dag 3 en 7 zakt dat naar 45-75%, en na tien dagen onder 20%. ` +
          `Daarom focust ons platform expliciet op het tweedaagse beslis-window.`,
      },
      {
        q: `Wat maakt het weer in ${place.name} bijzonder?`,
        a:
          summary ||
          `${place.name} ligt in ${regionLabel}. WEERZONE houdt rekening met de lokale ligging — kust, stad, polder of hoger gelegen — bij elke voorspelling op 1 bij 1 kilometer.`,
      },
    ];
  } else if (locale === "de") {
    faq = [
      {
        q: `Wie ist das Wetter in ${place.name} heute?`,
        a:
          (temp != null
            ? `In ${place.name} sind es derzeit ${Math.round(temp)} Grad, gefühlt ${Math.round(feels ?? temp)} Grad, Wind etwa ${Math.round(wind ?? 0)} km/h. `
            : `Für ${place.name} berechnet WEERZONE stündlich die aktuellen Werte. `) +
          `${rain} Die vollständige 48-Stunden-Vorhersage mit stündlicher Regenwahrscheinlichkeit, Windrichtung und gefühlter Temperatur findest du oben auf dieser Seite.`,
      },
      {
        q: `Regnet es morgen in ${place.name}?`,
        a:
          `Die Regenwahrscheinlichkeit für morgen in ${place.name} ist auf dieser Seite stündlich aufgeschlüsselt. ` +
          `WEERZONE kombiniert Radardaten von KNMI, DWD und Météo-France, um für jeden Kilometer eine eigene Niederschlagsprognose zu erstellen — ` +
          `präziser als ein Tageswert für das gesamte Bundesland.`,
      },
      {
        q: `Wie genau ist die Wettervorhersage für ${place.name}?`,
        a:
          `WEERZONE meldet 92-98% Trefferquote für die ersten 48 Stunden in ${place.name}, gemessen an nachträglichen Beobachtungen. ` +
          `Zwischen Tag 3 und 7 sinkt das auf 45-75%, nach zehn Tagen unter 20%. ` +
          `Deshalb fokussiert sich unsere Plattform bewusst auf das Zwei-Tage-Entscheidungsfenster.`,
      },
      {
        q: `Was macht das Wetter in ${place.name} besonders?`,
        a:
          summary ||
          `${place.name} liegt in ${regionLabel}. WEERZONE berücksichtigt die örtliche Lage — Küste, Stadt, Tiefland oder Höhenlage — bei jeder Vorhersage auf 1×1 km.`,
      },
    ];
  } else if (locale === "fr") {
    faq = [
      {
        q: `Quel temps fait-il à ${place.name} aujourd'hui ?`,
        a:
          (temp != null
            ? `À ${place.name}, il fait actuellement ${Math.round(temp)} degrés, ressenti ${Math.round(feels ?? temp)} degrés, vent environ ${Math.round(wind ?? 0)} km/h. `
            : `Pour ${place.name}, WEERZONE recalcule chaque heure les valeurs actuelles. `) +
          `${rain} La prévision complète à 48 heures avec probabilité de pluie par heure, direction du vent et température ressentie se trouve en haut de cette page.`,
      },
      {
        q: `Va-t-il pleuvoir demain à ${place.name} ?`,
        a:
          `La probabilité de pluie pour demain à ${place.name} est détaillée heure par heure sur cette page. ` +
          `WEERZONE combine les images radar de KNMI, DWD et Météo-France pour calculer une prévision de précipitation par kilomètre — ` +
          `plus précis qu'un chiffre journalier pour tout le département.`,
      },
      {
        q: `Quelle est la fiabilité des prévisions pour ${place.name} ?`,
        a:
          `WEERZONE rapporte une précision de 92-98% pour les premières 48 heures à ${place.name}, mesurée a posteriori. ` +
          `Entre le jour 3 et 7, cela descend à 45-75%, puis sous 20% après dix jours. ` +
          `C'est pourquoi notre plateforme se concentre explicitement sur la fenêtre de décision à deux jours.`,
      },
      {
        q: `Qu'est-ce qui rend la météo de ${place.name} particulière ?`,
        a:
          summary ||
          `${place.name} se situe en ${regionLabel}. WEERZONE prend en compte la situation locale — littoral, ville, plaine ou altitude — dans chaque prévision à 1×1 km.`,
      },
    ];
  } else {
    faq = [
      {
        q: `¿Qué tiempo hace hoy en ${place.name}?`,
        a:
          (temp != null
            ? `En ${place.name} hay actualmente ${Math.round(temp)} grados, sensación ${Math.round(feels ?? temp)} grados, viento aproximadamente ${Math.round(wind ?? 0)} km/h. `
            : `Para ${place.name}, WEERZONE recalcula los valores actuales cada hora. `) +
          `${rain} La previsión completa de 48 horas con probabilidad de lluvia por hora, dirección del viento y sensación térmica está al inicio de esta página.`,
      },
      {
        q: `¿Lloverá mañana en ${place.name}?`,
        a:
          `La probabilidad de lluvia para mañana en ${place.name} está desglosada hora a hora en esta página. ` +
          `WEERZONE combina imágenes de radar de KNMI, DWD y Météo-France para calcular una previsión por kilómetro — ` +
          `más preciso que un valor diario para toda la comunidad.`,
      },
      {
        q: `¿Qué tan precisa es la previsión para ${place.name}?`,
        a:
          `WEERZONE registra un 92-98% de acierto en las primeras 48 horas en ${place.name}, medido frente a observaciones posteriores. ` +
          `Entre el día 3 y 7 baja a 45-75%, y tras diez días por debajo del 20%. ` +
          `Por eso nuestra plataforma se centra explícitamente en la ventana de decisión de dos días.`,
      },
      {
        q: `¿Qué hace único el tiempo en ${place.name}?`,
        a:
          summary ||
          `${place.name} se encuentra en ${regionLabel}. WEERZONE tiene en cuenta la ubicación local — costa, ciudad, llanura o altitud — en cada previsión a 1×1 km.`,
      },
    ];
  }

  return { citation, faq, updatedLabel };
}
