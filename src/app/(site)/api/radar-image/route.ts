import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await fetch(
      "https://api.buienradar.nl/image/1.0/RadarMapNL?w=700&h=765",
      { headers: { "User-Agent": "weerzone.nl/1.0" } }
    );

    if (!res.ok) {
      return new NextResponse(null, { status: res.status });
    }

    const buf = await res.arrayBuffer();
    return new NextResponse(buf, {
      headers: {
        "Content-Type": res.headers.get("Content-Type") ?? "image/png",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
