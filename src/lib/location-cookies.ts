import { cookies } from "next/headers";

export async function getSavedLocationServer() {
  const cookieStore = await cookies();
  const lat = cookieStore.get("wz_lat")?.value;
  const lon = cookieStore.get("wz_lon")?.value;
  const name = cookieStore.get("wz_name")?.value;

  if (lat && lon) {
    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    if (!isNaN(latNum) && !isNaN(lonNum)) {
      return { lat: latNum, lon: lonNum, name: name || "Jouw locatie" };
    }
  }
  return null;
}
