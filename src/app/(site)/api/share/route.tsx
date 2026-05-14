import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getWeatherEmoji, getWeatherDescription } from "@/lib/weather";

export const runtime = "nodejs";

function getOneLiner(temp: number, precip: number, code: number): string {
  if (code >= 95) return "Bliksem, donder, drama. Blijf binnen.";
  if (precip > 5) return "Noach bouwde voor minder een boot. Succes.";
  if (temp > 25) return "Barbecue-weer. Je buren ruiken het al.";
  if (temp < 5) return "Trek een extra trui aan, watje.";
  if (code <= 1 && temp > 15) return "Perfecte dag. Maar morgen is het weer voorbij.";
  return "Gewoon Nederlands weer. Niet zeuren.";
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city") || "Nederland";
  const tempStr = searchParams.get("temp") || "10";
  const codeStr = searchParams.get("code") || "0";
  const feelsStr = searchParams.get("feels") || tempStr;
  const windStr = searchParams.get("wind") || "0";
  const rainStr = searchParams.get("rain") || "0";
  const isDay = searchParams.get("day") !== "false";

  const temp = parseInt(tempStr);
  const code = parseInt(codeStr);
  const rain = parseFloat(rainStr);
  
  const emoji = getWeatherEmoji(code, isDay);
  const desc = getWeatherDescription(code);
  const oneLiner = getOneLiner(temp, rain, code);

  // Background colors: Sky blue theme
  const bgGradient = isDay 
    ? "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)"
    : "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: bgGradient,
          fontFamily: "Inter, system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
          color: "white",
        }}
      >
        {/* Sun/Moon Accent */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-100px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: isDay 
              ? "radial-gradient(circle, rgba(234, 179, 8, 0.4) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(148, 163, 184, 0.2) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Top Bar: Hyperlocal Badge */}
        <div style={{ display: "flex", padding: "40px 60px", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "8px", 
            background: "rgba(255,255,255,0.1)", 
            padding: "8px 16px", 
            borderRadius: "99px",
            border: "1px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(10px)",
          }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e" }} />
            <span style={{ fontSize: "14px", fontWeight: 700, letterSpacing: "1px", color: "rgba(255,255,255,0.9)" }}>HYPERLOKAAL</span>
          </div>
          <span style={{ fontSize: "18px", fontWeight: 500, color: "rgba(255,255,255,0.6)" }}>{new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </div>

        {/* Main Content */}
        <div style={{ display: "flex", flexDirection: "column", padding: "20px 60px", flex: 1 }}>
          <div style={{ fontSize: "80px", fontWeight: 900, letterSpacing: "-2px", marginBottom: "10px" }}>
            {city}
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "40px" }}>
            <div style={{ display: "flex", alignItems: "flex-start" }}>
              <span style={{ fontSize: "180px", fontWeight: 900, lineHeight: 0.9 }}>{temp}</span>
              <span style={{ fontSize: "60px", fontWeight: 700, marginTop: "20px", color: "#eab308" }}>°</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "96px" }}>{emoji}</span>
              <span style={{ fontSize: "28px", fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>{desc}</span>
            </div>
          </div>

          {/* Cynical One-Liner */}
          <div style={{ 
            marginTop: "40px", 
            background: "rgba(0,0,0,0.2)", 
            padding: "24px 32px", 
            borderRadius: "24px",
            border: "1px solid rgba(255,255,255,0.1)",
            maxWidth: "700px",
            display: "flex",
            flexDirection: "column",
            gap: "8px"
          }}>
            <span style={{ fontSize: "12px", fontWeight: 800, color: "#eab308", letterSpacing: "2px" }}>WEERZONE STATUS</span>
            <span style={{ fontSize: "28px", fontWeight: 600, fontStyle: "italic", lineHeight: 1.3 }}>
              "{oneLiner}"
            </span>
          </div>
        </div>

        {/* Bottom Details Bar */}
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          padding: "40px 60px",
          background: "rgba(0,0,0,0.15)",
          backdropFilter: "blur(20px)",
        }}>
          <div style={{ display: "flex", gap: "48px" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>Gevoel</span>
              <span style={{ fontSize: "24px", fontWeight: 700 }}>{feelsStr}°</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>Wind</span>
              <span style={{ fontSize: "24px", fontWeight: 700 }}>{windStr} <span style={{ fontSize: "14px", fontWeight: 500 }}>km/u</span></span>
            </div>
            {rain > 0 && (
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>Neerslag</span>
                <span style={{ fontSize: "24px", fontWeight: 700, color: "#fbbf24" }}>{rainStr} mm</span>
              </div>
            )}
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "28px", fontWeight: 900, color: "white" }}>WEERZONE</span>
              <div style={{ padding: "4px 8px", background: "#eab308", color: "#000", fontWeight: 800, fontSize: "12px", borderRadius: "4px" }}>PRO</div>
            </div>
            <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>48 uur. De rest is ruis.</span>
          </div>
        </div>
      </div>
    ),
    { width: 1080, height: 1080 }
  );
}
