import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  // 1. Directe fetch (zonder extra functies)
  const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=52.11&longitude=5.18&current=temperature_2m,weather_code&timezone=Europe/Amsterdam");
  const data = await res.json();
  const temp = Math.round(data.current.temperature_2m);
  
  // 2. Simpele opmaak (geen schaduwen, geen gradients die kunnen falen)
  return new ImageResponse(
    (
      <div style={{
        width: "100%", height: "100%", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", background: "#0284c7", color: "white",
      }}>
        <div style={{ fontSize: "60px", marginBottom: "20px" }}>LANDELIJK WEER</div>
        <div style={{ fontSize: "200px", fontWeight: 900 }}>{temp}°</div>
        <div style={{ fontSize: "40px", marginTop: "20px" }}>WEERZONE.NL — PIET IS TERUG</div>
      </div>
    ),
    { width: 1080, height: 1350 }
  );
}
