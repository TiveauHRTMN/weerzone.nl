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
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  sunrise: string;
  sunset: string;
  uvIndex: number;
}

export interface HourlyForecast {
  time: string;
  temperature: number;
  weatherCode: number;
  precipitation: number;
}

export interface DailyForecast {
  date: string;
  tempMax: number;
  tempMin: number;
  weatherCode: number;
  precipitationSum: number;
  windSpeedMax: number;
}

export interface City {
  name: string;
  lat: number;
  lon: number;
}

export const DUTCH_CITIES: City[] = [
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
  { name: "Alkmaar", lat: 52.6324, lon: 4.7534 },
  { name: "Haarlem", lat: 52.3874, lon: 4.6462 },
  { name: "Arnhem", lat: 51.9851, lon: 5.8987 },
  { name: "Maastricht", lat: 50.8514, lon: 5.6910 },
  { name: "Leiden", lat: 52.1601, lon: 4.4970 },
  { name: "Zwolle", lat: 52.5168, lon: 6.0830 },
  { name: "Leeuwarden", lat: 53.2012, lon: 5.7999 },
  { name: "Den Bosch", lat: 51.6978, lon: 5.3037 },
];
