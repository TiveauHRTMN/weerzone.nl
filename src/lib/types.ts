export interface MinutelyPrecipitation {
  time: string;
  precipitation: number;
}

export interface WeatherData {
  current: {
    temperature: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    windDirection: string;
    windGusts: number;
    precipitation: number;
    weatherCode: number;
    isDay: boolean;
    cloudCover: number;
  };
  minutely: MinutelyPrecipitation[];
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  sunrise: string;
  sunset: string;
  uvIndex: number;
  models: ModelComparison;
  summaryVerdict?: string; // Korte teaser voor Homepage
  deepAnalysis?: string;   // Uitgebreid dossier voor /piet
  neuralData?: {
    metNetNowcast?: string;
    seedScenario?: string;
    neuralGcmImpact?: string;
    // Technical Layers
    opticalDepth?: number;    // 0-100 (bewolking dichtheid)
    solarRadiation?: number; // W/m2
    windTurbulence?: string; // "Low", "Moderate", "High (Urban Tunnel)"
    lightningRisk?: number;  // 0-100 (Reed trigger)
    stormSeverity?: number;  // 0-12 Bft (Reed trigger)
  };
}

export interface HourlyForecast {
  time: string;
  temperature: number;
  apparentTemperature: number;
  weatherCode: number;
  precipitation: number;
  windSpeed: number;
  cape: number; // Convective Available Potential Energy (J/kg) — onweersrisico
  confidence: "high" | "medium" | "low";
  models?: {
    harmonie?: { temperature: number; precipitation: number; weatherCode: number; windSpeed: number };
    icon?: { temperature: number; precipitation: number; weatherCode: number; windSpeed: number };
    arome?: { temperature: number; precipitation: number; weatherCode: number; windSpeed: number };
  };
}

export interface DailyForecast {
  date: string;
  tempMax: number;
  tempMin: number;
  weatherCode: number;
  precipitationSum: number;
  windSpeedMax: number;
  sunHours: number;
}

export interface ModelComparison {
  agreement: number; // 0-100 percentage
  label: string;
  sources: string[];
}

export interface WWSPayload {
  timestamp: string;
  system_status: string;
  pipeline: string;
  cycle?: string;
  resolution: string;
  window: string;
  b2b_decision_matrix: {
    sector_bouw: { status: string; p90_risk: string; time_window: string; action: string };
    sector_logistiek: { status: string; p90_risk: string; time_window: string; action: string };
    sector_maritiem: { status: string; p90_risk: string; time_window: string; action: string };
  };
  api_grid_1km: {
    region: string;
    models_synthesized: string[];
    thermodynamic_validation: string;
    divergence_alert: boolean;
    divergence_delta: number;
    forecast: Array<{
      time: string;
      temp_c: number;
      precip_mm: number;
      wind_gust_kmh: number;
      confidence: number;
    }>;
  };
  piet_update: {
    title: string;
    content: string;
    closing: string;
  };
  reed_alert: {
    active: boolean;
    severity: "NONE" | "YELLOW" | "ORANGE" | "RED";
    type: string[];
    location: string;
    timing: string;
    instruction: string;
  } | null;
  viral_hook: {
    trigger_condition: string;
    copy: string;
  };
}

export interface City {
  name: string;
  lat: number;
  lon: number;
}

// ============================================================
// Top 10 steden + alle ~50 KNMI weerstations
// Geolocation snapt naar dichtstbijzijnde station/stad
// ============================================================

export const DUTCH_CITIES: City[] = [
  // ── Het Meteorologische Hart (Default) ──
  { name: "De Bilt", lat: 52.1011, lon: 5.1775 },

  // ── Top 10 grootste steden ──
  { name: "Amsterdam", lat: 52.3676, lon: 4.9041 },
  { name: "Rotterdam", lat: 51.9244, lon: 4.4777 },
  { name: "Den Haag", lat: 52.0705, lon: 4.3007 },
  { name: "Utrecht", lat: 52.0907, lon: 5.1214 },
  { name: "Eindhoven", lat: 51.4416, lon: 5.4697 },
  { name: "Groningen", lat: 53.2194, lon: 6.5665 },
  { name: "Tilburg", lat: 51.5555, lon: 5.0913 },
  { name: "Almere", lat: 52.3508, lon: 5.2647 },
  { name: "Breda", lat: 51.5719, lon: 4.7683 },
  { name: "Nijmegen", lat: 51.8126, lon: 5.8372 },

  // ── KNMI weerstations (officieel meetnetwerk) ──
  // Waddeneilanden & Noord
  { name: "Vlieland", lat: 53.2417, lon: 5.0000 },
  { name: "Terschelling", lat: 53.3917, lon: 5.3458 },
  { name: "Leeuwarden", lat: 53.2244, lon: 5.7558 },
  { name: "Lauwersoog", lat: 53.4047, lon: 6.1992 },
  { name: "Eelde", lat: 53.1247, lon: 6.5856 },
  { name: "Nieuw Beerta", lat: 53.1964, lon: 7.1500 },
  { name: "Heino", lat: 52.4350, lon: 6.2597 },
  { name: "Hoogeveen", lat: 52.7306, lon: 6.5131 },
  { name: "Marknesse", lat: 52.7033, lon: 5.8881 },

  // Kop van Noord-Holland & Kust
  { name: "De Kooy", lat: 52.9264, lon: 4.7808 },
  { name: "Berkhout", lat: 52.6444, lon: 5.1803 },
  { name: "Wijk aan Zee", lat: 52.5000, lon: 4.6000 },
  { name: "IJmuiden", lat: 52.4628, lon: 4.5558 },
  { name: "Voorschoten", lat: 52.1261, lon: 4.4297 },
  { name: "Hoek van Holland", lat: 51.9831, lon: 4.1192 },

  // Centraal
  { name: "Schiphol", lat: 52.3017, lon: 4.7642 },
  { name: "Lelystad", lat: 52.4572, lon: 5.5206 },
  { name: "Deelen", lat: 52.0606, lon: 5.8731 },
  { name: "Hupsel", lat: 52.0694, lon: 6.6567 },
  { name: "Twenthe", lat: 52.2744, lon: 6.8972 },
  { name: "Stavoren", lat: 52.8853, lon: 5.3844 },

  // Zuid-Holland & Zeeland
  { name: "Rotterdam Airport", lat: 51.9564, lon: 4.4472 },
  { name: "Cabauw", lat: 51.9703, lon: 4.9261 },
  { name: "Herwijnen", lat: 51.8592, lon: 5.1464 },
  { name: "Wilhelminadorp", lat: 51.5272, lon: 3.8847 },
  { name: "Vlissingen", lat: 51.4422, lon: 3.5961 },
  { name: "Westdorpe", lat: 51.2308, lon: 3.8619 },

  // Brabant & Limburg
  { name: "Gilze-Rijen", lat: 51.5664, lon: 4.9356 },
  { name: "Volkel", lat: 51.6564, lon: 5.7072 },
  { name: "Ell", lat: 51.1986, lon: 5.7628 },
  { name: "Arcen", lat: 51.4978, lon: 6.1964 },
  { name: "Maastricht", lat: 50.9058, lon: 5.7617 },

  // Extra meetpunten
  { name: "Texelhors", lat: 53.0167, lon: 4.7333 },
  { name: "Woensdrecht", lat: 51.4492, lon: 4.3422 },
  { name: "Eindhoven vliegbasis", lat: 51.4500, lon: 5.3742 },

  // Platform stations (Noordzee)
  { name: "P11-B (Noordzee)", lat: 52.3617, lon: 3.3417 },
  { name: "F3-FB-1 (Noordzee)", lat: 54.8500, lon: 4.6967 },
  { name: "Europlatform", lat: 51.9989, lon: 3.2756 },
];

/**
 * Lijst van officiële KNMI-weerstations op land.
 * Gebruikt voor de landelijke "Pulse" ticker.
 */
export const KNMI_STATIONS = DUTCH_CITIES.filter((c, i) => 
  !c.name.includes("(Noordzee)") && 
  c.name !== "Europlatform" &&
  (i === 0 || i >= 11) // De Bilt + alle stations vanaf sectie "KNMI weerstations"
);

/**
 * Reverse geocode via OpenStreetMap Nominatim: geeft de werkelijke
 * plaatsnaam voor de opgegeven GPS-coördinaten. Gebruikt de exacte
 * locatie van de gebruiker — geen snapping naar KNMI-stations.
 * Valt terug op findNearestCity als de API geen resultaat geeft.
 */
export async function reverseGeocode(lat: number, lon: number): Promise<City> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=nl&zoom=14`,
      { headers: { "User-Agent": "WEERZONE/1.0 (weerzone.nl)" } }
    );
    if (res.ok) {
      const data = await res.json();
      // Nominatim retourneert address.village, address.town, of address.city
      const addr = data.address;
      const name = addr?.village || addr?.town || addr?.city || addr?.municipality;
      if (name) {
        return { name, lat, lon };
      }
    }
  } catch {
    // Fall through to nearest city
  }
  return findNearestCity(lat, lon);
}

/**
 * Zoek het dichtstbijzijnde station/stad op basis van coördinaten.
 * Gebruikt Haversine-afstand.
 */
export function findNearestCity(lat: number, lon: number): City {
  let nearest = DUTCH_CITIES[0];
  let minDist = Infinity;

  for (const city of DUTCH_CITIES) {
    const dLat = (city.lat - lat) * Math.PI / 180;
    const dLon = (city.lon - lon) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat * Math.PI / 180) *
      Math.cos(city.lat * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
    const dist = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 6371;
    if (dist < minDist) {
      minDist = dist;
      nearest = city;
    }
  }
  return nearest;
}

/**
 * Afstand in km tussen twee coördinaten (voor chat "dichtstbijzijnde station")
 */
export function distanceBetween(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 6371;
}
