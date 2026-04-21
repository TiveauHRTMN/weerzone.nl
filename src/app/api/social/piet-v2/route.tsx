import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get("city") || "Nederland";
    
    return new ImageResponse(
      (
        <div style={{
          height: "100%", width: "100%", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", backgroundColor: "#0ea5e9",
          color: "white", fontWeight: 900, fontFamily: "sans-serif"
        }}>
          <div style={{ fontSize: 60, marginBottom: 20 }}>WEERZONE</div>
          <div style={{ fontSize: 120 }}>{city.toUpperCase()}</div>
          <div style={{ fontSize: 40, marginTop: 40, opacity: 0.8 }}>SYSTEEM TEST OK</div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  } catch (e: any) {
    return new Response(`Error: ${e.message}`, { status: 500 });
  }
}


