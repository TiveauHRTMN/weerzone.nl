
import { fetchWeatherData, getNeuralInsights } from "../src/lib/weather";
import { DUTCH_CITIES } from "../src/lib/types";

async function compareModels() {
  const city = DUTCH_CITIES[0]; // De Bilt
  console.log(`Comparing models for ${city.name} (${city.lat}, ${city.lon})...`);

  try {
    const weather = await fetchWeatherData(city.lat, city.lon);
    if (!weather) {
      console.error("Failed to fetch weather data.");
      return;
    }

    const neural = await getNeuralInsights(city.lat, city.lon, weather);
    if (!neural) {
      console.error("Failed to fetch neural insights. Check if GEMINI_API_KEY is valid and network is accessible.");
      // Provide a mock for now to demonstrate the comparison logic if API fails
      console.log("Using simulated Neural Data for demonstration...");
      const mockNeural = {
        metNetNowcast: "Lichte neerslag verwacht rond 14:30. Intensiteit 0.5mm/u.",
        seedScenario: "80% kans op aanhoudende bewolking, 20% kans op lokale opklaringen.",
        neuralGcmImpact: "Geen significante afwijkingen gedetecteerd.",
        opticalDepth: 45,
        solarRadiation: 150,
        windTurbulence: "Low",
        lightningRisk: 5,
        stormSeverity: 2
      };
      analyze(weather, mockNeural as any);
    } else {
      analyze(weather, neural);
    }
  } catch (error) {
    console.error("Comparison failed:", error);
  }
}

function analyze(weather: any, neural: any) {
    // Tomorrow afternoon window (e.g., 12:00 - 18:00)
    const now = new Date("2026-04-25T10:00:00"); // Fix date to match system date
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    
    const startHour = 12;
    const endHour = 18;
    
    const afternoonForecast = weather.hourly.filter((h: any) => {
      const d = new Date(h.time);
      return d.getDate() === tomorrow.getDate() && d.getHours() >= startHour && d.getHours() <= endHour;
    });

    console.log("\n--- HARMONIE (KNMI) Tomorrow Afternoon (" + tomorrow.toDateString() + ") ---");
    afternoonForecast.forEach((h: any) => {
      const time = new Date(h.time).toLocaleTimeString("nl-NL", { hour: '2-digit', minute: '2-digit' });
      console.log(`${time}: ${h.temperature}°C, ${h.precipitation}mm, code ${h.weatherCode}`);
    });

    console.log("\n--- MetNet-3 (Neural) Insights ---");
    console.log("Nowcast:", neural.metNetNowcast);
    console.log("Scenario:", neural.seedScenario);
    console.log("Lightning Risk:", neural.lightningRisk + "%");
    console.log("Storm Severity:", neural.stormSeverity);

    // Reliability Index Calculation for Precipitation Peak
    // 1. Check if Harmonie sees a peak
    const harmoniePeak = Math.max(...afternoonForecast.map((h: any) => h.precipitation));
    
    // 2. Cross-reference with Neural Nowcast/Scenario (heuristic)
    let reliabilityScore = 50; // Base score
    
    const neuralPrecipIndicated = 
      neural.metNetNowcast?.toLowerCase().includes("neerslag") || 
      neural.metNetNowcast?.toLowerCase().includes("regen") ||
      neural.metNetNowcast?.toLowerCase().includes("bui") ||
      neural.seedScenario?.toLowerCase().includes("kans op neerslag") ||
      (neural.stormSeverity ?? 0) > 4;

    if (harmoniePeak > 0 && neuralPrecipIndicated) {
      reliabilityScore += 30; // Both indicate activity
    } else if (harmoniePeak === 0 && !neuralPrecipIndicated) {
      reliabilityScore += 40; // Both indicate dry
    } else {
      reliabilityScore -= 20; // Divergence
    }

    // Add factor based on lightning risk
    if ((neural.lightningRisk ?? 0) > 50) reliabilityScore -= 10; // Instability reduces reliability

    const finalIndex = Math.min(100, Math.max(0, reliabilityScore));

    console.log("\n--- RELIABILITY INDEX (Precipitation Peak) ---");
    console.log(`Index: ${finalIndex}/100`);
    if (finalIndex > 80) console.log("Status: ZEER BETROUWBAAR");
    else if (finalIndex > 60) console.log("Status: GOED");
    else if (finalIndex > 40) console.log("Status: MATIG");
    else console.log("Status: ONZEKER / DIVERGENTIE");
}

  } catch (error) {
    console.error("Comparison failed:", error);
  }
}

compareModels();
