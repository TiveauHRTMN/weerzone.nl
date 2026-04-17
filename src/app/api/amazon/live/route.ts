import { NextResponse } from "next/server";
import { hydrateWithLive } from "@/lib/amazon-live";
import { CATALOG } from "@/lib/amazon-catalog";

// Geeft alle catalogus-producten terug verrijkt met live PA-API data
// (waar beschikbaar in cache). Geen on-the-fly PA-API calls.

export const revalidate = 600; // 10 min edge-cache

export async function GET() {
  const hydrated = await hydrateWithLive(CATALOG);
  return NextResponse.json(
    { products: hydrated, ts: Date.now() },
    { headers: { "cache-control": "public, s-maxage=600, stale-while-revalidate=1800" } },
  );
}
