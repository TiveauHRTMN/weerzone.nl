import { fetchWeatherData } from "../src/lib/weather";

async function run() {
  try {
    const data = await fetchWeatherData(52.7545, 4.9028, "nl", false);

    console.log("HOURLY DATA FOR WINKEL:");
    const hours = data.hourly.slice(0, 48);
    for (const h of hours) {
      // Show only hours where there is at least some CAPE or precipitation or interesting parameters
      if (h.cape > 0 || (h.precipitation ?? 0) > 0 || (h.cin ?? 0) > 0 || (h.liftedIndex ?? 0) < 0) {
        console.log({
          time: h.time,
          temp: h.temperature,
          cape: h.cape,
          cin: h.cin,
          dewPoint: h.dewPoint,
          liftedIndex: h.liftedIndex,
          windShear: h.windShear,
          precip: h.precipitation,
        });
      }
    }
  } catch (err) {
    console.error("Error fetching weather data:", err);
  }
}

run();
