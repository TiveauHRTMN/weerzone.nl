/**
 * WeerZone Impact Engine: De "Antigravity" Core.
 * Integreert Google Maps Platform (Solar, Air Quality) met Weerdata
 * om hyper-lokale fysieke impact te voorspellen.
 */

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

export interface ImpactData {
  airQuality: {
    index: number;
    label: string;
    dominantPollutant: string;
    suggestion: string;
  };
  solar: {
    maxSunshineHours: number;
    solarPotential: "low" | "medium" | "high";
    panelCount: number;
  };
  combinedScore: number; // 0-100
}

/**
 * Haalt Air Quality data op via Google Maps Platform.
 */
export async function fetchAirQuality(lat: number, lon: number) {
  if (!GOOGLE_API_KEY) return null;

  try {
    const res = await fetch(
      `https://airquality.googleapis.com/v1/currentConditions:lookup?key=${GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: { latitude: lat, longitude: lon },
          extraComputations: ["HEALTH_RECOMMENDATIONS", "DOMINANT_POLLUTANT_CONCENTRATION"]
        }),
        next: { revalidate: 3600 } // 1 hour cache
      }
    );

    if (!res.ok) return null;
    const data = await res.json();
    
    const aqi = data.indexes?.[0]?.aqi || 0;
    let label = "Goed";
    if (aqi > 50) label = "Matig";
    if (aqi > 100) label = "Slecht";
    if (aqi > 150) label = "Gevaarlijk";

    return {
      index: aqi,
      label,
      dominantPollutant: data.indexes?.[0]?.dominantPollutant || "Geen",
      suggestion: data.healthRecommendations?.generalPopulation || "Lekker naar buiten."
    };
  } catch (e) {
    console.error("Air Quality fetch error:", e);
    return null;
  }
}

/**
 * Haalt Solar Potential data op via Google Maps Platform.
 */
export async function fetchSolarPotential(lat: number, lon: number) {
  if (!GOOGLE_API_KEY) return null;

  try {
    const res = await fetch(
      `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${lat}&location.longitude=${lon}&key=${GOOGLE_API_KEY}`,
      { next: { revalidate: 86400 } } // 24 hour cache
    );

    if (!res.ok) return null;
    const data = await res.json();

    const sunHours = data.solarPotential?.maxSunshineHoursPerYear || 0;
    let potential: "low" | "medium" | "high" = "low";
    if (sunHours > 900) potential = "medium";
    if (sunHours > 1100) potential = "high";

    return {
      maxSunshineHours: sunHours,
      solarPotential: potential,
      panelCount: data.solarPotential?.maxArrayPanelsCount || 0
    };
  } catch (e) {
    // Vaak geeft de Solar API een 404 als er geen gebouw-data is voor de exacte lat/lon
    return null;
  }
}

/**
 * Combineert weer, luchtkwaliteit en solar tot een "Impact Score".
 */
export async function getImpactAnalysis(lat: number, lon: number): Promise<ImpactData> {
  const [aq, solar] = await Promise.all([
    fetchAirQuality(lat, lon),
    fetchSolarPotential(lat, lon)
  ]);

  // Fallback data
  const result: ImpactData = {
    airQuality: aq || { index: 0, label: "Onbekend", dominantPollutant: "-", suggestion: "Data niet beschikbaar." },
    solar: solar || { maxSunshineHours: 0, solarPotential: "low", panelCount: 0 },
    combinedScore: 75 // Startwaarde
  };

  // Bereken score (simpel algoritme voor nu)
  let score = 70;
  if (result.airQuality.index > 100) score -= 30;
  if (result.solar.solarPotential === "high") score += 10;
  
  result.combinedScore = Math.min(100, Math.max(0, score));

  return result;
}
