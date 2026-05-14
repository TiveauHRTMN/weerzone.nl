import { NextRequest, NextResponse } from "next/server";
import { isMarianaAuthorized, marianaUnauthorized } from "@/lib/mariana/http";
import { getMarianaPlaceTargetCount, getMarianaPlaceTargets } from "@/lib/mariana/place-index";
import { seedMarianaLocationMemory } from "@/lib/mariana/storage";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  if (!isMarianaAuthorized(request)) return marianaUnauthorized();

  const limit = Number(request.nextUrl.searchParams.get("limit") ?? 250);
  const province = request.nextUrl.searchParams.get("province") ?? undefined;
  const totalTargets = getMarianaPlaceTargetCount({ province });
  const requestedOffset = request.nextUrl.searchParams.get("offset");
  const dailyBucket = Math.floor(Date.now() / 86_400_000);
  const offset = requestedOffset !== null
    ? Number(requestedOffset)
    : totalTargets > 0
      ? (dailyBucket * Math.max(1, Math.min(1000, limit))) % totalTargets
      : 0;
  const targets = getMarianaPlaceTargets({ limit, offset, province });

  const result = {
    indexed: 0,
    failed: 0,
    offset,
    limit: Math.max(1, Math.min(1000, limit)),
    totalTargets,
    province: province ?? null,
    errors: [] as string[],
  };

  for (const target of targets) {
    const seeded = await seedMarianaLocationMemory(target.location);
    if (seeded.ok) {
      result.indexed++;
    } else {
      result.failed++;
      if (result.errors.length < 10) {
        result.errors.push(`${target.location.locationId}: ${seeded.reason ?? "unknown"}`);
      }
    }
  }

  return NextResponse.json(result);
}
