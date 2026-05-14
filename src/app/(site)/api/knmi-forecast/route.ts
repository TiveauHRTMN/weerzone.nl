import { NextResponse } from "next/server";
import { fetchKNMIShortForecast } from "@/lib/knmi-edr";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!process.env.KNMI_ODA_API_KEY && !process.env.KNMI_API_KEY) {
    return NextResponse.json({ error: "KNMI_ODA_API_KEY not configured" }, { status: 503 });
  }

  const forecast = await fetchKNMIShortForecast();
  if (!forecast) {
    return NextResponse.json({ error: "Geen verwachting beschikbaar" }, { status: 502 });
  }

  return NextResponse.json(
    { forecast },
    { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=300" } }
  );
}
