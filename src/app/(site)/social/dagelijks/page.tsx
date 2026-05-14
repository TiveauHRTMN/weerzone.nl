export const dynamic = "force-dynamic";

export default function DagelijksPreview() {
  const bust = Date.now();
  const src = `/api/social/dagelijks?t=${bust}`;

  return (
    <main style={{ minHeight: "100vh", background: "#0c1628", display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 24px 80px", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 680, marginBottom: 32 }}>
        <h1 style={{ color: "#fff", fontSize: 28, fontWeight: 800, margin: "0 0 8px" }}>
          Weerzone <span style={{ color: "#ffd21a" }}>Dagelijks</span>
        </h1>
        <p style={{ color: "rgba(255,255,255,.5)", margin: 0, fontSize: 14 }}>
          Live gegenereerd · 1080×1350 · Instagram portrait
        </p>
      </div>

      <div style={{ width: "100%", maxWidth: 540, borderRadius: 20, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,.6)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="Weerzone Dagelijks kaart" style={{ width: "100%", display: "block" }} />
      </div>

      <div style={{ marginTop: 28, display: "flex", gap: 16 }}>
        <a
          href={src}
          download="weerzone-dagelijks.png"
          style={{
            background: "#3b7ff0", color: "#fff", padding: "12px 28px",
            borderRadius: 10, fontWeight: 700, fontSize: 15, textDecoration: "none",
          }}
        >
          Download PNG
        </a>
        <a
          href="/social/dagelijks"
          style={{
            background: "rgba(255,255,255,.08)", color: "rgba(255,255,255,.7)",
            padding: "12px 28px", borderRadius: 10, fontWeight: 700, fontSize: 15,
            textDecoration: "none",
          }}
        >
          Ververs
        </a>
      </div>
    </main>
  );
}
