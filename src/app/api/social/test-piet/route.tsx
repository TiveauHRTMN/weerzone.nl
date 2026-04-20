import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  // Ultra-simpele test om te zien of Satori überhaupt wat tekent
  return new ImageResponse(
    (
      <div style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(to bottom, #0284c7, #0369a1)",
        color: "white",
      }}>
        <h1 style={{ fontSize: "100px", fontWeight: 900 }}>WEERZONE</h1>
        <p style={{ fontSize: "40px" }}>TEST RENDER — ALS JE DIT ZIET WERKT HET</p>
      </div>
    ),
    { width: 1080, height: 1350 }
  );
}
