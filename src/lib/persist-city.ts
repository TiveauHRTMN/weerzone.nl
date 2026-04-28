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
