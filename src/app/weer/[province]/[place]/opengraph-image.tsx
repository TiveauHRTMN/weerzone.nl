import { ImageResponse } from "next/og";
import { findPlace } from "@/lib/places-data";
import { readFileSync } from "fs";
import path from "path";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const runtime = "nodejs";

export default async function OgImage({ params }: { params: Promise<{ province: string; place: string }> }) {
  const { province, place: slug } = await params;
  const place = findPlace(province, slug);
  const cityName = place ? place.name : slug.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());

  // Load the provided WEERZONE logo
  const logoPath = path.join(process.cwd(), "public", "logo-full.png");
  let logoSrc = "";
  try {
    const logoBuffer = readFileSync(logoPath);
    logoSrc = `data:image/png;base64,${logoBuffer.toString("base64")}`;
  } catch (e) {
    console.error("Could not load logo for OpenGraph", e);
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)", // Sky blue gradient
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          padding: "60px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle cloud 1 (top left) */}
        <div style={{ position: "absolute", top: "-100px", left: "-50px", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%)" }} />
        {/* Subtle cloud 2 (middle right) */}
        <div style={{ position: "absolute", top: "20%", right: "-100px", width: "500px", height: "300px", background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)" }} />
        {/* Subtle cloud 3 (bottom left) */}
        <div style={{ position: "absolute", bottom: "-150px", left: "20%", width: "600px", height: "350px", background: "radial-gradient(circle, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 70%)" }} />

        {/* WEERZONE Brand Badge (Image) */}
        {logoSrc ? (
          <img src={logoSrc} alt="WEERZONE" width={320} style={{ marginBottom: "16px" }} />
        ) : (
          <div
            style={{
              background: "#ffd60a",
              color: "black",
              padding: "12px 28px",
              borderRadius: "99px",
              fontSize: "18px",
              fontWeight: 900,
              letterSpacing: "4px",
              marginBottom: "40px",
              display: "flex",
            }}
          >
            WEERZONE
          </div>
        )}

        {/* Dynamic City Name */}
        <div
          style={{
            fontSize: "120px",
            fontWeight: 900,
            color: "#ffffff", // White text for the sky blue background
            letterSpacing: "-4px",
            lineHeight: 1.1,
            marginBottom: "16px",
            textAlign: "center",
            display: "flex",
          }}
        >
          {cityName}
        </div>

        {/* Information Gap Copy */}
        <div
          style={{
            fontSize: "42px",
            fontWeight: 600,
            color: "rgba(255, 255, 255, 0.9)", // Dimmed white text
            letterSpacing: "1px",
            textAlign: "center",
            marginBottom: "60px",
            display: "flex",
          }}
        >
          Bekijk of jij vanmiddag droog blijft.
        </div>

        {/* Click-forcing CTA Button (Sun Yellow) */}
        <div
          style={{
            background: "#ffd60a", // Zon-geel CTA
            color: "#0f172a", // Dark slate text for maximum contrast
            padding: "24px 64px",
            borderRadius: "32px",
            fontSize: "36px",
            fontWeight: 900,
            letterSpacing: "1px",
            display: "flex",
            alignItems: "center",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
          }}
        >
          Live Radar Bekijken &rarr;
        </div>
      </div>
    ),
    { ...size }
  );
}