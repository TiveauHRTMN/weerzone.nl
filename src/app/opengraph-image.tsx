import { ImageResponse } from "next/og";

export const alt = "WEERZONE - 48 uur vooruit, voor beslissingen vandaag en morgen.";
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
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            background: "rgba(255,255,255,0.1)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "48px",
            padding: "60px 80px",
            boxShadow: "0 40px 100px rgba(0,0,0,0.15)",
          }}
        >
          <div
            style={{
              background: "#ffd60a",
              color: "black",
              padding: "6px 16px",
              borderRadius: "99px",
              fontSize: "14px",
              fontWeight: 900,
              letterSpacing: "3px",
              marginBottom: "32px",
              display: "flex",
            }}
          >
            WEERZONE
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "24px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                fontSize: "110px",
                fontWeight: 900,
                color: "white",
                letterSpacing: "-5px",
                display: "flex",
              }}
            >
              48 UUR
            </div>
          </div>

          <div
            style={{
              fontSize: "36px",
              fontWeight: 600,
              color: "rgba(255,255,255,0.8)",
              letterSpacing: "4px",
              textTransform: "uppercase",
              display: "flex",
              textAlign: "center",
            }}
          >
            Voor beslissingen vandaag en morgen.
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
