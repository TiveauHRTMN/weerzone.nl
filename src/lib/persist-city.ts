/**
 * Sla de geselecteerde stad op in zowel localStorage als cookies.
 * localStorage → client-side lezen (de dashboard-componenten)
 * Cookies → server-side lezen (SSR via getSavedLocationServer voor juiste SSR-data)
 */
export function persistCity(city: { name: string; lat: number; lon: number }) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem("wz_city", JSON.stringify(city));
  } catch {}

  const maxAge = 60 * 60 * 24 * 365; // 1 jaar
  document.cookie = `wz_lat=${city.lat};path=/;max-age=${maxAge};SameSite=Lax`;
  document.cookie = `wz_lon=${city.lon};path=/;max-age=${maxAge};SameSite=Lax`;
  document.cookie = `wz_name=${encodeURIComponent(city.name)};path=/;max-age=${maxAge};SameSite=Lax`;
}

export function readPersistedCity(): { name: string; lat: number; lon: number } | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem("wz_city");
    if (stored) {
      const city = JSON.parse(stored) as { name?: string; lat?: number; lon?: number };
      if (typeof city.lat === "number" && typeof city.lon === "number") {
        return { name: city.name || "Jouw locatie", lat: city.lat, lon: city.lon };
      }
    }
  } catch {}

  const values = Object.fromEntries(
    document.cookie.split("; ").map((entry) => {
      const separator = entry.indexOf("=");
      return separator < 0 ? [entry, ""] : [entry.slice(0, separator), entry.slice(separator + 1)];
    }),
  );
  const lat = Number.parseFloat(values.wz_lat ?? "");
  const lon = Number.parseFloat(values.wz_lon ?? "");
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  let name = "Jouw locatie";
  try {
    if (values.wz_name) name = decodeURIComponent(values.wz_name);
  } catch {}
  return { name, lat, lon };
}
