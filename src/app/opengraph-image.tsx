import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "WEERZONE — 48 uur. De rest is ruis.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(160deg, #0ea5e9 0%, #0284c7 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          padding: "60px",
        }}
      >
        {/* Subtle glow accent */}
        <div style={{
          position: "absolute", top: "-100px", right: "-100px", width: "400px", height: "400px",
          borderRadius: "50%", background: "radial-gradient(circle, rgba(255,214,10,0.15) 0%, transparent 70%)"
        }} />

        {/* Brand Container */}
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          background: "rgba(255,255,255,0.1)", backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.15)", borderRadius: "48px",
          padding: "60px 80px", boxShadow: "0 40px 100px rgba(0,0,0,0.15)"
        }}>
          {/* Badge */}
          <div style={{
            background: "#ffd60a", color: "black", padding: "6px 16px", borderRadius: "99px",
            fontSize: "14px", fontWeight: 900, letterSpacing: "3px", marginBottom: "32px", display: "flex"
          }}>
            NL WEATHER PRO
          </div>

          <div style={{
            display: "flex", alignItems: "center", gap: "24px", marginBottom: "16px"
          }}>
            <div style={{
              fontSize: "110px", fontWeight: 900, color: "white", letterSpacing: "-5px", display: "flex"
            }}>
              WEERZONE
            </div>
            <div style={{
              fontSize: "110px", fontWeight: 900, color: "white", letterSpacing: "-5px", marginLeft: "-15px", display: "flex"
            }}>
              .nl
            </div>
          </div>

          <div style={{
             fontSize: "36px", fontWeight: 600, color: "rgba(255,255,255,0.8)",
             letterSpacing: "8px", textTransform: "uppercase", display: "flex"
          }}>
            48 uur. De rest is ruis.
          </div>
        </div>

        {/* Verification Footer */}
        <div style={{
          position: "absolute", bottom: "50px", display: "flex", alignItems: "center", gap: "12px",
          color: "rgba(255,255,255,0.4)", fontSize: "16px", fontWeight: 700, letterSpacing: "2px"
        }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e" }} />
          DATA: KNMI HARMONIE LIVE · HYPERLOKAAL
        </div>
      </div>
    ),
    { ...size }
  );
}
