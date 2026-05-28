import type { MarianaForecastIntelligence, MarianaHourlyIntelligence } from "@/lib/mariana/types";
import type { OracleForecastIntelligence, OracleHourlyIntelligence } from "@/lib/oracle/types";

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
  mariana?: MarianaForecastIntelligence;
  oracle?: OracleForecastIntelligence;
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
  mariana?: MarianaHourlyIntelligence;
  oracle?: OracleHourlyIntelligence;
  models?: {
    harmonie?: { temperature: number; precipitation: number; weatherCode: number; windSpeed: number };
    icon?: { temperature: number; precipitation: number; weatherCode: number; windSpeed: number };
    arome?: { temperature: number; precipitation: number; weatherCode: number; windSpeed: number };
    ecmwf?: { temperature: number; precipitation: number; weatherCode: number; windSpeed: number };
    gfs?: { temperature: number; precipitation: number; weatherCode: number; windSpeed: number };
    aifs?: { temperature: number; precipitation: number; weatherCode: number; windSpeed: number };
    google?: { temperature: number; precipitation: number; weatherCode: number; windSpeed: number };
    [key: string]: { temperature: number; precipitation: number; weatherCode: number; windSpeed: number } | undefined;
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

export interface PollenHour {
  time: string;
  grass: number | null;
  birch: number | null;
  alder: number | null;
  mugwort: number | null;
}

export interface AirQualityData {
  hourly: PollenHour[];
  peakGrass: number | null;
  peakBirch: number | null;
  peakAlder: number | null;
  peakMugwort: number | null;
}

export interface MarineHour {
  time: string;
  waveHeight: number | null;
  waveDirection: number | null;
  wavePeriod: number | null;
  windWaveHeight: number | null;
  swellWaveHeight: number | null;
  seaSurfaceTemperature: number | null;
}

export interface MarineData {
  hourly: MarineHour[];
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

// ============================================================
// Deutsche Städte für DEPulse Live-Ticker
// ============================================================

export const GERMAN_CITIES: City[] = [
  { name: "Berlin", lat: 52.5200, lon: 13.4050 },
  { name: "Hamburg", lat: 53.5511, lon: 9.9937 },
  { name: "München", lat: 48.1351, lon: 11.5820 },
  { name: "Köln", lat: 50.9375, lon: 6.9603 },
  { name: "Frankfurt", lat: 50.1109, lon: 8.6821 },
  { name: "Stuttgart", lat: 48.7758, lon: 9.1829 },
  { name: "Düsseldorf", lat: 51.2277, lon: 6.7735 },
  { name: "Leipzig", lat: 51.3397, lon: 12.3731 },
  { name: "Dortmund", lat: 51.5136, lon: 7.4653 },
  { name: "Dresden", lat: 51.0504, lon: 13.7373 },
  { name: "Hannover", lat: 52.3759, lon: 9.7320 },
  { name: "Nürnberg", lat: 49.4521, lon: 11.0767 },
  { name: "Bremen", lat: 53.0793, lon: 8.8017 },
  { name: "Kiel", lat: 54.3233, lon: 10.1228 },
  { name: "Erfurt", lat: 50.9847, lon: 11.0299 },
  { name: "Magdeburg", lat: 52.1205, lon: 11.6276 },
  { name: "Schwerin", lat: 53.6355, lon: 11.4015 },
  { name: "Potsdam", lat: 52.3906, lon: 13.0645 },
  { name: "Mainz", lat: 49.9929, lon: 8.2473 },
  { name: "Saarbrücken", lat: 49.2402, lon: 6.9969 },
  { name: "Rostock", lat: 54.0924, lon: 12.0991 },
  { name: "Freiburg", lat: 47.9990, lon: 7.8421 },
  { name: "Konstanz", lat: 47.6603, lon: 9.1758 },
  { name: "Zugspitze", lat: 47.4211, lon: 10.9853 },
  { name: "Sylt", lat: 54.9079, lon: 8.3278 },
  { name: "Kassel", lat: 51.3127, lon: 9.4797 },
  { name: "Regensburg", lat: 49.0134, lon: 12.1016 },
  { name: "Lübeck", lat: 53.8655, lon: 10.6866 },
];

/** DWD-Wetterstationen für die DEPulse-Ticker. */
export const DWD_STATIONS = GERMAN_CITIES;

// ============================================================
// French Cities for FR locale
// ============================================================

export const FRENCH_CITIES: City[] = [
  // Grandes Villes
  { name: "Paris", lat: 48.8566, lon: 2.3522 },
  { name: "Marseille", lat: 43.2965, lon: 5.3698 },
  { name: "Lyon", lat: 45.7640, lon: 4.8357 },
  { name: "Toulouse", lat: 43.6047, lon: 1.4442 },
  { name: "Nice", lat: 43.7102, lon: 7.2620 },
  { name: "Nantes", lat: 47.2184, lon: -1.5536 },
  { name: "Strasbourg", lat: 48.5734, lon: 7.7521 },
  { name: "Montpellier", lat: 43.6108, lon: 3.8767 },
  { name: "Bordeaux", lat: 44.8378, lon: -0.5792 },
  { name: "Lille", lat: 50.6292, lon: 3.0573 },
  { name: "Rennes", lat: 48.1173, lon: -1.6778 },
  { name: "Reims", lat: 49.2583, lon: 4.0317 },
  { name: "Saint-Étienne", lat: 45.4397, lon: 4.3872 },
  { name: "Toulon", lat: 43.1242, lon: 5.9280 },
  { name: "Grenoble", lat: 45.1885, lon: 5.7245 },
  { name: "Dijon", lat: 47.3220, lon: 5.0415 },
  { name: "Angers", lat: 47.4784, lon: -0.5532 },
  { name: "Nîmes", lat: 43.8367, lon: 4.3601 },
  { name: "Clermont-Ferrand", lat: 45.7772, lon: 3.0870 },
  { name: "Le Mans", lat: 48.0061, lon: 0.1996 },
  { name: "Aix-en-Provence", lat: 43.5297, lon: 5.4474 },
  { name: "Brest", lat: 48.3904, lon: -4.4861 },
  { name: "Tours", lat: 47.3941, lon: 0.6848 },
  { name: "Amiens", lat: 49.8941, lon: 2.2957 },
  { name: "Limoges", lat: 45.8336, lon: 1.2611 },
  { name: "Annecy", lat: 45.8992, lon: 6.1294 },
  { name: "Perpignan", lat: 42.6986, lon: 2.8956 },
  { name: "Metz", lat: 49.1191, lon: 6.1727 },
  { name: "Besançon", lat: 47.2378, lon: 6.0241 },
  { name: "Orléans", lat: 47.9029, lon: 1.9092 },
  { name: "Rouen", lat: 49.4431, lon: 1.0993 },
  // Villages et lieux célèbres
  { name: "Chamonix", lat: 45.9237, lon: 6.8694 },
  { name: "Rocamadour", lat: 44.7994, lon: 1.6181 },
  { name: "Gordes", lat: 43.9114, lon: 5.2003 },
  { name: "Saint-Malo", lat: 48.6493, lon: -2.0257 },
  { name: "Carcassonne", lat: 43.2122, lon: 2.3537 },
  { name: "Cannes", lat: 43.5528, lon: 7.0174 },
  { name: "Biarritz", lat: 43.4831, lon: -1.5586 },
  { name: "Saint-Tropez", lat: 43.2677, lon: 6.6407 },
  { name: "Colmar", lat: 48.0794, lon: 7.3585 },
  { name: "Troyes", lat: 48.2973, lon: 4.0744 },
  { name: "Avignon", lat: 43.9493, lon: 4.8055 },
  // Belgique francophone (historique dans cette liste)
  { name: "Bruxelles", lat: 50.8503, lon: 4.3517 },
  { name: "Liège", lat: 50.6326, lon: 5.5797 },
  { name: "Namur", lat: 50.4674, lon: 4.8719 },
  { name: "Charleroi", lat: 50.4105, lon: 4.4446 },
];

export const FR_STATIONS = FRENCH_CITIES;

/**
 * Reverse geocode via OpenStreetMap Nominatim: geeft de werkelijke
 * plaatsnaam voor de opgegeven GPS-coördinaten. Gebruikt de exacte
 * locatie van de gebruiker — geen snapping naar KNMI-stations.
 * Valt terug op findNearestCity als de API geen resultaat geeft.
 */
export async function reverseGeocode(lat: number, lon: number, locale = "nl"): Promise<City> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=${locale}&zoom=10`,
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

// ============================================================
// WK Poule Types
// ============================================================

export interface PouleTournament {
  id: string;
  name: string;
  slug: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export interface PouleMatch {
  id: string;
  tournament_id: string;
  api_match_id?: string;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  kickoff: string;
  status: 'scheduled' | 'live' | 'finished';
}

export interface PoulePrediction {
  id: string;
  user_id: string;
  match_id: string;
  home_prediction: number;
  away_prediction: number;
  calculated_points: number;
}

export interface PouleGroup {
  id: string;
  name: string;
  owner_id: string | null;
  invite_code: string;
}

export interface PouleGroupMember {
  group_id: string;
  user_id: string;
  joined_at: string;
}

export interface UserPouleStats {
  user_id: string;
  display_name?: string;
  total_points: number;
  exact_scores: number;
  correct_winners: number;
}
