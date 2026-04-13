
async function fetchWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,weather_code,wind_speed_10m,precipitation` +
    `&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum&timezone=Europe/Amsterdam&forecast_days=2`;
  const res = await fetch(url);
  return res.json();
}

fetchWeather(52.74, 4.90).then(data => {
  console.log(JSON.stringify(data, null, 2));
});
