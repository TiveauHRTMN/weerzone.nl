import { ImageResponse } from "next/og";
import { findPlace } from "@/lib/places-data";
import { readFileSync } from "fs";
import path from "path";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const runtime = "nodejs";
export const alt = "WEERZONE — hyperlokale weersvoorspelling 48 uur vooruit";

export default async function OgImage({ params }: { params: Promise<{ province: string; place: string }> }) {
  const { province, place: slug } = await params;
  const place = findPlace(province, slug);
  const cityName = place ? place.name : slug.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());

  const logoPath = path.join(process.cwd(), "public", "logo-full.png");
  let logoSrc = "";
  try {
    const logoBuffer = readFileSync(logoPath);
    logoSrc = `data:image/png;base64,${logoBuffer.toString("base64")}`;
  } catch (e) {
    console.error("Could not load logo for OpenGraph", e);
  }

  const CloudSvg = ({ size, opacity }: { size: number, opacity: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ color: `rgba(255,255,255,${opacity})` }}>
      <path d="M17.5 19c2.485 0 4.5-2.015 4.5-4.5 0-2.31-1.748-4.225-4-4.475V10c0-3.314-2.686-6-6-6-2.94 0-5.385 2.115-5.91 4.905C3.398 9.38 1.5 11.662 1.5 14.5 1.5 16.985 3.515 19 6 19h11.5z" />
    </svg>
  );

  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)", 
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
        {/* SVG Cloud 1 (top left) */}
        <div style={{ position: "absolute", top: "-150px", left: "-100px", display: "flex" }}>
          <CloudSvg size={800} opacity={0.25} />
        </div>
        
        {/* SVG Cloud 2 (middle right) */}
        <div style={{ position: "absolute", top: "-50px", right: "-200px", display: "flex" }}>
          <CloudSvg size={1000} opacity={0.2} />
        </div>
        
        {/* SVG Cloud 3 (bottom left) */}
        <div style={{ position: "absolute", bottom: "-250px", left: "-50px", display: "flex" }}>
          <CloudSvg size={900} opacity={0.25} />
        </div>

        {/* WEERZONE Brand Badge (Image) */}
        {logoSrc ? (
          <img src={logoSrc} alt="WEERZONE" width={320} style={{ marginBottom: "16px", zIndex: 10 }} />
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
              zIndex: 10,
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
            color: "#ffffff", 
            letterSpacing: "-4px",
            lineHeight: 1.1,
            marginBottom: "16px",
            textAlign: "center",
            display: "flex",
            zIndex: 10,
            textShadow: "0 10px 30px rgba(0,0,0,0.15)",
          }}
        >
          {cityName}
        </div>

        {/* Information Gap Copy */}
        <div
          style={{
            fontSize: "42px",
            fontWeight: 600,
            color: "rgba(255, 255, 255, 0.9)", 
            letterSpacing: "1px",
            textAlign: "center",
            marginBottom: "60px",
            display: "flex",
            zIndex: 10,
            textShadow: "0 4px 15px rgba(0,0,0,0.1)",
          }}
        >
          Bekijk of jij vanmiddag droog blijft.
        </div>

        {/* Click-forcing CTA Button (Sun Yellow) */}
        <div
          style={{
            background: "#ffd60a", 
            color: "#0f172a", 
            padding: "24px 64px",
            borderRadius: "32px",
            fontSize: "36px",
            fontWeight: 900,
            letterSpacing: "1px",
            display: "flex",
            alignItems: "center",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
            zIndex: 10,
          }}
        >
          Live Radar Bekijken &rarr;
        </div>
      </div>
    ),
    { ...size }
  );
}