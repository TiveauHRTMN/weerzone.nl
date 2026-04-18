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
        {/* Globe */}
        <div
          style={{
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #4BA3E3 0%, #1A6FA0 100%)",
            border: "3px solid rgba(255,255,255,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            boxShadow: "0 8px 32px rgba(0,0,0,0.2), inset 0 -4px 12px rgba(0,0,0,0.1)",
          }}
        >
          {/* W on globe */}
          <div
            style={{
              fontSize: "64px",
              fontWeight: 900,
              color: "white",
              display: "flex",
              textShadow: "0 2px 4px rgba(0,0,0,0.2)",
            }}
          >
            W
          </div>

          {/* Sun overlapping top-right */}
          <div
            style={{
              position: "absolute",
              top: "-16px",
              right: "-20px",
              width: "52px",
              height: "52px",
              borderRadius: "50%",
              background: "radial-gradient(circle, #FFE566 0%, #FFB340 100%)",
              boxShadow: "0 0 24px 8px rgba(255,217,61,0.4)",
              display: "flex",
            }}
          />
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: "72px",
            fontWeight: 900,
            color: "white",
            letterSpacing: "-2px",
            marginTop: "24px",
            display: "flex",
          }}
        >
          WEERZONE
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: "28px",
            fontWeight: 500,
            color: "rgba(255,255,255,0.85)",
            marginTop: "8px",
            display: "flex",
          }}
        >
          48 uur. De rest is ruis.
        </div>

        {/* Tags */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginTop: "32px",
          }}
        >
          {["KNMI HARMONIE", "DWD ICON", "Brutaal nauwkeurig"].map(
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
