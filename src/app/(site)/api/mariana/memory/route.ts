import { NextRequest, NextResponse } from "next/server";
import { badMarianaRequest, isMarianaAuthorized, marianaUnauthorized } from "@/lib/mariana/http";
import { toMarianaLocation } from "@/lib/mariana/location";
import { getMarianaMemory } from "@/lib/mariana/service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isMarianaAuthorized(request)) return marianaUnauthorized();

  const locationId = request.nextUrl.searchParams.get("locationId");
  const lat = Number(request.nextUrl.searchParams.get("lat"));
  const lon = Number(request.nextUrl.searchParams.get("lon"));
  const name = request.nextUrl.searchParams.get("name") ?? undefined;
  const resolvedLocationId = locationId ?? (
    Number.isFinite(lat) && Number.isFinite(lon)
      ? toMarianaLocation({ lat, lon, name }).locationId
      : null
  );

  if (!resolvedLocationId) {
    return badMarianaRequest("Provide locationId or lat/lon");
  }

  const memory = await getMarianaMemory(resolvedLocationId);
  return NextResponse.json({ locationId: resolvedLocationId, memory });
}
