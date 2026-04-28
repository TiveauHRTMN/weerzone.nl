import { Client } from '@googlemaps/google-maps-services-js';

// De standaard Google Maps Services client (voor geocoding, places, routing)
export const mapsClient = new Client({});

/**
 * Google Maps Air Quality API (Onderdeel van Environment APIs)
 * Extreem belangrijk voor Piet's astma/gezondheidsadvies.
 */
export async function getAirQuality(lat: number, lon: number) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_MAPS_API_KEY is niet ingesteld.");

  const url = `https://airquality.googleapis.com/v1/currentConditions:lookup?key=${apiKey}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      location: { latitude: lat, longitude: lon },
      extraComputations: [
        "HEALTH_RECOMMENDATIONS", 
        "DOMINANT_POLLUTANT_CONCENTRATION", 
        "POLLUTANT_CONCENTRATION"
      ]
    })
  });
  
  if (!response.ok) {
    throw new Error(`Air Quality API error: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Google Maps Solar API
 * Extreem belangrijk voor Steve's energie- en zonnepanelen advies.
 */
export async function getSolarPotential(lat: number, lon: number) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const url = `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${lat}&location.longitude=${lon}&requiredQuality=HIGH&key=${apiKey}`;
  
  const response = await fetch(url);
  return response.json();
}
