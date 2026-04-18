// WEERZONE Service Worker — Weather alarm notifications
const CACHE_NAME = "weerzone-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

// Check weather periodically (every 30 min when alarm is active)
self.addEventListener("message", (event) => {
  if (event.data?.type === "CHECK_WEATHER") {
    checkWeatherAlarm(event.data.city, event.data.lat, event.data.lon);
  }
});

async function checkWeatherAlarm(cityName, lat, lon) {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=precipitation&timezone=Europe/Amsterdam&forecast_hours=6`
    );
    const data = await res.json();
    const precip = data.hourly?.precipitation || [];
    const times = data.hourly?.time || [];

    // Check if rain is coming in next 2 hours
    const rainSoon = precip.slice(0, 2).some((p) => p > 0.2);
    if (rainSoon) {
      const firstRainIdx = precip.findIndex((p) => p > 0.2);
      const rainTime = firstRainIdx >= 0 ? new Date(times[firstRainIdx]) : null;
      const timeStr = rainTime
        ? rainTime.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })
        : "binnenkort";

      self.registration.showNotification("WEERZONE — Regen op komst", {
        body: `Regen verwacht in ${cityName} om ${timeStr}. Paraplu mee!`,
        icon: "/favicon-icon.png",
        badge: "/favicon-icon.png",
        tag: "rain-alert",
        renotify: false,
        data: { url: `https://weerzone.nl` },
      });
    }
  } catch (e) {
    console.error("WEERZONE SW: weather check failed", e);
  }
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "https://weerzone.nl";
  event.waitUntil(clients.openWindow(url));
});
