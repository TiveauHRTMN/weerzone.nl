import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "WeerZone — Het weer, maar dan eerlijk";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #4BA3E3 0%, #2980B9 50%, #1A5276 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Sun */}
        <div
          style={{
            position: "absolute",
            top: "60px",
            right: "120px",
            width: "100px",
            height: "100px",
            borderRadius: "50%",
            background: "radial-gradient(circle, #FFD93D 0%, #F0A040 100%)",
            boxShadow: "0 0 60px 20px rgba(255,217,61,0.3)",
            display: "flex",
          }}
        />

        {/* Cloud */}
        <div
          style={{
            position: "absolute",
            top: "80px",
            left: "100px",
            width: "160px",
            height: "60px",
            borderRadius: "30px",
            background: "rgba(255,255,255,0.7)",
            display: "flex",
          }}
        />

        {/* Title */}
        <div
          style={{
            fontSize: "72px",
            fontWeight: 900,
            color: "white",
            letterSpacing: "-2px",
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <span style={{ fontSize: "64px" }}>🌤️</span>
          WeerZone
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: "28px",
            fontWeight: 500,
            color: "rgba(255,255,255,0.85)",
            marginTop: "16px",
            display: "flex",
          }}
        >
          Het weer, maar dan eerlijk.
        </div>

        {/* Tags */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginTop: "32px",
          }}
        >
          {["KNMI HARMONIE", "DWD ICON", "48-uurs voorspelling"].map(
            (tag) => (
              <div
                key={tag}
                style={{
                  background: "rgba(255,255,255,0.15)",
                  border: "1px solid rgba(255,255,255,0.25)",
                  borderRadius: "20px",
                  padding: "8px 20px",
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.9)",
                  display: "flex",
                }}
              >
                {tag}
              </div>
            )
          )}
        </div>

        {/* URL */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            fontSize: "20px",
            fontWeight: 600,
            color: "rgba(255,255,255,0.5)",
            display: "flex",
          }}
        >
          weerzone.nl
        </div>
      </div>
    ),
    { ...size }
  );
}
