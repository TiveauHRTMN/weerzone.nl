
import { matchProducts } from '../src/lib/amazon-matcher';
import { WeatherData } from '../src/lib/types';

const mockWeather: WeatherData = {
  current: {
    temperature: 28,
    feelsLike: 30,
    humidity: 40,
    windSpeed: 10,
    windDirection: "N",
    windGusts: 15,
    weatherCode: 0,
    isDay: true,
    precipitation: 0,
    cloudCover: 0,
  },
  minutely: [],
  hourly: Array(48).fill(0).map((_, i) => ({
    time: new Date(Date.now() + i * 3600000).toISOString(),
    temperature: 28,
    apparentTemperature: 30,
    weatherCode: 0,
    precipitation: 0,
    windSpeed: 10,
    cape: 0,
    confidence: "high"
  })),
  daily: [
    {
      date: new Date().toISOString(),
      tempMax: 30,
      tempMin: 20,
      precipitationSum: 0,
      weatherCode: 0,
      windSpeedMax: 15,
      sunHours: 12
    }
  ],
  uvIndex: 9,
  sunrise: new Date().toISOString(),
  sunset: new Date().toISOString(),
  models: { agreement: 100, label: "Perfect", sources: ["KNMI"] }
};

const result = matchProducts(mockWeather, 3);
console.log("Matched Products for Heatwave + High UV:");
console.log(JSON.stringify(result.products.map(p => ({ title: p.title, tags: p.tags })), null, 2));
console.log("Context Tags:", Array.from(result.ctx.tags.entries()));
