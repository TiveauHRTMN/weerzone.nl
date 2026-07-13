import { NextResponse } from "next/server";
import { NL_PLACES, placeRouteSlug } from "@/lib/places-data";
import type { Place } from "@/lib/places-data";

export const dynamic = "force-dynamic";

function norm(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** Lichtgewicht plaats-zoeker voor de dagplan-invuller (max 8 resultaten).
 *  Server-side over NL_PLACES — places.json mag nooit de client-bundle in. */
export async function GET(req: Request) {
  const q = norm(new URL(req.url).searchParams.get("q")?.trim() ?? "");
  if (q.length < 2) return NextResponse.json({ results: [] });
  const starts: Place[] = [];
  const contains: Place[] = [];
  for (const place of NL_PLACES) {
    if (starts.length >= 8) break;
    const name = norm(place.name);
    if (name.startsWith(q)) starts.push(place);
    else if (contains.length < 8 && name.includes(q)) contains.push(place);
  }
  const results = [...starts, ...contains].slice(0, 8).map((place) => ({
    name: place.name,
    province: place.province,
    slug: placeRouteSlug(place),
  }));
  return NextResponse.json({ results });
}
