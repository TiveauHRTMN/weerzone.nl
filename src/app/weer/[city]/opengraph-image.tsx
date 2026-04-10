import { ImageResponse } from "next/og";
import { DUTCH_CITIES } from "@/lib/types";

export const runtime = "edge";
export const alt = "WeerZone — Weer per stad";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city: slug } = await params;
  const cityObj = DUTCH_CITIES.find(
    (c) => c.name.toLowerCase().replace(/\s+/g, "-") === slug
  );
  const cityName = cityObj?.name || slug;

  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0c1a2e 100%)",
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
        {/* Sun glow */}
        <div
          style={{
            position: "absolute",
            top: "60px",
            right: "120px",
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            background: "radial-gradient(circle, #FFE566 0%, #FFB340 60%, transparent 100%)",
            boxShadow: "0 0 80px 40px rgba(255,217,61,0.2)",
            display: "flex",
          }}
        />

        {/* City name */}
        <div
          style={{
            fontSize: "96px",
            fontWeight: 900,
            color: "white",
            letterSpacing: "-3px",
            display: "flex",
            textShadow: "0 4px 24px rgba(0,0,0,0.3)",
          }}
        >
          {cityName}
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: "32px",
            fontWeight: 600,
            color: "rgba(255,255,255,0.7)",
            marginTop: "8px",
            display: "flex",
          }}
        >
          48 uur extreem nauwkeurig weer
        </div>

        {/* Models tags */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginTop: "32px",
          }}
        >
          {["KNMI HARMONIE", "DWD ICON"].map((tag) => (
            <div
              key={tag}
              style={{
                background: "rgba(255,122,47,0.25)",
                border: "1px solid rgba(255,122,47,0.4)",
                borderRadius: "20px",
                padding: "8px 24px",
                fontSize: "18px",
                fontWeight: 700,
                color: "#ff7a2f",
                display: "flex",
              }}
            >
              {tag}
            </div>
          ))}
        </div>

        {/* Brand */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              fontSize: "28px",
              fontWeight: 800,
              color: "rgba(255,255,255,0.6)",
              display: "flex",
            }}
          >
            WeerZone
          </div>
          <div
            style={{
              fontSize: "16px",
              fontWeight: 500,
              color: "rgba(255,255,255,0.35)",
              display: "flex",
            }}
          >
            weerzone.nl
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
