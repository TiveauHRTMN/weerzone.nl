import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city") || "Nederland";
  const temp = searchParams.get("temp") || "?";
  const emoji = searchParams.get("emoji") || "🌤️";
  const desc = searchParams.get("desc") || "";
  const feels = searchParams.get("feels") || temp;
  const wind = searchParams.get("wind") || "0";
  const rain = searchParams.get("rain") || "0";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #4a9ee8 0%, #2980B9 50%, #1e5a8a 100%)",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative sun glow */}
        <div
          style={{
            position: "absolute",
            top: "-40px",
            right: "-40px",
            width: "200px",
            height: "200px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,225,0,0.3) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Content */}
        <div style={{ display: "flex", flexDirection: "column", padding: "48px 56px", flex: 1 }}>
          {/* City name */}
          <div
            style={{
              fontSize: "28px",
              fontWeight: 600,
              color: "rgba(255,255,255,0.7)",
              display: "flex",
              letterSpacing: "1px",
            }}
          >
            {city.toUpperCase()}
          </div>

          {/* Temperature + emoji */}
          <div style={{ display: "flex", alignItems: "center", gap: "24px", marginTop: "16px" }}>
            <div style={{ display: "flex", alignItems: "flex-start" }}>
              <span style={{ fontSize: "140px", fontWeight: 900, color: "white", lineHeight: 1, letterSpacing: "-6px", display: "flex" }}>
                {temp}
              </span>
              <span style={{ fontSize: "48px", fontWeight: 700, color: "rgba(255,255,255,0.8)", marginTop: "16px", display: "flex" }}>
                °C
              </span>
            </div>
            <span style={{ fontSize: "96px", display: "flex" }}>{emoji}</span>
          </div>

          {/* Description */}
          {desc && (
            <div
              style={{
                fontSize: "24px",
                fontWeight: 600,
                color: "rgba(255,255,255,0.85)",
                marginTop: "16px",
                maxWidth: "80%",
                display: "flex",
              }}
            >
              {desc}
            </div>
          )}

          {/* Stats row */}
          <div style={{ display: "flex", gap: "24px", marginTop: "auto" }}>
            <div style={{
              background: "rgba(255,255,255,0.15)",
              borderRadius: "16px",
              padding: "12px 20px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}>
              <span style={{ fontSize: "18px", display: "flex" }}>🌡️</span>
              <span style={{ fontSize: "16px", fontWeight: 700, color: "white", display: "flex" }}>Voelt als {feels}°</span>
            </div>
            <div style={{
              background: "rgba(255,255,255,0.15)",
              borderRadius: "16px",
              padding: "12px 20px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}>
              <span style={{ fontSize: "18px", display: "flex" }}>💨</span>
              <span style={{ fontSize: "16px", fontWeight: 700, color: "white", display: "flex" }}>{wind} km/h</span>
            </div>
            {parseFloat(rain) > 0 && (
              <div style={{
                background: "rgba(255,255,255,0.15)",
                borderRadius: "16px",
                padding: "12px 20px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}>
                <span style={{ fontSize: "18px", display: "flex" }}>🌧️</span>
                <span style={{ fontSize: "16px", fontWeight: 700, color: "white", display: "flex" }}>{rain}mm</span>
              </div>
            )}
          </div>
        </div>

        {/* Brand bar */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 56px",
          background: "rgba(0,0,0,0.15)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "24px", fontWeight: 800, color: "white", display: "flex" }}>WEERZONE</span>
            <span style={{ fontSize: "14px", fontWeight: 500, color: "rgba(255,255,255,0.5)", display: "flex" }}>weerzone.nl</span>
          </div>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.4)", display: "flex" }}>48 uur. De rest is ruis.</span>
        </div>
      </div>
    ),
    { width: 1080, height: 1080 }
  );
}
