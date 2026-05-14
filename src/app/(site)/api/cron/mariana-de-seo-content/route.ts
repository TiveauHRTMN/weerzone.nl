import { NextRequest, NextResponse } from "next/server";
import { ALL_PLACES } from "@/lib/places-data";
import { DE_BUNDESLAND_LABELS, PROVINCE_TO_DE_BUNDESLAND } from "@/config/locales";
import { getLocationSEOContent } from "@/app/actions";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * DE SEO content warmup (intern via Hermes 4 70b / Mariana-stack).
 *
 * Genereert per call unieke Duitse SEO-snippets voor een batch Duitse
 * plaatsen en cached ze in seo_injections. Onbeperkt herhaalbaar —
 * bestaande cache-hits worden geskipt.
 *
 * Auth: Bearer MARIANA_SECRET (of CRON_SECRET fallback).
 *
 * Query params:
 *   limit    — max plaatsen per batch (default 25, hard cap 100)
 *   offset   — startpositie (default: daily-bucket rotation)
 *   province — filter op interne province key (e.g. "beieren")
 */
function isAuthorized(request: NextRequest): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  const secret = process.env.MARIANA_SECRET ?? process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const rawLimit = Number(request.nextUrl.searchParams.get("limit") ?? 25);
  const limit = Math.max(1, Math.min(100, Number.isFinite(rawLimit) ? rawLimit : 25));
  const provinceFilter = request.nextUrl.searchParams.get("province") ?? undefined;
  const offsetParam = request.nextUrl.searchParams.get("offset");

  const dePlaces = ALL_PLACES.filter((p) => {
    const bl = PROVINCE_TO_DE_BUNDESLAND[p.province as keyof typeof PROVINCE_TO_DE_BUNDESLAND];
    if (!bl) return false;
    if (provinceFilter && p.province !== provinceFilter) return false;
    return true;
  });

  const totalTargets = dePlaces.length;
  const dailyBucket = Math.floor(Date.now() / 86_400_000);
  const offset = offsetParam !== null
    ? Math.max(0, Number(offsetParam))
    : totalTargets > 0
      ? (dailyBucket * limit) % totalTargets
      : 0;

  const targets = dePlaces.slice(offset, offset + limit);

  const result = {
    generated: 0,
    cacheHits: 0,
    failed: 0,
    offset,
    limit,
    totalTargets,
    province: provinceFilter ?? null,
    samples: [] as Array<{ place: string; bundesland: string; chars: number }>,
    errors: [] as string[],
  };

  for (const place of targets) {
    const bundeslandSlug =
      PROVINCE_TO_DE_BUNDESLAND[place.province as keyof typeof PROVINCE_TO_DE_BUNDESLAND]!;
    const label = DE_BUNDESLAND_LABELS[bundeslandSlug] ?? bundeslandSlug;
    try {
      const before = Date.now();
      const text = await getLocationSEOContent(place.name, label, place.character, "de");
      const elapsed = Date.now() - before;
      // Fast (<50ms) is bijna zeker een cache hit (Supabase round-trip).
      if (elapsed < 250) {
        result.cacheHits++;
      } else {
        result.generated++;
      }
      if (result.samples.length < 5) {
        result.samples.push({ place: place.name, bundesland: label, chars: text.length });
      }
    } catch (e) {
      result.failed++;
      if (result.errors.length < 10) {
        result.errors.push(`${place.name} (${bundeslandSlug}): ${(e as Error).message ?? "unknown"}`);
      }
    }
  }

  return NextResponse.json(result);
}
