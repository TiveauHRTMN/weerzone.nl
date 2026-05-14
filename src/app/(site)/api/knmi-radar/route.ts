import { NextResponse } from "next/server";
import { fetchLatestRadarFile } from "@/lib/knmi-edr";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!process.env.KNMI_ODA_API_KEY && !process.env.KNMI_API_KEY) {
    return NextResponse.json({ error: "KNMI_ODA_API_KEY not configured" }, { status: 503 });
  }

  const file = await fetchLatestRadarFile();
  if (!file) {
    return NextResponse.json({ error: "No radar file available" }, { status: 502 });
  }

  return NextResponse.json(file, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
  });
}
