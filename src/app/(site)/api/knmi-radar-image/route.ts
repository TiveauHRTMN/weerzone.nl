import { NextResponse } from "next/server";
import { renderKnmiRadar } from "@/lib/knmi-radar-render";

// h5wasm draait WASM → Node-runtime (geen edge). Cache 5 min op de CDN.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const render = await renderKnmiRadar();
    if (!render) {
      return NextResponse.json({ error: "radar unavailable" }, { status: 503 });
    }
    return new NextResponse(new Uint8Array(render.png), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=120",
        "X-Radar-Time": render.time ?? "",
      },
    });
  } catch (err) {
    console.error("KNMI radar render failed:", err);
    return NextResponse.json({ error: "radar render error" }, { status: 500 });
  }
}
